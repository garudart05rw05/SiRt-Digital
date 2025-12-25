
import React, { useState, useEffect } from 'react';
import { GuestEntry, UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { notificationService } from '../services/notificationService.ts';
import GuestbookEditor from '../components/GuestbookEditor';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const GuestbookPage: React.FC<{ role?: UserRole }> = ({ role = 'WARGA' }) => {
  const [guests, setGuests] = useState<GuestEntry[]>(() => storage.get(STORAGE_KEYS.GUESTBOOK, []));
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {}));
  const [isAdding, setIsAdding] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedGuest, setSelectedGuest] = useState<GuestEntry | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.GUESTBOOK), (docSnap) => {
      if (docSnap.exists()) setGuests(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data().data);
    });
    return () => { unsub(); unsubSettings(); };
  }, []);

  const handleSave = async (data: Partial<GuestEntry>) => {
    setProcessingId('NEW');
    const newEntry: GuestEntry = {
      id: `T-${Date.now().toString().slice(-6)}`,
      ...data as GuestEntry,
      status: 'Proses', 
      checkIn: new Date().toISOString(),
      checkOut: null
    };
    const updatedList = [newEntry, ...guests];
    const saved = await storage.set(STORAGE_KEYS.GUESTBOOK, updatedList);
    if (saved) {
      await notificationService.sendEmail(settings, newEntry, 'guest');
    }
    setProcessingId(null);
    setIsAdding(false);
  };

  const handleFinalAction = async (id: string, newStatus: 'Diizinkan' | 'Ditolak') => {
    const guest = guests.find(g => g.id === id);
    if (!guest) return;
    setProcessingId(id);
    const updatedGuest: GuestEntry = { ...guest, status: newStatus };
    const updatedList = guests.map(g => g.id === id ? updatedGuest : g);
    const saved = await storage.set(STORAGE_KEYS.GUESTBOOK, updatedList);
    if (saved) {
      await notificationService.sendEmail(settings, updatedGuest, 'guest');
      if (selectedGuest?.id === id) setSelectedGuest(updatedGuest);
    }
    setProcessingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (role !== 'ADMIN') return;
    if (window.confirm(`Hapus data kunjungan: "${name}"? Data akan dihapus permanen dari Cloud.`)) {
      const updatedList = guests.filter(g => g.id !== id);
      const saved = await storage.set(STORAGE_KEYS.GUESTBOOK, updatedList);
      if (saved) {
        if (selectedGuest?.id === id) setSelectedGuest(null);
        alert("Data tamu berhasil dihapus.");
      }
    }
  };

  if (isAdding) return <div className="px-5 py-6"><GuestbookEditor onSave={handleSave} onCancel={() => setIsAdding(false)} /></div>;

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      {processingId && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-md flex items-center justify-center">
           <div className="bg-white px-12 py-10 rounded-[48px] shadow-2xl flex flex-col items-center gap-5 border-2 border-amber-500/20">
              <div className="w-14 h-14 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-800">Sinkronisasi Email...</p>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-amber-500 rounded-[48px] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-white/20 rounded-[24px] flex items-center justify-center backdrop-blur-md shadow-inner"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg></div>
                <div><h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Buku Tamu</h2><p className="text-[10px] opacity-70 font-black mt-2 uppercase tracking-[0.3em]">Arsip Digital & Notifikasi Pro</p></div>
             </div>
          </div>
          <button onClick={() => setIsAdding(true)} className="w-full bg-white text-amber-600 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all">Registrasi Tamu Baru</button>
        </div>
      </div>

      {/* GUEST LIST */}
      <div className="space-y-4">
        {guests.length === 0 ? (
          <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest bg-white rounded-[40px] border border-dashed border-slate-200">Belum ada kunjungan tamu</div>
        ) : (
          guests.map(guest => (
            <div key={guest.id} onClick={() => setSelectedGuest(guest)} className="bg-white rounded-[40px] border border-slate-50 shadow-sm p-7 group hover:shadow-xl transition-all cursor-pointer">
              <div className="flex justify-between items-start mb-4">
                 <div>
                    <div className="flex items-center gap-2 mb-2">
                       <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${guest.status === 'Diizinkan' ? 'bg-emerald-50 text-emerald-600' : guest.status === 'Ditolak' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{guest.status}</span>
                       <span className="text-[9px] font-bold text-slate-300 font-mono">#{guest.id}</span>
                    </div>
                    <h4 className="font-black text-slate-800 text-lg uppercase group-hover:text-amber-600 transition-colors">{guest.name}</h4>
                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Tujuan: {guest.hostName}</p>
                 </div>
                 <div className="flex gap-2">
                    {role === 'ADMIN' && (
                      <button 
                        onClick={(e) => handleDelete(e, guest.id, guest.name)}
                        className="w-10 h-10 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                        title="Hapus Data"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                      </button>
                    )}
                    <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 group-hover:text-amber-500 transition-colors">
                       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
                    </div>
                 </div>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-50 pt-4">
                 <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>{guest.startDate}</div>
                 <div className="flex items-center gap-1.5"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeWidth={2.5}/></svg>{guest.startTime} WIB</div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedGuest && (
        <div className="fixed inset-0 z-[500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 animate-page-enter overflow-y-auto no-scrollbar">
           <div className="bg-white w-full max-w-xl rounded-[56px] shadow-2xl overflow-hidden my-auto border border-white/20">
              {/* Header Modal */}
              <div className={`p-10 text-white text-center space-y-2 relative overflow-hidden ${selectedGuest.status === 'Diizinkan' ? 'bg-emerald-600' : selectedGuest.status === 'Ditolak' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                 <p className="text-[10px] font-black uppercase tracking-[0.4em] opacity-70">Security Digital Record</p>
                 <h3 className="text-2xl font-black uppercase tracking-tight">Detail Registrasi Tamu</h3>
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                 <button onClick={() => setSelectedGuest(null)} className="absolute top-6 right-6 w-10 h-10 bg-black/10 rounded-full flex items-center justify-center hover:bg-black/20 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
              </div>

              <div className="p-10 space-y-10">
                 {/* Status Banner */}
                 <div className={`p-5 rounded-[24px] text-center font-black text-xs uppercase tracking-widest border-2 ${selectedGuest.status === 'Diizinkan' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : selectedGuest.status === 'Ditolak' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                    Status: {selectedGuest.status}
                 </div>

                 {/* Unique ID Card */}
                 <div className="bg-slate-50 border-2 border-slate-100 rounded-[32px] p-8 text-center space-y-2">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em]">Nomor Registrasi Unik</p>
                    <p className="text-3xl font-black text-amber-500 font-mono tracking-tighter">{selectedGuest.id}</p>
                    <p className="text-[9px] text-slate-400 font-medium italic">Gunakan kode ini untuk verifikasi petugas gerbang.</p>
                 </div>

                 {/* SEKSI 1: IDENTITAS */}
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">I. Profil Identitas Tamu</h5>
                    <div className="grid grid-cols-1 gap-y-3">
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Nama Lengkap</span><span className="text-xs font-black text-slate-800 uppercase">{selectedGuest.name}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Jenis ID</span><span className="text-xs font-black text-slate-800">{selectedGuest.idType}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Nomor ID</span><span className="text-xs font-black text-slate-800">{selectedGuest.idNumber}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Instansi</span><span className="text-xs font-black text-slate-800">{selectedGuest.institution || '-'}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Rombongan</span><span className="text-xs font-black text-slate-800">{selectedGuest.guestCount} Orang</span></div>
                    </div>
                 </div>

                 {/* SEKSI 2: KUNJUNGAN */}
                 <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100 pb-2">II. Detail Tujuan Kunjungan</h5>
                    <div className="grid grid-cols-1 gap-y-3">
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Warga Tujuan</span><span className="text-xs font-black text-slate-800 uppercase">{selectedGuest.hostName}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Keperluan</span><span className="text-xs font-black text-slate-800">{selectedGuest.purpose}</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Waktu Datang</span><span className="text-xs font-black text-slate-800">{selectedGuest.startDate} | {selectedGuest.startTime} WIB</span></div>
                       <div className="flex justify-between items-center"><span className="text-xs font-bold text-slate-400">Durasi</span><span className="text-xs font-black text-slate-800">{selectedGuest.duration} ({selectedGuest.visitDays} Hari)</span></div>
                    </div>
                 </div>

                 {/* SIGNATURE AREA */}
                 <div className="space-y-4 pt-4 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Tanda Tangan Elektronik Tamu</p>
                    <div className="w-48 h-24 mx-auto border-2 border-slate-100 rounded-2xl flex items-center justify-center p-2 bg-slate-50/50">
                       <img src={selectedGuest.signature} className="max-w-full max-h-full object-contain mix-blend-multiply" alt="Signature" />
                    </div>
                 </div>

                 {/* ADMIN ACTIONS */}
                 {role === 'ADMIN' && (
                    <div className="space-y-4 pt-6 border-t border-slate-50">
                       <button 
                        onClick={(e) => handleDelete(e, selectedGuest.id, selectedGuest.name)} 
                        className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                       >
                         Hapus Data Kunjungan
                       </button>
                       {selectedGuest.status === 'Proses' && (
                          <div className="grid grid-cols-2 gap-4">
                             <button onClick={() => handleFinalAction(selectedGuest.id, 'Diizinkan')} className="bg-emerald-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Terima Tamu</button>
                             <button onClick={() => handleFinalAction(selectedGuest.id, 'Ditolak')} className="bg-rose-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Tolak Kunjungan</button>
                          </div>
                       )}
                    </div>
                 )}
              </div>
              
              <div className="bg-slate-900 p-8 text-center">
                 <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.4em]">© 2024 RT 05 Gayam Digital Security System</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GuestbookPage;
