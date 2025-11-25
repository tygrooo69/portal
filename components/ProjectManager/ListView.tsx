import React from 'react';
import { Trash2 } from 'lucide-react';
import { Project, Task } from '../../types';

interface ListViewProps {
  items: (Project | Task)[];
  isProjects: boolean;
  onDelete: (id: string) => void;
  onEdit: (item: any) => void;
  onUpdateTaskStatus?: (task: Task, status: 'todo' | 'in-progress' | 'done') => void;
}

export const ListView: React.FC<ListViewProps> = ({ items, isProjects, onDelete, onEdit, onUpdateTaskStatus }) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
          <tr>
            <th className="px-6 py-4">Statut</th>
            <th className="px-6 py-4">{isProjects ? 'Projet' : 'Tâche'}</th>
            <th className="px-6 py-4">Description</th>
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
             const description = (item as any).description;
             
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

             return (
              <tr 
                key={item.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isDone && !isProjects ? 'opacity-60 bg-slate-50/50' : ''}`}
                onDoubleClick={() => onEdit(item)}
              >
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
                        <span className="font-semibold text-slate-800 dark:text-white">{(item as Project).name}</span>
                     </div>
                  ) : (
                     <span className={`font-medium ${isDone ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                       {(item as Task).title}
                     </span>
                  )}
                </td>

                <td className="px-6 py-4">
                   <p className="text-xs text-slate-500 truncate max-w-[200px]">
                      {description || '-'}
                   </p>
                </td>

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
             );
          })}
          {items.length === 0 && (
            <tr>
              <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                {isProjects ? 'Aucun projet trouvé.' : 'Aucune tâche.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};