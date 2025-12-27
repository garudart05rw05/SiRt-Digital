
import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const AnnouncementPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    // 1. Real-time Listener untuk AppSettings
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data().data;
        setSettings(cloudSettings);

        // 2. Logika Kemunculan: Aktif & Belum ditutup di sesi ini
        const wasShown = sessionStorage.getItem('rt_popup_shown');
        if (cloudSettings.popupEnabled && !wasShown) {
          const timer = setTimeout(() => {
            setIsOpen(true);
          }, 1500);
          return () => clearTimeout(timer);
        } else if (!cloudSettings.popupEnabled) {
          setIsOpen(false);
        }
      }
    });

    return () => unsub();
  }, []);

  const imageUrls = settings?.popupImageUrls || (settings?.popupImageUrl ? [settings.popupImageUrl] : []);

  useEffect(() => {
    if (!isOpen || !settings?.popupAutoScroll || imageUrls.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % imageUrls.length);
    }, 4000); // 4 seconds per slide

    return () => clearInterval(interval);
  }, [isOpen, settings?.popupAutoScroll, imageUrls.length]);

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem('rt_popup_shown', 'true');
  };

  const nextSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev + 1) % imageUrls.length);
  };

  const prevSlide = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
  };

  if (!isOpen || !settings) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 no-print">
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md animate-fade-in"
        /* Disabled: onClick={handleClose} - Pop up hanya bisa ditutup lewat tombol X */
      ></div>

      <div className="relative bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.4)] animate-popup-in">
        
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 z-40 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-xl rounded-full flex items-center justify-center text-white transition-all active:scale-90"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Carousel Area */}
        {imageUrls.length > 0 && (
          <div className="w-full aspect-[4/3] relative overflow-hidden group">
            <div 
              className="flex w-full h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
               {imageUrls.map((url, idx) => (
                  <img 
                    key={idx}
                    src={url} 
                    className="w-full h-full object-cover shrink-0" 
                    alt={`Announcement ${idx}`} 
                  />
               ))}
            </div>

            {/* Navigation Dots */}
            {imageUrls.length > 1 && (
               <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2 z-30">
                  {imageUrls.map((_, idx) => (
                     <button 
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                        className={`h-1.5 rounded-full transition-all ${activeIndex === idx ? 'w-6 bg-white shadow-lg' : 'w-1.5 bg-white/40'}`}
                     />
                  ))}
               </div>
            )}

            {/* Arrows */}
            {imageUrls.length > 1 && (
               <>
                  <button 
                    onClick={prevSlide}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <button 
                    onClick={nextSlide}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/10 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
               </>
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent pointer-events-none"></div>
          </div>
        )}

        <div className="p-10 pt-4 space-y-4 text-center">
          <div className="inline-flex bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2">
            Pemberitahuan Resmi
          </div>
          <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-tight">
            {settings.popupTitle || 'Informasi Penting'}
          </h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed line-clamp-3">
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

        <div className="bg-slate-50 py-4 border-t border-slate-100 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SiRT Digital Pro System • {settings.rtRw}</p>
        </div>
      </div>

      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popup-in { from { opacity: 0; transform: scale(0.9) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .animate-fade-in { animation: fade-in 0.4s ease-out; }
        .animate-popup-in { animation: popup-in 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
      `}</style>
    </div>
  );
};

export default AnnouncementPopup;
