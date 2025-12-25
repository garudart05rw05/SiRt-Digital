
import React from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { AppSettings, Page } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
  // Added missing popupEnabled to AppSettings default value
  const settings = storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    youtubeUrl: "https://youtube.com/@rukuntetangga-i3k?si=QNxgcSiBEZGISfEh",
    tiktokUrl: "https://tiktok.com/@rt_digital_pro",
    instagramUrl: "https://instagram.com/rt_digital_pro",
    archiveUrl: "https://drive.google.com",
    archiveNotulenUrl: "https://drive.google.com",
    archiveEdaranUrl: "https://drive.google.com",
    archiveKeuanganUrl: "https://drive.google.com",
    archivePerdaUrl: "https://drive.google.com",
    archiveLainnyaUrl: "https://drive.google.com",
    rtRw: "RT 05 RW 05",
    location: "Kel. Gayam, Mojoroto, Kediri",
    chairmanPhone: "08123456789",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id",
    popupEnabled: true
  });

  const kediriLogo = "https://upload.wikimedia.org/wikipedia/commons/c/c1/Logo_Kota_Kediri_-_Seal_of_Kediri_City.svg";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between pb-12 animate-page-enter">
      {/* Hero Section */}
      <div className="w-full relative h-[45vh] bg-[#0077b6] rounded-b-[60px] flex flex-col items-center justify-center p-8 text-white overflow-hidden shadow-2xl">
        {/* Abstract shapes */}
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="z-10 flex flex-col items-center gap-6 text-center">
          <div className="flex items-center gap-4">
             <img src={kediriLogo} alt="Logo Kota Kediri" className="w-16 h-16 object-contain drop-shadow-md" />
             <div className="h-10 w-[1px] bg-white/30"></div>
             <div className="bg-white p-3 rounded-2xl shadow-xl">
               <span className="text-[#0077b6] text-xl font-black">SiRT</span>
             </div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-4xl font-black tracking-tight leading-none uppercase">Si RT</h1>
            <p className="text-xs font-bold opacity-80 uppercase tracking-[0.2em]">Sistem Informasi Rukun Tetangga</p>
          </div>
          
          <div className="bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30">
             <p className="text-sm font-black italic">"{settings.motto}"</p>
          </div>
        </div>
      </div>

      {/* Info Content */}
      <div className="flex-1 w-full max-w-md px-8 py-10 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-black text-gray-900 leading-tight">Selamat Datang di Portal Lingkungan {settings.rtRw}</h2>
          <p className="text-sm text-gray-500 font-medium">{settings.location}</p>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-[32px] border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:border-transparent group">
            <div className="w-12 h-12 bg-green-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800">Transparansi Keuangan</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Pantau pemasukan dan pengeluaran kas lingkungan secara real-time demi akuntabilitas publik.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-[32px] border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:border-transparent group">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800">Warta Warga Digital</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Dapatkan informasi pengumuman, berita kegiatan, dan galeri momen warga langsung di ponsel Anda.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-[32px] border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:border-transparent group">
            <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800">YouTube RT Resmi</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed">Dokumentasi video kegiatan warga yang terintegrasi untuk menjaga memori kebersamaan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full max-w-md px-8 pt-4">
        <button 
          onClick={onStart}
          className="w-full bg-[#0077b6] text-white py-5 rounded-[28px] font-black text-lg shadow-xl shadow-blue-500/30 active:scale-95 transition-all flex items-center justify-center gap-3"
        >
          Masuk ke Aplikasi
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </button>
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
           <p className="text-[9px] text-gray-300 font-bold uppercase tracking-[0.3em]">Harmoni Kota Kediri</p>
           <p className="text-[8px] text-gray-400 font-medium uppercase tracking-widest opacity-60">© 2026 Pengurus RT 05 RW 05 Gayam - Mojoroto</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
