
import React, { useState, useEffect } from 'react';
import { EmergencyContact, UserRole, AppSettings } from '../types.ts';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import EmergencyEditor from '../components/EmergencyEditor.tsx';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

const MOCK_EMERGENCY: EmergencyContact[] = [
  { id: '1', label: 'Polres Kediri Kota (SPKT)', phone: '0354683838', provider: 'Keamanan' },
  { id: '2', label: 'Polsek Mojoroto', phone: '0354771123', provider: 'Keamanan' },
  { id: '3', label: 'PMI Kota Kediri', phone: '0354682527', provider: 'Kesehatan' },
  { id: '4', label: 'RSUD Gambiran Kediri', phone: '0354681033', provider: 'Kesehatan' },
  { id: '5', label: 'RS Bhayangkara Kediri', phone: '0354688307', provider: 'Kesehatan' },
  { id: '6', label: 'BPBD Kota Kediri', phone: '03542891113', provider: 'Lainnya' },
  { id: '7', label: 'Pemadam Kebakaran', phone: '113', provider: 'Kebakaran' },
  { id: '8', label: 'PLN Kediri', phone: '123', provider: 'PLN/PAM' },
];

const EmergencyPage: React.FC<{ role: UserRole }> = ({ role }) => {
  const [contacts, setContacts] = useState<EmergencyContact[]>(() => 
    storage.get(STORAGE_KEYS.EMERGENCY, MOCK_EMERGENCY)
  );
  const [settings, setSettings] = useState<AppSettings>(() => storage.get<AppSettings>(STORAGE_KEYS.SETTINGS, {
    chairmanPhone: '08123456789',
    chairmanName: 'Ketua RT 05',
    location: 'Kelurahan Gayam, Kediri',
    panicButtonUrl: 'https://panicbutton.gayammojoroto.my.id'
  } as AppSettings));
  
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingChairman, setIsEditingChairman] = useState(false);
  const [selectedContact, setSelectedContact] = useState<EmergencyContact | undefined>(undefined);

  useEffect(() => {
    const unsubContacts = onSnapshot(doc(db, "app_data", STORAGE_KEYS.EMERGENCY), (docSnap) => {
      if (docSnap.exists()) {
        setContacts(docSnap.data().data || []);
      }
    });
    const unsubSettings = onSnapshot(doc(db, "app_data", STORAGE_KEYS.SETTINGS), (docSnap) => {
      if (docSnap.exists()) {
        setSettings(docSnap.data().data || {});
      }
    });
    return () => { unsubContacts(); unsubSettings(); };
  }, []);

  const handleSave = async (data: Partial<EmergencyContact>) => {
    if (role !== 'ADMIN') return;
    let updated: EmergencyContact[];
    if (selectedContact) {
      updated = contacts.map(c => c.id === selectedContact.id ? { ...c, ...data as EmergencyContact } : c);
    } else {
      const newEntry: EmergencyContact = {
        id: Date.now().toString(),
        label: '',
        phone: '',
        provider: 'Keamanan',
        ...data as EmergencyContact
      };
      updated = [newEntry, ...contacts];
    }
    const saved = await storage.set(STORAGE_KEYS.EMERGENCY, updated);
    if (saved) {
      setIsEditing(false);
      setSelectedContact(undefined);
    }
  };

  const handleSaveChairmanPhone = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newPhone = formData.get('phone') as string;
    const newName = formData.get('name') as string;
    
    const updatedSettings = { ...settings, chairmanPhone: newPhone, chairmanName: newName };
    const saved = await storage.set(STORAGE_KEYS.SETTINGS, updatedSettings);
    if (saved) {
      setIsEditingChairman(false);
    }
  };

  const handleDeleteContact = async (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm("Hapus kontak darurat ini?")) {
      const updated = contacts.filter(c => c.id !== id);
      await storage.set(STORAGE_KEYS.EMERGENCY, updated);
    }
  };

  const handleCall = (num: string) => {
    if (!num) return;
    window.location.href = `tel:${num.replace(/[^0-9]/g, '')}`;
  };

  const handleWhatsApp = (num: string) => {
    if (!num) return;
    let cleanNum = num.replace(/[^0-9]/g, '');
    if (cleanNum.startsWith('0')) {
      cleanNum = '62' + cleanNum.slice(1);
    }
    window.open(`https://wa.me/${cleanNum}`, '_blank');
  };

  const handleOpenPanicButton = () => {
    const url = settings.panicButtonUrl || 'https://panicbutton.gayammojoroto.my.id';
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
  };

  if (isEditing) {
    return (
      <div className="px-5 py-6">
        <EmergencyEditor 
          onSave={handleSave} 
          onCancel={() => { setIsEditing(false); setSelectedContact(undefined); }} 
          initialData={selectedContact} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 px-5 py-6 pb-32 animate-page-enter">
      {/* Header SOS */}
      <div className="bg-red-600 rounded-[44px] p-10 text-white shadow-2xl relative overflow-hidden border-4 border-red-500/20">
        <div className="relative z-10 space-y-6 text-center">
          <div className="w-20 h-20 bg-white/20 rounded-[32px] flex items-center justify-center backdrop-blur-md shadow-inner mx-auto mb-6">
             <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight leading-none">Pusat Darurat</h2>
            <p className="text-sm opacity-80 font-bold mt-2 uppercase tracking-widest leading-relaxed">Pilih tindakan cepat untuk bantuan</p>
          </div>
          
          <button 
            onClick={handleOpenPanicButton}
            className="w-full bg-white text-red-600 py-6 rounded-[32px] font-black text-sm uppercase tracking-widest shadow-[0_15px_40px_rgba(255,255,255,0.3)] active:scale-95 transition-all flex items-center justify-center gap-4 animate-sos"
          >
             <div className="w-3 h-3 bg-red-600 rounded-full animate-ping"></div>
             Buka Aplikasi Panic Button
          </button>
        </div>
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/10 rounded-full blur-[100px]"></div>
      </div>

      {/* KARTU UTAMA: KETUA RT */}
      <div className="bg-[#0077b6] p-8 rounded-[44px] shadow-2xl text-white flex flex-col gap-6 border-4 border-blue-500/20 group relative overflow-hidden">
         <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 bg-white/20 rounded-[28px] flex items-center justify-center text-white shrink-0 backdrop-blur-md shadow-inner relative">
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
               <div className="absolute -top-2 -right-2 bg-emerald-400 w-6 h-6 rounded-full flex items-center justify-center border-4 border-[#0077b6]">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
               </div>
            </div>
            <div className="flex-1 min-w-0">
               <div className="flex justify-between items-start">
                  <h4 className="font-black text-xl uppercase tracking-tight truncate">{settings.chairmanName || 'Ketua RT'}</h4>
                  {role === 'ADMIN' && (
                    <button 
                      onClick={() => setIsEditingChairman(true)}
                      className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5}/></svg>
                    </button>
                  )}
               </div>
               <p className="text-3xl font-black leading-none mt-1 tracking-tighter">{settings.chairmanPhone}</p>
               <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mt-3">Akses Komunikasi Langsung</p>
            </div>
         </div>
         <div className="flex gap-3 relative z-10">
            <button onClick={() => handleWhatsApp(settings.chairmanPhone)} className="flex-1 bg-white text-[#0077b6] py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all font-black text-xs uppercase tracking-widest">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
               WhatsApp
            </button>
            <button onClick={() => handleCall(settings.chairmanPhone)} className="w-16 h-16 bg-blue-500/20 text-white rounded-3xl flex items-center justify-center active:scale-90 transition-all border-2 border-white/20">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </button>
         </div>
         <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/10 rounded-full blur-3xl opacity-50"></div>
      </div>

      {/* FORM EDIT KETUA RT (MODAL) */}
      {isEditingChairman && (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
           <div className="bg-white w-full max-w-md rounded-[48px] shadow-2xl overflow-hidden animate-page-enter">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Edit Kontak Pengurus</h3>
                 <button onClick={() => setIsEditingChairman(false)} className="w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-slate-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
                 </button>
              </div>
              <form onSubmit={handleSaveChairmanPhone} className="p-10 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nama Pengurus Utama</label>
                    <input name="name" type="text" defaultValue={settings.chairmanName} className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold shadow-inner" required />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nomor WhatsApp / HP</label>
                    <input name="phone" type="tel" defaultValue={settings.chairmanPhone} className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-xl shadow-inner" required />
                 </div>
                 <button type="submit" className="w-full bg-[#0077b6] text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Simpan Perubahan</button>
              </form>
           </div>
        </div>
      )}

      {/* LAYANAN PUBLIK KOTA KEDIRI */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
             <div className="w-1 h-3 bg-red-500 rounded-full"></div>
             Layanan Publik & Kediri
           </h3>
           {role === 'ADMIN' && (
             <button onClick={() => { setSelectedContact(undefined); setIsEditing(true); }} className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest">+ Tambah</button>
           )}
        </div>
        <div className="grid grid-cols-1 gap-3">
          {contacts.map(contact => (
            <div key={contact.id} className="bg-white border border-slate-100 px-8 py-5 rounded-[32px] flex items-center justify-between group hover:border-red-100 transition-all shadow-sm">
               <div className="flex items-center gap-5">
                  <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center shadow-sm text-xl border border-slate-100 group-hover:bg-red-50 transition-colors">
                    {contact.provider === 'Keamanan' ? '🚓' : contact.provider === 'Kesehatan' ? '🏥' : contact.provider === 'Kebakaran' ? '🔥' : contact.provider === 'PLN/PAM' ? '⚡' : '☎️'}
                  </div>
                  <div>
                     <h4 className="font-black text-slate-700 text-[10px] uppercase tracking-tight leading-none opacity-60">{contact.label}</h4>
                     <p className="text-lg font-black text-slate-900 leading-none mt-1 tracking-tighter">{contact.phone}</p>
                  </div>
               </div>
               <div className="flex gap-2">
                  {role === 'ADMIN' && (
                    <div className="flex gap-1">
                      <button onClick={() => { setSelectedContact(contact); setIsEditing(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5}/></svg></button>
                      <button onClick={() => handleDeleteContact(contact.id)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg></button>
                    </div>
                  )}
                  <button onClick={() => handleCall(contact.phone)} className="p-3 bg-white text-red-600 rounded-2xl shadow-md active:scale-90 border border-slate-100"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg></button>
               </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-900 p-10 rounded-[56px] text-center space-y-6">
         <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] leading-relaxed">
           Seluruh data darurat di atas diverifikasi secara berkala oleh Admin RT 05 Gayam.<br/>Gunakan layanan dengan bijak dan penuh tanggung jawab.
         </p>
      </div>
    </div>
  );
};

export default EmergencyPage;
