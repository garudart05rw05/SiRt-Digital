
import React, { useState, useEffect, useMemo } from 'react';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { AppSettings, Page, UserRole, Complaint, MASTER_SERVICES, Transaction, Resident, NewsItem, YouthArisanLog, YouthFinanceTx, SecurityShift } from '../types.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  role: UserRole;
  onNavigate: (page: Page) => void;
  onLogout?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate, onLogout }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: "RT 05 RW 05",
    location: "Kelurahan Gayam, Mojoroto, Kediri",
    popupEnabled: false,
    youtubeUrl: "https://youtube.com/",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id"
  }));

  const [news, setNews] = useState<NewsItem[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [notifs, setNotifs] = useState<Record<string, boolean>>({});
  const [residents, setResidents] = useState<Resident[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [youthFinance, setYouthFinance] = useState<YouthFinanceTx[]>([]);
  const [youthArisan, setYouthArisan] = useState<YouthArisanLog[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [schedule, setSchedule] = useState<SecurityShift[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadLocalData = () => {
    const keysMap: Record<string, string> = {
      [Page.NEWS]: STORAGE_KEYS.NEWS,
      [Page.FINANCE]: STORAGE_KEYS.FINANCE,
      [Page.COMPLAINTS]: STORAGE_KEYS.COMPLAINTS,
      [Page.YOUTH_FUND]: STORAGE_KEYS.YOUTH_FINANCE,
      [Page.LETTERS]: STORAGE_KEYS.LETTERS
    };

    const newNotifs: Record<string, boolean> = {};
    Object.entries(keysMap).forEach(([page, storageKey]) => {
      const currentData = storage.get<any[]>(storageKey, []);
      const lastCount = Number(localStorage.getItem(`last_count_${storageKey}`) || 0);
      newNotifs[page] = (currentData || []).length > lastCount;
    });

    setNotifs(newNotifs);
    setResidents(storage.get<Resident[]>(STORAGE_KEYS.RESIDENTS, []));
    setTransactions(storage.get<Transaction[]>(STORAGE_KEYS.FINANCE, []));
    setComplaints(storage.get<Complaint[]>(STORAGE_KEYS.COMPLAINTS, []));
    setNews(storage.get<NewsItem[]>(STORAGE_KEYS.NEWS, []));
    setSchedule(storage.get<SecurityShift[]>(STORAGE_KEYS.SCHEDULE, []));
  };

  useEffect(() => {
    loadLocalData();
    window.addEventListener('storage_updated', loadLocalData);

    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) setSettings(docSnap.data().data || {});
    });

    const unsubYouthF = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_FINANCE), (snap) => {
      if (snap.exists()) setYouthFinance(snap.data().data || []);
    });

    const unsubYouthA = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_ARISAN_LOGS), (snap) => {
      if (snap.exists()) setYouthArisan(snap.data().data || []);
    });

    const unsubSchedule = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SCHEDULE), (snap) => {
      if (snap.exists()) setSchedule(snap.data().data || []);
    });

    return () => {
      window.removeEventListener('storage_updated', loadLocalData);
      unsubSettings();
      unsubYouthF();
      unsubYouthA();
      unsubSchedule();
    };
  }, []);

  const greeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 11) return 'Selamat Pagi';
    if (hour < 15) return 'Selamat Siang';
    if (hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  }, [currentTime]);

  const currentBalance = useMemo(() => {
    return (transactions || []).reduce((acc, t) => {
      if (!t) return acc;
      return t.type === 'IN' ? acc + (t.amount || 0) : acc - (t.amount || 0);
    }, 0);
  }, [transactions]);

  const youthBalance = useMemo(() => {
    const arisan = youthArisan.reduce((acc, l) => acc + (l.totalCollected || 0), 0);
    const finance = youthFinance.reduce((acc, l) => l.type === 'IN' ? acc + (l.amount || 0) : acc - (l.amount || 0), 0);
    return arisan + finance;
  }, [youthArisan, youthFinance]);

  const tonightSquad = useMemo(() => {
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const todayName = daysIndo[currentTime.getDay()];
    
    const startOfYear = new Date(currentTime.getFullYear(), 0, 1);
    const days = Math.floor((currentTime.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekType = (Math.ceil((days + startOfYear.getDay() + 1) / 7) % 2 === 0) ? 2 : 1;
    
    return schedule.find(s => s.week === weekType && s.day === todayName);
  }, [schedule, currentTime]);

  const featuredNews = useMemo(() => (news || []).filter(n => n && n.isFeatured).slice(0, 1), [news]);
  const normalNews = useMemo(() => (news || []).filter(n => n && !n.isFeatured).slice(0, 4), [news]);

  const categorizedServices = useMemo(() => {
    const visibleServices = MASTER_SERVICES.filter(s => s && (!(s as any).adminOnly || role === 'ADMIN'));
    const categories = ['Keuangan', 'Layanan', 'Informasi', 'Administrasi'];
    
    return categories.map(cat => ({
      name: cat,
      label: cat === 'Keuangan' ? 'Keuangan & Iuran' : cat === 'Layanan' ? 'Layanan Warga' : cat === 'Informasi' ? 'Informasi & Media' : 'Administrasi & Data',
      accent: cat === 'Keuangan' ? 'bg-emerald-600' : cat === 'Layanan' ? 'bg-rose-500' : cat === 'Informasi' ? 'bg-indigo-500' : 'bg-blue-500',
      items: visibleServices.filter(s => s && s.category === cat)
    })).filter(cat => cat.items.length > 0);
  }, [role]);

  const handleOpenPanicButton = () => {
    const url = settings.panicButtonUrl || 'https://panicbutton.gayammojoroto.my.id';
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
  };

  return (
    <div className="space-y-10 pb-32 animate-page-enter px-5 pt-4">
      {/* HEADER HERO */}
      <div className="relative bg-gradient-to-br from-[#0077b6] to-[#005f91] rounded-[48px] p-10 text-white shadow-2xl overflow-hidden min-h-[320px] flex flex-col justify-between transition-all duration-500">
        <div className="relative z-10 flex justify-between items-start">
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-200/80">{greeting} ☀️</p>
            <h1 className="text-4xl font-black tracking-tight leading-none">Tetangga {settings.rtRw} <span className="animate-wave">👋</span></h1>
            <div className="flex items-center gap-2 mt-6 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full border border-white/10 w-fit shadow-inner">
              <svg className="w-3.5 h-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={3}/><path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth={3}/></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">{(settings.location || '').split(',')[0]}</span>
            </div>
          </div>
          <div className="bg-black/20 backdrop-blur-2xl p-4 rounded-[28px] border border-white/10 text-center min-w-[80px] shadow-2xl">
            <p className="text-2xl font-black leading-none">{currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
            <p className="text-[8px] font-black uppercase opacity-60 mt-2 tracking-widest">{currentTime.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] p-6 flex items-center gap-5 shadow-inner hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-blue-400/20 rounded-2xl flex items-center justify-center text-blue-100 shadow-lg">
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2}/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-200/60 uppercase tracking-widest leading-none">Penduduk</p>
              <p className="text-2xl font-black leading-none mt-1.5">{(residents || []).length} <span className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">Jiwa</span></p>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-[32px] p-6 flex items-center gap-5 shadow-inner hover:bg-white/15 transition-all">
            <div className="w-12 h-12 bg-amber-400/20 rounded-2xl flex items-center justify-center text-amber-100 shadow-lg relative">
               {notifs[Page.COMPLAINTS] && <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-[#0077b6] animate-pulse"></div>}
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2}/></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-200/60 uppercase tracking-widest leading-none">Aduan</p>
              <p className="text-2xl font-black leading-none mt-1.5">{(complaints || []).filter(c => c && c.status !== 'Selesai').length} <span className="text-[9px] opacity-40 font-bold uppercase tracking-tighter">Aktif</span></p>
            </div>
          </div>
        </div>
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
      </div>

      {/* EMERGENCY & RONDA QUICK ACCESS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KARTU UTAMA PANIC BUTTON - TETAP DENGAN EFEK SIGNAL WAVE */}
        <div 
          onClick={handleOpenPanicButton}
          className="bg-red-600 p-8 rounded-[48px] shadow-[0_20px_50px_rgba(220,38,38,0.4)] flex items-center gap-6 cursor-pointer active:scale-95 transition-all group overflow-hidden relative"
        >
           <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-red-600 shrink-0 shadow-lg z-10 relative">
              {/* Signal Rings khusus Kartu Utama */}
              <div className="absolute inset-0 bg-white/40 rounded-3xl animate-signal"></div>
              <div className="absolute inset-0 bg-white/40 rounded-3xl animate-signal" style={{ animationDelay: '0.6s' }}></div>
              <div className="absolute inset-0 bg-white/40 rounded-3xl animate-signal" style={{ animationDelay: '1.2s' }}></div>
              
              <svg className="w-8 h-8 relative z-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
           </div>
           <div className="flex-1 min-w-0 z-10">
              <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Keadaan Darurat</p>
              <h4 className="text-xl font-black text-white uppercase mt-1 tracking-tight">Panic Button</h4>
              <p className="text-[9px] text-white/40 font-bold uppercase">Tekan Untuk Bantuan Cepat</p>
           </div>
           <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
           <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
        </div>

        {tonightSquad && (
          <div className="bg-white p-8 rounded-[48px] border border-slate-100 shadow-sm flex items-center gap-6">
             <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center text-white shrink-0 shadow-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth={2}/></svg>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Regu Ronda Malam Ini</p>
                <h4 className="text-lg font-black text-slate-800 uppercase truncate mt-1">{tonightSquad.leader}</h4>
                <p className="text-[9px] text-slate-400 font-bold uppercase truncate">{tonightSquad.members.slice(0, 2).join(', ')} & {tonightSquad.members.length - 2} lainnya</p>
             </div>
             <button onClick={() => onNavigate(Page.SCHEDULE)} className="p-3 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg>
             </button>
          </div>
        )}
      </div>

      {featuredNews.length > 0 && (
        <div className="space-y-6">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
             <div className="w-4 h-[2px] bg-amber-500 rounded-full"></div>
             Warta Utama (Headline)
           </h3>
           <div 
             onClick={() => onNavigate(Page.NEWS)}
             className="relative bg-white rounded-[56px] overflow-hidden shadow-2xl border border-slate-100 cursor-pointer group"
           >
              <div className="aspect-video overflow-hidden">
                 <img src={featuredNews[0].imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s]" alt="" />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-90"></div>
              </div>
              <div className="absolute bottom-0 left-0 p-10 space-y-4">
                 <span className="bg-amber-500 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl"> Headline Terkini</span>
                 <h2 className="text-3xl font-black text-white leading-tight uppercase tracking-tight line-clamp-2">{featuredNews[0].title}</h2>
                 <p className="text-white/70 text-sm font-medium line-clamp-2 max-w-lg">{featuredNews[0].subtitle || featuredNews[0].content}</p>
                 <div className="pt-4 flex items-center gap-3 text-white/50 text-[9px] font-black uppercase tracking-widest">
                    <span>Oleh {featuredNews[0].author}</span>
                    <span>•</span>
                    <span>{featuredNews[0].date}</span>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* LAYANAN ICON GRID */}
      <div className="space-y-12">
        {categorizedServices.map((cat) => (
          <div key={cat.name} className="space-y-6">
            <div className="flex items-center justify-between px-2">
               <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                 <div className={`w-1.5 h-4 ${cat.accent} rounded-full`}></div>
                 {cat.label}
               </h3>
            </div>

            <div className="grid grid-cols-4 gap-y-12 gap-x-3 bg-white p-10 rounded-[56px] shadow-sm border border-slate-50/50">
               {cat.items.map((service) => (
                 <button 
                   key={service.id} 
                   onClick={() => onNavigate(service.id)} 
                   className="flex flex-col items-center gap-4 active:scale-90 transition-all group relative"
                 >
                   {notifs[service.id] && (
                     <div className="absolute -top-1.5 -right-1.5 z-20 flex items-center justify-center">
                        <span className="flex h-5 w-5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-rose-600 border-2 border-white shadow-lg flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                          </span>
                        </span>
                     </div>
                   )}
                   {/* Animasi Sinyal DIHAPUS di sini (Kategori Layanan Warga) untuk menjaga estetika bersih */}
                   <div className={`${service.color} w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-[0_15px_30px_rgba(0,0,0,0.1)] group-hover:rotate-6 group-hover:scale-110 transition-all duration-500`}>
                      <svg className="w-8 h-8 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={service.icon} /></svg>
                   </div>
                   <span className="text-[9px] font-black text-slate-500 text-center leading-tight uppercase tracking-widest opacity-80 group-hover:opacity-100">{service.label}</span>
                 </button>
               ))}
            </div>
          </div>
        ))}
      </div>

      {/* KARANG TARUNA SPECIAL HUB */}
      <div className="space-y-6">
         <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] px-2 flex items-center gap-3">
           <div className="w-4 h-[2px] bg-violet-500 rounded-full"></div>
           Aktivitas Karang Taruna
         </h3>
         <div className="bg-white border border-slate-100 p-1 rounded-[56px] shadow-sm overflow-hidden flex flex-col sm:flex-row">
            <div className="sm:w-1/2 p-10 bg-violet-600 text-white rounded-[52px] flex flex-col justify-between min-h-[200px]">
               <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-violet-200">Kas Pemuda Terkumpul</p>
                  <h4 className="text-3xl font-black">Rp {(youthBalance ?? 0).toLocaleString()}</h4>
               </div>
               <button 
                  onClick={() => onNavigate(Page.YOUTH_FUND)}
                  className="w-fit bg-white/20 hover:bg-white/30 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 transition-all active:scale-95"
               >
                  Lihat Ledger Pemuda
               </button>
            </div>
            <div className="sm:w-1/2 p-10 space-y-6 flex flex-col justify-center">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center">
                     <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" strokeWidth={2} /></svg>
                  </div>
                  <div className="flex-1">
                     <h5 className="font-black text-slate-800 text-sm uppercase leading-none">Pengurus Karang Taruna</h5>
                     <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Organisasi Kepemudaan RT 05</p>
                  </div>
               </div>
               <button 
                  onClick={() => onNavigate(Page.YOUTH_OFFICIALS)}
                  className="w-full py-4 bg-slate-900 text-white rounded-[24px] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
               >
                  Lihat Profil Pengurus Pemuda
               </button>
            </div>
         </div>
      </div>

      {/* SALDO KAS UTAMA */}
      <div className="bg-slate-950 rounded-[56px] p-1 shadow-2xl overflow-hidden relative border border-white/10">
        <div className="bg-white/5 p-10 flex items-center justify-between text-white">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-emerald-600 rounded-[28px] flex items-center justify-center shadow-2xl border border-emerald-400/30 relative">
              {notifs[Page.FINANCE] && <div className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full border-2 border-slate-950 animate-pulse"></div>}
              <span className="text-white text-2xl font-black">Rp</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-emerald-300 font-black tracking-[0.3em] uppercase opacity-60">Kas Utama RT 05</span>
              <span className="text-4xl font-black tracking-tighter mt-2">Rp {(currentBalance ?? 0).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={() => onNavigate(Page.FINANCE)} className="w-14 h-14 bg-white/10 rounded-[22px] flex items-center justify-center text-white backdrop-blur-3xl hover:bg-white/20 transition-all border border-white/5">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={4}/></svg>
          </button>
        </div>
      </div>

      {/* WARTA TERKINI FEED */}
      <div className="space-y-8 pt-4">
        <div className="flex items-center justify-between px-2">
           <div className="flex flex-col">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] flex items-center gap-3">
                <div className="w-4 h-[2px] bg-indigo-50 rounded-full"></div>
                Warta Terkini
              </h3>
           </div>
           <button onClick={() => onNavigate(Page.NEWS)} className="text-[10px] font-black uppercase text-indigo-600 hover:underline tracking-widest">Lihat Semua</button>
        </div>

        <div className="grid grid-cols-1 gap-8">
          {normalNews.length === 0 ? (
            <div className="py-24 text-center bg-white border border-dashed border-slate-200 rounded-[56px]">
               <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Belum ada berita terbaru</p>
            </div>
          ) : (
            normalNews.map((item) => {
              if (!item) return null;
              return (
                <div key={item.id} className="bg-white rounded-[44px] overflow-hidden shadow-sm border border-slate-100 flex flex-col sm:flex-row group hover:shadow-2xl transition-all duration-500">
                  {item.imageUrl && (
                    <div className="sm:w-1/3 aspect-video sm:aspect-auto overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                    </div>
                  )}
                  <div className="flex-1 p-10 space-y-4">
                    <div className="flex items-center gap-3 text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
                      <span className="text-indigo-600">{item.category}</span>
                      <span>•</span>
                      <span>{item.date}</span>
                    </div>
                    <h4 className="text-xl font-black text-slate-800 leading-tight tracking-tight uppercase group-hover:text-indigo-600 transition-colors line-clamp-2">{item.title}</h4>
                    <p className="text-slate-500 text-sm leading-relaxed font-medium line-clamp-2">{item.subtitle || item.content}</p>
                    <button onClick={() => onNavigate(Page.NEWS)} className="text-indigo-600 text-[10px] font-black uppercase tracking-widest pt-4 flex items-center gap-2 hover:translate-x-1 transition-transform">
                       Baca Selengkapnya
                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* YOUTUBE PROMOTION CARD */}
      <div 
        onClick={() => window.open(settings.youtubeUrl, '_blank')}
        className="bg-white rounded-[44px] border border-slate-100 shadow-sm p-8 flex flex-col sm:flex-row items-center gap-8 cursor-pointer hover:shadow-xl transition-all group"
      >
        <div className="w-20 h-20 rounded-[28px] bg-red-600 shrink-0 flex items-center justify-center text-white shadow-2xl group-hover:rotate-6 transition-transform">
           <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
             <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
           </svg>
        </div>
        <div className="flex-1 text-center sm:text-left space-y-2">
          <h4 className="font-black text-slate-800 text-xl leading-none uppercase">Kanal YouTube Resmi {settings.rtRw}</h4>
          <p className="text-sm text-slate-400 font-medium">Dokumentasi Video Kegiatan & Musyawarah Warga</p>
        </div>
        <div className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-[10px] uppercase tracking-widest group-hover:bg-red-600 group-hover:text-white transition-all">
           Tonton Sekarang
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
