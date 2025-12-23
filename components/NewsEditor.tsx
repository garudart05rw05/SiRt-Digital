
import React, { useState, useRef } from 'react';
import { generateNewsDraft, polishNews, analyzeImageContent } from '../services/geminiService';
import { NewsItem } from '../types';

interface NewsEditorProps {
  onSave: (news: Partial<NewsItem>) => void;
  onCancel: () => void;
  initialData?: NewsItem;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'Pengumuman');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [previewImage, setPreviewImage] = useState(initialData?.imageUrl || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAiDraft = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const draft = await generateNewsDraft(aiTopic);
      if (draft) {
        setContent(draft);
        setTitle(aiTopic);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAiPolish = async () => {
    if (!content) return;
    setIsGenerating(true);
    try {
      const polished = await polishNews(content);
      if (polished) setContent(polished);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        setPreviewImage(reader.result as string);
        
        setIsGenerating(true);
        try {
          const caption = await analyzeImageContent(base64);
          if (caption) setContent(prev => `${prev}\n\nCaption Foto: ${caption}`);
        } catch (err) {
          console.error(err);
        } finally {
          setIsGenerating(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-white rounded-[40px] shadow-2xl border border-slate-200 overflow-hidden animate-page-enter">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
        <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">
          {initialData ? 'Edit Berita' : 'Tulis Berita Baru'}
        </h3>
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="p-10 space-y-10">
        <div className="bg-indigo-900 p-8 rounded-[32px] border border-indigo-700 shadow-xl shadow-indigo-900/20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1a1 1 0 112 0v1a1 1 0 11-2 0zM13 16v-1a1 1 0 112 0v1a1 1 0 11-2 0z" /></svg>
            </div>
            <span className="font-black text-white text-sm uppercase tracking-widest">Asisten AI Penulis</span>
          </div>
          <div className="flex gap-3">
            <input 
              type="text" 
              placeholder="Apa topik beritanya? (cth: Lomba Mewarnai)" 
              className="flex-1 bg-slate-950 border border-indigo-800 rounded-2xl px-6 py-4 text-sm focus:ring-2 focus:ring-indigo-400 outline-none text-white placeholder-slate-600 font-bold"
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
            />
            <button 
              onClick={handleAiDraft}
              disabled={isGenerating || !aiTopic}
              className="bg-indigo-500 text-white px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-400 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30"
            >
              {isGenerating ? '...' : 'Draft'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Publikasi</label>
              <input 
                type="text" 
                className="w-full bg-slate-900 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white font-black text-lg placeholder-slate-600"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori Berita</label>
              <div className="flex flex-wrap gap-2">
                {['Pengumuman', 'Kegiatan', 'Keamanan', 'Sosial'].map((cat) => (
                  <button 
                    key={cat}
                    onClick={() => setCategory(cat as any)}
                    className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${category === cat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 relative">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Narasi Berita</label>
              <textarea 
                rows={12}
                className="w-full bg-slate-900 border-none rounded-3xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-white font-medium leading-relaxed placeholder-slate-600"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
              <button 
                onClick={handleAiPolish}
                disabled={isGenerating || !content}
                className="absolute bottom-4 right-4 bg-slate-950 border border-indigo-900 text-indigo-400 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-900 transition-all shadow-sm"
              >
                ✨ Rapikan Teks
              </button>
            </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Foto Utama</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="aspect-video w-full border-4 border-dashed border-slate-200 rounded-[32px] flex flex-col items-center justify-center bg-slate-950 cursor-pointer hover:bg-slate-900 transition-all overflow-hidden relative group"
              >
                {previewImage ? (
                  <>
                    <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <span className="text-white font-black uppercase tracking-widest text-xs">Ubah Foto</span>
                    </div>
                  </>
                ) : (
                  <>
                    <svg className="w-16 h-16 text-slate-800 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <p className="text-sm font-black text-slate-700 uppercase tracking-tighter">Pilih Dokumentasi Kegiatan</p>
                  </>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
            
            <div className="bg-amber-900 p-8 rounded-[32px] border border-amber-800 shadow-xl">
              <h4 className="text-white text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                 <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2.5}/></svg>
                 Saran Redaksi
              </h4>
              <ul className="text-xs text-amber-200/70 space-y-3 font-medium leading-relaxed">
                <li className="flex gap-2"><span>•</span> Gunakan bahasa yang ramah dan mengajak warga.</li>
                <li className="flex gap-2"><span>•</span> Foto dengan banyak orang meningkatkan interaksi.</li>
                <li className="flex gap-2"><span>•</span> Pastikan tanggal dan lokasi kegiatan akurat.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
          <button onClick={onCancel} className="px-10 py-5 rounded-2xl text-slate-500 font-black text-sm uppercase tracking-widest hover:bg-slate-50 transition-all">
            Batal
          </button>
          <button 
            onClick={() => onSave({ title, content, category, imageUrl: previewImage })}
            className="px-12 py-5 rounded-2xl bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-500/40 transition-all"
          >
            Publikasikan Berita
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewsEditor;
