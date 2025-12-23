
import React, { useState } from 'react';
import { MeetingMinute } from '../types';

interface MeetingMinutesEditorProps {
  onSave: (minute: Partial<MeetingMinute>) => void;
  onCancel: () => void;
  initialData?: MeetingMinute;
}

const MeetingMinutesEditor: React.FC<MeetingMinutesEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [formData, setFormData] = useState<Partial<MeetingMinute>>(initialData || {
    title: '',
    date: new Date().toISOString().split('T')[0],
    location: 'Balai RT 05',
    content: '',
    status: 'Draft'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-[44px] border border-slate-200 shadow-2xl overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none">Notulensi Rapat</h3>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-60">Pencatatan Hasil Musyawarah</p>
        </div>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Agenda / Judul Rapat</label>
            <input 
              name="title"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-white placeholder-slate-600 transition-all"
              placeholder="Contoh: Rapat Persiapan HUT RI"
              value={formData.title}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tanggal Pelaksanaan</label>
            <input 
              name="date"
              type="date" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-white transition-all"
              value={formData.date}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Lokasi Rapat</label>
            <input 
              name="location"
              type="text" 
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-white placeholder-slate-600 transition-all"
              placeholder="Contoh: Balai RT 05"
              value={formData.location}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Status Dokumen</label>
            <select 
              name="status"
              className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-blue-500 outline-none font-black text-white appearance-none transition-all"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="Draft">Draft (Dalam Proses)</option>
              <option value="Final">Final (Telah Disetujui)</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Detail Pembahasan & Keputusan</label>
          <textarea 
            name="content"
            rows={10}
            className="w-full bg-slate-900 border-none rounded-3xl px-6 py-5 focus:ring-2 focus:ring-blue-500 outline-none resize-none text-white font-medium leading-relaxed placeholder-slate-600"
            placeholder="Tulis poin-poin hasil rapat di sini..."
            value={formData.content}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="p-10 bg-slate-50 flex gap-4">
        <button onClick={onCancel} className="flex-1 px-8 py-5 rounded-2xl text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-100 transition-all">
          Batal
        </button>
        <button 
          onClick={() => onSave(formData)}
          disabled={!formData.title || !formData.content}
          className="flex-[2] px-8 py-5 rounded-2xl bg-blue-800 text-white font-black text-sm uppercase tracking-widest hover:bg-blue-900 shadow-2xl transition-all"
        >
          Simpan Notulen
        </button>
      </div>
    </div>
  );
};

export default MeetingMinutesEditor;
