
import React, { useState } from 'react';
import { Resident } from '../types';

interface ResidentEditorProps {
  onSave: (resident: Partial<Resident>) => void;
  onCancel: () => void;
  initialData?: Resident;
}

const ResidentEditor: React.FC<ResidentEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<Resident>>(initialData || {
    name: '',
    gender: 'Laki-laki',
    dateOfBirth: '',
    kkNumber: '',
    houseNumber: '',
    phone: '',
    status: 'Aktif',
    joinedDate: new Date().toISOString().split('T')[0]
  });

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAgeCategory = (age: number) => {
    if (age <= 5) return 'Balita';
    if (age <= 12) return 'Anak-anak';
    if (age <= 17) return 'Remaja';
    if (age <= 50) return 'Dewasa';
    return 'Lansia';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const currentAge = formData.dateOfBirth ? calculateAge(formData.dateOfBirth) : null;

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">
            {initialData ? 'Edit Identitas' : 'Registrasi Warga'}
          </h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest opacity-60">Database Kependudukan RT 05</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap Sesuai KTP</label>
            <input 
              name="name"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white placeholder-slate-600 transition-all shadow-inner"
              placeholder="Masukkan nama lengkap"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jenis Kelamin</label>
            <select 
              name="gender"
              className="w-full bg-slate-900 border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white appearance-none transition-all shadow-inner"
              value={formData.gender}
              onChange={handleChange}
            >
              <option value="Laki-laki">Laki-laki</option>
              <option value="Perempuan">Perempuan</option>
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center ml-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Lahir</label>
              {currentAge !== null && (
                <span className="text-[9px] font-black text-white bg-[#0077b6] px-2 py-0.5 rounded-md uppercase">
                  {currentAge} Thn ({getAgeCategory(currentAge)})
                </span>
              )}
            </div>
            <input 
              name="dateOfBirth"
              type="date" 
              className="w-full bg-slate-900 border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white transition-all shadow-inner"
              value={formData.dateOfBirth}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status Hunian</label>
            <div className="flex gap-2">
              {['Aktif', 'Pindah', 'Tamu'].map((s) => (
                <button
                  key={s}
                  onClick={() => setFormData(prev => ({ ...prev, status: s as any }))}
                  className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    formData.status === s 
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                      : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomor Kartu Keluarga (KK)</label>
            <input 
              name="kkNumber"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white placeholder-slate-600 transition-all shadow-inner"
              placeholder="16 Digit Nomor KK"
              value={formData.kkNumber}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomor Rumah / Alamat Lengkap</label>
            <input 
              name="houseNumber"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white placeholder-slate-600 transition-all shadow-inner"
              placeholder="Contoh: A-12 atau Blok B"
              value={formData.houseNumber}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp Aktif</label>
            <input 
              name="phone"
              type="tel" 
              className="w-full bg-slate-900 text-white border-none rounded-2xl px-7 py-5 focus:ring-2 focus:ring-[#0077b6] outline-none font-black text-white placeholder-slate-600 transition-all shadow-inner"
              placeholder="08XXXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="bg-slate-950 p-6 rounded-[32px] border border-slate-800 shadow-inner">
             <div className="flex items-center gap-3 mb-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                <h4 className="font-black text-white text-xs uppercase tracking-widest">Enkripsi Data</h4>
             </div>
             <p className="text-[10px] text-slate-400 leading-relaxed font-bold">Seluruh data kependudukan disimpan secara aman dan hanya dapat diakses oleh Admin RT terverifikasi.</p>
          </div>
        </div>
      </div>

      <div className="p-10 bg-slate-50 flex gap-4">
        <button onClick={onCancel} className="flex-1 px-8 py-5 rounded-2xl text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
          Batal
        </button>
        <button 
          onClick={() => onSave(formData)}
          disabled={!formData.name || !formData.kkNumber}
          className="flex-[2] px-8 py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest hover:bg-black shadow-2xl transition-all"
        >
          Simpan Database
        </button>
      </div>
    </div>
  );
};

export default ResidentEditor;
