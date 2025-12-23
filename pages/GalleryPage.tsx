
import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, UserRole } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';
import { analyzeImageContent } from '../services/geminiService';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface GalleryPageProps {
  role: UserRole;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ role }) => {
  const [images, setImages] = useState<GalleryItem[]>(() => 
    storage.get(STORAGE_KEYS.GALLERY, [])
  );
  const [isUploading, setIsUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [viewerItem, setViewerItem] = useState<GalleryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<GalleryItem>>({
    title: '',
    category: 'Kegiatan',
    date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  });

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.GALLERY), (doc) => {
      if (doc.exists()) {
        setImages(doc.data().data);
      }
    });
    return () => unsub();
  }, []);

  const compressImage = (base64Str: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200; 
        let width = img.width;
        let height = img.height;
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAiGenerating(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setFormData(prev => ({ ...prev, imageUrl: compressed }));
        try {
          const caption = await analyzeImageContent(compressed.split(',')[1]);
          if (caption) setFormData(prev => ({ ...prev, title: caption }));
        } catch (err) {
          console.error("AI Caption error", err);
        } finally {
          setAiGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.imageUrl || !formData.title) return;
    const newItem: GalleryItem = {
      id: Date.now().toString(),
      title: formData.title,
      imageUrl: formData.imageUrl,
      category: formData.category || 'Lingkungan',
      date: formData.date || ''
    };
    const updatedImages = [newItem, ...images];
    setImages(updatedImages);
    storage.set(STORAGE_KEYS.GALLERY, updatedImages);
    setIsUploading(false);
    setFormData({ title: '', category: 'Kegiatan', date: new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }) });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus foto dari galeri?')) {
      const updatedImages = images.filter(img => img.id !== id);
      setImages(updatedImages);
      storage.set(STORAGE_KEYS.GALLERY, updatedImages);
    }
  };

  return (
    <div className="space-y-8 px-5 py-6 pb-32 animate-page-enter">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-[44px] shadow-sm border border-slate-50">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Galeri</h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-2">Momen Kebersamaan RT</p>
        </div>
        {role === 'ADMIN' && (
          <button 
            onClick={() => setIsUploading(true)}
            className="bg-purple-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
          >
            + Abadikan
          </button>
        )}
      </div>

      {images.length === 0 ? (
        <div className="py-24 text-center bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada koleksi foto</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {images.map(img => (
            <div 
              key={img.id} 
              onClick={() => setViewerItem(img)}
              className="group cursor-pointer relative bg-white rounded-[44px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col"
            >
              <div className="aspect-[4/3] overflow-hidden relative">
                <img src={img.imageUrl} alt={img.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                <div className="absolute top-6 left-6">
                  <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-purple-600 shadow-lg">{img.category}</span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                   <p className="text-[10px] font-black text-slate-400 mb-3 tracking-widest uppercase">{img.date}</p>
                   <h3 className="text-lg font-black text-slate-800 leading-tight uppercase group-hover:text-purple-600 transition-colors line-clamp-2">{img.title}</h3>
                </div>
                {role === 'ADMIN' && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); handleDelete(img.id); }}
                     className="mt-6 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-rose-50 w-fit px-4 py-2 rounded-xl transition-all"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth={2.5}/></svg>
                     Hapus Data
                   </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* LIGHTBOX VIEWER */}
      {viewerItem && (
        <div className="fixed inset-0 z-[120] bg-slate-950/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-page-enter">
           <button 
             onClick={() => setViewerItem(null)}
             className="absolute top-10 right-10 w-14 h-14 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl border border-white/10"
           >
             <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg>
           </button>
           
           <div className="w-full max-w-4xl space-y-8 flex flex-col items-center">
              <div className="relative w-full rounded-[44px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.5)] border border-white/10">
                 <img src={viewerItem.imageUrl} className="w-full h-full object-contain" alt={viewerItem.title} />
              </div>
              <div className="text-center space-y-3 max-w-2xl px-6">
                 <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">{viewerItem.category} • {viewerItem.date}</span>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{viewerItem.title}</h2>
              </div>
           </div>
        </div>
      )}

      {isUploading && (
        <div className="fixed inset-0 z-[110] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-md rounded-[44px] overflow-hidden shadow-2xl animate-page-enter">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
               <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight">Upload Foto</h3>
               <button onClick={() => setIsUploading(false)} className="w-10 h-10 bg-white rounded-full text-slate-400 shadow-sm"><svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth={3}/></svg></button>
            </div>
            <div className="p-8 space-y-6">
               <div 
                 onClick={() => !aiGenerating && fileInputRef.current?.click()}
                 className="aspect-video w-full border-4 border-dashed border-slate-200 rounded-[32px] bg-slate-900 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative shadow-inner"
               >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="text-center space-y-2">
                       <svg className="w-12 h-12 text-slate-700 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>
                       <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Pilih Foto Kegiatan</p>
                    </div>
                  )}
                  {aiGenerating && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">AI Menganalisa...</div>
                  )}
               </div>
               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
               
               <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Foto / Caption</label>
                    <textarea 
                      className="w-full bg-slate-900 text-white rounded-2xl px-6 py-4 outline-none font-bold text-sm h-28 resize-none shadow-inner"
                      placeholder="Apa isi foto ini?"
                      value={formData.title}
                      onChange={e => setFormData({...formData, title: e.target.value})}
                    />
                  </div>
               </div>

               <button 
                 onClick={handleSave}
                 disabled={!formData.imageUrl || !formData.title || aiGenerating}
                 className="w-full bg-purple-600 text-white py-5 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-2xl shadow-purple-500/30 disabled:opacity-50 transition-all active:scale-95"
               >
                 Publikasikan
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
