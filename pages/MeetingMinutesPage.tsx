
import React, { useState, useEffect } from 'react';
import { MeetingMinute, UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import MeetingMinutesEditor from '../components/MeetingMinutesEditor';
import AttendanceManager from '../components/AttendanceManager';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const MeetingMinutesPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri'
  });
  const [isEditing, setIsEditing] = useState(false);
  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | undefined>(undefined);
  const [viewAttendance, setViewAttendance] = useState<MeetingMinute | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.MINUTES), (docSnap) => {
      if (docSnap.exists()) setMinutes(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data().data || {});
    });
    return () => { unsub(); unsubSettings(); };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async (data: Partial<MeetingMinute>) => {
    let updated: MeetingMinute[];
    if (selectedMinute) {
      updated = minutes.map(m => m.id === selectedMinute.id ? { ...m, ...data as MeetingMinute } : m);
    } else {
      const newEntry: MeetingMinute = { id: Date.now().toString(), title: '', date: '', location: '', content: '', status: 'Draft', ...data as MeetingMinute };
      updated = [newEntry, ...minutes];
    }
    await storage.set(STORAGE_KEYS.MINUTES, updated);
    setIsEditing(false);
    setSelectedMinute(undefined);
  };

  if (isEditing && role === 'ADMIN') {
    return <div className="px-5 py-6"><MeetingMinutesEditor onSave={handleSave} onCancel={() => { setIsEditing(false); setSelectedMinute(undefined); }} initialData={selectedMinute} /></div>;
  }

  if (viewAttendance) {
    return <div className="px-5 py-6"><AttendanceManager meeting={viewAttendance} onClose={() => setViewAttendance(null)} /></div>;
  }

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      {/* Print Header */}
      <div className="print-header">
        <h1 className="text-2xl font-black uppercase">NOTULEN RAPAT WARGA {settings.rtRw}</h1>
        <p className="text-sm font-bold">{settings.location}</p>
        <p className="text-[10px] mt-1 italic">Arsip Dokumentasi - Dicetak pada: {new Date().toLocaleDateString('id-ID')}</p>
      </div>

      <div className="bg-blue-800 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
             <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
             </div>
             <button onClick={handlePrint} className="bg-white/20 p-4 rounded-2xl shadow-inner border border-white/20"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Arsip Notulen</h2>
            <p className="text-sm opacity-80 font-medium mt-2 uppercase tracking-widest">Pencatatan Musyawarah Warga</p>
          </div>
          {role === 'ADMIN' && (
            <button onClick={() => setIsEditing(true)} className="w-full bg-white text-blue-800 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">+ Tulis Notulen Baru</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {minutes.map(item => (
          <div key={item.id} className="bg-white border border-slate-100 rounded-[40px] shadow-sm hover:shadow-xl transition-all overflow-hidden flex flex-col">
            <div className="p-8 space-y-4">
               <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'Final' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {item.status}
                    </span>
                    <h3 className="text-2xl font-black text-slate-800 leading-tight uppercase mt-2">{item.title}</h3>
                  </div>
               </div>
               <div className="flex items-center gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>{item.date}</div>
                  <div className="flex items-center gap-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2.5}/></svg>{item.location}</div>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                  <p className="text-sm text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{item.content}</p>
               </div>
            </div>
            <div className="px-8 pb-8 no-print">
               <button onClick={() => setViewAttendance(item)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase shadow-lg flex items-center justify-center gap-3">Absensi & Tanda Tangan</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MeetingMinutesPage;
