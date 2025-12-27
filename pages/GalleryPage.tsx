
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
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [viewerItem, setViewerItem] = useState<GalleryItem | null>(null);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'Kegiatan',
    imageUrls: [],
    date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.GALLERY), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setItems(cloudData);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!formData.imageUrls || formData.imageUrls.length === 0 || !formData.title) return;
    
    let updatedItems: GalleryItem[];
    if (editingItem) {
      updatedItems = items.map(img => img.id === editingItem.id ? { ...img, ...formData as GalleryItem } : img);
    } else {
      const newItem: GalleryItem = {
        id: Date.now().toString(),
        title: formData.title,
        imageUrls: formData.imageUrls,
        category: formData.category || 'Kegiatan',
        date: formData.date || ''
      };
      updatedItems = [newItem, ...items];
    }

    const saved = await storage.set(STORAGE_KEYS.GALLERY, updatedItems);
    if (saved) {
      setItems(updatedItems);
      setIsUploading(false);
      setEditingItem(null);
      setFormData({ title: '', category: 'Kegiatan', imageUrls: [], date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsUploading(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus album dari galeri?')) {
      const updatedItems = items.filter(img => img.id !== id);
      const saved = await storage.set(STORAGE_KEYS.GALLERY, updatedItems);
      if (saved) setItems(updatedItems);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsCompressing(true);
      const newImages: string[] = [...(formData.imageUrls || [])];
      
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const promise = new Promise<string>((resolve) => {
          reader.onloadend = async () => {
            const result = reader.result as string;
            const optimized = await compressImage(result, 800, 0.6);
            resolve(optimized);
          };
          reader.readAsDataURL(files[i]);
        });
        const optimizedUrl = await promise;
        newImages.push(optimizedUrl);
      }
      
      setFormData(prev => ({ ...prev, imageUrls: newImages }));
      setIsCompressing(false);
      
      if ((!formData.title || formData.title === '') && newImages.length > 0) {
        setAiGenerating(true);
        try {
          const caption = await analyzeImageContent(newImages[0].split(',')[1]);
          if (caption) setFormData(prev => ({ ...prev, title: caption }));
        } catch (err) { console.error(err); } 
        finally { setAiGenerating(false); }
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      imageUrls: (prev.imageUrls || []).filter((_, i) => i !== index)
    }));
  };

  const nextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewerItem) return;
    setViewerIndex((prev) => (prev + 1) % viewerItem.imageUrls.length);
  };

  const prevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewerItem) return;
    setViewerIndex((prev) => (prev - 1 + viewerItem.imageUrls.length) % viewerItem.imageUrls.length);
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
            onClick={() => { 
              setEditingItem(null); 
              setFormData({ title: '', category: 'Kegiatan', imageUrls: [], date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
              setIsUploading(true); 
            }}
            className="bg-purple-600 text-white px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-purple-500/20 active:scale-95 transition-all"
          >
            + Abadikan Momen
          </button>
        )}
      </div>

      <div className="columns-1 sm:columns-2 gap-8 space-y-8">
        {items.length === 0 ? (
           <div className="py-32 text-center bg-slate-50 rounded-[56px] border border-dashed border-slate-200 col-span-full">
              <p className="text-slate-300 font-black uppercase text-xs tracking-widest">Belum ada foto dalam album</p>
           </div>
        ) : (
          items.map(item => (
            <div 
              key={item.id} 
              className="group relative cursor-pointer bg-white rounded-[48px] overflow-hidden shadow-sm border border-slate-50 break-inside-avoid"
              onClick={() => { setViewerItem(item); setViewerIndex(0); }}
            >
              <div className="relative overflow-hidden">
                <img src={item.imageUrls[0]} alt={item.title} className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-[1.5s]" />
                {item.imageUrls.length > 1 && (
                  <div className="absolute top-6 left-6 z-10 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-2">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="text-[10px] font-black text-white">{item.imageUrls.length}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                   <div className="flex gap-2 mb-4">
                      {role === 'ADMIN' && (
                        <>
                           <button onClick={(e) => { e.stopPropagation(); handleEdit(item); }} className="p-3 bg-white text-indigo-600 rounded-xl shadow-xl hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" strokeWidth={2.5}/></svg></button>
                           <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-3 bg-white text-rose-500 rounded-xl shadow-xl hover:scale-110 transition-transform"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg></button>
                        </>
                      )}
                   </div>
                </div>
              </div>
              <div className="p-8">
                 <div className="flex items-center gap-2 mb-2">
                    <span className="bg-purple-50 text-purple-600 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{item.category}</span>
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.date}</span>
                 </div>
                 <h3 className="text-lg font-black text-slate-800 leading-tight uppercase line-clamp-2 group-hover:text-purple-600 transition-colors">{item.title}</h3>
              </div>
            </div>
          ))
        )}
      </div>

      {isUploading && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-6 no-print">
          <div className="bg-white w-full max-w-lg rounded-[56px] p-10 space-y-8 animate-page-enter overflow-y-auto max-h-[90vh] no-scrollbar">
            <div className="flex justify-between items-center">
               <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">{editingItem ? 'Edit Album Momen' : 'Abadikan Momen Baru'}</h3>
               <button onClick={() => setIsUploading(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Foto-foto Momen</label>
              <div onClick={() => !isCompressing && !aiGenerating && fileInputRef.current?.click()} className={`aspect-video w-full border-4 border-dashed rounded-[44px] flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-inner transition-all border-slate-100 bg-slate-50 hover:bg-slate-100`}>
                 <div className="text-center space-y-3 p-6">
                    <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-purple-600">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Tambah Foto ke Album</p>
                 </div>
                 {aiGenerating && (
                   <div className="absolute inset-0 bg-slate-900/80 flex flex-col items-center justify-center text-white gap-3 animate-pulse">
                      <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em]">AI Sedang Menganalisa...</p>
                   </div>
                 )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" multiple onChange={handleFileChange} />
              <div className="grid grid-cols-4 gap-3">
                 {formData.imageUrls?.map((url, idx) => (
                   <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-slate-100 shadow-sm group">
                      <img src={url} className="w-full h-full object-cover" alt="" />
                      <button onClick={() => removePhoto(idx)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/></svg>
                      </button>
                   </div>
                 ))}
              </div>
            </div>
            <div className="space-y-6">
               <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Deskripsi Momen</label>
                  <textarea className="w-full bg-slate-900 text-white rounded-3xl px-7 py-5 outline-none font-bold text-sm h-28 resize-none shadow-2xl focus:ring-2 focus:ring-purple-500" placeholder="Tulis caption singkat..." value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                     <select className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-black text-[11px]" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
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
               <button onClick={handleSave} disabled={isCompressing || !formData.imageUrls?.length} className="flex-[2] bg-purple-600 text-white py-5 px-8 rounded-[28px] font-black uppercase text-xs tracking-widest shadow-2xl shadow-purple-500/40 active:scale-95 transition-all">Publish Album</button>
            </div>
          </div>
        </div>
      )}

      {viewerItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/98 flex items-center justify-center p-6 animate-page-enter no-print">
           <div 
             className="absolute inset-0 cursor-default"
             /* Latar belakang tidak lagi menutup modal jika diklik */
           ></div>
           
           <div className="relative w-full h-full flex items-center justify-center">
             <div className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center">
                <img key={viewerIndex} src={viewerItem.imageUrls[viewerIndex]} className="max-w-full max-h-full object-contain rounded-[48px] shadow-[0_0_100px_rgba(0,0,0,0.5)] border-8 border-white/5 transition-all duration-500 animate-page-enter" alt="" />
                {viewerItem.imageUrls.length > 1 && (
                  <>
                    <button onClick={prevPhoto} className="absolute left-4 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all shadow-2xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    <button onClick={nextPhoto} className="absolute right-4 w-14 h-14 bg-white/10 hover:bg-white/20 backdrop-blur-xl rounded-full flex items-center justify-center text-white border border-white/10 active:scale-90 transition-all shadow-2xl"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </>
                )}
             </div>
             <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-3xl p-8 rounded-[44px] border border-white/10 max-w-xl w-full mx-auto text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <span className="bg-purple-600 text-white px-5 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{viewerItem.category}</span>
                  {viewerItem.imageUrls.length > 1 && (
                    <span className="bg-white/10 text-white px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">{viewerIndex + 1} / {viewerItem.imageUrls.length}</span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white leading-tight uppercase tracking-tight">{viewerItem.title}</h3>
                <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.3em]">{viewerItem.date} • RT Digital Archive</p>
             </div>
             
             {/* Tombol Silang Wajib Digunakan Untuk Menutup */}
             <button 
               onClick={() => setViewerItem(null)}
               className="absolute top-6 right-6 w-16 h-16 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center text-white backdrop-blur-xl border border-white/10 transition-colors"
             >
               <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path d="M6 18L18 6M6 6l12 12" strokeWidth={2.5}/>
               </svg>
             </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
