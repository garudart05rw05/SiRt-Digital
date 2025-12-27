
import React, { useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { AppSettings } from '../types.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const SocialMediaPage: React.FC = () => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    youtubeUrl: "https://youtube.com/",
    tiktokUrl: "https://tiktok.com/",
    instagramUrl: "https://instagram.com/",
    rtRw: "RT 05 RW 05"
  } as AppSettings));

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data().data);
      }
    });
    return () => unsub();
  }, []);

  const socials = [
    {
      id: 'tiktok',
      name: 'TikTok Resmi',
      username: (settings.tiktokUrl || '').includes('@') ? '@' + settings.tiktokUrl.split('@')[1] : 'rt_official',
      url: settings.tiktokUrl || 'https://tiktok.com/',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 2.89 3.5 2.53 1.53-.3 2.7-1.71 2.73-3.26.04-2.79.02-5.58.03-8.37V0l.04.02z"/>
        </svg>
      ),
      color: 'bg-black',
      hover: 'hover:shadow-indigo-500/50'
    },
    {
      id: 'instagram',
      name: 'Instagram RT',
      username: (settings.instagramUrl || '').includes('.com/') ? '@' + settings.instagramUrl.split('.com/')[1]?.replace('/', '') : 'rt_digital',
      url: settings.instagramUrl || 'https://instagram.com/',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" strokeWidth="2.5"/>
          <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" strokeWidth="2.5"/>
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" strokeWidth={3}/>
        </svg>
      ),
      color: 'bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600',
      hover: 'hover:shadow-pink-500/40'
    },
    {
      id: 'youtube',
      name: 'YouTube Channel',
      username: (settings.rtRw || 'RT 05') + ' Official',
      url: settings.youtubeUrl || 'https://youtube.com/',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
        </svg>
      ),
      color: 'bg-red-600',
      hover: 'hover:shadow-red-600/40'
    }
  ];

  return (
    <div className="space-y-8 px-5 py-6 pb-32 animate-page-enter">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Media Sosial Resmi</h2>
        <p className="text-sm text-slate-500 font-medium">Informasi & Dokumentasi Digital {settings.rtRw}</p>
      </div>

      <div className="flex flex-col gap-5">
        {socials.map((social) => (
          <button
            key={social.id}
            onClick={() => window.open(social.url, '_blank')}
            className={`w-full ${social.color} p-6 rounded-[40px] text-white flex items-center gap-6 shadow-xl transition-all active:scale-95 ${social.hover} group`}
          >
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md group-hover:rotate-12 transition-transform duration-500 shadow-inner">
              {social.icon}
            </div>
            <div className="text-left flex-1">
              <h4 className="text-lg font-black uppercase tracking-tight leading-none">{social.name}</h4>
              <p className="text-[10px] opacity-60 font-black mt-2 tracking-[0.2em] uppercase">{social.username}</p>
            </div>
            <div className="w-12 h-12 flex items-center justify-center bg-white/10 rounded-full">
               <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
               </svg>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[56px] border border-slate-50 shadow-sm text-center space-y-6">
        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto shadow-inner text-indigo-600">
           <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div className="space-y-2">
          <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Mari Berinteraksi</h4>
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed px-4">
            Jangan lewatkan update kegiatan kerja bakti, pengajian, dan momen warga lainnya. Aktifkan lonceng notifikasi pada kanal media sosial kami!
          </p>
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[44px] text-center border border-white/5">
         <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em]">SiRT Digital Pro System • Kediri Kota</p>
      </div>
    </div>
  );
};

export default SocialMediaPage;
