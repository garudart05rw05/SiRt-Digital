
import React from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { Resident, AppSettings } from '../types.ts';

const MyProfilePage: React.FC = () => {
  const residents = storage.get<Resident[]>(STORAGE_KEYS.RESIDENTS, []);
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
  
  // Ambil data pertama sebagai contoh (di sistem nyata ini data login)
  const myData = residents[0] || {
    name: 'Budi Santoso',
    gender: 'Laki-laki',
    kkNumber: '3201012345678901',
    houseNumber: 'A-01',
    phone: '08123456789',
    status: 'Aktif',
    dateOfBirth: '1985-05-15'
  };

  return (
    <div className="space-y-8 px-5 py-6 pb-24 animate-page-enter">
      <div className="text-center space-y-1">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Kartu Digital</h2>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Identitas Warga Terdaftar</p>
      </div>

      <div className="bg-[#0077b6] rounded-[44px] p-1 shadow-2xl overflow-hidden relative group">
        <div className="bg-white/10 p-8 flex justify-between items-start text-white">
          <div className="space-y-1">
             <h4 className="text-2xl font-black">SiRT Digital ID</h4>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">{settings.rtRw}</p>
          </div>
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-[#0077b6] font-black text-xl shadow-lg">
             {myData.name.charAt(0)}
          </div>
        </div>

        <div className="bg-white m-1 rounded-[40px] p-8 space-y-8">
           <div className="flex justify-between items-start">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Nama Lengkap</p>
                 <p className="text-xl font-black text-slate-800">{myData.name}</p>
              </div>
              <div className="text-right space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">Status</p>
                 <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[9px] font-black uppercase">{myData.status}</span>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No. Rumah</p>
                 <p className="text-lg font-black text-slate-700">{myData.houseNumber}</p>
              </div>
              <div className="space-y-1">
                 <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest">No. KK (Tersembunyi)</p>
                 <p className="text-lg font-black text-slate-700">****{myData.kkNumber.slice(-4)}</p>
              </div>
           </div>

           <div className="pt-8 border-t border-slate-50 flex items-center justify-between">
              <div className="w-24 h-24 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center">
                 {/* QR Code Placeholder */}
                 <svg className="w-16 h-16 text-slate-200" fill="currentColor" viewBox="0 0 24 24"><path d="M3 3h8v8H3V3zm2 2v4h4V5H5zm8-2h8v8h-8V3zm2 2v4h4V5h-4zM3 13h8v8H3v-8zm2 2v4h4v-4H5zm13-2h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2zm3 3h3v2h-3v-2zm-3 0h2v2h-2v-2z" /></svg>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-black uppercase text-slate-300">Berlaku Selamanya Selama</p>
                 <p className="text-[9px] font-black uppercase text-slate-300">Masih Terdaftar di {settings.rtRw}</p>
              </div>
           </div>
        </div>
        
        {/* Animated Shine Effect */}
        <div className="absolute top-0 -inset-full h-full w-1/2 z-20 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-20 animate-shine"></div>
      </div>

      <div className="bg-slate-50 p-8 rounded-[44px] border border-slate-100 space-y-4">
         <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">Aksi Identitas</h4>
         <div className="grid grid-cols-2 gap-3">
            <button className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
               <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" strokeWidth={2.5}/></svg>
               <span className="text-[9px] font-black uppercase">Simpan PDF</span>
            </button>
            <button className="bg-white border border-slate-200 p-4 rounded-3xl flex flex-col items-center gap-2 active:scale-95 transition-all">
               <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth={2.5}/></svg>
               <span className="text-[9px] font-black uppercase">Koreksi Data</span>
            </button>
         </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
