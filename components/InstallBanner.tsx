
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
      // Tampilkan banner setelah beberapa detik agar tidak terlalu intrusif
      setTimeout(() => setIsVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Untuk iOS, kita tampilkan saja karena tidak ada event trigger
    if (iosMatch) {
      setTimeout(() => setIsVisible(true), 4000);
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
    <div className="fixed bottom-24 left-5 right-5 z-[100] animate-page-enter">
      <div className="bg-slate-900/90 backdrop-blur-xl border border-white/10 p-5 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-4">
        {/* App Icon */}
        <div className="w-14 h-14 bg-[#0077b6] rounded-2xl flex items-center justify-center shrink-0 shadow-lg border border-white/20">
          <span className="text-white font-black text-xs">SiRT</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-black text-sm uppercase tracking-tight">Pasang Aplikasi RT</h4>
          <p className="text-white/60 text-[10px] font-medium leading-tight mt-0.5 line-clamp-2">
            {isIOS 
              ? 'Klik ikon "Share" lalu pilih "Add to Home Screen" untuk akses lebih cepat.' 
              : 'Dapatkan notifikasi real-time & akses offline dengan menginstal aplikasi.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="bg-[#0077b6] text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-transform"
            >
              Instal
            </button>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/40 text-[9px] font-black uppercase tracking-widest py-1 hover:text-white"
          >
            Nanti saja
          </button>
        </div>

        {/* iOS Specific Indicator Arrow */}
        {isIOS && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-slate-900/90"></div>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;
