
import React, { useState, useEffect } from 'react';
import { MeetingMinute, UserRole } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import MeetingMinutesEditor from '../components/MeetingMinutesEditor';
import AttendanceManager from '../components/AttendanceManager';

const MOCK_MINUTES: MeetingMinute[] = [
  {
    id: '1',
    title: 'Musyawarah Bulanan Mei 2024',
    date: '2024-05-15',
    location: 'Rumah Pak RT (Blok A-05)',
    content: '1. Pembahasan iuran sampah yang naik per Juni.\n2. Rencana perbaikan portal depan.\n3. Sosialisasi keamanan lingkungan jelang Idul Adha.',
    status: 'Final'
  }
];

const MeetingMinutesPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [minutes, setMinutes] = useState<MeetingMinute[]>(() => 
    storage.get(STORAGE_KEYS.MINUTES, MOCK_MINUTES)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | undefined>(undefined);
  const [viewAttendance, setViewAttendance] = useState<MeetingMinute | null>(null);

  useEffect(() => {
    storage.set(STORAGE_KEYS.MINUTES, minutes);
  }, [minutes]);

  const handleSave = (data: Partial<MeetingMinute>) => {
    if (selectedMinute) {
      setMinutes(minutes.map(m => m.id === selectedMinute.id ? { ...m, ...data as MeetingMinute } : m));
    } else {
      const newEntry: MeetingMinute = {
        id: Date.now().toString(),
        title: '',
        date: '',
        location: '',
        content: '',
        status: 'Draft',
        ...data as MeetingMinute
      };
      setMinutes([newEntry, ...minutes]);
    }
    setIsEditing(false);
    setSelectedMinute(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus notulen ini secara permanen?')) {
      setMinutes(minutes.filter(m => m.id !== id));
    }
  };

  if (isEditing && role === 'ADMIN') {
    return (
      <div className="px-5 py-6">
        <MeetingMinutesEditor onSave={handleSave} onCancel={() => { setIsEditing(false); setSelectedMinute(undefined); }} initialData={selectedMinute} />
      </div>
    );
  }

  if (viewAttendance) {
    return (
      <div className="px-5 py-6">
        <AttendanceManager meeting={viewAttendance} onClose={() => setViewAttendance(null)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-blue-800 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Arsip Notulen</h2>
            <p className="text-sm opacity-80 font-medium mt-2">Pencatatan resmi setiap hasil keputusan warga.</p>
          </div>
          {role === 'ADMIN' && (
            <button 
              onClick={() => setIsEditing(true)}
              className="w-full bg-white text-blue-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all"
            >
              + Tulis Notulen Baru
            </button>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {minutes.map(item => (
          <div key={item.id} className="bg-white border border-slate-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col group">
            <div className="p-8 space-y-4 flex-1">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'Final' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.status}
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight mt-2">{item.title}</h3>
                  </div>
                  {role === 'ADMIN' && (
                    <div className="flex gap-2">
                       <button onClick={() => { setSelectedMinute(item); setIsEditing(true); }} className="p-2 text-slate-300 hover:text-blue-500 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                       </button>
                       <button onClick={() => handleDelete(item.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                       </button>
                    </div>
                  )}
               </div>
               
               <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>
                    {item.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2.5}/></svg>
                    {item.location}
                  </div>
               </div>

               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{item.content}</p>
               </div>
            </div>
            <div className="px-8 pb-8">
               <button 
                 onClick={() => setViewAttendance(item)}
                 className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-3 active:scale-95 transition-all"
               >
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                 Lihat Daftar Hadir & Tanda Tangan
               </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
