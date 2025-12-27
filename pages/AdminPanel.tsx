
import React, { useState, useEffect, useRef } from 'react';
import { Page, AppSettings, MASTER_SERVICES } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface AdminPanelProps {
  onNavigate: (page: Page) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showEmailConfig, setShowEmailConfig] = useState(false);
  const [showQRConfig, setShowQRConfig] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    rtRw: "RT 05 RW 05",
    location: "Kelurahan Gayam, Mojoroto, Kediri",
    adminPassword: "123",
    citizenPassword: "55555*#",
    youtubeUrl: "https://youtube.com/",
    tiktokUrl: "https://tiktok.com/",
    instagramUrl: "https://instagram.com/",
    marqueeEnabled: true,
    marqueeText: "Selamat Datang di Portal Digital RT 05 RW 05 - Harmoni dalam Kebersamaan.",
    popupEnabled: false,
    qrCodeEnabled: false,
    qrCodeTitle: "QR Akses Warga",
    qrCodeImageUrl: "",
    // Integrasi Baru Jimpitan EmailJS
    ejs_internal_service: "service_1bi2tve",
    ejs_internal_public: "G8YgYy4vhj7B2Xw1E",
    ejs_jimpitan_template: "template_xjpqq8k",
    ejs_complaint_template: "",
    ejs_guest_service: "",
    ejs_guest_public: "",
    ejs_guest_template: "",
    ejs_letter_template: ""
  } as AppSettings));

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data().data;
        setSettings(cloudSettings);
        storage.updateLocal(STORAGE_KEYS.SETTINGS, cloudSettings);
      }
    });
    return () => unsub();
  }, []);

  const handleSaveSettings = async () => {
    setIsProcessing(true);
    try {
      await storage.set(STORAGE_KEYS.SETTINGS, settings);
      setShowSettings(false);
      setShowEmailConfig(false);
      setShowQRConfig(false);
      alert("Seluruh Konfigurasi Sistem Berhasil Disinkronkan ke Cloud!");
    } catch (e) {
      alert("Gagal menyimpan perubahan. Periksa koneksi internet Anda.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const currentUrls = settings.popupImageUrls || (settings.popupImageUrl ? [settings.popupImageUrl] : []);
      const newUrls = [...currentUrls];

      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            const optimized = await compressImage(reader.result as string, 800, 0.6);
            resolve(optimized);
          };
          reader.readAsDataURL(files[i]);
        });
        const url = await promise;
        newUrls.push(url);
      }

      setSettings(prev => ({ 
        ...prev, 
        popupImageUrls: newUrls,
        popupImageUrl: newUrls[0] 
      }));
      setIsCompressing(false);
    }
  };

  const handleQRFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await compressImage(reader.result as string, 600, 0.8);
        setSettings(prev => ({ ...prev, qrCodeImageUrl: optimized }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePopupImage = (index: number) => {
    const currentUrls = settings.popupImageUrls || [];
    const newUrls = currentUrls.filter((_, i) => i !== index);
    setSettings({
      ...settings,
      popupImageUrls: newUrls,
      popupImageUrl: newUrls.length > 0 ? newUrls[0] : ""
    });
  };

  const managementItems = [
    ...MASTER_SERVICES.filter(s => s.category === 'Administrasi' || s.category === 'Layanan').map(s => ({
      ...s,
      sub: s.id === Page.RESIDENTS ? 'Database Kependudukan' : 'Verifikasi & Validasi'
    })),
    { id: Page.RESIDENTS, label: 'Data Warga', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197', color: 'bg-blue-600', sub: 'Master Database Penduduk' },
    { id: Page.CLOUD_SETTINGS, label: 'Sinkronisasi Sistem', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12', color: 'bg-indigo-600', sub: 'Cadangan & Pemulihan Data' }
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);

  if (showQRConfig) {
    return (
      <div className="space-y-6 px-5 py-6 animate-page-enter pb-32">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowQRConfig(false)} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Konfigurasi QR</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pintu Akses Digital</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[56px] border border-slate-100 shadow-2xl space-y-8">
           <div className="flex items-center justify-between bg-slate-50 p-6 rounded-[32px] border border-slate-100">
              <div className="space-y-1">
                 <h4 className="text-sm font-black text-slate-800 uppercase">Tampilkan di Login</h4>
                 <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Toggle Visibilitas QR</p>
              </div>
              <button onClick={() => setSettings({...settings, qrCodeEnabled: !settings.qrCodeEnabled})} className={`w-14 h-7 rounded-full transition-all relative ${settings.qrCodeEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings.qrCodeEnabled ? 'left-8' : 'left-1'}`}></div>
              </button>
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Label QR Code</label>
              <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 font-bold outline-none" value={settings.qrCodeTitle || ''} onChange={e => setSettings({...settings, qrCodeTitle: e.target.value})} placeholder="Contoh: QR WiFi atau QR Bayar" />
           </div>

           <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Visual QR Code</label>
              <div 
                onClick={() => qrFileInputRef.current?.click()}
                className="aspect-square w-full max-w-[250px] mx-auto border-4 border-dashed border-slate-100 rounded-[44px] flex items-center justify-center bg-slate-50 cursor-pointer overflow-hidden relative group hover:border-indigo-400 transition-all"
              >
                {isCompressing ? (
                   <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                ) : settings.qrCodeImageUrl ? (
                   <>
                      <img src={settings.qrCodeImageUrl} className="w-full h-full object-contain p-8 bg-white" alt="QR" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                         <span className="text-white text-[10px] font-black uppercase tracking-widest">Ganti QR</span>
                      </div>
                   </>
                ) : (
                   <div className="text-center space-y-2 opacity-30">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={2}/></svg>
                      <p className="text-[10px] font-black uppercase">Unggah QR</p>
                   </div>
                )}
              </div>
              <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleQRFileChange} />
           </div>

           <button onClick={handleSaveSettings} disabled={isProcessing} className="w-full bg-slate-950 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
              {isProcessing ? 'SINKRONISASI...' : 'Simpan Konfigurasi QR'}
           </button>
        </div>
      </div>
    );
  }

  if (showEmailConfig) {
    return (
      <div className="space-y-6 px-5 py-6 animate-page-enter pb-32">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowEmailConfig(false)} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Integrasi EmailJS</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Jalur Notifikasi</p>
          </div>
        </div>

        <div className="space-y-8 bg-white p-8 rounded-[56px] border border-slate-100 shadow-2xl overflow-y-auto max-h-[85vh] no-scrollbar pb-20">
          
          {/* AKUN A: INTERNAL (JIMPTIAN & ADUAN) */}
          <div className="space-y-6 bg-indigo-50/50 p-8 rounded-[40px] border border-indigo-100 shadow-inner">
             <div className="flex items-center gap-4 border-b border-indigo-200 pb-4">
                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl">🏠</div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kategori A (Internal)</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Satu ID untuk Iuran & Aduan</p>
                </div>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-2">Service ID</label>
                      <input type="text" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.ejs_internal_service || ''} onChange={e => setSettings({...settings, ejs_internal_service: e.target.value})} placeholder="service_xxxx" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-indigo-400 uppercase tracking-widest ml-2">Public Key</label>
                      <input type="text" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" value={settings.ejs_internal_public || ''} onChange={e => setSettings({...settings, ejs_internal_public: e.target.value})} placeholder="user_xxxx" />
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Template ID: Iuran Jimpitan</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.ejs_jimpitan_template || ''} onChange={e => setSettings({...settings, ejs_jimpitan_template: e.target.value})} placeholder="template_iuran" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Template ID: Laporan Aduan</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.ejs_complaint_template || ''} onChange={e => setSettings({...settings, ejs_complaint_template: e.target.value})} placeholder="template_aduan" />
                   </div>
                </div>
             </div>
          </div>

          {/* AKUN B: LAYANAN (TAMU & SURAT) */}
          <div className="space-y-6 bg-amber-50/50 p-8 rounded-[40px] border border-amber-100 shadow-inner">
             <div className="flex items-center gap-4 border-b border-amber-200 pb-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg text-xl">📄</div>
                <div>
                   <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Kategori B (Layanan)</h4>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Buku Tamu & Persuratan</p>
                </div>
             </div>
             <div className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest ml-2">Service ID</label>
                      <input type="text" className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" value={settings.ejs_guest_service || ''} onChange={e => setSettings({...settings, ejs_guest_service: e.target.value})} placeholder="service_yyyy" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest ml-2">Public Key</label>
                      <input type="text" className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-xs font-bold focus:ring-2 focus:ring-amber-500 outline-none" value={settings.ejs_guest_public || ''} onChange={e => setSettings({...settings, ejs_guest_public: e.target.value})} placeholder="user_yyyy" />
                   </div>
                </div>
                <div className="grid grid-cols-1 gap-4 pt-2">
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Template ID: Buku Tamu</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.ejs_guest_template || ''} onChange={e => setSettings({...settings, ejs_guest_template: e.target.value})} placeholder="template_tamu" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-2">Template ID: Surat Pengantar</label>
                      <input type="text" className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" value={settings.ejs_letter_template || ''} onChange={e => setSettings({...settings, ejs_letter_template: e.target.value})} placeholder="template_surat" />
                   </div>
                </div>
             </div>
          </div>

          <div className="pt-4">
             <button onClick={handleSaveSettings} disabled={isProcessing} className="w-full bg-slate-950 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
                {isProcessing ? 'SINKRONISASI...' : 'Simpan Seluruh Konfigurasi'}
             </button>
             <p className="text-[8px] text-center text-slate-400 font-bold uppercase mt-6 leading-relaxed italic">
               Note: Menggunakan satu Service ID untuk beberapa template sangat disarankan untuk efisiensi limit pengiriman email harian Anda.
             </p>
          </div>
        </div>
      </div>
    );
  }

  if (showSettings) {
    return (
      <div className="space-y-6 px-5 py-6 animate-page-enter pb-32">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowSettings(false)} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Konfigurasi Master</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Kendali Pusat</p>
          </div>
        </div>

        <div className="space-y-10 bg-white p-8 rounded-[56px] border border-slate-100 shadow-2xl overflow-y-auto max-h-[85vh] pb-20 no-scrollbar">
          
          {/* SEKSI 01: IDENTITAS & KEAMANAN */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-black text-xs">01</div>
              <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Identitas & Akses</h4>
            </div>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Nama Unit / RT RW</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-black text-slate-800" value={settings.rtRw} onChange={(e) => setSettings({...settings, rtRw: e.target.value})} placeholder="RT 05 RW 05" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">Motto Lingkungan</label>
                <input type="text" className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-600" value={settings.motto} onChange={(e) => setSettings({...settings, motto: e.target.value})} placeholder="Motto RT..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-rose-600 ml-2">Sandi Admin</label>
                  <input type="text" className="w-full bg-rose-50 border-none rounded-2xl py-4 px-6 font-black text-rose-600" value={settings.adminPassword} onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-blue-600 ml-2">Sandi Warga</label>
                  <input type="text" className="w-full bg-blue-50 border-none rounded-2xl py-4 px-6 font-black text-blue-600" value={settings.citizenPassword} onChange={(e) => setSettings({...settings, citizenPassword: e.target.value})} />
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI 02: PAPAN INFORMASI DIGITAL */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center font-black text-xs">02</div>
              <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Papan Informasi</h4>
            </div>
            <div className="space-y-6">
              {/* Marquee Settings */}
              <div className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase text-slate-500">Teks Berjalan (Marquee)</label>
                   <button onClick={() => setSettings({...settings, marqueeEnabled: !settings.marqueeEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${settings.marqueeEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.marqueeEnabled ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
                <textarea className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-bold outline-none" rows={2} value={settings.marqueeText} onChange={e => setSettings({...settings, marqueeText: e.target.value})} placeholder="Teks pengumuman berjalan..." />
              </div>
              
              {/* Popup Settings */}
              <div className="p-6 bg-indigo-50/50 rounded-[32px] border border-indigo-100 space-y-4">
                <div className="flex items-center justify-between">
                   <label className="text-[10px] font-black uppercase text-indigo-600">Banner Popup Utama</label>
                   <button onClick={() => setSettings({...settings, popupEnabled: !settings.popupEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${settings.popupEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.popupEnabled ? 'left-7' : 'left-1'}`}></div>
                   </button>
                </div>
                <input type="text" className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-3 text-xs font-bold" placeholder="Judul Popup" value={settings.popupTitle} onChange={e => setSettings({...settings, popupTitle: e.target.value})} />
                <textarea className="w-full bg-white border border-indigo-100 rounded-xl p-4 text-xs font-bold" rows={2} placeholder="Isi Pesan Popup" value={settings.popupText} onChange={e => setSettings({...settings, popupText: e.target.value})} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[9px] font-black uppercase text-indigo-400">Media Visual Popup (Multi-Foto)</label>
                    <div className="flex items-center gap-2">
                       <span className="text-[8px] font-black text-indigo-400 uppercase">Auto-Scroll</span>
                       <button onClick={() => setSettings({...settings, popupAutoScroll: !settings.popupAutoScroll})} className={`w-8 h-4 rounded-full transition-all relative ${settings.popupAutoScroll ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${settings.popupAutoScroll ? 'left-4.5' : 'left-0.5'}`}></div>
                       </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                     {(settings.popupImageUrls || (settings.popupImageUrl ? [settings.popupImageUrl] : [])).map((url, idx) => (
                        <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden border-2 border-indigo-100 shadow-sm group">
                           <img src={url} className="w-full h-full object-cover" alt="" />
                           <button onClick={() => removePopupImage(idx)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center shadow-lg active:scale-90 transition-all opacity-0 group-hover:opacity-100">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                           </button>
                        </div>
                     ))}
                     
                     <div 
                        onClick={() => !isCompressing && fileInputRef.current?.click()}
                        className={`aspect-video border-4 border-dashed rounded-[24px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50`}
                      >
                         {isCompressing ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="w-6 h-6 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                         ) : (
                           <div className="text-center space-y-1">
                              <svg className="w-6 h-6 text-slate-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                              <p className="text-[8px] font-black uppercase text-slate-300">Tambah Foto</p>
                           </div>
                         )}
                      </div>
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </div>
              </div>
            </div>
          </div>

          {/* SEKSI 03: KONTAK PEJABAT & MEDIA */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center font-black text-xs">03</div>
              <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-widest">Kontak & Media</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" placeholder="YouTube URL" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.youtubeUrl} onChange={e => setSettings({...settings, youtubeUrl: e.target.value})} />
              <input type="text" placeholder="TikTok URL" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.tiktokUrl} onChange={e => setSettings({...settings, tiktokUrl: e.target.value})} />
              <input type="text" placeholder="Instagram URL" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.instagramUrl} onChange={e => setSettings({...settings, instagramUrl: e.target.value})} />
              <input type="text" placeholder="Master Drive URL" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.archiveUrl} onChange={e => setSettings({...settings, archiveUrl: e.target.value})} />
              <input type="email" placeholder="Email Ketua RT" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.chairmanEmail} onChange={e => setSettings({...settings, chairmanEmail: e.target.value})} />
              <input type="email" placeholder="Email Sekretaris" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.secretaryEmail} onChange={e => setSettings({...settings, secretaryEmail: e.target.value})} />
              <input type="email" placeholder="Email Keamanan" className="w-full bg-slate-50 rounded-xl px-4 py-3 text-xs font-bold" value={settings.securityEmail} onChange={e => setSettings({...settings, securityEmail: e.target.value})} />
            </div>
          </div>

          <div className="pt-6">
             <button onClick={handleSaveSettings} disabled={isProcessing} className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">
                {isProcessing ? 'Menyinkronkan Cloud...' : 'Simpan Seluruh Perubahan'}
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
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {managementItems.map(item => (
          <button key={item.id} onClick={() => onNavigate(item.id)} className="bg-white border border-slate-50 p-7 rounded-[40px] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left">
            <div className={`${item.color} w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={item.icon} /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-lg leading-tight">{item.label}</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">{item.sub}</p>
            </div>
          </button>
        ))}

        {/* MENU: PENGATURAN QR Akses */}
        <button onClick={() => setShowQRConfig(true)} className="bg-white border border-slate-50 p-7 rounded-[40px] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left">
            <div className="bg-amber-500 w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v1c0 1-1 2-2 2H8c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2zM15 15v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-1c0-1 1-2 2-2h2c1 0 2 1 2 2zM4 15v1c0 1-1 2-2 2H1c-1 0-2-1-2-2v-1c0-1 1-2 2-2h1c1 0 2 1 2 2zM21 4v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2z" strokeWidth={2.5} /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-lg leading-tight">Pengaturan QR Code</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Manajemen QR Akses Login</p>
            </div>
        </button>

        <button onClick={() => setShowEmailConfig(true)} className="bg-white border border-slate-50 p-7 rounded-[40px] flex items-center gap-6 shadow-sm active:scale-[0.98] transition-all text-left">
            <div className="bg-indigo-600 w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-lg">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" strokeWidth={2.5} /></svg>
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-800 text-lg leading-tight">Integrasi EmailJS</h4>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1.5">Dual Akun Notifikasi Email</p>
            </div>
        </button>

        <button onClick={() => setShowSettings(true)} className="bg-slate-950 p-8 rounded-[44px] flex items-center gap-6 shadow-2xl active:scale-[0.98] transition-all text-left text-white mt-6 border border-white/10">
          <div className="bg-white/10 w-16 h-16 rounded-[22px] flex items-center justify-center text-white shrink-0 shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
          </div>
          <div className="flex-1">
            <h4 className="font-black text-lg uppercase tracking-tight leading-none">Konfigurasi Master</h4>
            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest mt-2">Sandi, Marquee, Medsos & Kontak</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
