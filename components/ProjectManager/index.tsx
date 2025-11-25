import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, CheckSquare, BarChart2, List, FileSpreadsheet, Printer, Plus, Users, Filter } from 'lucide-react';
import { Project, Task, User, Comment } from '../../types';
import { Sidebar } from './Sidebar';
import { GanttView } from './GanttView';
import { BoardView } from './BoardView';
import { ListView } from './ListView';
import { TaskModal, ProjectModal, ConfirmModal } from './Modals';
import { downloadCsv, getDaysDiff, addDays } from './utils';

interface ProjectManagerProps {
  projects: Project[];
  tasks: Task[];
  users: User[];
  comments: Comment[];
  currentUser: User | null;
  initialActiveProjectId?: string | null;
  initialEditingTaskId?: string | null;
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onAddComment: (comment: Comment) => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  tasks,
  users,
  comments,
  currentUser,
  initialActiveProjectId = null,
  initialEditingTaskId = null,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment
}) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialActiveProjectId);
  const [viewMode, setViewMode] = useState<'board' | 'gantt' | 'list'>('board');
  const [filterUserId, setFilterUserId] = useState<string>('all');
  
  // Modals State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Delete Confirmation State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    type: 'project' | 'task';
    id: string;
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'task',
    id: '',
    title: '',
    message: ''
  });

  useEffect(() => {
    if (initialActiveProjectId) {
      setActiveProjectId(initialActiveProjectId);
    }
  }, [initialActiveProjectId]);

  // Effect to handle direct navigation to a task from Dashboard search
  useEffect(() => {
    if (initialEditingTaskId) {
      const taskToEdit = tasks.find(t => t.id === initialEditingTaskId);
      if (taskToEdit) {
        setEditingTask(taskToEdit);
        // Ensure the project is active if a task is selected
        if (taskToEdit.projectId !== activeProjectId) {
          setActiveProjectId(taskToEdit.projectId);
        }
      }
    }
  }, [initialEditingTaskId, tasks]);

  // --- FILTER LOGIC ---
  const filteredProjects = useMemo(() => {
    if (filterUserId === 'all') return projects;
    return projects.filter(p => p.members && p.members.includes(filterUserId));
  }, [projects, filterUserId]);

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
      endDate: partialProject.endDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      members: partialProject.members || []
    };

    // Auto-assign current user as member so they can see the project immediately
    if (currentUser && newProject.members && !newProject.members.includes(currentUser.id)) {
        newProject.members.push(currentUser.id);
    }

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
      endDate: partialTask.endDate!,
      assignee: partialTask.assignee,
      subtasks: partialTask.subtasks || [],
      dependencies: partialTask.dependencies || []
    };
    onAddTask(task);
    setIsAddingTask(false);
  };

  // --- CASCADE UPDATE LOGIC ---
  // When a task is updated, we check if it pushes any dependent tasks
  const handleTaskUpdateWithDependencies = (updatedTask: Task) => {
    // 1. Update the main task
    onUpdateTask(updatedTask);

    // 2. Find immediate dependents (tasks that wait for this updatedTask)
    const dependentTasks = tasks.filter(t => t.dependencies && t.dependencies.includes(updatedTask.id));

    dependentTasks.forEach(depTask => {
      // Logic: Start Date of dependent must be > End Date of prerequisite
      // For simplicity: newStart = prerequisite.EndDate + 0 days (or 1 day)
      // We'll set it to start exactly after the previous one ends (continuous)
      const prerequisiteEnd = new Date(updatedTask.endDate);
      const dependentStart = new Date(depTask.startDate);

      // If the dependent task starts BEFORE the prerequisite ends, we push it.
      if (dependentStart < prerequisiteEnd) {
         // Calculate duration to preserve it
         const duration = getDaysDiff(depTask.startDate, depTask.endDate);
         
         const newStartDateStr = updatedTask.endDate; // Starts same day as finish or next day? Let's say same day (Finish-to-Start immediate)
         // Actually, let's add 1 day for logical clarity if needed, but often Gantt allows same day handoff.
         // Let's stick to same day handoff for now to keep it tight.
         
         const newEndDateStr = addDays(newStartDateStr, duration);

         // Recursively update this dependent task
         const newDepTask = { ...depTask, startDate: newStartDateStr, endDate: newEndDateStr };
         handleTaskUpdateWithDependencies(newDepTask);
      }
    });
  };

  // --- DELETE HANDLERS WITH CONFIRMATION ---

  const requestDeleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    setConfirmState({
      isOpen: true,
      type: 'project',
      id,
      title: 'Supprimer le projet ?',
      message: `Êtes-vous sûr de vouloir supprimer "${project?.name}" et toutes ses tâches ? Cette action est irréversible.`
    });
  };

  const requestDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setConfirmState({
      isOpen: true,
      type: 'task',
      id,
      title: 'Supprimer la tâche ?',
      message: `Voulez-vous vraiment supprimer la tâche "${task?.title}" ?`
    });
  };

  const handleConfirmDelete = () => {
    if (confirmState.type === 'project') {
      onDeleteProject(confirmState.id);
      if (activeProjectId === confirmState.id) {
        setActiveProjectId(null);
      }
      setEditingProject(null); // Close modal if open
    } else {
      onDeleteTask(confirmState.id);
      setEditingTask(null); // Close modal if open
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; 
    if (activeProjectId) {
       if (projectTasks.length === 0) return;
       csvContent += "Titre;Description;Statut;Priorité;Date Début;Date Fin;Assigné à;Durée (jours)\n";
       projectTasks.forEach(task => {
        const duration = getDaysDiff(task.startDate, task.endDate);
        const safeTitle = task.title.replace(/"/g, '""');
        const safeDesc = (task.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const assigneeName = users.find(u => u.id === task.assignee)?.name || '';
        const row = [`"${safeTitle}"`, `"${safeDesc}"`, task.status, task.priority, task.startDate, task.endDate, `"${assigneeName}"`, duration];
        csvContent += row.join(";") + "\n";
      });
      const filename = activeProject ? `${activeProject.name}_tasks.csv` : 'tasks.csv';
      downloadCsv(csvContent, filename);
    } else {
      if (filteredProjects.length === 0) return;
      csvContent += "Nom Projet;Description;Statut;Priorité;Date Début;Date Fin;Membres;Durée (jours)\n";
      filteredProjects.forEach(proj => {
        const start = proj.startDate || new Date().toISOString().split('T')[0];
        const end = proj.endDate || new Date().toISOString().split('T')[0];
        const duration = getDaysDiff(start, end);
        const safeName = proj.name.replace(/"/g, '""');
        const safeDesc = (proj.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const membersNames = proj.members?.map(mid => users.find(u => u.id === mid)?.name).join(', ') || '';
        const row = [`"${safeName}"`, `"${safeDesc}"`, proj.status, proj.priority, start, end, `"${membersNames}"`, duration];
        csvContent += row.join(";") + "\n";
      });
      downloadCsv(csvContent, 'projets_overview.csv');
    }
  };

  // Helper to filter users based on project membership for Task Assignment
  const getProjectMembers = (projId: string | null) => {
    if (!projId) return [];
    const proj = projects.find(p => p.id === projId);
    if (!proj || !proj.members) return [];
    return users.filter(u => proj.members!.includes(u.id));
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
        projects={filteredProjects}
        activeProjectId={activeProjectId}
        canCreate={!!currentUser}
        onSelectProject={setActiveProjectId}
        onAddProjectClick={() => setIsAddingProject(true)}
        onDeleteProject={requestDeleteProject}
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
               <div className="flex items-center gap-2 mt-1">
                 <p className="text-slate-500 text-sm">{filteredProjects.length} projets</p>
                 {/* User Filter Dropdown */}
                 <div className="flex items-center gap-1.5 ml-4 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Filter size={12} className="text-slate-400" />
                    <select 
                      value={filterUserId} 
                      onChange={(e) => setFilterUserId(e.target.value)}
                      className="bg-transparent text-xs font-medium text-slate-700 dark:text-white outline-none cursor-pointer border-none focus:ring-0"
                    >
                      <option value="all" className="bg-white dark:bg-slate-800">Tous les utilisateurs</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800">{u.name}</option>
                      ))}
                    </select>
                 </div>
               </div>
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
                 {/* Team Avatars */}
                 {activeProject?.members && activeProject.members.length > 0 && (
                   <div className="flex -space-x-2 ml-4">
                     {activeProject.members.map(mid => {
                       const user = users.find(u => u.id === mid);
                       if (!user) return null;
                       return (
                         <div key={user.id} className={`w-6 h-6 rounded-full ${user.color} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold`} title={user.name}>
                           {user.name.charAt(0)}
                         </div>
                       );
                     })}
                   </div>
                 )}
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

              {activeProjectId && currentUser && (
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
               projects={filteredProjects}
               users={users}
               activeProjectId={activeProjectId}
               onUpdateTask={handleTaskUpdateWithDependencies}
               onDeleteTask={requestDeleteTask}
               onUpdateProject={onUpdateProject}
               onDeleteProject={requestDeleteProject}
               onEditTask={setEditingTask}
               onEditProject={setEditingProject}
             />
          )}

          {viewMode === 'gantt' && (
             <GanttView 
               items={activeProjectId ? projectTasks : filteredProjects}
               allTasks={activeProjectId ? projectTasks : []}
               isProjects={!activeProjectId}
               onUpdateTask={handleTaskUpdateWithDependencies}
               onUpdateProject={onUpdateProject}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
             />
          )}

          {viewMode === 'list' && (
            <ListView 
               items={activeProjectId ? projectTasks : filteredProjects}
               isProjects={!activeProjectId}
               users={users}
               onDelete={activeProjectId ? requestDeleteTask : requestDeleteProject}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
               onUpdateTaskStatus={(t, s) => handleTaskUpdateWithDependencies({...t, status: s})}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      
      {/* Confirm Modal */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmState({...confirmState, isOpen: false})}
      />
      
      {/* Creation Task Modal */}
      {isAddingTask && (
        <TaskModal 
           task={null}
           isNew={true}
           currentUser={currentUser}
           users={getProjectMembers(activeProjectId)}
           allTasks={projectTasks}
           onSave={handleSaveNewTask} 
           onClose={() => setIsAddingTask(false)} 
        />
      )}
      
      {/* Editing Task Modal */}
      {editingTask && (
        <TaskModal 
          task={editingTask}
          users={getProjectMembers(editingTask.projectId)}
          allTasks={tasks.filter(t => t.projectId === editingTask.projectId)}
          comments={comments}
          currentUser={currentUser}
          onSave={(updated) => { handleTaskUpdateWithDependencies(updated as Task); }}
          onDelete={requestDeleteTask}
          onAddComment={onAddComment}
          onClose={() => { setEditingTask(null); }}
        />
      )}

      {/* Creation Project Modal */}
      {isAddingProject && (
        <ProjectModal
          project={null}
          isNew={true}
          users={users}
          onSave={handleSaveNewProject}
          onClose={() => setIsAddingProject(false)}
        />
      )}

      {/* Editing Project Modal */}
      {editingProject && (
        <ProjectModal 
          project={editingProject}
          users={users}
          onSave={(updated) => onUpdateProject(updated as Project)}
          onDelete={(id) => requestDeleteProject(id)}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
};