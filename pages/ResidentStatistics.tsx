
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { Resident, AppSettings } from '../types';

const ResidentStatistics: React.FC = () => {
  const residents = storage.get<Resident[]>(STORAGE_KEYS.RESIDENTS, []) || [];
  const [settings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    rtRw: 'RT 05 RW 05',
    location: 'Kelurahan Gayam, Kediri'
  }));

  const calculateAge = (dob: string) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) { age--; }
    return isNaN(age) ? 0 : age;
  };

  const handlePrint = () => {
    window.print();
  };

  const ageGroups = [
    { name: 'Balita (0-5)', count: 0 },
    { name: 'Anak (6-12)', count: 0 },
    { name: 'Remaja (13-17)', count: 0 },
    { name: 'Dewasa (18-50)', count: 0 },
    { name: 'Lansia (51+)', count: 0 },
  ];

  (residents || []).forEach(r => {
    if (!r || !r.dateOfBirth) return;
    const age = calculateAge(r.dateOfBirth);
    if (age <= 5) ageGroups[0].count++;
    else if (age <= 12) ageGroups[1].count++;
    else if (age <= 17) ageGroups[2].count++;
    else if (age <= 50) ageGroups[3].count++;
    else ageGroups[4].count++;
  });

  const maleCount = (residents || []).filter(r => r && r.gender === 'Laki-laki').length;
  const femaleCount = (residents || []).filter(r => r && r.gender === 'Perempuan').length;
  const genderData = [ { name: 'Laki-laki', value: maleCount, color: '#0077b6' }, { name: 'Perempuan', value: femaleCount, color: '#e91e63' } ];
  const kkCount = new Set((residents || []).filter(r => r && r.kkNumber).map(r => r.kkNumber)).size;

  return (
    <div className="space-y-8 px-5 py-6 pb-24 animate-page-enter">
      {/* Print Header */}
      <div className="print-header">
        <h1 className="text-2xl font-black uppercase">LAPORAN DEMOGRAFI WILAYAH {settings.rtRw}</h1>
        <p className="text-sm font-bold">{settings.location}</p>
        <p className="text-[10px] mt-1 italic">Statistik Otomatis - Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
      </div>

      <div className="flex items-center justify-between no-print">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase leading-none">Statistik</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-2">Profil Demografi Wilayah</p>
        </div>
        <button onClick={handlePrint} className="bg-slate-900 text-white p-5 rounded-[28px] shadow-xl active:scale-95 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Penduduk</p>
          <div className="flex items-baseline gap-2"><h2 className="text-5xl font-black tracking-tight">{(residents || []).length}</h2><span className="text-sm font-bold opacity-80">Jiwa</span></div>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kepala Keluarga</p>
          <div className="flex items-baseline gap-2"><h2 className="text-5xl font-black text-slate-800 tracking-tight">{kkCount}</h2><span className="text-sm font-bold text-slate-400">KK</span></div>
        </div>
        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rasio Gender</p>
          <div className="flex items-center gap-6 pt-2">
             <div className="flex flex-col items-center"><span className="text-2xl font-black text-blue-600">{maleCount}</span><span className="text-[10px] font-black text-slate-400 uppercase">L</span></div>
             <div className="w-[1px] h-10 bg-slate-100"></div>
             <div className="flex flex-col items-center"><span className="text-2xl font-black text-pink-600">{femaleCount}</span><span className="text-[10px] font-black text-slate-400 uppercase">P</span></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">Distribusi Usia</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroups}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="count" fill="#0077b6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">Persentase Gender</h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="value">
                  {genderData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentStatistics;
