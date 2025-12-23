
import React, { useState, useEffect } from 'react';
import { LetterRequest, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

const MOCK_LETTERS: LetterRequest[] = [
  { id: 'LR-1', residentName: 'Budi Santoso', phone: '08123456789', letterType: 'Domisili', purpose: 'Pembukaan Rekening Bank', status: 'Siap Diambil', createdAt: '2024-05-20T10:00:00Z', pickupTime: '19:00 WIB' },
  { id: 'LR-2', residentName: 'Siti Aminah', phone: '08123456780', letterType: 'SKCK', purpose: 'Melamar Pekerjaan', status: 'Pending', createdAt: '2024-05-21T08:30:00Z' },
];

const LettersPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [requests, setRequests] = useState<LetterRequest[]>(() => storage.get(STORAGE_KEYS.LETTERS, MOCK_LETTERS));
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [form, setForm] = useState<Partial<LetterRequest>>({ letterType: 'Domisili' });

  useEffect(() => { storage.set(STORAGE_KEYS.LETTERS, requests); }, [requests]);

  const handleSubmit = () => {
    if (!form.residentName || !form.purpose) return;
    const newReq: LetterRequest = {
      id: `LR-${Date.now().toString().slice(-4)}`,
      residentName: form.residentName,
      phone: form.phone || '',
      letterType: form.letterType as any,
      purpose: form.purpose,
      status: 'Pending',
      createdAt: new Date().toISOString()
    };
    setRequests([newReq, ...requests]);
    setShowRequestModal(false);
    setForm({ letterType: 'Domisili' });
  };

  const updateStatus = (id: string, newStatus: LetterRequest['status'], pickupTime?: string) => {
    setRequests(requests.map(r => r.id === id ? { ...r, status: newStatus, pickupTime: pickupTime || r.pickupTime } : r));
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-indigo-700 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">E-Persuratan</h2>
            <p className="text-sm opacity-70 font-medium mt-2">Permohonan surat pengantar RT secara digital.</p>
          </div>
          {role === 'WARGA' && (
            <button 
              onClick={() => setShowRequestModal(true)}
              className="w-full bg-white text-indigo-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              Ajukan Surat Baru
            </button>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Daftar Permohonan</h3>
        <div className="space-y-3">
          {requests.map(req => (
            <div key={req.id} className="bg-white border border-slate-100 p-6 rounded-[32px] shadow-sm flex flex-col gap-4 group">
              <div className="flex justify-between items-start">
                <div className="flex gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${req.status === 'Siap Diambil' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800">Surat {req.letterType}</h4>
                    <p className="text-xs font-bold text-slate-400">Pemohon: <span className="text-slate-700 font-black">{req.residentName}</span></p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                  req.status === 'Pending' ? 'bg-amber-100 text-amber-600' : 
                  req.status === 'Diproses' ? 'bg-blue-100 text-blue-600' : 
                  req.status === 'Siap Diambil' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                }`}>
                  {req.status}
                </span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Keperluan</p>
                <p className="text-sm font-medium text-slate-600">"{req.purpose}"</p>
                {req.pickupTime && req.status === 'Siap Diambil' && (
                  <div className="mt-3 flex items-center gap-2 text-emerald-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>
                    <p className="text-[10px] font-black uppercase">Ambil jam {req.pickupTime} di rumah Pak RT</p>
                  </div>
                )}
              </div>
              {role === 'ADMIN' && req.status !== 'Siap Diambil' && req.status !== 'Ditolak' && (
                <div className="flex gap-2 pt-2">
                  <button onClick={() => updateStatus(req.id, 'Diproses')} className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Proses</button>
                  <button onClick={() => {
                    const time = prompt("Jam berapa surat bisa diambil? (Contoh: 19:30 WIB)");
                    if(time) updateStatus(req.id, 'Siap Diambil', time);
                  }} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Selesai</button>
                  <button onClick={() => updateStatus(req.id, 'Ditolak')} className="flex-1 bg-rose-100 text-rose-600 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">Tolak</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Ajukan Persuratan</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Lengkap Pemohon</label>
                <input type="text" placeholder="Masukkan Nama Lengkap" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black placeholder-slate-600" value={form.residentName} onChange={e => setForm({...form, residentName: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jenis Surat</label>
                <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black appearance-none" value={form.letterType} onChange={e => setForm({...form, letterType: e.target.value as any})}>
                  <option value="Domisili">Keterangan Domisili</option>
                  <option value="SKCK">Pengantar SKCK</option>
                  <option value="Kematian">Keterangan Kematian</option>
                  <option value="Pindah">Keterangan Pindah</option>
                  <option value="Lainnya">Keperluan Lainnya</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tujuan / Keperluan Surat</label>
                <textarea placeholder="Contoh: Mengurus pendaftaran sekolah atau bank" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold placeholder-slate-600 h-28 resize-none" value={form.purpose} onChange={e => setForm({...form, purpose: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleSubmit} className="flex-2 bg-indigo-600 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all active:scale-95">Kirim Pengajuan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LettersPage;
