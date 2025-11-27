import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Project, Comment, User } from '../../types';

interface DiscussionViewProps {
  project: Project;
  comments: Comment[];
  users: User[];
  currentUser: User | null;
  onAddComment: (comment: Comment) => void;
}

export const DiscussionView: React.FC<DiscussionViewProps> = ({ 
  project, 
  comments, 
  users, 
  currentUser, 
  onAddComment 
}) => {
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Filter comments for this project
  const projectComments = comments
    .filter(c => c.projectId === project.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [projectComments.length]);

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser) return;

    const comment: Comment = {
      id: Date.now().toString(),
      projectId: project.id,
      userId: currentUser.id,
      text: newComment,
      createdAt: new Date().toISOString()
    };

    onAddComment(comment);
    setNewComment('');
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center gap-2">
        <MessageSquare className="text-blue-600 dark:text-blue-400" size={20} />
        <div>
          <h3 className="font-bold text-slate-800 dark:text-white">Discussion du projet</h3>
          <p className="text-xs text-slate-500">{project.name}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-50 dark:bg-slate-950">
        {projectComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <MessageSquare size={32} />
            </div>
            <p>Aucun message pour le moment.</p>
            <p className="text-sm">Commencez la discussion avec votre équipe !</p>
          </div>
        ) : (
          projectComments.map((comment) => {
            const user = users.find(u => u.id === comment.userId);
            const isMe = currentUser?.id === comment.userId;

            return (
              <div key={comment.id} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div className={`w-10 h-10 rounded-full ${user?.color || 'bg-slate-400'} flex-shrink-0 flex items-center justify-center text-xs text-white font-bold shadow-sm border-2 border-white dark:border-slate-800`}>
                  {user ? getInitials(user.name) : '?'}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[70%]`}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{user?.name}</span>
                    <span className="text-[10px] text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                  </div>
                  <div 
                    className={`px-4 py-3 rounded-2xl text-sm shadow-sm leading-relaxed whitespace-pre-wrap ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {comment.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={commentsEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <form onSubmit={handlePostComment} className="flex gap-3">
          <input 
            type="text" 
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Écrire un message à l'équipe..."
            className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-blue-500 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500/20 outline-none dark:text-white transition-all"
          />
          <button 
            type="submit" 
            disabled={!newComment.trim()} 
            className="px-4 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center shadow-lg shadow-blue-500/30"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};