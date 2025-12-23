
import React, { useState, useEffect } from 'react';
import { SecurityShift, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

// Data default 14 hari (7 hari Minggu 1, 7 hari Minggu 2)
const INITIAL_SCHEDULE: SecurityShift[] = [
  // Minggu 1 (A)
  { id: '1-1', week: 1, day: 'Senin', leader: 'Budi Santoso', members: ['Agus K', 'Dedi', 'Nanang'] },
  { id: '1-2', week: 1, day: 'Selasa', leader: 'Sudirman', members: ['Bambang', 'Yudi', 'Fajar'] },
  { id: '1-3', week: 1, day: 'Rabu', leader: 'Heri Wijaya', members: ['Iwan', 'Roni', 'Aris'] },
  { id: '1-4', week: 1, day: 'Kamis', leader: 'Agus P', members: ['Dani', 'Toto', 'Dodi'] },
  { id: '1-5', week: 1, day: 'Jumat', leader: 'Slamet', members: ['Wawan', 'Bowo', 'Syam'] },
  { id: '1-6', week: 1, day: 'Sabtu', leader: 'Yono', members: ['Asep', 'Eko', 'Hendra'] },
  { id: '1-7', week: 1, day: 'Minggu', leader: 'Gatot', members: ['Surya', 'Udin', 'Indra'] },
  // Minggu 2 (B)
  { id: '2-1', week: 2, day: 'Senin', leader: 'Heri W', members: ['Jaka', 'Tono', 'Ari'] },
  { id: '2-2', week: 2, day: 'Selasa', leader: 'Feri', members: ['Guntur', 'Rian', 'Bayu'] },
  { id: '2-3', week: 2, day: 'Rabu', leader: 'Zainal', members: ['Miftah', 'Agung', 'Lutfi'] },
  { id: '2-4', week: 2, day: 'Kamis', leader: 'Samsul', members: ['Yanto', 'Pardi', 'Haris'] },
  { id: '2-5', week: 2, day: 'Jumat', leader: 'Edison', members: ['Bakti', 'Soni', 'Fahmi'] },
  { id: '2-6', week: 2, day: 'Sabtu', leader: 'Tegar', members: ['Bagas', 'Ilham', 'Reza'] },
  { id: '2-7', week: 2, day: 'Minggu', leader: 'Rizal', members: ['Fandi', 'Joni', 'Nico'] },
];

const SchedulePage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [schedule, setSchedule] = useState<SecurityShift[]>(() => storage.get(STORAGE_KEYS.SCHEDULE, INITIAL_SCHEDULE));
  const [activeWeek, setActiveWeek] = useState<1 | 2>(1);
  const [editingShift, setEditingShift] = useState<SecurityShift | null>(null);

  // Deteksi Minggu Berjalan (Ganjil = Minggu 1, Genap = Minggu 2)
  const getCurrentWeekType = (): 1 | 2 => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return (weekNumber % 2 === 0) ? 2 : 1;
  };

  const currentSystemWeek = getCurrentWeekType();

  useEffect(() => {
    storage.set(STORAGE_KEYS.SCHEDULE, schedule);
  }, [schedule]);

  useEffect(() => {
    // Arahkan otomatis ke minggu berjalan saat pertama load
    setActiveWeek(currentSystemWeek);
  }, [currentSystemWeek]);

  const handleUpdate = () => {
    if (!editingShift) return;
    setSchedule(schedule.map(s => s.id === editingShift.id ? editingShift : s));
    setEditingShift(null);
  };

  const filteredSchedule = schedule.filter(s => s.week === activeWeek);

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-slate-900 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md text-red-500 shadow-inner">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/30">
               <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
               Sistem Rotasi 14 Hari
            </div>
          </div>
          
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Keamanan RT 05</h2>
            <p className="text-xs opacity-60 font-bold mt-2 uppercase tracking-[0.2em]">Jadwal Ronda Bergilir Setiap 2 Minggu</p>
          </div>

          <div className="flex gap-2 bg-white/5 p-1.5 rounded-3xl border border-white/10">
             <button 
               onClick={() => setActiveWeek(1)}
               className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeWeek === 1 ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
             >
               Minggu ke-1
               {currentSystemWeek === 1 && <span className="text-[7px] opacity-70">(MINGGU INI)</span>}
             </button>
             <button 
               onClick={() => setActiveWeek(2)}
               className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeWeek === 2 ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white/70'}`}
             >
               Minggu ke-2
               {currentSystemWeek === 2 && <span className="text-[7px] opacity-70">(MINGGU INI)</span>}
             </button>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
      </div>

      <div className="px-2 flex items-center justify-between">
         <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Tugas: {activeWeek === 1 ? 'Minggu Ganjil' : 'Minggu Genap'}</h3>
         <div className="flex gap-1">
            <div className={`w-2 h-2 rounded-full ${activeWeek === currentSystemWeek ? 'bg-emerald-500' : 'bg-slate-200'}`}></div>
            <div className={`w-2 h-2 rounded-full ${activeWeek !== currentSystemWeek ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSchedule.map(shift => (
          <div key={shift.id} className={`bg-white border p-6 rounded-[40px] shadow-sm flex items-center gap-6 group hover:shadow-md transition-all ${activeWeek === currentSystemWeek ? 'border-emerald-100' : 'border-slate-100'}`}>
            <div className={`w-20 h-20 rounded-[28px] flex flex-col items-center justify-center shrink-0 border transition-colors ${activeWeek === currentSystemWeek ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
              <span className="text-[10px] font-black uppercase opacity-60">HARI</span>
              <span className="text-sm font-black uppercase tracking-tight leading-none mt-1">{shift.day}</span>
            </div>
            <div className="flex-1 space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Koordinator</p>
                </div>
                {role === 'ADMIN' && (
                  <button onClick={() => setEditingShift(shift)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2.5}/></svg>
                  </button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-slate-900 text-white px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-slate-900/10">
                  <svg className="w-3 h-3 text-red-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  {shift.leader}
                </span>
                {shift.members.map((m, i) => (
                  <span key={i} className="bg-slate-50 text-slate-500 border border-slate-100 px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-tight">
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-950 p-8 rounded-[44px] text-white">
         <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h4 className="text-sm font-black uppercase tracking-widest leading-none">Info Pengecekan</h4>
         </div>
         <p className="text-xs text-white/50 leading-relaxed">
            Jika minggu ini adalah <span className="text-white font-bold">Minggu ke-{currentSystemWeek}</span>, maka jadwal yang berlabel <span className="text-emerald-400 font-bold uppercase tracking-tighter">"Sedang Berjalan"</span> adalah personil yang wajib bertugas malam ini. Warga di Minggu Depan tetap siaga untuk rotasi berikutnya.
         </p>
      </div>

      {editingShift && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter shadow-[0_32px_64px_rgba(0,0,0,0.5)]">
            <div className="space-y-1">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Edit Plotting Ronda</h3>
               <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em]">{editingShift.day} - Minggu ke-{editingShift.week}</p>
            </div>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ketua Regu (Penanggung Jawab)</label>
                <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-5 outline-none font-black transition-all focus:ring-2 focus:ring-blue-500" value={editingShift.leader} onChange={e => setEditingShift({...editingShift, leader: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Anggota Regu (Pisahkan dengan Koma)</label>
                <textarea className="w-full bg-slate-900 text-white rounded-2xl px-6 py-5 outline-none font-bold h-36 resize-none transition-all focus:ring-2 focus:ring-blue-500 leading-relaxed" value={editingShift.members.join(', ')} onChange={e => setEditingShift({...editingShift, members: e.target.value.split(',').map(m => m.trim()).filter(m => m !== '')})} />
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingShift(null)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400 text-xs">Batal</button>
              <button onClick={handleUpdate} className="flex-[2] bg-slate-900 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95 text-xs">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
