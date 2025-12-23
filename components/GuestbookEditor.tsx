
import React, { useState } from 'react';
import { GuestEntry } from '../types';

interface GuestbookEditorProps {
  onSave: (guest: Partial<GuestEntry>) => void;
  onCancel: () => void;
}

const GuestbookEditor: React.FC<GuestbookEditorProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<GuestEntry>>({
    name: '',
    phone: '',
    purpose: '',
    destinationHouse: '',
    guestType: 'Lainnya',
    checkIn: new Date().toISOString()
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">Registrasi Tamu</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Log Kunjungan Digital RT 05</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap Tamu</label>
            <input 
              name="name"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none font-black text-white placeholder-slate-600 transition-all"
              placeholder="Contoh: Rahmat Hidayat"
              value={formData.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp / HP Tamu</label>
            <input 
              name="phone"
              type="tel" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none font-black text-white placeholder-slate-600 transition-all"
              placeholder="08XXXXXXXXXX"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tujuan Rumah / Blok</label>
            <input 
              name="destinationHouse"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none font-black text-white placeholder-slate-600 transition-all"
              placeholder="Contoh: Bpk. Heri (A-05)"
              value={formData.destinationHouse}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Jenis Kunjungan</label>
            <select 
              name="guestType"
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none font-black text-white appearance-none transition-all"
              value={formData.guestType}
              onChange={handleChange}
            >
              <option value="Keluarga">Keluarga</option>
              <option value="Kurir">Kurir / Logistik</option>
              <option value="Dinas">Instansi / Dinas</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Maksud & Keperluan Kunjungan</label>
          <input 
            name="purpose"
            type="text" 
            className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-amber-500 outline-none font-black text-white placeholder-slate-600 transition-all"
            placeholder="Contoh: Silaturahmi atau Antar Paket Shopee"
            value={formData.purpose}
            onChange={handleChange}
          />
        </div>

        <div className="bg-amber-950 p-8 rounded-[32px] border border-amber-900 shadow-xl flex items-center gap-5">
           <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/20">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
           </div>
           <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Time Logging Aktif</p>
              <p className="text-sm font-black text-white">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
           </div>
        </div>
      </div>

      <div className="p-10 bg-slate-50 flex gap-4">
        <button onClick={onCancel} className="flex-1 px-8 py-5 rounded-2xl text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
          Batal
        </button>
        <button 
          onClick={() => onSave(formData)}
          disabled={!formData.name || !formData.destinationHouse}
          className="flex-[2] px-8 py-5 rounded-2xl bg-amber-600 text-white font-black text-sm uppercase tracking-widest hover:bg-amber-700 shadow-2xl shadow-amber-500/30 transition-all"
        >
          Check-in Tamu Sekarang
        </button>
      </div>
    </div>
  );
};

export default GuestbookEditor;
