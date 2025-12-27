
import React, { useState, useEffect } from 'react';
import { UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
  onBack: () => void;
  onGuestAccess: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack, onGuestAccess }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [isQRRExpanded, setIsQRRExpanded] = useState(false);
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    adminPassword: "123",
    citizenPassword: "55555*#",
    chairmanPhone: "08123456789",
    rtRw: "RT 05",
    qrCodeEnabled: true,
    qrCodeTitle: "QR Registrasi Tamu",
    qrCodeImageUrl: ""
  } as AppSettings));

  const [toast, setToast] = useState<{show: boolean, msg: string}>({show: false, msg: ''});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudSettings = docSnap.data().data;
        setSettings(cloudSettings);
        storage.updateLocal(STORAGE_KEYS.SETTINGS, cloudSettings);
      }
      setIsSyncing(false);
    }, (err) => {
      console.error("Gagal sinkron sandi:", err);
      setIsSyncing(false);
    });
    
    return () => unsub();
  }, []);

  const handleKeyClick = (key: string) => {
    if (password.length < 12) {
      setPassword(prev => prev + key);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPassword(prev => prev.slice(0, -1));
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-6 pb-20 animate-page-enter overflow-y-auto no-scrollbar">
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-page-enter">
           <div className="bg-emerald-600 p-5 rounded-[28px] shadow-2xl backdrop-blur-xl flex items-center gap-4 border-2 border-emerald-400/30 text-white">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-xs font-black uppercase tracking-tight leading-none">{toast.msg}</p>
           </div>
        </div>
      )}

      <div className="w-full max-w-md space-y-8 mt-4">
        {/* HEADER LOGO */}
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-gradient-to-br from-[#0077b6] to-[#005f91] rounded-[28px] flex items-center justify-center text-white text-2xl font-black mx-auto shadow-2xl shadow-blue-500/20 mb-4 rotate-3">
            SiRT
          </div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight leading-none">Akses Portal</h2>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.3em]">Sistem Informasi Digital {settings.rtRw}</p>
        </div>

        {/* QR CODE SECTION (COLLAPSIBLE) */}
        {settings.qrCodeEnabled && (
          <div className="bg-white rounded-[36px] shadow-sm border border-slate-100 overflow-hidden transition-all duration-500">
            {/* Toggle Header */}
            <button 
              onClick={() => setIsQRRExpanded(!isQRRExpanded)}
              className="w-full p-6 flex items-center justify-between bg-amber-500/5 hover:bg-amber-500/10 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v1c0 1-1 2-2 2H8c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2zM15 15v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-1c0-1 1-2 2-2h2c1 0 2 1 2 2zM4 15v1c0 1-1 2-2 2H1c-1 0-2-1-2-2v-1c0-1 1-2 2-2h1c1 0 2 1 2 2zM21 4v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2z" /></svg>
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Registrasi Tamu (Scan QR)</h4>
                  <p className="text-[9px] text-amber-600 font-bold uppercase tracking-widest">{isQRRExpanded ? 'Klik untuk menutup' : 'Klik untuk menampilkan kode'}</p>
                </div>
              </div>
              <div className={`w-8 h-8 rounded-full bg-white flex items-center justify-center text-slate-300 transition-transform duration-500 ${isQRRExpanded ? 'rotate-180' : ''}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </button>

            {/* Expandable Content */}
            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isQRRExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="p-8 pt-4 space-y-6 border-t border-amber-100">
                <div className="text-center space-y-1">
                   <div className="inline-flex bg-amber-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-2 shadow-lg">Tamu Wajib Lapor</div>
                   <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{settings.qrCodeTitle || 'Scan QR Registrasi'}</h3>
                   <p className="text-[10px] text-slate-400 font-bold leading-relaxed px-4 italic">"Arahkan kamera tamu ke kode di bawah untuk mengisi data kunjungan secara mandiri."</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-[40px] border-4 border-white shadow-inner aspect-square flex items-center justify-center overflow-hidden relative mx-auto max-w-[280px]">
                   {settings.qrCodeImageUrl ? (
                      <img src={settings.qrCodeImageUrl} className="w-full h-full object-contain" alt="QR Access" />
                   ) : (
                      <div className="text-center space-y-2 opacity-20">
                         <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v1c0 1-1 2-2 2H8c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2zM15 15v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2v-1c0-1 1-2 2-2h2c1 0 2 1 2 2zM4 15v1c0 1-1 2-2 2H1c-1 0-2-1-2-2v-1c0-1 1-2 2-2h1c1 0 2 1 2 2zM21 4v1c0 1-1 2-2 2h-2c-1 0-2-1-2-2V4c0-1 1-2 2-2h2c1 0 2 1 2 2z" strokeWidth={2} /></svg>
                         <p className="text-[10px] font-black uppercase">Belum ada QR</p>
                      </div>
                   )}
                   {/* Scan line effect */}
                   <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/30 blur-sm animate-[scan_3s_infinite]"></div>
                </div>

                <div className="bg-amber-50 p-4 rounded-3xl text-center">
                   <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest leading-relaxed">
                     Tamu Mengisi Menggunakan Ponsel Pribadi <br/>
                     <span className="text-[8px] opacity-60">Data Terkirim Otomatis ke Pengurus</span>
                   </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ROLE SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-4 px-2">
             <div className="h-px bg-slate-200 flex-1"></div>
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Pilih Akses Masuk</p>
             <div className="h-px bg-slate-200 flex-1"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              disabled={isSyncing}
              onClick={() => { setSelectedRole('WARGA'); setError(''); setPassword(''); setIsQRRExpanded(false); }}
              className={`p-6 rounded-[36px] border-4 transition-all duration-500 flex flex-col items-center gap-3 group ${selectedRole === 'WARGA' ? 'border-[#0077b6] bg-white shadow-xl scale-105' : 'border-transparent bg-white shadow-sm opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedRole === 'WARGA' ? 'bg-[#0077b6] text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center leading-tight">Login<br/>Warga RT</span>
            </button>

            <button 
              type="button"
              disabled={isSyncing}
              onClick={() => { setSelectedRole('ADMIN'); setError(''); setPassword(''); setIsQRRExpanded(false); }}
              className={`p-6 rounded-[36px] border-4 transition-all duration-500 flex flex-col items-center gap-3 group ${selectedRole === 'ADMIN' ? 'border-rose-600 bg-white shadow-xl scale-105' : 'border-transparent bg-white shadow-sm opacity-60 hover:opacity-100'}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${selectedRole === 'ADMIN' ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 text-center leading-tight">Login<br/>Admin RT</span>
            </button>
          </div>
        </div>

        {selectedRole && (
          <div className="space-y-8 animate-page-enter">
            <div className="space-y-4">
              <div className="flex justify-between items-center px-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Masukan Sandi</label>
                <button onClick={() => setShowPassword(!showPassword)} className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                  {showPassword ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              <div className="bg-white rounded-[32px] p-6 shadow-inner flex justify-center gap-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-10 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${password[i] ? 'border-indigo-500 bg-indigo-50 text-slate-800' : 'border-slate-100 text-slate-200'}`}>
                    {password[i] ? (showPassword ? password[i] : '•') : ''}
                  </div>
                ))}
              </div>
              {error && <p className="text-center text-[10px] font-black text-rose-500 uppercase tracking-widest">{error}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
              {keys.map(key => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeyClick(key)}
                  className="w-full aspect-square rounded-full bg-white shadow-sm flex items-center justify-center text-xl font-black text-slate-700 active:scale-90 active:bg-slate-50 transition-all border border-slate-50"
                >
                  {key}
                </button>
              ))}
              <div className="col-start-2"></div>
              <button
                type="button"
                onClick={handleBackspace}
                className="w-full aspect-square rounded-full bg-rose-50 flex items-center justify-center text-rose-500 active:scale-90 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => handleLogin()}
                disabled={isLoading || password.length < 3}
                className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all disabled:opacity-30"
              >
                {isLoading ? 'MEMVERIFIKASI...' : 'BUKA PORTAL'}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center py-2 hover:text-slate-600 transition-colors"
              >
                Lupa Sandi? Hubungi Pak RT
              </button>
            </div>
          </div>
        )}

        <div className="pt-4 space-y-4">
           <button 
             onClick={onGuestAccess}
             className="w-full bg-slate-900/5 text-slate-500 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-200 hover:bg-slate-100 transition-all active:scale-95"
           >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197" /></svg>
              Lapor Tamu Manual
           </button>
           <button 
             onClick={onBack}
             className="w-full text-slate-300 font-black text-[10px] uppercase tracking-[0.4em] py-4 hover:text-slate-400 transition-colors"
           >
              ← Kembali ke Beranda
           </button>
        </div>
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; opacity: 0; }
          50% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoginScreen;
