
import React from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { AppSettings } from '../types';

const CitizenPortal: React.FC = () => {
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

  return (
    <div className="space-y-6 px-5 py-2">
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-[32px] p-6 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-1">
          <p className="text-xs font-bold opacity-80 uppercase tracking-widest">Halo, Tetangga {settings.rtRw}!</p>
          <h2 className="text-2xl font-black">{settings.location.split(',')[0]} - {settings.location.split(',')[1]?.trim()} 👋</h2>
          <div className="flex gap-2 mt-4">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">{settings.location.split(',')[1]?.trim()}</span>
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold">Warga Aktif</span>
          </div>
        </div>
        <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
      </div>

      <div className="grid grid-cols-4 gap-4 py-2">
         {[
           { label: 'Lapor', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77-1.333.192 3 1.732 3z', color: 'bg-red-100 text-red-600' },
           { label: 'Kas RT', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2', color: 'bg-green-100 text-green-600' },
           { label: 'Darurat', icon: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', color: 'bg-orange-100 text-orange-600' },
           { label: 'Jadwal', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'bg-blue-100 text-blue-600' }
         ].map(action => (
           <div key={action.label} className="flex flex-col items-center gap-2">
             <div className={`${action.color} w-14 h-14 rounded-[22px] flex items-center justify-center shadow-sm`}>
               <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
               </svg>
             </div>
             <span className="text-[11px] font-bold text-gray-600">{action.label}</span>
           </div>
         ))}
      </div>

      <div 
        onClick={() => window.open(settings.youtubeUrl, '_blank')}
        className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 flex gap-4 items-center cursor-pointer hover:bg-gray-50 transition-colors"
      >
        <div className="w-12 h-12 rounded-2xl bg-red-600 shrink-0 flex items-center justify-center text-white">
           <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
             <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
           </svg>
        </div>
        <div className="flex-1 space-y-0.5">
          <h4 className="font-bold text-gray-900 leading-tight">YouTube Resmi {settings.rtRw}</h4>
          <p className="text-[11px] text-gray-400">Tonton video kegiatan terbaru kami</p>
        </div>
        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
           <path d="M9 5l7 7-7 7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      <div className="space-y-6">
        <h3 className="font-extrabold text-lg text-gray-900">Kabar Terbaru</h3>
        
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 flex gap-4 items-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 shrink-0 flex items-center justify-center overflow-hidden">
             <img src="https://picsum.photos/seed/news1/100/100" className="w-full h-full object-cover" alt="" />
          </div>
          <div className="flex-1 space-y-1">
            <span className="text-[10px] font-black uppercase text-indigo-600">Kegiatan</span>
            <h4 className="font-bold text-gray-900 leading-tight">Vaksinasi Booster Gratis di Balai RT</h4>
            <p className="text-[11px] text-gray-400">Besok, pukul 08:00 WIB</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-[32px] p-6 text-white flex items-center justify-between">
        <div className="space-y-1">
          <h4 className="font-bold">Ajak Tetangga Pakai Apps</h4>
          <p className="text-xs opacity-60">Dapatkan update RT lebih cepat!</p>
        </div>
        <button className="bg-gojek-green text-white px-4 py-2 rounded-full text-xs font-extrabold">Bagikan</button>
      </div>
    </div>
  );
};

export default CitizenPortal;
