
import React, { useState, useEffect } from 'react';
import { LetterRequest, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { notificationService } from '../services/notificationService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface ToastState {
  show: boolean;
  message: string;
  type: 'loading' | 'success' | 'error';
}

const LettersPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [requests, setRequests] = useState<LetterRequest[]>(() => storage.get(STORAGE_KEYS.LETTERS, []));
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {}));
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
    if (type !== 'loading') setTimeout(() => setToast(prev => ({ ...prev, show: false })), 4000);
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.LETTERS), (docSnap) => {
      if (docSnap.exists()) setRequests(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data().data);
    });
    return () => { unsub(); unsubSettings(); };
  }, []);

  const [form, setForm] = useState<Partial<LetterRequest>>({ privacyAgreed: false });

  const handleSubmit = async () => {
    if (!form.privacyAgreed || !form.email || !form.name || !form.purpose) {
      showToast("Lengkapi semua data!", "error");
      return;
    }
    setIsSubmitting(true);
    showToast("Mengajukan Surat...", "loading");
    
    const payload: LetterRequest = { 
      id: `SRT-${Date.now().toString().slice(-4)}`, 
      name: form.name || '',
      nik: form.nik || '-',
      email: form.email || '',
      purpose: form.purpose || '',
      status: 'Pending', 
      requestDate: new Date().toLocaleDateString('id-ID')
    };

    const updatedList = [payload, ...requests];
    const saved = await storage.set(STORAGE_KEYS.LETTERS, updatedList);
    
    if (saved) {
      // KIRIM EMAIL PAKAI SERVICE TERPUSAT (EMAILJS / GAS)
      await notificationService.sendEmail(settings, payload, 'letter');
      showToast("Berhasil! Cek Email Berkala", "success");
      setShowRequestModal(false);
      setForm({ privacyAgreed: false });
    }
    setIsSubmitting(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: LetterRequest['status']) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    setProcessingId(id);
    showToast(`Memperbarui...`, "loading");
    const updatedReq = { ...req, status: newStatus };
    const updatedList = requests.map(r => r.id === id ? updatedReq : r);
    const saved = await storage.set(STORAGE_KEYS.LETTERS, updatedList);
    if (saved) {
      // KIRIM UPDATE STATUS VIA EMAIL
      await notificationService.sendEmail(settings, updatedReq, 'letter');
      showToast("Status & Email Berhasil Dikirim", "success");
    }
    setProcessingId(null);
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      {toast.show && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] w-[90%] max-w-sm">
          <div className={`p-5 rounded-[28px] border-2 flex items-center gap-4 shadow-2xl backdrop-blur-xl ${toast.type === 'loading' ? 'bg-indigo-900/90 text-white' : toast.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-rose-600/90 text-white'}`}>
             <p className="text-xs font-black uppercase">{toast.message}</p>
          </div>
        </div>
      )}
      <div className="bg-indigo-700 rounded-[44px] p-10 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-white/20 rounded-[22px] flex items-center justify-center backdrop-blur-md shadow-inner"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" /></svg></div>
                <div><h2 className="text-3xl font-black uppercase tracking-tight leading-none">E-Persuratan</h2><p className="text-[10px] opacity-70 font-black mt-2 uppercase tracking-[0.2em]">Notifikasi Digital Berbasis Email</p></div>
             </div>
          </div>
          <button onClick={() => setShowRequestModal(true)} className="w-full bg-white text-indigo-700 py-6 rounded-[28px] font-black text-sm uppercase tracking-widest shadow-xl">Mulai Pengajuan</button>
        </div>
      </div>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-[44px] border border-dashed text-slate-300 font-black uppercase text-[10px] tracking-widest">Belum ada pengajuan</div>
        ) : (
          requests.map(req => (
            <div key={req.id} className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${req.status === 'Pending' ? 'bg-amber-50 text-amber-600' : req.status === 'Siap Diambil' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{req.status}</span>
                    <h4 className="text-xl font-black text-slate-800 uppercase mt-3">{req.name}</h4>
                    <p className="text-[10px] text-slate-400 mt-1 uppercase leading-relaxed">{req.purpose}</p>
                  </div>
              </div>
              {role === 'ADMIN' && (
                <div className="flex flex-col gap-2">
                    <div className="grid grid-cols-2 gap-3">
                      <button disabled={processingId === req.id || req.status === 'Diproses'} onClick={() => handleUpdateStatus(req.id, 'Diproses')} className="bg-blue-600 text-white py-4 rounded-2xl font-black text-[8px] uppercase tracking-widest shadow-lg">Set Proses</button>
                      <button disabled={processingId === req.id || req.status === 'Siap Diambil'} onClick={() => handleUpdateStatus(req.id, 'Siap Diambil')} className="bg-emerald-600 text-white py-4 rounded-2xl font-black text-[8px] uppercase tracking-widest shadow-lg">Set Selesai</button>
                    </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      {showRequestModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[56px] shadow-2xl animate-page-enter flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Form Pengajuan</h3>
               <button onClick={() => setShowRequestModal(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">X</button>
            </div>
            <div className="p-10 space-y-6 overflow-y-auto">
              <input type="email" className="w-full bg-slate-900 text-white rounded-3xl px-7 py-5 outline-none font-black text-sm" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email (Wajib)" />
              <input type="text" className="w-full bg-slate-900 text-white rounded-3xl px-7 py-5 outline-none font-black text-sm" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} placeholder="Nama Lengkap" />
              <textarea rows={4} className="w-full bg-slate-900 text-white rounded-[32px] px-7 py-6 outline-none font-bold text-sm" value={form.purpose || ''} onChange={e => setForm({...form, purpose: e.target.value})} placeholder="Keperluan Surat" />
              <div className="flex items-start gap-4 p-4 bg-indigo-50 rounded-3xl">
                 <input type="checkbox" className="mt-1" checked={form.privacyAgreed} onChange={e => setForm({...form, privacyAgreed: e.target.checked})} />
                 <p className="text-[10px] text-slate-500 font-bold">Data yang saya isi benar adanya.</p>
              </div>
              <button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black uppercase text-xs shadow-xl">{isSubmitting ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LettersPage;
