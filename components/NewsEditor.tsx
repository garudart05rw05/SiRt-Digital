
import React, { useState, useRef } from 'react';
import { generateNewsDraft, polishNews, analyzeImageContent } from '../services/geminiService.ts';
import { NewsItem } from '../types.ts';
import { compressImage } from '../services/storageService.ts';

interface NewsEditorProps {
  onSave: (news: Partial<NewsItem>) => void;
  onCancel: () => void;
  initialData?: NewsItem;
}

const NewsEditor: React.FC<NewsEditorProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [category, setCategory] = useState(initialData?.category || 'Pengumuman');
  const [tags, setTags] = useState<string>(initialData?.tags?.join(', ') || '');
  const [isFeatured, setIsFeatured] = useState(initialData?.isFeatured || false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [previewImage, setPreviewImage] = useState(initialData?.imageUrl || '');
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const charCount = content.length;

  const handleAiDraft = async () => {
    if (!aiTopic) return;
    setIsGenerating(true);
    try {
      const draft = await generateNewsDraft(aiTopic);
      if (draft) {
        setContent(draft);
        setTitle(aiTopic.toUpperCase());
        setTags(aiTopic.split(' ').slice(0,3).join(', '));
      }
    } catch (err) {
      console.error(err);
    } finally { setIsGenerating(false); }
  };

  const handleAiPolish = async () => {
    if (!content) return;
    setIsGenerating(true);
    try {
      const polished = await polishNews(content);
      if (polished) setContent(polished);
    } catch (err) {
      console.error(err);
    } finally { setIsGenerating(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fullBase64 = reader.result as string;
        const optimized = await compressImage(fullBase64, 1200, 0.7);
        setPreviewImage(optimized);
        setIsGenerating(true);
        try {
          const caption = await analyzeImageContent(optimized.split(',')[1]);
          if (caption) setSubtitle(caption);
        } catch (err) {
          console.error(err);
        } finally { 
          setIsGenerating(false); 
          setIsCompressing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInternal = () => {
    onSave({
      title,
      subtitle,
      content,
      category,
      isFeatured,
      imageUrl: previewImage,
      tags: tags.split(',').map(t => t.trim()).filter(t => t !== '')
    });
  };

  return (
    <div className="bg-white rounded-[44px] shadow-2xl border border-slate-100 overflow-hidden animate-page-enter flex flex-col max-h-[95vh]">
      <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Redaksi Warta RT</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Penerbitan Konten Profesional</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-200 p-1 rounded-2xl flex">
              <button 
                onClick={() => setViewMode('edit')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Editor
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
              >
                Pratinjau
              </button>
           </div>
           <button onClick={onCancel} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all active:scale-90 border border-slate-100">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {viewMode === 'edit' ? (
          <div className="p-8 space-y-10">
            {/* AI ASSISTANCE BOX */}
            <div className="bg-slate-950 p-8 rounded-[40px] shadow-2xl relative overflow-hidden group border border-white/5">
              <div className="relative z-10 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl shadow-inner">✨</div>
                  <div>
                    <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.2em]">Inteligensi Buatan (Gemini)</p>
                    <h4 className="text-white font-black text-sm uppercase tracking-tight">Drafting Cerdas AI</h4>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input 
                    type="text" 
                    placeholder="Sebutkan topik (cth: Laporan Keamanan Mingguan)" 
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-600"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                  />
                  <button 
                    onClick={handleAiDraft}
                    disabled={isGenerating || !aiTopic}
                    className="bg-indigo-600 text-white px-10 py-4 rounded-[24px] font-black text-[11px] uppercase tracking-widest hover:bg-indigo-500 disabled:opacity-30 shadow-xl active:scale-95 transition-all"
                  >
                    {isGenerating ? 'Menulis...' : 'Generate Draf'}
                  </button>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-indigo-600/10 rounded-full blur-[100px] group-hover:scale-110 transition-transform duration-[3s]"></div>
            </div>

            <div className="space-y-8">
              {/* TITLE & SUBTITLE */}
              <div className="grid grid-cols-1 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Judul Utama Warta</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[28px] px-8 py-5 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-2xl text-slate-800 shadow-inner placeholder:text-slate-300" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="Masukkan judul..."
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Lead / Summary Berita</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border border-slate-100 rounded-[24px] px-8 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600 shadow-inner placeholder:text-slate-300" 
                      value={subtitle} 
                      onChange={e => setSubtitle(e.target.value)} 
                      placeholder="Ringkasan singkat berita..."
                    />
                 </div>
              </div>

              {/* CONTENT AREA */}
              <div className="space-y-2 relative">
                <div className="flex justify-between items-end px-3 mb-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Badan Berita (Konten Lengkap)</label>
                   <div className="flex gap-4">
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{wordCount} Kata</span>
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{charCount} Karakter</span>
                   </div>
                </div>
                <div className="relative group">
                  <textarea 
                    rows={12} 
                    className="w-full bg-slate-50 border border-slate-100 rounded-[44px] px-10 py-10 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium leading-relaxed text-slate-700 shadow-inner custom-scrollbar" 
                    value={content} 
                    onChange={e => setContent(e.target.value)} 
                    placeholder="Tulis detail informasi di sini..."
                  />
                  <button 
                    onClick={handleAiPolish}
                    disabled={isGenerating || !content}
                    className="absolute bottom-8 right-8 bg-white border border-slate-200 text-indigo-600 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 active:scale-95"
                  >
                    <span className="text-sm">✨</span> Poles Bahasa AI
                  </button>
                </div>
              </div>

              {/* METADATA SETTINGS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Kategori Berita</label>
                    <select className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-black text-[11px] text-slate-700 appearance-none shadow-sm" value={category} onChange={e => setCategory(e.target.value as any)}>
                      {['Pengumuman', 'Kegiatan', 'Keamanan', 'Sosial'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Label / Tags</label>
                    <input type="text" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 outline-none font-bold text-xs shadow-sm" value={tags} onChange={e => setTags(e.target.value)} placeholder="cth: Gayam, Kerja Bakti" />
                 </div>
                 <div className="flex items-center gap-4 pt-6 ml-3">
                    <label className="flex items-center cursor-pointer gap-4 group">
                       <div className={`w-12 h-6 rounded-full transition-all relative ${isFeatured ? 'bg-amber-500' : 'bg-slate-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isFeatured ? 'left-7' : 'left-1'}`}></div>
                          <input type="checkbox" className="hidden" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                       </div>
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest group-hover:text-slate-900 transition-colors">Headline Utama</span>
                    </label>
                 </div>
              </div>

              {/* MEDIA SECTION */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-3">Media Dokumentasi</label>
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()} 
                  className={`w-full aspect-[21/9] border-4 border-dashed rounded-[48px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${previewImage ? 'border-transparent' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 shadow-inner'}`}
                >
                   {isCompressing ? (
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest animate-pulse">Optimasi Gambar...</p>
                      </div>
                   ) : previewImage ? (
                     <>
                       <img src={previewImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Preview" />
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all">
                          <div className="bg-white px-8 py-4 rounded-3xl font-black text-[10px] uppercase text-slate-900 shadow-2xl flex items-center gap-3">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2.5}/></svg>
                             Ganti Visual Utama
                          </div>
                       </div>
                     </>
                   ) : (
                     <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-md text-slate-300">
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Klik Untuk Unggah Foto</p>
                     </div>
                   )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 max-w-xl mx-auto space-y-10 animate-page-enter">
             <div className="space-y-6">
                <div className="flex items-center gap-3">
                   <span className="bg-indigo-600 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">{category}</span>
                   {isFeatured && <span className="bg-amber-500 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">Headline</span>}
                </div>
                <h1 className="text-5xl font-black text-slate-950 leading-tight uppercase tracking-tight">{title || 'PRATINJAU JUDUL'}</h1>
                <p className="text-2xl font-bold text-slate-500 italic leading-relaxed">{subtitle || 'Ringkasan berita akan tampil di sini...'}</p>
                <div className="flex items-center gap-4 pt-6 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-200 rounded-full"></div>
                      <span>Administrator RT</span>
                   </div>
                   <span>•</span>
                   <span>{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                </div>
             </div>
             {previewImage && <img src={previewImage} className="w-full aspect-[16/9] object-cover rounded-[56px] shadow-2xl border-4 border-white" alt="" />}
             <div className="text-slate-700 leading-loose text-xl whitespace-pre-wrap font-medium pb-20">
                {content || 'Konten narasi berita yang Anda tulis akan muncul lengkap di bagian pratinjau ini.'}
             </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50 border-t border-slate-200 flex gap-4 shrink-0">
        <button onClick={onCancel} className="flex-1 py-6 rounded-[32px] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">Batalkan</button>
        <button 
          onClick={handleSaveInternal}
          disabled={!title || !content || isCompressing}
          className="flex-[2] bg-slate-950 text-white py-6 rounded-[36px] font-black text-xs uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.3)] active:scale-95 transition-all disabled:opacity-30 flex items-center justify-center gap-4"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeWidth={3} /></svg>
          Publikasikan Warta
        </button>
      </div>
    </div>
  );
};

export default NewsEditor;
