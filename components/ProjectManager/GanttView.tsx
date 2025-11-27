
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Filter, ChevronUp, ChevronDown } from 'lucide-react';
import { Project, Task } from '../../types';
import { addDays, getDaysDiff } from './utils';

type GanttScope = 'day' | 'week' | 'month';

interface GanttViewProps {
  items: (Task | Project)[];
  allTasks?: Task[];
  allProjects?: Project[];
  isProjects: boolean;
  onUpdateTask?: (task: Task) => void;
  onUpdateProject?: (project: Project) => void;
  onReorder?: (newOrder: (Task | Project)[]) => void;
  onEdit: (item: any) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ 
  items, 
  allTasks = [],
  allProjects = [],
  isProjects, 
  onUpdateTask, 
  onUpdateProject,
  onReorder,
  onEdit 
}) => {
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 3)));
  const [ganttScope, setGanttScope] = useState<GanttScope>('day');
  const timelineRef = useRef<HTMLDivElement>(null);

  // --- CONFIGURATION ---
  const ROW_HEIGHT = 60; 
  const BAR_HEIGHT = 36;
  const PADDING_TOP = 16;

  const ganttConfig = useMemo(() => {
    switch(ganttScope) {
      case 'month': return { colWidth: 15, daysToRender: 180, label: 'Mois' };
      case 'week': return { colWidth: 30, daysToRender: 90, label: 'Semaine' };
      case 'day': default: return { colWidth: 60, daysToRender: 30, label: 'Jour' };
    }
  }, [ganttScope]);

  // --- STATE FOR DRAG OPERATIONS (TIME BARS ONLY) ---
  
  // 1. Visual State (for rendering the UI updates)
  const [visualDragState, setVisualDragState] = useState<{
    itemId: string;
    currentDeltaDays: number;
  } | null>(null);

  // 2. Logic State (Mutable Ref for Event Listeners to avoid stale closures)
  const dragOperation = useRef<{
    active: boolean;
    itemId: string;
    type: 'move' | 'resize';
    startX: number;
    originalStart: string;
    originalEnd: string;
    currentDeltaDays: number;
  } | null>(null);

  // 3. Tooltip State
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // --- VIEW NAVIGATION ---
  const shiftView = (days: number) => {
    const newDate = new Date(viewStartDate);
    newDate.setDate(newDate.getDate() + days);
    setViewStartDate(newDate);
  };

  const resetViewToToday = () => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    setViewStartDate(d);
  };

  // Generate Timeline Dates
  const dates = [];
  for (let i = 0; i < ganttConfig.daysToRender; i++) {
    const d = new Date(viewStartDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  const timelineStartTs = dates[0].getTime();

  // --- TIME BAR DRAG HANDLERS ---

  const handleTimeDragStart = (e: React.MouseEvent, item: Task | Project, type: 'move' | 'resize') => {
    e.stopPropagation(); 
    e.preventDefault(); 

    if (e.button !== 0) return; // Only left click

    const start = item.startDate || new Date().toISOString().split('T')[0];
    const end = item.endDate || new Date().toISOString().split('T')[0];

    // Initialize mutable ref
    dragOperation.current = {
      active: true,
      itemId: item.id,
      type,
      startX: e.clientX,
      originalStart: start,
      originalEnd: end,
      currentDeltaDays: 0
    };

    // Initialize visual state
    setVisualDragState({
      itemId: item.id,
      currentDeltaDays: 0
    });

    setMousePos({ x: e.clientX, y: e.clientY });

    // Attach global listeners
    window.addEventListener('mousemove', handleTimeDragMove);
    window.addEventListener('mouseup', handleTimeDragEnd);
  };

  const handleTimeDragMove = (e: MouseEvent) => {
    if (!dragOperation.current || !dragOperation.current.active) return;

    const op = dragOperation.current;
    const pixelDelta = e.clientX - op.startX;
    const daysDelta = Math.round(pixelDelta / ganttConfig.colWidth);

    // Update ref
    op.currentDeltaDays = daysDelta;

    // Update visual state (triggers render)
    setVisualDragState(prev => {
      if (prev?.currentDeltaDays === daysDelta) return prev; // No render if no change
      return { ...prev!, currentDeltaDays: daysDelta };
    });

    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleTimeDragEnd = (e: MouseEvent) => {
    if (!dragOperation.current) return;

    const op = dragOperation.current;
    
    // If there was movement, commit changes
    if (op.currentDeltaDays !== 0) {
      // Find item from props (fresh)
      const item = items.find(i => i.id === op.itemId);
      
      if (item) {
        let newStart = op.originalStart;
        let newEnd = op.originalEnd;

        if (op.type === 'move') {
          newStart = addDays(op.originalStart, op.currentDeltaDays);
          newEnd = addDays(op.originalEnd, op.currentDeltaDays);
        } else {
          // Resize (Right handle only for now)
          newEnd = addDays(op.originalEnd, op.currentDeltaDays);
          // Prevent end date before start date
          if (new Date(newEnd) < new Date(newStart)) {
             newEnd = newStart;
          }
        }

        // Trigger Update
        if (isProjects && onUpdateProject) {
          onUpdateProject({ ...(item as Project), startDate: newStart, endDate: newEnd });
        } else if (!isProjects && onUpdateTask) {
          onUpdateTask({ ...(item as Task), startDate: newStart, endDate: newEnd });
        }
      }
    }

    // Cleanup
    dragOperation.current = null;
    setVisualDragState(null);
    setMousePos(null);
    window.removeEventListener('mousemove', handleTimeDragMove);
    window.removeEventListener('mouseup', handleTimeDragEnd);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', handleTimeDragMove);
      window.removeEventListener('mouseup', handleTimeDragEnd);
    };
  }, []);


  // --- REORDER HANDLERS (ARROWS) ---

  const handleMoveUp = (index: number) => {
    if (index <= 0 || !onReorder) return;
    const newItems = [...items];
    // Swap
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    onReorder(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1 || !onReorder) return;
    const newItems = [...items];
    // Swap
    [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
    onReorder(newItems);
  };


  // --- RENDER HELPERS ---

  // Calculate display metrics for an item
  const getItemMetrics = (item: Task | Project) => {
    // Use drag state if active, otherwise item props
    const isDragging = visualDragState?.itemId === item.id;
    const op = dragOperation.current;

    let currentStart = item.startDate || new Date().toISOString().split('T')[0];
    let currentEnd = item.endDate || new Date().toISOString().split('T')[0];

    // If dragging, calculate temporary positions based on original + delta
    // We use 'op' (ref) for calculation source of truth if available, but visualDragState for reactivity
    if (isDragging && op) {
      if (op.type === 'move') {
        currentStart = addDays(op.originalStart, visualDragState!.currentDeltaDays);
        currentEnd = addDays(op.originalEnd, visualDragState!.currentDeltaDays);
      } else {
        currentEnd = addDays(op.originalEnd, visualDragState!.currentDeltaDays);
        if (new Date(currentEnd) < new Date(currentStart)) currentEnd = currentStart;
      }
    }

    const diffDays = getDaysDiff(new Date(timelineStartTs).toISOString(), currentStart);
    const durationDays = getDaysDiff(currentStart, currentEnd) || 1;
    
    const left = diffDays * ganttConfig.colWidth;
    const width = durationDays * ganttConfig.colWidth;

    const visible = (diffDays + durationDays >= 0) && (diffDays <= ganttConfig.daysToRender);

    return { left, width, visible, currentStart, currentEnd, durationDays };
  };

  // --- SVG CONNECTIONS ---
  const renderDependencyLines = () => {
    if (!isProjects && !allTasks.length) return null;

    return (
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 overflow-visible">
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
          </marker>
          <marker id="circlehead" markerWidth="4" markerHeight="4" refX="2" refY="2">
             <circle cx="2" cy="2" r="2" fill="#94a3b8" />
          </marker>
        </defs>
        {items.map((item, index) => {
          const dependencies = (item as any).dependencies;
          if (!dependencies || dependencies.length === 0) return null;

          const metrics = getItemMetrics(item);
          if (!metrics.visible) return null;

          // Calculate vertical center based on row height + padding
          const currentY = PADDING_TOP + (index * ROW_HEIGHT) + (ROW_HEIGHT / 2);

          return dependencies.map((depId: string) => {
            const depIndex = items.findIndex(i => i.id === depId);
            if (depIndex === -1) return null;

            const depItem = items[depIndex];
            const depMetrics = getItemMetrics(depItem);
            
            const depY = PADDING_TOP + (depIndex * ROW_HEIGHT) + (ROW_HEIGHT / 2);
            
            const x1 = depMetrics.left + depMetrics.width;
            const y1 = depY;
            const x2 = metrics.left;
            const y2 = currentY;

            let path = "";
            const spur = 15;

            if (x2 > x1 + spur) {
              path = `M ${x1} ${y1} L ${x1 + spur} ${y1} L ${x1 + spur} ${y2} L ${x2} ${y2}`;
            } else {
              const midY = y1 + (y2 > y1 ? 10 : -10); // tighter curve
              path = `M ${x1} ${y1} L ${x1 + spur} ${y1} L ${x1 + spur} ${midY} L ${x2 - spur} ${midY} L ${x2 - spur} ${y2} L ${x2} ${y2}`;
            }

            return (
              <path 
                key={`${depId}-${item.id}`}
                d={path}
                stroke="#94a3b8"
                strokeWidth="1.5"
                fill="none"
                markerStart="url(#circlehead)"
                markerEnd="url(#arrowhead)"
                strokeLinejoin="round"
                className="dark:stroke-slate-500 opacity-60 hover:opacity-100 hover:stroke-2 hover:stroke-blue-500 transition-all duration-200"
              />
            );
          });
        })}
      </svg>
    );
  };

  // --- TOOLTIP ---
  const DragTooltip = () => {
    if (!visualDragState || !mousePos || !dragOperation.current) return null;
    
    const op = dragOperation.current;
    const delta = visualDragState.currentDeltaDays;
    
    let newStart = op.originalStart;
    let newEnd = op.originalEnd;
    
    if (op.type === 'move') {
      newStart = addDays(op.originalStart, delta);
      newEnd = addDays(op.originalEnd, delta);
    } else {
      newEnd = addDays(op.originalEnd, delta);
      if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
    }

    return (
      <div 
        className="fixed z-[9999] bg-slate-800 text-white text-xs px-2 py-1.5 rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full -mt-2"
        style={{ left: mousePos.x, top: mousePos.y }}
      >
        <div className="flex flex-col items-center whitespace-nowrap">
          <span className="font-semibold">{new Date(newStart).toLocaleDateString()} - {new Date(newEnd).toLocaleDateString()}</span>
          <span className="text-slate-400 text-[10px]">
            {getDaysDiff(newStart, newEnd)} jours ({delta > 0 ? '+' : ''}{delta}j)
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-full select-none print:border-0 print:shadow-none print:h-auto print:block relative">
      
      <DragTooltip />

      {/* Header Controls */}
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
      
      {/* Timeline Content */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden relative print:overflow-visible print:h-auto" ref={timelineRef}>
        <div style={{ width: `${ganttConfig.daysToRender * ganttConfig.colWidth}px` }} className="min-h-full relative print:w-full print:h-auto">
           
           {/* Header Dates */}
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

           {/* Vertical Grid Lines */}
           <div className="absolute inset-0 top-12 flex pointer-events-none z-0 print:h-full">
             {dates.map((date, i) => (
               <div key={i} className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-800/50 h-full ${(date.getDay() === 0 || date.getDay() === 6) ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`} style={{ width: `${ganttConfig.colWidth}px` }} />
             ))}
           </div>

           {/* Items Container */}
           <div className="relative z-10 print:space-y-6" style={{ paddingTop: `${PADDING_TOP}px`, paddingBottom: '16px' }}>
              
              {renderDependencyLines()}

              {items.map((item, index) => {
                const metrics = getItemMetrics(item);
                if (!metrics.visible) return null;
                
                let colorClass = 'bg-slate-400';
                const status = (item as any).status;
                if (status === 'done' || status === 'completed') colorClass = 'bg-green-500';
                else if (status === 'in-progress' || status === 'active') colorClass = 'bg-blue-500';
                else if (status === 'on-hold') colorClass = 'bg-orange-500';

                const label = (item as any).title || (item as any).name;
                const isDragging = visualDragState?.itemId === item.id;

                // Check for checklist progress
                const subtasks = (item as any).subtasks || [];
                const totalSub = subtasks.length;
                const completedSub = subtasks.filter((s: any) => s.completed).length;
                const progressPercent = totalSub > 0 ? (completedSub / totalSub) * 100 : 0;

                return (
                  <div 
                    key={item.id} 
                    className="relative group print:h-8 border-b border-slate-100 dark:border-slate-800/50 box-border"
                    style={{ height: `${ROW_HEIGHT}px` }}
                  >
                     {/* Text Label with Reorder Buttons */}
                     <div 
                       className="absolute text-base text-slate-700 dark:text-slate-200 font-semibold truncate px-3 cursor-pointer hover:text-blue-600 z-20 print:text-black print:text-xs print:leading-8 flex items-center h-full"
                       onDoubleClick={(e) => { e.stopPropagation(); onEdit(item); }}
                       style={{ left: Math.max(0, metrics.left), maxWidth: Math.max(metrics.width, 250) }}
                     >
                       {!!onReorder && (
                         <div className="flex flex-col gap-0.5 mr-2 opacity-0 group-hover:opacity-100 transition-opacity print:hidden bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 shadow-sm scale-90">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMoveUp(index); }}
                              disabled={index === 0}
                              className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-colors rounded-t"
                              title="Monter"
                            >
                              <ChevronUp size={10} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleMoveDown(index); }}
                              disabled={index === items.length - 1}
                              className="p-0.5 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-current transition-colors rounded-b"
                              title="Descendre"
                            >
                              <ChevronDown size={10} />
                            </button>
                         </div>
                       )}
                       <span className="truncate">{label}</span>
                     </div>

                     {/* Time Bar */}
                     <div 
                       className={`absolute rounded-lg ${colorClass} shadow-md flex items-center px-3 group/bar ${isDragging ? 'brightness-110 shadow-lg ring-2 ring-blue-400/50 z-30' : ''} print:border print:border-slate-500 overflow-hidden`}
                       style={{ 
                         left: `${metrics.left}px`, 
                         width: `${Math.max(metrics.width, 10)}px`, 
                         height: `${BAR_HEIGHT}px`,
                         top: `${(ROW_HEIGHT - BAR_HEIGHT) / 2}px`,
                         cursor: isDragging ? 'grabbing' : 'grab', 
                         opacity: 0.9 
                       }}
                       onMouseDown={(e) => handleTimeDragStart(e, item, 'move')}
                       onDoubleClick={(e) => { e.stopPropagation(); onEdit(item); }}
                     >
                       {/* Checklist Progress Bar Overlay - High Contrast */}
                       {totalSub > 0 && (
                         <div 
                           className="absolute top-0 left-0 h-full bg-black/50 pointer-events-none transition-all duration-300"
                           style={{ 
                             width: `${progressPercent}%`,
                             borderRadius: progressPercent === 100 ? '8px' : '8px 0 0 8px'
                           }}
                         />
                       )}

                       {metrics.width > 40 && <span className="text-xs text-white/90 truncate ml-auto pointer-events-none print:text-white select-none relative z-10 font-medium">{metrics.durationDays}j</span>}
                       
                       {/* Progress Text */}
                       {totalSub > 0 && metrics.width > 60 && (
                          <span className="absolute bottom-0.5 left-2 text-[10px] text-white/90 font-bold pointer-events-none z-10">
                            {Math.round(progressPercent)}%
                          </span>
                       )}

                       {/* Resize Handle (Right) */}
                       <div 
                         className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 flex items-center justify-center rounded-r-lg transition-colors z-40 print:hidden" 
                         onMouseDown={(e) => handleTimeDragStart(e, item, 'resize')}
                       >
                         <div className="w-0.5 h-4 bg-white/50 rounded-full pointer-events-none" />
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
