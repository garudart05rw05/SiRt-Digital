
import React, { useState, useEffect } from 'react';
import { GuestEntry, UserRole, AppSettings } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import GuestbookEditor from '../components/GuestbookEditor';
import QRScanner from '../components/QRScanner';

const MOCK_GUESTS: GuestEntry[] = [];

const GuestbookPage: React.FC<{ role?: UserRole }> = ({ role = 'WARGA' }) => {
  const [guests, setGuests] = useState<GuestEntry[]>(() => 
    storage.get(STORAGE_KEYS.GUESTBOOK, MOCK_GUESTS)
  );
  const [settings] = useState<AppSettings>(() => storage.get(STORAGE_KEYS.SETTINGS, {}));
  const [activeView, setActiveView] = useState<'list' | 'qr'>('list');
  const [isAdding, setIsAdding] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    storage.set(STORAGE_KEYS.GUESTBOOK, guests);
  }, [guests]);

  const handleSave = (data: Partial<GuestEntry>) => {
    const newEntry: GuestEntry = {
      id: Date.now().toString(),
      name: '',
      phone: '',
      purpose: '',
      destinationHouse: '',
      checkIn: new Date().toISOString(),
      checkOut: null,
      guestType: 'Lainnya',
      ...data as GuestEntry
    };
    setGuests([newEntry, ...guests]);
    setIsAdding(false);
  };

  const handleCheckOut = (id: string) => {
    setGuests(guests.map(g => 
      g.id === id ? { ...g, checkOut: new Date().toISOString() } : g
    ));
  };

  const filteredGuests = guests.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.destinationHouse.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isAdding) return <div className="px-5 py-6"><GuestbookEditor onSave={handleSave} onCancel={() => setIsAdding(false)} /></div>;
  if (isScanning) return <QRScanner onScan={() => { setIsScanning(false); setIsAdding(true); }} onCancel={() => setIsScanning(false)} />;

  return (
    <div className="space-y-6 px-5 py-6 pb-24 animate-page-enter">
      <div className="bg-amber-500 rounded-[44px] p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Buku Tamu</h2>
          <p className="text-sm opacity-80 font-black mt-2 uppercase tracking-widest">Log Monitoring Lingkungan</p>
          <div className="flex gap-2 bg-black/10 p-1.5 rounded-2xl">
             <button onClick={() => setActiveView('list')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'list' ? 'bg-white text-amber-600 shadow-md' : 'text-white/60'}`}>Log</button>
             <button onClick={() => setActiveView('qr')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'qr' ? 'bg-white text-amber-600 shadow-md' : 'text-white/60'}`}>QR Code</button>
          </div>
        </div>
      </div>

      {activeView === 'list' ? (
        <div className="space-y-6">
          <div className="flex gap-3">
             <button onClick={() => setIsScanning(true)} className="flex-1 bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl">Scan QR</button>
             <button onClick={() => setIsAdding(true)} className="flex-1 bg-amber-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl">Manual</button>
          </div>
          {filteredGuests.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada kunjungan hari ini</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGuests.map(guest => (
                <div key={guest.id} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm flex items-center justify-between">
                   <div>
                      <h4 className="font-black text-slate-800 text-xl">{guest.name}</h4>
                      <p className="text-sm font-bold text-slate-500">Ke: {guest.destinationHouse}</p>
                   </div>
                   {!guest.checkOut && <button onClick={() => handleCheckOut(guest.id)} className="bg-emerald-50 text-emerald-600 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Check-out</button>}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-[44px] shadow-sm border border-slate-50">
           <p className="text-slate-300 font-black uppercase text-xs tracking-widest">QR Code belum disiapkan</p>
        </div>
      )}
    </div>
  );
};

export default GuestbookPage;
