
import React, { useState, useEffect } from 'react';

interface LogoutWizardProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutWizard: React.FC<LogoutWizardProps> = ({ onConfirm, onCancel }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (step === 2) {
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(onConfirm, 800);
            return 100;
          }
          return prev + 5;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step, onConfirm]);

  return (
    <div className="fixed inset-0 z-[2000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-6 animate-fade-in no-print">
      <div className="bg-white w-full max-w-sm rounded-[48px] overflow-hidden shadow-[0_35px_70px_rgba(0,0,0,0.5)] animate-popup-in">
        
        {step === 1 ? (
          <div className="p-10 space-y-8">
            <div className="w-20 h-20 bg-rose-50 rounded-[32px] flex items-center justify-center mx-auto text-rose-600 shadow-inner">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </div>
            
            <div className="text-center space-y-2">
               <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Hentikan Sesi?</h3>
               <p className="text-sm text-slate-500 font-medium">Anda akan keluar dari akses Portal Digital RT 05. Sesi sistem saat ini akan diakhiri.</p>
            </div>

            <div className="flex flex-col gap-3">
               <button 
                onClick={() => setStep(2)}
                className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all"
               >
                 Ya, Keluar Sistem
               </button>
               <button 
                onClick={onCancel}
                className="w-full bg-slate-50 text-slate-400 py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all"
               >
                 Tetap Gunakan
               </button>
            </div>
          </div>
        ) : (
          <div className="p-10 space-y-10">
             <div className="flex flex-col items-center gap-6">
                <div className="relative w-24 h-24 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (251.2 * progress) / 100} className="text-indigo-600 transition-all duration-300" strokeLinecap="round" />
                   </svg>
                   <span className="absolute text-xs font-black text-slate-800">{progress}%</span>
                </div>
                <div className="text-center space-y-2">
                   <h4 className="text-lg font-black text-slate-800 uppercase tracking-widest">Finalisasi Sesi</h4>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                     {progress < 50 ? 'Sinkronisasi Basis Data...' : progress < 90 ? 'Membersihkan Cache Sistem...' : 'Sesi Segera Diakhiri'}
                   </p>
                </div>
             </div>
          </div>
        )}

        <div className="bg-slate-50 py-4 border-t border-slate-100 text-center">
           <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">SiRT Digital Pro • Keamanan Sistem Berlapis</p>
        </div>
      </div>

      <style>{`
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        .animate-popup-in { animation: popupIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes popupIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
};

export default LogoutWizard;
