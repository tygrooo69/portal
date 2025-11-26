import React, { useState, useEffect, useRef } from 'react';
import { X, Save, Trash2, Users, Send, CheckSquare, MessageSquare, List, AlertTriangle, Link, Search, ShieldCheck, UserMinus } from 'lucide-react';
import { Project, Task, User, Comment, Subtask } from '../../types';

// ConfirmModal removed - imported from shared component in parent

interface TaskModalProps {
  task: Task | Partial<Task> | null;
  users: User[];
  allTasks?: Task[]; // To select dependencies
  comments?: Comment[];
  currentUser?: User | null;
  onSave: (task: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onAddComment?: (comment: Comment) => void;
  isNew?: boolean;
}

type Tab = 'details' | 'checklist' | 'comments';

export const TaskModal: React.FC<TaskModalProps> = ({ 
  task, users, allTasks = [], comments = [], currentUser, 
  onSave, onDelete, onClose, onAddComment, isNew 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assignee: '',
    subtasks: [],
    dependencies: []
  });

  // Comments State
  const [newComment, setNewComment] = useState('');
  const commentsEndRef = useRef<HTMLDivElement>(null);

  // Subtasks State
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({ 
        ...formData, 
        ...task,
        description: task.description || '',
        assignee: task.assignee || '',
        subtasks: task.subtasks || [],
        dependencies: task.dependencies || []
      });
    }
  }, [task]);

  // Scroll to bottom of comments when tab changes or new comment added
  useEffect(() => {
    if (activeTab === 'comments' && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeTab, comments]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleDependency = (targetTaskId: string) => {
    const currentDeps = formData.dependencies || [];
    if (currentDeps.includes(targetTaskId)) {
      setFormData({ ...formData, dependencies: currentDeps.filter(id => id !== targetTaskId) });
    } else {
      setFormData({ ...formData, dependencies: [...currentDeps, targetTaskId] });
    }
  };

  // --- Subtask Logic ---
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    const sub: Subtask = {
      id: Date.now().toString(),
      title: newSubtaskTitle,
      completed: false
    };
    setFormData(prev => ({ ...prev, subtasks: [...(prev.subtasks || []), sub] }));
    setNewSubtaskTitle('');
  };

  const toggleSubtask = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.map(s => s.id === subId ? { ...s, completed: !s.completed } : s)
    }));
  };

  const deleteSubtask = (subId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks?.filter(s => s.id !== subId)
    }));
  };

  // --- Comment Logic ---
  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !task?.id || !onAddComment) return;

    const comment: Comment = {
      id: Date.now().toString(),
      taskId: task.id,
      userId: currentUser.id,
      text: newComment,
      createdAt: new Date().toISOString()
    };

    onAddComment(comment);
    setNewComment('');
  };

  const taskComments = comments.filter(c => c.taskId === task?.id).sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  // Filter out self from dependencies list
  const availableDependencies = allTasks.filter(t => t.id !== task?.id);

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  if (!task && !isNew) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-0 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-start p-6 pb-2">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isNew ? 'Nouvelle tâche' : 'Modifier la tâche'}</h2>
            {!isNew && <p className="text-xs text-slate-500 mt-1">{formData.title}</p>}
          </div>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        
        {/* Tabs */}
        {!isNew && (
          <div className="flex items-center gap-1 px-6 border-b border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('details')}
              className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'details' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Détails
            </button>
            <button 
              onClick={() => setActiveTab('checklist')}
              className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'checklist' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Checklist ({formData.subtasks?.filter(s => s.completed).length || 0}/{formData.subtasks?.length || 0})
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className={`pb-2 px-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'comments' ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
               Discussion ({taskComments.length})
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'details' && (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titre</label>
                <input 
                  type="text" 
                  required 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
                  placeholder="Nom de la tâche..."
                  autoFocus={isNew}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <textarea 
                  rows={2}
                  value={formData.description || ''} 
                  onChange={(e) => setFormData({...formData, description: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none" 
                  placeholder="Détails de la tâche..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Responsable</label>
                <select 
                  value={formData.assignee || ''} 
                  onChange={(e) => setFormData({...formData, assignee: e.target.value})} 
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                >
                  <option value="">Non assigné</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
                  <input type="date" required value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
                  <input type="date" required value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Priorité</label>
                  <select value={formData.priority} onChange={(e) => setFormData({...formData, priority: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
                  <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                    <option value="todo">À faire</option>
                    <option value="in-progress">En cours</option>
                    <option value="done">Terminé</option>
                  </select>
                </div>
              </div>

              {/* Dependencies Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
                  <Link size={12} /> Tâches prérequises (Doivent finir avant que celle-ci commence)
                </label>
                {availableDependencies.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Pas d'autres tâches disponibles dans ce projet.</p>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                     {availableDependencies.map(depTask => {
                       const isSelected = (formData.dependencies || []).includes(depTask.id);
                       return (
                         <div 
                           key={depTask.id}
                           onClick={() => toggleDependency(depTask.id)}
                           className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs mb-1 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent text-slate-600 dark:text-slate-400'}`}
                         >
                            <div className={`w-3 h-3 rounded-full border ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-400'}`} />
                            <span className="truncate">{depTask.title}</span>
                         </div>
                       );
                     })}
                  </div>
                )}
              </div>
            </form>
          )}

          {activeTab === 'checklist' && (
            <div className="space-y-4">
               {/* Progress Bar */}
               <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                 <div 
                   className="bg-blue-600 h-full transition-all duration-300"
                   style={{ width: `${formData.subtasks && formData.subtasks.length > 0 ? (formData.subtasks.filter(s => s.completed).length / formData.subtasks.length) * 100 : 0}%` }}
                 />
               </div>

               {/* Add Subtask */}
               <form onSubmit={handleAddSubtask} className="flex gap-2">
                 <input 
                   type="text" 
                   value={newSubtaskTitle}
                   onChange={e => setNewSubtaskTitle(e.target.value)}
                   placeholder="Ajouter une sous-tâche..."
                   className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                 />
                 <button type="submit" disabled={!newSubtaskTitle.trim()} className="p-2 bg-blue-100 text-blue-600 rounded-lg disabled:opacity-50"><List size={18} /></button>
               </form>

               {/* List */}
               <div className="space-y-2">
                 {formData.subtasks?.map(sub => (
                   <div key={sub.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg group">
                      <button 
                        type="button"
                        onClick={() => toggleSubtask(sub.id)}
                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${sub.completed ? 'bg-blue-500 border-blue-500 text-white' : 'border-slate-300 dark:border-slate-600'}`}
                      >
                        {sub.completed && <CheckSquare size={12} />}
                      </button>
                      <span className={`flex-1 text-sm ${sub.completed ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>{sub.title}</span>
                      <button type="button" onClick={() => deleteSubtask(sub.id)} className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                   </div>
                 ))}
                 {(!formData.subtasks || formData.subtasks.length === 0) && (
                   <p className="text-center text-xs text-slate-400 py-4">Pas de sous-tâches.</p>
                 )}
               </div>
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="flex flex-col h-[350px]">
               <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                 {taskComments.map(comment => {
                   const user = users.find(u => u.id === comment.userId);
                   const isMe = currentUser?.id === comment.userId;
                   return (
                     <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full ${user?.color || 'bg-slate-400'} flex-shrink-0 flex items-center justify-center text-xs text-white font-bold`}>
                           {user ? getInitials(user.name) : '?'}
                        </div>
                        <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[80%]`}>
                           <div className={`px-3 py-2 rounded-xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'}`}>
                             {comment.text}
                           </div>
                           <span className="text-[10px] text-slate-400 mt-1">
                             {user?.name} • {new Date(comment.createdAt).toLocaleString()}
                           </span>
                        </div>
                     </div>
                   );
                 })}
                 {taskComments.length === 0 && (
                   <div className="text-center text-slate-400 text-sm py-10">Aucun commentaire. Commencez la discussion !</div>
                 )}
                 <div ref={commentsEndRef} />
               </div>

               <form onSubmit={handlePostComment} className="flex gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
                  <input 
                    type="text" 
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder="Écrire un commentaire..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                  />
                  <button type="submit" disabled={!newComment.trim()} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    <Send size={18} />
                  </button>
               </form>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {activeTab !== 'comments' && (
          <div className="p-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
            {!isNew && onDelete && formData.id && (
              <button type="button" onClick={() => onDelete(formData.id!)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Trash2 size={16} /> Supprimer</button>
            )}
            <div className={`flex gap-2 ${isNew ? 'w-full justify-end' : ''}`}>
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Fermer</button>
              <button type="button" onClick={() => onSave(formData)} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Save size={16} /> Enregistrer</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface ProjectModalProps {
  project: Project | Partial<Project> | null;
  users: User[];
  allProjects?: Project[]; // For dependencies
  onSave: (project: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isNew?: boolean;
  currentUser?: User | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, users, allProjects = [], onSave, onDelete, onClose, isNew, currentUser }) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    priority: 'medium',
    status: 'active',
    members: [],
    dependencies: [],
    managerId: ''
  });

  const [searchMemberQuery, setSearchMemberQuery] = useState('');

  useEffect(() => {
    if (project) {
      setFormData({ 
        ...formData, 
        ...project,
        members: project.members || [],
        dependencies: project.dependencies || [],
        managerId: project.managerId || ''
      });
    } else {
      // New project, set creator as default manager
      if (currentUser) {
        setFormData(prev => ({ ...prev, managerId: currentUser.id }));
      }
    }
  }, [project, currentUser]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const addMember = (userId: string) => {
    const currentMembers = formData.members || [];
    if (!currentMembers.includes(userId)) {
      setFormData({ ...formData, members: [...currentMembers, userId] });
    }
  };

  const removeMember = (userId: string) => {
    const currentMembers = formData.members || [];
    setFormData({ ...formData, members: currentMembers.filter(id => id !== userId) });
  };

  const toggleDependency = (projectId: string) => {
    const currentDeps = formData.dependencies || [];
    if (currentDeps.includes(projectId)) {
      setFormData({ ...formData, dependencies: currentDeps.filter(id => id !== projectId) });
    } else {
      setFormData({ ...formData, dependencies: [...currentDeps, projectId] });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const availableDependencies = allProjects.filter(p => p.id !== project?.id);

  // Filter users for search list, excluding those already selected
  const availableUsers = users.filter(u => 
    (u.name.toLowerCase().includes(searchMemberQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(searchMemberQuery.toLowerCase())) &&
    !(formData.members || []).includes(u.id)
  );

  const canChangeManager = isNew || (currentUser && (currentUser.role === 'admin' || currentUser.id === formData.managerId));

  if (!project && !isNew) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-6 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isNew ? 'Nouveau projet' : 'Modifier le projet'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nom du projet</label>
            <input 
              type="text" 
              required 
              value={formData.name || ''} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" 
              placeholder="Ex: Lancement Site Web"
              autoFocus={isNew}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ''} 
              onChange={(e) => setFormData({...formData, description: e.target.value})} 
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white resize-none" 
              placeholder="Objectif du projet..." 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
              <input type="date" value={formData.startDate || ''} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
              <input type="date" value={formData.endDate || ''} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Priorité</label>
               <select value={formData.priority || 'medium'} onChange={(e) => setFormData({...formData, priority: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                 <option value="low">Basse</option>
                 <option value="medium">Moyenne</option>
                 <option value="high">Haute</option>
               </select>
            </div>
            <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Statut global</label>
               <select value={formData.status || 'active'} onChange={(e) => setFormData({...formData, status: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                 <option value="active">Actif</option>
                 <option value="on-hold">En pause</option>
                 <option value="completed">Terminé</option>
               </select>
            </div>
          </div>

          {/* Project Manager Section */}
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-2">
               <ShieldCheck size={12} /> Responsable du projet
             </label>
             <select 
               value={formData.managerId || ''} 
               onChange={(e) => setFormData({...formData, managerId: e.target.value})}
               disabled={!canChangeManager}
               className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <option value="">Sélectionner un responsable</option>
               {users.map(user => (
                 <option key={user.id} value={user.id}>{user.name}</option>
               ))}
             </select>
             {!canChangeManager && <p className="text-[10px] text-slate-400 mt-1">Seul le responsable actuel peut modifier ce champ.</p>}
          </div>

          {/* Team Selection */}
          <div>
             <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
               <Users size={12} /> Équipe du projet
             </label>
             
             <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-3">
                {/* Selected Members (Chips) */}
                {(formData.members || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.members?.map(memberId => {
                      const user = users.find(u => u.id === memberId);
                      if (!user) return null;
                      return (
                        <div key={user.id} className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-700 rounded-full border border-slate-200 dark:border-slate-600 text-xs shadow-sm">
                           <div className={`w-4 h-4 rounded-full ${user.color} flex items-center justify-center text-[8px] text-white font-bold`}>
                             {getInitials(user.name)}
                           </div>
                           <span className="max-w-[80px] truncate">{user.name}</span>
                           <button type="button" onClick={() => removeMember(user.id)} className="text-slate-400 hover:text-red-500 ml-1"><X size={12} /></button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Search and Add */}
                <div className="relative">
                   <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                   <input 
                     type="text" 
                     placeholder="Rechercher un membre..."
                     value={searchMemberQuery}
                     onChange={(e) => setSearchMemberQuery(e.target.value)}
                     className="w-full pl-8 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                   />
                </div>

                {/* Available Users List */}
                <div className="max-h-32 overflow-y-auto space-y-1">
                   {availableUsers.map(user => (
                     <div 
                       key={user.id} 
                       onClick={() => addMember(user.id)}
                       className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer group"
                     >
                        <div className={`w-5 h-5 rounded-full ${user.color} flex items-center justify-center text-[8px] text-white font-bold`}>
                           {getInitials(user.name)}
                        </div>
                        <span className="text-xs text-slate-700 dark:text-slate-300 flex-1">{user.name}</span>
                        <Users size={12} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                     </div>
                   ))}
                   {availableUsers.length === 0 && searchMemberQuery && (
                     <p className="text-xs text-slate-400 text-center py-2">Aucun autre membre trouvé.</p>
                   )}
                </div>
             </div>
          </div>

          {/* Dependencies Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
              <Link size={12} /> Projets prérequis
            </label>
            {availableDependencies.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Pas d'autres projets disponibles.</p>
            ) : (
              <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                 {availableDependencies.map(depProj => {
                   const isSelected = (formData.dependencies || []).includes(depProj.id);
                   return (
                     <div 
                       key={depProj.id}
                       onClick={() => toggleDependency(depProj.id)}
                       className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs mb-1 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent text-slate-600 dark:text-slate-400'}`}
                     >
                        <div className={`w-3 h-3 rounded-full ${depProj.color}`} />
                        <span className="truncate">{depProj.name}</span>
                     </div>
                   );
                 })}
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
            {!isNew && onDelete && formData.id && (
              <button type="button" onClick={() => onDelete(formData.id!)} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Trash2 size={16} /> Supprimer</button>
            )}
            <div className={`flex gap-2 ${isNew ? 'w-full justify-end' : ''}`}>
              <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Annuler</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Save size={16} /> Enregistrer</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};