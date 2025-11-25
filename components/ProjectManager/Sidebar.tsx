import React from 'react';
import { Plus, Trash2, LayoutGrid } from 'lucide-react';
import { Project } from '../../types';

interface SidebarProps {
  projects: Project[];
  activeProjectId: string | null;
  canCreate: boolean;
  onSelectProject: (id: string | null) => void;
  onAddProjectClick: () => void;
  onDeleteProject: (id: string) => void;
  onEditProject: (project: Project) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  projects, 
  activeProjectId,
  canCreate,
  onSelectProject, 
  onAddProjectClick, 
  onDeleteProject,
  onEditProject 
}) => {

  return (
    <div className="hidden md:flex w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col print:hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
         <h2 className="font-bold text-slate-800 dark:text-white">Projets</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {canCreate && (
          <button 
            onClick={onAddProjectClick}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 mb-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all font-medium text-sm shadow-md shadow-blue-500/20"
          >
            <Plus size={18} />
            <span>Créer un projet</span>
          </button>
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
           <span className="font-medium text-sm">Vue d'ensemble</span>
        </div>
        
        <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-2"></div>

        {projects.map(project => (
          <div 
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            onDoubleClick={() => onEditProject(project)}
            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
              activeProjectId === project.id 
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
             <div className="flex items-center gap-2 truncate">
               <div className={`w-2 h-2 rounded-full ${project.color}`} />
               <span className="font-medium text-sm truncate">{project.name}</span>
             </div>
             {activeProjectId === project.id && (
               <button 
                  onClick={(e) => { e.stopPropagation(); onDeleteProject(project.id); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-opacity"
               >
                 <Trash2 size={14} />
               </button>
             )}
          </div>
        ))}
        
        {projects.length === 0 && (
          <div className="text-center p-4 text-xs text-slate-400">
            Aucun projet. Créez-en un pour commencer.
          </div>
        )}
      </div>
    </div>
  );
};
