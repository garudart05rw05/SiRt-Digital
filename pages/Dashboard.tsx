
import React, { useState, useEffect, useMemo } from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { AppSettings, Page, UserRole, NewsItem, Complaint, MASTER_SERVICES, Transaction, Resident } from '../types.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  role: UserRole;
  onNavigate: (page: Page) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    rtRw: "RT 05 RW 05",
    location: "Kel. Gayam, Mojoroto, Kediri",
    youtubeUrl: "https://youtube.com/@rukuntetangga-i3k?si=QNxgcSiBEZGISfEh",
    tiktokUrl: "https://tiktok.com/@rt_digital_pro",
    instagramUrl: "https://instagram.com/rt_digital_pro",
    archiveUrl: "https://drive.google.com",
    archiveNotulenUrl: "https://drive.google.com",
    archiveEdaranUrl: "https://drive.google.com",
    archiveKeuanganUrl: "https://drive.google.com",
    archivePerdaUrl: "https://drive.google.com",
    archiveLainnyaUrl: "https://drive.google.com",
    chairmanPhone: "08123456789",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id",
    popupEnabled: true,
    popupTitle: "Selamat Datang di SiRT",
    popupText: "Pastikan data kependudukan Anda sudah terupdate.",
    popupImageUrl: "https://picsum.photos/seed/welcome/1200/600"
  }));

  const [showPopup, setShowPopup] = useState(false);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const loadLocalData = () => {
    setResidents(storage.get<Resident[]>(STORAGE_KEYS.RESIDENTS, []));
    setTransactions(storage.get<Transaction[]>(STORAGE_KEYS.REPORTS + '_finance', []));
  };

  useEffect(() => {
    loadLocalData();
    window.addEventListener('storage_updated', loadLocalData);

    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (doc) => {
      if (doc.exists()) {
        const cloudSettings = doc.data().data;
        setSettings(cloudSettings);
        if (cloudSettings.popupEnabled && !showPopup) {
          setShowPopup(true);
        }
      }
    });

    return () => {
      window.removeEventListener('storage_updated', loadLocalData);
      unsub();
    };
  }, []);

  const currentBalance = useMemo(() => {
    return transactions.reduce((acc, t) => t.type === 'IN' ? acc + t.amount : acc - t.amount, 0);
  }, [transactions]);

  const filterByRoleAndSearch = (s: any) => {
    const roleMatch = !s.adminOnly || role === 'ADMIN';
    const searchMatch = s.label.toLowerCase().includes(searchTerm.toLowerCase());
    return roleMatch && searchMatch;
  };
  
  const layananServices = MASTER_SERVICES.filter(s => s.category === 'Layanan').filter(filterByRoleAndSearch);
  const informasiServices = MASTER_SERVICES.filter(s => s.category === 'Informasi').filter(filterByRoleAndSearch);
  const administrasiServices = MASTER_SERVICES.filter(s => s.category === 'Administrasi').filter(filterByRoleAndSearch);

  const hasAnyResults = layananServices.length > 0 || informasiServices.length > 0 || administrasiServices.length > 0;

  return (
    <div className="space-y-6 pb-32 animate-page-enter">
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-page-enter">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setShowPopup(false)}></div>
          <div className="relative bg-white w-full max-w-2xl rounded-[56px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.4)] border border-slate-100 flex flex-col max-h-[90vh]">
            <button 
              onClick={() => setShowPopup(false)}
              className="absolute top-6 right-6 z-20 w-12 h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all shadow-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            
            <div className="flex-1 overflow-y-auto no-scrollbar">
              {settings.popupImageUrl && (
                <div className="relative w-full aspect-video">
                  <img src={settings.popupImageUrl} className="w-full h-full object-cover" alt="Pengumuman" />
                  <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20"></div>
                </div>
              )}
              <div className="p-10 sm:p-14 space-y-6 text-center">
                <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-2">
                  Informasi Penting
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-slate-900 uppercase tracking-tight leading-tight">
                  {settings.popupTitle || 'Pengumuman RT'}
                </h3>
                <p className="text-slate-600 text-lg sm:text-xl font-medium leading-relaxed">
                  {settings.popupText || 'Silakan cek berkala informasi terbaru.'}
                </p>
                <div className="pt-6">
                  <button 
                    onClick={() => setShowPopup(false)} 
                    className="w-full bg-slate-900 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
                  >
                    Saya Mengerti
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SOS Widget */}
      <div className="px-5 pt-4">
        <button 
          onClick={() => onNavigate(Page.EMERGENCY)} 
          className="w-full bg-red-600 rounded-[36px] p-6 text-white shadow-2xl relative overflow-hidden flex items-center justify-between animate-sos border-4 border-red-500/20 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-5 relative z-10">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-red-600 shadow-xl"><svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg></div>
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-100">Bantuan Cepat</p>
              <h2 className="text-2xl font-black uppercase tracking-tight">Panic Button</h2>
            </div>
          </div>
          <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={4}/></svg>
        </button>
      </div>

      {/* Stats Card */}
      <div className="px-5">
        <div className="bg-[#0077b6] rounded-[40px] p-1 shadow-xl overflow-hidden relative">
          <div className="flex bg-white/10 p-6 items-center justify-between text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg"><span className="text-[#0077b6] text-sm font-black">SiRT</span></div>
              <div className="flex flex-col">
                <span className="font-bold text-base tracking-tight">{settings.rtRw}</span>
                <span className="text-[10px] opacity-70 font-black tracking-widest uppercase">{residents.length} Jiwa Terdaftar</span>
              </div>
            </div>
          </div>
          <div className="bg-white m-1 rounded-[36px] p-7 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">Saldo Kas RT</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">Rp {currentBalance.toLocaleString()}</p>
            </div>
            <button onClick={() => onNavigate(Page.FINANCE)} className="w-14 h-14 bg-orange-500 rounded-[22px] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg></button>
          </div>
        </div>
      </div>

      {/* Global Search Feature */}
      <div className="px-5">
        <div className="relative group">
          <input 
            type="text" 
            placeholder="Cari fitur atau layanan..." 
            className="w-full bg-white border border-slate-100 rounded-3xl py-4 pl-14 pr-6 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#0077b6] shadow-sm transition-all group-hover:shadow-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#0077b6] transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-5 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {!hasAnyResults && searchTerm && (
        <div className="px-5 py-10 text-center animate-page-enter">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <svg className="w-8 h-8 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={2}/></svg>
          </div>
          <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Fitur tidak ditemukan</p>
          <button onClick={() => setSearchTerm('')} className="mt-2 text-[#0077b6] text-xs font-bold hover:underline">Hapus pencarian</button>
        </div>
      )}

      {/* Main Services Grid */}
      <div className="px-5 space-y-8">
        {layananServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 mb-4">
               <div className="w-1 h-4 bg-[#0077b6] rounded-full"></div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Layanan Warga</h3>
            </div>
            <div className="grid grid-cols-4 gap-y-7 gap-x-2 bg-white border border-slate-50 p-6 rounded-[36px] shadow-sm">
              {layananServices.map(service => (
                <button key={service.id} onClick={() => onNavigate(service.id)} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
                  <div className={`${service.color} w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-md`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={service.icon} /></svg>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 text-center leading-tight uppercase tracking-tighter line-clamp-1">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {informasiServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 mb-4">
               <div className="w-1 h-4 bg-green-500 rounded-full"></div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Pusat Informasi</h3>
            </div>
            <div className="grid grid-cols-4 gap-y-7 gap-x-2 bg-white border border-slate-50 p-6 rounded-[36px] shadow-sm">
              {informasiServices.map(service => (
                <button key={service.id} onClick={() => onNavigate(service.id)} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
                  <div className={`${service.color} w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-md`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={service.icon} /></svg>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 text-center leading-tight uppercase tracking-tighter line-clamp-1">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {administrasiServices.length > 0 && (
          <div>
            <div className="flex items-center gap-2 px-2 mb-4">
               <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Administrasi</h3>
            </div>
            <div className="grid grid-cols-4 gap-y-7 gap-x-2 bg-white border border-slate-50 p-6 rounded-[36px] shadow-sm">
              {administrasiServices.map(service => (
                <button key={service.id} onClick={() => onNavigate(service.id)} className="flex flex-col items-center gap-2 group transition-transform active:scale-90">
                  <div className={`${service.color} w-14 h-14 rounded-[22px] flex items-center justify-center text-white shadow-md`}>
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d={service.icon} /></svg>
                  </div>
                  <span className="text-[9px] font-black text-slate-600 text-center leading-tight uppercase tracking-tighter line-clamp-1">{service.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
