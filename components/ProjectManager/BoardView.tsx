import React from 'react';
import { Trash2, Clock, User, CheckSquare } from 'lucide-react';
import { Project, Task, User as UserType } from '../../types';

interface BoardViewProps {
  tasks: Task[];
  projects?: Project[];
  users: UserType[];
  activeProjectId: string | null;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onEditTask: (task: Task) => void;
  onEditProject: (project: Project) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  projects = [],
  users,
  activeProjectId,
  onUpdateTask,
  onDeleteTask,
  onUpdateProject,
  onDeleteProject,
  onEditTask,
  onEditProject
}) => {
  
  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  // -- RENDER PROJECTS BOARD (OVERVIEW) --
  if (!activeProjectId) {
    const moveProject = (project: Project, newStatus: 'active' | 'on-hold' | 'completed') => {
      onUpdateProject({ ...project, status: newStatus });
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
        {/* Active Column */}
        <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 flex flex-col">
          <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500" /> Projets Actifs
            <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">{projects.filter(p => !p.status || p.status === 'active').length}</span>
          </h3>
          <div className="space-y-3">
             {projects.filter(p => !p.status || p.status === 'active').map(proj => (
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30 cursor-pointer hover:border-blue-300 transition-all" onDoubleClick={() => onEditProject(proj)}>
                   <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 dark:text-white">{proj.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="text-slate-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                   </div>
                   <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span className={`px-2 py-0.5 rounded border ${proj.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                         {proj.priority === 'high' ? 'Haute' : proj.priority === 'low' ? 'Basse' : 'Moyenne'}
                      </span>
                      {proj.endDate && <span>Fin: {new Date(proj.endDate).toLocaleDateString()}</span>}
                   </div>
                   {proj.members && proj.members.length > 0 && (
                     <div className="flex -space-x-1 mt-3">
                       {proj.members.slice(0, 4).map(mid => {
                         const user = users.find(u => u.id === mid);
                         return user ? (
                           <div key={user.id} className={`w-5 h-5 rounded-full ${user.color} border border-white dark:border-slate-800 flex items-center justify-center text-[8px] text-white font-bold`} title={user.name}>
                             {getInitials(user.name)}
                           </div>
                         ) : null;
                       })}
                       {proj.members.length > 4 && <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[8px] text-slate-600 border border-white">+{proj.members.length - 4}</div>}
                     </div>
                   )}
                   <div className="grid grid-cols-2 gap-2 mt-3 no-print">
                      <button onClick={(e) => { e.stopPropagation(); moveProject(proj, 'on-hold'); }} className="py-1.5 bg-orange-50 text-orange-600 rounded text-xs font-medium hover:bg-orange-100">Pause</button>
                      <button onClick={(e) => { e.stopPropagation(); moveProject(proj, 'completed'); }} className="py-1.5 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100">Terminer &rarr;</button>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* On Hold Column */}
        <div className="bg-orange-50/50 dark:bg-orange-900/10 rounded-xl p-4 flex flex-col">
          <h3 className="font-semibold text-orange-700 dark:text-orange-300 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500" /> En Pause
            <span className="ml-auto text-xs bg-orange-100 dark:bg-orange-900 px-2 py-0.5 rounded-full">{projects.filter(p => p.status === 'on-hold').length}</span>
          </h3>
           <div className="space-y-3">
             {projects.filter(p => p.status === 'on-hold').map(proj => (
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/30 cursor-pointer" onDoubleClick={() => onEditProject(proj)}>
                   <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 dark:text-white">{proj.name}</p>
                   </div>
                   <div className="mt-3 no-print">
                      <button onClick={(e) => { e.stopPropagation(); moveProject(proj, 'active'); }} className="w-full py-1.5 bg-blue-50 text-blue-600 rounded text-xs font-medium hover:bg-blue-100">Reprendre</button>
                   </div>
                </div>
             ))}
          </div>
        </div>

        {/* Completed Column */}
        <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 flex flex-col">
          <h3 className="font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" /> Terminés
            <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">{projects.filter(p => p.status === 'completed').length}</span>
          </h3>
          <div className="space-y-3">
             {projects.filter(p => p.status === 'completed').map(proj => (
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-green-900/30 opacity-75" onDoubleClick={() => onEditProject(proj)}>
                   <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-800 dark:text-white line-through">{proj.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }} className="text-slate-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                   </div>
                   <div className="mt-3 no-print">
                      <button onClick={(e) => { e.stopPropagation(); moveProject(proj, 'active'); }} className="w-full py-1.5 bg-slate-50 text-slate-600 rounded text-xs font-medium hover:bg-slate-100">Réouvrir</button>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // -- RENDER TASKS BOARD --
  const moveTask = (task: Task, newStatus: 'todo' | 'in-progress' | 'done') => {
    onUpdateTask({ ...task, status: newStatus });
  };

  const renderTaskCard = (task: Task) => {
    const assignee = users.find(u => u.id === task.assignee);
    const subtasks = task.subtasks || [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;

    return (
      <div 
        key={task.id} 
        className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing group hover:border-blue-400 transition-colors"
        onDoubleClick={(e) => { e.stopPropagation(); onEditTask(task); }}
      >
          <div className="flex justify-between items-start mb-2">
            <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
            <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14}/></button>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className={`px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 border-slate-100 dark:bg-slate-700 dark:border-slate-600'}`}>
              {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Bas'}
            </span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              {new Date(task.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
            </div>
          </div>
          
          {subtasks.length > 0 && (
             <div className="mt-2 mb-2">
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                   <div className="flex items-center gap-1"><CheckSquare size={10} /> Checklist</div>
                   <span>{completedSubtasks}/{subtasks.length}</span>
                </div>
                <div className="h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500" style={{ width: `${(completedSubtasks/subtasks.length)*100}%` }}></div>
                </div>
             </div>
          )}

          <div className="flex items-center justify-between mt-3">
             {assignee ? (
               <div className="flex items-center gap-1.5" title={`Assigné à ${assignee.name}`}>
                  <div className={`w-5 h-5 rounded-full ${assignee.color} flex items-center justify-center text-[9px] text-white font-bold`}>
                     {getInitials(assignee.name)}
                  </div>
                  <span className="text-[10px] text-slate-500">{assignee.name.split(' ')[0]}</span>
               </div>
             ) : (
                <span className="text-[10px] text-slate-400 flex items-center gap-1"><User size={10} /> Non assigné</span>
             )}
          </div>

          {task.status !== 'done' ? (
             <button onClick={() => moveTask(task, task.status === 'todo' ? 'in-progress' : 'done')} className="mt-2 w-full py-1.5 bg-slate-50 text-slate-600 dark:bg-slate-700/50 dark:text-slate-400 rounded text-xs font-medium hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 no-print">
               {task.status === 'todo' ? 'Démarrer ->' : 'Terminer ->'}
             </button>
          ) : (
             <button onClick={() => moveTask(task, 'in-progress')} className="mt-2 w-full text-xs text-slate-400 hover:text-blue-500 text-center py-1 no-print">
               Réouvrir
             </button>
          )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
      
      {/* Column: TODO */}
      <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 flex flex-col">
        <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-slate-400" /> À faire
          <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'todo').length}</span>
        </h3>
        <div className="space-y-3">
          {tasks.filter(t => t.status === 'todo').map(task => renderTaskCard(task))}
        </div>
      </div>

      {/* Column: IN PROGRESS */}
      <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 flex flex-col">
        <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> En cours
          <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'in-progress').length}</span>
        </h3>
        <div className="space-y-3">
          {tasks.filter(t => t.status === 'in-progress').map(task => renderTaskCard(task))}
        </div>
      </div>

      {/* Column: DONE */}
      <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 flex flex-col">
        <h3 className="font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" /> Terminé
          <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === 'done').length}</span>
        </h3>
        <div className="space-y-3">
          {tasks.filter(t => t.status === 'done').map(task => renderTaskCard(task))}
        </div>
      </div>

    </div>
  );
};