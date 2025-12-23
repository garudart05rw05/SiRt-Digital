
import React, { useState, useEffect } from 'react';
import { UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole) => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    adminPassword: "123",
    citizenPassword: "55555*#"
  } as AppSettings));

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Gunakan password dari settings dengan fallback ke default lama jika tidak ada
    const adminPass = settings.adminPassword || '123';
    const citizenPass = settings.citizenPassword || '55555*#';

    if (selectedRole === 'ADMIN') {
      if (password === adminPass) {
        onLoginSuccess('ADMIN');
      } else {
        setError('Password Admin Salah!');
      }
    } else if (selectedRole === 'WARGA') {
      if (password === citizenPass) {
        onLoginSuccess('WARGA');
      } else {
        setError('Password Warga Salah!');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 animate-page-enter">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-20 h-20 bg-[#0077b6] rounded-[28px] flex items-center justify-center text-white text-2xl font-black mx-auto shadow-2xl shadow-blue-500/20 mb-6">
            SiRT
          </div>
          <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Akses Portal</h2>
          <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Silakan pilih identitas Anda</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => { setSelectedRole('WARGA'); setError(''); setPassword(''); }}
            className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${selectedRole === 'WARGA' ? 'border-[#0077b6] bg-blue-50 shadow-lg' : 'border-white bg-white shadow-sm'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedRole === 'WARGA' ? 'bg-[#0077b6] text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Warga RT</span>
          </button>

          <button 
            onClick={() => { setSelectedRole('ADMIN'); setError(''); setPassword(''); }}
            className={`p-6 rounded-[32px] border-2 transition-all flex flex-col items-center gap-3 ${selectedRole === 'ADMIN' ? 'border-red-600 bg-red-50 shadow-lg' : 'border-white bg-white shadow-sm'}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedRole === 'ADMIN' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Pengurus RT</span>
          </button>
        </div>

        {selectedRole && (
          <form onSubmit={handleLogin} className="space-y-4 animate-page-enter">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Masukkan Kata Sandi</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className="w-full bg-white border-none rounded-[24px] px-8 py-5 outline-none focus:ring-2 focus:ring-slate-200 font-black text-center text-xl tracking-[0.5em] shadow-sm"
                  placeholder="••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && <p className="text-center text-rose-500 text-[10px] font-black uppercase animate-bounce">{error}</p>}

            <button 
              type="submit"
              className={`w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 text-white ${selectedRole === 'ADMIN' ? 'bg-red-600 shadow-red-500/20' : 'bg-[#0077b6] shadow-blue-500/20'}`}
            >
              Verifikasi & Masuk
            </button>
          </form>
        )}

        <button 
          onClick={onBack}
          className="w-full text-slate-300 py-2 text-[10px] font-black uppercase tracking-widest hover:text-slate-500 transition-colors"
        >
          Kembali ke Beranda
        </button>
      </div>
    </div>
  );
};

export default LoginScreen;
