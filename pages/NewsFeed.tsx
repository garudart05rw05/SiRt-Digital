
import React, { useState, useEffect } from 'react';
import { NewsItem, UserRole, Comment } from '../types.ts';
import NewsEditor from '../components/NewsEditor.tsx';
import CommentSection from '../components/CommentSection.tsx';
import { storage, STORAGE_KEYS } from '../services/storageService.ts';
import { db } from '../services/firebase.ts';
import { doc, onSnapshot } from 'firebase/firestore';

interface NewsFeedProps {
  role: UserRole;
}

const NewsFeed: React.FC<NewsFeedProps> = ({ role }) => {
  const [news, setNews] = useState<NewsItem[]>(() => 
    storage.get(STORAGE_KEYS.NEWS, [])
  );
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | undefined>(undefined);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "app_data", STORAGE_KEYS.NEWS), (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data().data || [];
        setNews(cloudData);
        storage.updateLocal(STORAGE_KEYS.NEWS, cloudData);
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async (data: Partial<NewsItem>) => {
    let updatedNews: NewsItem[];
    if (selectedNews) {
      updatedNews = news.map(n => n.id === selectedNews.id ? { ...n, ...data as NewsItem } : n);
    } else {
      const newEntry: NewsItem = {
        id: Date.now().toString(),
        author: 'Admin RT',
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: 'Published',
        title: '',
        content: '',
        category: 'Pengumuman',
        imageUrl: '',
        ...data as NewsItem
      };
      updatedNews = [newEntry, ...news];
    }
    
    updatedNews.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0));

    const saved = await storage.set(STORAGE_KEYS.NEWS, updatedNews);
    if (saved) {
      setNews(updatedNews);
      setIsEditing(false);
      setSelectedNews(undefined);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (window.confirm(`Hapus berita: "${title}"? Tindakan ini akan menghapusnya secara permanen dari Cloud.`)) {
      const updatedNews = news.filter(n => n.id !== id);
      const saved = await storage.set(STORAGE_KEYS.NEWS, updatedNews);
      if (saved) {
        setNews(updatedNews);
        alert("Berita telah dihapus.");
      }
    }
  };

  const getCommentCount = (newsId: string) => {
    const comments = storage.get<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    return comments.filter(c => c.parentId === newsId).length;
  };

  const filteredNews = news.filter(item => {
    const search = (searchTerm || '').toLowerCase();
    const title = (item.title || '').toLowerCase();
    const content = (item.content || '').toLowerCase();
    
    const matchesSearch = title.includes(search) || content.includes(search);
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  if (isEditing) {
    return <NewsEditor onSave={handleSave} onCancel={() => setIsEditing(false)} initialData={selectedNews} />;
  }

  const categories = ['Semua', 'Pengumuman', 'Kegiatan', 'Keamanan', 'Sosial'];

  return (
    <div className="space-y-10 px-5 py-6 pb-32 animate-page-enter">
      <div className="flex flex-col gap-6 bg-white p-8 rounded-[48px] shadow-sm border border-slate-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tighter leading-none">Newsroom</h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">Informasi Resmi Lingkungan RT 05</p>
          </div>
          {role === 'ADMIN' && (
            <button 
              onClick={() => { setSelectedNews(undefined); setIsEditing(true); }}
              className="bg-indigo-600 text-white px-8 py-4 rounded-[28px] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              + Terbitkan Berita
            </button>
          )}
        </div>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Cari berita atau pengumuman..." 
              className="w-full bg-slate-100 border-none rounded-3xl px-14 py-4 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-6 h-6 text-slate-400 absolute left-5 top-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeWidth={3}/></svg>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
             {categories.map(cat => (
               <button 
                 key={cat} 
                 onClick={() => setActiveCategory(cat)}
                 className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeCategory === cat ? 'bg-slate-900 text-white border-slate-900 shadow-lg' : 'bg-white text-slate-400 border-slate-100'}`}
               >
                 {cat}
               </button>
             ))}
          </div>
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[56px] border border-dashed border-slate-200">
           <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center mx-auto mb-6 text-slate-200">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10l4 4v10a2 2 0 01-2 2z" /></svg>
           </div>
           <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Belum ada berita yang diterbitkan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-12">
          {filteredNews.map((item) => (
            <div key={item.id} className={`group relative bg-white rounded-[56px] overflow-hidden transition-all duration-700 hover:shadow-[0_40px_80px_rgba(0,0,0,0.1)] border border-slate-50 ${item.isFeatured ? 'ring-4 ring-indigo-50/50' : ''}`}>
              {item.isFeatured && (
                <div className="absolute top-8 right-8 z-20">
                   <div className="bg-amber-500 text-white px-5 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.3em] shadow-xl flex items-center gap-2">
                      Headline
                   </div>
                </div>
              )}
              
              <div className="flex flex-col lg:flex-row">
                 {item.imageUrl && (
                   <div className="lg:w-2/5 aspect-video lg:aspect-auto overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                   </div>
                 )}
                 <div className={`flex-1 p-10 lg:p-14 space-y-6 ${!item.imageUrl ? 'text-center max-w-2xl mx-auto' : ''}`}>
                    <div className={`flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ${!item.imageUrl ? 'justify-center' : ''}`}>
                       <span className="text-indigo-600 font-black">{item.category}</span>
                       <span>•</span>
                       <span>{item.date}</span>
                    </div>
                    
                    <div className="space-y-4">
                       <h3 className="text-3xl font-black text-slate-800 leading-[1.1] tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{item.title}</h3>
                       {item.subtitle && <p className="text-lg font-bold text-slate-500 italic leading-relaxed">{item.subtitle}</p>}
                    </div>

                    <p className="text-slate-500 text-base leading-relaxed font-medium line-clamp-3">{item.content}</p>

                    <div className={`flex flex-wrap gap-2 pt-2 ${!item.imageUrl ? 'justify-center' : ''}`}>
                       {item.tags?.map((tag, i) => (
                         <span key={i} className="text-[9px] font-black uppercase text-slate-400 tracking-widest border border-slate-100 px-3 py-1 rounded-lg">#{tag}</span>
                       ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                       <button 
                         onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                         className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${expandedComments[item.id] ? 'bg-indigo-600 text-white shadow-xl' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                       >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          <span className="text-[10px] font-black uppercase tracking-widest">Respon ({getCommentCount(item.id)})</span>
                       </button>

                       {role === 'ADMIN' && (
                         <div className="flex gap-2">
                            <button 
                              onClick={() => { setSelectedNews(item); setIsEditing(true); }}
                              className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id, item.title)}
                              className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-2xl transition-all"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                         </div>
                       )}
                    </div>

                    {expandedComments[item.id] && (
                      <div className="mt-10 pt-10 border-t border-slate-50 animate-page-enter">
                        <CommentSection parentId={item.id} role={role} />
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
