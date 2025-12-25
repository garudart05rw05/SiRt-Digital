
import React, { useState, useEffect } from 'react';
import { UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    adminPassword: "123",
    citizenPassword: "55555*#",
    chairmanPhone: "08123456789",
    rtRw: "RT 05"
  } as AppSettings));

  const [toast, setToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data().data;
        setSettings(cloudSettings);
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudSettings));
      }
      setIsSyncing(false);
    }, (err) => {
      console.error("Gagal sinkron sandi:", err);
      setIsSyncing(false);
    });
    
    return () => unsub();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const adminPass = settings.adminPassword || '123';
      const citizenPass = settings.citizenPassword || '55555*#';

      if (selectedRole === 'ADMIN') {
        if (password === adminPass) {
          setToast({show: true, msg: 'Login Admin Berhasil!'});
          setTimeout(() => onLoginSuccess('ADMIN'), 1000);
        } else {
          setError('Sandi Admin Tidak Valid');
          setIsLoading(false);
        }
      } else if (selectedRole === 'WARGA') {
        if (password === citizenPass) {
          setToast({show: true, msg: 'Akses Portal Warga Terbuka!'});
          setTimeout(() => onLoginSuccess('WARGA'), 1000);
        } else {
          setError('Sandi Portal Warga Salah');
          setIsLoading(false);
        }
      }
    }, 800);
  };

  const handleForgotPassword = () => {
    const phone = settings.chairmanPhone || "08123456789";
    const roleText = selectedRole === 'ADMIN' ? 'Pengurus' : 'Warga';
    const message = encodeURIComponent(`Halo Pak RT, saya ${roleText} di ${settings.rtRw}. Saya lupa kata sandi untuk masuk ke portal aplikasi. Mohon bantuannya untuk menginformasikan sandi terbaru. Terima kasih.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-page-enter">
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-page-enter">
           <div className="bg-emerald-600 p-5 rounded-[28px] shadow-2xl backdrop-blur-xl flex items-center gap-4 border-2 border-emerald-400/30 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-xs font-black uppercase tracking-tight leading-tight">{toast.msg}</p>
           </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-10">
        <div className="text-center space-y-3">
          <div className="w-24 h-24 bg-gradient-to-br from-[#0077b6] to-[#005f91] rounded-[32px] flex items-center justify-center text-white text-3xl font-black mx-auto shadow-2xl shadow-blue-500/20 mb-6 rotate-3 hover:rotate-0 transition-transform duration-500">
            SiRT
          </div>
          <h2 className="text-4xl font-black text-slate-900 uppercase tracking-tight leading-none">Akses Portal</h2>
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSyncing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">
              {isSyncing ? 'Sinkronisasi Keamanan...' : 'Sistem Terverifikasi'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <button 
            type="button"
            disabled={isSyncing}
            onClick={() => { setSelectedRole('WARGA'); setError(''); setPassword(''); }}
            className={`p-8 rounded-[44px] border-4 transition-all duration-500 flex flex-col items-center gap-4 group ${selectedRole === 'WARGA' ? 'border-[#0077b6] bg-white shadow-2xl scale-105' : 'border-transparent bg-white/50 shadow-sm opacity-60 hover:opacity-100'}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedRole === 'WARGA' ? 'bg-[#0077b6] text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Warga RT</span>
          </button>

          <button 
            type="button"
            disabled={isSyncing}
            onClick={() => { setSelectedRole('ADMIN'); setError(''); setPassword(''); }}
            className={`p-8 rounded-[44px] border-4 transition-all duration-500 flex flex-col items-center gap-4 group ${selectedRole === 'ADMIN' ? 'border-rose-600 bg-white shadow-2xl scale-105' : 'border-transparent bg-white/50 shadow-sm opacity-60 hover:opacity-100'}`}
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${selectedRole === 'ADMIN' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-200 text-slate-400'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">Pengurus RT</span>
          </button>
        </div>

        <div className={`transition-all duration-700 overflow-hidden ${selectedRole ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <form onSubmit={handleLogin} className="space-y-6 bg-white p-10 rounded-[56px] shadow-2xl border border-slate-100 relative">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Kata Sandi Keamanan</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  disabled={isLoading}
                  className="w-full bg-slate-900 border-none rounded-[32px] px-8 py-6 outline-none focus:ring-4 focus:ring-blue-100 font-black text-center text-2xl tracking-[0.4em] shadow-inner text-white transition-all placeholder-slate-700"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-3 text-slate-500 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-500 text-[10px] font-black uppercase tracking-widest py-3 px-6 rounded-2xl text-center animate-bounce">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || !password}
              className={`w-full py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 text-white flex items-center justify-center gap-3 disabled:opacity-50 ${selectedRole === 'ADMIN' ? 'bg-rose-600 shadow-rose-500/30' : 'bg-[#0077b6] shadow-blue-500/30'}`}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  Memverifikasi...
                </>
              ) : 'Masuk Ke Sistem'}
            </button>
            
            <div className="text-center">
              <button 
                type="button" 
                onClick={handleForgotPassword}
                className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-600 tracking-widest transition-colors"
              >
                Lupa Sandi? Hubungi Pak RT
              </button>
            </div>
          </form>
        </div>

        <button 
          onClick={onBack}
          className="w-full text-slate-300 py-2 text-[10px] font-black uppercase tracking-[0.4em] hover:text-slate-500 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
          Kembali Ke Beranda
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
