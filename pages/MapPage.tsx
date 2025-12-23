
import React, { useState } from 'react';

interface MapPoint {
  id: string;
  name: string;
  type: 'POS' | 'BALAI' | 'RAWAN' | 'UMUM';
  description: string;
  coords: { lat: number, lng: number };
  status?: string;
}

const MapPage: React.FC = () => {
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const points: MapPoint[] = [
    { 
      id: '1', 
      name: 'Pos Keamanan Utama', 
      type: 'POS', 
      description: 'Pusat komando ronda malam dan pemantauan CCTV gerbang masuk.',
      coords: { lat: -7.7885334, lng: 111.9833814 },
      status: 'Aktif 24 Jam'
    },
    { 
      id: '2', 
      name: 'Balai Warga RT 05', 
      type: 'BALAI', 
      description: 'Tempat musyawarah warga, posyandu, dan kegiatan sosial.',
      coords: { lat: -7.7890, lng: 111.9840 },
      status: 'Fasilitas Umum'
    },
    { 
      id: '3', 
      name: 'Area Rawan Genangan', 
      type: 'RAWAN', 
      description: 'Titik terendah yang sering tergenang saat curah hujan sangat tinggi (Drainase Blok B).',
      coords: { lat: -7.7870, lng: 111.9820 },
      status: 'Siaga 2 (Kuning)'
    },
    { 
      id: '4', 
      name: 'Masjid Al-Hidayah', 
      type: 'UMUM', 
      description: 'Pusat kegiatan religi dan titik kumpul evakuasi sementara.',
      coords: { lat: -7.7895, lng: 111.9835 },
      status: 'Fasilitas Ibadah'
    }
  ];

  const mapUrl = `https://www.google.com/maps?q=${selectedPoint?.coords.lat || points[0].coords.lat},${selectedPoint?.coords.lng || points[0].coords.lng}&z=18&output=embed`;

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-sky-600 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Peta Lingkungan</h2>
            <p className="text-sm opacity-80 font-medium mt-2">Panduan navigasi digital dan pemetaan aset RT.</p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Map Embed Container */}
      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden h-[350px] relative group">
        <iframe
          src={mapUrl}
          className="w-full h-full border-none"
          title="Google Map"
          loading="lazy"
        ></iframe>
        <div className="absolute top-4 left-4 right-4 flex justify-center pointer-events-none">
           <div className="bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest text-sky-600 border border-sky-100">
             Mode Navigasi Aktif
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] px-2">Titik Penting Lingkungan</h3>
        <div className="grid grid-cols-1 gap-4">
          {points.map(point => (
            <button
              key={point.id}
              onClick={() => setSelectedPoint(point)}
              className={`bg-white border p-6 rounded-[32px] flex items-center gap-5 shadow-sm transition-all text-left group ${selectedPoint?.id === point.id ? 'ring-2 ring-sky-500 border-transparent bg-sky-50/30' : 'border-slate-50'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-110 ${
                point.type === 'POS' ? 'bg-slate-900 text-white' : 
                point.type === 'BALAI' ? 'bg-indigo-600 text-white' : 
                point.type === 'RAWAN' ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-white'
              }`}>
                {point.type === 'POS' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeWidth={2.5}/></svg>}
                {point.type === 'BALAI' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" strokeWidth={2.5}/></svg>}
                {point.type === 'RAWAN' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeWidth={2.5}/></svg>}
                {point.type === 'UMUM' && <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" strokeWidth={2.5}/></svg>}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{point.name}</h4>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                    point.type === 'RAWAN' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {point.status}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">{point.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 p-8 rounded-[40px] text-white space-y-4">
        <h4 className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
          <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>
          Informasi Mitigasi
        </h4>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Peta ini merupakan inisiatif digital untuk memetakan jalur evakuasi dan titik kumpul warga. Dalam keadaan darurat bencana, harap mengikuti penanda <span className="text-rose-500 font-black">Merah</span> dan berkumpul di titik <span className="text-emerald-500 font-black">Hijau</span> terdekat.
        </p>
      </div>
    </div>
  );
};

export default MapPage;
