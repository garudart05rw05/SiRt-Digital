
import React, { useState, useEffect } from 'react';
import { Poll, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';

const MOCK_POLLS: Poll[] = [
  { 
    id: 'P1', 
    question: 'Warna cat Gapura RT untuk HUT RI nanti?', 
    options: [
      { id: 'O1', text: 'Merah Putih Klasik', votes: 12 },
      { id: 'O2', text: 'Modern Minimalis (Abu/Putih)', votes: 8 },
      { id: 'O3', text: 'Kreatif (Mural)', votes: 5 }
    ],
    totalVotes: 25,
    status: 'Active',
    createdAt: '2024-05-20T00:00:00Z'
  }
];

const PollsPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [polls, setPolls] = useState<Poll[]>(() => storage.get(STORAGE_KEYS.POLLS, MOCK_POLLS));
  const [showCreate, setShowCreate] = useState(false);
  const [newPoll, setNewPoll] = useState({ question: '', options: ['', ''] });

  useEffect(() => { storage.set(STORAGE_KEYS.POLLS, polls); }, [polls]);

  const handleVote = (pollId: string, optionId: string) => {
    setPolls(polls.map(p => {
      if (p.id !== pollId) return p;
      return {
        ...p,
        totalVotes: p.totalVotes + 1,
        options: p.options.map(o => o.id === optionId ? { ...o, votes: o.votes + 1 } : o)
      };
    }));
    alert("Terima kasih atas partisipasi Anda!");
  };

  const handleCreate = () => {
    if (role !== 'ADMIN') return;
    if (!newPoll.question || newPoll.options.some(o => !o)) return;
    const poll: Poll = {
      id: `P${Date.now()}`,
      question: newPoll.question,
      status: 'Active',
      createdAt: new Date().toISOString(),
      totalVotes: 0,
      options: newPoll.options.map((text, i) => ({ id: `O${i}`, text, votes: 0 }))
    };
    setPolls([poll, ...polls]);
    setShowCreate(false);
    setNewPoll({ question: '', options: ['', ''] });
  };

  const handleDelete = (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm('Hapus polling ini secara permanen?')) {
      setPolls(polls.filter(p => p.id !== id));
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-purple-700 rounded-[40px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Polling Warga</h2>
            <p className="text-sm opacity-70 font-medium mt-2">Suara Anda menentukan arah kebijakan lingkungan.</p>
          </div>
          {role === 'ADMIN' && (
            <button onClick={() => setShowCreate(true)} className="w-full bg-white text-purple-700 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Buat Polling Baru</button>
          )}
        </div>
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      <div className="space-y-6">
        {polls.map(poll => (
          <div key={poll.id} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-6 group">
            <div className="flex justify-between items-start">
               <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${poll.status === 'Active' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                 {poll.status === 'Active' ? 'Sedang Berjalan' : 'Selesai'}
               </span>
               <div className="flex items-center gap-3">
                 <p className="text-[10px] text-slate-400 font-bold uppercase">{poll.totalVotes} Total Suara</p>
                 {role === 'ADMIN' && (
                   <button onClick={() => handleDelete(poll.id)} className="text-rose-400 hover:text-rose-600 transition-colors">
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2}/></svg>
                   </button>
                 )}
               </div>
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{poll.question}</h3>
            
            <div className="space-y-3">
              {poll.options.map(opt => {
                const percentage = poll.totalVotes > 0 ? (opt.votes / poll.totalVotes) * 100 : 0;
                return (
                  <button 
                    key={opt.id} 
                    onClick={() => handleVote(poll.id, opt.id)}
                    disabled={poll.status === 'Closed'}
                    className="w-full relative group/opt"
                  >
                    <div className="relative z-10 flex justify-between items-center p-4 border border-slate-100 rounded-2xl overflow-hidden group-active/opt:scale-[0.98] transition-all">
                      <span className="font-bold text-slate-700 text-sm">{opt.text}</span>
                      <span className="text-xs font-black text-slate-400">{percentage.toFixed(0)}%</span>
                      <div style={{ width: `${percentage}%` }} className="absolute left-0 top-0 h-full bg-purple-50 -z-10 transition-all duration-1000"></div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {showCreate && role === 'ADMIN' && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[44px] p-10 space-y-8 animate-page-enter">
            <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">E-Polling Master</h3>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Pertanyaan Keputusan</label>
                <input type="text" placeholder="Contoh: Apakah setuju iuran naik?" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black placeholder-slate-600 transition-all" value={newPoll.question} onChange={e => setNewPoll({...newPoll, question: e.target.value})} />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Daftar Opsi Jawaban</label>
                {newPoll.options.map((opt, i) => (
                  <input key={i} type="text" placeholder={`Opsi ${i+1}`} className="w-full bg-slate-900 text-white rounded-xl px-5 py-3 outline-none font-bold placeholder-slate-700 text-sm transition-all" value={opt} onChange={e => {
                    const newOpts = [...newPoll.options];
                    newOpts[i] = e.target.value;
                    setNewPoll({...newPoll, options: newOpts});
                  }} />
                ))}
                <button onClick={() => setNewPoll({...newPoll, options: [...newPoll.options, '']})} className="text-purple-600 text-[10px] font-black uppercase tracking-widest py-2 px-2 hover:underline">+ Tambah Opsi Lain</button>
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowCreate(false)} className="flex-1 py-5 font-black uppercase tracking-widest text-slate-400">Batal</button>
              <button onClick={handleCreate} className="flex-2 bg-purple-600 text-white py-5 px-8 rounded-[28px] font-black uppercase tracking-widest shadow-2xl shadow-purple-500/30 transition-all active:scale-95">Rilis Polling</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PollsPage;
