
import React, { useState, useEffect, useMemo } from 'react';
import { 
  SolidaritasResident, SolidaritasLog, SolidaritasStatus, UserRole, AppSettings 
} from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, Legend
} from 'recharts';

interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'info' | 'error';
}

const SolidaritasPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [residents, setResidents] = useState<SolidaritasResident[]>(() => 
    storage.get(STORAGE_KEYS.SOLIDARITAS_RESIDENTS, [])
  );
  
  const [logs, setLogs] = useState<SolidaritasLog[]>(() => 
    storage.get(STORAGE_KEYS.SOLIDARITAS_LOGS, [])
  );

  const [status, setStatus] = useState<SolidaritasStatus[]>(() => 
    storage.get(STORAGE_KEYS.SOLIDARITAS_STATUS, [])
  );

  const [settings, setSettings] = useState<{ monthlyAmount: number }>(() => 
    storage.get(STORAGE_KEYS.SOLIDARITAS_SETTINGS, { monthlyAmount: 50000 })
  );

  const [tempMonthlyAmount, setTempMonthlyAmount] = useState<number>(settings.monthlyAmount);

  const [appSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri',
    treasurerName: 'Bendahara RT'
  }));

  const [activeTab, setActiveTab] = useState<'Monitoring' | 'Analisa' | 'Riwayat' | 'Admin'>('Monitoring');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showPaymentModal, setShowPaymentModal] = useState<SolidaritasResident | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [historySearch, setHistorySearch] = useState('');
  
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
      timestamp: new Date().toISOString()
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
    showToast(`Berhasil! Pembayaran ${selectedMonths.length} bulan untuk ${showPaymentModal.name} telah dicatat.`);
  };

  const handleDeleteLog = async (logId: string) => {
    if (role !== 'ADMIN') return;
    
    const logToDelete = logs.find(l => l && l.id === logId);
    if (!logToDelete) return;

    if (!window.confirm(`Hapus riwayat iuran ${logToDelete.residentName}? Status lunas warga akan ditarik kembali.`)) return;

    setIsProcessing(true);
    const updatedLogs = logs.filter(l => l && l.id !== logId);
    
    const updatedStatus = status.map(s => {
      if (s.residentId === logToDelete.residentId) {
        return {
          ...s,
          paidMonths: (s.paidMonths || []).filter(p => !(logToDelete.periods || []).includes(p))
        };
      }
      return s;
    });

    const savedLogs = await storage.set(STORAGE_KEYS.SOLIDARITAS_LOGS, updatedLogs);
    const savedStatus = await storage.set(STORAGE_KEYS.SOLIDARITAS_STATUS, updatedStatus);
    
    if (savedLogs && savedStatus) {
      showToast("Riwayat iuran telah berhasil dihapus dari Cloud.");
    }
    setIsProcessing(false);
  };

  const handleClearAllHistory = async () => {
    if (role !== 'ADMIN') return;
    if (!window.confirm("PERINGATAN: Anda akan menghapus SELURUH riwayat iuran solidaritas. Tindakan ini tidak dapat dibatalkan. Lanjutkan?")) return;
    
    setIsProcessing(true);
    const emptyLogs: SolidaritasLog[] = [];
    const resetStatus = status.map(s => ({ ...s, paidMonths: [] }));
    
    await storage.set(STORAGE_KEYS.SOLIDARITAS_LOGS, emptyLogs);
    await storage.set(STORAGE_KEYS.SOLIDARITAS_STATUS, resetStatus);
    
    setIsProcessing(false);
    showToast("Seluruh riwayat iuran telah dibersihkan.");
  };

  const isMonthPaid = (residentId: string, period: string) => {
    const s = status.find(st => st.residentId === residentId);
    return s?.paidMonths?.includes(period);
  };

  const monthsInYear = useMemo(() => {
    const months = [];
    for (let i = 0; i < 12; i++) {
      months.push(`${selectedYear}-${String(i + 1).padStart(2, '0')}`);
    }
    return months;
  }, [selectedYear]);

  const chartData = useMemo(() => {
    const monthlyTotal: Record<string, number> = {};
    (logs || []).forEach(log => {
      if (log && log.periods && Array.isArray(log.periods)) {
        log.periods.forEach(p => {
          if (p && p.startsWith(String(selectedYear))) {
            monthlyTotal[p] = (monthlyTotal[p] || 0) + (log.amountPerMonth || 0);
          }
        });
      }
    });
    return monthsInYear.map(m => ({
      name: new Date(m).toLocaleDateString('id-ID', { month: 'short' }),
      total: monthlyTotal[m] || 0
    }));
  }, [logs, monthsInYear, selectedYear]);

  const totalRevenue = useMemo(() => {
    return (logs || []).reduce((acc, log) => acc + ((log && log.totalPaid) || 0), 0);
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return (logs || []).filter(l => {
      if (!l) return false;
      const search = (historySearch || '').toLowerCase();
      const residentName = (l.residentName || '').toLowerCase();
      const logId = String(l.id || '').toLowerCase();
      return residentName.includes(search) || logId.includes(search);
    });
  }, [logs, historySearch]);

  const handleAddResident = async () => {
    if (!newName || !newHouse) return;
    const newRes: SolidaritasResident = {
      id: `SR-${Date.now()}`,
      name: newName,
      houseNumber: newHouse
    };
    const updated = [...residents, newRes];
    await storage.set(STORAGE_KEYS.SOLIDARITAS_RESIDENTS, updated);
    setResidents(updated);
    setNewName('');
    setNewHouse('');
    showToast("Warga solidaritas berhasil ditambahkan.");
  };

  const handleDeleteResident = async (id: string) => {
    if (!window.confirm("Hapus warga dari daftar solidaritas? Data permanen akan hilang dari Cloud.")) return;
    const updated = residents.filter(r => r.id !== id);
    const saved = await storage.set(STORAGE_KEYS.SOLIDARITAS_RESIDENTS, updated);
    if (saved) {
      setResidents(updated);
      showToast("Data warga telah dihapus.");
    }
  };

  const handleSaveNominalSettings = async () => {
    setIsProcessing(true);
    const updated = { monthlyAmount: tempMonthlyAmount };
    const saved = await storage.set(STORAGE_KEYS.SOLIDARITAS_SETTINGS, updated);
    if (saved) {
      setSettings(updated);
      showToast("Nominal iuran bulanan berhasil diperbarui.");
    }
    setIsProcessing(false);
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
          if (!paidMonths.includes(period)) {
            unpaidCount++;
          }
        }
      }

      return {
        ...res,
        unpaidCount,
        debt: unpaidCount * settings.monthlyAmount
      };
    }).filter(item => item.unpaidCount > 0)
    .sort((a, b) => b.debt - a.debt);
  }, [residents, status, selectedYear, settings.monthlyAmount]);

  const handlePrint = () => { window.print(); };

  const availableTabs = role === 'ADMIN' ? ['Monitoring', 'Analisa', 'Riwayat', 'Admin'] : ['Monitoring', 'Analisa', 'Riwayat'];

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[1000] w-[90%] max-w-sm animate-page-enter no-print">
           <div className={`p-5 rounded-[28px] shadow-2xl backdrop-blur-xl flex items-center gap-4 border-2 ${
             toast.type === 'success' ? 'bg-emerald-600/90 border-emerald-400/30 text-white' : 'bg-slate-900/90 border-white/10 text-white'
           }`}>
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-xs font-black uppercase tracking-tight leading-tight">{toast.message}</p>
           </div>
        </div>
      )}

      <div className="bg-rose-600 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
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
             <button onClick={handlePrint} className="bg-white/20 p-4 rounded-2xl shadow-inner border border-white/20 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
          </div>
          
          <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {availableTabs.map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[85px] py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-rose-600 shadow-xl' : 'text-white/40'}`}>{t}</button>
             ))}
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
      </div>

      {activeTab === 'Monitoring' && (
        <div className="space-y-10 animate-page-enter">
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
                          <button onClick={() => role === 'ADMIN' && setShowPaymentModal(item)} className="text-[8px] font-black text-blue-500 uppercase hover:underline">Bayar</button>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[48px] shadow-sm space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-2">Matriks Pembayaran {selectedYear}</h3>
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-[10px] font-black uppercase outline-none"
              >
                {[2023, 2024, 2025].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-4 overflow-x-auto no-scrollbar pb-4">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-[8px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="px-4 py-4 whitespace-nowrap sticky left-0 bg-slate-50">Warga</th>
                    {monthsInYear.map(m => (
                      <th key={m} className="px-2 py-4 text-center">{new Date(m).toLocaleDateString('id-ID', { month: 'short' })}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {(residents || []).map(res => (
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
        <div className="space-y-6 animate-page-enter">
          <div className="bg-slate-950 p-10 rounded-[48px] text-white space-y-2 relative overflow-hidden border border-white/10">
             <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-400">Akumulasi Kas Solidaritas</p>
                <h1 className="text-5xl font-black tracking-tighter mt-2">Rp {(totalRevenue ?? 0).toLocaleString()}</h1>
                <div className="pt-6 grid grid-cols-2 gap-10">
                   <div>
                      <p className="text-[8px] font-black uppercase text-slate-500">Target Tahunan</p>
                      <p className="text-xl font-black">Rp {(residents.length * settings.monthlyAmount * 12).toLocaleString()}</p>
                   </div>
                   <div>
                      <p className="text-[8px] font-black uppercase text-slate-500">Pencapaian</p>
                      <p className="text-xl font-black">{(totalRevenue / (residents.length * settings.monthlyAmount * 12 || 1) * 100).toFixed(1)}%</p>
                   </div>
                </div>
             </div>
             <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl"></div>
          </div>

          <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-6">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Trend Solidaritas ({selectedYear})</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                  <Bar dataKey="total" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Riwayat' && (
        <div className="space-y-4 animate-page-enter">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 relative">
               <input type="text" className="w-full bg-white border border-slate-100 rounded-3xl px-12 py-5 text-xs font-bold outline-none shadow-sm" placeholder="Cari Nama Warga..." value={historySearch} onChange={e => setHistorySearch(e.target.value)} />
               <svg className="w-5 h-5 absolute left-5 top-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
            </div>
            {role === 'ADMIN' && logs.length > 0 && (
              <button 
                onClick={handleClearAllHistory}
                className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest border border-rose-100 whitespace-nowrap active:scale-95 transition-all"
              >
                Hapus Semua
              </button>
            )}
          </div>

          <div className="space-y-4">
             {filteredLogs.length === 0 ? (
               <div className="py-24 text-center bg-white rounded-[44px] border border-dashed border-slate-200">
                  <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Tidak ada riwayat ditemukan</p>
               </div>
             ) : (
               filteredLogs.map(log => (
                 <div key={log.id} className="bg-white p-7 rounded-[40px] border border-slate-50 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 shadow-inner group-hover:rotate-6 transition-transform">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.timestamp).toLocaleDateString('id-ID', { dateStyle: 'medium' })}</p>
                          <h4 className="text-base font-black text-slate-800 uppercase mt-0.5">{log.residentName}</h4>
                          <p className="text-[9px] font-bold text-rose-600 uppercase tracking-tighter">Pelunasan {log.periods.length} Periode</p>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-800">Rp {(log.totalPaid ?? 0).toLocaleString()}</p>
                       {role === 'ADMIN' && (
                         <button 
                           onClick={() => handleDeleteLog(log.id)} 
                           disabled={isProcessing}
                           className="text-[8px] font-black text-rose-400 uppercase hover:underline p-2"
                         >
                           {isProcessing ? '...' : 'Hapus'}
                         </button>
                       )}
                    </div>
                 </div>
               ))
             )}
          </div>
        </div>
      )}

      {activeTab === 'Admin' && role === 'ADMIN' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
             <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest px-2">Konfigurasi Solidaritas</h3>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Iuran Bulanan</label>
                   <input 
                     type="number" 
                     className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner focus:ring-2 focus:ring-rose-500" 
                     value={tempMonthlyAmount} 
                     onChange={e => setTempMonthlyAmount(Number(e.target.value))} 
                   />
                </div>
                <button 
                  onClick={handleSaveNominalSettings}
                  disabled={isProcessing || tempMonthlyAmount === settings.monthlyAmount}
                  className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                >
                  {isProcessing ? 'Menyimpan...' : 'Simpan Perubahan Nominal'}
                </button>
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
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Bulan Pembayaran ({selectedYear})</p>
                    <div className="grid grid-cols-4 gap-2">
                       {monthsInYear.map(m => {
                          const isPaid = isMonthPaid(showPaymentModal.id, m);
                          const isSelected = selectedMonths.includes(m);
                          return (
                             <button 
                                key={m}
                                disabled={isPaid}
                                onClick={() => setSelectedMonths(prev => isSelected ? prev.filter(x => x !== m) : [...prev, m])}
                                className={`py-3 rounded-xl text-[9px] font-black uppercase transition-all ${isPaid ? 'bg-emerald-500 text-white' : isSelected ? 'bg-rose-600 text-white shadow-lg' : 'bg-slate-50 text-slate-300'}`}
                             >
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
                    <button 
                      onClick={handleSavePayment} 
                      disabled={isProcessing || selectedMonths.length === 0} 
                      className="flex-2 bg-rose-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl disabled:opacity-30 active:scale-95 transition-all"
                    >
                      {isProcessing ? 'Menyimpan...' : 'Bayar Sekarang'}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SolidaritasPage;
