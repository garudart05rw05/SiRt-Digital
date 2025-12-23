
import React, { useState, useEffect } from 'react';
import { Comment, UserRole } from '../types';
import { storage, STORAGE_KEYS } from '../services/storageService';

interface CommentSectionProps {
  parentId: string;
  role: UserRole;
  title?: string;
  onUpdate?: () => void;
}

const CommentSection: React.FC<CommentSectionProps> = ({ parentId, role, title = "Aspirasi Warga", onUpdate }) => {
  const [comments, setComments] = useState<Comment[]>(() => 
    storage.get(STORAGE_KEYS.COMMENTS, [])
  );
  const [newComment, setNewComment] = useState('');
  const [authorName, setAuthorName] = useState('');

  const filteredComments = comments.filter(c => c.parentId === parentId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      parentId,
      author: authorName.trim() || (role === 'ADMIN' ? 'Admin RT 05' : 'Warga Anonim'),
      text: newComment,
      timestamp: new Date().toISOString()
    };

    const updatedComments = [comment, ...comments];
    setComments(updatedComments);
    storage.set(STORAGE_KEYS.COMMENTS, updatedComments);
    setNewComment('');
    if (onUpdate) onUpdate();
  };

  const handleDelete = (id: string) => {
    if (role !== 'ADMIN') return;
    if (window.confirm('Hapus komentar warga ini secara permanen?')) {
      const updatedComments = comments.filter(c => c.id !== id);
      setComments(updatedComments);
      storage.set(STORAGE_KEYS.COMMENTS, updatedComments);
      if (onUpdate) onUpdate();
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(dateStr).getTime()) / 1000);
    if (seconds < 60) return 'Baru saja';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m lalu`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}j lalu`;
    return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title} ({filteredComments.length})</h4>
      </div>

      {/* Form at Top for Better UX */}
      <form onSubmit={handleSubmit} className="space-y-3 bg-slate-50 p-4 rounded-3xl border border-slate-100">
        <div className="flex gap-2">
          {role !== 'ADMIN' && (
            <input 
              type="text" 
              placeholder="Nama" 
              className="w-28 bg-slate-900 border-none rounded-xl px-4 py-2.5 text-[11px] font-black outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600 transition-all shadow-inner"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
            />
          )}
          <div className="flex-1 flex gap-2">
            <input 
              type="text" 
              placeholder="Sampaikan pendapat Anda..." 
              className="flex-1 bg-slate-900 border-none rounded-xl px-5 py-2.5 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 text-white placeholder-slate-600 transition-all shadow-inner"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={!newComment.trim()}
              className="bg-blue-600 text-white px-4 rounded-xl disabled:opacity-30 active:scale-90 transition-transform shadow-lg shadow-blue-500/20"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredComments.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest opacity-40">Belum ada tanggapan</p>
          </div>
        ) : (
          filteredComments.map(comment => (
            <div key={comment.id} className="flex gap-4 group animate-page-enter">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-[12px] font-black text-white shrink-0 border border-white/10 uppercase shadow-md">
                {comment.author.charAt(0)}
              </div>
              <div className="flex-1 space-y-2">
                <div className="bg-white rounded-3xl rounded-tl-none p-5 border border-slate-100 relative shadow-sm hover:border-slate-200 transition-all">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-tight">{comment.author}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{getTimeAgo(comment.timestamp)}</span>
                      {role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDelete(comment.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus Aspirasi"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">{comment.text}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CommentSection;
