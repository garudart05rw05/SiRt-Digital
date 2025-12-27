
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { YouthMember, YouthArisanLog, YouthFinanceTx, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, BarChart, Bar, Legend
} from 'recharts';

interface YouthFundPageProps {
  role: UserRole;
}

const YouthFundPage: React.FC<YouthFundPageProps> = ({ role }) => {
  const [members, setMembers] = useState<YouthMember[]>([]);
  const [arisanLogs, setArisanLogs] = useState<YouthArisanLog[]>([]);
  const [financeLogs, setFinanceLogs] = useState<YouthFinanceTx[]>([]);
  const [settings, setSettings] = useState({ arisanNominal: 10000, kasNominal: 5000 });
  const [appSettings, setAppSettings] = useState<AppSettings>({});
  
  const [activeTab, setActiveTab] = useState<'Monitoring' | 'Individu' | 'Kas Umum' | 'Analisa' | 'Undian' | 'Admin'>('Monitoring');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [indivCalendarMonth, setIndivCalendarMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isProcessing, setIsProcessing] = useState(false);
  const [showKasForm, setShowKasForm] = useState(false);
  const [viewEvidence, setViewEvidence] = useState<string | null>(null);
  const [winnerName, setWinnerName] = useState<string | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showPayoutConfirm, setShowPayoutConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [kasForm, setKasForm] = useState<Partial<YouthFinanceTx>>({ 
    type: 'IN', 
    date: new Date().toISOString().split('T')[0], 
    amount: 0, 
    description: '',
    evidenceUrl: ''
  });
  const [newMember, setnewMember] = useState<Partial<YouthMember>>({ name: '', phone: '', address: '' });

  useEffect(() => {
    const unsubMembers = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_MEMBERS), (snap) => {
      if (snap.exists()) setMembers(snap.data().data || []);
    });
    const unsubArisan = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_ARISAN_LOGS), (snap) => {
      if (snap.exists()) setArisanLogs(snap.data().data || []);
    });
    const unsubFinance = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_FINANCE), (snap) => {
      if (snap.exists()) setFinanceLogs(snap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.YOUTH_SETTINGS), (snap) => {
      if (snap.exists()) {
        const data = snap.data().data;
        setSettings({
          arisanNominal: data?.arisanNominal ?? 10000,
          kasNominal: data?.kasNominal ?? 5000
        });
      }
    });
    const unsubApp = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (snap) => {
      if (snap.exists()) {
        setAppSettings(snap.data().data || {});
      }
    });
    return () => { unsubMembers(); unsubArisan(); unsubFinance(); unsubSettings(); unsubApp(); };
  }, []);

  const monthsLabels = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const romanMonths = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    return parts.length < 3 ? dateStr : `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const isPaid = (memberId: string, period: string) => {
    return arisanLogs.some(log => log.period === period && log.paidMemberIds.includes(memberId));
  };

  const iuranStats = useMemo(() => {
    let totalArisan = 0;
    let totalKasWajib = 0;
    arisanLogs.forEach(log => {
      const count = log.paidMemberIds?.length || 0;
      totalArisan += (count * settings.arisanNominal);
      totalKasWajib += (count * settings.kasNominal);
    });
    return { totalArisan, totalKasWajib, grandTotal: totalArisan + totalKasWajib };
  }, [arisanLogs, settings]);

  const manualStats = useMemo(() => {
    const tin = financeLogs.filter(f => f.type === 'IN').reduce((acc, f) => acc + (f.amount || 0), 0);
    const tout = financeLogs.filter(f => f.type === 'OUT').reduce((acc, f) => acc + (f.amount || 0), 0);
    const arisanPayouts = financeLogs
      .filter(f => f.type === 'OUT' && f.description.toLowerCase().includes('bayar arisan'))
      .reduce((acc, f) => acc + (f.amount || 0), 0);
    return { in: tin, out: tout, arisanPayouts };
  }, [financeLogs]);

  const arisanCurrentPool = iuranStats.totalArisan - manualStats.arisanPayouts;
  const operationalPool = iuranStats.totalKasWajib + manualStats.in - (manualStats.out - manualStats.arisanPayouts);
  const totalBalance = arisanCurrentPool + operationalPool;

  const youthAnalytics = useMemo(() => {
    const trendData = monthsLabels.map((name, idx) => {
      const period = `${selectedYear}-${String(idx + 1).padStart(2, '0')}`;
      const log = arisanLogs.find(l => l.period === period);
      const paidCount = log?.paidMemberIds.length || 0;
      const income = paidCount * (settings.arisanNominal + settings.kasNominal);
      const expense = financeLogs
        .filter(f => f.type === 'OUT' && f.date.startsWith(period))
        .reduce((a, b) => a + (b.amount || 0), 0);
      return { name, income, expense, paidCount };
    });

    const compositionData = [
      { name: 'Dana Arisan', value: Math.max(0, arisanCurrentPool), color: '#8b5cf6' },
      { name: 'Kas Operasional', value: Math.max(0, operationalPool), color: '#3b82f6' }
    ];

    return { trendData, compositionData };
  }, [arisanLogs, financeLogs, selectedYear, settings, arisanCurrentPool, operationalPool]);

  const handleTogglePayment = async (memberId: string, monthIdx: number) => {
    if (role !== 'ADMIN') return;
    const period = `${selectedYear}-${String(monthIdx + 1).padStart(2, '0')}`;
    const existingLog = arisanLogs.find(l => l.period === period);
    const totalPerPerson = settings.arisanNominal + settings.kasNominal;

    let updatedLogs: YouthArisanLog[];
    if (existingLog) {
      const isAlreadyPaid = existingLog.paidMemberIds.includes(memberId);
      const newPaidIds = isAlreadyPaid 
        ? existingLog.paidMemberIds.filter(id => id !== memberId)
        : [...existingLog.paidMemberIds, memberId];
      
      if (newPaidIds.length === 0) {
        updatedLogs = arisanLogs.filter(l => l.period !== period);
      } else {
        updatedLogs = arisanLogs.map(l => l.period === period ? { 
          ...l, 
          paidMemberIds: newPaidIds, 
          totalCollected: newPaidIds.length * totalPerPerson 
        } : l);
      }
    } else {
      const newLog: YouthArisanLog = {
        id: `ARL-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        period,
        amountPerPerson: totalPerPerson,
        paidMemberIds: [memberId],
        totalCollected: totalPerPerson
      };
      updatedLogs = [newLog, ...arisanLogs];
    }
    await storage.set(STORAGE_KEYS.YOUTH_ARISAN_LOGS, updatedLogs);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const optimized = await compressImage(reader.result as string, 800, 0.6);
        setKasForm(prev => ({ ...prev, evidenceUrl: optimized }));
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveKas = async () => {
    if (!kasForm.amount || !kasForm.description) return;
    setIsProcessing(true);
    const date = new Date(kasForm.date!);
    const sequence = (financeLogs.length + 1).toString().padStart(3, '0');
    const label = kasForm.type === 'IN' ? 'KT-M' : 'KT-K';
    const code = `${sequence}/${label}/${romanMonths[date.getMonth()]}/${date.getFullYear()}`;

    const newTx: YouthFinanceTx = {
      id: `YTX-${Date.now()}`,
      code,
      type: kasForm.type as any,
      amount: Number(kasForm.amount),
      description: kasForm.description!,
      date: kasForm.date!,
      evidenceUrl: kasForm.evidenceUrl
    };
    
    const updated = [newTx, ...financeLogs];
    await storage.set(STORAGE_KEYS.YOUTH_FINANCE, updated);
    setShowKasForm(false);
    setIsProcessing(false);
    setKasForm({ 
      type: 'IN', 
      date: new Date().toISOString().split('T')[0], 
      amount: 0, 
      description: '',
      evidenceUrl: ''
    });
  };

  const handleDeleteTransaction = async (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm("Hapus data transaksi ini?")) {
      const updated = financeLogs.filter(f => f.id !== id);
      await storage.set(STORAGE_KEYS.YOUTH_FINANCE, updated);
    }
  };

  const handleResetTransactions = async () => {
    if (role !== 'ADMIN') return;
    if (window.confirm("PERINGATAN: Hapus SELURUH data transaksi (Ledger & Matrix Iuran)? Tindakan ini tidak dapat dibatalkan.")) {
      if (window.confirm("Sekali lagi, apakah Anda yakin ingin membersihkan seluruh buku kas pemuda?")) {
        setIsProcessing(true);
        await storage.set(STORAGE_KEYS.YOUTH_ARISAN_LOGS, []);
        await storage.set(STORAGE_KEYS.YOUTH_FINANCE, []);
        setIsProcessing(false);
        alert("Seluruh data transaksi iuran pemuda telah dihapus.");
      }
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name) return;
    const member: YouthMember = {
      id: `YM-${Date.now()}`,
      name: newMember.name,
      phone: newMember.phone,
      address: newMember.address
    };
    const updated = [...members, member];
    await storage.set(STORAGE_KEYS.YOUTH_MEMBERS, updated);
    setnewMember({ name: '', phone: '', address: '' });
  };

  const handleDeleteMember = async (id: string) => {
    if (role !== 'ADMIN') return;
    if (!window.confirm("Hapus anggota ini? Data iuran yang bersangkutan akan tetap ada namun nama tidak muncul di daftar anggota aktif.")) return;
    const updated = members.filter(m => m.id !== id);
    await storage.set(STORAGE_KEYS.YOUTH_MEMBERS, updated);
  };

  const handleDrawArisan = () => {
    if (members.length === 0) return;
    setIsSpinning(true);
    setWinnerName(null);
    
    let count = 0;
    const interval = setInterval(() => {
      const tempWinner = members[Math.floor(Math.random() * members.length)];
      setWinnerName(tempWinner.name);
      count++;
      if (count > 20) {
        clearInterval(interval);
        setIsSpinning(false);
      }
    }, 100);
  };

  const handleConfirmArisanPayout = async () => {
    if (!winnerName) return;
    setIsProcessing(true);
    const amount = arisanCurrentPool;
    const newTx: YouthFinanceTx = {
      id: `YTX-AR-${Date.now()}`,
      code: `ARISAN-${Date.now().toString().slice(-4)}`,
      type: 'OUT',
      amount,
      description: `Pembayaran Arisan: ${winnerName}`,
      date: new Date().toISOString().split('T')[0]
    };
    const updated = [newTx, ...financeLogs];
    await storage.set(STORAGE_KEYS.YOUTH_FINANCE, updated);
    setShowPayoutConfirm(false);
    setIsProcessing(false);
    alert(`Arisan senilai Rp ${amount.toLocaleString()} telah dibayarkan kepada ${winnerName}`);
  };

  const memberPersonalData = useMemo(() => {
    if (!selectedMemberId) return null;
    const member = members.find(m => m.id === selectedMemberId);
    const logsOfMember = arisanLogs.filter(l => l.paidMemberIds.includes(selectedMemberId));
    const totalContribution = logsOfMember.length * (settings.arisanNominal + settings.kasNominal);
    const wins = financeLogs.filter(f => f.type === 'OUT' && f.description.includes(member?.name || '---'));
    const totalWon = wins.reduce((acc, f) => acc + f.amount, 0);

    return {
      member,
      totalContribution,
      totalWon,
      history: logsOfMember.sort((a,b) => b.period.localeCompare(a.period))
    };
  }, [selectedMemberId, members, arisanLogs, financeLogs, settings]);

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      {/* HEADER CARD */}
      <div className="bg-violet-700 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex justify-between items-start">
             <div className="space-y-1">
                <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Kas Karang Taruna</h2>
                <p className="text-[10px] opacity-70 font-black uppercase tracking-widest mt-1">Pengelolaan Dana Pemuda RT 05</p>
             </div>
             <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2" /></svg>
             </div>
          </div>
          <div className="flex gap-1.5 bg-black/20 p-1.5 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {['Monitoring', 'Individu', 'Kas Umum', 'Analisa', 'Undian', 'Admin'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[90px] py-3.5 rounded-2xl text-[8px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-violet-700 shadow-xl' : 'text-white/40'}`}>{t}</button>
             ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-950 p-8 rounded-[44px] text-white shadow-2xl relative overflow-hidden border border-white/5">
         <div className="grid grid-cols-2 gap-8 relative z-10">
            <div>
               <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Total Saldo Kas</p>
               <h4 className="text-3xl font-black mt-1">Rp {totalBalance.toLocaleString()}</h4>
            </div>
            <div className="text-right">
               <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Dana Arisan (Pool)</p>
               <h4 className="text-3xl font-black mt-1">Rp {arisanCurrentPool.toLocaleString()}</h4>
            </div>
         </div>
         <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-violet-600/10 rounded-full blur-[80px]"></div>
      </div>

      {activeTab === 'Monitoring' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-6 overflow-x-auto no-scrollbar">
             <div className="flex justify-between items-center px-2 min-w-[600px]">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Matrix Iuran {selectedYear}</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-lg"></div>
                    <span className="text-[8px] font-black text-slate-400 uppercase">Lunas</span>
                  </div>
                  <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black">
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
             </div>
             <table className="w-full border-collapse min-w-[600px]">
                <thead>
                   <tr className="bg-slate-50">
                      <th className="px-4 py-4 text-left text-[9px] font-black text-slate-400 uppercase sticky left-0 bg-slate-50 z-10">Nama Anggota</th>
                      {monthsLabels.map(m => <th key={m} className="px-2 py-4 text-center text-[9px] font-black text-slate-400 uppercase">{m}</th>)}
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                   {members.map(member => (
                      <tr key={member.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="px-4 py-4 sticky left-0 bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap">
                            <p className="text-xs font-black text-slate-800 uppercase">{member.name}</p>
                         </td>
                         {monthsLabels.map((_, i) => {
                            const period = `${selectedYear}-${String(i + 1).padStart(2, '0')}`;
                            const paid = isPaid(member.id, period);
                            return (
                               <td key={i} className="px-2 py-4 text-center">
                                  <button 
                                    onClick={() => handleTogglePayment(member.id, i)}
                                    className={`w-7 h-7 rounded-xl mx-auto flex items-center justify-center transition-all ${paid ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 text-slate-200 hover:bg-slate-200'}`}
                                  >
                                     {paid && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path d="M5 13l4 4L19 7" /></svg>}
                                  </button>
                               </td>
                            );
                         })}
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {activeTab === 'Individu' && (
        <div className="space-y-6 animate-page-enter">
           <div className="bg-white p-8 rounded-[44px] border border-slate-100 shadow-sm space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Nama Anggota</label>
                 <select 
                    className="w-full bg-slate-900 text-white rounded-[24px] px-8 py-5 outline-none font-black text-sm appearance-none shadow-xl"
                    value={selectedMemberId}
                    onChange={e => setSelectedMemberId(e.target.value)}
                 >
                    <option value="">-- Pilih Anggota --</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                 </select>
              </div>

              {memberPersonalData ? (
                <div className="space-y-8 animate-page-enter">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-violet-50 p-6 rounded-[32px] border border-violet-100">
                         <p className="text-[9px] font-black text-violet-400 uppercase tracking-widest">Total Kontribusi</p>
                         <h4 className="text-xl font-black text-violet-800 mt-1">Rp {memberPersonalData.totalContribution.toLocaleString()}</h4>
                      </div>
                      <div className="bg-emerald-50 p-6 rounded-[32px] border border-emerald-100">
                         <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Total Arisan</p>
                         <h4 className="text-xl font-black text-violet-800 mt-1">Rp {memberPersonalData.totalWon.toLocaleString()}</h4>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Riwayat Pembayaran</h5>
                      <div className="space-y-2">
                         {memberPersonalData.history.map(log => (
                           <div key={log.id} className="bg-slate-50 p-4 rounded-2xl flex justify-between items-center">
                              <div>
                                 <p className="text-xs font-black text-slate-800 uppercase">{new Date(log.period).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                                 <p className="text-[9px] text-slate-400 font-bold uppercase">Tanggal Bayar: {formatDateDisplay(log.date)}</p>
                              </div>
                              <div className="w-8 h-8 bg-emerald-500 text-white rounded-lg flex items-center justify-center">
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              ) : (
                <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-[44px]">
                   <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Pilih nama anggota untuk melihat detail</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeTab === 'Kas Umum' && (
         <div className="space-y-6 animate-page-enter">
            <div className="flex justify-between items-center px-4">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Buku Mutasi Kas</h3>
               {role === 'ADMIN' && (
                 <button onClick={() => setShowKasForm(true)} className="bg-violet-600 text-white px-6 py-2.5 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-violet-600/20 active:scale-95 transition-all">+ Input Mutasi</button>
               )}
            </div>
            <div className="bg-white border border-slate-100 rounded-[44px] overflow-hidden shadow-sm">
               {/* Mode Scrolling Horizontal (Kanan/Kiri) untuk Mobile */}
               <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left min-w-[600px]">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Tgl & Kode</th>
                           <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Deskripsi</th>
                           <th className="px-8 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Nominal</th>
                           {role === 'ADMIN' && <th className="px-4 py-5 text-center text-[9px] font-black uppercase text-slate-400 tracking-widest">Aksi</th>}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {financeLogs.length === 0 ? (
                        <tr><td colSpan={role === 'ADMIN' ? 4 : 3} className="py-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Buku Kas Masih Kosong</td></tr>
                        ) : (
                        financeLogs.map(log => (
                           <tr key={log.id} className="group">
                              <td className="px-8 py-5 whitespace-nowrap">
                                 <p className="text-[10px] font-black text-slate-400">{formatDateDisplay(log.date)}</p>
                                 <p className="text-[11px] font-black text-slate-800 mt-1">{log.code}</p>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex flex-col gap-1">
                                    <p className="text-sm font-black text-slate-700 uppercase leading-tight">{log.description}</p>
                                    <div className="flex gap-2">
                                    <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${log.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{log.type === 'IN' ? 'MASUK' : 'KELUAR'}</span>
                                    {log.evidenceUrl && <button onClick={() => setViewEvidence(log.evidenceUrl!)} className="text-[7px] font-black px-2 py-0.5 rounded uppercase bg-blue-50 text-blue-600">Lihat Bukti</button>}
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-right whitespace-nowrap">
                                 <p className={`text-sm font-black ${log.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{log.type === 'IN' ? '+' : '-'} Rp {log.amount.toLocaleString()}</p>
                              </td>
                              {role === 'ADMIN' && (
                                 <td className="px-4 py-5 text-center">
                                    <button onClick={() => handleDeleteTransaction(log.id)} className="p-2 text-rose-300 hover:text-rose-600 transition-colors">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                 </td>
                              )}
                           </tr>
                        ))
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'Undian' && (
         <div className="space-y-8 text-center py-10 animate-page-enter">
            <div className={`w-48 h-48 rounded-[60px] mx-auto flex items-center justify-center text-white shadow-2xl relative group overflow-hidden transition-all duration-500 ${isSpinning ? 'bg-indigo-600 scale-110' : 'bg-violet-600 scale-100'}`}>
               <div className="text-center relative z-10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Pemenang</p>
                  <h4 className="text-xl font-black mt-2 uppercase break-words leading-tight">{winnerName || '???'}</h4>
               </div>
               {isSpinning && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
               <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
            </div>
            <div className="space-y-4 px-6">
               <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight leading-none">Pengundian Digital</h3>
               <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">Pengundian dilakukan transparan dari daftar anggota aktif yang lunas iuran.</p>
               <div className="flex flex-col gap-3 max-w-sm mx-auto">
                  <button 
                    onClick={handleDrawArisan} 
                    disabled={isSpinning || members.length === 0}
                    className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-30"
                  >
                    {isSpinning ? 'MENGACAK...' : 'MULAI UNDIAN'}
                  </button>
                  {winnerName && !isSpinning && role === 'ADMIN' && (
                    <button 
                      onClick={() => setShowPayoutConfirm(true)}
                      className="w-full bg-emerald-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                    >
                      Konfirmasi Bayar Arisan
                    </button>
                  )}
               </div>
            </div>
         </div>
      )}

      {activeTab === 'Analisa' && (
         <div className="space-y-8 animate-page-enter">
            <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2 text-center">Trend Keuangan Bulanan</h3>
               <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={youthAnalytics.trendData}>
                        <defs>
                           <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 800, fill: '#94a3b8'}} />
                        <YAxis hide />
                        <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                        <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#8b5cf6" strokeWidth={5} fillOpacity={1} fill="url(#colorInc)" />
                        <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#f43f5e" strokeWidth={5} fill="transparent" />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '20px' }} />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>

            <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest text-center">Komposisi Dana Tersedia</h3>
               <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                        <Pie 
                          data={youthAnalytics.compositionData} 
                          cx="50%" cy="50%" innerRadius={60} outerRadius={85} 
                          paddingAngle={8} dataKey="value" stroke="none"
                        >
                           {youthAnalytics.compositionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" align="center" iconType="circle" />
                     </PieChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      )}

      {activeTab === 'Admin' && role === 'ADMIN' && (
         <div className="space-y-8 animate-page-enter">
            {/* MEMBER REGISTRATION */}
            <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-6">
               <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Master Data Anggota</h3>
               <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     <input type="text" placeholder="Nama Anggota" className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={newMember.name} onChange={e => setnewMember({...newMember, name: e.target.value})} />
                     <input type="text" placeholder="No HP / WA" className="bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 text-xs font-bold outline-none" value={newMember.phone} onChange={e => setnewMember({...newMember, phone: e.target.value})} />
                  </div>
                  <button onClick={handleAddMember} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Registrasi Anggota Baru</button>
               </div>
               <div className="space-y-3 pt-6 border-t border-slate-50 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
                  {members.length === 0 ? (
                    <p className="text-center text-slate-300 font-black uppercase text-[10px] py-10">Belum ada anggota terdaftar</p>
                  ) : (
                    members.map(m => (
                      <div key={m.id} className="flex justify-between items-center p-5 bg-slate-50 rounded-3xl border border-slate-100 group transition-all hover:border-violet-200">
                         <div>
                            <p className="text-xs font-black text-slate-800 uppercase">{m.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{m.phone || 'No HP -'}</p>
                         </div>
                         <button onClick={() => handleDeleteMember(m.id)} className="p-3 text-rose-300 hover:text-rose-600 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                      </div>
                    ))
                  )}
               </div>
            </div>

            {/* FINANCE SETTINGS */}
            <div className="bg-slate-900 border border-white/5 p-8 rounded-[44px] shadow-2xl text-white space-y-6">
               <h3 className="text-sm font-black uppercase tracking-widest">Konfigurasi Iuran</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Nominal Arisan (Rp)</label>
                     <input type="number" className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 font-black text-sm outline-none" value={settings.arisanNominal} onChange={e => setSettings({...settings, arisanNominal: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Kas Wajib (Rp)</label>
                     <input type="number" className="w-full bg-white/5 border border-white/10 text-white rounded-2xl px-5 py-4 font-black text-sm outline-none" value={settings.kasNominal} onChange={e => setSettings({...settings, kasNominal: Number(e.target.value)})} />
                  </div>
               </div>
               <button onClick={() => storage.set(STORAGE_KEYS.YOUTH_SETTINGS, settings)} className="w-full bg-violet-600 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Konfigurasi</button>
            </div>

            {/* DANGER ZONE - UNTUK MENGHAPUS KESELURUHAN DATA TRANSAKSI */}
            <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[44px] space-y-4">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center font-black">!</div>
                  <h4 className="text-sm font-black text-rose-700 uppercase tracking-widest leading-none">Zona Bahaya</h4>
               </div>
               <p className="text-[10px] text-rose-400 font-bold leading-relaxed px-1">Bersihkan seluruh data transaksi dan iuran yang tersimpan di Cloud. Tindakan ini permanen.</p>
               <button 
                  onClick={handleResetTransactions}
                  disabled={isProcessing}
                  className="w-full bg-rose-600 text-white py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-50"
               >
                  {isProcessing ? 'MEMPROSES...' : 'Hapus Seluruh Data Transaksi'}
               </button>
            </div>
         </div>
      )}

      {/* MODAL KAS FORM */}
      {showKasForm && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-md rounded-[60px] overflow-hidden shadow-2xl animate-page-enter border border-white/20">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Input Mutasi KT</h3>
               <button onClick={() => setShowKasForm(false)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg>
               </button>
            </div>
            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar pb-32">
               <div className="flex gap-3 p-1.5 bg-slate-100 rounded-[28px]">
                  {['IN', 'OUT'].map(type => (
                    <button key={type} onClick={() => setKasForm({...kasForm, type: type as any})} className={`flex-1 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all ${kasForm.type === type ? (type === 'IN' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-rose-600 text-white shadow-xl') : 'text-slate-400'}`}>
                      {type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}
                    </button>
                  ))}
               </div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Nominal (Rp)</label><input type="number" className="w-full bg-slate-900 text-white rounded-[28px] px-8 py-6 font-black text-3xl outline-none shadow-2xl focus:ring-4 focus:ring-blue-500/20" value={kasForm.amount || ''} onChange={e => setKasForm({...kasForm, amount: Number(e.target.value)})} placeholder="0" /></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Keterangan</label><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 outline-none font-bold text-slate-800 shadow-inner" value={kasForm.description} onChange={e => setKasForm({...kasForm, description: e.target.value})} placeholder="Contoh: Iuran Bulanan..." /></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Tanggal</label><input type="date" className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 outline-none font-bold text-slate-800 shadow-inner" value={kasForm.date} onChange={e => setKasForm({...kasForm, date: e.target.value})} /></div>
               
               {/* IMAGE UPLOAD FOR LEDGER */}
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Lampiran Bukti Nota</label>
                  <div 
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                    className="w-full aspect-video border-4 border-dashed border-slate-100 rounded-[40px] bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden shadow-inner transition-all"
                  >
                     {kasForm.evidenceUrl ? (
                        <img src={kasForm.evidenceUrl} className="w-full h-full object-cover" alt="Nota" />
                     ) : (
                        <div className="text-center space-y-2">
                           <svg className="w-10 h-10 text-slate-200 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                           <p className="text-[10px] font-black uppercase text-slate-300">Pilih Foto</p>
                        </div>
                     )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 flex gap-4 absolute bottom-0 w-full">
               <button onClick={() => setShowKasForm(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 tracking-widest">Batal</button>
               <button onClick={handleSaveKas} disabled={isProcessing} className="flex-[2] bg-slate-900 text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">{isProcessing ? 'SINKRON...' : 'Simpan Transaksi'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PAYOUT CONFIRM */}
      {showPayoutConfirm && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[48px] shadow-2xl p-10 space-y-6 text-center animate-page-enter border border-white/20">
             <div className="w-20 h-20 bg-emerald-50 rounded-[32px] flex items-center justify-center mx-auto text-emerald-600 shadow-inner">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4" /></svg>
             </div>
             <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">Pembayaran Arisan</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">Catat pengeluaran dana arisan untuk pemenang terpilih: <span className="text-violet-700 font-black">{winnerName}</span>?</p>
             </div>
             <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Pencairan</p>
                <p className="text-2xl font-black text-slate-900 mt-1">Rp {arisanCurrentPool.toLocaleString()}</p>
             </div>
             <div className="flex flex-col gap-3">
                <button 
                  onClick={handleConfirmArisanPayout}
                  disabled={isProcessing}
                  className="w-full bg-emerald-600 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                >
                  {isProcessing ? 'POSTING...' : 'Ya, Bayarkan Sekarang'}
                </button>
                <button 
                  onClick={() => setShowPayoutConfirm(false)}
                  className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest py-3"
                >
                  Batal
                </button>
             </div>
          </div>
        </div>
      )}

      {/* LIGHTBOX FOR EVIDENCE */}
      {viewEvidence && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6" onClick={() => setViewEvidence(null)}>
           <div className="relative max-w-4xl w-full flex flex-col items-center gap-6">
              <button onClick={() => setViewEvidence(null)} className="absolute -top-16 right-0 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
              <img src={viewEvidence} className="max-w-full max-h-[80vh] object-contain rounded-[44px] shadow-2xl border-4 border-white/5" alt="Bukti Kas" />
           </div>
        </div>
      )}
    </div>
  );
};

export default YouthFundPage;
