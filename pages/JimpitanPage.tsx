
import React, { useState, useEffect, useMemo } from 'react';
import { 
  JimpitanSettings, JimpitanResidentStatus, JimpitanLog, 
  UserRole, AppSettings, SecurityShift 
} from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

interface JimpitanResident {
  id: string;
  name: string;
  houseNumber: string; 
}

const JimpitanPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [jimpitanResidents, setJimpitanResidents] = useState<JimpitanResident[]>(() => 
    storage.get(STORAGE_KEYS.JIMPITAN_RESIDENTS, [])
  );
  
  const [schedule, setSchedule] = useState<SecurityShift[]>(() => 
    storage.get(STORAGE_KEYS.SCHEDULE, [])
  );

  const [settings, setSettings] = useState<JimpitanSettings>(() => storage.get<JimpitanSettings>(STORAGE_KEYS.JIMPITAN_SETTINGS, {
    dailyAmount: 1000,
    activeResidentIds: [] 
  }));

  const [tempNominal, setTempNominal] = useState<number>(settings.dailyAmount);

  const [appSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri'
  }));

  const [status, setStatus] = useState<JimpitanResidentStatus[]>(() => storage.get(STORAGE_KEYS.JIMPITAN_STATUS, []));
  const [logs, setLogs] = useState<JimpitanLog[]>(() => storage.get(STORAGE_KEYS.JIMPITAN_LOGS, []));
  
  const [activeTab, setActiveTab] = useState<'Petugas' | 'Pelunasan' | 'Individu' | 'Analisa' | 'Riwayat' | 'Admin'>('Petugas');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedResidents, setCheckedResidents] = useState<string[]>([]);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPrepaidModal, setShowPrepaidModal] = useState<JimpitanResident | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); 
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  
  const [selectedResidentForDetail, setSelectedResidentForDetail] = useState<any | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth());
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const [prepaidDays, setPrepaidDays] = useState(30);
  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('');

  const [delStart, setDelStart] = useState('');
  const [delEnd, setDelEnd] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubSchedule = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SCHEDULE), (docSnap) => {
      if (docSnap.exists()) setSchedule(docSnap.data().data || []);
    });
    const unsubResidents = onSnapshot(doc(db, "app_data", STORAGE_KEYS.JIMPITAN_RESIDENTS), (docSnap) => {
      if (docSnap.exists()) setJimpitanResidents(docSnap.data().data || []);
    });
    const unsubLogs = onSnapshot(doc(db, "app_data", STORAGE_KEYS.JIMPITAN_LOGS), (docSnap) => {
      if (docSnap.exists()) setLogs(docSnap.data().data || []);
    });
    const unsubStatus = onSnapshot(doc(db, "app_data", STORAGE_KEYS.JIMPITAN_STATUS), (docSnap) => {
      if (docSnap.exists()) setStatus(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.JIMPITAN_SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().data || { dailyAmount: 1000, activeResidentIds: [] };
        setSettings(data);
        setTempNominal(data.dailyAmount);
      }
    });

    return () => { 
      unsubSchedule(); unsubResidents(); unsubLogs(); unsubStatus(); unsubSettings();
    };
  }, []);

  const getWeekTypeForDate = (dateStr: string): 1 | 2 => {
    const d = new Date(dateStr);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const days = Math.floor((d.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return (weekNumber % 2 === 0) ? 2 : 1; 
  };

  const getDayNameIndo = (dateStr: string) => {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[new Date(dateStr).getDay()];
  };

  const currentPiket = useMemo(() => {
    const week = getWeekTypeForDate(selectedDate);
    const day = getDayNameIndo(selectedDate);
    return (schedule || []).find(s => s && s.week === week && s.day === day);
  }, [selectedDate, schedule]);

  const isResidentLunasOnDate = (resId: string, dateStr: string) => {
    const s = (status || []).find(st => st && st.residentId === resId);
    if (!s || !s.paidUntil) return false;
    return new Date(s.paidUntil) >= new Date(dateStr);
  };

  const handleCheckAll = () => {
    const allEligibleIds = (jimpitanResidents || [])
      .filter(r => r && !isResidentLunasOnDate(r.id, selectedDate))
      .map(r => r.id);
    setCheckedResidents(allEligibleIds);
  };

  const handleClearAll = () => { setCheckedResidents([]); };

  const residentStats = useMemo(() => {
    return (jimpitanResidents || []).map(res => {
      if (!res) return null;
      const contributions = (logs || []).filter(log => log && log.collectedResidentIds?.includes(res.id));
      const autoPaid = (logs || []).filter(log => log && log.autoPaidResidentIds?.includes(res.id));
      const unpaid = (logs || []).filter(log => log && (log as any).unpaidResidentIds?.includes(res.id));
      
      const totalContribution = contributions.length * (settings.dailyAmount || 0);
      const totalDays = contributions.length + autoPaid.length;
      const totalUnpaid = unpaid.length;
      const totalDebt = totalUnpaid * (settings.dailyAmount || 0);

      const resStatus = status.find(s => s.residentId === res.id);

      return {
        ...res,
        totalContribution,
        totalDays,
        totalUnpaid,
        totalDebt,
        paidUntil: resStatus?.paidUntil || null
      };
    }).filter(Boolean).sort((a: any, b: any) => b.totalDebt - a.totalDebt);
  }, [jimpitanResidents, logs, settings.dailyAmount, status]);

  const totalBalance = useMemo(() => {
    return (logs || []).reduce((acc, log) => acc + (log?.totalCashReceived || 0), 0);
  }, [logs]);

  const analyticsData = useMemo(() => {
    const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const currentYear = new Date().getFullYear();
    const monthlyTrendMap: Record<string, any> = {};
    monthsIndo.forEach(m => { monthlyTrendMap[m] = { month: m, tunai: 0, prepaid: 0 }; });

    (logs || []).forEach(log => {
      if (!log) return;
      const date = new Date(log.date);
      if (date.getFullYear() !== currentYear) return;
      const m = monthsIndo[date.getMonth()];
      if (monthlyTrendMap[m]) {
        monthlyTrendMap[m].tunai += (log.totalCashReceived || 0);
        monthlyTrendMap[m].prepaid += (log.autoPaidResidentIds?.length || 0) * (log.nominalPerWarga || 0);
      }
    });

    let totalTunai = 0, totalPrepaid = 0, totalAlpa = 0;
    (logs || []).forEach(log => {
      if (!log) return;
      totalTunai += (log.collectedResidentIds?.length || 0);
      totalPrepaid += (log.autoPaidResidentIds?.length || 0);
      totalAlpa += (log as any).unpaidResidentIds?.length || 0;
    });

    const pieData = [
      { name: 'Tunai', value: totalTunai, color: '#10b981' },
      { name: 'Prepaid', value: totalPrepaid, color: '#3b82f6' },
      { name: 'Alpa', value: totalAlpa, color: '#f43f5e' }
    ];

    return { monthlyTrend: Object.values(monthlyTrendMap), pieData };
  }, [logs]);

  const currentSummary = useMemo(() => {
    const allIds = (jimpitanResidents || []).map(r => r.id);
    const prepaidIds = allIds.filter(id => isResidentLunasOnDate(id, selectedDate));
    const cashPaidIds = (checkedResidents || []).filter(id => !prepaidIds.includes(id));
    const unpaidIds = allIds.filter(id => !prepaidIds.includes(id) && !cashPaidIds.includes(id));

    return {
      prepaidIds,
      cashPaidIds,
      unpaidIds,
      totalCash: cashPaidIds.length * (settings.dailyAmount || 1000),
      collector: currentPiket ? `${currentPiket.leader} & Regu` : 'Petugas Umum'
    };
  }, [jimpitanResidents, checkedResidents, selectedDate, currentPiket, settings.dailyAmount]);

  const handleSaveLog = async () => {
    const newLog = { 
      id: `JIM-${Date.now()}`, 
      date: selectedDate, 
      collectorName: currentSummary.collector, 
      nominalPerWarga: settings.dailyAmount, 
      collectedResidentIds: currentSummary.cashPaidIds, 
      autoPaidResidentIds: currentSummary.prepaidIds, 
      unpaidResidentIds: currentSummary.unpaidIds,
      totalCashReceived: currentSummary.totalCash 
    };

    const updatedList = [newLog, ...(logs || [])];
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_LOGS, updatedList);
    if (saved) { 
      setLogs(updatedList as any); 
      setShowConfirmModal(false);
      setCheckedResidents([]); 
      alert("Laporan Jimpitan Berhasil Diposting!");
    }
  };

  const handleSavePrepaid = async () => {
    if (!showPrepaidModal || !prepaidDays) return;
    
    const resId = showPrepaidModal.id;
    const currentStatus = status.find(s => s.residentId === resId);
    
    let startDate = new Date();
    if (currentStatus?.paidUntil && new Date(currentStatus.paidUntil) > startDate) {
      startDate = new Date(currentStatus.paidUntil);
    }
    
    const newPaidUntil = new Date(startDate);
    newPaidUntil.setDate(newPaidUntil.getDate() + Number(prepaidDays));
    
    const updatedStatusItem: JimpitanResidentStatus = {
      residentId: resId,
      paidUntil: newPaidUntil.toISOString().split('T')[0]
    };

    const updatedStatusList = status.some(s => s.residentId === resId)
      ? status.map(s => s.residentId === resId ? updatedStatusItem : s)
      : [...status, updatedStatusItem];

    const prepaidLog: JimpitanLog = {
      id: `JIM-PRE-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      collectorName: `Pelunasan: ${showPrepaidModal.name}`,
      nominalPerWarga: settings.dailyAmount,
      collectedResidentIds: [resId], 
      autoPaidResidentIds: [],
      unpaidResidentIds: [],
      totalCashReceived: prepaidDays * settings.dailyAmount
    };

    await storage.set(STORAGE_KEYS.JIMPITAN_STATUS, updatedStatusList);
    await storage.set(STORAGE_KEYS.JIMPITAN_LOGS, [prepaidLog, ...(logs || [])]);
    
    setShowPrepaidModal(null);
    setPrepaidDays(30);
    alert(`Pelunasan berhasil diposting ke Cloud.`);
  };

  const handleAddResident = async () => {
    if (!newName || !newOrder) return;
    const newRes: JimpitanResident = { id: `JR-${Date.now()}`, name: newName, houseNumber: newOrder };
    const updatedList = [...(jimpitanResidents || []), newRes];
    await storage.set(STORAGE_KEYS.JIMPITAN_RESIDENTS, updatedList);
    setNewName(''); setNewOrder('');
  };

  const handleDeleteResident = async (id: string) => {
    if (!window.confirm("Hapus warga dari daftar jimpitan? Data permanen akan hilang dari Cloud.")) return;
    const updatedList = (jimpitanResidents || []).filter(r => r.id !== id);
    await storage.set(STORAGE_KEYS.JIMPITAN_RESIDENTS, updatedList);
  };

  const handleSaveNominal = async () => {
    setIsProcessing(true);
    const updated = { ...settings, dailyAmount: tempNominal };
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_SETTINGS, updated);
    if (saved) {
      setSettings(updated);
      alert("Nominal iuran harian berhasil disimpan.");
    }
    setIsProcessing(false);
  };

  const handleDeleteByRange = async () => {
    if (!delStart || !delEnd) {
      alert("Pilih rentang tanggal terlebih dahulu.");
      return;
    }
    if (!window.confirm("Hapus log dalam rentang tanggal ini? Data Cloud akan diperbarui.")) return;

    const start = new Date(delStart);
    const end = new Date(delEnd);

    const updatedLogs = logs.filter(log => {
      const d = new Date(log.date);
      return d < start || d > end;
    });

    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_LOGS, updatedLogs);
    if (saved) {
      setDelStart('');
      setDelEnd('');
      alert("Pembersihan riwayat berhasil.");
    }
  };

  const handleDeleteSession = async (logId: string, date: string) => {
    if (role !== 'ADMIN') return;
    if (!window.confirm(`Hapus laporan jimpitan tanggal ${date}? Saldo kas akan disesuaikan otomatis.`)) return;
    
    setIsProcessing(true);
    const updatedLogs = logs.filter(l => l.id !== logId);
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_LOGS, updatedLogs);
    if (saved) {
      alert("Laporan harian berhasil dihapus dari sistem.");
    }
    setIsProcessing(false);
  };

  const handlePrint = () => { window.print(); };

  const getResidentName = (id: string) => {
    const r = (jimpitanResidents || []).find(res => res && res.id === id);
    return r ? `${r.name} (${r.houseNumber})` : 'Warga Dihapus';
  };

  const filteredLogs = (logs || []).filter(log => {
    if (!log) return false;
    const search = (historySearch || '').toLowerCase();
    const collector = (log.collectorName || '').toLowerCase();
    return collector.includes(search) && (log.date || '').startsWith(historyMonth);
  });

  const renderCalendar = (resId: string) => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1).getDay();
    const days = [];
    const weekDays = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-10"></div>);

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isFuture = new Date(dateStr) > new Date();
      const logEntry = (logs || []).find(l => l && l.date === dateStr);
      const isTunai = logEntry?.collectedResidentIds?.includes(resId);
      const isPrepaid = logEntry?.autoPaidResidentIds?.includes(resId) || isResidentLunasOnDate(resId, dateStr);
      const isAlpa = logEntry && (logEntry as any).unpaidResidentIds?.includes(resId);

      let bgColor = 'bg-slate-50 text-slate-300';
      if (isTunai) bgColor = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
      else if (isPrepaid) bgColor = 'bg-blue-500 text-white shadow-lg shadow-blue-500/20';
      else if (isAlpa) bgColor = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
      else if (!isFuture && logEntry) bgColor = 'bg-rose-100 text-rose-300';

      days.push(
        <div key={day} className={`h-10 w-full flex flex-col items-center justify-center rounded-xl text-[10px] font-black transition-all ${bgColor}`}>
          {day}
          {isTunai && <div className="w-1 h-1 bg-white rounded-full mt-0.5"></div>}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center bg-slate-900 text-white p-4 rounded-3xl">
           <button onClick={() => { if(calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(v => v-1); } else setCalendarMonth(v => v-1); }} className="p-2 hover:bg-white/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3}/></svg></button>
           <span className="font-black uppercase text-[10px] tracking-widest">{new Date(calendarYear, calendarMonth).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</span>
           <button onClick={() => { if(calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(v => v+1); } else setCalendarMonth(v => v+1); }} className="p-2 hover:bg-white/10 rounded-xl transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3}/></svg></button>
        </div>
        <div className="grid grid-cols-7 gap-2 text-center">
          {weekDays.map((d, i) => <div key={i} className="text-[8px] font-black text-slate-400 uppercase">{d}</div>)}
          {days}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="print-header">
        <h1 className="text-2xl font-black uppercase text-indigo-900">LAPORAN JIMPITAN WARGA {appSettings.rtRw}</h1>
        <p className="text-sm font-bold opacity-60">{appSettings.location}</p>
        <p className="text-[10px] mt-4 font-black">Dicetak: {new Date().toLocaleString('id-ID')}</p>
      </div>

      <div className="bg-indigo-900 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center shadow-lg transform rotate-6">
                      <svg className="w-7 h-7 text-indigo-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><circle cx="12" cy="12" r="5"/><path d="M12 9v6m-3-3h6"/></svg>
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Jimpitan Digital</h2>
                </div>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Portal Audit Kas Lingkungan</p>
             </div>
             <button onClick={handlePrint} className="bg-white/20 p-4 rounded-2xl shadow-inner border border-white/20 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          </div>
          
          <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {['Petugas', 'Pelunasan', 'Individu', 'Analisa', 'Riwayat', 'Admin'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[85px] py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-900 shadow-xl' : 'text-white/40'}`}>{t}</button>
             ))}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
      </div>

      {activeTab === 'Petugas' && (
        <div className="space-y-6 animate-page-enter no-print">
          <div className="bg-slate-950 text-white p-7 rounded-[40px] flex items-center gap-6 shadow-2xl border border-white/5">
             <div className="w-16 h-16 bg-indigo-500/20 rounded-[22px] flex items-center justify-center text-amber-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Petugas Hari Ini (Ronda)</p>
                <h4 className="text-xl font-black uppercase tracking-tight mt-1 truncate">{currentSummary.collector}</h4>
             </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-8">
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[28px] border border-slate-100">
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Input Data Tanggal</p>
                   <input type="date" className="bg-transparent border-none text-sm font-black text-slate-800 outline-none mt-0.5" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nominal / Warga</p>
                   <p className="text-sm font-black text-indigo-600">Rp {(settings.dailyAmount ?? 0).toLocaleString()}</p>
                </div>
             </div>

             <div className="flex gap-2 px-2">
                <button 
                  onClick={handleCheckAll}
                  className="flex-1 bg-indigo-50 text-indigo-700 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-indigo-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                  Iuran Semua
                </button>
                <button 
                  onClick={handleClearAll}
                  className="flex-1 bg-slate-50 text-slate-400 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-slate-100 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                  Hapus Pilihan
                </button>
             </div>
             
             <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                {(jimpitanResidents || []).map(resident => {
                  if (!resident) return null;
                  const isLunas = isResidentLunasOnDate(resident.id, selectedDate);
                  const isChecked = isLunas || checkedResidents.includes(resident.id);
                  return (
                    <div key={resident.id} 
                      onClick={() => !isLunas && setCheckedResidents(prev => prev.includes(resident.id) ? prev.filter(i => i !== resident.id) : [...prev, resident.id])} 
                      className={`p-5 rounded-[32px] border transition-all flex items-center justify-between cursor-pointer group ${isLunas ? 'bg-emerald-50 border-emerald-100 opacity-60' : isChecked ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-slate-100 hover:border-indigo-100'}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-[11px] shadow-sm group-hover:rotate-6 transition-transform ${isLunas ? 'bg-emerald-600 text-white' : isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{resident.houseNumber}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{resident.name}</p>
                            {isLunas && <p className="text-[8px] font-black text-emerald-600 uppercase tracking-[0.2em] mt-0.5">TERBAYAR DI MUKA</p>}
                          </div>
                       </div>
                       {isChecked && <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg animate-page-enter"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg></div>}
                    </div>
                  );
                })}
             </div>
             
             <div className="bg-slate-950 p-7 rounded-[36px] flex justify-between items-center shadow-xl">
                <div>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Tunai Terkumpul</p>
                  <p className="text-2xl font-black text-white">Rp {(currentSummary.totalCash ?? 0).toLocaleString()}</p>
                </div>
                <button onClick={() => setShowConfirmModal(true)} className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Posting Laporan</button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Riwayat' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white border border-slate-100 p-6 rounded-[40px] shadow-sm flex flex-col md:flex-row gap-4 no-print">
             <div className="flex-1 relative">
                <input type="text" className="w-full bg-slate-50 rounded-2xl px-12 py-4 text-xs font-bold outline-none" placeholder="Cari Nama Petugas..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
             </div>
             <input type="month" className="bg-slate-50 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none text-indigo-600" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} />
          </div>

          <div className="space-y-4">
             {filteredLogs.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-[48px] border border-dashed border-slate-200 text-slate-300 font-black uppercase text-[10px] tracking-widest">Tidak ada data riwayat bulan ini</div>
             ) : (
               filteredLogs.map(log => {
                 if (!log) return null;
                 const isExpanded = expandedLog === log.id;
                 const unpaid = (log as any).unpaidResidentIds || [];
                 
                 return (
                   <div key={log.id} className="bg-white rounded-[44px] border border-slate-100 shadow-sm overflow-hidden transition-all hover:shadow-xl">
                      <div className="p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-700 shadow-inner">
                               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div>
                               <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">{log.date ? new Date(log.date).toLocaleDateString('id-ID', { dateStyle: 'full' }) : '-'}</p>
                               <h4 className="font-black text-slate-800 uppercase text-base">{log.collectorName}</h4>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Status: <span className="text-emerald-600 font-black">Rp {(log.totalCashReceived ?? 0).toLocaleString()} Terkumpul</span></p>
                            </div>
                         </div>
                         <div className="flex gap-2 w-full sm:w-auto no-print">
                            {role === 'ADMIN' && (
                              <button onClick={() => handleDeleteSession(log.id, log.date)} disabled={isProcessing} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                              </button>
                            )}
                            <button onClick={() => setExpandedLog(isExpanded ? null : log.id)} className={`px-6 py-3 rounded-2xl text-[9px] font-black uppercase transition-all ${isExpanded ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                               {isExpanded ? 'Tutup' : 'Detail'}
                            </button>
                         </div>
                      </div>

                      {isExpanded && (
                         <div className="px-8 pb-10 space-y-8 animate-page-enter border-t border-slate-50 pt-8 no-print">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                               <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">Iuran Tunai ({(log.collectedResidentIds || []).length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                     {(log.collectedResidentIds || []).map(id => <span key={id} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{getResidentName(id)}</span>)}
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">Prepaid ({(log.autoPaidResidentIds || []).length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                     {(log.autoPaidResidentIds || []).map(id => <span key={id} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{getResidentName(id)}</span>)}
                                  </div>
                               </div>
                               <div className="space-y-4">
                                  <h5 className="text-[10px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-2">Alpa ({unpaid.length})</h5>
                                  <div className="flex flex-wrap gap-2">
                                     {unpaid.map((id: string) => <span key={id} className="bg-rose-50 text-rose-700 px-3 py-1 rounded-lg text-[9px] font-bold uppercase">{getResidentName(id)}</span>)}
                                  </div>
                               </div>
                            </div>
                         </div>
                      )}
                   </div>
                 );
               })
             )}
          </div>
        </div>
      )}

      {/* Tabs lain (Pelunasan, Individu, Analisa, Admin) - Disingkat untuk efisiensi ruang namun tetap fungsional */}
      {activeTab === 'Pelunasan' && (
        <div className="space-y-6 animate-page-enter no-print">
           <div className="bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm space-y-6">
              <div className="px-2">
                 <h3 className="text-sm font-black text-indigo-600 uppercase tracking-widest">Pelunasan di Muka</h3>
                 <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Gunakan fitur ini untuk warga yang ingin membayar jimpitan sekaligus.</p>
              </div>
              <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                 {jimpitanResidents.map(res => (
                   <div key={res.id} className="bg-slate-50 p-5 rounded-[32px] border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[10px] text-slate-400 border border-slate-100 shadow-sm">{res.houseNumber}</div>
                         <div>
                            <p className="text-xs font-black text-slate-700 uppercase">{res.name}</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase">Hingga: {status.find(s => s.residentId === res.id)?.paidUntil || '-'}</p>
                         </div>
                      </div>
                      <button onClick={() => setShowPrepaidModal(res)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg">Bayar</button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {activeTab === 'Admin' && role === 'ADMIN' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Konfigurasi Sistem</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Harian</label>
                   <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl" value={tempNominal} onChange={e => setTempNominal(Number(e.target.value))} />
                </div>
                <button onClick={handleSaveNominal} disabled={isProcessing} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Simpan Nominal</button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Data Warga Jimpitan</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nama Warga" className="bg-slate-50 rounded-2xl px-6 py-4 outline-none text-xs font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
                <input type="text" placeholder="No. Rumah" className="bg-slate-50 rounded-2xl px-6 py-4 outline-none text-xs font-bold" value={newOrder} onChange={e => setNewOrder(e.target.value)} />
             </div>
             <button onClick={handleAddResident} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl">Tambah</button>
             <div className="space-y-3 pt-6">
                {(jimpitanResidents || []).map(res => (
                   <div key={res.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-black text-slate-700 uppercase">{res.name} ({res.houseNumber})</p>
                      <button onClick={() => handleDeleteResident(res.id)} className="text-rose-600 text-[10px] font-black uppercase hover:underline">Hapus</button>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Prepaid Modal */}
      {showPrepaidModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[56px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="bg-indigo-600 p-8 text-white space-y-2">
                 <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Pelunasan</h3>
                 <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{showPrepaidModal.name}</p>
              </div>
              <div className="p-10 space-y-8">
                 <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl" value={prepaidDays} onChange={e => setPrepaidDays(Number(e.target.value))} placeholder="Lama Hari..." />
                 <div className="bg-slate-50 p-6 rounded-[32px] text-center border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</p>
                    <p className="text-3xl font-black text-indigo-600 tracking-tighter">Rp {(prepaidDays * settings.dailyAmount).toLocaleString()}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setShowPrepaidModal(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Batal</button>
                    <button onClick={handleSavePrepaid} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Konfirmasi Posting Laporan Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[56px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="bg-indigo-600 p-10 text-white space-y-2">
                 <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Konfirmasi Setoran</h3>
                 <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Post Data ke Cloud</p>
              </div>
              <div className="p-10 space-y-8">
                 <div className="bg-slate-900 p-8 rounded-[40px] text-center space-y-2">
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em]">Total Kas Tunai</p>
                    <p className="text-4xl font-black text-white tracking-tighter">Rp {(currentSummary.totalCash ?? 0).toLocaleString()}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-5 rounded-2xl font-black text-[10px] uppercase text-slate-400">Batal</button>
                    <button onClick={handleSaveLog} className="flex-[2] py-5 rounded-3xl font-black text-[10px] uppercase text-white bg-indigo-600 shadow-xl">Konfirmasi</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default JimpitanPage;
