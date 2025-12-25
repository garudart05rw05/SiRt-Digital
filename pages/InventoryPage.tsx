
import React, { useState, useEffect, useRef } from 'react';
import { InventoryItem, BorrowRecord, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error' | 'loading';
}

const InventoryPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => storage.get(STORAGE_KEYS.INVENTORY, []));
  const [borrows, setBorrows] = useState<BorrowRecord[]>(() => storage.get(STORAGE_KEYS.BORROWING, []));
  const [settings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri'
  }));
  
  const [activeTab, setActiveTab] = useState<'katalog' | 'pinjaman'>('katalog');
  const [showEditor, setShowEditor] = useState(false);
  const [showBorrowForm, setShowBorrowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [selectedItemForBorrow, setSelectedItemForBorrow] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [viewingPhoto, setViewingPhoto] = useState<InventoryItem | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
    if (type !== 'loading') {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  const categories = ['Semua', 'Sarana Umum', 'Alat Kebersihan', 'Elektronik', 'Alat Penunjang', 'Lainnya'];

  const [formData, setFormData] = useState<Partial<InventoryItem>>({
    dateAdded: new Date().toISOString().split('T')[0],
    condition: 'Baik',
    totalQty: 1,
    category: 'Sarana Umum'
  });

  const [borrowFormData, setBorrowFormData] = useState<Partial<BorrowRecord>>({
    residentName: '',
    phone: '',
    quantity: 1,
    borrowDate: new Date().toISOString().split('T')[0]
  });

  // Listener Real-time Cloud Sync
  useEffect(() => {
    const unsubItems = onSnapshot(doc(db, "app_data", STORAGE_KEYS.INVENTORY), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setItems(cloudData);
        storage.updateLocal(STORAGE_KEYS.INVENTORY, cloudData);
      }
    });
    
    const unsubBorrows = onSnapshot(doc(db, "app_data", STORAGE_KEYS.BORROWING), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setBorrows(cloudData);
        storage.updateLocal(STORAGE_KEYS.BORROWING, cloudData);
      }
    });

    return () => { unsubItems(); unsubBorrows(); };
  }, []);

  const handlePrint = () => { window.print(); };

  const handleSaveItem = async () => {
    if (!formData.name) return;
    setIsProcessing(true);
    showNotification("Menyimpan ke Cloud...", "loading");
    
    try {
      let finalImageUrl = formData.imageUrl || 'https://via.placeholder.com/150';
      if (finalImageUrl.startsWith('data:image')) {
        finalImageUrl = await compressImage(finalImageUrl, 800, 0.6);
      }
      
      let updatedItems: InventoryItem[];
      const newTotal = Number(formData.totalQty || 1);

      if (editingItem) {
        const itemsBeingBorrowed = editingItem.totalQty - editingItem.availableQty;
        const newAvailable = Math.max(0, newTotal - itemsBeingBorrowed);
        
        updatedItems = items.map(i => i.id === editingItem.id ? { 
          ...i, 
          ...formData as InventoryItem, 
          totalQty: newTotal,
          availableQty: newAvailable,
          imageUrl: finalImageUrl 
        } : i);
      } else {
        const newItem: InventoryItem = {
          id: `INV-${Date.now()}`,
          dateAdded: formData.dateAdded || new Date().toISOString().split('T')[0],
          name: formData.name || '',
          category: formData.category || 'Lainnya',
          location: formData.location || 'Gudang',
          brand: formData.brand || '-',
          condition: formData.condition as any || 'Baik',
          totalQty: newTotal,
          availableQty: newTotal,
          imageUrl: finalImageUrl,
          description: formData.description || ''
        };
        updatedItems = [newItem, ...items];
      }

      await storage.set(STORAGE_KEYS.INVENTORY, updatedItems);
      showNotification("Data katalog berhasil diperbarui.");
      setShowEditor(false);
    } catch (error) {
      showNotification("Gagal sinkronisasi data.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBorrowSubmit = async () => {
    const itemToUse = selectedItemForBorrow;
    if (!itemToUse || !borrowFormData.residentName || !borrowFormData.quantity) {
      showNotification("Lengkapi data form!", "error");
      return;
    }
    
    const qtyToBorrow = Number(borrowFormData.quantity);
    if (qtyToBorrow > itemToUse.availableQty) {
      showNotification(`Stok hanya sisa ${itemToUse.availableQty}`, "error");
      return;
    }

    setIsProcessing(true);
    showNotification("Mengirim permintaan...", "loading");
    
    try {
      const isAutoApproved = role === 'ADMIN';
      const newBorrow: BorrowRecord = {
        id: `BRW-${Date.now().toString().slice(-4)}`,
        itemId: itemToUse.id,
        itemName: itemToUse.name,
        residentName: borrowFormData.residentName!,
        phone: borrowFormData.phone || '-',
        borrowDate: borrowFormData.borrowDate!,
        returnDate: null,
        status: isAutoApproved ? 'Borrowed' : 'Pending',
        quantity: qtyToBorrow
      };
      
      const updatedBorrows = [newBorrow, ...borrows];
      
      if (isAutoApproved) {
        const updatedItems = items.map(i => 
          i.id === itemToUse.id ? { ...i, availableQty: i.availableQty - qtyToBorrow } : i
        );
        await storage.set(STORAGE_KEYS.INVENTORY, updatedItems);
      }

      await storage.set(STORAGE_KEYS.BORROWING, updatedBorrows);
      setShowBorrowForm(false);
      setSelectedItemForBorrow(null);
      showNotification(isAutoApproved ? "Peminjaman dicatat & stok berkurang." : "Permohonan dikirim ke Admin RT.");
    } catch (error) {
      showNotification("Gagal memproses pinjaman.", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  // ADMIN: Setujui Peminjaman (Stok Berkurang Saat Ini)
  const handleApproveBorrow = async (record: BorrowRecord) => {
    const item = items.find(i => i.id === record.itemId);
    if (!item) return;
    if (item.availableQty < record.quantity) {
      showNotification("Gagal: Stok fisik sudah habis.", "error");
      return;
    }

    setIsProcessing(true);
    setActiveActionId(record.id);
    showNotification("Menyetujui & Update Stok...", "loading");

    try {
      const updatedBorrows = borrows.map(b => b.id === record.id ? { ...b, status: 'Borrowed' as const } : b);
      const updatedItems = items.map(i => i.id === record.itemId ? { ...i, availableQty: i.availableQty - record.quantity } : i);

      // Sinkronisasi Cloud
      await storage.set(STORAGE_KEYS.BORROWING, updatedBorrows);
      await storage.set(STORAGE_KEYS.INVENTORY, updatedItems);
      
      showNotification("Berhasil! Warga bisa mengambil barang.");
    } catch (e) {
      showNotification("Gagal memproses.", "error");
    } finally {
      setIsProcessing(false);
      setActiveActionId(null);
    }
  };

  // WARGA: Request Pengembalian (Admin akan melihat status Returning)
  const handleRequestReturn = async (record: BorrowRecord) => {
    if (!window.confirm("Tandai sudah dikembalikan? Admin akan verifikasi fisik barang.")) return;
    
    setIsProcessing(true);
    setActiveActionId(record.id);
    showNotification("Mengirim laporan kembali...", "loading");

    try {
      const updatedBorrows = borrows.map(b => b.id === record.id ? { ...b, status: 'Returning' as const } : b);
      await storage.set(STORAGE_KEYS.BORROWING, updatedBorrows);
      showNotification("Laporan terkirim! Harap bawa fisik barang ke gudang.", "success");
    } catch (e) {
      showNotification("Gagal mengirim laporan.", "error");
    } finally {
      setIsProcessing(false);
      setActiveActionId(null);
    }
  };

  // ADMIN: Selesaikan & Pulihkan Stok (Stok Bertambah Kembali)
  const handleReturnItemFinal = async (record: BorrowRecord) => {
    if (!window.confirm(`Konfirmasi terima fisik ${record.quantity} unit ${record.itemName}? Stok akan dipulihkan.`)) return;
    
    setActiveActionId(record.id);
    setIsProcessing(true);
    showNotification("Memulihkan stok gudang...", "loading");
    
    try {
      const updatedBorrows = borrows.map(b => 
        b.id === record.id ? { 
          ...b, 
          status: 'Returned' as const, 
          returnDate: new Date().toISOString().split('T')[0] 
        } : b
      );

      const updatedItems = items.map(i => 
        i.id === record.itemId 
        ? { ...i, availableQty: Math.min(i.totalQty, i.availableQty + record.quantity) } 
        : i
      );

      // Push Perubahan ke Cloud
      await storage.set(STORAGE_KEYS.BORROWING, updatedBorrows);
      await storage.set(STORAGE_KEYS.INVENTORY, updatedItems);
      
      showNotification(`Selesai! ${record.itemName} kembali ke gudang.`, "success");
    } catch (error) {
      showNotification("Gagal memproses pengembalian.", "error");
    } finally {
      setIsProcessing(false);
      setActiveActionId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const filteredItems = items.filter(i => {
    const search = (searchTerm || '').toLowerCase();
    const matchesSearch = i.name.toLowerCase().includes(search) || i.brand.toLowerCase().includes(search);
    const matchesCategory = activeCategory === 'Semua' || i.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredBorrows = borrows.filter(b => {
    const search = (searchTerm || '').toLowerCase();
    return b.residentName.toLowerCase().includes(search) || b.itemName.toLowerCase().includes(search);
  });

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      {/* Toast Notification Layer */}
      {toast.show && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm animate-page-enter">
           <div className={`p-5 rounded-[28px] shadow-2xl backdrop-blur-2xl flex items-center gap-4 border-2 ${
             toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/30' : 
             toast.type === 'error' ? 'bg-rose-600/90 border-rose-400/30' : 
             toast.type === 'loading' ? 'bg-slate-900/90 border-indigo-500/30' :
             'bg-indigo-600/90 border-indigo-400/30'
           } text-white`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                 {toast.type === 'loading' ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                 ) : (
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 )}
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{toast.message}</p>
           </div>
        </div>
      )}

      <div className="bg-teal-700 rounded-[44px] p-10 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-white/20 rounded-[22px] flex items-center justify-center backdrop-blur-md shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
              </div>
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Inventaris</h2>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-[0.3em] mt-2">Sinkronisasi Cloud Aktif</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePrint} className="bg-white/20 text-white p-5 rounded-3xl backdrop-blur-md border border-white/20 active:scale-95 transition-all">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              </button>
              {role === 'ADMIN' && (
                <button 
                  onClick={() => { setEditingItem(null); setFormData({ dateAdded: new Date().toISOString().split('T')[0], condition: 'Baik', totalQty: 1, category: 'Sarana Umum' }); setShowEditor(true); }} 
                  className="bg-white text-teal-700 p-5 rounded-3xl shadow-2xl active:scale-95 transition-all"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 bg-black/10 p-1.5 rounded-3xl backdrop-blur-sm border border-white/10">
            <button onClick={() => setActiveTab('katalog')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'katalog' ? 'bg-white text-teal-700 shadow-xl' : 'text-white/60'}`}>Katalog Aset</button>
            <button onClick={() => setActiveTab('pinjaman')} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pinjaman' ? 'bg-white text-teal-700 shadow-xl' : 'text-white/60'}`}>Log Pinjaman</button>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[40px] border border-slate-50 shadow-sm space-y-6 no-print">
        <div className="relative">
          <input 
            type="text" 
            className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-12 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-teal-500 transition-all" 
            placeholder={activeTab === 'katalog' ? "Cari barang..." : "Cari peminjam..."}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-5 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
        </div>
        
        {activeTab === 'katalog' && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
             {categories.map(cat => (
               <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${activeCategory === cat ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>{cat}</button>
             ))}
          </div>
        )}
      </div>

      {activeTab === 'katalog' && (
        <div className="grid grid-cols-1 gap-4">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-white rounded-[40px] p-6 border border-slate-50 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
              <div onClick={() => setViewingPhoto(item)} className="w-24 h-24 rounded-3xl overflow-hidden shrink-0 border border-slate-100 cursor-zoom-in shadow-md">
                 <img src={item.imageUrl} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${item.condition === 'Baik' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{item.condition}</span>
                      </div>
                      <h4 className="text-lg font-black text-slate-800 uppercase mt-1 truncate">{item.name}</h4>
                    </div>
                    {role === 'ADMIN' && (
                      <button onClick={() => { setEditingItem(item); setFormData(item); setShowEditor(true); }} className="p-2.5 text-indigo-500 hover:bg-indigo-50 rounded-xl transition-colors"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                    )}
                 </div>
                 <div className="mt-4 flex items-center justify-between">
                    <div>
                       <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Tersedia</p>
                       <p className="text-xl font-black text-emerald-600">{item.availableQty} <span className="text-[10px] font-bold text-slate-300">/ {item.totalQty}</span></p>
                    </div>
                    <button 
                      onClick={() => { setSelectedItemForBorrow(item); setShowBorrowForm(true); }}
                      disabled={item.availableQty === 0 || item.condition === 'Rusak'}
                      className="px-6 py-2.5 bg-teal-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg active:scale-95 transition-all disabled:opacity-30"
                    >
                      {item.condition === 'Rusak' ? 'Rusak' : role === 'ADMIN' ? 'Pinjamkan' : 'Pinjam'}
                    </button>
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'pinjaman' && (
        <div className="space-y-4">
          {filteredBorrows.map(record => (
            <div key={record.id} className="bg-white rounded-[40px] p-8 border border-slate-50 shadow-sm space-y-6">
               <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2}/></svg>
                     </div>
                     <div>
                        <div className="flex items-center gap-2">
                           <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                             record.status === 'Pending' ? 'bg-amber-50 text-amber-600' : 
                             record.status === 'Borrowed' ? 'bg-blue-50 text-blue-600' : 
                             record.status === 'Returning' ? 'bg-indigo-50 text-indigo-600 animate-pulse' :
                             record.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' : 
                             'bg-rose-50 text-rose-600'
                           }`}>
                             {record.status === 'Pending' ? 'Menunggu Persetujuan' : 
                              record.status === 'Borrowed' ? 'Barang Keluar' : 
                              record.status === 'Returning' ? 'Menunggu Cek Fisik' :
                              record.status === 'Returned' ? 'Sudah Kembali' : 
                              'Ditolak'}
                           </span>
                           <span className="text-[10px] font-bold text-slate-300">#{record.id}</span>
                        </div>
                        <h4 className="text-lg font-black text-slate-800 uppercase mt-1">{record.residentName}</h4>
                     </div>
                  </div>
                  
                  <div className="flex gap-2 w-full md:w-auto">
                    {/* AKSI ADMIN */}
                    {role === 'ADMIN' && (
                      <>
                        {record.status === 'Pending' && (
                          <div className="grid grid-cols-2 gap-2 w-full">
                            <button onClick={() => handleApproveBorrow(record)} disabled={isProcessing && activeActionId === record.id} className="px-5 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 13l4 4L19 7" /></svg>Setujui
                            </button>
                            <button className="px-5 py-3 bg-rose-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl active:scale-95">Tolak</button>
                          </div>
                        )}
                        {(record.status === 'Borrowed' || record.status === 'Returning') && (
                          <button 
                            onClick={() => handleReturnItemFinal(record)} 
                            disabled={isProcessing && activeActionId === record.id}
                            className={`w-full px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all ${record.status === 'Returning' ? 'bg-indigo-600 text-white' : 'bg-slate-900 text-white'}`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" /></svg>
                            {record.status === 'Returning' ? 'Verifikasi & Selesaikan' : 'Selesaikan & Pulihkan Stok'}
                          </button>
                        )}
                      </>
                    )}

                    {/* AKSI WARGA */}
                    {role === 'WARGA' && record.status === 'Borrowed' && (
                      <button 
                        onClick={() => handleRequestReturn(record)} 
                        disabled={isProcessing && activeActionId === record.id}
                        className="w-full px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                      >
                        Kembalikan Barang
                      </button>
                    )}
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4 p-6 bg-slate-50 rounded-[32px] border border-slate-100">
                  <div>
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Barang & Jumlah</p>
                     <p className="text-sm font-black text-slate-800 uppercase mt-1">{record.itemName} ({record.quantity} Unit)</p>
                  </div>
                  <div className="text-right">
                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waktu Pinjam</p>
                     <p className="text-sm font-black text-slate-800 mt-1">{record.borrowDate}</p>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}

      {showEditor && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-2xl rounded-[56px] shadow-2xl overflow-hidden animate-page-enter flex flex-col max-h-[90vh]">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{editingItem ? 'Perbarui Aset' : 'Tambah Aset'}</h3>
               <button onClick={() => setShowEditor(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar pb-32">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tgl Registrasi</label>
                  <input type="date" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" value={formData.dateAdded} onChange={e => setFormData({...formData, dateAdded: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                  <select className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-black appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                     {categories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Barang</label>
                <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-7 py-5 outline-none font-black text-lg" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kondisi</label>
                    <select className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-black appearance-none" value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value as any})}>
                       <option value="Baik">Baik ✅</option>
                       <option value="Rusak">Rusak ❌</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Total Unit</label>
                    <input type="number" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-black text-xl text-center" value={formData.totalQty} onChange={e => setFormData({...formData, totalQty: Number(e.target.value)})} />
                 </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Dokumentasi Aset</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-4 border-dashed border-slate-100 rounded-[44px] bg-slate-50 flex items-center justify-center cursor-pointer overflow-hidden relative shadow-inner">
                   {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" alt="" /> : <p className="text-[10px] font-black uppercase text-slate-300">Pilih Gambar</p>}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 absolute bottom-0 w-full">
               <button onClick={() => setShowEditor(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 tracking-widest">Batal</button>
               <button onClick={handleSaveItem} disabled={isProcessing} className="flex-[2] bg-teal-600 text-white py-5 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl active:scale-95 transition-all">{isProcessing ? 'Sinkronisasi...' : 'Simpan Aset'}</button>
            </div>
          </div>
        </div>
      )}

      {showBorrowForm && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[56px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-teal-50">
                 <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Form Peminjaman</h3>
                    <p className="text-[10px] font-bold text-teal-600 uppercase mt-1">{selectedItemForBorrow?.name || 'Pilih Barang'}</p>
                 </div>
                 <button onClick={() => setShowBorrowForm(false)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Peminjam (Sesuai KTP)</label>
                    <input type="text" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" value={borrowFormData.residentName} onChange={e => setBorrowFormData({...borrowFormData, residentName: e.target.value})} placeholder="Input nama lengkap..." />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jumlah Unit</label>
                       <input 
                        type="number" 
                        className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-black text-center" 
                        min="1" 
                        max={selectedItemForBorrow?.availableQty || 1} 
                        value={borrowFormData.quantity} 
                        onChange={e => setBorrowFormData({...borrowFormData, quantity: Number(e.target.value)})} 
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tgl Pinjam</label>
                       <input type="date" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-bold text-xs" value={borrowFormData.borrowDate} onChange={e => setBorrowFormData({...borrowFormData, borrowDate: e.target.value})} />
                    </div>
                 </div>
                 <button 
                  onClick={handleBorrowSubmit} 
                  disabled={isProcessing} 
                  className="w-full bg-teal-600 text-white py-6 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isProcessing ? 'Proses...' : 'Konfirmasi Pinjaman'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
