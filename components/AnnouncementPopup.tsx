
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';

const AnnouncementPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    // Ambil settings terbaru
    const currentSettings = storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {});
    setSettings(currentSettings);

    // Logika: Muncul jika diaktifkan DAN belum pernah ditutup di sesi ini
    const wasShown = sessionStorage.getItem('rt_popup_shown');
    if (currentSettings.popupEnabled && !wasShown) {
      // Beri sedikit delay agar transisi halaman selesai dulu
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('rt_popup_shown', 'true');
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 no-print">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-fade-in"
        onClick={handleClose}
      ></div>

      {/* Popup Content */}
      <div className="relative bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.4)] animate-popup-in">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Image Area */}
        {settings.popupImageUrl && (
          <div className="w-full aspect-[4/3] relative overflow-hidden">
            <img 
              src={settings.popupImageUrl} 
              className="w-full h-full object-cover" 
              alt="Announcement" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
          </div>
        )}

        {/* Text Area */}
        <div className="p-10 pt-4 space-y-4 text-center">
          <div className="inline-flex bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2">
            Pemberitahuan Resmi
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
            {settings.popupTitle || 'Informasi Penting'}
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            {settings.popupText || 'Silakan cek informasi terbaru di papan warta digital.'}
          </p>
          
          <div className="pt-6">
            <button 
              onClick={handleClose}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
            >
              Saya Mengerti
            </button>
          </div>
        </div>

        {/* Small branding footer */}
        <div className="bg-slate-50 py-4 border-t border-slate-100 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SiRT Digital Pro System • {settings.rtRw}</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popup-in {
          from { opacity: 0; transform: scale(0.9) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-popup-in { animation: popup-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default AnnouncementPopup;
