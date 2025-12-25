
import React, { useState, useRef } from 'react';

interface MapPoint {
  id: string;
  name: string;
  type: 'OFFICE' | 'HOUSE' | 'SECURITY' | 'RELIGIOUS' | 'STORAGE' | 'CCTV';
  description: string;
  coords: { lat: number, lng: number };
  status?: string;
}

const MapPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  
  const points: MapPoint[] = [
    { 
      id: '1', 
      name: 'Kantor Kelurahan Gayam', 
      type: 'OFFICE', 
      description: 'Pusat administrasi pemerintahan tingkat kelurahan.',
      coords: { lat: -7.786885047398276, lng: 111.98824833384026 },
      status: 'Pusat Layanan'
    },
    { 
      id: '2', 
      name: 'Kediaman Ketua RW 05', 
      type: 'HOUSE', 
      description: 'Pusat koordinasi warga tingkat Rukun Warga.',
      coords: { lat: -7.788012209689977, lng: 111.98579587537829 },
      status: 'Koordinasi RW'
    },
    { 
      id: '3', 
      name: 'Kediaman Ketua RT 05', 
      type: 'HOUSE', 
      description: 'Pusat pelayanan administratif dan musyawarah warga RT 05.',
      coords: { lat: -7.78851696272554, lng: 111.98332821953412 },
      status: 'Koordinasi RT'
    },
    { 
      id: '4', 
      name: 'Pos Keamanan Utama', 
      type: 'SECURITY', 
      description: 'Titik kumpul petugas ronda dan pemantauan lingkungan.',
      coords: { lat: -7.788952980738058, lng: 111.98446435504853 },
      status: 'Aktif 24 Jam'
    },
    { 
      id: '5', 
      name: 'Musholla Al Hidayah', 
      type: 'RELIGIOUS', 
      description: 'Fasilitas ibadah dan kegiatan sosial keagamaan warga.',
      coords: { lat: -7.788530090031632, lng: 111.98388135042866 },
      status: 'Sarana Ibadah'
    },
    { 
      id: '6', 
      name: 'Musholla Al Ukhuwah', 
      type: 'RELIGIOUS', 
      description: 'Fasilitas ibadah dan pengajian lingkungan.',
      coords: { lat: -7.78847707079147, lng: 111.98457924582699 },
      status: 'Sarana Ibadah'
    },
    { 
      id: '7', 
      name: 'Gudang Portabel Inventaris', 
      type: 'STORAGE', 
      description: 'Pusat penyimpanan aset RT (Tenda, Kursi, & Alat Kerja Bakti).',
      coords: { lat: -7.788741057141446, lng: 111.98376338488819 },
      status: 'Aset RT 05'
    },
    { 
      id: '8', 
      name: 'Titik CCTV 1', 
      type: 'CCTV', 
      description: 'Pemantauan area pintu masuk barat.',
      coords: { lat: -7.788520617779083, lng: 111.98333172261448 },
      status: 'Online'
    },
    { 
      id: '9', 
      name: 'Titik CCTV 2', 
      type: 'CCTV', 
      description: 'Pemantauan area pertigaan blok utama.',
      coords: { lat: -7.788778704752754, lng: 111.9832399959726 },
      status: 'Online'
    },
    { 
      id: '10', 
      name: 'Titik CCTV 3 & 4', 
      type: 'CCTV', 
      description: 'Pemantauan persimpangan tengah dan area fasum.',
      coords: { lat: -7.788884345352542, lng: 111.98388372731343 },
      status: 'Dual View'
    },
    { 
      id: '11', 
      name: 'Titik CCTV 5', 
      type: 'CCTV', 
      description: 'Pemantauan area Pos Keamanan Utama.',
      coords: { lat: -7.788952980738058, lng: 111.98446435504853 },
      status: 'Online'
    },
    { 
      id: '12', 
      name: 'Titik CCTV 6', 
      type: 'CCTV', 
      description: 'Pemantauan area pintu masuk timur.',
      coords: { lat: -7.788777772860536, lng: 111.98456081170188 },
      status: 'Online'
    }
  ];

  const [selectedPoint, setSelectedPoint] = useState<MapPoint>(points[0]);

  const handlePointSelect = (point: MapPoint) => {
    setSelectedPoint(point);
    // Auto-scroll ke area peta dengan offset halus
    mapContainerRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start' 
    });
  };

  const mapUrl = `https://www.google.com/maps?q=${selectedPoint.coords.lat},${selectedPoint.coords.lng}&z=19&output=embed`;

  const getIconConfig = (type: MapPoint['type']) => {
    switch (type) {
      case 'OFFICE': return { bg: 'bg-indigo-600', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' };
      case 'HOUSE': return { bg: 'bg-emerald-600', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' };
      case 'SECURITY': return { bg: 'bg-slate-900', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' };
      case 'RELIGIOUS': return { bg: 'bg-sky-600', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' };
      case 'STORAGE': return { bg: 'bg-amber-600', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' };
      case 'CCTV': return { bg: 'bg-rose-600', icon: 'M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z' };
    }
  };

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-sky-700 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Peta Wilayah</h2>
            <p className="text-sm opacity-80 font-medium mt-2">Pemetaan aset RT 05 RW 05 Kelurahan Gayam.</p>
          </div>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-[80px]"></div>
      </div>

      {/* Map Embed Container dengan Ref untuk Auto-Scroll */}
      <div 
        ref={mapContainerRef}
        className="bg-white rounded-[48px] border-8 border-white shadow-2xl overflow-hidden h-[400px] relative group scroll-mt-6"
      >
        <iframe
          src={mapUrl}
          className="w-full h-full border-none"
          title="Google Map"
          loading="lazy"
        ></iframe>
        <div className="absolute top-6 left-6 right-6 flex justify-center pointer-events-none">
           <div className="bg-white/95 backdrop-blur-xl px-5 py-2.5 rounded-full shadow-2xl text-[10px] font-black uppercase tracking-widest text-sky-700 border border-sky-100 flex items-center gap-2">
             <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
             {selectedPoint.name}
           </div>
        </div>
        
        {/* Quick Open External Map */}
        <button 
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${selectedPoint.coords.lat},${selectedPoint.coords.lng}`, '_blank')}
          className="absolute bottom-6 right-6 bg-white p-4 rounded-2xl shadow-xl text-sky-600 hover:bg-sky-50 active:scale-90 transition-all border border-slate-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" strokeWidth={2.5}/></svg>
        </button>
      </div>

      <div className="space-y-4">
        <div className="px-2 flex items-center justify-between">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Navigasi Titik Lokasi</h3>
           <span className="text-[9px] text-slate-300 font-bold uppercase">{points.length} Titik Terdeteksi</span>
        </div>
        
        <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
          {points.map(point => {
            const config = getIconConfig(point.type);
            const isActive = selectedPoint.id === point.id;
            
            return (
              <button
                key={point.id}
                onClick={() => handlePointSelect(point)}
                className={`bg-white border p-6 rounded-[32px] flex items-center gap-5 shadow-sm transition-all text-left group ${isActive ? 'ring-2 ring-sky-500 border-transparent bg-sky-50/30' : 'border-slate-50'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg transition-transform group-hover:scale-110 ${config.bg} text-white`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={config.icon} />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight truncate">{point.name}</h4>
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase shrink-0 ${
                      point.type === 'CCTV' ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {point.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-1 line-clamp-2">{point.description}</p>
                  {isActive && (
                    <div className="mt-3 flex items-center gap-2 text-[9px] font-black text-sky-600 uppercase tracking-widest">
                       <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" strokeWidth={2}/></svg>
                       Fokus Lokasi Aktif
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-950 p-10 rounded-[56px] text-white space-y-6">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 bg-sky-500/20 rounded-2xl flex items-center justify-center text-sky-400">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2}/></svg>
           </div>
           <h4 className="text-sm font-black uppercase tracking-widest leading-none">Manajemen Aset Digital</h4>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Sistem pemetaan ini dirancang untuk memudahkan warga dalam mencari fasilitas umum dan bagi Pengurus RT dalam memantau persebaran infrastruktur keamanan. 
          <br/><br/>
          Catatan: <span className="text-white font-bold italic">Admin memiliki wewenang untuk memperbarui atau menggeser titik koordinat jika terdapat perubahan lokasi fisik di lapangan.</span>
        </p>
      </div>
    </div>
  );
};

export default MapPage;
