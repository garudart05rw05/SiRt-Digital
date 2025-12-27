
import React, { useState, useEffect, useMemo } from 'react';
import { 
  SolidaritasResident, SolidaritasLog, SolidaritasStatus, UserRole, AppSettings 
} from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend, AreaChart, Area, PieChart, Pie
} from 'recharts';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const SolidaritasPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [residents, setResidents] = useState<SolidaritasResident[]>([]);
  const [logs, setLogs] = useState<SolidaritasLog[]>([]);
  const [status, setStatus] = useState<SolidaritasStatus[]>([]);
  const [settings, setSettings] = useState<{ monthlyAmount: number }>({ monthlyAmount: 50000 });
  const [tempMonthlyAmount, setTempMonthlyAmount] = useState<number>(50000);

  const [appSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri',
    treasurerName: 'Bendahara RT',
    chairmanName: 'Ketua RT'
  }));

  const [activeTab, setActiveTab] = useState<'Monitoring' | 'Analisa' | 'Riwayat' | 'Admin'>('Monitoring');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentModal, setShowPaymentModal] = useState<SolidaritasResident | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [historySearch, setHistorySearch] = useState('');
  
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const [newName, setNewName] = useState('');
  const [newHouse, setNewHouse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'success' });

  const showToast = (message: string, type: ToastState['type'] = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  useEffect(() => {
    const unsubResidents = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SOLIDARITAS_RESIDENTS), (docSnap) => {
      if (docSnap.exists()) setResidents(docSnap.data().data || []);
    });
    const unsubLogs = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SOLIDARITAS_LOGS), (docSnap) => {
      if (docSnap.exists()) setLogs(docSnap.data().data || []);
    });
    const unsubStatus = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SOLIDARITAS_STATUS), (docSnap) => {
      if (docSnap.exists()) setStatus(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SOLIDARITAS_SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().data || { monthlyAmount: 50000 };
        setSettings(data);
        setTempMonthlyAmount(data.monthlyAmount);
      }
    });
    return () => { unsubResidents(); unsubLogs(); unsubStatus(); unsubSettings(); };
  }, []);

  const formatDateDDMMYYYY = (dateStr: string) => {
    if (!dateStr) return '';
    const cleanDate = dateStr.split('T')[0];
    const [year, month, day] = cleanDate.split('-');
    return `${day}-${month}-${year}`;
  };

  const monthsInYear = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(`${selectedYear}-${String(i + 1).padStart(2, '0')}`);
    }
    return months;
  }, [selectedYear]);

  const advancedAnalytics = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonthIdx = now.getMonth();
    
    // Monthly Trend Data
    const monthlyTrendData = monthsInYear.map(m => {
      let total = 0;
      logs.forEach(log => {
        if (log && log.periods && log.periods.includes(m)) {
          total += (log.amountPerMonth || settings.monthlyAmount);
        }
      });
      return {
        name: new Date(m).toLocaleDateString('id-ID', { month: 'short' }),
        fullDate: m,
        total
      };
    });

    // Participation Pie Chart
    const currentPeriod = `${curYear}-${String(curMonthIdx + 1).padStart(2, '0')}`;
    let lunasCount = 0;
    let nunggakCount = 0;
    
    residents.forEach(res => {
      const s = status.find(st => st.residentId === res.id);
      if (s?.paidMonths?.includes(currentPeriod)) lunasCount++;
      else nunggakCount++;
    });

    const participationData = [
      { name: 'Lunas (Bulan Ini)', value: lunasCount, color: '#10b981' },
      { name: 'Menunggak', value: nunggakCount, color: '#f43f5e' }
    ];

    // Yearly Comparison
    const yearList = [curYear - 1, curYear];
    const yearlyComparison = yearList.map(y => {
      let total = 0;
      logs.forEach(log => {
        if (log && log.periods) {
          log.periods.forEach(p => {
            if (p.startsWith(String(y))) total += (log.amountPerMonth || settings.monthlyAmount);
          });
        }
      });
      return { year: String(y), total };
    });

    // Top Disciplined Residents
    const topContributors = residents.map(res => {
      const s = status.find(st => st.residentId === res.id);
      return { ...res, count: s?.paidMonths?.length || 0 };
    }).sort((a, b) => b.count - a.count).slice(0, 5);

    const totalCollected = logs.reduce((acc, l) => acc + (l.totalPaid || 0), 0);
    const yearCollected = monthlyTrendData.reduce((acc, d) => acc + d.total, 0);
    const avgMonthly = yearCollected / (curYear === selectedYear ? (curMonthIdx + 1) : 12);
    const complianceRate = (lunasCount / (residents.length || 1)) * 100;

    return {
      monthlyTrendData,
      participationData,
      yearlyComparison,
      topContributors,
      stats: {
        totalCollected,
        yearCollected,
        avgMonthly,
        complianceRate,
        targetYearly: residents.length * settings.monthlyAmount * 12
      }
    };
  }, [logs, residents, status, settings.monthlyAmount, monthsInYear, selectedYear]);

  const handleSavePayment = async () => {
    if (role !== 'ADMIN' || !showPaymentModal || selectedMonths.length === 0) return;
    setIsProcessing(true);
    
    const newLog: SolidaritasLog = {
      id: `SOL-TX-${Date.now()}`,
      residentId: showPaymentModal.id,
      residentName: showPaymentModal.name,
      collectorName: appSettings.treasurerName || 'Bendahara RT',
      amountPerMonth: settings.monthlyAmount,
      periods: selectedMonths,
      totalPaid: selectedMonths.length * settings.monthlyAmount,
      timestamp: new Date(paymentDate).toISOString() 
    };

    const currentStatus = status.find(s => s.residentId === showPaymentModal.id) || { residentId: showPaymentModal.id, paidMonths: [] };
    const updatedPaidMonths = Array.from(new Set([...(currentStatus.paidMonths || []), ...selectedMonths]));
    const updatedStatusList = status.some(s => s.residentId === showPaymentModal.id) 
      ? status.map(s => s.residentId === showPaymentModal.id ? { ...s, paidMonths: updatedPaidMonths } : s)
      : [...status, { residentId: showPaymentModal.id, paidMonths: updatedPaidMonths }];

    const updatedLogs = [newLog, ...(logs || [])];
    await storage.set(STORAGE_KEYS.SOLIDARITAS_LOGS, updatedLogs);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_STATUS, updatedStatusList);
    
    setIsProcessing(false);
    setShowPaymentModal(null);
    setSelectedMonths([]);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    showToast(`Berhasil mencatat iuran ${showPaymentModal.name}.`);
  };

  const handleDeleteLog = async (logId: string) => {
    if (role !== 'ADMIN') return;
    const logToDelete = logs.find(l => l && l.id === logId);
    if (!logToDelete) return;
    if (!window.confirm(`Hapus riwayat iuran ${logToDelete.residentName}?`)) return;

    setIsProcessing(true);
    const updatedLogs = logs.filter(l => l && l.id !== logId);
    const updatedStatus = status.map(s => {
      if (s.residentId === logToDelete.residentId) {
        return { ...s, paidMonths: (s.paidMonths || []).filter(p => !(logToDelete.periods || []).includes(p)) };
      }
      return s;
    });

    await storage.set(STORAGE_KEYS.SOLIDARITAS_LOGS, updatedLogs);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_STATUS, updatedStatus);
    setIsProcessing(false);
    showToast("Riwayat dihapus.");
  };

  const handleClearAllHistory = async () => {
    if (role !== 'ADMIN') return;
    if (!window.confirm("Hapus SELURUH riwayat iuran?")) return;
    setIsProcessing(true);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_LOGS, []);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_STATUS, status.map(s => ({ ...s, paidMonths: [] })));
    setIsProcessing(false);
    showToast("Riwayat dibersihkan.");
  };

  const handleAddResident = async () => {
    if (!newName || !newHouse) return;
    const newRes: SolidaritasResident = { id: `SR-${Date.now()}`, name: newName, houseNumber: newHouse };
    const updated = [...residents, newRes];
    await storage.set(STORAGE_KEYS.SOLIDARITAS_RESIDENTS, updated);
    setNewName(''); setNewHouse('');
    showToast("Warga ditambahkan.");
  };

  const handleDeleteResident = async (id: string) => {
    if (!window.confirm("Hapus warga dari daftar?")) return;
    const updated = residents.filter(r => r.id !== id);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_RESIDENTS, updated);
    showToast("Warga dihapus.");
  };

  const handleSaveNominalSettings = async () => {
    setIsProcessing(true);
    const updated = { monthlyAmount: tempMonthlyAmount };
    if (await storage.set(STORAGE_KEYS.SOLIDARITAS_SETTINGS, updated)) {
      setSettings(updated);
      showToast("Nominal diperbarui.");
    }
    setIsProcessing(false);
  };

  const isMonthPaid = (residentId: string, period: string) => {
    const s = status.find(st => st.residentId === residentId);
    return s?.paidMonths?.includes(period);
  };

  const deficiencyList = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return residents.map(res => {
      const s = status.find(st => st.residentId === res.id);
      const paidMonths = s?.paidMonths || [];
      let unpaidCount = 0;
      if (selectedYear <= currentYear) {
        const targetMonthsLimit = selectedYear < currentYear ? 11 : currentMonth;
        for (let i = 0; i <= targetMonthsLimit; i++) {
          const period = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
          if (!paidMonths.includes(period)) unpaidCount++;
        }
      }
      return { ...res, unpaidCount, debt: unpaidCount * settings.monthlyAmount };
    }).filter(item => item.unpaidCount > 0).sort((a, b) => b.debt - a.debt);
  }, [residents, status, selectedYear, settings.monthlyAmount]);

  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      if (!l) return false;
      const search = historySearch.toLowerCase();
      return l.residentName.toLowerCase().includes(search) || l.id.toLowerCase().includes(search);
    });
  }, [logs, historySearch]);

  const reportLogs = useMemo(() => {
    return logs.filter(l => {
      if (!l || !l.timestamp) return false;
      const logDate = l.timestamp.split('T')[0];
      return logDate >= startDate && logDate <= endDate;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [logs, startDate, endDate]);

  const reportTotal = useMemo(() => reportLogs.reduce((acc, curr) => acc + (curr.totalPaid || 0), 0), [reportLogs]);

  const availableTabs = role === 'ADMIN' ? ['Monitoring', 'Analisa', 'Riwayat', 'Admin'] : ['Monitoring', 'Analisa', 'Riwayat'];

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      {/* --- TEMPLATE CETAK LAPORAN (Hidden in UI) --- */}
      <div className="hidden print:block font-serif text-slate-900 p-4">
        <div className="text-center border-b-4 border-double border-slate-900 pb-6 mb-8">
           <h1 className="text-2xl font-black uppercase tracking-tight">LAPORAN PENERIMAAN IURAN SOLIDARITAS</h1>
           <h2 className="text-lg font-bold uppercase">{appSettings.rtRw || 'RT 05'} - {appSettings.location || 'Kediri'}</h2>
           <div className="mt-4 flex justify-between items-end">
              <div className="text-left text-xs font-bold space-y-1">
                 <p>Periode Laporan : <span className="font-black">{formatDateDDMMYYYY(startDate)} s/d {formatDateDDMMYYYY(endDate)}</span></p>
                 <p>Kategori Kas : <span className="font-black uppercase">Kas Solidaritas & Sosial</span></p>
              </div>
              <p className="text-[10px] italic">Waktu Cetak: {new Date().toLocaleString('id-ID')}</p>
           </div>
        </div>

        <table className="w-full border-collapse border-2 border-slate-900 text-sm">
           <thead>
              <tr className="bg-slate-100">
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-center w-12">No</th>
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-center w-32">Tgl Bayar</th>
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-left">Nama Warga</th>
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-center w-24">Unit</th>
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-center w-32">Periode</th>
                 <th className="border-2 border-slate-900 px-4 py-3 font-black uppercase text-right w-40">Nominal</th>
              </tr>
           </thead>
           <tbody>
              {reportLogs.length === 0 ? (
                <tr><td colSpan={6} className="border-2 border-slate-900 px-4 py-10 text-center italic opacity-50">Tidak ada data transaksi pada periode ini</td></tr>
              ) : (
                reportLogs.map((log, idx) => (
                  <tr key={log.id}>
                     <td className="border-2 border-slate-900 px-4 py-2 text-center font-bold">{idx + 1}</td>
                     <td className="border-2 border-slate-900 px-4 py-2 text-center font-bold">{formatDateDDMMYYYY(log.timestamp)}</td>
                     <td className="border-2 border-slate-900 px-4 py-2 font-black uppercase">{log.residentName}</td>
                     <td className="border-2 border-slate-900 px-4 py-2 text-center font-bold">
                        {residents.find(r => r.id === log.residentId)?.houseNumber || '-'}
                     </td>
                     <td className="border-2 border-slate-900 px-4 py-2 text-center font-bold">{log.periods.length} Bln</td>
                     <td className="border-2 border-slate-900 px-4 py-2 text-right font-black">Rp {(log.totalPaid || 0).toLocaleString()}</td>
                  </tr>
                ))
              )}
              <tr className="bg-slate-100 font-black">
                 <td colSpan={5} className="border-2 border-slate-900 px-4 py-4 text-right uppercase">Total Akumulasi Terkumpul</td>
                 <td className="border-2 border-slate-900 px-4 py-4 text-right text-lg">Rp {reportTotal.toLocaleString()}</td>
              </tr>
           </tbody>
        </table>

        <div className="grid grid-cols-2 gap-20 mt-20 px-10">
           <div className="text-center space-y-24">
              <p className="text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Bendahara {appSettings.rtRw || 'RT'}</p>
              <p className="text-xs font-bold uppercase">( {appSettings.treasurerName || '________________'} )</p>
           </div>
           <div className="text-center space-y-24">
              <p className="text-xs font-black uppercase tracking-widest underline decoration-2 underline-offset-4">Ketua {appSettings.rtRw || 'RT'}</p>
              <p className="text-xs font-bold uppercase">( {appSettings.chairmanName || '________________'} )</p>
           </div>
        </div>
        <p className="text-[10px] text-center mt-20 italic opacity-40">Dokumen ini sah secara digital melalui Sistem SiRT Digital Pro.</p>
      </div>

      {/* HEADER (No Print) */}
      <div className="bg-rose-600 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md border border-white/20">
                      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                   </div>
                   <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Solidaritas</h2>
                </div>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Iuran Keamanan & Sosial Lingkungan</p>
             </div>
             <button onClick={() => window.print()} className="bg-white/20 p-4 rounded-2xl shadow-inner border border-white/20 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          </div>
          
          <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {availableTabs.map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[85px] py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-rose-600 shadow-xl' : 'text-white/40'}`}>{t}</button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'Monitoring' && (
        <div className="space-y-10 animate-page-enter no-print">
          <div className="bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm space-y-6">
             <div className="flex justify-between items-center px-2">
                <div>
                   <h3 className="text-sm font-black text-rose-600 uppercase tracking-widest">Kekurangan Iuran</h3>
                   <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Daftar warga belum lunas (s/d {new Date().toLocaleDateString('id-ID', { month: 'long' })})</p>
                </div>
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 font-black">!</div>
             </div>

             <div className="space-y-3 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                {deficiencyList.length === 0 ? (
                  <div className="py-10 text-center text-emerald-500 font-black uppercase text-[10px] tracking-widest">Luar Biasa! Semua Warga Lunas</div>
                ) : (
                  deficiencyList.map(item => (
                    <div key={item.id} className="bg-rose-50/50 p-5 rounded-[32px] border border-rose-100/50 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[10px] text-rose-400 shadow-sm">{item.houseNumber}</div>
                          <div>
                             <p className="text-xs font-black text-slate-700 uppercase">{item.name}</p>
                             <p className="text-[9px] font-bold text-rose-400 uppercase">{item.unpaidCount} Bulan Belum Bayar</p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-sm font-black text-rose-600">Rp {item.debt.toLocaleString()}</p>
                          {role === 'ADMIN' && <button onClick={() => setShowPaymentModal(item)} className="text-[8px] font-black text-blue-500 uppercase hover:underline">Bayar</button>}
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Matriks Pembayaran {selectedYear}</h3>
              <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none">
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 gap-4 overflow-x-auto no-scrollbar pb-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-4 py-4 whitespace-nowrap sticky left-0 bg-slate-50">Warga</th>
                    {monthsInYear.map(m => (<th key={m} className="px-2 py-4 text-center">{new Date(m).toLocaleDateString('id-ID', { month: 'short' })}</th>))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {residents.map(res => (
                    <tr key={res.id} onClick={() => role === 'ADMIN' && setShowPaymentModal(res)} className="group cursor-pointer hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 transition-colors">
                        <p className="text-xs font-black text-slate-800 uppercase">{res.name}</p>
                        <p className="text-[9px] text-slate-400 font-bold">No. {res.houseNumber}</p>
                      </td>
                      {monthsInYear.map(m => {
                        const paid = isMonthPaid(res.id, m);
                        return (
                          <td key={m} className="px-1 py-4 text-center">
                            <div className={`w-6 h-6 rounded-lg mx-auto flex items-center justify-center transition-all ${paid ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-100 text-slate-200 group-hover:bg-slate-200'}`}>
                              {paid && <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Analisa' && (
        <div className="space-y-8 animate-page-enter no-print">
          {/* STATS OVERVIEW */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             <div className="bg-slate-950 p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden">
                <p className="text-[9px] font-black uppercase text-rose-400 tracking-widest mb-2">Total Kas (Overall)</p>
                <h4 className="text-2xl font-black tracking-tight">Rp {advancedAnalytics.stats.totalCollected.toLocaleString()}</h4>
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
             </div>
             <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Kas Tahun Ini</p>
                <h4 className="text-2xl font-black text-slate-800 tracking-tight">Rp {advancedAnalytics.stats.yearCollected.toLocaleString()}</h4>
             </div>
             <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Rata-rata / Bulan</p>
                <h4 className="text-2xl font-black text-indigo-600 tracking-tight">Rp {Math.round(advancedAnalytics.stats.avgMonthly).toLocaleString()}</h4>
             </div>
             <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Tingkat Kepatuhan</p>
                <div className="flex items-center gap-3">
                   <h4 className="text-2xl font-black text-emerald-600">{advancedAnalytics.stats.complianceRate.toFixed(1)}%</h4>
                   <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div style={{ width: `${advancedAnalytics.stats.complianceRate}%` }} className="h-full bg-emerald-500 rounded-full"></div>
                   </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
             {/* TREN PENDAPATAN (AREA CHART) */}
             <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Grafik Tren Iuran ({selectedYear})</h3>
                   <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded-full"></div><span className="text-[10px] font-bold text-slate-400 uppercase">Kas Masuk</span></div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={advancedAnalytics.monthlyTrendData}>
                      <defs>
                        <linearGradient id="colorSol" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="total" stroke="#f43f5e" strokeWidth={5} fillOpacity={1} fill="url(#colorSol)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* RASIO PARTISIPASI (PIE CHART) */}
             <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center px-2">Status Kepatuhan</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={advancedAnalytics.participationData} 
                        cx="50%" cy="50%" innerRadius={60} outerRadius={85} 
                        paddingAngle={8} dataKey="value" stroke="none"
                      >
                        {advancedAnalytics.participationData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3">
                   {advancedAnalytics.participationData.map(p => (
                     <div key={p.name} className="flex justify-between items-center p-3 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2">
                           <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }}></div>
                           <span className="text-[10px] font-black uppercase text-slate-500">{p.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-800">{p.value} KK</span>
                     </div>
                   ))}
                </div>
             </div>

             {/* TOP DISCIPLINED RESIDENTS */}
             <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Warga Paling Disiplin</h3>
                <div className="space-y-4">
                   {advancedAnalytics.topContributors.map((res, idx) => (
                     <div key={res.id} className="flex items-center gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100">
                        <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-black text-xs shadow-md">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                           <p className="text-xs font-black text-slate-800 uppercase truncate">{res.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total {res.count} Bulan Terbayar</p>
                        </div>
                        <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center">
                           <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             {/* PERBANDINGAN TAHUNAN (BAR CHART) */}
             <div className="lg:col-span-2 bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
                <div className="flex justify-between items-center">
                   <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2">Pertumbuhan Kas Antar Tahun</h3>
                </div>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={advancedAnalytics.yearlyComparison}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 900, fill: '#1e293b'}} />
                      <YAxis hide />
                      <Tooltip cursor={{fill: '#f8fafc'}} />
                      <Bar dataKey="total" radius={[15, 15, 0, 0]}>
                        {advancedAnalytics.yearlyComparison.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index === (advancedAnalytics.yearlyComparison.length - 1) ? '#f43f5e' : '#cbd5e1'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-rose-50 p-6 rounded-[32px] border border-rose-100 text-center">
                   <p className="text-[11px] text-rose-800 font-bold italic">
                     "Target Kas Tahunan: Rp {advancedAnalytics.stats.targetYearly.toLocaleString()}. Saat ini tercapai {(advancedAnalytics.stats.yearCollected / (advancedAnalytics.stats.targetYearly || 1) * 100).toFixed(1)}%"
                   </p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'Riwayat' && (
        <div className="space-y-6 animate-page-enter no-print">
          {/* Custom Date Report Panel */}
          <div className="bg-slate-900 p-8 rounded-[44px] border border-white/5 shadow-2xl space-y-6">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth={2.5} /></svg>
                </div>
                <div>
                   <h3 className="text-sm font-black text-white uppercase tracking-widest">Generator Laporan Custom</h3>
                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Cetak Mutasi Berdasarkan Rentang Tanggal</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">Dari Tanggal</label>
                   <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={e => setStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest ml-2">Sampai Tanggal</label>
                   <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
             </div>

             <div className="flex items-center justify-between bg-white/5 p-4 rounded-3xl border border-white/5">
                <div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Akumulasi Kas Terpilih</p>
                   <p className="text-xl font-black text-indigo-400">Rp {reportTotal.toLocaleString()}</p>
                </div>
                <button onClick={() => window.print()} className="bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Cetak Laporan</button>
             </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
               <input type="text" className="w-full bg-white border border-slate-100 rounded-3xl px-12 py-5 text-xs font-bold outline-none shadow-sm" placeholder="Cari Nama Warga..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
               <svg className="w-5 h-5 absolute left-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
            </div>
            {role === 'ADMIN' && logs.length > 0 && (
              <button onClick={handleClearAllHistory} className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-rose-100 whitespace-nowrap active:scale-95 transition-all">Hapus Semua</button>
            )}
          </div>

          <div className="space-y-4">
             {filteredLogs.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-[44px] border border-dashed border-slate-200"><p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Tidak ada riwayat ditemukan</p></div>
             ) : (
               filteredLogs.map(log => (
                 <div key={log.id} className="bg-white p-7 rounded-[40px] border border-slate-50 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner group-hover:rotate-6 transition-transform">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                       </div>
                       <div>
                          <div className="flex items-center gap-2">
                             <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5} /></svg>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tgl Bayar: {formatDateDDMMYYYY(log.timestamp)}</p>
                          </div>
                          <h4 className="text-base font-black text-slate-800 uppercase mt-1">{log.residentName}</h4>
                          <p className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Pelunasan {log.periods.length} Periode</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-800">Rp {(log.totalPaid ?? 0).toLocaleString()}</p>
                       {role === 'ADMIN' && <button onClick={() => handleDeleteLog(log.id)} disabled={isProcessing} className="text-[8px] font-black text-rose-400 uppercase hover:underline p-2">{isProcessing ? '...' : 'Hapus'}</button>}
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {activeTab === 'Admin' && role === 'ADMIN' && (
        <div className="space-y-6 animate-page-enter no-print">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Konfigurasi Solidaritas</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Iuran Bulanan</label>
                   <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner focus:ring-2 focus:ring-rose-500" value={tempMonthlyAmount} onChange={e => setTempMonthlyAmount(Number(e.target.value))} />
                </div>
                <button onClick={handleSaveNominalSettings} disabled={isProcessing || tempMonthlyAmount === settings.monthlyAmount} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30">Simpan Perubahan Nominal</button>
             </div>
          </div>

          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Registrasi Warga Solidaritas</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Nama Warga" className="bg-slate-50 rounded-2xl px-6 py-4 outline-none text-xs font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
                <input type="text" placeholder="No. Rumah" className="bg-slate-50 rounded-2xl px-6 py-4 outline-none text-xs font-bold" value={newHouse} onChange={e => setNewHouse(e.target.value)} />
             </div>
             <button onClick={handleAddResident} className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all">Tambah ke Daftar</button>
             <div className="space-y-3 pt-6">
                {(residents || []).map(res => (
                   <div key={res.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                      <p className="text-xs font-black text-slate-700 uppercase">{res.name} ({res.houseNumber})</p>
                      <button onClick={() => handleDeleteResident(res.id)} className="text-rose-600 text-[10px] font-black uppercase hover:underline">Hapus</button>
                   </div>
                ))}
             </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[56px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="bg-rose-600 p-8 text-white space-y-1">
                 <h3 className="text-2xl font-black uppercase tracking-tight leading-none">Pembayaran Solidaritas</h3>
                 <p className="text-[10px] opacity-70 font-bold uppercase tracking-widest">{showPaymentModal.name} ({showPaymentModal.houseNumber})</p>
              </div>
              <div className="p-10 space-y-8 overflow-y-auto max-h-[70vh] no-scrollbar">
                 <div className="space-y-4">
                    <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Tanggal Pembayaran Aktual</label>
                       <input 
                        type="date" 
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-rose-500" 
                        value={paymentDate} 
                        onChange={e => setPaymentDate(e.target.value)} 
                       />
                    </div>

                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bulan Pembayaran ({selectedYear})</p>
                    <div className="grid grid-cols-4 gap-2">
                       {monthsInYear.map(m => {
                          const isPaid = isMonthPaid(showPaymentModal.id, m);
                          const isSelected = selectedMonths.includes(m);
                          return (
                             <button key={m} disabled={isPaid} onClick={() => setSelectedMonths(prev => isSelected ? prev.filter(x => x !== m) : [...prev, m])} className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${isPaid ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}>
                                {new Date(m).toLocaleDateString('id-ID', { month: 'short' })}
                             </button>
                          );
                       })}
                    </div>
                 </div>
                 <div className="bg-slate-900 p-7 rounded-[36px] text-center space-y-1">
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Total Bayar ({selectedMonths.length} Bulan)</p>
                    <p className="text-3xl font-black text-white tracking-tighter">Rp {(selectedMonths.length * settings.monthlyAmount).toLocaleString()}</p>
                 </div>
                 <div className="flex gap-3">
                    <button onClick={() => { setShowPaymentModal(null); setSelectedMonths([]); }} className="flex-1 py-4 font-black text-[10px] uppercase text-slate-400">Batal</button>
                    <button onClick={handleSavePayment} disabled={isProcessing || selectedMonths.length === 0} className="flex-2 bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all">Bayar Sekarang</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SolidaritasPage;
