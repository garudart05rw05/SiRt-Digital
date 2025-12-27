
import React, { useState, useEffect, useMemo } from 'react';
import { Complaint, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { notificationService } from '../services/notificationService.ts';
import ComplaintEditor from '../components/ComplaintEditor.tsx';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface ToastState {
  show: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
}

const ComplaintPage: React.FC<{ role?: UserRole }> = ({ role = 'WARGA' }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => 
    storage.get(STORAGE_KEYS.COMPLAINTS, [])
  );
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {}));
  const [isAdding, setIsAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'Semua' | 'Pending' | 'Diproses' | 'Selesai'>('Semua');
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });
  const [viewingPhoto, setViewingPhoto] = useState<string | null>(null);

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
    if (type !== 'loading') {
      setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.COMPLAINTS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setComplaints(cloudData);
        storage.updateLocal(STORAGE_KEYS.COMPLAINTS, cloudData);
      }
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data().data);
    });
    return () => { unsub(); unsubSettings(); };
  }, []);

  const stats = useMemo(() => {
    return {
      total: complaints.length,
      pending: complaints.filter(c => c.status === 'Pending').length,
      proses: complaints.filter(c => c.status === 'Diproses').length,
      selesai: complaints.filter(c => c.status === 'Selesai').length,
    };
  }, [complaints]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesSearch = (c.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (c.residentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (c.id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'Semua' || c.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [complaints, searchTerm, filterStatus]);

  const handleSave = async (data: Partial<Complaint>) => {
    showToast("Mengirim laporan...", "loading");
    const newEntry: Complaint = { 
      id: `ADU-${Date.now().toString().slice(-4)}`, 
      residentName: data.residentName || 'Warga', 
      email: data.email || '', 
      phone: data.phone || '', 
      category: data.category || 'Lainnya', 
      subject: data.subject || 'Aduan Baru', 
      description: data.description || '', 
      status: 'Pending', 
      timestamp: new Date().toISOString(),
      imageUrl: data.imageUrl
    };
    
    const updated = [newEntry, ...complaints];
    const saved = await storage.set(STORAGE_KEYS.COMPLAINTS, updated);
    
    if (saved) {
      await notificationService.sendEmail(settings, newEntry);
      showToast("Laporan terkirim! Cek email Anda.", "success");
      setIsAdding(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Complaint['status']) => {
    const comp = complaints.find(c => c.id === id);
    if (!comp) return;
    setProcessingId(id);
    showToast(`Memperbarui status...`, "loading");
    const updatedComp = { ...comp, status: newStatus };
    const updatedList = complaints.map(c => c.id === id ? updatedComp : c);
    const saved = await storage.set(STORAGE_KEYS.COMPLAINTS, updatedList);
    if (saved) {
      await notificationService.sendEmail(settings, updatedComp);
      showToast("Status & Notifikasi email diperbarui.", "success");
    }
    setProcessingId(null);
  };

  const handleDelete = async (id: string, subject: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm(`Hapus data aduan: "${subject}"? Data akan dihapus permanen dari Cloud.`)) {
      const updated = complaints.filter(c => c.id !== id);
      const saved = await storage.set(STORAGE_KEYS.COMPLAINTS, updated);
      if (saved) {
        showToast("Aduan berhasil dihapus", "success");
      }
    }
  };

  if (isAdding) return <div className="px-5 py-6"><ComplaintEditor onSave={handleSave} onCancel={() => setIsAdding(false)} /></div>;

  return (
    <div className="space-y-8 px-5 py-6 pb-32 animate-page-enter">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm">
          <div className={`p-5 rounded-[28px] shadow-2xl backdrop-blur-xl flex items-center gap-4 border-2 ${
            toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/30' : 
            toast.type === 'loading' ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-rose-600/90 border-rose-400/30'
          } text-white`}>
             {toast.type === 'loading' && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>}
             <p className="text-[11px] font-black uppercase tracking-widest">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal: Hanya bisa ditutup lewat tombol X */}
      {viewingPhoto && (
        <div 
          className="fixed inset-0 z-[500] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-page-enter"
        >
          <div className="relative max-w-4xl w-full flex flex-col items-center gap-6">
            <button 
              onClick={() => setViewingPhoto(null)}
              className="absolute -top-16 right-0 w-12 h-12 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/>
              </svg>
            </button>
            <img src={viewingPhoto} className="max-w-full max-h-[80vh] object-contain rounded-[40px] shadow-2xl border-4 border-white/5" alt="Detail Bukti" />
            <div className="bg-white/10 px-6 py-3 rounded-full border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] text-white">Pratinjau Bukti Foto</div>
          </div>
        </div>
      )}

      {/* Header & Stats Dashboard */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-rose-500 rounded-[22px] flex items-center justify-center text-white shadow-lg">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">E-Aduan</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">Pusat Resolusi Masalah Lingkungan</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)} 
            className="bg-slate-900 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
          >
            Buat Aduan Baru
          </button>
        </div>

        {role === 'ADMIN' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pending</p>
              <p className="text-2xl font-black text-rose-500 mt-1">{stats.pending}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Proses</p>
              <p className="text-2xl font-black text-blue-500 mt-1">{stats.proses}</p>
            </div>
            <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm text-center">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Selesai</p>
              <p className="text-2xl font-black text-emerald-500 mt-1">{stats.selesai}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm space-y-4">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari subjek, nama pelapor, atau ID..." 
            className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-rose-500 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
           {['Semua', 'Pending', 'Diproses', 'Selesai'].map(s => (
             <button 
               key={s} 
               onClick={() => setFilterStatus(s as any)}
               className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filterStatus === s ? 'bg-rose-600 text-white border-rose-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
             >
               {s}
             </button>
           ))}
        </div>
      </div>

      {/* Riwayat Aduan List */}
      <div className="space-y-6">
        {filteredComplaints.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[44px] border border-dashed border-slate-200 text-slate-300 font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-4">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeWidth={2} /></svg>
            Belum ada aduan yang sesuai kriteria
          </div>
        ) : (
          filteredComplaints.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-[44px] border border-slate-50 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <div className="flex items-center gap-3">
                         <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm ${
                           complaint.status === 'Pending' ? 'bg-rose-50 text-rose-600' : 
                           complaint.status === 'Diproses' ? 'bg-blue-50 text-blue-600' : 
                           'bg-emerald-50 text-emerald-600'
                         }`}>
                           {complaint.status}
                         </span>
                         <span className="text-[10px] font-bold text-slate-300 font-mono tracking-tighter">#{complaint.id}</span>
                         <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">• {complaint.category}</span>
                      </div>
                      <h3 className="text-2xl font-black text-slate-800 uppercase leading-tight mt-2 group-hover:text-rose-600 transition-colors">{complaint.subject}</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{new Date(complaint.timestamp).toLocaleDateString('id-ID', { dateStyle: 'full' })} • {new Date(complaint.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                   </div>
                   {role === 'ADMIN' && (
                     <button onClick={() => handleDelete(complaint.id, complaint.subject)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                     </button>
                   )}
                </div>

                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 relative">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap italic">"{complaint.description}"</p>
                  <div className="absolute top-[-10px] left-6 bg-white px-3 py-1 rounded-full border border-slate-100 text-[8px] font-black text-slate-400 uppercase">Isi Aduan</div>
                </div>

                {/* Bukti Foto Aduan */}
                {complaint.imageUrl && (
                  <div className="space-y-3">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">Lampiran Bukti Foto:</p>
                    <div 
                      onClick={() => setViewingPhoto(complaint.imageUrl!)}
                      className="rounded-[32px] overflow-hidden border border-slate-100 aspect-video max-h-[300px] cursor-zoom-in group/img relative"
                    >
                      <img src={complaint.imageUrl} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-700" alt="Bukti Foto" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-900 shadow-2xl">Perbesar Foto</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detail Pelapor (Hanya Admin) */}
                {role === 'ADMIN' && (
                  <div className="bg-indigo-50/50 p-6 rounded-[32px] border border-indigo-100 space-y-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-md">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2}/></svg>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Informasi Pelapor</p>
                          <h4 className="text-sm font-black text-slate-800 uppercase">{complaint.residentName}</h4>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <button onClick={() => window.location.href=`mailto:${complaint.email}`} className="bg-white border border-indigo-100 p-3 rounded-2xl flex items-center gap-3 hover:bg-indigo-600 hover:text-white transition-all group/btn shadow-sm">
                          <svg className="w-5 h-5 text-indigo-600 group-hover/btn:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" strokeWidth={2}/></svg>
                          <span className="text-[10px] font-black truncate">{complaint.email}</span>
                       </button>
                       <button onClick={() => window.open(`https://wa.me/${(complaint.phone || '').replace(/[^0-9]/g, '')}`)} className="bg-white border border-indigo-100 p-3 rounded-2xl flex items-center gap-3 hover:bg-emerald-600 hover:text-white transition-all group/btn shadow-sm">
                          <svg className="w-5 h-5 text-emerald-600 group-hover/btn:text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          <span className="text-[10px] font-black">{complaint.phone}</span>
                       </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-4 border-t border-slate-50">
                   {role === 'ADMIN' && (
                      <div className="grid grid-cols-2 gap-4">
                         <button 
                            disabled={processingId === complaint.id || complaint.status === 'Diproses'} 
                            onClick={() => handleUpdateStatus(complaint.id, 'Diproses')} 
                            className="bg-blue-600 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 disabled:opacity-30 active:scale-95 transition-all"
                         >
                            Set Diproses
                         </button>
                         <button 
                            disabled={processingId === complaint.id || complaint.status === 'Selesai'} 
                            onClick={() => handleUpdateStatus(complaint.id, 'Selesai')} 
                            className="bg-emerald-600 text-white py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 disabled:opacity-30 active:scale-95 transition-all"
                         >
                            Set Selesai
                         </button>
                      </div>
                   )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="bg-slate-900 p-10 rounded-[56px] text-center border border-white/5 space-y-4">
         <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] leading-relaxed">
           Seluruh aduan yang masuk telah terenkripsi & tersinkronisasi ke Sistem dan Ketua RT secara otomatis.
         </p>
      </div>
    </div>
  );
};

export default ComplaintPage;
