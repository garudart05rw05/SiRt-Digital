
import React, { useState, useEffect } from 'react';
import { Page, UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activePage: Page;
  onPageChange: (page: Page) => void;
  role: UserRole;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activePage, onPageChange, role, onLogout }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  const navItems = [
    { id: Page.DASHBOARD, label: 'Beranda', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: Page.FINANCE, label: 'Kas RT', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2' },
    { id: Page.NEWS, label: 'Warta', icon: 'M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z' },
    { id: Page.GALLERY, label: 'Galeri', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16' },
    role === 'ADMIN' 
      ? { id: Page.ADMIN_PANEL, label: 'Admin', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' }
      : { id: Page.STATISTICS, label: 'Data', icon: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z' }
  ];

  return (
    <div className="flex flex-col h-screen bg-[#f8fafc] max-w-2xl mx-auto border-x border-slate-100 shadow-2xl overflow-hidden relative">
      <header className="px-5 py-4 flex items-center justify-between bg-white z-20 sticky top-0 border-b border-slate-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onPageChange(Page.DASHBOARD)}
            className="w-10 h-10 bg-[#0077b6] rounded-xl flex items-center justify-center text-white font-black text-xs cursor-pointer active:scale-95 transition-transform shadow-lg shadow-blue-500/20"
          >
            SiRT
          </div>
          {/* Minimalist Status Indicator */}
          <div className="flex items-center justify-center bg-slate-50 w-8 h-8 rounded-full border border-slate-100">
            <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'}`}></div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div 
            onClick={onLogout}
            className={`w-10 h-10 rounded-full flex flex-col items-center justify-center text-white font-black text-[10px] transition-all cursor-pointer active:scale-90 shadow-lg ${role === 'ADMIN' ? 'bg-red-600 shadow-red-500/30' : 'bg-[#0077b6] shadow-blue-500/30'}`}
          >
            <span className="leading-none">{role === 'ADMIN' ? 'ADM' : 'WRG'}</span>
            <span className="text-[6px] opacity-60">EXIT</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto page-enter pb-32 no-scrollbar">
        {children}
      </main>

      <nav className="fixed bottom-0 w-full max-w-2xl bg-white/80 backdrop-blur-xl border-t border-slate-100 flex justify-around py-4 px-2 z-[90] shadow-[0_-10px_25px_rgba(0,0,0,0.05)]">
        {navItems.map((item: any) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center gap-1.5 transition-all flex-1 ${
                isActive ? 'text-[#0077b6]' : 'text-slate-300'
              }`}
            >
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
