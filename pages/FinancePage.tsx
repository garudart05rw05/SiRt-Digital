
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { Transaction, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
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
      if (docSnap.exists()) setSettings(docSnap.data().data || {});
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
    return { totalIn: tin, totalOut: tout, balance: tin - tout };
  }, [filteredTransactions]);

  const chartData = useMemo(() => {
    const monthly: Record<string, { month: string, in: number, out: number }> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    
    filteredTransactions.forEach(t => {
      const date = new Date(t.date);
      const mLabel = months[date.getMonth()];
      if (!monthly[mLabel]) monthly[mLabel] = { month: mLabel, in: 0, out: 0 };
      if (t.type === 'IN') monthly[mLabel].in += (t.amount || 0);
      else monthly[mLabel].out += (t.amount || 0);
    });
    return Object.values(monthly);
  }, [filteredTransactions]);

  const categoryColors: Record<string, string> = {
    'Kas Umum': '#0ea5e9',
    'Kas Jimpitan': '#8b5cf6',
    'Kas Solidaritas': '#f43f5e'
  };

  const activeColor = categoryColors[selectedCategory];

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteTransaction = async (id: string, desc: string) => {
    if (window.confirm(`Hapus catatan transaksi: "${desc}"? Tindakan ini akan segera terhapus dari Cloud.`)) {
      const updated = transactions.filter(t => t.id !== id);
      const saved = await storage.set(STORAGE_KEYS.FINANCE, updated);
      if (saved) {
        alert("Transaksi berhasil dihapus.");
      }
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
    const catLabel = catLabels[cat] || 'Kas-Um';
    const sameYearAndCat = transactions.filter(t => t && t.category === cat && new Date(t.date).getFullYear() === year);
    const sequentialNum = String(sameYearAndCat.length + 1).padStart(2, '0');
    return `${sequentialNum}/${catLabel}/${typeLabel}/${month}/${year}`;
  };

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

  const handleAddTransaction = async () => {
    if (!formData.amount || !formData.description) {
      alert("Mohon lengkapi nominal dan keterangan.");
      return;
    }
    
    setIsProcessing(true);
    try {
      let finalEvidenceUrl = formData.evidenceUrl || '';
      if (finalEvidenceUrl.startsWith('data:image')) {
        finalEvidenceUrl = await compressImage(finalEvidenceUrl, 800, 0.6);
      }

      const txDate = formData.date || new Date().toISOString().split('T')[0];
      const txType = (formData.type as 'IN' | 'OUT') || 'IN';
      const txCat = formData.category || 'Kas Umum';

      const newTx: Transaction = {
        id: Date.now().toString(),
        code: generateTxCode(txCat, txType, txDate),
        type: txType,
        amount: Number(formData.amount),
        description: formData.description || '',
        date: txDate,
        category: txCat,
        evidenceUrl: finalEvidenceUrl
      };
      
      const updated = [newTx, ...transactions];
      const saved = await storage.set(STORAGE_KEYS.FINANCE, updated);
      
      if (saved) {
        setShowInput(false);
        setFormData({ type: 'IN', category: 'Kas Umum', amount: 0, description: '', date: new Date().toISOString().split('T')[0], evidenceUrl: '' });
      }
    } catch (e) {
      alert("Gagal memproses data mutasi.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="print-header">
        <h1 className="text-2xl font-black uppercase">LAPORAN KAS {settings.rtRw}</h1>
        <p className="text-sm font-bold">{settings.location}</p>
        <p className="text-[10px] mt-1 italic">Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
        <div className="mt-4 border-t-2 pt-4 flex justify-between">
           <p className="font-bold">Kategori Filter: {selectedCategory}</p>
           <p className="font-bold">Total Saldo: Rp {(stats.balance ?? 0).toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-4 no-print">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Keuangan RT</h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{settings.rtRw} Master Ledger</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handlePrint}
              className="bg-white text-slate-700 p-4 rounded-2xl shadow-xl border border-slate-100 active:scale-90 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            </button>
            {role === 'ADMIN' && (
              <button 
                onClick={() => setShowInput(true)}
                className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl active:scale-90 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
              </button>
            )}
          </div>
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
              {cat === 'Kas Umum' ? 'Gabungan Kas (Total)' : cat}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-[44px] p-1 shadow-2xl relative overflow-hidden group transition-colors duration-500" style={{ backgroundColor: activeColor }}>
        <div className="bg-white/5 p-8 flex justify-between items-start text-white">
          <div className="space-y-1">
             <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total Saldo {selectedCategory}</h4>
             <p className="text-4xl font-black tracking-tight">Rp {(stats.balance ?? 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white m-1 rounded-[40px] p-8 grid grid-cols-2 gap-6 items-center">
           <div className="space-y-1">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Pemasukan</p>
              <p className="text-xl font-black text-emerald-600">Rp {(stats.totalIn ?? 0).toLocaleString()}</p>
           </div>
           <div className="space-y-1 text-right">
              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">Pengeluaran</p>
              <p className="text-xl font-black text-rose-600">Rp {(stats.totalOut ?? 0).toLocaleString()}</p>
           </div>
        </div>
      </div>

      <div className="flex bg-slate-100 p-1.5 rounded-3xl no-print">
         <button onClick={() => setActiveTab('Analytics')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Analytics' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Analisa Grafik</button>
         <button onClick={() => setActiveTab('Details')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'Details' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>Buku Kas</button>
      </div>

      {activeTab === 'Analytics' && (
        <div className="space-y-6 no-print animate-page-enter">
          <div className="bg-white border border-slate-100 p-8 rounded-[44px] shadow-sm space-y-6">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Trend Aliran Kas: {selectedCategory}</h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs><linearGradient id="colorActive" x1="0" x1="0" x2="0" y2="1"><stop offset="5%" stopColor={activeColor} stopOpacity={0.3}/><stop offset="95%" stopColor={activeColor} stopOpacity={0}/></linearGradient></defs>
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
      )}

      {activeTab === 'Details' && (
        <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm animate-page-enter">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[650px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Waktu & Kode</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest">Uraian / Kategori</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-right">Jumlah</th>
                  <th className="px-6 py-5 text-[9px] font-black uppercase text-slate-400 tracking-widest text-center no-print">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTransactions.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-[10px] font-black text-slate-400 uppercase leading-none">{new Date(t.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</p>
                      <p className="text-[11px] font-black text-slate-900 mt-2 font-mono">{t.code || '-'}</p>
                    </td>
                    <td className="px-6 py-5">
                      <p className="text-sm font-black text-slate-800 leading-tight">{t.description}</p>
                      <span className={`text-[7px] font-black px-1.5 py-0.5 rounded uppercase bg-slate-100 text-slate-500 mt-1 inline-block`}>{t.category}</span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <p className={`text-sm font-black ${t.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'IN' ? '+' : '-'} {(t.amount ?? 0).toLocaleString()}</p>
                    </td>
                    <td className="px-6 py-5 text-center no-print">
                      <div className="flex items-center justify-center gap-2">
                        {t.evidenceUrl && (
                          <button 
                            onClick={() => setViewEvidence(t.evidenceUrl!)}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          </button>
                        )}
                        {role === 'ADMIN' && (
                          <button 
                            onClick={() => handleDeleteTransaction(t.id, t.description)}
                            className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewEvidence && (
        <div 
          className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 animate-page-enter no-print"
          onClick={() => setViewEvidence(null)}
        >
          <div className="max-w-2xl w-full relative">
            <button className="absolute -top-14 right-0 w-12 h-12 bg-white/10 rounded-full text-white flex items-center justify-center backdrop-blur-md border border-white/20">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
            </button>
            <img src={viewEvidence} className="w-full h-auto rounded-[44px] shadow-2xl border-4 border-white/10" alt="Bukti Transaksi" />
          </div>
        </div>
      )}

      {showInput && role === 'ADMIN' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-md rounded-[44px] overflow-hidden shadow-2xl animate-page-enter flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Input Mutasi Kas</h3>
               <button onClick={() => setShowInput(false)} className="w-10 h-10 bg-white rounded-full shadow-sm text-slate-400"><svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
               <div className="flex gap-3">
                  {['IN', 'OUT'].map(type => (
                    <button key={type} onClick={() => setFormData({...formData, type: type as any})} className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === type ? (type === 'IN' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-slate-100 text-slate-400'}`}>
                      {type === 'IN' ? 'Kas Masuk' : 'Kas Keluar'}
                    </button>
                  ))}
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Kategori Dana</label>
                  <select className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                     {fundCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Nominal Transaksi (Rp)</label>
                  <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-5 outline-none font-black text-2xl" placeholder="0" value={formData.amount || ''} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
               </div>
               <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Uraian / Keterangan</label>
                  <input type="text" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-bold" placeholder="Contoh: Perbaikan saluran air..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
               </div>
               
               <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2">Unggah Bukti Nota (Opsional)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video border-4 border-dashed border-slate-100 rounded-[32px] bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-all overflow-hidden relative group"
                  >
                     {formData.evidenceUrl ? (
                        <>
                          <img src={formData.evidenceUrl} className="w-full h-full object-cover" alt="Preview" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                             <span className="bg-white text-slate-900 px-5 py-2 rounded-xl text-[9px] font-black uppercase">Ganti Foto</span>
                          </div>
                        </>
                     ) : (
                        <div className="text-center space-y-2">
                           <svg className="w-10 h-10 text-slate-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
                           <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Klik Upload Lampiran</p>
                        </div>
                     )}
                  </div>
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               </div>

               <button 
                onClick={handleAddTransaction} 
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white py-5 rounded-[32px] font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all disabled:opacity-50"
               >
                 {isProcessing ? 'Memproses...' : 'Simpan Mutasi'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancePage;
