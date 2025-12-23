
import React, { useState, useEffect } from 'react';
import { Official, UserRole } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import OfficialEditor from '../components/OfficialEditor';

interface OfficialsPageProps {
  role: UserRole;
}

const INITIAL_OFFICIALS: Official[] = [];

const OfficialsPage: React.FC<OfficialsPageProps> = ({ role }) => {
  const [officials, setOfficials] = useState<Official[]>(() => 
    storage.get(STORAGE_KEYS.OFFICIALS, INITIAL_OFFICIALS)
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedOfficial, setSelectedOfficial] = useState<Official | undefined>(undefined);

  useEffect(() => {
    storage.set(STORAGE_KEYS.OFFICIALS, officials);
  }, [officials]);

  const handleSave = (data: Partial<Official>) => {
    if (role !== 'ADMIN') return;
    if (selectedOfficial) {
      setOfficials(officials.map(o => o.id === selectedOfficial.id ? { ...o, ...data as Official } : o));
    } else {
      const newEntry: Official = {
        id: Date.now().toString(),
        name: '',
        position: '',
        phone: '',
        duties: '',
        imageUrl: '',
        ...data as Official
      };
      setOfficials([...officials, newEntry]);
    }
    setIsEditing(false);
    setSelectedOfficial(undefined);
  };

  const handleDelete = (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm('Hapus data pengurus ini secara permanen?')) {
      setOfficials(officials.filter(o => o.id !== id));
    }
  };

  if (isEditing && role === 'ADMIN') {
    return (
      <div className="px-5 py-6">
        <OfficialEditor 
          onSave={handleSave} 
          onCancel={() => { setIsEditing(false); setSelectedOfficial(undefined); }} 
          initialData={selectedOfficial} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 pb-24 animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-none uppercase">Profil Pengurus</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Struktur Organisasi Lingkungan</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-[#0077b6] text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
          >
            + Tambah Pengurus
          </button>
        )}
      </div>

      {officials.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada data pengurus diatur</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-12">
          {officials.map(official => (
            <div key={official.id} className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row items-center md:items-stretch group hover:shadow-xl transition-all">
              <div className="w-full md:w-48 aspect-square md:aspect-auto relative shrink-0">
                <img 
                  src={official.imageUrl || 'https://via.placeholder.com/400x400?text=Profil'} 
                  alt={official.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="bg-blue-50 text-[#0077b6] text-[10px] font-black uppercase px-3 py-1 rounded-full mb-2 inline-block shadow-sm">
                        {official.position}
                      </span>
                      <h3 className="text-2xl font-black text-slate-800 leading-tight">{official.name}</h3>
                    </div>
                    {role === 'ADMIN' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedOfficial(official); setIsEditing(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-[#0077b6] rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(official.id)} className="p-2 bg-slate-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fungsi Jabatan</p><p className="text-sm text-slate-500 font-medium">{official.duties || 'Belum ada deskripsi tugas.'}</p></div>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-slate-400"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg><span className="text-xs font-black tracking-tight">{official.phone}</span></div>
                  <div className="flex gap-2">
                    <button onClick={() => window.location.href = `tel:${official.phone}`} className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-md">Telepon</button>
                    <button onClick={() => window.open(`https://wa.me/${official.phone}`)} className="bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-sm">WhatsApp</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OfficialsPage;
