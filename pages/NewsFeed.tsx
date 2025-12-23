
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
        const cloudData = docSnap.data().data;
        setNews(cloudData);
        localStorage.setItem(STORAGE_KEYS.NEWS, JSON.stringify(cloudData));
      }
    });
    return () => unsub();
  }, []);

  const handleSave = (data: Partial<NewsItem>) => {
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
    setNews(updatedNews);
    storage.set(STORAGE_KEYS.NEWS, updatedNews);
    setIsEditing(false);
    setSelectedNews(undefined);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Hapus berita ini?')) {
      const updatedNews = news.filter(n => n.id !== id);
      setNews(updatedNews);
      storage.set(STORAGE_KEYS.NEWS, updatedNews);
    }
  };

  const getCommentCount = (newsId: string) => {
    const comments = storage.get<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    return comments.filter(c => c.parentId === newsId).length;
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'Semua' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Semua', 'Pengumuman', 'Kegiatan', 'Keamanan', 'Sosial'];

  if (isEditing) {
    return <NewsEditor onSave={handleSave} onCancel={() => setIsEditing(false)} initialData={selectedNews} />;
  }

  return (
    <div className="space-y-6 px-5 py-4 animate-page-enter">
      {/* Header & Search Section */}
      <div className="bg-white p-8 rounded-[44px] shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Warta RT</h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 opacity-60">Pusat Informasi Digital</p>
          </div>
          {role === 'ADMIN' && (
            <button 
              onClick={() => setIsEditing(true)}
              className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all text-xs uppercase tracking-widest"
            >
              + Buat Berita
            </button>
          )}
        </div>
        
        <div className="relative">
          <input 
            type="text" 
            placeholder="Cari informasi berita..." 
            className="w-full bg-slate-100 border-none rounded-[24px] px-14 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
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
              className={`px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredNews.length === 0 ? (
        <div className="py-24 text-center bg-slate-50 rounded-[44px] border border-dashed border-slate-200">
           <p className="text-slate-400 font-black uppercase text-xs tracking-[0.2em]">Tidak ada berita yang cocok</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 pb-32">
          {filteredNews.map((item) => (
            <div key={item.id} className="bg-white rounded-[44px] overflow-hidden shadow-sm border border-slate-50 group hover:shadow-2xl transition-all duration-500">
              <div className="relative aspect-[16/9] overflow-hidden">
                <img src={item.imageUrl || 'https://via.placeholder.com/800x450?text=SiRT+Digital+News'} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                <div className="absolute top-6 left-6 flex gap-2">
                  <span className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                    {item.category}
                  </span>
                </div>
              </div>
              <div className="p-10 space-y-6">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                  <span className="flex items-center gap-1"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth={2}/></svg>{item.date}</span>
                  <span>•</span>
                  <span>Oleh {item.author}</span>
                </div>
                <h4 className="text-2xl font-black text-slate-800 leading-tight tracking-tight uppercase group-hover:text-indigo-600 transition-colors">{item.title}</h4>
                <p className="text-slate-500 text-base leading-relaxed font-medium line-clamp-3">{item.content}</p>
                
                <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                  <button 
                    onClick={() => setExpandedComments(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all ${expandedComments[item.id] ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    <span className="text-xs font-black uppercase tracking-widest">Tanggapan ({getCommentCount(item.id)})</span>
                  </button>

                  {role === 'ADMIN' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setSelectedNews(item); setIsEditing(true); }}
                        className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-2xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  )}
                </div>

                {expandedComments[item.id] && (
                  <div className="mt-8 pt-8 border-t border-slate-50 animate-page-enter">
                    <CommentSection parentId={item.id} role={role} />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed;
