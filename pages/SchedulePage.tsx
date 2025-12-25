
import React, { useState, useEffect } from 'react';
import { SecurityShift, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

const INITIAL_SCHEDULE: SecurityShift[] = [
  { id: '1-1', week: 1, day: 'Senin', leader: 'Budi Santoso', members: ['Agus K', 'Dedi', 'Nanang'] },
  { id: '1-2', week: 1, day: 'Selasa', leader: 'Sudirman', members: ['Bambang', 'Yudi', 'Fajar'] },
  { id: '1-3', week: 1, day: 'Rabu', leader: 'Heri Wijaya', members: ['Iwan', 'Roni', 'Aris'] },
  { id: '1-4', week: 1, day: 'Kamis', leader: 'Agus P', members: ['Dani', 'Toto', 'Dodi'] },
  { id: '1-5', week: 1, day: 'Jumat', leader: 'Slamet', members: ['Wawan', 'Bowo', 'Syam'] },
  { id: '1-6', week: 1, day: 'Sabtu', leader: 'Yono', members: ['Asep', 'Eko', 'Hendra'] },
  { id: '1-7', week: 1, day: 'Minggu', leader: 'Gatot', members: ['Surya', 'Udin', 'Indra'] },
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

  const getCurrentWeekType = (): 1 | 2 => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return (weekNumber % 2 === 0) ? 2 : 1;
  };

  const currentSystemWeek = getCurrentWeekType();

  useEffect(() => {
    setActiveWeek(currentSystemWeek);
  }, [currentSystemWeek]);

  const handleUpdate = async () => {
    if (!editingShift) return;
    const updated = schedule.map(s => s.id === editingShift.id ? editingShift : s);
    const saved = await storage.set(STORAGE_KEYS.SCHEDULE, updated);
    if (saved) {
      setSchedule(updated);
      alert(`Sukses! Jadwal hari ${editingShift.day} (Minggu ke-${editingShift.week}) berhasil diperbarui.`);
      setEditingShift(null);
    }
  };

  const filteredSchedule = schedule.filter(s => s.week === activeWeek);

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-slate-900 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-tight">Keamanan RT 05</h2>
          <p className="text-xs opacity-60 font-bold uppercase tracking-[0.2em]">Jadwal Ronda Bergilir Setiap 2 Minggu</p>
          <div className="flex gap-2 bg-white/5 p-1.5 rounded-3xl border border-white/10">
             <button onClick={() => setActiveWeek(1)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeWeek === 1 ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40'}`}>Minggu 1</button>
             <button onClick={() => setActiveWeek(2)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeWeek === 2 ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40'}`}>Minggu 2</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSchedule.map(shift => (
          <div key={shift.id} className={`bg-white border p-6 rounded-[40px] shadow-sm flex items-center gap-6 ${activeWeek === currentSystemWeek ? 'border-emerald-100' : 'border-slate-100'}`}>
            <div className={`w-20 h-20 rounded-[28px] flex flex-col items-center justify-center shrink-0 ${activeWeek === currentSystemWeek ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-50 text-slate-400'}`}>
              <span className="text-[10px] font-black uppercase opacity-60">HARI</span>
              <span className="text-sm font-black uppercase tracking-tight leading-none mt-1">{shift.day}</span>
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Koordinator: <span className="text-slate-900">{shift.leader}</span></p>
                {role === 'ADMIN' && (
                  <button onClick={() => setEditingShift(shift)} className="p-2 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5}/></svg></button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {shift.members.map((m, i) => <span key={i} className="bg-slate-50 text-slate-500 border border-slate-100 px-3 py-1 rounded-xl text-[9px] font-bold uppercase">{m}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {editingShift && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Edit Regu Ronda</h3>
            <div className="space-y-5">
              <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black" value={editingShift.leader} onChange={e => setEditingShift({...editingShift, leader: e.target.value})} />
              <textarea className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold h-32 resize-none" value={editingShift.members.join(', ')} onChange={e => setEditingShift({...editingShift, members: e.target.value.split(',').map(m => m.trim())})} />
            </div>
            <div className="flex gap-4">
              <button onClick={() => setEditingShift(null)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400 text-xs">Batal</button>
              <button onClick={handleUpdate} className="flex-[2] bg-slate-900 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl">Update Jadwal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
