import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';
import { Transaction, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { analyzeFinancialData } from '../services/geminiService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface FinancePageProps {
  role: UserRole;
}

type FundCategory = 'Kas Umum' | 'Kas Jimpitan' | 'Kas Solidaritas';

const FinancePage: React.FC<FinancePageProps> = ({ role }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri'
  });

  const [activeTab, setActiveTab] = useState<'Analytics' | 'Details'>('Analytics');
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Kas Umum');
  const [showInput, setShowInput] = useState(false);
  const [viewEvidence, setViewEvidence] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'IN',
    category: 'Kas Umum',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0],
    evidenceUrl: ''
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.FINANCE), (docSnap) => {
      if (docSnap.exists()) setTransactions(docSnap.data().data || []);
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data().data || {};
        setSettings(data);
      }
    });
    return () => { unsub(); unsubSettings(); };
  }, []);

  const fundCategories: FundCategory[] = ['Kas Umum', 'Kas Jimpitan', 'Kas Solidaritas'];
  
  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'Kas Umum') {
      return transactions;
    }
    return transactions.filter(t => t && t.category === selectedCategory);
  }, [transactions, selectedCategory]);

  const stats = useMemo(() => {
    const tin = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + (t.amount || 0), 0);
    const tout = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + (t.amount || 0), 0);
    
    const now = new Date();
    const curMonth = now.getMonth();
    const curYear = now.getFullYear();
    const monthIn = filteredTransactions
      .filter(t => t.type === 'IN' && new Date(t.date).getMonth() === curMonth && new Date(t.date).getFullYear() === curYear)
      .reduce((acc, t) => acc + (t.amount || 0), 0);
    const monthOut = filteredTransactions
      .filter(t => t.type === 'OUT' && new Date(t.date).getMonth() === curMonth && new Date(t.date).getFullYear() === curYear)
      .reduce((acc, t) => acc + (t.amount || 0), 0);

    return { totalIn: tin, totalOut: tout, balance: tin - tout, monthIn, monthOut };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const monthlyData = months.map((m, idx) => {
      const year = new Date().getFullYear();
      const inVal = filteredTransactions
        .filter(t => t.type === 'IN' && new Date(t.date).getMonth() === idx && new Date(t.date).getFullYear() === year)
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      const outVal = filteredTransactions
        .filter(t => t.type === 'OUT' && new Date(t.date).getMonth() === idx && new Date(t.date).getFullYear() === year)
        .reduce((acc, t) => acc + (t.amount || 0), 0);
      return { month: m, masuk: inVal, keluar: outVal, selisih: inVal - outVal };
    });

    // Hitung Saldo Kumulatif untuk AreaChart
    let runningBalance = 0;
    const trendData = monthlyData.map(d => {
      runningBalance += d.selisih;
      return { ...d, saldo: runningBalance };
    });

    return trendData;
  }, [filteredTransactions]);

  const pieData = useMemo(() => {
    const outTxs = filteredTransactions.filter(t => t.type === 'OUT');
    const grouped: Record<string, number> = {};
    
    outTxs.forEach(t => {
      const cat = t.description.split(' ')[0] || 'Lainnya';
      grouped[cat] = (grouped[cat] || 0) + (t.amount || 0);
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [filteredTransactions]);

  const PIE_COLORS = ['#0ea5e9', '#8b5cf6', '#f43f5e', '#f59e0b', '#10b981'];

  const categoryColors: Record<string, string> = {
    'Kas Umum': '#0ea5e9',
    'Kas Jimpitan': '#8b5cf6',
    'Kas Solidaritas': '#f43f5e'
  };

  const activeColor = categoryColors[selectedCategory] || '#6366f1';

  const handleAiAnalyze = async () => {
    if (filteredTransactions.length === 0) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const result = await analyzeFinancialData(filteredTransactions.slice(0, 20));
      setAiAnalysis(result);
    } catch (e) {
      setAiAnalysis("Gagal melakukan analisa AI.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handlePrint = () => window.print();

  const handleDeleteTransaction = async (id: string, desc: string) => {
    if (window.confirm(`Hapus catatan transaksi: "${desc}"?`)) {
      const updated = transactions.filter(t => t.id !== id);
      await storage.set(STORAGE_KEYS.FINANCE, updated);
    }
  };

  const generateTxCode = (cat: string, type: 'IN' | 'OUT', dateStr: string) => {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const typeLabel = type === 'IN' ? 'I' : 'O';
    const catLabels: Record<string, string> = {
      'Kas Umum': 'Kas-Um',
      'Kas Jimpitan': 'Kas-Jp',
      'Kas Solidaritas': 'Kas-Sdr'
    };
    const sameYearAndCat = transactions.filter(t => t && t.category === cat && new Date(t.date).getFullYear() === year);
    const sequentialNum = String(sameYearAndCat.length + 1).padStart(2, '0');
    return `${sequentialNum}/${catLabels[cat] || 'Kas-Um'}/${typeLabel}/${month}/${year}`;
  };

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description) return;
    setIsProcessing(true);
    let finalEvidenceUrl = formData.evidenceUrl || '';
    if (finalEvidenceUrl.startsWith('data:image')) {
      finalEvidenceUrl = await compressImage(finalEvidenceUrl, 800, 0.6);
    }
    const newTx: Transaction = {
      id: Date.now().toString(),
      code: generateTxCode(formData.category!, formData.type as any, formData.date!),
      type: formData.type as any,
      amount: Number(formData.amount),
      description: formData.description!,
      date: formData.date!,
      category: formData.category!,
      evidenceUrl: finalEvidenceUrl
    };
    const updated = [newTx, ...transactions];
    if (await storage.set(STORAGE_KEYS.FINANCE, updated)) {
      setShowInput(false);
      setFormData({ type: 'IN', category: 'Kas Umum', amount: 0, description: '', date: new Date().toISOString().split('T')[0], evidenceUrl: '' });
    }
    setIsProcessing(false);
  };

  // Fix: Implemented missing handleFileChange function
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, evidenceUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-32 animate-page-enter">
      <div className="print-header">
        <h1 className="text-2xl font-black uppercase">LAPORAN KAS {settings.rtRw}</h1>
        <p className="text-sm font-bold">{settings.location}</p>
        <p className="text-[10px] mt-1 italic">Dicetak: {new Date().toLocaleString('id-ID')}</p>
      </div>

      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Keuangan</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{settings.rtRw} Digital Ledger</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-white text-slate-700 p-4 rounded-2xl shadow-xl border border-slate-100 active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" strokeWidth={2.5}/></svg></button>
            {role === 'ADMIN' && (
              <button onClick={() => setShowInput(true)} className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M12 4v16m8-8H4" /></svg></button>
            )}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {fundCategories.map(cat => (
            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${selectedCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}>
              {cat === 'Kas Umum' ? 'Gabungan Kas' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[44px] p-1 shadow-2xl relative overflow-hidden transition-all duration-500" style={{ backgroundColor: activeColor }}>
        <div className="bg-white/5 p-8 flex justify-between items-start text-white">
          <div className="space-y-1">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Saldo Terkini</h4>
             <p className="text-5xl font-black tracking-tighter">Rp {(stats.balance ?? 0).toLocaleString()}</p>
             <p className="text-[10px] font-bold opacity-40 uppercase mt-1 tracking-widest">{selectedCategory} Ledger</p>
          </div>
        </div>
        <div className="bg-white m-1 rounded-[40px] p-8 grid grid-cols-2 gap-6 items-center">
           <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Akumulasi Masuk</p>
              <p className="text-xl font-black text-emerald-600">Rp {(stats.totalIn ?? 0).toLocaleString()}</p>
           </div>
           <div className="space-y-1 text-right">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Akumulasi Keluar</p>
              <p className="text-xl font-black text-rose-600">Rp {(stats.totalOut ?? 0).toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-3xl no-print">
         <button onClick={() => setActiveTab('Analytics')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Analytics' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Visualisasi & AI</button>
         <button onClick={() => setActiveTab('Details')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Details' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Arsip Buku Kas</button>
      </div>

      {activeTab === 'Analytics' && (
        <div className="space-y-8 no-print animate-page-enter">
          {/* AI Section */}
          <div className="bg-slate-950 p-8 rounded-[48px] text-white shadow-2xl relative overflow-hidden border border-white/5">
            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl">✨</div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-indigo-300">Analisa Cerdas AI</h3>
                 </div>
                 <button onClick={handleAiAnalyze} disabled={isAnalyzing || filteredTransactions.length === 0} className="bg-white text-slate-900 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-xl disabled:opacity-50">
                   {isAnalyzing ? 'Menganalisa...' : 'Jalankan Analisa'}
                 </button>
              </div>
              {aiAnalysis && (
                <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 animate-page-enter">
                  <p className="text-xs font-medium leading-relaxed text-indigo-100 italic">{aiAnalysis}</p>
                </div>
              )}
            </div>
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
          </div>

          {/* Bar Chart: Comparison In vs Out */}
          <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2 text-center">Perbandingan Bulanan ({new Date().getFullYear()})</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} 
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '1px', paddingTop: '20px' }} />
                  <Bar name="Pemasukan" dataKey="masuk" fill="#10b981" radius={[6, 6, 0, 0]} />
                  <Bar name="Pengeluaran" dataKey="keluar" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Area Chart: Balance Trend */}
          <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2 text-center">Trend Pertumbuhan Saldo</h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={activeColor} stopOpacity={0.2}/>
                      <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 'bold' }} />
                  <Area type="monotone" name="Estimasi Saldo" dataKey="saldo" stroke={activeColor} fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Pie Chart */}
          <div className="bg-white border border-slate-100 p-10 rounded-[56px] shadow-sm space-y-8">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest px-2 text-center">Distribusi Pengeluaran</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                 {pieData.length === 0 ? (
                   <p className="text-center text-slate-300 font-bold text-xs uppercase italic">Belum ada pengeluaran di ledger</p>
                 ) : (
                   pieData.map((item, idx) => (
                     <div key={item.name} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-all">
                        <div className="flex items-center gap-3">
                           <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></div>
                           <span className="text-[10px] font-black uppercase text-slate-500 truncate max-w-[100px]">{item.name}</span>
                        </div>
                        <span className="text-xs font-black text-slate-900">Rp {item.value.toLocaleString()}</span>
                     </div>
                   ))
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'Details' && (
        <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden shadow-sm animate-page-enter">
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Waktu & Kode</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest">Deskripsi</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Nominal</th>
                  <th className="px-8 py-6 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center no-print">Bukti</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-24 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest">Buku Kas Kosong</td></tr>
                ) : (
                  filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-8 py-6 whitespace-nowrap">
                        <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year: 'numeric'})}</p>
                        <p className="text-[11px] font-black text-slate-900 mt-2 font-mono tracking-tighter">{t.code || '-'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-slate-800 leading-tight uppercase">{t.description}</p>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[7px] font-black px-2 py-0.5 rounded uppercase bg-slate-100 text-slate-500">{t.category}</span>
                           <span className={`text-[7px] font-black px-2 py-0.5 rounded uppercase ${t.type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{t.type === 'IN' ? 'MASUK' : 'KELUAR'}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right whitespace-nowrap">
                        <p className={`text-base font-black ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'IN' ? '+' : '-'} {(t.amount ?? 0).toLocaleString()}</p>
                      </td>
                      <td className="px-8 py-6 text-center no-print">
                        <div className="flex items-center justify-center gap-2">
                          {t.evidenceUrl && (
                            <button onClick={() => setViewEvidence(t.evidenceUrl!)} className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></button>
                          )}
                          {role === 'ADMIN' && (
                            <button onClick={() => handleDeleteTransaction(t.id, t.description)} className="w-11 h-11 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm active:scale-90"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewEvidence && (
        <div className="fixed inset-0 z-[200] bg-slate-950/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-page-enter no-print">
          <div className="max-w-2xl w-full relative">
            <button onClick={() => setViewEvidence(null)} className="absolute -top-16 right-0 w-12 h-12 bg-white/10 hover:bg-rose-500 rounded-full text-white flex items-center justify-center border border-white/20 transition-all active:scale-90 shadow-2xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12" /></svg></button>
            <img src={viewEvidence} className="w-full h-auto rounded-[48px] shadow-2xl border-4 border-white/10" alt="Bukti" />
            <div className="mt-6 text-center text-white/50 text-[10px] font-black uppercase tracking-[0.4em]">Arsip Digital Keuangan RT</div>
          </div>
        </div>
      )}

      {showInput && role === 'ADMIN' && (
        <div className="fixed inset-0 z-[1000] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-md rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.4)] animate-page-enter border border-white/20">
            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Input Mutasi</h3>
               <button onClick={() => setShowInput(false)} className="w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}><path d="M6 18L18 6M6 6l12 12"/></svg></button>
            </div>
            <div className="p-10 space-y-8 max-h-[75vh] overflow-y-auto no-scrollbar pb-24">
               <div className="flex gap-3 p-1.5 bg-slate-100 rounded-[28px]">
                  {['IN', 'OUT'].map(type => (
                    <button key={type} onClick={() => setFormData({...formData, type: type as any})} className={`flex-1 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all ${formData.type === type ? (type === 'IN' ? 'bg-emerald-600 text-white shadow-xl' : 'bg-rose-600 text-white shadow-xl') : 'text-slate-400'}`}>
                      {type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}
                    </button>
                  ))}
               </div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Kategori Kas</label><select className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 outline-none font-black text-slate-800 appearance-none shadow-inner" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value as any})}>{fundCategories.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Nominal (Rp)</label><input type="number" className="w-full bg-slate-900 text-white rounded-[28px] px-8 py-6 font-black text-3xl outline-none shadow-2xl focus:ring-4 focus:ring-blue-500/20" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} placeholder="0" /></div>
               <div className="space-y-1.5"><label className="text-[10px] font-black text-slate-400 uppercase ml-3">Keterangan</label><input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 outline-none font-bold text-slate-800 shadow-inner" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Contoh: Iuran Bulanan..." /></div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-3">Bukti Nota</label>
                  <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video border-4 border-dashed border-slate-100 rounded-[40px] bg-slate-50 flex items-center justify-center cursor-pointer hover:bg-slate-100 overflow-hidden shadow-inner">
                     {formData.evidenceUrl ? <img src={formData.evidenceUrl} className="w-full h-full object-cover" alt="" /> : <p className="text-[10px] font-black uppercase text-slate-300">Pilih Gambar</p>}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>
            </div>
            <div className="p-10 bg-slate-50 border-t border-slate-100 absolute bottom-0 w-full flex gap-4">
               <button onClick={() => setShowInput(false)} className="flex-1 py-5 text-[11px] font-black uppercase text-slate-400 tracking-widest">Batal</button>
               <button onClick={handleAddTransaction} disabled={isProcessing} className="flex-[2] bg-slate-900 text-white py-5 rounded-[32px] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">{isProcessing ? 'POSTING...' : 'Simpan Transaksi'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;