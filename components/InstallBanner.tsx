
import React, { useState, useEffect } from 'react';

const InstallBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. Cek apakah sudah dalam mode terinstal (standalone)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
                       || (window.navigator as any).standalone 
                       || document.referrer.includes('android-app://');

    if (isStandalone) return;

    // 2. Deteksi iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosMatch = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosMatch);

    // 3. Tangkap event instalasi (Chrome/Android/Edge)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Tampilkan banner setelah jeda singkat agar tidak mengganggu loading awal
      const timer = setTimeout(() => setIsVisible(true), 4000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Untuk iOS, kita tampilkan panduan manual karena tidak ada event trigger otomatis
    if (iosMatch) {
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-6 left-5 right-5 z-[2000] animate-page-enter no-print">
      <div className="bg-white/95 backdrop-blur-xl border-2 border-blue-500/20 p-5 rounded-[32px] shadow-[0_30px_60px_rgba(0,119,182,0.25)] flex items-center gap-5 border border-slate-100">
        {/* App Icon Container */}
        <div className="w-14 h-14 bg-[#0077b6] rounded-[20px] flex items-center justify-center shrink-0 shadow-xl border border-white/20 relative">
          <span className="text-white font-black text-[12px] tracking-tighter">SiRT</span>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <span className="bg-blue-50 text-blue-600 text-[8px] font-black uppercase px-2 py-0.5 rounded-full border border-blue-100">Rekomendasi Warga</span>
          </div>
          <h4 className="text-slate-900 font-black text-[13px] uppercase tracking-tight mt-1">Instal Aplikasi SiRT</h4>
          <p className="text-slate-500 text-[10px] font-medium leading-tight mt-0.5 line-clamp-2">
            {isIOS 
              ? 'Klik "Share" dan pilih "Add to Home Screen" untuk akses cepat.' 
              : 'Dapatkan pemberitahuan RT real-time & akses mudah tanpa browser.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isIOS ? (
            <button 
              onClick={handleInstallClick}
              className="bg-[#0077b6] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-transform shadow-lg shadow-blue-500/30"
            >
              Instal
            </button>
          ) : (
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
               </svg>
            </div>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="text-slate-400 text-[9px] font-black uppercase tracking-widest py-1 hover:text-slate-600"
          >
            Nanti
          </button>
        </div>
      </div>
    </div>
  );
};

export default InstallBanner;
