
import React, { useState, useRef } from 'react';
import { Complaint } from '../types';
import { polishComplaint } from '../services/geminiService';
import { compressImage } from '../services/storageService';

interface ComplaintEditorProps {
  onSave: (complaint: Partial<Complaint>) => void;
  onCancel: () => void;
}

const ComplaintEditor: React.FC<ComplaintEditorProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<Complaint>>({
    residentName: '',
    email: 'garudart05rw05@gmail.com', // Auto-fill Email Sistem
    phone: '',
    category: 'Infrastruktur',
    subject: '',
    description: '',
    status: 'Pending',
    timestamp: new Date().toISOString()
  });
  const [isPolishing, setIsPolishing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePolish = async () => {
    if (!formData.description) return;
    setIsPolishing(true);
    try {
      const polished = await polishComplaint(formData.description);
      if (polished) setFormData(prev => ({ ...prev, description: polished }));
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        const optimized = await compressImage(result, 800, 0.6);
        setPreviewImage(optimized);
        setFormData(prev => ({ ...prev, imageUrl: optimized }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">Pusat Aduan</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Laporan Resmi Warga RT</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Pelapor (Otomatis Terisi)</label>
            <div className="relative">
              <input 
                type="email" 
                className="w-full bg-slate-900 text-indigo-400 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 outline-none font-black shadow-inner"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
              <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 bg-indigo-500/10 px-2 py-1 rounded-lg">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                <span className="text-[7px] font-black text-indigo-400 uppercase">System Sync</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Lengkap</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 outline-none font-black placeholder-slate-600"
                placeholder="Masukkan nama lengkap"
                value={formData.residentName}
                onChange={(e) => setFormData({...formData, residentName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomor WhatsApp</label>
              <input 
                type="tel" 
                className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 outline-none font-black placeholder-slate-600"
                placeholder="08XXXXXXXXXX"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori Laporan</label>
            <select 
              className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 outline-none font-black appearance-none"
              value={formData.category}
              onChange={(e) => setFormData({...formData, category: e.target.value as any})}
            >
              <option value="Infrastruktur">Infrastruktur</option>
              <option value="Keamanan">Keamanan</option>
              <option value="Kebersihan">Kebersihan</option>
              <option value="Sosial">Sosial</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Subjek Masalah</label>
            <input 
              type="text" 
              className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 outline-none font-black placeholder-slate-600"
              placeholder="Contoh: Perbaikan Lampu Jalan"
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-2 relative">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Deskripsi Detail</label>
          <textarea 
            rows={5}
            className="w-full bg-slate-900 text-white rounded-3xl px-6 py-5 focus:ring-2 focus:ring-rose-500 outline-none font-bold placeholder-slate-600 resize-none"
            placeholder="Jelaskan kronologi kejadian..."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          <button 
            onClick={handlePolish}
            disabled={isPolishing || !formData.description}
            className="absolute bottom-4 right-4 bg-slate-950 border border-rose-900 text-rose-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-900 transition-all shadow-sm"
          >
            {isPolishing ? '...' : '✨ Poles AI'}
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Bukti Foto (Opsional)</label>
          <div 
            onClick={() => !isCompressing && fileInputRef.current?.click()}
            className="w-full aspect-[21/9] border-4 border-dashed border-slate-200 rounded-[32px] bg-slate-950 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-900 transition-all overflow-hidden relative group"
          >
            {isCompressing ? (
               <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Optimasi Foto...</p>
               </div>
            ) : previewImage ? (
              <>
                <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                   <span className="text-white font-black uppercase text-xs">Ganti Foto</span>
                </div>
              </>
            ) : (
              <>
                <svg className="w-14 h-14 text-slate-800 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <p className="text-xs font-black text-slate-700 uppercase">Lampirkan Bukti</p>
              </>
            )}
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
        </div>
      </div>

      <div className="p-10 bg-slate-50 flex gap-4">
        <button onClick={onCancel} className="flex-1 px-8 py-5 rounded-2xl text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
          Batal
        </button>
        <button 
          onClick={() => onSave(formData)}
          disabled={!formData.residentName || !formData.email || !formData.subject || !formData.description || isCompressing}
          className="flex-[2] px-8 py-5 rounded-2xl bg-rose-600 text-white font-black text-sm uppercase tracking-widest hover:bg-rose-700 shadow-2xl shadow-rose-500/30 disabled:opacity-50 transition-all"
        >
          Kirim Aduan & Email
        </button>
      </div>
    </div>
  );
};

export default ComplaintEditor;
