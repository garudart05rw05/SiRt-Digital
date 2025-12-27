
import React, { useState, useEffect, useRef } from 'react';
import { Page, UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
  role: UserRole;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onPageChange, role, onLogout }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {}));
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data().data);
      }
    });

    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
      unsubSettings();
    };
  }, []);

  // AUTO-SCROLL TO TOP ON PAGE CHANGE
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activePage]);

  const getStorageKeyForPage = (page: Page | string): string | null => {
    const map: Record<string, string> = {
      [Page.FINANCE]: STORAGE_KEYS.FINANCE,
      [Page.NEWS]: STORAGE_KEYS.NEWS,
      [Page.GALLERY]: STORAGE_KEYS.GALLERY,
      [Page.RESIDENTS]: STORAGE_KEYS.RESIDENTS,
      [Page.COMPLAINTS]: STORAGE_KEYS.COMPLAINTS,
      [Page.GUESTBOOK]: STORAGE_KEYS.GUESTBOOK,
      [Page.LETTERS]: STORAGE_KEYS.LETTERS,
      [Page.JIMPITAN]: STORAGE_KEYS.JIMPITAN_LOGS,
      [Page.SOLIDARITAS]: STORAGE_KEYS.SOLIDARITAS_LOGS,
      [Page.INVENTORY]: STORAGE_KEYS.INVENTORY,
      [Page.MINUTES]: STORAGE_KEYS.MINUTES,
    };
    return map[page] || null;
  };

  const checkNotifs = () => {
    const pagesToTrack = [
      Page.FINANCE, Page.NEWS, Page.GALLERY, Page.RESIDENTS, 
      Page.COMPLAINTS, Page.GUESTBOOK, Page.LETTERS, 
      Page.JIMPITAN, Page.SOLIDARITAS, Page.INVENTORY, Page.MINUTES
    ];
    
    const newNotifs: Record<string, boolean> = {};
    pagesToTrack.forEach(page => {
      const storageKey = getStorageKeyForPage(page);
      if (storageKey) {
        const data = storage.get<any[]>(storageKey, []);
        const currentCount = (data || []).length;
        const lastCount = Number(localStorage.getItem(`last_count_${storageKey}`) || 0);
        newNotifs[page] = currentCount > lastCount;
      }
    });
    setNotifs(newNotifs);
  };

  useEffect(() => {
    checkNotifs();
    window.addEventListener('storage_updated', checkNotifs);
    return () => window.removeEventListener('storage_updated', checkNotifs);
  }, []);

  useEffect(() => {
    const storageKey = getStorageKeyForPage(activePage);
    if (storageKey) {
      const data = storage.get<any[]>(storageKey, []);
      localStorage.setItem(`last_count_${storageKey}`, (data || []).length.toString());
      checkNotifs();
    }
  }, [activePage]);

  const handleNavClick = (page: Page) => {
    onPageChange(page);
  };

  const navItems = [
    { id: Page.DASHBOARD, label: 'Beranda', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: Page.FINANCE, label: 'Kas RT', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
    { id: Page.NEWS, label: 'Warta', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
    { id: Page.GALLERY, label: 'Galeri', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16' },
    role === 'ADMIN' 
      ? { id: Page.ADMIN_PANEL, label: 'Admin', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
      : { id: Page.STATISTICS, label: 'Data', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' }
  ];

  const hasTabNotif = (pageId: Page) => {
    if (pageId === Page.ADMIN_PANEL) {
      return [Page.RESIDENTS, Page.COMPLAINTS, Page.GUESTBOOK, Page.LETTERS, Page.JIMPITAN, Page.SOLIDARITAS, Page.INVENTORY, Page.MINUTES]
        .some(p => notifs[p]);
    }
    return notifs[pageId];
  };

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] max-w-2xl mx-auto border-x border-slate-100 shadow-2xl overflow-hidden relative">
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 flex flex-col z-[100] no-print">
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0077b6] rounded-xl flex items-center justify-center text-white shadow-lg">
              <span className="text-[10px] font-black tracking-tighter">SiRT</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-[11px] font-black text-slate-800 uppercase tracking-widest leading-none">Digital Pro</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-50 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">
                  {role} • {isOnline ? 'Sistem Aktif' : 'Mode Offline'}
                </span>
              </div>
            </div>
          </div>

          <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 px-4 py-2 rounded-2xl transition-all active:scale-95 group"
          >
            <span className="text-[9px] font-black uppercase tracking-widest">Selesai</span>
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

        {settings.marqueeEnabled && settings.marqueeText && (
          <div className="bg-indigo-50 border-t border-indigo-100 py-2.5 px-4 flex items-center gap-3 overflow-hidden">
             <div className="shrink-0 bg-indigo-600 text-white p-1 rounded-md shadow-sm z-10">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
             </div>
             <div className="marquee-container flex-1">
                <div className="marquee-content text-[10px] font-black uppercase tracking-widest text-indigo-700">
                   {settings.marqueeText} • {settings.marqueeText} • {settings.marqueeText}
                </div>
             </div>
          </div>
        )}
      </header>

      <main ref={mainRef} className="flex-1 overflow-y-auto page-enter pb-32 no-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-2xl bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 px-2 z-[90] shadow-[0_-10px_25px_rgba(0,0,0,0.05)] no-print">
        {navItems.map((item: any) => {
          const isActive = activePage === item.id;
          const showDot = hasTabNotif(item.id);
          
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all flex-1 relative ${
                isActive ? 'text-[#0077b6]' : 'text-slate-300'
              }`}
            >
              {showDot && !isActive && (
                <div className="absolute top-2 right-[30%] w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white shadow-sm z-30 animate-pulse"></div>
              )}
              <div className={`p-2 rounded-2xl transition-all ${isActive ? 'bg-blue-50 scale-110 shadow-inner' : 'hover:bg-slate-50'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isActive ? 3 : 2} d={item.icon} />
                </svg>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.1em] ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Layout;
