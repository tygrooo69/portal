import React, { useState, useEffect } from 'react';
import { LayoutGrid, CheckSquare, BarChart2, List, FileSpreadsheet, Printer, Plus } from 'lucide-react';
import { Project, Task } from '../../types';
import { Sidebar } from './Sidebar';
import { GanttView } from './GanttView';
import { BoardView } from './BoardView';
import { ListView } from './ListView';
import { TaskModal, ProjectModal } from './Modals';
import { downloadCsv, getDaysDiff } from './utils';

interface ProjectManagerProps {
  projects: Project[];
  tasks: Task[];
  initialActiveProjectId?: string | null;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  tasks,
  initialActiveProjectId = null,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialActiveProjectId);
  const [viewMode, setViewMode] = useState<'board' | 'gantt' | 'list'>('board');
  
  useEffect(() => {
    if (initialActiveProjectId) {
      setActiveProjectId(initialActiveProjectId);
    }
  }, [initialActiveProjectId]);

  // Modals State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = activeProjectId ? tasks.filter(t => t.projectId === activeProjectId) : [];

  const handleSaveNewProject = (partialProject: Partial<Project>) => {
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const newProject: Project = {
      id: Date.now().toString(),
      name: partialProject.name || 'Nouveau Projet',
      description: partialProject.description || '',
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: new Date().toISOString(),
      priority: partialProject.priority || 'medium',
      status: partialProject.status || 'active',
      startDate: partialProject.startDate || new Date().toISOString().split('T')[0],
      endDate: partialProject.endDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
    };
    onAddProject(newProject);
    setActiveProjectId(newProject.id);
    setIsAddingProject(false);
  };

  const handleSaveNewTask = (partialTask: Partial<Task>) => {
    if (!activeProjectId || !partialTask.title) return;
    const task: Task = {
      id: Date.now().toString(),
      projectId: activeProjectId,
      title: partialTask.title,
      description: partialTask.description,
      status: partialTask.status || 'todo',
      priority: partialTask.priority || 'medium',
      startDate: partialTask.startDate!,
      endDate: partialTask.endDate!
    };
    onAddTask(task);
    setIsAddingTask(false);
  };

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; 
    if (activeProjectId) {
       if (projectTasks.length === 0) return;
       csvContent += "Titre;Description;Statut;Priorité;Date Début;Date Fin;Durée (jours)\n";
       projectTasks.forEach(task => {
        const duration = getDaysDiff(task.startDate, task.endDate);
        const safeTitle = task.title.replace(/"/g, '""');
        const safeDesc = (task.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const row = [`"${safeTitle}"`, `"${safeDesc}"`, task.status, task.priority, task.startDate, task.endDate, duration];
        csvContent += row.join(";") + "\n";
      });
      const filename = activeProject ? `${activeProject.name}_tasks.csv` : 'tasks.csv';
      downloadCsv(csvContent, filename);
    } else {
      if (projects.length === 0) return;
      csvContent += "Nom Projet;Description;Statut;Priorité;Date Début;Date Fin;Durée (jours)\n";
      projects.forEach(proj => {
        const start = proj.startDate || new Date().toISOString().split('T')[0];
        const end = proj.endDate || new Date().toISOString().split('T')[0];
        const duration = getDaysDiff(start, end);
        const safeName = proj.name.replace(/"/g, '""');
        const safeDesc = (proj.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const row = [`"${safeName}"`, `"${safeDesc}"`, proj.status, proj.priority, start, end, duration];
        csvContent += row.join(";") + "\n";
      });
      downloadCsv(csvContent, 'projets_overview.csv');
    }
  };

  return (
    <div className="flex h-full bg-slate-50 dark:bg-slate-950 relative">
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          body > * { display: none !important; }
          body { background: white !important; overflow: visible !important; height: auto !important; }
          #project-printable-area, #project-printable-area * { visibility: visible !important; display: block; }
          #project-printable-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; overflow: visible !important; z-index: 9999 !important; background: white !important; }
          .no-print, button, input, select, ::-webkit-scrollbar { display: none !important; }
        }
      `}</style>
      
      <Sidebar 
        projects={projects}
        activeProjectId={activeProjectId}
        onSelectProject={setActiveProjectId}
        onAddProjectClick={() => setIsAddingProject(true)}
        onDeleteProject={onDeleteProject}
        onEditProject={setEditingProject}
      />

      <div className="flex-1 flex flex-col overflow-hidden" id="project-printable-area">
        {/* Header */}
        <div className="p-6 md:pr-24 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
           {!activeProjectId ? (
             <div>
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="text-slate-400" /> Vue d'ensemble
               </h1>
               <p className="text-slate-500 text-sm mt-1">{projects.length} projets au total</p>
             </div>
           ) : (
             <div onClick={() => activeProject && setEditingProject(activeProject)} className="cursor-pointer group">
               <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{activeProject?.name}</h1>
                 <span className={`px-2 py-0.5 rounded-full text-xs text-white ${activeProject?.color} no-print`}>
                   {activeProject?.status === 'completed' ? 'Terminé' : activeProject?.status === 'on-hold' ? 'En pause' : 'Actif'}
                 </span>
               </div>
               <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                 {projectTasks.length} tâches
               </p>
             </div>
           )}

           <div className="flex items-center gap-3 no-print">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><CheckSquare size={16} /> Tableau</button>
                <button onClick={() => setViewMode('gantt')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><BarChart2 size={16} /> Gantt</button>
                <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><List size={16} /> Liste</button>
              </div>

              <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><FileSpreadsheet size={20} /></button>
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Printer size={20} /></button>
              </div>

              {activeProjectId && (
                <button 
                  onClick={() => setIsAddingTask(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 ml-2"
                >
                  <Plus size={18} /> Nouvelle Tâche
                </button>
              )}
           </div>
        </div>

        {/* Views */}
        <div className="flex-1 overflow-y-auto p-6">
          {viewMode === 'board' && (
             <BoardView 
               tasks={projectTasks} 
               projects={projects}
               activeProjectId={activeProjectId}
               onUpdateTask={onUpdateTask}
               onDeleteTask={onDeleteTask}
               onUpdateProject={onUpdateProject}
               onDeleteProject={onDeleteProject}
               onEditTask={setEditingTask}
               onEditProject={setEditingProject}
             />
          )}

          {viewMode === 'gantt' && (
             <GanttView 
               items={activeProjectId ? projectTasks : projects}
               isProjects={!activeProjectId}
               onUpdateTask={onUpdateTask}
               onUpdateProject={onUpdateProject}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
             />
          )}

          {viewMode === 'list' && (
            <ListView 
               items={activeProjectId ? projectTasks : projects}
               isProjects={!activeProjectId}
               onDelete={activeProjectId ? onDeleteTask : onDeleteProject}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
               onUpdateTaskStatus={(t, s) => onUpdateTask({...t, status: s})}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      
      {/* Creation Task Modal */}
      {isAddingTask && (
        <TaskModal 
           task={null}
           isNew={true}
           onSave={handleSaveNewTask} 
           onClose={() => setIsAddingTask(false)} 
        />
      )}
      
      {/* Editing Task Modal */}
      {editingTask && (
        <TaskModal 
          task={editingTask}
          onSave={(updated) => { onUpdateTask(updated as Task); }}
          onDelete={onDeleteTask}
          onClose={() => setEditingTask(null)}
        />
      )}

      {/* Creation Project Modal */}
      {isAddingProject && (
        <ProjectModal
          project={null}
          isNew={true}
          onSave={handleSaveNewProject}
          onClose={() => setIsAddingProject(false)}
        />
      )}

      {/* Editing Project Modal */}
      {editingProject && (
        <ProjectModal 
          project={editingProject}
          onSave={(updated) => onUpdateProject(updated as Project)}
          onDelete={(id) => { 
            onDeleteProject(id); 
            if(activeProjectId === id) setActiveProjectId(null); 
          }}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
};