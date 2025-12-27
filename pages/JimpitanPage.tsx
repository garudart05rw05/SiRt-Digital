
import React, { useState, useEffect, useMemo } from 'react';
import { 
  JimpitanSettings, JimpitanResidentStatus, JimpitanLog, 
  UserRole, AppSettings, SecurityShift 
} from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { notificationService } from '../services/notificationService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, Legend
} from 'recharts';

interface JimpitanResident {
  id: string;
  name: string;
  houseNumber: string; 
}

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const JimpitanPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [jimpitanResidents, setJimpitanResidents] = useState<JimpitanResident[]>([]);
  const [schedule, setSchedule] = useState<SecurityShift[]>([]);
  const [settings, setSettings] = useState<JimpitanSettings>(() => storage.get<JimpitanSettings>(STORAGE_KEYS.JIMPITAN_SETTINGS, {
    dailyAmount: 1000,
    activeResidentIds: [] 
  }));

  const [appSettings, setAppSettings] = useState<AppSettings>({});
  const [status, setStatus] = useState<JimpitanResidentStatus[]>([]);
  const [logs, setLogs] = useState<JimpitanLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<'Petugas' | 'Pelunasan' | 'Warga' | 'Analisa' | 'Riwayat' | 'Admin'>('Petugas');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedResidents, setCheckedResidents] = useState<string[]>([]);
  const [officerEmail, setOfficerEmail] = useState(''); 
  const [isEmailAutoFilled, setIsEmailAutoFilled] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState<JimpitanResident | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyMonth, setHistoryMonth] = useState(new Date().toISOString().slice(0, 7)); 
  
  const [selectedResidentId, setSelectedResidentId] = useState<string>('');
  const [resHistoryMonth, setResHistoryMonth] = useState(new Date().toISOString().slice(0, 7));

  const [newName, setNewName] = useState('');
  const [newOrder, setNewHouse] = useState('');
  const [tempDailyAmount, setTempDailyAmount] = useState<number>(settings.dailyAmount || 1000);
  const [settlementDays, setSettlementDays] = useState(30);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

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
        setTempDailyAmount(data.dailyAmount);
      }
    });
    const unsubApp = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        setAppSettings(docSnap.data().data || {});
      }
    });

    const cloudStatus = storage.get<any>('rt_cloud_status', null);
    if (cloudStatus?.isConnected && cloudStatus?.accountEmail) {
      setOfficerEmail(cloudStatus.accountEmail);
      setIsEmailAutoFilled(true);
    } else {
      setOfficerEmail('garudart05rw05@gmail.com');
      setIsEmailAutoFilled(true);
    }

    return () => { 
      unsubSchedule(); unsubResidents(); unsubLogs(); unsubStatus(); unsubSettings(); unsubApp();
    };
  }, []);

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}-${month}-${year}`;
  };

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

  const isResidentLunasOnDate = (resId: string, dateStr: string) => {
    const s = (status || []).find(st => st && st.residentId === resId);
    if (!s || !s.paidUntil) return false;
    return new Date(s.paidUntil) >= new Date(dateStr);
  };

  const currentSummary = useMemo(() => {
    const week = getWeekTypeForDate(selectedDate);
    const day = getDayNameIndo(selectedDate);
    const piket = (schedule || []).find(s => s && s.week === week && s.day === day);
    
    const allIds = (jimpitanResidents || []).map(r => r.id);
    const prepaidIds = allIds.filter(id => isResidentLunasOnDate(id, selectedDate));
    const cashPaidIds = (checkedResidents || []).filter(id => !prepaidIds.includes(id));
    const unpaidIds = allIds.filter(id => !prepaidIds.includes(id) && !cashPaidIds.includes(id));

    const getNames = (ids: string[]) => ids.map(id => {
      const r = jimpitanResidents.find(res => res.id === id);
      return r ? `${r.name} (${r.houseNumber})` : '-';
    });

    return {
      prepaidIds,
      cashPaidIds,
      unpaidIds,
      totalCash: cashPaidIds.length * (settings.dailyAmount || 1000),
      collector: piket ? `${piket.leader} & Regu` : 'Petugas Umum',
      paidNames: getNames(cashPaidIds),
      prepaidNames: getNames(prepaidIds),
      unpaidNames: getNames(unpaidIds)
    };
  }, [jimpitanResidents, checkedResidents, selectedDate, schedule, settings.dailyAmount]);

  const filteredLogs = useMemo(() => {
    return (logs || []).filter(log => {
      const search = (historySearch || '').toLowerCase();
      const collector = (log.collectorName || '').toLowerCase();
      return collector.includes(search) && (log.date || '').startsWith(historyMonth);
    });
  }, [logs, historySearch, historyMonth]);

  const calendarDays = useMemo(() => {
    if (!resHistoryMonth) return [];
    const [year, month] = resHistoryMonth.split('-').map(Number);
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, dateStr });
    }
    return days;
  }, [resHistoryMonth]);

  const getDayStatus = (residentId: string, dateStr: string) => {
    if (!residentId) return 'NONE';
    if (isResidentLunasOnDate(residentId, dateStr)) return 'PREPAID';
    const dayLog = logs.find(l => l.date === dateStr);
    if (!dayLog) return 'NONE'; 
    if (dayLog.collectedResidentIds.includes(residentId)) return 'PAID';
    if (dayLog.unpaidResidentIds?.includes(residentId)) return 'UNPAID';
    return 'NONE';
  };

  const analyticsData = useMemo(() => {
    const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const daysIndo = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    
    const trendMap: Record<string, number> = {};
    monthsIndo.forEach(m => trendMap[m] = 0);
    
    const dayStats: Record<string, { total: number, count: number }> = {};
    daysIndo.forEach(d => dayStats[d] = { total: 0, count: 0 });
    
    let yearlyTotal = 0;
    let monthlyTotal = 0;
    let cashCount = 0;
    let prepaidCount = 0;
    const now = new Date();
    const currentM = now.getMonth();
    const currentY = now.getFullYear();

    (logs || []).forEach(log => {
      const d = new Date(log.date);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const dayName = daysIndo[d.getDay()];

      if (y === currentY) {
        trendMap[monthsIndo[mIdx]] += (log.totalCashReceived || 0);
        yearlyTotal += (log.totalCashReceived || 0);
        if (mIdx === currentM) monthlyTotal += (log.totalCashReceived || 0);
      }

      if (dayStats[dayName]) {
        dayStats[dayName].total += (log.totalCashReceived || 0);
        dayStats[dayName].count += 1;
      }

      cashCount += (log.collectedResidentIds?.length || 0);
      prepaidCount += (log.autoPaidResidentIds?.length || 0);
    });

    return {
      monthlyTrend: Object.entries(trendMap).map(([name, total]) => ({ name, total })),
      dayEfficiency: Object.entries(dayStats).map(([name, s]) => ({ 
        name, 
        avg: s.count > 0 ? Math.round(s.total / s.count) : 0 
      })),
      participation: [
        { name: 'Setoran Tunai', value: cashCount, color: '#4f46e5' }, 
        { name: 'Warga Prepaid', value: prepaidCount, color: '#10b981' }
      ],
      summary: { 
        yearlyTotal, 
        monthlyTotal, 
        avgSession: logs.length > 0 ? Math.round(yearlyTotal / logs.length) : 0,
        bestDay: Object.entries(dayStats).sort((a,b) => b[1].total - a[1].total)[0][0]
      }
    };
  }, [logs]);

  const handleSaveLog = async () => {
    setIsProcessing(true);
    const newLog: JimpitanLog = { 
      id: `JIM-${Date.now()}`, 
      date: selectedDate, 
      collectorName: currentSummary.collector, 
      nominalPerWarga: settings.dailyAmount, 
      collectedResidentIds: currentSummary.cashPaidIds, 
      autoPaidResidentIds: currentSummary.prepaidIds, 
      unpaidResidentIds: currentSummary.unpaidIds,
      totalCashReceived: currentSummary.totalCash,
      recipientEmail: officerEmail 
    };

    const updatedList = [newLog, ...(logs || [])];
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_LOGS, updatedList);
    
    if (saved) { 
      await notificationService.sendEmail(appSettings, {
        ...newLog,
        date: formatDateDDMMYYYY(selectedDate),
        resident_paid_names: currentSummary.paidNames.join(', '),
        resident_prepaid_names: currentSummary.prepaidNames.join(', '),
        resident_unpaid_names: currentSummary.unpaidNames.join(', ')
      }, 'jimpitan');
      setCheckedResidents([]); 
      setShowConfirmModal(false);
      showToast("Laporan Berhasil Diposting!");
    }
    setIsProcessing(false);
  };

  const handleSaveSettlement = async () => {
    if (!showSettlementModal) return;
    setIsProcessing(true);
    const residentId = showSettlementModal.id;
    const currentStatus = status.find(s => s.residentId === residentId);
    let baseDate = new Date();
    if (currentStatus?.paidUntil && new Date(currentStatus.paidUntil) > baseDate) {
      baseDate = new Date(currentStatus.paidUntil);
    }
    const newPaidUntil = new Date(baseDate.getTime() + (settlementDays * 24 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const updatedStatus = status.some(s => s.residentId === residentId)
      ? status.map(s => s.residentId === residentId ? { ...s, paidUntil: newPaidUntil } : s)
      : [...status, { residentId, paidUntil: newPaidUntil }];
    
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_STATUS, updatedStatus);
    if (saved) {
      setShowSettlementModal(null);
      showToast("Data pelunasan berhasil diperbarui.");
    }
    setIsProcessing(false);
  };

  const handleAddResident = async () => {
    if (!newName || !newOrder) return;
    const newRes: JimpitanResident = { id: `JR-${Date.now()}`, name: newName, houseNumber: newOrder };
    const updated = [...jimpitanResidents, newRes];
    const saved = await storage.set(STORAGE_KEYS.JIMPITAN_RESIDENTS, updated);
    if (saved) {
      setNewName(''); setNewHouse('');
      showToast("Warga wajib jimpitan ditambahkan.");
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (!window.confirm("Hapus warga ini dari daftar wajib jimpitan?")) return;
    const updated = jimpitanResidents.filter(r => r.id !== id);
    await storage.set(STORAGE_KEYS.JIMPITAN_RESIDENTS, updated);
    showToast("Warga dihapus dari daftar.");
  };

  // Fix: Corrected variable name from selectedMemberId to selectedResidentId to resolve compilation error
  const individualHistory = useMemo(() => {
    if (!selectedResidentId) return [];
    return logs.filter(l => 
      l.collectedResidentIds.includes(selectedResidentId) || 
      l.autoPaidResidentIds.includes(selectedResidentId) ||
      l.unpaidResidentIds?.includes(selectedResidentId)
    ).slice(0, 10);
  }, [selectedResidentId, logs]);

  const handleSelectAll = () => {
    const notPrepaidIds = jimpitanResidents
      .filter(r => !isResidentLunasOnDate(r.id, selectedDate))
      .map(r => r.id);
    setCheckedResidents(notPrepaidIds);
    showToast(`Memilih ${notPrepaidIds.length} warga.`);
  };

  const handleClearAll = () => {
    setCheckedResidents([]);
    showToast("Pilihan dikosongkan.", "info");
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      {/* Toast Alert */}
      {toast.show && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[2000] w-[90%] max-w-sm animate-page-enter">
           <div className={`p-5 rounded-[28px] shadow-2xl backdrop-blur-xl flex items-center gap-4 border-2 ${
             toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/30' : 
             toast.type === 'error' ? 'bg-rose-600/90 border-rose-400/30' : 'bg-indigo-600/90 border-indigo-400/30'
           } text-white`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-widest leading-tight">{toast.message}</p>
           </div>
        </div>
      )}

      {/* HEADER */}
      <div className="bg-indigo-900 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Jimpitan Digital</h2>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Laporan Iuran RT Terpadu</p>
             </div>
             <button onClick={() => window.print()} className="bg-white/20 p-4 rounded-2xl border border-white/20 active:scale-90 transition-all shadow-lg"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          </div>
          <div className="flex gap-1 bg-black/20 p-1 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {['Petugas', 'Pelunasan', 'Warga', 'Analisa', 'Riwayat', 'Admin'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[70px] py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-900 shadow-xl' : 'text-white/40'}`}>{t}</button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'Petugas' && (
        <div className="space-y-6 animate-page-enter no-print">
          <div className="bg-slate-950 text-white p-7 rounded-[40px] flex items-center justify-center gap-6 shadow-2xl border border-white/5">
             <div className="w-16 h-16 bg-indigo-500/20 rounded-[22px] flex items-center justify-center text-amber-400">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Koordinator Ronda</p>
                <h4 className="text-xl font-black uppercase mt-1 truncate">{currentSummary.collector}</h4>
             </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-8">
             <div className="flex justify-between items-center bg-slate-50 p-4 rounded-[28px] border border-slate-100">
                <div>
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Data Tanggal</p>
                   <input type="date" className="bg-transparent border-none text-sm font-black text-slate-800 outline-none mt-0.5" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                </div>
                <div className="text-right">
                   <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Nominal / Warga</p>
                   <p className="text-sm font-black text-indigo-600">Rp {(settings.dailyAmount ?? 1000).toLocaleString()}</p>
                </div>
             </div>

             <div className="space-y-4 relative group">
                <div className="flex justify-between items-center px-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                     <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" strokeWidth={2.5}/></svg>
                     Email Penerima Laporan
                   </label>
                   {isEmailAutoFilled && (
                     <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100">
                        <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[7px] font-black uppercase">Google Verified</span>
                     </div>
                   )}
                </div>
                <div className="relative">
                  <input 
                    type="email" 
                    placeholder="nama.petugas@gmail.com" 
                    className={`w-full ${isEmailAutoFilled ? 'bg-slate-900 text-indigo-200' : 'bg-slate-50 text-slate-800'} border border-slate-100 rounded-[24px] pl-14 pr-6 py-5 text-sm font-black outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-300 shadow-inner`} 
                    value={officerEmail} 
                    onChange={e => { setOfficerEmail(e.target.value); setIsEmailAutoFilled(false); }} 
                  />
                  <div className={`absolute left-6 top-1/2 -translate-y-1/2 ${isEmailAutoFilled ? 'text-indigo-400' : 'text-slate-300'} group-focus-within:text-indigo-500 transition-colors`}>
                     <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 13.9a3.11 3.11 0 1 0 0-6.22 3.11 3.11 0 0 0 0 6.22z"/>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14.5a6.5 6.5 0 0 0-6.5 6.5c0 1.61.59 3.09 1.56 4.23l.27.31c.14.16.27.32.41.47l.45.45c1.07.97 2.45 1.54 3.81 1.54s2.74-.57 3.81-1.54l.45-.45c.14-.15.27-.31.41-.47l.27-.31c.97-1.14 1.56-2.62 1.56-4.23a6.5 6.5 0 0 0-6.5-6.5zm-3.53 10.15c.67-.71 1.56-1.15 2.53-1.15s1.86.44 2.53 1.15c-.67.72-1.56 1.15-2.53 1.15s-1.86-.43-2.53-1.15z"/>
                     </svg>
                  </div>
                </div>
             </div>

             <div className="space-y-4">
                <div className="flex gap-2 px-2">
                   <button 
                     onClick={handleSelectAll}
                     className="flex-1 bg-indigo-50 text-indigo-700 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-indigo-100 active:scale-95 transition-all"
                   >
                     Pilih Semua Warga
                   </button>
                   <button 
                     onClick={handleClearAll}
                     className="flex-1 bg-slate-50 text-slate-500 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-slate-100 active:scale-95 transition-all"
                   >
                     Kosongkan Pilihan
                   </button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                   {jimpitanResidents.map(resident => {
                     const isPrepaid = isResidentLunasOnDate(resident.id, selectedDate);
                     const isChecked = isPrepaid || checkedResidents.includes(resident.id);
                     return (
                       <div key={resident.id} 
                         onClick={() => !isPrepaid && setCheckedResidents(prev => prev.includes(resident.id) ? prev.filter(i => i !== resident.id) : [...prev, resident.id])} 
                         className={`p-5 rounded-[32px] border transition-all flex items-center justify-between cursor-pointer ${isPrepaid ? 'bg-emerald-50 border-emerald-100' : isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-100'}`}
                       >
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-[18px] flex items-center justify-center font-black text-[11px] ${isPrepaid ? 'bg-emerald-600 text-white' : isChecked ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{resident.houseNumber}</div>
                             <div>
                               <p className="text-sm font-black text-slate-800 uppercase leading-none">{resident.name}</p>
                               {isPrepaid && <p className="text-[8px] font-black text-emerald-600 uppercase mt-1.5 tracking-widest">Status: Prepaid ✅</p>}
                             </div>
                          </div>
                          {!isPrepaid && (
                            <div className={`w-6 h-6 rounded-full border-2 transition-all flex items-center justify-center ${isChecked ? 'bg-indigo-600 border-indigo-600 shadow-md' : 'border-slate-200'}`}>
                               {isChecked && <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          )}
                       </div>
                     );
                   })}
                </div>
             </div>
             
             <div className="bg-slate-950 p-7 rounded-[36px] flex justify-between items-center shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tunai Masuk</p>
                  <p className="text-2xl font-black text-white">Rp {currentSummary.totalCash.toLocaleString()}</p>
                </div>
                <button 
                  onClick={() => {
                    if (checkedResidents.length === 0) {
                      showToast("Pilih minimal satu warga yang bayar!", "error");
                      return;
                    }
                    setShowConfirmModal(true);
                  }} 
                  className="relative z-10 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  Selesai Ronda
                </button>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Analisa' && (
        <div className="space-y-8 animate-page-enter no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-indigo-600 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Tahun Ini</p>
                <h4 className="text-3xl font-black mt-2">Rp {analyticsData.summary.yearlyTotal.toLocaleString()}</h4>
                <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
             </div>
             <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Bulan Ini</p>
                <h4 className="text-3xl font-black text-slate-800 mt-2">Rp {analyticsData.summary.monthlyTotal.toLocaleString()}</h4>
             </div>
             <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Rata-rata / Ronda</p>
                <h4 className="text-3xl font-black text-indigo-600 mt-2">Rp {analyticsData.summary.avgSession.toLocaleString()}</h4>
             </div>
             <div className="bg-slate-900 border border-slate-800 p-8 rounded-[40px] shadow-sm text-white">
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Hari Teraktif</p>
                <h4 className="text-2xl font-black mt-2 uppercase">{analyticsData.summary.bestDay}</h4>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Grafik Tren Bulanan */}
             <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Trend Kas Bulanan</h3>
                   <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-indigo-500"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">Kas Masuk</span>
                   </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analyticsData.monthlyTrend}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="url(#colorTotal)" strokeWidth={4} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Grafik Efisiensi Hari Ronda */}
             <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Efisiensi Pendapatan Per Hari</h3>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analyticsData.dayEfficiency}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                      <YAxis hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }}
                      />
                      <Bar dataKey="avg" radius={[10, 10, 0, 0]}>
                         {analyticsData.dayEfficiency.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.avg > 0 ? '#4f46e5' : '#e2e8f0'} fillOpacity={0.8} />
                         ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest italic leading-relaxed px-10">Grafik menunjukkan rata-rata nominal rupiah yang terkumpul pada setiap hari ronda.</p>
             </div>

             {/* Rasio Partisipasi */}
             <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2 text-center">Partisipasi Pembayaran</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analyticsData.participation} cx="50%" cy="50%" innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                        {analyticsData.participation.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Info Tambahan */}
             <div className="bg-indigo-50 border border-indigo-100 p-10 rounded-[56px] flex flex-col justify-center items-center text-center space-y-4 shadow-inner">
                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-lg">
                   <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>
                </div>
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest">Optimasi Ronda</h4>
                <p className="text-xs text-indigo-700/70 font-medium leading-relaxed">Analisa data menunjukkan tingkat partisipasi iuran digital membantu peningkatan saldo kas sebesar <span className="font-black">15%</span> dibandingkan metode manual konvensional.</p>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Warga' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 block">Pilih Warga & Periode</label>
                <div className="flex flex-col sm:flex-row gap-3">
                   <select 
                     className="flex-[2] bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xs appearance-none"
                     value={selectedResidentId}
                     onChange={e => setSelectedResidentId(e.target.value)}
                   >
                     <option value="">-- Pilih Nama Warga --</option>
                     {jimpitanResidents.map(res => <option key={res.id} value={res.id}>{res.name} ({res.houseNumber})</option>)}
                   </select>
                   <input 
                     type="month" 
                     className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 outline-none font-black text-xs border border-slate-100" 
                     value={resHistoryMonth} 
                     onChange={e => setResHistoryMonth(e.target.value)} 
                   />
                </div>
             </div>

             {selectedResidentId ? (
                <div className="space-y-10 animate-page-enter">
                   <div className="bg-violet-50 p-7 rounded-[40px] border border-violet-100 flex items-center justify-between shadow-inner">
                      <div>
                         <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest">Akumulasi Setoran</p>
                         <p className="text-3xl font-black text-violet-800 tracking-tight">Rp {(individualHistory.reduce((acc, l) => acc + (l.nominalPerWarga || 0), 0) || 0).toLocaleString()}</p>
                      </div>
                      <div className="w-16 h-16 bg-white rounded-3xl flex flex-col items-center justify-center shadow-lg">
                         <span className="text-xs font-black text-violet-700 leading-none">{individualHistory.length}</span>
                         <span className="text-[7px] font-bold text-slate-400 uppercase mt-1">Kali</span>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="flex items-center justify-between px-2">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Kalender Iuran</h4>
                        <div className="flex gap-4">
                           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Tunai</span></div>
                           <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-indigo-500"></div><span className="text-[8px] font-bold text-slate-400 uppercase">Prepaid</span></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-2">
                         {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
                           <div key={i} className="text-center py-2 text-[9px] font-black text-slate-300 uppercase">{d}</div>
                         ))}
                         {calendarDays.map((day, i) => {
                            if (!day) return <div key={i} className="aspect-square"></div>;
                            const st = getDayStatus(selectedResidentId, day.dateStr);
                            return (
                              <div key={i} className={`aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                st === 'PAID' ? 'bg-emerald-600 text-white shadow-lg' : 
                                st === 'PREPAID' ? 'bg-indigo-600 text-white shadow-lg' : 
                                st === 'UNPAID' ? 'bg-rose-100 text-rose-600' :
                                'bg-slate-50 text-slate-300'
                              }`}>
                                {day.day}
                              </div>
                            );
                         })}
                      </div>
                   </div>
                </div>
             ) : (
                <div className="py-24 text-center space-y-4 border-2 border-dashed border-slate-50 rounded-[40px]">
                   <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-200">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeWidth={2}/></svg>
                   </div>
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Silakan Pilih Warga Untuk Melihat Kalender</p>
                </div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'Pelunasan' && (
        <div className="space-y-6 animate-page-enter no-print">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Data Pelunasan Di Muka</h3>
             <div className="space-y-4">
                {jimpitanResidents.map(res => {
                  const s = status.find(st => st.residentId === res.id);
                  return (
                    <div key={res.id} className="bg-slate-50 p-5 rounded-[32px] flex items-center justify-between border border-slate-100 group">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-xs text-indigo-600 shadow-sm">{res.houseNumber}</div>
                          <div>
                             <p className="text-sm font-black text-slate-800 uppercase">{res.name}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lunas s/d: <span className="text-indigo-600">{s?.paidUntil ? formatDateDDMMYYYY(s.paidUntil) : 'Belum ada'}</span></p>
                          </div>
                       </div>
                       {role === 'ADMIN' && (
                         <button onClick={() => setShowSettlementModal(res)} className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg active:scale-90 transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 4v16m8-8H4" strokeWidth={3} /></svg></button>
                       )}
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Riwayat' && (
        <div className="space-y-6 animate-page-enter no-print">
          <div className="bg-white border border-slate-100 p-6 rounded-[40px] shadow-sm space-y-4">
             <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                   <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-12 py-4 text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" placeholder="Cari Petugas..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
                   <svg className="w-5 h-5 absolute left-4 top-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
                </div>
                <div className="flex gap-2">
                   <input type="month" className="flex-1 bg-slate-50 rounded-2xl px-6 py-4 text-xs font-black uppercase outline-none text-indigo-600 border border-slate-100 focus:border-indigo-500" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} />
                   <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl flex items-center gap-2 active:scale-95 transition-all">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth={2.5}/></svg>
                     Cetak
                   </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             {filteredLogs.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-[48px] border border-dashed border-slate-200 text-slate-300 font-black uppercase text-[10px] tracking-widest">Tidak ada riwayat di periode ini</div>
             ) : (
               filteredLogs.map(log => (
                 <div key={log.id} className="bg-white rounded-[44px] border border-slate-50 shadow-sm p-8 flex items-center justify-between group transition-all hover:shadow-xl">
                    <div className="flex items-center gap-6">
                       <div className="w-14 h-14 bg-indigo-50 rounded-[22px] flex items-center justify-center text-indigo-700 shadow-inner group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" /></svg>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">{formatDateDDMMYYYY(log.date)}</p>
                          <h4 className="font-black text-slate-800 uppercase text-base tracking-tight">{log.collectorName}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Rp {log.totalCashReceived.toLocaleString()} dari {log.collectedResidentIds.length} Rumah</p>
                       </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {activeTab === 'Admin' && role === 'ADMIN' && (
        <div className="space-y-10 animate-page-enter no-print">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Konfigurasi Jimpitan</h3>
             <div className="space-y-4">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Iuran Harian (Rp)</label>
                   <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 font-black text-xl outline-none focus:ring-2 focus:ring-indigo-500" value={tempDailyAmount} onChange={e => setTempDailyAmount(Number(e.target.value))} />
                </div>
                <button onClick={async () => {
                  const updated = { ...settings, dailyAmount: tempDailyAmount };
                  const saved = await storage.set(STORAGE_KEYS.JIMPITAN_SETTINGS, updated);
                  if (saved) showToast("Nominal berhasil diperbarui.");
                }} className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Simpan Perubahan Nominal</button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <div className="flex justify-between items-center px-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Kelola Daftar Warga</h3>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{jimpitanResidents.length} KK Terdaftar</span>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nama Warga" className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none text-xs font-bold focus:border-indigo-500 transition-all" value={newName} onChange={e => setNewName(e.target.value)} />
                <input type="text" placeholder="No. Rumah" className="bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none text-xs font-bold focus:border-indigo-500 transition-all" value={newOrder} onChange={e => setNewHouse(e.target.value)} />
             </div>
             <button onClick={handleAddResident} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg active:scale-95 transition-all">Tambah Warga Wajib Iuran</button>
             <div className="space-y-3 pt-6 border-t border-slate-50">
                {jimpitanResidents.map(res => (
                   <div key={res.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[28px] border border-slate-100 group hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[10px] text-indigo-600 shadow-sm">{res.houseNumber}</div>
                        <p className="text-xs font-black text-slate-700 uppercase">{res.name}</p>
                      </div>
                      <button onClick={() => handleDeleteResident(res.id)} className="text-rose-600 text-[10px] font-black uppercase hover:bg-rose-50 px-4 py-2 rounded-xl transition-all">Hapus</button>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL DENGAN RINCIAN DETAIL SESUAI PERMINTAAN USER */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[1500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-xl rounded-[56px] shadow-2xl overflow-hidden animate-page-enter flex flex-col max-h-[90vh]">
              <div className="bg-indigo-600 p-10 text-white space-y-2 text-center relative overflow-hidden shrink-0">
                 <h3 className="text-3xl font-black uppercase tracking-tight relative z-10">Rincian Laporan</h3>
                 <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest relative z-10">Validasi Data Sebelum Kirim</p>
                 <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-8 no-scrollbar">
                 {/* RINGKASAN DATA */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total Tunai</p>
                       <p className="text-2xl font-black text-slate-900 mt-1">Rp {currentSummary.totalCash.toLocaleString()}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                       <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Tgl Ronda</p>
                       <p className="text-lg font-black text-indigo-600 mt-1">{formatDateDDMMYYYY(selectedDate)}</p>
                    </div>
                 </div>

                 {/* RINCIAN PER KATEGORI */}
                 <div className="space-y-6">
                    {/* SEKSI TUNAI */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center px-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Penerimaan Tunai ({currentSummary.cashPaidIds.length})</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                       </div>
                       <div className="bg-emerald-50/50 rounded-[28px] p-5 border border-emerald-100 flex flex-wrap gap-2">
                          {currentSummary.paidNames.length > 0 ? (
                            currentSummary.paidNames.map((name, i) => <span key={i} className="bg-white border border-emerald-100 px-3 py-1.5 rounded-xl text-[9px] font-black text-emerald-700 shadow-sm">{name}</span>)
                          ) : (
                            <p className="text-[9px] text-emerald-600 font-bold italic">Tidak ada setoran tunai</p>
                          )}
                       </div>
                    </div>

                    {/* SEKSI PREPAID */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center px-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Warga Prepaid / Lunas ({currentSummary.prepaidIds.length})</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                       </div>
                       <div className="bg-indigo-50/50 rounded-[28px] p-5 border border-indigo-100 flex flex-wrap gap-2">
                          {currentSummary.prepaidNames.length > 0 ? (
                            currentSummary.prepaidNames.map((name, i) => <span key={i} className="bg-white border border-indigo-100 px-3 py-1.5 rounded-xl text-[9px] font-black text-indigo-700 shadow-sm">{name}</span>)
                          ) : (
                            <p className="text-[9px] text-indigo-600 font-bold italic">Tidak ada warga lunas lunas di muka</p>
                          )}
                       </div>
                    </div>

                    {/* SEKSI BELUM BAYAR */}
                    <div className="space-y-3">
                       <div className="flex justify-between items-center px-2">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Belum Membayar ({currentSummary.unpaidIds.length})</h4>
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                       </div>
                       <div className="bg-rose-50/50 rounded-[28px] p-5 border border-rose-100 flex flex-wrap gap-2">
                          {currentSummary.unpaidNames.length > 0 ? (
                            currentSummary.unpaidNames.map((name, i) => <span key={i} className="bg-white border border-rose-100 px-3 py-1.5 rounded-xl text-[9px] font-black text-rose-700 shadow-sm">{name}</span>)
                          ) : (
                            <p className="text-[9px] text-rose-600 font-bold italic">Lunas Semua ✅</p>
                          )}
                       </div>
                    </div>
                 </div>

                 {/* EMAIL RECIPIENT */}
                 <div className="bg-slate-900 p-6 rounded-[32px] flex items-center justify-between border border-white/5">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center text-indigo-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 -2v10a2 2 0 002 2z" strokeWidth={2.5} /></svg>
                       </div>
                       <p className="text-[9px] font-black text-white/50 uppercase tracking-widest truncate max-w-[150px]">{officerEmail}</p>
                    </div>
                    <span className="text-[8px] font-black text-indigo-400 uppercase tracking-[0.3em]">Email Receiver</span>
                 </div>
              </div>

              <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
                 <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-5 font-black text-xs uppercase text-slate-400 tracking-widest active:scale-95 transition-all">Batal</button>
                 <button onClick={handleSaveLog} disabled={isProcessing} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[32px] font-black uppercase text-xs shadow-xl active:scale-95 transition-all">
                    {isProcessing ? 'SINKRONISASI...' : 'KIRIM LAPORAN'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* SETTLEMENT MODAL */}
      {showSettlementModal && (
        <div className="fixed inset-0 z-[1500] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[56px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="bg-indigo-600 p-8 text-white text-center">
                 <h3 className="text-2xl font-black uppercase leading-none">Pelunasan Di Muka</h3>
                 <p className="text-[10px] font-bold mt-2 opacity-70 uppercase tracking-widest">{showSettlementModal.name} ({showSettlementModal.houseNumber})</p>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tambah Masa Lunas (Hari)</label>
                    <input type="number" className="w-full bg-slate-100 border-none rounded-2xl px-6 py-5 outline-none font-black text-2xl text-center" value={settlementDays} onChange={e => setSettlementDays(Number(e.target.value))} />
                    <p className="text-[9px] text-slate-400 font-bold text-center mt-2 uppercase tracking-widest">Estimasi Bayar: Rp {(settlementDays * settings.dailyAmount).toLocaleString()}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => setShowSettlementModal(null)} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400 tracking-widest active:scale-95 transition-all">Batal</button>
                    <button onClick={handleSaveSettlement} disabled={isProcessing} className="flex-[2] bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all">Proses Lunas</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default JimpitanPage;
