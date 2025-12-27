
import React from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { AppSettings, Page } from '../types';

interface WelcomeScreenProps {
  onStart: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onStart }) => {
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
    location: "Kel. Gayam, Kec. Mojoroto, Kota Kediri",
    chairmanPhone: "08123456789",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id",
    popupEnabled: true
  });

  const kediriLogo = "https://upload.wikimedia.org/wikipedia/commons/c/c1/Logo_Kota_Kediri_-_Seal_of_Kediri_City.svg";

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-between pb-12 animate-page-enter">
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        
        /* Animasi kilauan cahaya dari KANAN ke KIRI */
        @keyframes textShine {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }

        /* Animasi Tombol: Membesar-Mengecil perlahan */
        @keyframes buttonBreath {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }

        /* Animasi Cahaya Menyapu Tombol */
        @keyframes btnShineSweep {
          0% { left: -100%; }
          20% { left: 100%; }
          100% { left: 100%; }
        }

        /* Animasi Bayangan Berdenyut */
        @keyframes shadowPulse {
          0% { box-shadow: 0 0 0 0 rgba(0, 119, 182, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(0, 119, 182, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 119, 182, 0); }
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float 4.5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .text-shine {
          background: linear-gradient(
            to right, 
            #ffffff 20%, 
            #bfdbfe 40%, 
            #ffffff 60%, 
            #ffffff 80%
          );
          background-size: 200% auto;
          color: white;
          background-clip: text;
          text-fill-color: transparent;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShine 3s linear infinite;
        }

        .sub-text-shine {
          background: linear-gradient(
            to right, 
            rgba(255,255,255,0.6) 20%, 
            rgba(255,255,255,1) 40%, 
            rgba(255,255,255,0.6) 60%, 
            rgba(255,255,255,0.6) 80%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShine 4s linear infinite;
          animation-delay: 1s;
        }

        .logo-glow {
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.15);
        }

        .cta-button {
          position: relative;
          overflow: hidden;
          animation: buttonBreath 3s ease-in-out infinite, shadowPulse 2s infinite;
        }

        .cta-button::after {
          content: "";
          position: absolute;
          top: -50%;
          left: -100%;
          width: 50%;
          height: 200%;
          background: linear-gradient(
            to right,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transform: rotate(25deg);
          animation: btnShineSweep 4s infinite;
        }
      `}</style>

      {/* Hero Section */}
      <div className="w-full relative h-[45vh] bg-[#0077b6] rounded-b-[60px] flex flex-col items-center justify-center p-8 text-white overflow-hidden shadow-2xl">
        {/* Abstract shapes */}
        <div className="absolute top-[-50px] left-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-50px] right-[-50px] w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        
        <div className="z-10 flex flex-col items-center gap-8 text-center">
          <div className="flex items-center gap-6">
             {/* Logo Kota Kediri dengan Animasi Float */}
             <div className="animate-float">
                <img src={kediriLogo} alt="Logo Kota Kediri" className="w-20 h-20 object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)]" />
             </div>
             
             <div className="h-12 w-[1.5px] bg-white/30 rounded-full"></div>
             
             {/* Icon SiRT dengan Animasi Float Delayed */}
             <div className="animate-float-delayed bg-white p-4 rounded-[28px] shadow-2xl logo-glow">
               <span className="text-[#0077b6] text-2xl font-black tracking-tighter">SiRT</span>
             </div>
          </div>
          
          <div className="space-y-2">
            {/* Teks Si RT dengan Efek Cahaya Bergerak Kanan ke Kiri */}
            <h1 className="text-5xl font-black tracking-tighter leading-none uppercase text-shine">Si RT</h1>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] sub-text-shine">Sistem Informasi Rukun Tetangga</p>
          </div>
          
          <div className="bg-white/15 backdrop-blur-xl px-8 py-2.5 rounded-full border border-white/20 shadow-inner">
             <p className="text-sm font-black italic tracking-wide">"{settings.motto}"</p>
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
          <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-[36px] border border-gray-100 transition-all hover:bg-white hover:shadow-2xl hover:border-transparent group cursor-default">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 text-base">Transparansi Keuangan</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">Pantau pemasukan dan pengeluaran kas lingkungan secara real-time demi akuntabilitas publik.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-[36px] border border-gray-100 transition-all hover:bg-white hover:shadow-2xl hover:border-transparent group cursor-default">
            <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 text-base">Warta Warga Digital</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">Dapatkan informasi pengumuman, berita kegiatan, dan galeri momen warga langsung di ponsel Anda.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-gray-50 rounded-[36px] border border-gray-100 transition-all hover:bg-white hover:shadow-2xl hover:border-transparent group cursor-default">
            <div className="w-14 h-14 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-500">
              <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" /></svg>
            </div>
            <div>
              <h4 className="font-black text-gray-800 text-base">YouTube RT Resmi</h4>
              <p className="text-[11px] text-gray-500 font-medium leading-relaxed mt-0.5">Dokumentasi video kegiatan warga yang terintegrasi untuk menjaga memori kebersamaan.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="w-full max-w-md px-8 pt-4">
        <button 
          onClick={onStart}
          className="cta-button w-full bg-[#0077b6] text-white py-6 rounded-[32px] font-black text-xl shadow-2xl shadow-blue-500/40 active:scale-95 transition-all flex items-center justify-center gap-4 group"
        >
          Masuk ke Aplikasi
          <svg className="w-7 h-7 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </button>
        <div className="mt-8 flex flex-col items-center gap-2 text-center">
           <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.4em]">Harmoni Kota Kediri</p>
           <p className="text-[9px] text-gray-300 font-medium uppercase tracking-widest opacity-60">© 2026 Pengurus RT 05 RW 05 Gayam - Mojoroto</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
