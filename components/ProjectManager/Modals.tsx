import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, Users } from 'lucide-react';
import { Project, Task, User } from '../../types';

interface TaskModalProps {
  task: Task | Partial<Task> | null;
  users: User[];
  onSave: (task: Partial<Task>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isNew?: boolean;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, users, onSave, onDelete, onClose, isNew }) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assignee: ''
  });

  useEffect(() => {
    if (task) {
      setFormData({ 
        ...formData, 
        ...task,
        description: task.description || '',
        assignee: task.assignee || ''
      });
    }
  }, [task]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  if (!task && !isNew) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-6 scale-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{isNew ? 'Nouvelle tâche' : 'Modifier la tâche'}</h2>
          <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={3}
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

interface ProjectModalProps {
  project: Project | Partial<Project> | null;
  users: User[];
  onSave: (project: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isNew?: boolean;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ project, users, onSave, onDelete, onClose, isNew }) => {
  const [formData, setFormData] = useState<Partial<Project>>({
    name: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
    priority: 'medium',
    status: 'active',
    members: []
  });

  useEffect(() => {
    if (project) {
      setFormData({ 
        ...formData, 
        ...project,
        members: project.members || []
      });
    }
  }, [project]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const toggleMember = (userId: string) => {
    const currentMembers = formData.members || [];
    if (currentMembers.includes(userId)) {
      setFormData({ ...formData, members: currentMembers.filter(id => id !== userId) });
    } else {
      setFormData({ ...formData, members: [...currentMembers, userId] });
    }
  };

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

          <div>
             <label className="block text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
               <Users size={12} /> Membres de l'équipe
             </label>
             <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 max-h-32 overflow-y-auto">
                {users.map(user => {
                  const isSelected = (formData.members || []).includes(user.id);
                  return (
                    <div 
                      key={user.id} 
                      onClick={() => toggleMember(user.id)}
                      className={`flex items-center gap-2 p-1.5 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800' : 'hover:bg-slate-200 dark:hover:bg-slate-700 border border-transparent'}`}
                    >
                       <div className={`w-5 h-5 rounded-full ${user.color} flex items-center justify-center text-[10px] text-white font-bold`}>
                         {user.name.charAt(0)}
                       </div>
                       <span className={`text-xs ${isSelected ? 'font-medium text-blue-700 dark:text-blue-300' : 'text-slate-600 dark:text-slate-400'}`}>{user.name}</span>
                    </div>
                  );
                })}
             </div>
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