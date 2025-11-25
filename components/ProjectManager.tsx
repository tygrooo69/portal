import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar, CheckSquare, BarChart2, MoreVertical, 
  Trash2, Clock, AlertCircle, ChevronRight, GripVertical,
  ChevronLeft, RotateCcw, Printer, FileSpreadsheet, Filter,
  X, Save, LayoutGrid, Briefcase, List
} from 'lucide-react';
import { Project, Task } from '../types';

interface ProjectManagerProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (project: Project) => void;
  onUpdateProject: (project: Project) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

// Helper to manipulate dates strings
const addDays = (dateStr: string, days: number): string => {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0];
};

const getDaysDiff = (start: string, end: string): number => {
  const d1 = new Date(start).getTime();
  const d2 = new Date(end).getTime();
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};

type GanttScope = 'day' | 'week' | 'month';

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projects,
  tasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  // Active Project ID: null means "Overview Mode" (All Projects)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'board' | 'gantt' | 'list'>('board');
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // Gantt State
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 3))); // Start 3 days ago by default
  const [ganttScope, setGanttScope] = useState<GanttScope>('day');

  // Task Form State
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    status: 'todo',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0] // +3 days
  });

  // EDIT STATE
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  // GANTT DRAG STATE
  const [dragState, setDragState] = useState<{
    itemId: string; // Task ID or Project ID
    type: 'move' | 'resize';
    startX: number;
    originalStart: string;
    originalEnd: string;
    currentDeltaDays: number;
    isProject: boolean;
  } | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);

  const activeProject = projects.find(p => p.id === activeProjectId);
  const projectTasks = activeProjectId ? tasks.filter(t => t.projectId === activeProjectId) : [];

  // --- DERIVED CONFIG BASED ON SCOPE ---
  const ganttConfig = useMemo(() => {
    switch(ganttScope) {
      case 'month':
        return { colWidth: 15, daysToRender: 180, label: 'Mois' }; // Zoom Out (6 months approx)
      case 'week':
        return { colWidth: 30, daysToRender: 90, label: 'Semaine' }; // Mid Zoom (3 months)
      case 'day':
      default:
        return { colWidth: 60, daysToRender: 30, label: 'Jour' }; // Zoom In (1 month)
    }
  }, [ganttScope]);

  // --- EXPORT HANDLERS ---

  const handleExportExcel = () => {
    let csvContent = "\uFEFF"; 
    
    if (activeProjectId) {
       // Task Export
       if (projectTasks.length === 0) return;
       csvContent += "Titre;Statut;Priorité;Date Début;Date Fin;Durée (jours)\n";
       projectTasks.forEach(task => {
        const duration = getDaysDiff(task.startDate, task.endDate);
        const safeTitle = task.title.replace(/"/g, '""');
        const row = [`"${safeTitle}"`, task.status, task.priority, task.startDate, task.endDate, duration];
        csvContent += row.join(";") + "\n";
      });
      const filename = activeProject ? `${activeProject.name}_tasks.csv` : 'tasks.csv';
      downloadCsv(csvContent, filename);

    } else {
      // Project Export
      if (projects.length === 0) return;
      csvContent += "Nom Projet;Statut;Priorité;Date Début;Date Fin;Durée (jours)\n";
      projects.forEach(proj => {
        const start = proj.startDate || new Date().toISOString().split('T')[0];
        const end = proj.endDate || new Date().toISOString().split('T')[0];
        const duration = getDaysDiff(start, end);
        const safeName = proj.name.replace(/"/g, '""');
        const row = [`"${safeName}"`, proj.status, proj.priority, start, end, duration];
        csvContent += row.join(";") + "\n";
      });
      downloadCsv(csvContent, 'projets_overview.csv');
    }
  };

  const downloadCsv = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const handlePrint = () => {
    window.print();
  };

  // --- HANDLERS ---

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      color: randomColor,
      createdAt: new Date().toISOString(),
      priority: 'medium',
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
    };

    onAddProject(newProject);
    setNewProjectName('');
    setIsAddingProject(false);
    setActiveProjectId(newProject.id);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !activeProjectId) return;

    const task: Task = {
      id: Date.now().toString(),
      projectId: activeProjectId,
      title: newTask.title,
      status: newTask.status as any,
      priority: newTask.priority as any,
      startDate: newTask.startDate!,
      endDate: newTask.endDate!
    };

    onAddTask(task);
    setIsAddingTask(false);
    setNewTask({
      title: '',
      status: 'todo',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
    });
  };

  const moveTask = (task: Task, newStatus: 'todo' | 'in-progress' | 'done') => {
    onUpdateTask({ ...task, status: newStatus });
  };

  const moveProject = (project: Project, newStatus: 'active' | 'on-hold' | 'completed') => {
    onUpdateProject({ ...project, status: newStatus });
  };

  // --- EDIT TASK HANDLERS ---
  const handleSaveEditTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTask) {
      onUpdateTask(editingTask);
      setEditingTask(null);
    }
  };

  const handleDeleteEditTask = () => {
    if (editingTask && confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) {
      onDeleteTask(editingTask.id);
      setEditingTask(null);
    }
  };

  // --- EDIT PROJECT HANDLERS ---
  const handleSaveEditProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      onUpdateProject(editingProject);
      setEditingProject(null);
    }
  };

  const handleDeleteEditProject = () => {
    if (editingProject && confirm("Supprimer ce projet et toutes ses tâches ?")) {
      onDeleteProject(editingProject.id);
      setEditingProject(null);
      if (activeProjectId === editingProject.id) {
        setActiveProjectId(null);
      }
    }
  };

  // --- GANTT NAVIGATION ---
  const shiftView = (days: number) => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + days);
    setViewStartDate(newDate);
  };

  const resetViewToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3); // Buffer
    setViewStartDate(d);
  };

  // --- GANTT CALCULATION & INTERACTION ---

  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pixelDelta = e.clientX - dragState.startX;
      const daysDelta = Math.round(pixelDelta / ganttConfig.colWidth);
      setDragState(prev => prev ? { ...prev, currentDeltaDays: daysDelta } : null);
    };

    const handleMouseUp = () => {
      if (dragState.currentDeltaDays !== 0) {
        if (dragState.isProject) {
          // Handle Project Drag
          const project = projects.find(p => p.id === dragState.itemId);
          if (project) {
             let newStart = dragState.originalStart;
             let newEnd = dragState.originalEnd;
             
             if (dragState.type === 'move') {
               newStart = addDays(dragState.originalStart, dragState.currentDeltaDays);
               newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
             } else {
               newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
               if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
             }
             onUpdateProject({ ...project, startDate: newStart, endDate: newEnd });
          }
        } else {
          // Handle Task Drag
          const task = tasks.find(t => t.id === dragState.itemId);
          if (task) {
            let newStart = dragState.originalStart;
            let newEnd = dragState.originalEnd;

            if (dragState.type === 'move') {
              newStart = addDays(dragState.originalStart, dragState.currentDeltaDays);
              newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
            } else {
              newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
              if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
            }
            onUpdateTask({ ...task, startDate: newStart, endDate: newEnd });
          }
        }
      }
      setDragState(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, tasks, projects, onUpdateTask, onUpdateProject, ganttConfig.colWidth]);

  const initDrag = (e: React.MouseEvent, itemId: string, type: 'move' | 'resize', item: any, isProject: boolean) => {
    e.stopPropagation();
    if (e.detail === 2) return;
    
    setDragState({
      itemId,
      type,
      startX: e.clientX,
      originalStart: item.startDate || new Date().toISOString().split('T')[0],
      originalEnd: item.endDate || new Date().toISOString().split('T')[0],
      currentDeltaDays: 0,
      isProject
    });
  };

  // --- RENDERERS ---

  const renderGanttTimeline = (items: (Task | Project)[], isProjects: boolean) => {
    const dates = [];
    for (let i = 0; i < ganttConfig.daysToRender; i++) {
      const d = new Date(viewStartDate);
      d.setDate(d.getDate() + i);
      dates.push(d);
    }
    const timelineStartTs = dates[0].getTime();
    
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full select-none print:border-0 print:shadow-none print:h-auto print:block">
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50 print:hidden flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => shiftView(-7)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"><ChevronLeft size={18} /></button>
            <button onClick={resetViewToToday} className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50"><RotateCcw size={14} /> Aujourd'hui</button>
            <button onClick={() => shiftView(7)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 transition-colors"><ChevronRight size={18} /></button>
            <span className="text-sm font-medium ml-2 text-slate-600 dark:text-slate-300 hidden sm:inline-block">{dates[0].toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
             <Filter size={14} className="ml-2 text-slate-400" />
             <select value={ganttScope} onChange={(e) => setGanttScope(e.target.value as GanttScope)} className="bg-transparent text-xs font-medium text-slate-700 dark:text-slate-200 outline-none px-2 py-1 cursor-pointer">
               <option value="day">Vue Jour</option>
               <option value="week">Vue Semaine</option>
               <option value="month">Vue Mois</option>
             </select>
          </div>
        </div>
        
        <div className="flex-1 overflow-x-auto overflow-y-hidden relative print:overflow-visible print:h-auto" ref={timelineRef}>
          <div style={{ width: `${ganttConfig.daysToRender * ganttConfig.colWidth}px` }} className="min-h-full relative print:w-full print:h-auto">
             <div className="flex h-12 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-20 print:static print:border-b-2 print:border-slate-300">
               {dates.map((date, i) => {
                 const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                 const isToday = new Date().toDateString() === date.toDateString();
                 const showText = ganttScope === 'day' || (ganttScope === 'week'); 
                 const showDayName = ganttScope === 'day';
                 const isFirstOfMonth = date.getDate() === 1;

                 return (
                   <div key={i} className={`flex-shrink-0 flex flex-col items-center justify-center border-r border-slate-100 dark:border-slate-800 text-xs relative ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''} ${isToday ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`} style={{ width: `${ganttConfig.colWidth}px` }}>
                     {isFirstOfMonth && <div className="absolute top-0 left-0 bg-slate-200 dark:bg-slate-700 text-[10px] px-2 py-0.5 rounded-br z-10 whitespace-nowrap opacity-80 font-bold">{date.toLocaleDateString(undefined, { month: 'short' })}</div>}
                     {showText && <span className={`font-semibold ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}`}>{date.getDate()}</span>}
                     {showDayName && <span className="text-[10px] text-slate-400 uppercase">{date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 3)}</span>}
                   </div>
                 );
               })}
             </div>

             <div className="absolute inset-0 top-12 flex pointer-events-none z-0 print:h-full">
               {dates.map((date, i) => (
                 <div key={i} className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-800/50 h-full ${(date.getDay() === 0 || date.getDay() === 6) ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`} style={{ width: `${ganttConfig.colWidth}px` }} />
               ))}
             </div>

             <div className="py-4 space-y-4 relative z-10 print:space-y-6">
                {items.map(item => {
                  const isDragging = dragState?.itemId === item.id;
                  let currentStart = item.startDate || new Date().toISOString().split('T')[0];
                  let currentEnd = item.endDate || new Date().toISOString().split('T')[0];

                  if (isDragging) {
                    if (dragState.type === 'move') {
                      currentStart = addDays(dragState.originalStart, dragState.currentDeltaDays);
                      currentEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
                    } else {
                      currentEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
                      if (new Date(currentEnd) < new Date(currentStart)) currentEnd = currentStart;
                    }
                  }

                  const diffDays = getDaysDiff(new Date(timelineStartTs).toISOString(), currentStart);
                  const durationDays = getDaysDiff(currentStart, currentEnd) || 1;
                  
                  if (diffDays + durationDays < 0 || diffDays > ganttConfig.daysToRender) return null;

                  const left = diffDays * ganttConfig.colWidth;
                  const width = durationDays * ganttConfig.colWidth;
                  
                  let colorClass = 'bg-slate-400';
                  const status = (item as any).status;
                  if (status === 'done' || status === 'completed') colorClass = 'bg-green-500';
                  else if (status === 'in-progress' || status === 'active') colorClass = 'bg-blue-500';
                  else if (status === 'on-hold') colorClass = 'bg-orange-500';

                  const label = (item as any).title || (item as any).name;

                  return (
                    <div key={item.id} className="relative h-10 group print:h-8">
                       <div 
                         className="absolute text-sm text-slate-600 dark:text-slate-300 font-medium truncate px-2 leading-10 cursor-pointer hover:text-blue-600 z-20 print:text-black print:text-xs print:leading-8"
                         onDoubleClick={(e) => { e.stopPropagation(); isProjects ? setEditingProject(item as Project) : setEditingTask(item as Task); }}
                         style={{ left: Math.max(0, left), maxWidth: Math.max(width, 200) }}
                       >
                         {label}
                       </div>
                       <div 
                         className={`absolute top-2 h-6 rounded-md ${colorClass} shadow-sm flex items-center px-2 group/bar ${isDragging ? 'brightness-110 shadow-lg ring-2 ring-blue-400/50 z-30' : ''} print:border print:border-slate-500`}
                         style={{ left: `${left}px`, width: `${Math.max(width, 5)}px`, cursor: isDragging ? 'grabbing' : 'grab', opacity: 0.9 }}
                         onMouseDown={(e) => initDrag(e, item.id, 'move', item, isProjects)}
                         onDoubleClick={(e) => { e.stopPropagation(); isProjects ? setEditingProject(item as Project) : setEditingTask(item as Task); }}
                       >
                         {width > 40 && <span className="text-[10px] text-white/90 truncate ml-auto pointer-events-none print:text-white">{durationDays}j</span>}
                         <div className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 flex items-center justify-center rounded-r-md transition-colors z-40 print:hidden" onMouseDown={(e) => initDrag(e, item.id, 'resize', item, isProjects)}>
                           <div className="w-0.5 h-3 bg-white/50 rounded-full" />
                         </div>
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProjectBoard = () => {
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
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30 cursor-pointer hover:border-blue-300 transition-all" onDoubleClick={() => setEditingProject(proj)}>
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
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-orange-100 dark:border-orange-900/30 cursor-pointer" onDoubleClick={() => setEditingProject(proj)}>
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
                <div key={proj.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-green-100 dark:border-green-900/30 opacity-75" onDoubleClick={() => setEditingProject(proj)}>
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
  };

  const renderProjectList = () => {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Statut</th>
              <th className="px-6 py-4">Nom du Projet</th>
              <th className="px-6 py-4">Priorité</th>
              <th className="px-6 py-4">Début</th>
              <th className="px-6 py-4">Fin</th>
              <th className="px-6 py-4 text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {projects.map(proj => (
              <tr 
                key={proj.id} 
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                onDoubleClick={() => setEditingProject(proj)}
              >
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${
                    proj.status === 'completed' ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-800' :
                    proj.status === 'on-hold' ? 'bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-900/20 dark:border-orange-800' :
                    'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                  }`}>
                    {proj.status === 'completed' ? 'Terminé' : proj.status === 'on-hold' ? 'En pause' : 'Actif'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${proj.color}`} />
                    <span className="font-semibold text-slate-800 dark:text-white">{proj.name}</span>
                  </div>
                  {proj.description && <p className="text-xs text-slate-500 mt-1 truncate max-w-xs">{proj.description}</p>}
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                      proj.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                      proj.priority === 'low' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                   }`}>
                      {proj.priority === 'high' ? 'Haute' : proj.priority === 'low' ? 'Basse' : 'Moyenne'}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {proj.startDate ? new Date(proj.startDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {proj.endDate ? new Date(proj.endDate).toLocaleDateString() : '-'}
                </td>
                <td className="px-6 py-4 text-right print:hidden">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(proj.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {projects.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucun projet trouvé.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  const renderTaskList = () => {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4 w-12"></th>
              <th className="px-6 py-4">Tâche</th>
              <th className="px-6 py-4">Priorité</th>
              <th className="px-6 py-4">Début</th>
              <th className="px-6 py-4">Fin</th>
              <th className="px-6 py-4 text-right print:hidden">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {projectTasks.map(task => (
              <tr 
                key={task.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${task.status === 'done' ? 'opacity-60 bg-slate-50/50' : ''}`}
                onDoubleClick={() => setEditingTask(task)}
              >
                <td className="px-6 py-4">
                  <button 
                    onClick={() => moveTask(task, task.status === 'done' ? 'in-progress' : 'done')}
                    className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                      task.status === 'done' 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-slate-300 dark:border-slate-600 hover:border-blue-500'
                    }`}
                  >
                    {task.status === 'done' && <CheckSquare size={12} />}
                  </button>
                </td>
                <td className="px-6 py-4">
                  <span className={`font-medium ${task.status === 'done' ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                    {task.title}
                  </span>
                  <div className="mt-1">
                     <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                       task.status === 'in-progress' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                       task.status === 'done' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                       'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                     }`}>
                       {task.status === 'in-progress' ? 'En cours' : task.status === 'done' ? 'Terminé' : 'À faire'}
                     </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
                      task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' :
                      task.priority === 'low' ? 'bg-slate-50 text-slate-600 border-slate-100' :
                      'bg-blue-50 text-blue-600 border-blue-100'
                   }`}>
                      {task.priority === 'high' ? 'Haute' : task.priority === 'low' ? 'Basse' : 'Moyenne'}
                   </span>
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {new Date(task.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                  {new Date(task.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right print:hidden">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {projectTasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune tâche dans ce projet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
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
          #project-printable-area .flex { display: flex !important; }
          #project-printable-area .flex-col { flex-direction: column !important; }
          #project-printable-area .flex-row { flex-direction: row !important; }
          .overflow-x-auto, .overflow-y-auto, .overflow-hidden { overflow: visible !important; height: auto !important; }
          .no-print, button, input, select, ::-webkit-scrollbar { display: none !important; }
          .text-white { color: black !important; }
          .text-slate-600, .text-slate-500 { color: #333 !important; }
          .bg-blue-500 { background-color: #3b82f6 !important; -webkit-print-color-adjust: exact; }
          .bg-green-500 { background-color: #22c55e !important; -webkit-print-color-adjust: exact; }
          .bg-slate-400 { background-color: #94a3b8 !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>
      
      {/* Project Sidebar - Hide on Print */}
      <div className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col print:hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
           <h2 className="font-bold text-slate-800 dark:text-white">Projets</h2>
           <button onClick={() => setIsAddingProject(true)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
             <Plus size={18} className="text-blue-600" />
           </button>
        </div>
        
        {isAddingProject && (
          <form onSubmit={handleCreateProject} className="p-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <input 
              autoFocus
              className="w-full px-2 py-1 text-sm rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white mb-2"
              placeholder="Nom du projet..."
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsAddingProject(false)} className="text-xs text-slate-500">Annuler</button>
              <button type="submit" className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Créer</button>
            </div>
          </form>
        )}

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {/* Overview Button */}
          <div 
             onClick={() => setActiveProjectId(null)}
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

          {/* Project List */}
          {projects.map(project => (
            <div 
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              onDoubleClick={() => setEditingProject(project)}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden" id="project-printable-area">
        {/* GLOBAL PROJECT OVERVIEW */}
        {!activeProjectId ? (
          <>
             <div className="p-6 md:pr-24 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                <div>
                   <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <LayoutGrid className="text-slate-400" /> Vue d'ensemble des Projets
                   </h1>
                   <p className="text-slate-500 text-sm mt-1">{projects.length} projets au total</p>
                </div>
                <div className="flex items-center gap-3 no-print">
                  <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button onClick={() => setViewMode('board')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><CheckSquare size={16} /> Tableau</button>
                    <button onClick={() => setViewMode('gantt')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><BarChart2 size={16} /> Gantt</button>
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}><List size={16} /> Liste</button>
                  </div>
                  <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                    <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><FileSpreadsheet size={20} /></button>
                    <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Printer size={20} /></button>
                  </div>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'board' && renderProjectBoard()}
                {viewMode === 'gantt' && renderGanttTimeline(projects, true)}
                {viewMode === 'list' && renderProjectList()}
             </div>
          </>
        ) : (
          /* SINGLE PROJECT VIEW (EXISTING) */
          activeProject ? (
            <>
              {/* Header */}
              <div className="p-6 md:pr-24 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900">
                 <div onClick={() => setEditingProject(activeProject)} className="cursor-pointer group">
                   <div className="flex items-center gap-2">
                     <h1 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">{activeProject.name}</h1>
                     <span className={`px-2 py-0.5 rounded-full text-xs text-white ${activeProject.color} no-print`}>
                       {activeProject.status === 'completed' ? 'Terminé' : activeProject.status === 'on-hold' ? 'En pause' : 'Actif'}
                     </span>
                   </div>
                   <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
                     {projectTasks.length} tâches
                     {activeProject.endDate && (
                       <>
                         <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                         <span>Fin: {new Date(activeProject.endDate).toLocaleDateString()}</span>
                       </>
                     )}
                   </p>
                 </div>
                 
                 <div className="flex items-center gap-3 no-print">
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button 
                        onClick={() => setViewMode('board')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'board' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                      >
                        <CheckSquare size={16} /> Tableau
                      </button>
                      <button 
                        onClick={() => setViewMode('gantt')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'gantt' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                      >
                        <BarChart2 size={16} /> Gantt
                      </button>
                      <button 
                        onClick={() => setViewMode('list')}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
                      >
                        <List size={16} /> Liste
                      </button>
                    </div>

                    <div className="flex gap-2 border-l border-slate-200 dark:border-slate-700 pl-3">
                      <button onClick={handleExportExcel} className="p-2 text-slate-500 hover:text-green-600 hover:bg-green-50 rounded-lg"><FileSpreadsheet size={20} /></button>
                      <button onClick={handlePrint} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Printer size={20} /></button>
                    </div>

                    <button 
                      onClick={() => setIsAddingTask(true)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium flex items-center gap-2 ml-2"
                    >
                      <Plus size={18} /> Nouvelle Tâche
                    </button>
                 </div>
              </div>

              {/* Task Creation Modal/Panel */}
              {isAddingTask && (
                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-in slide-in-from-top-2 no-print">
                   <form onSubmit={handleCreateTask} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1">Titre de la tâche</label>
                        <input 
                          autoFocus
                          required
                          value={newTask.title}
                          onChange={e => setNewTask({...newTask, title: e.target.value})}
                          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          placeholder="Ex: Rédiger le rapport..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Dates (Début - Fin)</label>
                        <div className="flex gap-2">
                          <input 
                            type="date" 
                            required
                            value={newTask.startDate}
                            onChange={e => setNewTask({...newTask, startDate: e.target.value})}
                            className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                          <input 
                            type="date" 
                            required
                            value={newTask.endDate}
                            onChange={e => setNewTask({...newTask, endDate: e.target.value})}
                            className="w-1/2 px-2 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <select 
                           value={newTask.priority}
                           onChange={e => setNewTask({...newTask, priority: e.target.value as any})}
                           className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white text-sm"
                         >
                           <option value="low">Basse</option>
                           <option value="medium">Moyenne</option>
                           <option value="high">Haute</option>
                         </select>
                         <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Ajouter</button>
                         <button type="button" onClick={() => setIsAddingTask(false)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><Trash2 size={18}/></button>
                      </div>
                   </form>
                </div>
              )}

              {/* Content Views */}
              <div className="flex-1 overflow-y-auto p-6">
                {viewMode === 'board' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
                    
                    {/* Column: TODO */}
                    <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 flex flex-col">
                      <h3 className="font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400" /> À faire
                        <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{projectTasks.filter(t => t.status === 'todo').length}</span>
                      </h3>
                      <div className="space-y-3">
                        {projectTasks.filter(t => t.status === 'todo').map(task => (
                          <div 
                            key={task.id} 
                            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-grab active:cursor-grabbing group hover:border-blue-400 transition-colors"
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          >
                             <div className="flex justify-between items-start mb-2">
                               <p className="font-medium text-slate-800 dark:text-white text-sm">{task.title}</p>
                               <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 no-print"><Trash2 size={14}/></button>
                             </div>
                             <div className="flex items-center justify-between text-xs text-slate-500">
                               <span className={`px-1.5 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 border-slate-100 dark:bg-slate-700 dark:border-slate-600'}`}>
                                 {task.priority === 'high' ? 'Urgent' : task.priority === 'medium' ? 'Normal' : 'Bas'}
                               </span>
                               <div className="flex items-center gap-1">
                                 <Clock size={12} />
                                 {new Date(task.endDate).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                               </div>
                             </div>
                             <button onClick={() => moveTask(task, 'in-progress')} className="mt-3 w-full py-1.5 bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 rounded text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/40 no-print">
                               Démarrer &rarr;
                             </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column: IN PROGRESS */}
                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl p-4 flex flex-col">
                      <h3 className="font-semibold text-blue-700 dark:text-blue-300 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" /> En cours
                        <span className="ml-auto text-xs bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">{projectTasks.filter(t => t.status === 'in-progress').length}</span>
                      </h3>
                      <div className="space-y-3">
                        {projectTasks.filter(t => t.status === 'in-progress').map(task => (
                          <div 
                            key={task.id} 
                            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-blue-100 dark:border-blue-900/30 cursor-grab"
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          >
                             <div className="flex justify-between items-start mb-2">
                               <p className="font-medium text-slate-800 dark:text-white text-sm">{task.title}</p>
                               <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                             </div>
                             <div className="flex items-center justify-between text-xs text-slate-500">
                               <div className="flex items-center gap-1 text-blue-600">
                                 <Clock size={12} /> En cours
                               </div>
                             </div>
                             <div className="grid grid-cols-2 gap-2 mt-3 no-print">
                               <button onClick={() => moveTask(task, 'todo')} className="py-1.5 bg-slate-50 text-slate-600 rounded text-xs font-medium hover:bg-slate-100">
                                 &larr; Retour
                               </button>
                               <button onClick={() => moveTask(task, 'done')} className="py-1.5 bg-green-50 text-green-600 rounded text-xs font-medium hover:bg-green-100">
                                 Terminer &rarr;
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Column: DONE */}
                    <div className="bg-green-50/50 dark:bg-green-900/10 rounded-xl p-4 flex flex-col">
                      <h3 className="font-semibold text-green-700 dark:text-green-300 mb-4 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500" /> Terminé
                        <span className="ml-auto text-xs bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">{projectTasks.filter(t => t.status === 'done').length}</span>
                      </h3>
                      <div className="space-y-3">
                        {projectTasks.filter(t => t.status === 'done').map(task => (
                          <div 
                            key={task.id} 
                            className="bg-white dark:bg-slate-800 p-3 rounded-lg shadow-sm border border-green-100 dark:border-green-900/30 opacity-75 hover:opacity-100 transition-opacity"
                            onDoubleClick={(e) => { e.stopPropagation(); setEditingTask(task); }}
                          >
                             <div className="flex justify-between items-start mb-2">
                               <p className="font-medium text-slate-800 dark:text-white text-sm line-through text-slate-400">{task.title}</p>
                               <button onClick={() => onDeleteTask(task.id)} className="text-slate-400 hover:text-red-500 no-print"><Trash2 size={14}/></button>
                             </div>
                             <div className="flex items-center justify-end text-xs text-green-600">
                               <CheckSquare size={12} className="mr-1" /> Fait
                             </div>
                             <button onClick={() => moveTask(task, 'in-progress')} className="mt-2 w-full text-xs text-slate-400 hover:text-blue-500 text-center py-1 no-print">
                               Réouvrir
                             </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}
                {viewMode === 'gantt' && renderGanttTimeline(projectTasks, false)}
                {viewMode === 'list' && renderTaskList()}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
               <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                 <CheckSquare size={40} className="text-slate-300 dark:text-slate-600" />
               </div>
               <p>Sélectionnez un projet ou utilisez la vue d'ensemble</p>
            </div>
          )
        )}
      </div>

      {/* EDIT TASK MODAL */}
      {editingTask && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-6 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier la tâche</h2>
              <button onClick={() => setEditingTask(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveEditTask} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Titre</label>
                <input type="text" required value={editingTask.title} onChange={(e) => setEditingTask({...editingTask, title: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
                  <input type="date" required value={editingTask.startDate} onChange={(e) => setEditingTask({...editingTask, startDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
                  <input type="date" required value={editingTask.endDate} onChange={(e) => setEditingTask({...editingTask, endDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Priorité</label>
                   <select value={editingTask.priority} onChange={(e) => setEditingTask({...editingTask, priority: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                     <option value="low">Basse</option>
                     <option value="medium">Moyenne</option>
                     <option value="high">Haute</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Statut</label>
                   <select value={editingTask.status} onChange={(e) => setEditingTask({...editingTask, status: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                     <option value="todo">À faire</option>
                     <option value="in-progress">En cours</option>
                     <option value="done">Terminé</option>
                   </select>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
                <button type="button" onClick={handleDeleteEditTask} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Trash2 size={16} /> Supprimer</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingTask(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Annuler</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Save size={16} /> Enregistrer</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT MODAL */}
      {editingProject && (
        <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 p-6 scale-100 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Modifier le projet</h2>
              <button onClick={() => setEditingProject(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
            </div>
            
            <form onSubmit={handleSaveEditProject} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nom du projet</label>
                <input type="text" required value={editingProject.name} onChange={(e) => setEditingProject({...editingProject, name: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input type="text" value={editingProject.description || ''} onChange={(e) => setEditingProject({...editingProject, description: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="Objectif du projet..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de début</label>
                  <input type="date" value={editingProject.startDate || ''} onChange={(e) => setEditingProject({...editingProject, startDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Date de fin</label>
                  <input type="date" value={editingProject.endDate || ''} onChange={(e) => setEditingProject({...editingProject, endDate: e.target.value})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Priorité</label>
                   <select value={editingProject.priority || 'medium'} onChange={(e) => setEditingProject({...editingProject, priority: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                     <option value="low">Basse</option>
                     <option value="medium">Moyenne</option>
                     <option value="high">Haute</option>
                   </select>
                </div>
                <div>
                   <label className="block text-xs font-medium text-slate-500 mb-1">Statut global</label>
                   <select value={editingProject.status || 'active'} onChange={(e) => setEditingProject({...editingProject, status: e.target.value as any})} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm">
                     <option value="active">Actif</option>
                     <option value="on-hold">En pause</option>
                     <option value="completed">Terminé</option>
                   </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 mt-6">
                <button type="button" onClick={handleDeleteEditProject} className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"><Trash2 size={16} /> Supprimer</button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setEditingProject(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg text-sm font-medium">Annuler</button>
                  <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"><Save size={16} /> Enregistrer</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};