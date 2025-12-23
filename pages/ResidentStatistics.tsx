
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { Resident } from '../types';

const ResidentStatistics: React.FC = () => {
  const residents = storage.get<Resident[]>(STORAGE_KEYS.RESIDENTS, []);

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Age Groups Logic
  const ageGroups = [
    { name: 'Balita (0-5)', count: 0 },
    { name: 'Anak (6-12)', count: 0 },
    { name: 'Remaja (13-17)', count: 0 },
    { name: 'Dewasa (18-50)', count: 0 },
    { name: 'Lansia (51+)', count: 0 },
  ];

  residents.forEach(r => {
    const age = calculateAge(r.dateOfBirth);
    if (age <= 5) ageGroups[0].count++;
    else if (age <= 12) ageGroups[1].count++;
    else if (age <= 17) ageGroups[2].count++;
    else if (age <= 50) ageGroups[3].count++;
    else ageGroups[4].count++;
  });

  // Gender Data
  const maleCount = residents.filter(r => r.gender === 'Laki-laki').length;
  const femaleCount = residents.filter(r => r.gender === 'Perempuan').length;
  const genderData = [
    { name: 'Laki-laki', value: maleCount, color: '#0077b6' },
    { name: 'Perempuan', value: femaleCount, color: '#e91e63' },
  ];

  // KK Count
  const kkCount = new Set(residents.map(r => r.kkNumber)).size;

  return (
    <div className="space-y-8 px-5 py-6 pb-24">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Laporan Demografi</h1>
        <p className="text-sm text-slate-500 font-medium">Statistik lengkap kependudukan RT secara real-time.</p>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-[40px] text-white shadow-xl shadow-blue-500/20">
          <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Total Penduduk</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black tracking-tight">{residents.length}</h2>
            <span className="text-sm font-bold opacity-80">Jiwa</span>
          </div>
          <div className="mt-6 flex items-center gap-2 text-[11px] font-bold bg-white/10 w-fit px-4 py-1.5 rounded-full">
             <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
             Terdaftar Aktif
          </div>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Kepala Keluarga</p>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black text-slate-800 tracking-tight">{kkCount}</h2>
            <span className="text-sm font-bold text-slate-400">KK</span>
          </div>
          <p className="mt-4 text-[11px] text-slate-400 font-medium">Berdasarkan nomor kartu keluarga unik.</p>
        </div>

        <div className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Rasio Gender</p>
          <div className="flex items-center gap-6 pt-2">
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-blue-600">{maleCount}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">L</span>
             </div>
             <div className="w-[1px] h-10 bg-slate-100"></div>
             <div className="flex flex-col items-center">
                <span className="text-2xl font-black text-pink-600">{femaleCount}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase">P</span>
             </div>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full mt-6 overflow-hidden flex">
             <div style={{ width: `${(maleCount/residents.length)*100}%` }} className="bg-blue-600 h-full"></div>
             <div style={{ width: `${(femaleCount/residents.length)*100}%` }} className="bg-pink-600 h-full"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Age Groups Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <div className="w-2 h-6 bg-[#0077b6] rounded-full"></div>
            Distribusi Kelompok Usia
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ageGroups}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" fill="#0077b6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gender Distribution Chart */}
        <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
          <h3 className="text-lg font-black text-slate-800 mb-8 flex items-center gap-2">
            <div className="w-2 h-6 bg-[#e91e63] rounded-full"></div>
            Persentase Jenis Kelamin
          </h3>
          <div className="h-[300px] w-full flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  iconType="circle"
                  formatter={(value) => <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Data Table for Stats */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
           <h3 className="text-xl font-black text-slate-800">Tabel Rangkuman</h3>
           <span className="text-[10px] font-black text-[#0077b6] bg-blue-50 px-3 py-1 rounded-full uppercase tracking-widest">Update Otomatis</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5">Kategori</th>
                <th className="px-8 py-5">Laki-laki</th>
                <th className="px-8 py-5">Perempuan</th>
                <th className="px-8 py-5">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ageGroups.map((group, idx) => {
                const groupMales = residents.filter(r => {
                  const age = calculateAge(r.dateOfBirth);
                  if (idx === 0) return age <= 5 && r.gender === 'Laki-laki';
                  if (idx === 1) return age > 5 && age <= 12 && r.gender === 'Laki-laki';
                  if (idx === 2) return age > 12 && age <= 17 && r.gender === 'Laki-laki';
                  if (idx === 3) return age > 17 && age <= 50 && r.gender === 'Laki-laki';
                  return age > 50 && r.gender === 'Laki-laki';
                }).length;
                const groupFemales = group.count - groupMales;

                return (
                  <tr key={group.name} className="hover:bg-slate-50/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-slate-700">{group.name}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{groupMales}</td>
                    <td className="px-8 py-5 text-slate-500 font-medium">{groupFemales}</td>
                    <td className="px-8 py-5 font-black text-slate-800">{group.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ResidentStatistics;
