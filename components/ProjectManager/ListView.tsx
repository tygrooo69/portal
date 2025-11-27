
import React, { useState, Fragment } from 'react';
import { Trash2, ShieldCheck, ChevronRight, ChevronDown, CornerDownRight, Clock, CheckSquare } from 'lucide-react';
import { Project, Task, User } from '../../types';

interface ListViewProps {
  items: (Project | Task)[];
  isProjects: boolean;
  users: User[];
  allTasks?: Task[];
  onDelete: (id: string) => void;
  onEdit: (item: any) => void;
  onUpdateTaskStatus?: (task: Task, status: 'todo' | 'in-progress' | 'done') => void;
}

export const ListView: React.FC<ListViewProps> = ({ items, isProjects, users, allTasks = [], onDelete, onEdit, onUpdateTaskStatus }) => {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const toggleProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
          <tr>
            {isProjects && <th className="px-2 py-4 w-8"></th>}
            <th className="px-6 py-4">Statut</th>
            <th className="px-6 py-4">{isProjects ? 'Projet' : 'Tâche'}</th>
            <th className="px-6 py-4">Description</th>
            <th className="px-6 py-4">{isProjects ? 'Équipe' : 'Assigné à'}</th>
            {isProjects && <th className="px-6 py-4">Responsable</th>}
            <th className="px-6 py-4">Priorité</th>
            <th className="px-6 py-4">Début</th>
            <th className="px-6 py-4">Fin</th>
            <th className="px-6 py-4 text-right print:hidden">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {items.map(item => {
             const status = (item as any).status;
             const isDone = status === 'done' || status === 'completed';
             const isExpanded = isProjects && expandedProjects.includes(item.id);
             
             // Badge de statut pour les tâches
             const getTaskStatusBadge = (s: string) => {
               switch(s) {
                 case 'in-progress': return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">En cours</span>;
                 case 'done': return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-800">Terminé</span>;
                 default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300">À faire</span>;
               }
             };

             // Badge de statut pour les projets
             const getProjectStatusBadge = (s: string) => {
                switch(s) {
                  case 'completed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-800">Terminé</span>;
                  case 'on-hold': return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800">En pause</span>;
                  default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800">Actif</span>;
                }
             };

             // Team / Assignee Renderer
             const renderUsers = () => {
               if (isProjects) {
                 const members = (item as Project).members || [];
                 if (members.length === 0) return <span className="text-slate-400">-</span>;
                 return (
                   <div className="flex -space-x-1.5">
                      {members.slice(0, 3).map(mid => {
                        const u = users.find(user => user.id === mid);
                        if(!u) return null;
                        return (
                          <div key={u.id} className={`w-6 h-6 rounded-full ${u.color} border border-white dark:border-slate-800 flex items-center justify-center text-[9px] text-white font-bold`} title={u.name}>
                            {getInitials(u.name)}
                          </div>
                        );
                      })}
                      {members.length > 3 && <div className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[9px] text-slate-600 font-medium">+{members.length - 3}</div>}
                   </div>
                 );
               } else {
                 const assigneeId = (item as Task).assignee;
                 const assignee = users.find(u => u.id === assigneeId);
                 if (!assignee) return <span className="text-slate-400">-</span>;
                 return (
                   <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded-full ${assignee.color} flex items-center justify-center text-[10px] text-white font-bold`}>
                        {getInitials(assignee.name)}
                      </div>
                      <span className="text-slate-700 dark:text-slate-300">{assignee.name}</span>
                   </div>
                 );
               }
             };

             // Manager Renderer
             const renderManager = () => {
               const managerId = (item as Project).managerId;
               const manager = users.find(u => u.id === managerId);
               if (!manager) return <span className="text-slate-400 text-xs italic">Non assigné</span>;
               return (
                 <div className="flex items-center gap-2">
                    <ShieldCheck size={14} className="text-blue-500" />
                    <span className="text-slate-700 dark:text-slate-300 text-xs font-medium">{manager.name}</span>
                 </div>
               );
             };

             return (
              <Fragment key={item.id}>
                <tr 
                  className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isDone && !isProjects ? 'opacity-60 bg-slate-50/50' : ''} ${isExpanded ? 'bg-slate-50 dark:bg-slate-800/50' : ''}`}
                  onDoubleClick={() => onEdit(item)}
                  onClick={isProjects ? (e) => toggleProject(e, item.id) : undefined}
                >
                  {isProjects && (
                    <td className="px-2 py-4 text-center">
                      <button 
                        onClick={(e) => toggleProject(e, item.id)}
                        className="p-1 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                  )}

                  <td className="px-6 py-4">
                    {isProjects ? (
                      getProjectStatusBadge(status)
                    ) : (
                      getTaskStatusBadge(status)
                    )}
                  </td>
                  
                  <td className="px-6 py-4">
                    {isProjects ? (
                       <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${(item as Project).color}`} />
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-white block">{(item as Project).name}</span>
                          </div>
                       </div>
                    ) : (
                       <div>
                         <span className={`font-medium ${isDone ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'} block`}>
                           {(item as Task).title}
                         </span>
                       </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate max-w-[200px] block" title={(item as any).description}>
                        {(item as any).description || '-'}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                     {renderUsers()}
                  </td>

                  {isProjects && (
                    <td className="px-6 py-4">
                      {renderManager()}
                    </td>
                  )}

                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                        item.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                        item.priority === 'low' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                        'bg-blue-50 text-blue-600 border-blue-100'
                     }`}>
                        {item.priority === 'high' ? 'Haute' : item.priority === 'low' ? 'Basse' : 'Moyenne'}
                     </span>
                  </td>
                  
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                    {item.endDate ? new Date(item.endDate).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-right print:hidden">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>

                {/* Drill Down Sub-Row */}
                {isExpanded && isProjects && (
                  <tr className="bg-slate-50/50 dark:bg-slate-900/30 animate-in fade-in duration-200">
                    <td colSpan={10} className="p-4 pl-12">
                       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                          <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 text-xs font-semibold text-slate-500">
                             <CornerDownRight size={14} />
                             Tâches du projet
                          </div>
                          {allTasks.filter(t => t.projectId === item.id).length === 0 ? (
                             <div className="p-4 text-center text-slate-400 text-sm italic">Aucune tâche associée.</div>
                          ) : (
                             <table className="w-full text-xs text-left">
                                <thead>
                                   <tr className="text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                      <th className="px-4 py-2 w-8"></th>
                                      <th className="px-4 py-2">Titre</th>
                                      <th className="px-4 py-2">Description</th>
                                      <th className="px-4 py-2">Assigné à</th>
                                      <th className="px-4 py-2">Échéance</th>
                                      <th className="px-4 py-2 text-right">Priorité</th>
                                   </tr>
                                </thead>
                                <tbody>
                                   {allTasks.filter(t => t.projectId === item.id).map(task => {
                                      const assignee = users.find(u => u.id === task.assignee);
                                      return (
                                        <tr key={task.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 border-b border-slate-50 dark:border-slate-800 last:border-0 transition-colors">
                                           <td className="px-4 py-2">
                                              {onUpdateTaskStatus && (
                                                <button 
                                                  onClick={() => onUpdateTaskStatus(task, task.status === 'done' ? 'in-progress' : 'done')}
                                                  className={`w-4 h-4 rounded border flex items-center justify-center ${task.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-slate-300 hover:border-blue-500'}`}
                                                >
                                                   {task.status === 'done' && <CheckSquare size={10} />}
                                                </button>
                                              )}
                                           </td>
                                           <td className={`px-4 py-2 font-medium ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                              {task.title}
                                           </td>
                                           <td className="px-4 py-2 text-slate-500 truncate max-w-[150px]" title={task.description}>
                                              {task.description || '-'}
                                           </td>
                                           <td className="px-4 py-2 text-slate-500">
                                              {assignee ? assignee.name : '-'}
                                           </td>
                                           <td className="px-4 py-2 text-slate-500">
                                              {new Date(task.endDate).toLocaleDateString()}
                                           </td>
                                           <td className="px-4 py-2 text-right">
                                              <span className={`px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 border-slate-100 text-slate-500'}`}>
                                                {task.priority === 'high' ? 'Urgent' : 'Normal'}
                                              </span>
                                           </td>
                                        </tr>
                                      );
                                   })}
                                </tbody>
                             </table>
                          )}
                       </div>
                    </td>
                  </tr>
                )}
              </Fragment>
             );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={isProjects ? 10 : 8} className="px-6 py-8 text-center text-slate-400">
                {isProjects ? 'Aucun projet trouvé.' : 'Aucune tâche.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
