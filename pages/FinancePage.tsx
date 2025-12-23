
import React, { useState, useEffect, useMemo } from 'react';
import { 
  CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis,
  BarChart, Bar
} from 'recharts';
import { Transaction, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { analyzeFinancialData } from '../services/geminiService.ts';

interface FinancePageProps {
  role: UserRole;
}

type FundCategory = 'Semua' | 'Kas Umum' | 'Kas Jimpitan' | 'Kas Solidaritas';

const FinancePage: React.FC<FinancePageProps> = ({ role }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    storage.get(STORAGE_KEYS.FINANCE, [])
  );

  const [settings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    motto: "Transparan, Terpercaya, dan Saling Menjaga",
    youtubeUrl: "https://youtube.com/@rukuntetangga-i3k?si=QNxgcSiBEZGISfEh",
    tiktokUrl: "https://tiktok.com/@rt_digital_pro",
    instagramUrl: "https://instagram.com/rt_digital_pro",
    archiveUrl: "https://drive.google.com",
    archiveNotulenUrl: "https://drive.google.com",
    archiveEdaranUrl: "https://drive.google.com",
    archiveKeuanganUrl: "https://drive.google.com",
    archivePerdaUrl: "https://drive.google.com",
    archiveLainnyaUrl: "https://drive.google.com",
    rtRw: 'Sistem RT/RW',
    location: 'Lokasi belum diatur',
    chairmanPhone: "08123456789",
    panicButtonUrl: "https://panicbutton.gayammojoroto.my.id",
    popupEnabled: true,
    chairmanName: '(Nama Ketua)',
    treasurerName: '(Nama Bendahara)'
  }));

  const [activeTab, setActiveTab] = useState<'Analytics' | 'Details'>('Analytics');
  const [selectedCategory, setSelectedCategory] = useState<FundCategory>('Semua');
  const [showInput, setShowInput] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const [formData, setFormData] = useState<Partial<Transaction>>({
    type: 'IN',
    category: 'Kas Umum',
    amount: 0,
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  const loadData = () => {
    setTransactions(storage.get<Transaction[]>(STORAGE_KEYS.FINANCE, []));
  };

  useEffect(() => {
    loadData();
    window.addEventListener('storage_updated', loadData);
    return () => window.removeEventListener('storage_updated', loadData);
  }, []);

  const fundCategories: FundCategory[] = ['Semua', 'Kas Umum', 'Kas Jimpitan', 'Kas Solidaritas'];
  
  const filteredTransactions = useMemo(() => {
    if (selectedCategory === 'Semua') return transactions;
    return transactions.filter(t => t.category === selectedCategory);
  }, [transactions, selectedCategory]);

  const stats = useMemo(() => {
    const tin = filteredTransactions.filter(t => t.type === 'IN').reduce((acc, t) => acc + t.amount, 0);
    const tout = filteredTransactions.filter(t => t.type === 'OUT').reduce((acc, t) => acc + t.amount, 0);
    return { totalIn: tin, totalOut: tout, balance: tin - tout };
  }, [filteredTransactions]);

  const comparisonData = useMemo(() => {
    return [
      { name: 'Umum', in: transactions.filter(t => t.category === 'Kas Umum' && t.type === 'IN').reduce((a, b) => a + b.amount, 0), out: transactions.filter(t => t.category === 'Kas Umum' && t.type === 'OUT').reduce((a, b) => a + b.amount, 0) },
      { name: 'Jimpitan', in: transactions.filter(t => t.category === 'Kas Jimpitan' && t.type === 'IN').reduce((a, b) => a + b.amount, 0), out: transactions.filter(t => t.category === 'Kas Jimpitan' && t.type === 'OUT').reduce((a, b) => a + b.amount, 0) },
      { name: 'Solidaritas', in: transactions.filter(t => t.category === 'Kas Solidaritas' && t.type === 'IN').reduce((a, b) => a + b.amount, 0), out: transactions.filter(t => t.category === 'Kas Solidaritas' && t.type === 'OUT').reduce((a, b) => a + b.amount, 0) }
    ];
  }, [transactions]);

  const chartData = useMemo(() => {
    const monthly: Record<string, { month: string, in: number, out: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const mLabel = months[date.getMonth()];
      if (!monthly[mLabel]) monthly[mLabel] = { month: mLabel, in: 0, out: 0 };
      if (t.type === 'IN') monthly[mLabel].in += t.amount;
      else monthly[mLabel].out += t.amount;
    });
    return Object.values(monthly);
  }, [filteredTransactions]);

  const categoryColors: Record<string, string> = {
    'Kas Umum': '#0ea5e9',
    'Kas Jimpitan': '#8b5cf6',
    'Kas Solidaritas': '#f43f5e',
    'Semua': '#0f172a'
  };

  const activeColor = categoryColors[selectedCategory];

  const handleAddTransaction = () => {
    if (!formData.amount || !formData.description) return;
    const newTx: Transaction = {
      id: Date.now().toString(),
      type: formData.type as 'IN' | 'OUT',
      amount: Number(formData.amount),
      description: formData.description || '',
      date: formData.date || '',
      category: formData.category || 'Kas Umum'
    };
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    storage.set(STORAGE_KEYS.FINANCE, updated);
    setShowInput(false);
    setFormData({ type: 'IN', category: 'Kas Umum', amount: 0, description: '', date: new Date().toISOString().split('T')[0] });
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Portal Kas</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{settings.rtRw} Ledger System</p>
          </div>
          {role === 'ADMIN' && (
            <button 
              onClick={() => setShowInput(true)}
              className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
          {fundCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                selectedCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                  : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div 
        className="rounded-[44px] p-1 shadow-2xl relative overflow-hidden group no-print transition-colors duration-500"
        style={{ backgroundColor: activeColor }}
      >
        <div className="bg-white/5 p-8 flex justify-between items-start text-white">
          <div className="space-y-1">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Saldo {selectedCategory}</h4>
             <p className="text-4xl font-black tracking-tight">Rp {stats.balance.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl backdrop-blur-md border border-white/10 flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-widest">Update Cloud</span>
          </div>
        </div>
        <div className="bg-white m-1 rounded-[40px] p-8 grid grid-cols-2 gap-6 items-center">
           <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Pemasukan</p>
              <p className="text-xl font-black text-emerald-600">Rp {stats.totalIn.toLocaleString()}</p>
           </div>
           <div className="space-y-1 text-right">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Pengeluaran</p>
              <p className="text-xl font-black text-rose-600">Rp {stats.totalOut.toLocaleString()}</p>
           </div>
        </div>
      </div>

      {transactions.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada mutasi transaksi</p>
        </div>
      ) : (
        <>
          <div className="flex bg-slate-100 p-1.5 rounded-3xl no-print">
             <button onClick={() => setActiveTab('Analytics')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Analytics' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Analisa Visual</button>
             <button onClick={() => setActiveTab('Details')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Details' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Log Transaksi</button>
          </div>

          {activeTab === 'Analytics' ? (
            <div className="space-y-6 no-print animate-page-enter">
              <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tren Aliran Kas: {selectedCategory}</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs><linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/><stop offset="95%" stopColor={activeColor} stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="in" stroke={activeColor} fillOpacity={1} fill="url(#colorActive)" strokeWidth={4} />
                      <Area type="monotone" dataKey="out" stroke="#e2e8f0" fill="transparent" strokeWidth={3} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Tanggal</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Uraian</th>
                    <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Jumlah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTransactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5"><p className="text-xs font-bold text-slate-500">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p></td>
                      <td className="px-6 py-5"><p className="text-sm font-black text-slate-800 leading-tight">{t.description}</p><span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-50 text-slate-400`}>{t.category}</span></td>
                      <td className="px-6 py-5 text-right"><p className={`text-sm font-black ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'IN' ? '+' : '-'} {t.amount.toLocaleString()}</p></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {showInput && role === 'ADMIN' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-md rounded-[44px] overflow-hidden shadow-2xl animate-page-enter">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Input Mutasi</h3>
               <button onClick={() => setShowInput(false)} className="w-10 h-10 bg-white rounded-full shadow-sm text-slate-400"><svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
            </div>
            <div className="p-10 space-y-6">
               <div className="flex gap-3">
                  {['IN', 'OUT'].map(type => (
                    <button key={type} onClick={() => setFormData({...formData, type: type as any})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === type ? (type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-slate-100 text-slate-400'}`}>
                      {type === 'IN' ? 'Pemasukan' : 'Pengeluaran'}
                    </button>
                  ))}
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Jenis Kas</label>
                  <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                     {fundCategories.filter(c => c !== 'Semua').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Nominal Rp</label>
                  <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-5 outline-none font-black text-2xl" placeholder="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Uraian Transaksi</label>
                  <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Keterangan..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
               <button onClick={handleAddTransaction} className="w-full bg-slate-900 text-white py-5 rounded-[32px] font-black text-[10px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Posting Mutasi</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
