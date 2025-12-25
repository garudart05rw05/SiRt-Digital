
import React, { useState, useRef, useEffect } from 'react';
import { Page, AppSettings, MASTER_SERVICES } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface AdminPanelProps {
  onNavigate: (page: Page) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    rtRw: "RT 05 RW 05",
    location: "Kelurahan Gayam, Mojoroto, Kediri",
    adminPassword: "123",
    citizenPassword: "55555*#",
    marqueeEnabled: true,
    emailJsServiceId: '',
    emailJsPublicKey: '',
    emailJsTemplateComplaintId: '',
    emailJsTemplateGuestId: '',
    emailJsLetterServiceId: '',
    emailJsLetterPublicKey: '',
    emailJsTemplateLetterId: ''
  } as AppSettings));

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data().data;
        setSettings(cloudSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async () => {
    setIsProcessing(true);
    try {
      await storage.set(STORAGE_KEYS.SETTINGS, settings);
      setShowSettings(false);
      alert("Konfigurasi Sistem Berhasil Diperbarui!");
    } catch (e) {
      alert("Gagal menyimpan ke Cloud!");
    } finally {
      setIsProcessing(false);
    }
  };

  const managementItems = MASTER_SERVICES.map(s => ({
    ...s,
    sub: s.category === 'Layanan' ? 'Verifikasi aduan & tamu' : s.category === 'Administrasi' ? 'Update data kependudukan' : 'Redaksi berita & galeri'
  }));

  if (showSettings) {
    return (
      <div className="space-y-6 px-5 py-6 animate-page-enter pb-32">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowSettings(false)} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Konfigurasi Pro</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Identitas, Keamanan & EmailJS</p>
          </div>
        </div>

        <div className="space-y-8 bg-white p-8 rounded-[44px] border border-slate-100 shadow-2xl overflow-y-auto max-h-[80vh] pb-12 no-scrollbar">
          
          <div className="space-y-4">
            <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-widest ml-1">Informasi Dasar</h4>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Nama RT/RW</label>
              <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 px-6 font-black text-slate-800" value={settings.rtRw} onChange={(e) => setSettings({...settings, rtRw: e.target.value})} />
            </div>
          </div>

          {/* SEKSI: EMAIL JS UMUM (Aduan & Tamu) */}
          <div className="p-8 bg-slate-50 rounded-[40px] border border-slate-100 space-y-6">
             <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-white shadow-lg">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" strokeWidth={2.5}/></svg>
                </div>
                <h4 className="text-[11px] font-black uppercase text-slate-600 tracking-[0.2em]">Notifikasi Umum (Aduan/Tamu)</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Service ID</label>
                   <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold shadow-sm" placeholder="service_xxxx" value={settings.emailJsServiceId || ''} onChange={e => setSettings({...settings, emailJsServiceId: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Public Key</label>
                   <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-5 py-3 text-xs font-bold shadow-sm" placeholder="user_xxxx" value={settings.emailJsPublicKey || ''} onChange={e => setSettings({...settings, emailJsPublicKey: e.target.value})} />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-rose-400 ml-1">Template ID Aduan</label>
                   <input type="text" className="w-full bg-white/70 border border-slate-100 rounded-xl px-5 py-3 text-xs font-bold" value={settings.emailJsTemplateComplaintId || ''} onChange={e => setSettings({...settings, emailJsTemplateComplaintId: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-amber-400 ml-1">Template ID Buku Tamu</label>
                   <input type="text" className="w-full bg-white/70 border border-slate-100 rounded-xl px-5 py-3 text-xs font-bold" value={settings.emailJsTemplateGuestId || ''} onChange={e => setSettings({...settings, emailJsTemplateGuestId: e.target.value})} />
                </div>
             </div>
          </div>

          {/* SEKSI: EMAIL JS KHUSUS PERSURATAN (TERPISAH) */}
          <div className="p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 space-y-6">
             <div className="flex items-center gap-3 border-b border-indigo-200 pb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth={2.5}/></svg>
                </div>
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em]">Notifikasi E-Persuratan (Khusus)</h4>
             </div>
             
             <p className="text-[9px] text-indigo-400 font-bold italic">Seksi ini memiliki konfigurasi JS mandiri untuk mengelola antrean surat pengantar secara profesional.</p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">Service ID Surat</label>
                   <input type="text" className="w-full bg-white border-none rounded-xl px-5 py-3 text-xs font-bold shadow-sm" placeholder="Khusus Surat" value={settings.emailJsLetterServiceId || ''} onChange={e => setSettings({...settings, emailJsLetterServiceId: e.target.value})} />
                </div>
                <div className="space-y-2">
                   <label className="text-[8px] font-black uppercase text-indigo-400 ml-1">Public Key Surat</label>
                   <input type="text" className="w-full bg-white border-none rounded-xl px-5 py-3 text-xs font-bold shadow-sm" placeholder="User Key Surat" value={settings.emailJsLetterPublicKey || ''} onChange={e => setSettings({...settings, emailJsLetterPublicKey: e.target.value})} />
                </div>
             </div>
             
             <div className="space-y-2">
                <label className="text-[8px] font-black uppercase text-indigo-600 ml-1">Template ID Surat Pengantar</label>
                <input type="text" className="w-full bg-white border-none rounded-xl px-5 py-3 text-xs font-bold shadow-sm" placeholder="Contoh: template_letters_rt05" value={settings.emailJsTemplateLetterId || ''} onChange={e => setSettings({...settings, emailJsTemplateLetterId: e.target.value})} />
             </div>
          </div>

          <div className="pt-6">
             <button onClick={handleSaveSettings} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                {isProcessing ? 'Sinkronisasi...' : 'Simpan Seluruh Perubahan'}
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 pb-32">
      <div className="bg-indigo-600 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em]">Administrator</p>
          <h2 className="text-3xl font-black leading-none tracking-tight">Pusat Kendali 🛡️</h2>
          <p className="text-xs opacity-60 font-medium pt-2">Kelola data warga, berita, dan konfigurasi sistem.</p>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {managementItems.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="bg-white border border-slate-50 p-7 rounded-[40px] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left group hover:shadow-xl hover:border-indigo-100">
            <div className={`${item.color} w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg group-hover:rotate-12 transition-transform duration-500`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-lg leading-tight">{item.label}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{item.sub}</p>
            </div>
          </button>
        ))}

        <button onClick={() => setShowSettings(true)} className="bg-slate-950 p-8 rounded-[44px] flex items-center gap-6 shadow-2xl active:scale-[0.98] transition-all text-left group text-white mt-6 border border-white/10">
          <div className="bg-white/10 w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={2}/></svg>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-lg">Konfigurasi Utama</h4>
            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest mt-1.5">Edit EmailJS (Umum & Surat) & Identitas</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
