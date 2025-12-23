
import React, { useState, useEffect } from 'react';
import { Resident, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import ResidentEditor from '../components/ResidentEditor.tsx';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const ResidentList: React.FC<{ role: UserRole }> = ({ role }) => {
  const [residents, setResidents] = useState<Resident[]>(() => 
    storage.get(STORAGE_KEYS.RESIDENTS, [])
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [selectedResident, setSelectedResident] = useState<Resident | undefined>(undefined);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.RESIDENTS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data;
        setResidents(cloudData);
        localStorage.setItem(STORAGE_KEYS.RESIDENTS, JSON.stringify(cloudData));
      }
    });
    return () => unsub();
  }, []);

  const filteredResidents = residents.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.houseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.kkNumber.includes(searchTerm)
  );

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return age;
  };

  const handleSave = (data: Partial<Resident>) => {
    if (role !== 'ADMIN') return;
    let updated: Resident[];
    if (selectedResident) {
      updated = residents.map(r => r.id === selectedResident.id ? { ...r, ...data as Resident } : r);
    } else {
      const newEntry: Resident = {
        id: Date.now().toString(),
        name: '',
        gender: 'Laki-laki',
        dateOfBirth: '',
        kkNumber: '',
        houseNumber: '',
        phone: '',
        status: 'Aktif',
        joinedDate: new Date().toISOString().split('T')[0],
        ...data as Resident
      };
      updated = [...residents, newEntry];
    }
    setResidents(updated);
    storage.set(STORAGE_KEYS.RESIDENTS, updated);
    setIsEditing(false);
    setSelectedResident(undefined);
  };

  const handleDelete = (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm('Hapus data warga ini? Tindakan ini permanen.')) {
      const updated = residents.filter(r => r.id !== id);
      setResidents(updated);
      storage.set(STORAGE_KEYS.RESIDENTS, updated);
    }
  };

  if (isEditing && role === 'ADMIN') {
    return (
      <div className="px-5 py-6">
        <ResidentEditor onSave={handleSave} onCancel={() => setIsEditing(false)} initialData={selectedResident} />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-5 py-4 pb-24 animate-page-enter">
      <div className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Database Warga</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2 opacity-60">RT 05 RW 05 Gayam</p>
          </div>
          {role === 'ADMIN' && (
            <button 
              onClick={() => { setSelectedResident(undefined); setIsEditing(true); }}
              className="bg-[#0077b6] text-white px-8 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              + Registrasi Warga
            </button>
          )}
        </div>

        <div className="p-6 border-b border-slate-50">
           <div className="relative">
             <input 
               type="text" 
               placeholder="Cari Nama / No. Rumah..." 
               className="pl-14 pr-6 py-4 bg-slate-100 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-[#0077b6] w-full text-slate-800"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
             <svg className="w-6 h-6 text-slate-300 absolute left-5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-6">Warga</th>
                <th className="px-8 py-6">Hunian</th>
                <th className="px-8 py-6 text-center">Usia</th>
                <th className="px-8 py-6">Status</th>
                {role === 'ADMIN' && <th className="px-8 py-6 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredResidents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 font-black uppercase text-xs tracking-widest">Tidak ada data ditemukan</td>
                </tr>
              ) : (
                filteredResidents.map((resident) => (
                  <tr key={resident.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-black shadow-sm ${resident.gender === 'Laki-laki' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                          {resident.name.charAt(0)}
                        </div>
                        <div className="space-y-0.5">
                          <span className="font-black text-slate-800 text-base leading-tight block">{resident.name}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{resident.phone || 'No HP -'}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-700 block">{resident.houseNumber}</span>
                        <span className="text-[10px] font-medium text-slate-400 block tracking-tight">KK: {resident.kkNumber || '****'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-black text-slate-800">{calculateAge(resident.dateOfBirth)} Thn</span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        resident.status === 'Aktif' ? 'bg-emerald-50 text-emerald-600' : 
                        resident.status === 'Tamu' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {resident.status}
                      </span>
                    </td>
                    {role === 'ADMIN' && (
                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setSelectedResident(resident); setIsEditing(true); }} className="p-3 bg-white border border-slate-100 text-[#0077b6] rounded-xl hover:shadow-md transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5} /></svg>
                          </button>
                          <button onClick={() => handleDelete(resident.id)} className="p-3 bg-white border border-slate-100 text-rose-500 rounded-xl hover:shadow-md transition-all">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResidentList;
