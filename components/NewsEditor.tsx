
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
        // Optimasi segera
        const optimized = await compressImage(fullBase64, 800, 0.6);
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
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight">Redaksi Warta RT</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Penerbitan Konten Profesional</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-100 p-1 rounded-2xl flex">
              <button 
                onClick={() => setViewMode('edit')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'edit' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Editor
              </button>
              <button 
                onClick={() => setViewMode('preview')}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Preview
              </button>
           </div>
           <button onClick={onCancel} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
             <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {viewMode === 'edit' ? (
          <div className="p-8 space-y-8">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 p-6 rounded-[32px] shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-500/20 rounded-xl flex items-center justify-center text-xl">✨</div>
                  <p className="text-white font-black text-[10px] uppercase tracking-widest">Penulis Berita AI Gemini</p>
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Sebutkan topik (cth: Laporan Keamanan Mingguan)" 
                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-500"
                    value={aiTopic}
                    onChange={e => setAiTopic(e.target.value)}
                  />
                  <button 
                    onClick={handleAiDraft}
                    disabled={isGenerating || !aiTopic}
                    className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-50 disabled:opacity-30 shadow-lg"
                  >
                    {isGenerating ? 'Membangun...' : 'Buat Draft'}
                  </button>
                </div>
              </div>
              <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Judul Utama</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-lg text-slate-800" 
                      value={title} 
                      onChange={e => setTitle(e.target.value)} 
                      placeholder="Tulis Judul yang Menarik..."
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sub-Judul / Lead Berita</label>
                    <input 
                      type="text" 
                      className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-600" 
                      value={subtitle} 
                      onChange={e => setSubtitle(e.target.value)} 
                      placeholder="Ringkasan singkat berita..."
                    />
                 </div>
              </div>

              <div className="space-y-2 relative">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Konten Berita</label>
                <textarea 
                  rows={10} 
                  className="w-full bg-slate-50 border-none rounded-[32px] px-8 py-8 focus:ring-2 focus:ring-indigo-500 outline-none resize-none font-medium leading-relaxed text-slate-700 shadow-inner" 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Ceritakan detail berita di sini..."
                />
                <button 
                  onClick={handleAiPolish}
                  disabled={isGenerating || !content}
                  className="absolute bottom-6 right-6 bg-white border border-slate-100 text-indigo-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all flex items-center gap-2"
                >
                  <span className="text-sm">✨</span> Poles Bahasa
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Kategori</label>
                    <select className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold text-slate-700" value={category} onChange={e => setCategory(e.target.value as any)}>
                      {['Pengumuman', 'Kegiatan', 'Keamanan', 'Sosial'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tags (Pisah dengan koma)</label>
                    <input type="text" className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 outline-none font-bold" value={tags} onChange={e => setTags(e.target.value)} placeholder="cth: Kerja Bakti, RT05, Gayam" />
                 </div>
                 <div className="flex items-center gap-4 pt-6 ml-2">
                    <label className="flex items-center cursor-pointer gap-3">
                       <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-200 text-indigo-600 focus:ring-indigo-500" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)} />
                       <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Berita Utama (Headline)</span>
                    </label>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Media Visual</label>
                <div 
                  onClick={() => !isCompressing && fileInputRef.current?.click()} 
                  className={`w-full aspect-video border-4 border-dashed rounded-[44px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${previewImage ? 'border-transparent' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}
                >
                   {isCompressing ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Memproses Gambar...</p>
                      </div>
                   ) : previewImage ? (
                     <>
                       <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
                       <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <div className="bg-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase text-slate-900 shadow-xl">Ganti Foto</div>
                       </div>
                     </>
                   ) : (
                     <div className="text-center space-y-3">
                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center mx-auto shadow-sm text-slate-400">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Unggah Dokumentasi Foto</p>
                     </div>
                   )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-10 max-w-xl mx-auto space-y-8 animate-page-enter">
             <div className="space-y-4">
                <div className="flex items-center gap-2">
                   <span className="bg-indigo-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{category}</span>
                   {isFeatured && <span className="bg-amber-500 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Headline</span>}
                </div>
                <h1 className="text-4xl font-black text-slate-800 leading-tight tracking-tight uppercase">{title || 'JUDUL BERITA'}</h1>
                <p className="text-lg font-bold text-slate-500 italic leading-relaxed">{subtitle || 'Sub-judul atau ringkasan berita akan tampil di sini...'}</p>
                <div className="flex items-center gap-3 pt-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-t border-slate-100">
                   <span>Admin RT</span>
                   <span>•</span>
                   <span>{new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</span>
                </div>
             </div>
             {previewImage && <img src={previewImage} className="w-full aspect-video object-cover rounded-[48px] shadow-2xl" alt="" />}
             <div className="text-slate-600 leading-loose text-lg whitespace-pre-wrap font-medium">
                {content || 'Konten berita Anda akan tampil di sini secara rapi dan profesional.'}
             </div>
             <div className="flex flex-wrap gap-2 pt-6">
                {tags.split(',').map((tag, i) => tag.trim() && (
                  <span key={i} className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase">#{tag.trim()}</span>
                ))}
             </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
        <button onClick={onCancel} className="flex-1 py-6 rounded-[28px] text-slate-400 font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Batal</button>
        <button 
          onClick={handleSaveInternal}
          disabled={!title || !content || isCompressing}
          className="flex-[2] bg-slate-900 text-white py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.3em] shadow-[0_15px_40px_rgba(0,0,0,0.2)] active:scale-95 transition-all disabled:opacity-30"
        >
          Publikasikan Warta
        </button>
      </div>
    </div>
  );
};

export default NewsEditor;
