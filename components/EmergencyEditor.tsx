
import React, { useState } from 'react';
import { EmergencyContact } from '../types';

interface EmergencyEditorProps {
  onSave: (contact: Partial<EmergencyContact>) => void;
  onCancel: () => void;
  initialData?: EmergencyContact;
}

const EmergencyEditor: React.FC<EmergencyEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [label, setLabel] = useState(initialData?.label || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [provider, setProvider] = useState(initialData?.provider || 'Keamanan');

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">
          {initialData ? 'Edit Profil Pengurus' : 'Tambah Pengurus Baru'}
        </h3>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Instansi / Label</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 outline-none font-bold placeholder-slate-600"
              placeholder="Contoh: Polsek Mojoroto atau RS Kediri"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomor Telepon</label>
            <input 
              type="tel" 
              className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 outline-none font-black text-xl placeholder-slate-600"
              placeholder="08XXXXXXXXXX atau 110"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori Layanan</label>
            <select 
              className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-red-500 outline-none font-black appearance-none"
              value={provider}
              // Fix: Added explicit cast to any for e.target.value to resolve string assignment to state union type error
              onChange={(e) => setProvider(e.target.value as any)}
            >
              <option value="Keamanan">Keamanan 👮</option>
              <option value="Kesehatan">Kesehatan 🚑</option>
              <option value="Kebakaran">Pemadam 🚒</option>
              <option value="PLN/PAM">Sarana Umum ⚡</option>
              <option value="Lainnya">Lainnya ☎️</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button onClick={onCancel} className="flex-1 py-5 rounded-2xl text-slate-500 font-black text-xs uppercase tracking-widest">Batal</button>
          <button 
            onClick={() => onSave({ label, phone, provider })}
            disabled={!label || !phone}
            className="flex-[2] py-5 rounded-2xl bg-red-600 text-white font-black text-xs uppercase tracking-widest hover:bg-red-700 shadow-xl shadow-red-500/20 disabled:opacity-50 transition-all"
          >
            Simpan Kontak Darurat
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmergencyEditor;
