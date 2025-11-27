
import React, { useState } from 'react';
import { Plus, Trash2, LayoutGrid, ChevronRight, ChevronDown, CheckSquare } from 'lucide-react';
import { Project, Task } from '../../types';

interface SidebarProps {
  projects: Project[];
  tasks: Task[];
  activeProjectId: string | null;
  canCreate: boolean;
  onSelectProject: (id: string | null) => void;
  onAddProjectClick: () => void;
  onAddTaskClick: () => void;
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
  onEditTask: (task: Task) => void;
  width?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  tasks,
  activeProjectId,
  canCreate,
  onSelectProject, 
  onAddProjectClick, 
  onAddTaskClick,
  onDeleteProject,
  onEditProject,
  onEditTask,
  width = 256 // Default width equivalent to w-64
}) => {
  const [expandedProjects, setExpandedProjects] = useState<string[]>([]);

  const toggleProject = (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    setExpandedProjects(prev => 
      prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
    );
  };

  // Filter out completed projects for the sidebar list
  const visibleProjects = projects.filter(p => p.status !== 'completed');

  return (
    <div 
      style={{ width: width }}
      className="hidden md:flex bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col print:hidden flex-shrink-0 transition-none"
    >
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
         <h2 className="font-bold text-slate-800 dark:text-white">Projets</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {canCreate && (
          activeProjectId ? (
             <button 
                onClick={onAddTaskClick}
                className="w-full flex items-center justify-center gap-2 px-3 py-3 mb-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold text-sm shadow-lg shadow-indigo-500/20 hover:scale-[1.02]"
              >
                <Plus size={20} />
                <span>Nouvelle Tâche</span>
              </button>
          ) : (
            <button 
              onClick={onAddProjectClick}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm shadow-md shadow-blue-500/20"
            >
              <Plus size={18} />
              <span>Créer un projet</span>
            </button>
          )
        )}

        <div 
           onClick={() => onSelectProject(null)}
           className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-2 ${
              activeProjectId === null
                ? 'bg-slate-800 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
           }`}
        >
           <LayoutGrid size={16} />
           <span className="font-medium text-sm truncate">Vue d'ensemble</span>
        </div>
        
        <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-2"></div>

        {visibleProjects.map(project => {
          const isExpanded = expandedProjects.includes(project.id);
          const projectTasks = tasks.filter(t => t.projectId === project.id && t.status !== 'done');

          return (
            <div key={project.id} className="mb-1">
              <div 
                onClick={() => onSelectProject(project.id)}
                onDoubleClick={() => onEditProject(project)}
                className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  activeProjectId === project.id 
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                 <div className="flex items-center gap-2 truncate overflow-hidden flex-1">
                   <button 
                      onClick={(e) => toggleProject(e, project.id)}
                      className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                   >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                   </button>
                   <div className={`w-2 h-2 rounded-full ${project.color} flex-shrink-0`} />
                   <span className="font-medium text-sm truncate">{project.name}</span>
                 </div>
                 {activeProjectId === project.id && (
                   <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity flex-shrink-0"
                   >
                     <Trash2 size={14} />
                   </button>
                 )}
              </div>

              {/* Tasks Drill-down */}
              {isExpanded && (
                <div className="pl-8 pr-2 mt-1 space-y-0.5 animate-in slide-in-from-top-2 duration-200">
                   {projectTasks.length === 0 ? (
                      <p className="text-[10px] text-slate-400 italic py-1 pl-2">Aucune tâche active</p>
                   ) : (
                      projectTasks.map(task => (
                        <div 
                          key={task.id}
                          onClick={() => onEditTask(task)}
                          className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group/task"
                        >
                           <CheckSquare size={12} className="opacity-50 group-hover/task:opacity-100" />
                           <span className="truncate">{task.title}</span>
                        </div>
                      ))
                   )}
                </div>
              )}
            </div>
          );
        })}
        
        {visibleProjects.length === 0 && (
          <div className="text-center p-4 text-xs text-slate-400">
            Aucun projet actif.
          </div>
        )}
      </div>
    </div>
  );
};
