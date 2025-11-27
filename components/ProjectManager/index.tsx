
import React, { useState, useEffect, useMemo } from 'react';
import { LayoutGrid, CheckSquare, BarChart2, List, FileSpreadsheet, Printer, Plus, Users, Filter, ChevronDown, Folder, Briefcase, Activity, PieChart } from 'lucide-react';
import { Project, Task, User, Comment } from '../../types';
import { Sidebar } from './Sidebar';
import { GanttView } from './GanttView';
import { BoardView } from './BoardView';
import { ListView } from './ListView';
import { AnalysisView } from './AnalysisView';
import { TaskModal, ProjectModal } from './Modals';
import { ConfirmModal } from '../ConfirmModal'; // Updated import path
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
  onUpdateProjects?: (projects: Project[]) => void; // Added for batch updates
  onReorderProjects?: (projects: Project[]) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onUpdateTasks?: (tasks: Task[]) => void;
  onReorderTasks?: (tasks: Task[]) => void;
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
  onUpdateProjects,
  onReorderProjects,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onUpdateTasks,
  onReorderTasks,
  onDeleteTask,
  onAddComment
}) => {
  const [activeProjectId, setActiveProjectId] = useState<string | null>(initialActiveProjectId);
  const [viewMode, setViewMode] = useState<'board' | 'gantt' | 'list' | 'analysis'>('board');
  
  // Filters
  const [filterUserId, setFilterUserId] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Modals State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);

  // Sidebar Resize State
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);

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
        if (taskToEdit.projectId !== activeProjectId) {
          setActiveProjectId(taskToEdit.projectId);
        }
      }
    }
  }, [initialEditingTaskId, tasks]);

  // --- SIDEBAR RESIZE LOGIC ---
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingSidebar) return;
      // Constrain width between 200px and 600px
      // We use the setter callback to update relative to current mouse movement for smoother UX
      setSidebarWidth(prev => {
        const next = prev + e.movementX;
        if (next < 200) return 200;
        if (next > 500) return 500;
        return next;
      });
    };

    const handleMouseUp = () => {
      setIsResizingSidebar(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizingSidebar]);

  // --- FILTER LOGIC ---
  
  // Get unique services from users
  const uniqueServices = useMemo(() => {
    return Array.from(new Set(users.map(u => u.service).filter(Boolean))).sort();
  }, [users]);

  const filteredProjects = useMemo(() => {
    let result = projects;

    // Filter by Member
    if (filterUserId !== 'all') {
      result = result.filter(p => p.members && p.members.includes(filterUserId));
    }

    // Filter by Service (Show project if ANY member belongs to the selected service)
    if (filterService !== 'all') {
      result = result.filter(p => {
        if (!p.members || p.members.length === 0) return false;
        return p.members.some(memberId => {
          const member = users.find(u => u.id === memberId);
          return member?.service === filterService;
        });
      });
    }

    // Filter by Status
    if (filterStatus !== 'all') {
      result = result.filter(p => (p.status || 'active') === filterStatus);
    }

    return result;
  }, [projects, filterUserId, filterService, filterStatus, users]);

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
      members: partialProject.members || [],
      dependencies: partialProject.dependencies || [],
      managerId: partialProject.managerId || currentUser?.id || '' // Default manager is creator
    };

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

  // --- CASCADING UPDATE LOGIC FOR PROJECTS ---
  const handleProjectUpdateWithDependencies = (updatedProject: Project) => {
    const projectsMap = new Map<string, Project>();
    projects.forEach(p => projectsMap.set(p.id, p));
    projectsMap.set(updatedProject.id, updatedProject);

    const queue = [updatedProject];
    const processed = new Set<string>();

    while(queue.length > 0) {
       const current = queue.shift()!;
       if (processed.has(current.id)) continue;
       processed.add(current.id);

       // Find dependents: projects that have current.id in their dependencies list
       const dependents = projects.filter(p => p.dependencies?.includes(current.id));

       dependents.forEach(dep => {
          const depInMemory = projectsMap.get(dep.id)!;
          
          const currentEnd = new Date(current.endDate || '');
          const depStart = new Date(depInMemory.startDate || '');
          
          if (isNaN(currentEnd.getTime()) || isNaN(depStart.getTime())) return;

          currentEnd.setHours(0,0,0,0);
          depStart.setHours(0,0,0,0);

          // If dependent starts before parent ends, push it forward
          if (depStart < currentEnd) {
             const duration = getDaysDiff(depInMemory.startDate || '', depInMemory.endDate || '') || 1;
             // Start date of dependent becomes End date of parent (starts after finish)
             const newStartDateStr = current.endDate || new Date().toISOString().split('T')[0]; 
             const newEndDateStr = addDays(newStartDateStr, duration);
             
             const newDepProject = { ...depInMemory, startDate: newStartDateStr, endDate: newEndDateStr };
             
             projectsMap.set(newDepProject.id, newDepProject);
             queue.push(newDepProject);
          }
       });
    }

    const changedProjects = Array.from(projectsMap.values()).filter(p => {
       const original = projects.find(op => op.id === p.id);
       return JSON.stringify(original) !== JSON.stringify(p);
    });

    if (changedProjects.length > 0) {
      if (onUpdateProjects) {
        onUpdateProjects(changedProjects);
      } else {
        // Fallback if batch update not available
        changedProjects.forEach(p => onUpdateProject(p));
      }
    }
  };

  const handleTaskUpdateWithDependencies = (updatedTask: Task) => {
    const tasksMap = new Map<string, Task>();
    tasks.forEach(t => tasksMap.set(t.id, t));
    tasksMap.set(updatedTask.id, updatedTask);

    const queue = [updatedTask];
    const processed = new Set<string>();

    while(queue.length > 0) {
       const current = queue.shift()!;
       if (processed.has(current.id)) continue;
       processed.add(current.id);

       const dependents = tasks.filter(t => t.dependencies?.includes(current.id));

       dependents.forEach(dep => {
          const depInMemory = tasksMap.get(dep.id)!;
          const currentEnd = new Date(current.endDate);
          const depStart = new Date(depInMemory.startDate);
          
          currentEnd.setHours(0,0,0,0);
          depStart.setHours(0,0,0,0);

          if (depStart < currentEnd) {
             const duration = getDaysDiff(depInMemory.startDate, depInMemory.endDate);
             const newStartDateStr = current.endDate; 
             const newEndDateStr = addDays(newStartDateStr, duration);
             const newDepTask = { ...depInMemory, startDate: newStartDateStr, endDate: newEndDateStr };
             
             tasksMap.set(newDepTask.id, newDepTask);
             queue.push(newDepTask);
          }
       });
    }

    const changedTasks = Array.from(tasksMap.values()).filter(t => {
       const original = tasks.find(ot => ot.id === t.id);
       return JSON.stringify(original) !== JSON.stringify(t);
    });

    if (changedTasks.length > 0) {
      if (onUpdateTasks) {
        onUpdateTasks(changedTasks);
      } else {
        changedTasks.forEach(t => onUpdateTask(t));
      }
    }
  };

  const requestDeleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (!project) return;

    // Permission check: Only manager or new projects without manager can be deleted
    if (currentUser && project.managerId && project.managerId !== currentUser.id) {
      alert("Seul le responsable du projet peut le supprimer.");
      return;
    }

    setConfirmState({
      isOpen: true,
      type: 'project',
      id,
      title: 'Supprimer le projet ?',
      message: `Êtes-vous sûr de vouloir supprimer "${project.name}" et toutes ses tâches ? Cette action est irréversible.`
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
      setEditingProject(null);
    } else {
      onDeleteTask(confirmState.id);
      setEditingTask(null);
    }
    setConfirmState({ ...confirmState, isOpen: false });
  };

  const handleGanttReorder = (newItems: (Task | Project)[]) => {
    if (activeProjectId) {
      // Reordering Tasks
      if (onReorderTasks) {
        onReorderTasks(newItems as Task[]);
      }
    } else {
      // Reordering Projects
      if (onReorderProjects) {
        onReorderProjects(newItems as Project[]);
      }
    }
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
      csvContent += "Nom Projet;Description;Responsable;Statut;Priorité;Date Début;Date Fin;Membres;Durée (jours)\n";
      filteredProjects.forEach(proj => {
        const start = proj.startDate || new Date().toISOString().split('T')[0];
        const end = proj.endDate || new Date().toISOString().split('T')[0];
        const duration = getDaysDiff(start, end);
        const safeName = proj.name.replace(/"/g, '""');
        const safeDesc = (proj.description || '').replace(/"/g, '""').replace(/\n/g, ' ');
        const managerName = users.find(u => u.id === proj.managerId)?.name || '';
        const membersNames = proj.members?.map(mid => users.find(u => u.id === mid)?.name).join(', ') || '';
        const row = [`"${safeName}"`, `"${safeDesc}"`, `"${managerName}"`, proj.status, proj.priority, start, end, `"${membersNames}"`, duration];
        csvContent += row.join(";") + "\n";
      });
      downloadCsv(csvContent, 'projets_overview.csv');
    }
  };

  const getProjectMembers = (projId: string | null) => {
    if (!projId) return [];
    const proj = projects.find(p => p.id === projId);
    if (!proj || !proj.members) return [];
    return users.filter(u => proj.members!.includes(u.id));
  };

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="flex flex-col md:flex-row h-full bg-slate-50 dark:bg-slate-950 relative">
      <style>{`
        @media print {
          @page { size: landscape; margin: 1cm; }
          html, body, #root, main { height: auto !important; min-height: auto !important; overflow: visible !important; background: white !important; }
          body * { visibility: hidden; }
          #project-printable-area, #project-printable-area * { visibility: visible; }
          #project-printable-area { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; height: auto !important; margin: 0 !important; padding: 0 !important; z-index: 9999; background: white !important; }
          .no-print, button, input, select, ::-webkit-scrollbar { display: none !important; }
          .overflow-x-auto, .overflow-y-auto, .overflow-hidden { overflow: visible !important; height: auto !important; max-height: none !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>
      
      {/* Sidebar hidden on mobile */}
      <Sidebar 
        projects={filteredProjects}
        tasks={tasks}
        activeProjectId={activeProjectId}
        canCreate={!!currentUser}
        onSelectProject={setActiveProjectId}
        onAddProjectClick={() => setIsAddingProject(true)}
        onAddTaskClick={() => setIsAddingTask(true)}
        onDeleteProject={requestDeleteProject}
        onEditProject={setEditingProject}
        onEditTask={setEditingTask}
        width={sidebarWidth}
      />

      {/* Resizer Handle */}
      <div
        className={`hidden md:block w-1 hover:w-1.5 bg-transparent hover:bg-blue-500 cursor-col-resize transition-all z-20 select-none flex-shrink-0 ${isResizingSidebar ? 'bg-blue-600 w-1.5' : ''}`}
        onMouseDown={() => setIsResizingSidebar(true)}
        title="Redimensionner la colonne"
      />

      <div className="flex-1 flex flex-col overflow-hidden" id="project-printable-area">
        {/* Mobile Project Selector */}
        <div className="md:hidden p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
               <Folder size={18} className="text-slate-500" />
               <select 
                 value={activeProjectId || ''} 
                 onChange={(e) => setActiveProjectId(e.target.value || null)}
                 className="bg-transparent font-semibold text-slate-800 dark:text-white outline-none w-full truncate pr-8"
               >
                 <option value="">Vue d'ensemble</option>
                 {filteredProjects.map(p => (
                   <option key={p.id} value={p.id}>{p.name}</option>
                 ))}
               </select>
            </div>
            {!!currentUser && (
               <button onClick={() => setIsAddingProject(true)} className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                 <Plus size={18} />
               </button>
            )}
        </div>

        {/* Header (Desktop mainly, adapted for mobile) */}
        <div className="p-4 md:p-6 md:pr-24 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
           {!activeProjectId ? (
             <div className="hidden md:block">
               <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <LayoutGrid className="text-slate-400" /> Vue d'ensemble
               </h1>
               <div className="flex items-center gap-4 mt-2 flex-wrap">
                 <p className="text-slate-500 text-sm">{filteredProjects.length} projets</p>
                 
                 <div className="flex items-center gap-2">
                    {/* Filter User */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Filter size={12} className="text-slate-400" />
                        <select 
                          value={filterUserId} 
                          onChange={(e) => setFilterUserId(e.target.value)}
                          className="bg-transparent text-xs font-medium text-slate-700 dark:text-white outline-none cursor-pointer border-none focus:ring-0 max-w-[120px]"
                        >
                          <option value="all" className="bg-white dark:bg-slate-800">Utilisateurs: Tous</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id} className="bg-white dark:bg-slate-800">{u.name}</option>
                          ))}
                        </select>
                    </div>

                    {/* Filter Service */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Briefcase size={12} className="text-slate-400" />
                        <select 
                          value={filterService} 
                          onChange={(e) => setFilterService(e.target.value)}
                          className="bg-transparent text-xs font-medium text-slate-700 dark:text-white outline-none cursor-pointer border-none focus:ring-0 max-w-[120px]"
                        >
                          <option value="all" className="bg-white dark:bg-slate-800">Services: Tous</option>
                          {uniqueServices.map(s => (
                            <option key={s} value={s} className="bg-white dark:bg-slate-800">{s}</option>
                          ))}
                        </select>
                    </div>

                    {/* Filter Status (New) */}
                    <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                        <Activity size={12} className="text-slate-400" />
                        <select 
                          value={filterStatus} 
                          onChange={(e) => setFilterStatus(e.target.value)}
                          className="bg-transparent text-xs font-medium text-slate-700 dark:text-white outline-none cursor-pointer border-none focus:ring-0 max-w-[120px]"
                        >
                          <option value="all" className="bg-white dark:bg-slate-800">Statut: Tous</option>
                          <option value="active" className="bg-white dark:bg-slate-800">Actifs</option>
                          <option value="on-hold" className="bg-white dark:bg-slate-800">En pause</option>
                          <option value="completed" className="bg-white dark:bg-slate-800">Terminés</option>
                        </select>
                    </div>
                 </div>
               </div>
             </div>
           ) : (
             <div onClick={() => activeProject && setEditingProject(activeProject)} className="cursor-pointer group hidden md:block">
               <div className="flex items-center gap-2">
                 <h1 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{activeProject?.name}</h1>
                 <span className={`px-2 py-0.5 rounded-full text-xs text-white ${activeProject?.color} no-print`}>
                   {activeProject?.status === 'completed' ? 'Terminé' : activeProject?.status === 'on-hold' ? 'En pause' : 'Actif'}
                 </span>
               </div>
               <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                 {projectTasks.length} tâches
                 {activeProject?.members && activeProject.members.length > 0 && (
                   <div className="flex -space-x-2 ml-4">
                     {activeProject.members.map(mid => {
                       const user = users.find(u => u.id === mid);
                       if (!user) return null;
                       return (
                         <div key={user.id} className={`w-6 h-6 rounded-full ${user.color} border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] text-white font-bold`} title={user.name}>
                           {getInitials(user.name)}
                         </div>
                       );
                     })}
                   </div>
                 )}
               </p>
             </div>
           )}

           {/* Controls Bar - Responsive */}
           <div className="flex items-center gap-2 md:gap-3 no-print overflow-x-auto pb-1 md:pb-0">
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex-shrink-0">
                <button onClick={() => setViewMode('board')} className={`px-2 md:px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><CheckSquare size={16} /><span className="hidden sm:inline">Tableau</span></button>
                <button onClick={() => setViewMode('gantt')} className={`px-2 md:px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><BarChart2 size={16} /><span className="hidden sm:inline">Gantt</span></button>
                <button onClick={() => setViewMode('list')} className={`px-2 md:px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><List size={16} /><span className="hidden sm:inline">Liste</span></button>
                <button onClick={() => setViewMode('analysis')} className={`px-2 md:px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'analysis' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><PieChart size={16} /><span className="hidden sm:inline">Analyse</span></button>
              </div>

              <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-2 md:pl-3 flex-shrink-0">
                <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><FileSpreadsheet size={20} /></button>
                <button onClick={() => window.print()} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg hidden sm:block"><Printer size={20} /></button>
              </div>

              {activeProjectId && currentUser && (
                <button 
                  onClick={() => setIsAddingTask(true)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 ml-auto md:ml-4 flex-shrink-0 shadow-md transition-all hover:scale-105"
                >
                  <Plus size={20} /> <span className="hidden sm:inline">Nouvelle Tâche</span>
                </button>
              )}
           </div>
        </div>

        {/* Views Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {viewMode === 'board' && (
             <BoardView 
               tasks={projectTasks} 
               projects={filteredProjects}
               users={users}
               activeProjectId={activeProjectId}
               onUpdateTask={handleTaskUpdateWithDependencies}
               onDeleteTask={requestDeleteTask}
               onUpdateProject={handleProjectUpdateWithDependencies}
               onDeleteProject={requestDeleteProject}
               onEditTask={setEditingTask}
               onEditProject={setEditingProject}
             />
          )}

          {viewMode === 'gantt' && (
             <GanttView 
               items={activeProjectId ? projectTasks : filteredProjects}
               allTasks={activeProjectId ? projectTasks : []}
               allProjects={!activeProjectId ? projects : undefined}
               isProjects={!activeProjectId}
               onUpdateTask={handleTaskUpdateWithDependencies}
               onUpdateProject={handleProjectUpdateWithDependencies}
               onReorder={handleGanttReorder}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
             />
          )}

          {viewMode === 'list' && (
            <ListView 
               items={activeProjectId ? projectTasks : filteredProjects}
               isProjects={!activeProjectId}
               users={users}
               allTasks={tasks} // Pass all tasks to enable drilling down in overview
               onDelete={activeProjectId ? requestDeleteTask : requestDeleteProject}
               onEdit={activeProjectId ? setEditingTask : setEditingProject}
               onUpdateTaskStatus={(t, s) => handleTaskUpdateWithDependencies({...t, status: s})}
            />
          )}

          {viewMode === 'analysis' && (
            <AnalysisView 
               tasks={activeProjectId ? projectTasks : tasks.filter(t => filteredProjects.some(p => p.id === t.projectId))}
               projects={filteredProjects}
               users={users}
               isOverview={!activeProjectId}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal 
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={handleConfirmDelete}
        onClose={() => setConfirmState({...confirmState, isOpen: false})}
      />
      
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

      {isAddingProject && (
        <ProjectModal
          project={null}
          isNew={true}
          users={users}
          onSave={handleSaveNewProject}
          onClose={() => setIsAddingProject(false)}
          currentUser={currentUser}
        />
      )}

      {editingProject && (
        <ProjectModal 
          project={editingProject}
          users={users}
          allProjects={projects}
          comments={comments}
          onAddComment={onAddComment}
          onSave={(updated) => handleProjectUpdateWithDependencies(updated as Project)}
          onDelete={(id) => requestDeleteProject(id)}
          onClose={() => setEditingProject(null)}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};
