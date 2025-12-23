
import React, { useState, useRef } from 'react';
import { Page, AppSettings, MASTER_SERVICES } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

interface AdminPanelProps {
  onNavigate: (page: Page) => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onNavigate }) => {
  const [showSettings, setShowSettings] = useState(false);
  const popupImageInputRef = useRef<HTMLInputElement>(null);
  const [isCompresing, setIsCompressing] = useState(false);
  const [showPassAdmin, setShowPassAdmin] = useState(false);
  const [showPassCitizen, setShowPassCitizen] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    rtRw: "RT / RW",
    location: "Alamat belum diatur",
    chairmanPhone: "08123456789",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id",
    popupEnabled: false,
    popupTitle: "Selamat Datang di SiRT",
    popupText: "Pastikan data kependudukan Anda sudah terupdate.",
    popupImageUrl: "https://picsum.photos/seed/welcome/1200/600",
    chairmanName: "(Nama Ketua RT)",
    treasurerName: "(Nama Bendahara)",
    adminPassword: "123",
    citizenPassword: "55555*#",
    lurahName: "",
    lurahPhone: "",
    babinsaName: "",
    babinsaPhone: "",
    bhabinkamtibmasName: "",
    bhabinkamtibmasPhone: "",
    archiveUrl: "https://drive.google.com",
    youtubeUrl: "https://youtube.com",
    tiktokUrl: "https://tiktok.com",
    instagramUrl: "https://instagram.com"
  } as AppSettings));

  const handleSaveSettings = () => {
    try {
      storage.set(STORAGE_KEYS.SETTINGS, settings);
      setShowSettings(false);
      alert("Konfigurasi Sistem Berhasil Diperbarui!");
      window.location.reload(); 
    } catch (e) {
      alert("Gagal menyimpan! Pastikan ukuran data tidak melebihi kapasitas.");
    }
  };

  const clearOfficial = (role: 'lurah' | 'babinsa' | 'bhabin') => {
    if (role === 'lurah') setSettings({...settings, lurahName: '', lurahPhone: ''});
    if (role === 'babinsa') setSettings({...settings, babinsaName: '', babinsaPhone: ''});
    if (role === 'bhabin') setSettings({...settings, bhabinkamtibmasName: '', bhabinkamtibmasPhone: ''});
  };

  const handleMasterReset = () => {
    if (window.confirm("PERINGATAN: Seluruh data (Warga, Keuangan, Berita) akan dihapus PERMANEN dari browser ini. Lanjutkan?")) {
      localStorage.clear();
      alert("Sistem telah direset. Halaman akan dimuat ulang.");
      window.location.reload();
    }
  };

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 600;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
    });
  };

  const handlePopupImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setSettings(prev => ({ ...prev, popupImageUrl: compressed }));
        setIsCompressing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const managementItems = MASTER_SERVICES.map(s => ({
    ...s,
    sub: s.category === 'Layanan' ? 'Validasi input warga' : s.category === 'Administrasi' ? 'Update data kependudukan' : 'Publikasi konten warga'
  }));

  if (showSettings) {
    return (
      <div className="space-y-6 px-5 py-6 animate-page-enter pb-32">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setShowSettings(false)} className="w-12 h-12 flex items-center justify-center bg-slate-900 text-white rounded-2xl shadow-xl active:scale-90 transition-transform">
             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Konfigurasi</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pengaturan Identitas & Pejabat</p>
          </div>
        </div>

        <div className="space-y-6 bg-white p-8 rounded-[44px] border border-slate-100 shadow-2xl overflow-y-auto max-h-[75vh] pb-12 no-scrollbar">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-2">Nama Wilayah (RT/RW)</label>
            <input type="text" className="w-full bg-slate-900 text-white border-none rounded-2xl py-5 px-7 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg transition-all shadow-inner" value={settings.rtRw} onChange={(e) => setSettings({...settings, rtRw: e.target.value})} />
          </div>

          {/* Emergency Settings */}
          <div className="space-y-6 p-8 bg-orange-50 rounded-[40px] border border-orange-100 shadow-inner">
             <div className="flex items-center gap-3 border-b border-orange-200 pb-4 mb-4">
                <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2.5}/></svg>
                </div>
                <h4 className="text-[11px] font-black uppercase text-orange-600 tracking-[0.2em]">Sistem Darurat</h4>
             </div>
             
             <div className="space-y-2">
                <label className="text-[9px] font-black text-orange-400 uppercase tracking-widest ml-2">URL Aplikasi Panic Button</label>
                <input 
                  type="url" 
                  className="w-full bg-white border border-orange-100 rounded-2xl px-6 py-4 outline-none text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-orange-500" 
                  placeholder="https://panicbutton.example.com"
                  value={settings.panicButtonUrl} 
                  onChange={(e) => setSettings({...settings, panicButtonUrl: e.target.value})} 
                />
             </div>
          </div>

          {/* Keamanan Section */}
          <div className="space-y-6 p-8 bg-rose-50 rounded-[40px] border border-rose-100 shadow-inner">
             <div className="flex items-center gap-3 border-b border-rose-200 pb-4 mb-4">
                <div className="w-10 h-10 bg-rose-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeWidth={2.5}/></svg>
                </div>
                <h4 className="text-[11px] font-black uppercase text-rose-600 tracking-[0.2em]">Keamanan Akses</h4>
             </div>
             
             <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-rose-400 uppercase tracking-widest ml-2">Sandi Pengurus (Admin)</label>
                  <div className="relative">
                    <input 
                      type={showPassAdmin ? 'text' : 'password'}
                      className="w-full bg-white border border-rose-100 rounded-2xl px-6 py-4 outline-none text-sm font-black text-rose-600 shadow-sm focus:ring-2 focus:ring-rose-500 pr-12" 
                      value={settings.adminPassword} 
                      onChange={(e) => setSettings({...settings, adminPassword: e.target.value})} 
                    />
                    <button onClick={() => setShowPassAdmin(!showPassAdmin)} className="absolute right-4 top-4 text-rose-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={showPassAdmin ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"} strokeWidth={2}/></svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest ml-2">Sandi Portal Warga</label>
                  <div className="relative">
                    <input 
                      type={showPassCitizen ? 'text' : 'password'}
                      className="w-full bg-white border border-blue-100 rounded-2xl px-6 py-4 outline-none text-sm font-black text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500 pr-12" 
                      value={settings.citizenPassword} 
                      onChange={(e) => setSettings({...settings, citizenPassword: e.target.value})} 
                    />
                    <button onClick={() => setShowPassCitizen(!showPassCitizen)} className="absolute right-4 top-4 text-blue-200">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d={showPassCitizen ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18"} strokeWidth={2}/></svg>
                    </button>
                  </div>
                </div>
             </div>
          </div>

          {/* Pejabat Wilayah Section */}
          <div className="space-y-6 p-8 bg-indigo-50 rounded-[40px] border border-indigo-100 shadow-inner">
             <div className="flex items-center gap-3 border-b border-indigo-200 pb-4 mb-4">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeWidth={2}/></svg>
                </div>
                <h4 className="text-[11px] font-black uppercase text-indigo-600 tracking-[0.2em]">Pejabat Wilayah Terverifikasi</h4>
             </div>
             
             <div className="space-y-12">
                {/* Lurah Group */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between ml-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Kepala Kelurahan</p>
                      </div>
                      <button onClick={() => clearOfficial('lurah')} className="text-rose-500 text-[8px] font-black uppercase tracking-tighter hover:underline">Hapus Data</button>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <input type="text" placeholder="Nama Lengkap & Gelar" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-blue-500" value={settings.lurahName} onChange={(e) => setSettings({...settings, lurahName: e.target.value})} />
                      <div className="relative">
                        <input type="tel" placeholder="Nomor WA (Pusat Darurat)" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-black text-blue-600 shadow-sm focus:ring-2 focus:ring-blue-500 pr-12" value={settings.lurahPhone} onChange={(e) => setSettings({...settings, lurahPhone: e.target.value})} />
                        <div className="absolute right-4 top-4 text-emerald-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                      </div>
                   </div>
                </div>

                {/* Babinsa Group */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between ml-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Babinsa (TNI AD)</p>
                      </div>
                      <button onClick={() => clearOfficial('babinsa')} className="text-rose-500 text-[8px] font-black uppercase tracking-tighter hover:underline">Hapus Data</button>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <input type="text" placeholder="Nama Lengkap Babinsa" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-emerald-500" value={settings.babinsaName} onChange={(e) => setSettings({...settings, babinsaName: e.target.value})} />
                      <div className="relative">
                        <input type="tel" placeholder="Nomor WA Babinsa" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-black text-emerald-600 shadow-sm focus:ring-2 focus:ring-emerald-500 pr-12" value={settings.babinsaPhone} onChange={(e) => setSettings({...settings, babinsaPhone: e.target.value})} />
                        <div className="absolute right-4 top-4 text-emerald-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                      </div>
                   </div>
                </div>

                {/* Bhabinkamtibmas Group */}
                <div className="space-y-4">
                   <div className="flex items-center justify-between ml-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-800"></span>
                        <p className="text-[9px] font-black text-slate-800 uppercase tracking-widest">Bhabinkamtibmas (POLRI)</p>
                      </div>
                      <button onClick={() => clearOfficial('bhabin')} className="text-rose-500 text-[8px] font-black uppercase tracking-tighter hover:underline">Hapus Data</button>
                   </div>
                   <div className="grid grid-cols-1 gap-3">
                      <input type="text" placeholder="Nama Lengkap Bhabinkamtibmas" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-bold text-slate-800 shadow-sm focus:ring-2 focus:ring-slate-800" value={settings.bhabinkamtibmasName} onChange={(e) => setSettings({...settings, bhabinkamtibmasName: e.target.value})} />
                      <div className="relative">
                        <input type="tel" placeholder="Nomor WA Bhabinkamtibmas" className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-4 outline-none text-sm font-black text-slate-800 shadow-sm focus:ring-2 focus:ring-slate-800 pr-12" value={settings.bhabinkamtibmasPhone} onChange={(e) => setSettings({...settings, bhabinkamtibmasPhone: e.target.value})} />
                        <div className="absolute right-4 top-4 text-emerald-500"><svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></div>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="space-y-6 p-8 bg-blue-50 rounded-[40px] border border-blue-100 shadow-inner">
             <div className="flex items-center justify-between border-b border-blue-200 pb-4 mb-4">
                <h4 className="text-[11px] font-black uppercase text-blue-600 tracking-[0.2em]">Pop-up Pengumuman</h4>
                <button onClick={() => setSettings({...settings, popupEnabled: !settings.popupEnabled})} className={`w-14 h-8 rounded-full transition-all relative ${settings.popupEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${settings.popupEnabled ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>
             {settings.popupEnabled && (
               <div className="space-y-5 animate-page-enter">
                  <input type="text" className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 outline-none text-sm font-bold" value={settings.popupTitle} onChange={(e) => setSettings({...settings, popupTitle: e.target.value})} placeholder="Judul" />
                  <textarea rows={3} className="w-full bg-white border border-blue-100 rounded-xl px-4 py-3 outline-none text-sm font-medium resize-none" value={settings.popupText} onChange={(e) => setSettings({...settings, popupText: e.target.value})} placeholder="Pesan..." />
                  <div onClick={() => !isCompresing && popupImageInputRef.current?.click()} className="w-full aspect-video bg-white rounded-2xl border-2 border-dashed border-blue-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:bg-blue-100/50 transition-all shadow-sm">
                    {isCompresing ? <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div> : settings.popupImageUrl ? <img src={settings.popupImageUrl} className="w-full h-full object-cover" alt="" /> : <span className="text-[8px] font-black uppercase text-blue-400">Pilih Gambar</span>}
                  </div>
                  <input type="file" ref={popupImageInputRef} className="hidden" accept="image/*" onChange={handlePopupImageUpload} />
               </div>
             )}
          </div>

          <div className="pt-10 space-y-4">
             <button onClick={handleSaveSettings} disabled={isCompresing} className="w-full bg-indigo-600 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all active:scale-95">Simpan Perubahan Konfigurasi</button>
             <button onClick={handleMasterReset} className="w-full bg-rose-50 text-rose-500 py-4 rounded-[28px] font-black text-[9px] uppercase tracking-widest border border-rose-100">Reset Sistem & Hapus Data Lokal</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 pb-32">
      <div className="bg-indigo-600 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <p className="text-[10px] font-black opacity-70 uppercase tracking-[0.3em]">Administrator Lingkungan</p>
          <h2 className="text-3xl font-black leading-none tracking-tight text-white">Dashboard Kontrol 🛡️</h2>
          <p className="text-xs opacity-60 font-medium pt-2 leading-relaxed">Kelola identitas wilayah, pejabat, dan konten digital.</p>
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
            <p className="text-[10px] opacity-50 font-bold uppercase tracking-widest mt-1.5">Edit Data Pejabat & Info Wilayah</p>
          </div>
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
