
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
        lastSync: new Date().toLocaleString(),
        isSyncing: false
      });
    } catch (e) {
      alert("Gagal menghubungkan ke Google Drive.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSyncNow = async () => {
    if (!status.isConnected) return;
    setStatus(prev => ({ ...prev, isSyncing: true }));
    
    // Ambil semua data lokal untuk di-sync
    const allData = {
      news: storage.get('rt_pro_news', []),
      residents: storage.get('rt_pro_residents', []),
    };

    try {
      await driveService.syncData(allData);
      setStatus(prev => ({ 
        ...prev, 
        lastSync: new Date().toLocaleString(), 
        isSyncing: false 
      }));
    } catch (e) {
      alert("Sinkronisasi gagal.");
      setStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleDisconnect = () => {
    if (window.confirm("Putuskan hubungan dengan Google Drive? Data lokal tidak akan terhapus.")) {
      setStatus({ isConnected: false, lastSync: null, accountEmail: null, isSyncing: false });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl overflow-hidden relative">
        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
             <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" className="w-10 h-10" alt="Drive" />
          </div>
          <div className="flex-1 space-y-4">
            <h1 className="text-2xl font-bold text-slate-800">Sinkronisasi Google Drive</h1>
            <p className="text-slate-500 leading-relaxed">
              Hubungkan aplikasi dengan akun Google Drive RT Anda untuk mengaktifkan backup otomatis. Data berita, foto, dan daftar warga akan aman tersimpan di cloud dan dapat diakses dari perangkat manapun.
            </p>
            
            {!status.isConnected ? (
              <button 
                onClick={handleConnect}
                disabled={isProcessing}
                className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-3"
              >
                {isProcessing ? 'Menghubungkan...' : 'Hubungkan Akun Google'}
                {!isProcessing && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
              </button>
            ) : (
              <div className="space-y-6 pt-4">
                <div className="flex flex-wrap gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Status Koneksi</p>
                    <p className="text-sm font-bold text-slate-800">Terhubung</p>
                    <p className="text-xs text-slate-500">{status.accountEmail}</p>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex-1 min-w-[200px]">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-1">Terakhir Sinkron</p>
                    <p className="text-sm font-bold text-slate-800">{status.lastSync || '-'}</p>
                    <p className="text-xs text-slate-500">Otomatis setiap ada perubahan</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={handleSyncNow}
                    disabled={status.isSyncing}
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-600 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {status.isSyncing ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sinkronisasi...
                      </>
                    ) : 'Sinkron Sekarang'}
                  </button>
                  <button 
                    onClick={handleDisconnect}
                    className="bg-white border border-slate-200 text-slate-400 px-6 py-2.5 rounded-xl font-bold text-sm hover:text-rose-600 hover:border-rose-100 hover:bg-rose-50 transition-all"
                  >
                    Putuskan Hubungan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Decorative background */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-indigo-50/50 -skew-x-12 translate-x-1/2"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Apa yang di-backup?
          </h3>
          <ul className="space-y-3 text-sm text-slate-500">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              Seluruh Database Warga (file JSON)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              Arsip Berita & Warta (file JSON)
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
              Metadata Laporan Warga
            </li>
          </ul>
        </div>
        
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
          <h3 className="font-bold text-amber-800 mb-2">Keamanan Data</h3>
          <p className="text-xs text-amber-700 leading-relaxed">
            Aplikasi hanya meminta izin untuk mengelola file yang ia buat sendiri di Google Drive Anda. Kami tidak memiliki akses ke dokumen pribadi Anda lainnya. Data di-enkripsi menggunakan standar Google Cloud.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CloudSettings;
