
import React, { useState, useEffect } from 'react';
import { AttendanceEntry, Resident, MeetingMinute } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import SignaturePad from './SignaturePad';

interface AttendanceManagerProps {
  meeting: MeetingMinute;
  onClose: () => void;
}

const AttendanceManager: React.FC<AttendanceManagerProps> = ({ meeting, onClose }) => {
  const [attendances, setAttendances] = useState<AttendanceEntry[]>(() => 
    storage.get(STORAGE_KEYS.ATTENDANCE, [])
  );
  const [residents] = useState<Resident[]>(() => 
    storage.get(STORAGE_KEYS.RESIDENTS, [])
  );
  const [showSignPad, setShowSignPad] = useState(false);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [tempSignature, setTempSignature] = useState<string | null>(null);

  const meetingAttendances = attendances.filter(a => a.meetingId === meeting.id);

  const handleSaveAttendance = () => {
    if (!selectedResidentId || !tempSignature) return;
    
    const resident = residents.find(r => r.id === selectedResidentId);
    if (!resident) return;

    // Check if already present
    if (meetingAttendances.some(a => a.residentId === selectedResidentId)) {
      alert('Warga ini sudah terdaftar kehadirannya.');
      return;
    }

    const newEntry: AttendanceEntry = {
      id: Date.now().toString(),
      meetingId: meeting.id,
      residentId: selectedResidentId,
      residentName: resident.name,
      timestamp: new Date().toISOString(),
      signature: tempSignature
    };

    const updated = [...attendances, newEntry];
    setAttendances(updated);
    storage.set(STORAGE_KEYS.ATTENDANCE, updated);
    
    // Reset
    setShowSignPad(false);
    setSelectedResidentId('');
    setTempSignature(null);
  };

  const handleDeleteAttendance = (id: string) => {
    if (window.confirm('Hapus data kehadiran ini?')) {
      const updated = attendances.filter(a => a.id !== id);
      setAttendances(updated);
      storage.set(STORAGE_KEYS.ATTENDANCE, updated);
    }
  };

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-blue-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">Daftar Hadir</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">{meeting.title}</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        {!showSignPad ? (
          <button 
            onClick={() => setShowSignPad(true)}
            className="w-full bg-blue-600 text-white py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Absensi Baru (Tanda Tangan)
          </button>
        ) : (
          <div className="bg-slate-50 p-8 rounded-[40px] border border-slate-200 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Pilih Nama Warga</label>
              <select 
                className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-white appearance-none"
                value={selectedResidentId}
                onChange={(e) => setSelectedResidentId(e.target.value)}
              >
                <option value="">-- Pilih Warga --</option>
                {residents.filter(r => r.status === 'Aktif').map(r => (
                  <option key={r.id} value={r.id}>{r.name} ({r.houseNumber})</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Goreskan Tanda Tangan</label>
              <SignaturePad onSave={setTempSignature} onClear={() => setTempSignature(null)} />
            </div>

            <div className="flex gap-4 pt-4">
               <button 
                 onClick={() => { setShowSignPad(false); setSelectedResidentId(''); setTempSignature(null); }}
                 className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest"
               >
                 Batal
               </button>
               <button 
                 onClick={handleSaveAttendance}
                 disabled={!selectedResidentId || !tempSignature}
                 className="flex-2 bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg disabled:opacity-30"
               >
                 Simpan Kehadiran
               </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Warga Yang Hadir ({meetingAttendances.length})</h4>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {meetingAttendances.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-[32px]">
                 <p className="text-slate-300 text-xs font-black uppercase tracking-widest">Belum ada data hadir</p>
              </div>
            ) : (
              meetingAttendances.map(entry => (
                <div key={entry.id} className="bg-white p-5 rounded-[28px] border border-slate-100 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-12 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-slate-100">
                      <img src={entry.signature} alt="Tanda Tangan" className="max-w-full max-h-full object-contain mix-blend-multiply" />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-sm">{entry.residentName}</h5>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(entry.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteAttendance(entry.id)} className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-all">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceManager;
