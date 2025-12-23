
import React, { useState, useEffect } from 'react';
import { InventoryItem, BorrowRecord, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Tenda Besar (Terpal)', totalQty: 2, availableQty: 2, condition: 'Baik', imageUrl: 'https://picsum.photos/seed/tent/400/300', description: 'Tenda ukuran 4x6 meter untuk acara warga.' },
  { id: '2', name: 'Kursi Plastik Biru', totalQty: 50, availableQty: 40, condition: 'Baik', imageUrl: 'https://picsum.photos/seed/chair/400/300', description: 'Kursi lipat/plastik untuk rapat.' },
  { id: '3', name: 'Sound System Portable', totalQty: 1, availableQty: 1, condition: 'Baik', imageUrl: 'https://picsum.photos/seed/sound/400/300', description: 'Speaker aktif dengan 2 mic wireless.' },
];

const InventoryPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [items, setItems] = useState<InventoryItem[]>(() => storage.get(STORAGE_KEYS.INVENTORY, MOCK_INVENTORY));
  const [borrows, setBorrows] = useState<BorrowRecord[]>(() => storage.get(STORAGE_KEYS.BORROWING, []));
  const [activeTab, setActiveTab] = useState<'katalog' | 'pinjaman'>('katalog');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState<InventoryItem | null>(null);
  
  const [itemForm, setItemForm] = useState<Partial<InventoryItem>>({ condition: 'Baik', totalQty: 1 });
  const [borrowForm, setBorrowForm] = useState<Partial<BorrowRecord>>({ quantity: 1 });

  useEffect(() => { storage.set(STORAGE_KEYS.INVENTORY, items); }, [items]);
  useEffect(() => { storage.set(STORAGE_KEYS.BORROWING, borrows); }, [borrows]);

  const handleAddItem = () => {
    if (!itemForm.name) return;
    const newItem: InventoryItem = {
      id: Date.now().toString(),
      name: itemForm.name,
      totalQty: Number(itemForm.totalQty),
      availableQty: Number(itemForm.totalQty),
      condition: itemForm.condition as any,
      imageUrl: itemForm.imageUrl || `https://picsum.photos/seed/${Date.now()}/400/300`,
      description: itemForm.description || ''
    };
    setItems([...items, newItem]);
    setShowAddModal(false);
    setItemForm({ condition: 'Baik', totalQty: 1 });
  };

  const handleBorrow = () => {
    if (!showBorrowModal || !borrowForm.residentName || !borrowForm.quantity) return;
    
    if (borrowForm.quantity > showBorrowModal.availableQty) {
      alert("Stok tidak mencukupi!");
      return;
    }

    const newBorrow: BorrowRecord = {
      id: Date.now().toString(),
      itemId: showBorrowModal.id,
      itemName: showBorrowModal.name,
      residentName: borrowForm.residentName,
      phone: borrowForm.phone || '',
      borrowDate: new Date().toISOString(),
      returnDate: null,
      status: 'Pending',
      quantity: Number(borrowForm.quantity)
    };

    setBorrows([newBorrow, ...borrows]);
    setShowBorrowModal(null);
    setBorrowForm({ quantity: 1 });
  };

  const updateBorrowStatus = (id: string, newStatus: BorrowRecord['status']) => {
    setBorrows(borrows.map(b => {
      if (b.id !== id) return b;
      if (newStatus === 'Borrowed' && b.status === 'Pending') {
        setItems(items.map(i => i.id === b.itemId ? { ...i, availableQty: i.availableQty - b.quantity } : i));
      } else if (newStatus === 'Returned' && b.status === 'Borrowed') {
        setItems(items.map(i => i.id === b.itemId ? { ...i, availableQty: i.availableQty + b.quantity } : i));
      }
      return { ...b, status: newStatus, returnDate: newStatus === 'Returned' ? new Date().toISOString() : b.returnDate };
    }));
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-teal-700 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Inventaris RT</h2>
            <p className="text-sm opacity-70 font-medium mt-2">Peminjaman aset lingkungan secara transparan.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('katalog')}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'katalog' ? 'bg-white text-teal-700 shadow-lg' : 'bg-white/10 text-white'}`}
            >
              List Barang
            </button>
            <button 
              onClick={() => setActiveTab('pinjaman')}
              className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pinjaman' ? 'bg-white text-teal-700 shadow-lg' : 'bg-white/10 text-white'}`}
            >
              Peminjaman
            </button>
          </div>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {activeTab === 'katalog' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Katalog Barang</h3>
            {role === 'ADMIN' && (
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-teal-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md"
              >
                + Tambah Barang
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-white border border-slate-100 rounded-[32px] overflow-hidden flex shadow-sm group">
                <div className="w-32 h-32 shrink-0 overflow-hidden">
                  <img src={item.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt="" />
                </div>
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-black text-slate-800 text-base">{item.name}</h4>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${item.condition === 'Baik' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                        {item.condition}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1 mt-1">{item.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Tersedia / Total</p>
                      <p className="text-sm font-black text-slate-800">{item.availableQty} / {item.totalQty}</p>
                    </div>
                    <button 
                      onClick={() => setShowBorrowModal(item)}
                      disabled={item.availableQty <= 0}
                      className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${item.availableQty > 0 ? 'bg-teal-600 text-white shadow-md active:scale-95' : 'bg-slate-100 text-slate-300 border border-slate-200'}`}
                    >
                      {item.availableQty > 0 ? 'Pinjam' : 'Kosong'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="px-2 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Riwayat Pinjam</h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">{borrows.length} Data</span>
          </div>

          <div className="space-y-3">
            {borrows.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Belum ada riwayat peminjaman</p>
              </div>
            ) : (
              borrows.map(b => (
                <div key={b.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${b.status === 'Returned' ? 'bg-slate-100 text-slate-400' : 'bg-teal-50 text-teal-600'}`}>
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       </div>
                       <div>
                          <h4 className="font-black text-slate-800">{b.itemName} ({b.quantity})</h4>
                          <p className="text-xs font-bold text-slate-400">Peminjam: <span className="text-slate-700 font-black">{b.residentName}</span></p>
                       </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                      b.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                      b.status === 'Borrowed' ? 'bg-blue-100 text-blue-600' : 
                      b.status === 'Returned' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                    }`}>
                      {b.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                    <div className="space-y-0.5">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Tgl Pinjam</p>
                      <p className="text-xs font-bold text-slate-800">{new Date(b.borrowDate).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                    </div>
                    {role === 'ADMIN' && (
                      <div className="flex gap-2">
                        {b.status === 'Pending' && (
                          <>
                            <button onClick={() => updateBorrowStatus(b.id, 'Borrowed')} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Terima</button>
                            <button onClick={() => updateBorrowStatus(b.id, 'Rejected')} className="bg-rose-100 text-rose-600 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Tolak</button>
                          </>
                        )}
                        {b.status === 'Borrowed' && (
                          <button onClick={() => updateBorrowStatus(b.id, 'Returned')} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase">Kembali</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Tambah Barang</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Barang</label>
                <input type="text" placeholder="Contoh: Tenda RT" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold placeholder-slate-600" value={itemForm.name} onChange={e => setItemForm({...itemForm, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Total Stok</label>
                <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold placeholder-slate-600" value={itemForm.totalQty} onChange={e => setItemForm({...itemForm, totalQty: Number(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Kondisi Barang</label>
                <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black appearance-none" value={itemForm.condition} onChange={e => setItemForm({...itemForm, condition: e.target.value as any})}>
                  <option value="Baik">Kondisi Baik ✅</option>
                  <option value="Rusak Ringan">Rusak Ringan ⚠️</option>
                  <option value="Rusak Berat">Rusak Berat ❌</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleAddItem} className="flex-2 bg-teal-600 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl shadow-teal-500/30 transition-all active:scale-95">Simpan Data</button>
            </div>
          </div>
        </div>
      )}

      {showBorrowModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-tight">Pinjam {showBorrowModal.name}</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Peminjam</label>
                <input type="text" placeholder="Nama Lengkap Sesuai KK" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black placeholder-slate-600" value={borrowForm.residentName} onChange={e => setBorrowForm({...borrowForm, residentName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">No. WhatsApp</label>
                <input type="tel" placeholder="08XXXXXXXXXX" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black placeholder-slate-600" value={borrowForm.phone} onChange={e => setBorrowForm({...borrowForm, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jumlah Unit (Maks: {showBorrowModal.availableQty})</label>
                <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black" value={borrowForm.quantity} max={showBorrowModal.availableQty} onChange={e => setBorrowForm({...borrowForm, quantity: Number(e.target.value)})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowBorrowModal(null)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleBorrow} className="flex-2 bg-slate-900 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl shadow-slate-900/40 transition-all active:scale-95">Ajukan Pinjam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
