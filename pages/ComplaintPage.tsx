
import React, { useState, useEffect } from 'react';
import { Complaint, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import ComplaintEditor from '../components/ComplaintEditor.tsx';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const ComplaintPage: React.FC<{ role?: UserRole }> = ({ role = 'WARGA' }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => 
    storage.get(STORAGE_KEYS.COMPLAINTS, [])
  );
  const [isAdding, setIsAdding] = useState(false);
  const [filter, setFilter] = useState<'Semua' | 'Pending' | 'Diproses' | 'Selesai'>('Semua');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.COMPLAINTS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        setComplaints(cloudData);
        localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(cloudData));
      }
    });
    return () => unsub();
  }, []);

  const handleSave = (data: Partial<Complaint>) => {
    const newEntry: Complaint = {
      id: `C${Math.floor(100 + Math.random() * 900)}`,
      residentName: '',
      phone: '',
      category: 'Lainnya',
      subject: '',
      description: '',
      status: 'Pending',
      timestamp: new Date().toISOString(),
      ...data as Complaint
    };
    const updated = [newEntry, ...complaints];
    setComplaints(updated);
    storage.set(STORAGE_KEYS.COMPLAINTS, updated);
    setIsAdding(false);
  };

  const filteredComplaints = filter === 'Semua' 
    ? complaints 
    : complaints.filter(c => c.status === filter);

  if (isAdding) return <div className="px-5 py-6"><ComplaintEditor onSave={handleSave} onCancel={() => setIsAdding(false)} /></div>;

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-5">
           <div className="w-16 h-16 bg-rose-500 rounded-[22px] flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">E-Aduan</h2>
              <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest opacity-60">Layanan Aspirasi Warga</p>
           </div>
        </div>
        <button onClick={() => setIsAdding(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest">Buat Laporan</button>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
        {['Semua', 'Pending', 'Diproses', 'Selesai'].map(tab => (
          <button key={tab} onClick={() => setFilter(tab as any)} className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${filter === tab ? 'bg-rose-500 text-white border-rose-500 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}>{tab}</button>
        ))}
      </div>

      {filteredComplaints.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
          <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Belum ada aduan warga masuk</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredComplaints.map(complaint => (
            <div key={complaint.id} className="bg-white rounded-[32px] border border-slate-100 shadow-sm p-8 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-xl font-black text-slate-800">{complaint.subject}</h3>
                <span className="text-[10px] font-black text-slate-400 uppercase">#{complaint.id}</span>
              </div>
              <p className="text-sm text-slate-600 italic">"{complaint.description}"</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                 <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${complaint.status === 'Selesai' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{complaint.status}</span>
                 <p className="text-[10px] font-bold text-slate-400">{complaint.residentName}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ComplaintPage;
