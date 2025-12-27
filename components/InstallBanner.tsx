
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
      // Tampilkan banner secara otomatis setelah 5 detik sesi aktif
      const timer = setTimeout(() => setIsVisible(true), 5000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Untuk iOS, kita tampilkan panduan karena tidak ada event trigger otomatis
    if (iosMatch) {
      const timer = setTimeout(() => setIsVisible(true), 6000);
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
    <div className="fixed bottom-24 left-5 right-5 z-[1100] animate-page-enter">
      <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-blue-500/30 p-6 rounded-[36px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex items-center gap-5">
        {/* App Icon Container */}
        <div className="w-16 h-16 bg-[#0077b6] rounded-[22px] flex items-center justify-center shrink-0 shadow-2xl border border-white/20 relative">
          <span className="text-white font-black text-sm tracking-tighter">SiRT</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
             <span className="bg-blue-500/20 text-blue-300 text-[8px] font-black uppercase px-2 py-0.5 rounded-full">Saran Sistem</span>
          </div>
          <h4 className="text-white font-black text-sm uppercase tracking-tight mt-1">Gunakan Aplikasi SiRT</h4>
          <p className="text-white/60 text-[10px] font-medium leading-tight mt-1 line-clamp-2">
            {isIOS 
              ? 'Tap ikon "Share" lalu pilih "Add to Home Screen" agar SiRT tersimpan di layar utama.' 
              : 'Dapatkan akses lebih cepat dan notifikasi RT real-time dengan memasang aplikasi.'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isIOS && (
            <button 
              onClick={handleInstallClick}
              className="bg-[#0077b6] text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-90 transition-transform shadow-lg shadow-blue-500/40"
            >
              Pasang
            </button>
          )}
          <button 
            onClick={() => setIsVisible(false)}
            className="text-white/40 text-[9px] font-black uppercase tracking-widest py-1.5 hover:text-white"
          >
            Tutup
          </button>
        </div>

        {/* iOS Specific Indicator Arrow */}
        {isIOS && (
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[12px] border-t-slate-900/95"></div>
        )}
      </div>
    </div>
  );
};

export default InstallBanner;
