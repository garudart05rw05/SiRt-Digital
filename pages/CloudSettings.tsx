
import React, { useState, useEffect } from 'react';
import { driveService } from '../services/driveService';
import { CloudStatus } from '../types';
import { storage } from '../services/storageService';

const CloudSettings: React.FC = () => {
  const [status, setStatus] = useState<CloudStatus>(() => 
    storage.get('rt_cloud_status', { isConnected: false, lastSync: null, accountEmail: null, isSyncing: false })
  );
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    storage.set('rt_cloud_status', status);
  }, [status]);

  const handleConnect = async () => {
    setIsProcessing(true);
    try {
      const account = await driveService.connect();
      setStatus({
        isConnected: true,
        accountEmail: account.email,
        lastSync: new Date().toLocaleString('id-ID'),
        isSyncing: false
      });
    } catch (e) {
      alert("Gagal menghubungkan ke pusat sistem.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!status.isConnected) return;
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    const allData = {
      news: storage.get('rt_pro_news', []),
      residents: storage.get('rt_pro_residents', []),
      finance: storage.get('rt_pro_finance', []),
      inventory: storage.get('rt_pro_inventory', [])
    };

    try {
      await driveService.syncData(allData);
      setStatus(prev => ({ 
        ...prev, 
        lastSync: new Date().toLocaleString('id-ID'), 
        isSyncing: false 
      }));
    } catch (e) {
      alert("Sinkronisasi gagal.");
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Putuskan hubungan dengan pusat sistem? Data lokal tidak akan terhapus.")) {
      setStatus({ isConnected: false, lastSync: null, accountEmail: null, isSyncing: false });
    }
  };

  return (
    <div className="px-5 py-6 space-y-8 animate-page-enter pb-32">
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 shadow-2xl overflow-hidden relative">
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-50 rounded-[32px] flex items-center justify-center shrink-0 shadow-inner">
               <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Sinkronisasi Sistem</h1>
              <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.3em] mt-1">System Backup & Recovery</p>
            </div>
          </div>
          
          <p className="text-sm text-slate-500 leading-relaxed font-medium">
            Sistem ini terhubung dengan pusat data terenkripsi untuk mencadangkan database warga, laporan keuangan, dan arsip warta secara otomatis ke peladen aman.
          </p>
          
          {!status.isConnected ? (
            <button 
              onClick={handleConnect}
              disabled={isProcessing}
              className="bg-indigo-600 text-white w-full py-5 rounded-[28px] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              {isProcessing ? 'Mengotorisasi...' : 'Hubungkan Pusat Sistem'}
              {!isProcessing && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
            </button>
          ) : (
            <div className="space-y-6 pt-2">
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[32px] flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Status Terhubung</p>
                    <p className="text-sm font-black text-slate-800 uppercase tracking-tight">Sistem Terverifikasi</p>
                  </div>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                </div>
                <div className="bg-slate-50 border-2 border-slate-100 p-6 rounded-[32px]">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Terakhir Cadangkan</p>
                  <p className="text-sm font-black text-slate-800">{status.lastSync || 'Belum pernah'}</p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSyncNow}
                  disabled={status.isSyncing}
                  className="bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {status.isSyncing ? (
                    <>
                      <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                      Sinkronisasi...
                    </>
                  ) : 'Cadangkan Data Sekarang'}
                </button>
                <button 
                  onClick={handleDisconnect}
                  className="text-rose-500 font-black text-[10px] uppercase tracking-[0.2em] py-4 hover:underline"
                >
                  Putuskan Hubungan Sistem
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-50 rounded-full blur-[100px] -z-0"></div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-4">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3">
            <div className="w-1.5 h-3 bg-indigo-500 rounded-full"></div>
            Detail Keamanan Sistem
          </h3>
          <ul className="space-y-4">
            {[
              { title: 'Enkripsi Pihak Pertama', desc: 'Data hanya bisa dibaca oleh sistem internal RT 05.' },
              { title: 'Otomatisasi Laporan', desc: 'Setiap input mutasi kas akan memicu sinkronisasi otomatis.' },
              { title: 'Pemulihan Instan', desc: 'Jika ganti perangkat, cukup hubungkan kembali untuk tarik data.' }
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 bg-indigo-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                   <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3}/></svg>
                </div>
                <div>
                   <p className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{item.title}</p>
                   <p className="text-[10px] text-slate-400 font-medium">{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="bg-amber-50 p-8 rounded-[40px] border border-amber-100">
          <p className="text-[10px] text-amber-800 font-bold leading-relaxed italic text-center uppercase tracking-widest">
            "Aplikasi RT Digital Pro berkomitmen menjaga privasi data warga. Seluruh file disimpan dalam peladen terenkripsi yang dikelola secara profesional."
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudSettings;
