
import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, UserRole } from '../types.ts';
import { storage, STORAGE_KEYS, compressImage } from '../services/storageService.ts';
import { analyzeImageContent } from '../services/geminiService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface GalleryPageProps {
  role: UserRole;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ role }) => {
  const [images, setImages] = useState<GalleryItem[]>(() => 
    storage.get(STORAGE_KEYS.GALLERY, [])
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [viewerItem, setViewerItem] = useState<GalleryItem | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'Kegiatan',
    date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.GALLERY), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setImages(cloudData);
        try {
            localStorage.setItem(STORAGE_KEYS.GALLERY, JSON.stringify(cloudData));
        } catch(e) {}
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!formData.imageUrl || !formData.title) return;
    
    let updatedImages: GalleryItem[];
    if (editingItem) {
      updatedImages = images.map(img => img.id === editingItem.id ? { ...img, ...formData as GalleryItem } : img);
    } else {
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        title: formData.title,
        imageUrl: formData.imageUrl,
        category: formData.category || 'Kegiatan',
        date: formData.date || ''
      };
      updatedImages = [newItem, ...images];
    }

    const saved = await storage.set(STORAGE_KEYS.GALLERY, updatedImages);
    if (saved) {
      setImages(updatedImages);
      setIsUploading(false);
      setEditingItem(null);
      setFormData({ title: '', category: 'Kegiatan', date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsUploading(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus foto dari galeri?')) {
      const updatedImages = images.filter(img => img.id !== id);
      const saved = await storage.set(STORAGE_KEYS.GALLERY, updatedImages);
      if (saved) setImages(updatedImages);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        // Kompresi segera
        const optimized = await compressImage(result, 800, 0.6);
        setFormData(prev => ({ ...prev, imageUrl: optimized }));
        setIsCompressing(false);
        
        setAiGenerating(true);
        try {
          const caption = await analyzeImageContent(optimized.split(',')[1]);
          if (caption) setFormData(prev => ({ ...prev, title: caption }));
        } catch (err) { console.error(err); } 
        finally { setAiGenerating(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-10 px-5 py-6 pb-32 animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8 bg-white p-10 rounded-[56px] shadow-sm border border-slate-50">
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-slate-800 uppercase tracking-tighter leading-none">Dokumentasi</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Momen Kebersamaan RT 05 RW 05</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => { setEditingItem(null); setIsUploading(true); }}
            className="bg-purple-600 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-purple-500/20 active:scale-95 transition-all"
          >
            + Abadikan Momen
          </button>
        )}
      </div>

      <div className="columns-1 sm:columns-2 gap-8 space-y-8">
        {images.length === 0 ? (
           <div className="py-32 text-center bg-slate-50 rounded-[56px] border border-dashed border-slate-200 col-span-full">
              <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Belum ada foto dalam album</p>
           </div>
        ) : (
          images.map(img => (
            <div 
              key={img.id} 
              className="group relative cursor-pointer bg-white rounded-[48px] overflow-hidden shadow-sm border border-slate-50 break-inside-avoid"
              onClick={() => setViewerItem(img)}
            >
              <div className="relative overflow-hidden">
                <img src={img.imageUrl} alt={img.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                   <div className="flex gap-2 mb-4">
                      {role === 'ADMIN' && (
                        <>
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(img); }} className="p-3 bg-white text-indigo-600 rounded-xl shadow-xl hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5}/></svg></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }} className="p-3 bg-white text-rose-500 rounded-xl shadow-xl hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg></button>
                        </>
                      )}
                   </div>
                </div>
              </div>
              <div className="p-8">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{img.category}</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{img.date}</span>
                 </div>
                 <h3 className="text-lg font-black text-slate-800 leading-tight uppercase line-clamp-2 group-hover:text-purple-600 transition-colors">{img.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      {isUploading && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-md rounded-[56px] p-10 space-y-8 animate-page-enter overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{editingItem ? 'Edit Informasi Foto' : 'Abadikan Momen Baru'}</h3>
               <button onClick={() => setIsUploading(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>

            <div onClick={() => !isCompressing && !aiGenerating && fileInputRef.current?.click()} className={`aspect-video w-full border-4 border-dashed rounded-[44px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-inner transition-all ${formData.imageUrl ? 'border-transparent' : 'border-slate-100 bg-slate-50'}`}>
               {isCompressing ? (
                  <div className="flex flex-col items-center gap-2">
                     <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                     <p className="text-[9px] font-black text-purple-500 uppercase">Optimasi Foto...</p>
                  </div>
               ) : formData.imageUrl ? (
                 <>
                   <img src={formData.imageUrl} className="w-full h-full object-cover" alt="" />
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-white text-slate-900 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Ganti Foto</span>
                   </div>
                 </>
               ) : (
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Pilih Berkas Citra</p>
               )}
               {aiGenerating && (
                 <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-3 animate-pulse">
                    <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[9px] font-black uppercase tracking-[0.3em]">AI Gemini Menganalisa...</p>
                 </div>
               )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            
            <div className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Deskripsi / Judul Momen</label>
                  <textarea 
                    className="w-full bg-slate-900 text-white rounded-3xl px-7 py-5 outline-none font-bold text-sm h-32 resize-none shadow-2xl focus:ring-2 focus:ring-purple-500" 
                    placeholder="Tulis caption singkat..." 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                  />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                     <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-[11px] appearance-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                        {['Kegiatan', 'Sosial', 'Keamanan', 'Infrastruktur'].map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Waktu Kejadian</label>
                     <input type="text" className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold text-[11px]" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </div>
               </div>
            </div>

            <div className="flex gap-4 pt-4">
               <button onClick={() => setIsUploading(false)} className="flex-1 py-5 font-black uppercase text-xs text-slate-400 tracking-widest">Batal</button>
               <button onClick={handleSave} disabled={isCompressing} className="flex-[2] bg-purple-600 text-white py-5 px-8 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-purple-500/40 active:scale-95 transition-all disabled:opacity-30">Publish Album</button>
            </div>
          </div>
        </div>
      )}

      {viewerItem && (
        <div onClick={() => setViewerItem(null)} className="fixed inset-0 z-[120] bg-slate-950/98 flex items-center justify-center p-6 animate-page-enter no-print">
           <img src={viewerItem.imageUrl} className="max-w-full max-h-[85vh] object-contain rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-8 border-white/5" alt="" />
           <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-3xl p-8 rounded-[44px] border border-white/10 max-w-xl w-full mx-auto text-center space-y-4">
              <span className="bg-purple-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{viewerItem.category}</span>
              <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{viewerItem.title}</h3>
              <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">{viewerItem.date} • RT Digital Archive</p>
           </div>
           <button className="absolute top-10 right-10 w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10"><svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg></button>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
