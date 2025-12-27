
import React, { useState, useEffect } from 'react';
import { GuestEntry } from '../types';
import SignaturePad from './SignaturePad';

interface GuestbookEditorProps {
  onSave: (guest: Partial<GuestEntry>) => void;
  onCancel: () => void;
}

const GuestbookEditor: React.FC<GuestbookEditorProps> = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState<Partial<GuestEntry>>({
    idType: 'KTP',
    idNumber: '',
    name: '',
    email: 'garudart05rw05@gmail.com', // Auto-fill Email Sistem
    phone: '',
    guestCount: '1',
    institution: '',
    addressType: 'Kota',
    address: { rt: '', rw: '', kelDesa: '', kec: '', cityRegency: '' },
    visitDays: '1',
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
    duration: '1 jam',
    hostName: '',
    purpose: 'Silaturahmi',
    vehicleType: 'roda dua',
    vehicleColor: '',
    vehicleBrand: '',
    vehiclePlate: '',
    signature: '',
    status: 'Proses',
    checkIn: new Date().toISOString(),
    checkOut: null
  });

  const [activeStep, setActiveStep] = useState(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Clear error when user changes any data
  useEffect(() => {
    if (errorMsg) setErrorMsg(null);
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        if (!formData.idNumber || !formData.name || !formData.phone) {
          setErrorMsg("Mohon lengkapi No. Identitas, Nama Lengkap, dan No. HP Anda.");
          return false;
        }
        return true;
      case 2:
        const addr = formData.address;
        if (!addr?.rt || !addr?.rw || !addr?.kelDesa || !addr?.kec || !addr?.cityRegency) {
          setErrorMsg("Alamat asal wajib diisi lengkap (RT, RW, Kelurahan, Kecamatan, Kota).");
          return false;
        }
        return true;
      case 3:
        if (!formData.hostName || !formData.purpose || !formData.startDate || !formData.startTime) {
          setErrorMsg("Mohon lengkapi Detail Kunjungan dan Nama Warga yang dituju.");
          return false;
        }
        return true;
      case 4:
        if (!formData.vehicleBrand || !formData.vehicleColor || !formData.vehiclePlate) {
          setErrorMsg("Data kendaraan (Merek, Warna, No. Plat) wajib diisi untuk prosedur keamanan.");
          return false;
        }
        return true;
      case 5:
        if (!formData.signature) {
          setErrorMsg("Tanda tangan elektronik wajib dibubuhkan.");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(activeStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleFinalSubmit = () => {
    if (validateStep(5)) {
      onSave(formData);
    }
  };

  return (
    <div className="bg-white rounded-[48px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter max-h-[90vh] flex flex-col">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-amber-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Registrasi Tamu</h3>
          <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mt-1">Sistem Keamanan Terintegrasi</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400 hover:text-rose-500 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar relative">
        {/* INTERNAL NOTIFICATION BANNER */}
        {errorMsg && (
          <div className="bg-rose-50 border-2 border-rose-100 p-5 rounded-[28px] flex items-center gap-4 animate-bounce">
            <div className="w-10 h-10 bg-rose-600 text-white rounded-full flex items-center justify-center shrink-0 shadow-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <p className="text-[11px] font-black uppercase tracking-widest text-rose-600 leading-tight">{errorMsg}</p>
          </div>
        )}

        {/* PROGRESS INDICATOR */}
        <div className="flex justify-between items-center px-4">
           {[1, 2, 3, 4, 5].map(step => (
             <div key={step} className="flex flex-col items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${activeStep >= step ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30' : 'bg-slate-100 text-slate-400'}`}>{step}</div>
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-tighter">Bagian {step}</span>
             </div>
           ))}
        </div>

        {/* STEP 1: IDENTITAS */}
        {activeStep === 1 && (
          <div className="space-y-6 animate-page-enter">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">I. Identitas Tamu</h4>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jenis Identitas <span className="text-rose-500 font-black">*</span></label>
                <div className="flex gap-2">
                  {['KTP', 'SIM', 'Paspor'].map(t => (
                    <button key={t} onClick={() => setFormData({...formData, idType: t as any})} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${formData.idType === t ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-white text-slate-400'}`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nomor Identitas (NIK/SIM/Paspor) <span className="text-rose-500 font-black">*</span></label>
                <input name="idNumber" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 border-2 border-transparent focus:border-amber-500 shadow-inner" value={formData.idNumber} onChange={handleChange} placeholder="Masukkan nomor identitas..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Lengkap Tamu <span className="text-rose-500 font-black">*</span></label>
                <input name="name" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 border-2 border-transparent focus:border-amber-500 shadow-inner" value={formData.name} onChange={handleChange} placeholder="Sesuai Kartu Identitas..." />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center ml-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Auto-fill Sistem)</label>
                  <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                    <div className="w-1 h-1 bg-indigo-500 rounded-full animate-pulse"></div>
                    <span className="text-[7px] font-black text-indigo-500 uppercase">System Active</span>
                  </div>
                </div>
                <input name="email" type="email" className="w-full bg-slate-900 text-indigo-400 rounded-2xl px-6 py-4 outline-none font-black border-2 border-transparent focus:border-amber-500 shadow-2xl" value={formData.email} onChange={handleChange} placeholder="nama@email.com" />
                <p className="text-[9px] text-slate-400 font-medium ml-2 italic leading-tight">Alamat ini digunakan untuk mengirimkan tiket akses digital ke smartphone Anda.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">No. HP / Whatsapp <span className="text-rose-500 font-black">*</span></label>
                   <input name="phone" type="tel" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 border-2 border-transparent focus:border-amber-500 shadow-inner" value={formData.phone} onChange={handleChange} placeholder="081..." />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jumlah Tamu <span className="text-rose-500 font-black">*</span></label>
                   <select name="guestCount" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 border-2 border-transparent focus:border-amber-500 appearance-none shadow-inner" value={formData.guestCount} onChange={handleChange}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n.toString()}>{n} Orang</option>)}
                      <option value="Lainnya">Lainnya...</option>
                   </select>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ALAMAT ASAL */}
        {activeStep === 2 && (
          <div className="space-y-6 animate-page-enter">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">II. Alamat Asal Tamu</h4>
            <div className="space-y-5">
              <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl">
                 <button onClick={() => setFormData({...formData, addressType: 'Kota'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.addressType === 'Kota' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Domisili Kota</button>
                 <button onClick={() => setFormData({...formData, addressType: 'Kabupaten'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${formData.addressType === 'Kabupaten' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>Domisili Kabupaten</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">RT <span className="text-rose-500 font-black">*</span></label>
                   <input name="address.rt" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.address?.rt} onChange={handleChange} placeholder="00" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">RW <span className="text-rose-500 font-black">*</span></label>
                   <input name="address.rw" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.address?.rw} onChange={handleChange} placeholder="00" />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">{formData.addressType === 'Kota' ? 'Kelurahan' : 'Desa'} <span className="text-rose-500 font-black">*</span></label>
                <input name="address.kelDesa" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.address?.kelDesa} onChange={handleChange} placeholder="Nama wilayah..." />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Kecamatan <span className="text-rose-500 font-black">*</span></label>
                <input name="address.kec" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.address?.kec} onChange={handleChange} placeholder="Nama kecamatan..." />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">{formData.addressType === 'Kota' ? 'Kota' : 'Kabupaten'} <span className="text-rose-500 font-black">*</span></label>
                <input name="address.cityRegency" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.address?.cityRegency} onChange={handleChange} placeholder="Nama daerah..." />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Lembaga/Instansi (Opsional)</label>
                <input name="institution" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.institution} onChange={handleChange} placeholder="Contoh: PT. Maju Jaya" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: DETAIL KUNJUNGAN */}
        {activeStep === 3 && (
          <div className="space-y-6 animate-page-enter">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">III. Detail Kunjungan</h4>
            <div className="grid grid-cols-1 gap-5">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Mulai Tanggal <span className="text-rose-500 font-black">*</span></label>
                    <input name="startDate" type="date" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.startDate} onChange={handleChange} />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jam Berkunjung <span className="text-rose-500 font-black">*</span></label>
                    <input name="startTime" type="time" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.startTime} onChange={handleChange} />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Lama (Hari) <span className="text-rose-500 font-black">*</span></label>
                    <input name="visitDays" type="number" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.visitDays} onChange={handleChange} min="1" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Durasi <span className="text-rose-500 font-black">*</span></label>
                    <select name="duration" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 appearance-none" value={formData.duration} onChange={handleChange}>
                       {['1 jam', '2 jam', '3 jam', '4 jam', 'sehari penuh', 'menginap'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nama Warga yang Dikunjungi <span className="text-rose-500 font-black">*</span></label>
                <input name="hostName" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.hostName} onChange={handleChange} placeholder="Masukkan nama kepala rumah tangga..." />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Keperluan Kunjungan <span className="text-rose-500 font-black">*</span></label>
                <select name="purpose" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 appearance-none" value={formData.purpose} onChange={handleChange}>
                   {['Silaturahmi', 'Urusan Keluarga', 'Urusan Bisnis', 'Acara', 'Lainnya'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: KENDARAAN */}
        {activeStep === 4 && (
          <div className="space-y-6 animate-page-enter">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">IV. Informasi Kendaraan</h4>
            <div className="grid grid-cols-1 gap-5">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Jenis Kendaraan <span className="text-rose-500 font-black">*</span></label>
                 <select name="vehicleType" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800 appearance-none" value={formData.vehicleType} onChange={handleChange}>
                    {['roda dua', 'roda tiga', 'roda empat', 'lainnya'].map(v => <option key={v} value={v}>{v.toUpperCase()}</option>)}
                 </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Merek Kendaraan <span className="text-rose-500 font-black">*</span></label>
                   <input name="vehicleBrand" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.vehicleBrand} onChange={handleChange} placeholder="Cth: Toyota/Honda" />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase ml-2">Warna <span className="text-rose-500 font-black">*</span></label>
                   <input name="vehicleColor" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-bold text-slate-800" value={formData.vehicleColor} onChange={handleChange} placeholder="Hitam/Putih/dll" />
                 </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nomor Polisi (Plat) <span className="text-rose-500 font-black">*</span></label>
                <input name="vehiclePlate" type="text" className="w-full bg-slate-50 rounded-2xl px-6 py-4 outline-none font-black text-xl text-center text-slate-900 border-2 border-slate-200 uppercase" value={formData.vehiclePlate} onChange={handleChange} placeholder="Cth: AG 1234 XY" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: TANDA TANGAN */}
        {activeStep === 5 && (
          <div className="space-y-6 animate-page-enter">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest border-l-4 border-amber-500 pl-3">V. Konfirmasi Akhir</h4>
            <div className="bg-amber-50 p-6 rounded-[32px] border border-amber-100 text-[10px] text-amber-800 leading-relaxed font-medium italic">
               "Saya menyatakan bahwa data yang diisi adalah benar dan setuju untuk digunakan oleh Pengurus Lingkungan demi kepentingan keamanan."
            </div>
            <div className="space-y-4">
               <label className="text-[10px] font-black text-slate-400 uppercase ml-2 text-center block w-full">Bubuhkan Tanda Tangan Anda <span className="text-rose-500 font-black">*</span></label>
               <SignaturePad 
                 onSave={(base64) => setFormData({...formData, signature: base64})} 
                 onClear={() => setFormData({...formData, signature: ''})} 
               />
               {formData.signature && (
                 <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 w-fit px-4 py-2 rounded-full mx-auto">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-[10px] font-black uppercase">Tersimpan</span>
                 </div>
               )}
            </div>
          </div>
        )}
      </div>

      {/* FOOTER NAVIGATION */}
      <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 mt-auto">
        {activeStep > 1 && (
          <button onClick={() => setActiveStep(activeStep - 1)} className="flex-1 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-400 hover:bg-slate-200 transition-all">Kembali</button>
        )}
        
        {activeStep < 5 ? (
          <button onClick={handleNext} className="flex-[2] bg-slate-900 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Lanjut ke Bagian {activeStep + 1}</button>
        ) : (
          <button onClick={handleFinalSubmit} className="flex-[2] bg-amber-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Selesaikan Registrasi</button>
        )}
      </div>
    </div>
  );
};

export default GuestbookEditor;
