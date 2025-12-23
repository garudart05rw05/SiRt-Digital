
import React, { useState, useEffect, useMemo } from 'react';
import { 
  JimpitanSettings, JimpitanResidentStatus, JimpitanLog, 
  UserRole, SecurityShift, Transaction, AppSettings 
} from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';

interface JimpitanResident {
  id: string;
  name: string;
  houseNumber: string;
}

const JimpitanPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [jimpitanResidents, setJimpitanResidents] = useState<JimpitanResident[]>(() => 
    storage.get(STORAGE_KEYS.JIMPITAN_RESIDENTS, [])
  );
  
  const [schedule] = useState<SecurityShift[]>(() => storage.get(STORAGE_KEYS.SCHEDULE, []));
  const [settings, setSettings] = useState<JimpitanSettings>(() => storage.get(STORAGE_KEYS.JIMPITAN_SETTINGS, {
    dailyAmount: 1000,
    activeResidentIds: [] 
  }));

  const [status, setStatus] = useState<JimpitanResidentStatus[]>(() => storage.get(STORAGE_KEYS.JIMPITAN_STATUS, []));
  const [logs, setLogs] = useState<JimpitanLog[]>(() => storage.get(STORAGE_KEYS.JIMPITAN_LOGS, []));
  const [activeTab, setActiveTab] = useState<'Petugas' | 'Pelunasan' | 'PerWarga' | 'Riwayat' | 'Admin'>('Petugas');
  
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkedResidents, setCheckedResidents] = useState<string[]>([]);
  
  // States for Pelunasan
  const [prepResId, setPrepResId] = useState('');
  const [prepAmount, setPrepAmount] = useState<number>(0);
  
  // States for Admin
  const [newName, setNewName] = useState('');
  const [newHouse, setNewHouse] = useState('');

  useEffect(() => { storage.set(STORAGE_KEYS.JIMPITAN_RESIDENTS, jimpitanResidents); }, [jimpitanResidents]);
  useEffect(() => { storage.set(STORAGE_KEYS.JIMPITAN_STATUS, status); }, [status]);
  useEffect(() => { storage.set(STORAGE_KEYS.JIMPITAN_LOGS, logs); }, [logs]);
  useEffect(() => { storage.set(STORAGE_KEYS.JIMPITAN_SETTINGS, settings); }, [settings]);

  const isResidentLunasOnDate = (resId: string, dateStr: string) => {
    const s = status.find(st => st.residentId === resId);
    if (!s || !s.paidUntil) return false;
    return new Date(s.paidUntil) >= new Date(dateStr);
  };

  const handleSaveLog = () => {
    if (checkedResidents.length === 0) return;
    
    const prepaidIds = jimpitanResidents.filter(r => isResidentLunasOnDate(r.id, selectedDate)).map(r => r.id);
    const cashPaidIds = checkedResidents.filter(id => !prepaidIds.includes(id));

    const newLog: JimpitanLog = {
      id: Date.now().toString(),
      date: selectedDate,
      collectorName: role === 'ADMIN' ? 'Admin' : 'Petugas Ronda',
      nominalPerWarga: settings.dailyAmount,
      collectedResidentIds: cashPaidIds,
      autoPaidResidentIds: prepaidIds,
      totalCashReceived: cashPaidIds.length * settings.dailyAmount
    };

    setLogs([newLog, ...logs]);
    setCheckedResidents([]);
    alert(`Log jimpitan tanggal ${selectedDate} berhasil disimpan!`);
  };

  const handleBulkPay = () => {
    if (!prepResId || prepAmount <= 0) return;
    const daysToAdd = Math.floor(prepAmount / settings.dailyAmount);
    if (daysToAdd <= 0) return;

    const currentStatus = status.find(s => s.residentId === prepResId);
    let startDate = new Date();
    if (currentStatus && currentStatus.paidUntil && new Date(currentStatus.paidUntil) > new Date()) {
      startDate = new Date(currentStatus.paidUntil);
    }
    
    const newPaidUntil = new Date(startDate);
    newPaidUntil.setDate(newPaidUntil.getDate() + daysToAdd);

    const updatedStatus = status.some(s => s.residentId === prepResId)
      ? status.map(s => s.residentId === prepResId ? { ...s, paidUntil: newPaidUntil.toISOString().split('T')[0] } : s)
      : [...status, { residentId: prepResId, paidUntil: newPaidUntil.toISOString().split('T')[0] }];

    setStatus(updatedStatus);
    setPrepResId('');
    setPrepAmount(0);
    alert(`Pembayaran jimpitan di muka berhasil! Lunas hingga ${newPaidUntil.toLocaleDateString('id-ID')}`);
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-indigo-800 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tight">Jimpitan Digital</h2>
          <p className="text-xs opacity-70 font-bold uppercase tracking-widest">Sistem Kas Mandiri Warga RT 05</p>
          <div className="flex gap-1.5 bg-black/20 p-1 rounded-3xl border border-white/10 overflow-x-auto no-scrollbar">
             {['Petugas', 'Pelunasan', 'Riwayat', 'Admin'].map(t => (
               <button key={t} onClick={() => setActiveTab(t as any)} className={`flex-1 min-w-[90px] py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t ? 'bg-white text-indigo-700 shadow-md' : 'text-white/60'}`}>{t}</button>
             ))}
          </div>
        </div>
      </div>

      {activeTab === 'Petugas' && (
        <div className="space-y-6 animate-page-enter">
          <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Input Harian</h3>
                <input type="date" className="bg-slate-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
             </div>
             
             <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {jimpitanResidents.map(resident => {
                  const isLunas = isResidentLunasOnDate(resident.id, selectedDate);
                  const isChecked = isLunas || checkedResidents.includes(resident.id);
                  return (
                    <div key={resident.id} onClick={() => !isLunas && setCheckedResidents(prev => prev.includes(resident.id) ? prev.filter(i => i !== resident.id) : [...prev, resident.id])} className={`p-5 rounded-[32px] border transition-all flex items-center justify-between cursor-pointer ${isLunas ? 'bg-emerald-50 border-emerald-100' : isChecked ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-slate-100'}`}>
                       <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[10px] ${isChecked ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{resident.houseNumber}</div>
                          <div>
                            <p className="text-sm font-black text-slate-800 leading-none">{resident.name}</p>
                            {isLunas && <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1">Lunas (Prepaid)</p>}
                          </div>
                       </div>
                       <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-slate-50'}`}>
                          {isChecked && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                       </div>
                    </div>
                  );
                })}
             </div>
             
             <button onClick={handleSaveLog} className="w-full bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Laporan Harian</button>
          </div>
        </div>
      )}

      {activeTab === 'Pelunasan' && (
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-6 animate-page-enter">
           <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Bayar di Muka</h3>
           <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Warga</label>
                 <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold" value={prepResId} onChange={e => setPrepResId(e.target.value)}>
                    <option value="">-- Pilih Nama --</option>
                    {jimpitanResidents.map(r => <option key={r.id} value={r.id}>{r.name} ({r.houseNumber})</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Bayar (Rp)</label>
                 <input type="number" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl" placeholder="Contoh: 30000" value={prepAmount || ''} onChange={e => setPrepAmount(Number(e.target.value))} />
                 <p className="text-[9px] text-slate-400 mt-1 ml-2">*Setara {Math.floor(prepAmount/settings.dailyAmount)} hari jimpitan.</p>
              </div>
              <button onClick={handleBulkPay} className="w-full bg-indigo-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-lg active:scale-95 transition-all">Proses Pelunasan</button>
           </div>
        </div>
      )}

      {activeTab === 'Riwayat' && (
        <div className="space-y-4 animate-page-enter">
           {logs.length === 0 ? (
             <div className="py-20 text-center bg-white rounded-[44px] border border-slate-50">
               <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Belum ada riwayat tercatat</p>
             </div>
           ) : (
             logs.map(log => (
               <div key={log.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex justify-between items-center">
                  <div>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(log.date).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
                     <h4 className="font-black text-slate-800 mt-1">{log.collectedResidentIds.length + log.autoPaidResidentIds.length} Warga Terkumpul</h4>
                  </div>
                  <div className="text-right">
                     <p className="text-lg font-black text-emerald-600">Rp {log.totalCashReceived.toLocaleString()}</p>
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Total Kas Masuk</p>
                  </div>
               </div>
             ))
           )}
        </div>
      )}

      {activeTab === 'Admin' && (
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm space-y-8 animate-page-enter">
           <div className="space-y-4">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Pengaturan Iuran</h3>
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nominal Per Hari (Rp)</label>
                 <input type="number" className="w-full bg-slate-100 rounded-2xl px-6 py-4 outline-none font-black text-lg" value={settings.dailyAmount} onChange={e => setSettings({...settings, dailyAmount: Number(e.target.value)})} />
              </div>
           </div>

           <div className="space-y-4 border-t border-slate-50 pt-8">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Kelola Warga Jimpitan</h3>
              <div className="grid grid-cols-2 gap-3">
                 <input type="text" placeholder="Nama" className="bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold" value={newName} onChange={e => setNewName(e.target.value)} />
                 <input type="text" placeholder="No. Rumah" className="bg-slate-100 border-none rounded-xl px-4 py-3 text-sm font-bold" value={newHouse} onChange={e => setNewHouse(e.target.value)} />
              </div>
              <button onClick={() => { if(newName && newHouse) { setJimpitanResidents([...jimpitanResidents, { id: Date.now().toString(), name: newName, houseNumber: newHouse }]); setNewName(''); setNewHouse(''); } }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">+ Daftarkan Warga</button>
           </div>
           
           <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {jimpitanResidents.map(r => (
                <div key={r.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                  <div>
                    <p className="text-sm font-black text-slate-800">{r.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Rumah: {r.houseNumber}</p>
                  </div>
                  <button onClick={() => setJimpitanResidents(jimpitanResidents.filter(x => x.id !== r.id))} className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                  </button>
                </div>
              ))}
           </div>
        </div>
      )}
    </div>
  );
};

export default JimpitanPage;
