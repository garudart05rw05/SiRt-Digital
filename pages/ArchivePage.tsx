
import React from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { AppSettings } from '../types.ts';

const ArchivePage: React.FC = () => {
  // Added missing popupEnabled to AppSettings default value
  const settings = storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    youtubeUrl: "https://youtube.com/@rukuntetangga-i3k",
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

  const archiveCategories = [
    { key: 'archiveNotulenUrl', title: 'Notulen Rapat', desc: 'Catatan hasil musyawarah warga mingguan/bulanan.', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'archiveEdaranUrl', title: 'Surat Edaran', desc: 'Pengumuman resmi dari Kelurahan atau RW.', icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
    { key: 'archiveKeuanganUrl', title: 'Laporan Keuangan', desc: 'Arsip detail pengeluaran kas dalam bentuk PDF/Excel.', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { key: 'archivePerdaUrl', title: 'Peraturan Daerah', desc: 'Kumpulan regulasi resmi dari Pemerintah Daerah.', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
    { key: 'archiveLainnyaUrl', title: 'Dokumen Lainnya', desc: 'Arsip pendukung lainnya yang berkaitan dengan lingkungan.', icon: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z' }
  ];

  const handleOpenLink = (urlKey: string) => {
    const url = (settings as any)[urlKey] || settings.archiveUrl;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-[#0077b6] rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Arsip Digital</h2>
            <p className="text-sm opacity-70 font-medium mt-2">Pusat dokumentasi dan keterbukaan informasi {settings.rtRw}.</p>
          </div>
          <button 
            onClick={() => window.open(settings.archiveUrl, '_blank')}
            className="w-full bg-white text-[#0077b6] py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
            Buka Folder Cloud
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-4">
        <div className="px-2 flex items-center justify-between">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih Kategori Dokumen</h3>
            <span className="text-[9px] text-slate-300 font-bold italic">Admin Terverifikasi</span>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {archiveCategories.map((cat, i) => (
            <button 
              key={i} 
              onClick={() => handleOpenLink(cat.key)}
              className="bg-white border border-slate-100 p-6 rounded-[32px] flex items-start gap-5 shadow-sm hover:shadow-md hover:border-blue-100 transition-all active:scale-[0.98] text-left group"
            >
              <div className="w-12 h-12 bg-blue-50 text-[#0077b6] rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={cat.icon} /></svg>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-slate-800 text-base">{cat.title}</h4>
                  <svg className="w-5 h-5 text-slate-200 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">{cat.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 p-8 rounded-[40px] border border-dashed border-slate-200 text-center">
        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] leading-loose">
          Semua dokumen yang diunggah telah melalui proses verifikasi Sekretaris RT dan bersifat resmi untuk publikasi warga.
        </p>
      </div>
    </div>
  );
};

export default ArchivePage;
