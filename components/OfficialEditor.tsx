
import React, { useState, useRef } from 'react';
import { Official } from '../types';

interface OfficialEditorProps {
  onSave: (official: Partial<Official>) => void;
  onCancel: () => void;
  initialData?: Official;
}

const OfficialEditor: React.FC<OfficialEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [position, setPosition] = useState(initialData?.position || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [duties, setDuties] = useState(initialData?.duties || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">
          {initialData ? 'Edit Profil Pengurus' : 'Tambah Pengurus Baru'}
        </h3>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        <div className="flex flex-col items-center gap-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="w-36 h-36 rounded-[36px] border-4 border-dashed border-slate-200 flex items-center justify-center bg-slate-900 cursor-pointer hover:bg-slate-800 transition-all overflow-hidden relative group shadow-xl"
          >
            {imageUrl ? (
              <>
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="text-white text-xs font-black uppercase tracking-widest">Ganti Foto</span>
                </div>
              </>
            ) : (
              <div className="text-center p-4">
                <svg className="w-12 h-12 text-slate-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-tight">Pilih Foto Resmi</p>
              </div>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nama Lengkap & Gelar</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 text-white rounded-[24px] px-7 py-5 outline-none focus:ring-2 focus:ring-[#0077b6] font-bold placeholder-slate-600 transition-all shadow-inner"
              placeholder="Masukkan nama lengkap..."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Jabatan Organisasi</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 text-white rounded-[24px] px-7 py-5 outline-none focus:ring-2 focus:ring-[#0077b6] font-bold placeholder-slate-600 transition-all shadow-inner"
              placeholder="Contoh: Ketua RT / Sekretaris"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nomor WA Pengurus</label>
            <input 
              type="tel" 
              className="w-full bg-slate-900 text-white rounded-[24px] px-7 py-5 outline-none focus:ring-2 focus:ring-[#0077b6] font-bold placeholder-slate-600 transition-all shadow-inner"
              placeholder="08XXXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tugas Utama (Fungsi)</label>
            <textarea 
              rows={3}
              className="w-full bg-slate-900 text-white rounded-[24px] px-7 py-5 outline-none focus:ring-2 focus:ring-[#0077b6] font-bold placeholder-slate-600 resize-none transition-all shadow-inner"
              placeholder="Jelaskan tupoksi pengurus..."
              value={duties}
              onChange={(e) => setDuties(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button 
            onClick={onCancel} 
            className="flex-1 px-8 py-5 rounded-[24px] text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
          >
            Batal
          </button>
          <button 
            onClick={() => onSave({ name, position, phone, duties, imageUrl })}
            disabled={!name || !position}
            className="flex-[2] px-8 py-5 rounded-[24px] bg-[#0077b6] text-white font-black text-xs uppercase tracking-widest hover:bg-[#005f91] shadow-2xl shadow-blue-500/30 disabled:opacity-50 transition-all"
          >
            Simpan Data Pengurus
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficialEditor;
