
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, Filter } from 'lucide-react';
import { Project, Task } from '../../types';
import { addDays, getDaysDiff } from './utils';

type GanttScope = 'day' | 'week' | 'month';

interface GanttViewProps {
  items: (Task | Project)[];
  isProjects: boolean;
  onUpdateTask?: (task: Task) => void;
  onUpdateProject?: (project: Project) => void;
  onEdit: (item: any) => void;
}

export const GanttView: React.FC<GanttViewProps> = ({ 
  items, 
  isProjects, 
  onUpdateTask, 
  onUpdateProject,
  onEdit 
}) => {
  const [viewStartDate, setViewStartDate] = useState<Date>(new Date(new Date().setDate(new Date().getDate() - 3)));
  const [ganttScope, setGanttScope] = useState<GanttScope>('day');
  const timelineRef = useRef<HTMLDivElement>(null);

  // Drag State
  const [dragState, setDragState] = useState<{
    itemId: string;
    type: 'move' | 'resize';
    startX: number;
    originalStart: string;
    originalEnd: string;
    currentDeltaDays: number;
  } | null>(null);

  const ganttConfig = useMemo(() => {
    switch(ganttScope) {
      case 'month': return { colWidth: 15, daysToRender: 180, label: 'Mois' };
      case 'week': return { colWidth: 30, daysToRender: 90, label: 'Semaine' };
      case 'day': default: return { colWidth: 60, daysToRender: 30, label: 'Jour' };
    }
  }, [ganttScope]);

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

  const dates = [];
  for (let i = 0; i < ganttConfig.daysToRender; i++) {
    const d = new Date(viewStartDate);
    d.setDate(d.getDate() + i);
    dates.push(d);
  }
  const timelineStartTs = dates[0].getTime();

  // --- DRAG LOGIC ---
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pixelDelta = e.clientX - dragState.startX;
      const daysDelta = Math.round(pixelDelta / ganttConfig.colWidth);
      setDragState(prev => prev ? { ...prev, currentDeltaDays: daysDelta } : null);
    };

    const handleMouseUp = () => {
      if (dragState.currentDeltaDays !== 0) {
        const item = items.find(i => i.id === dragState.itemId);
        if (item) {
           let newStart = dragState.originalStart;
           let newEnd = dragState.originalEnd;
           
           if (dragState.type === 'move') {
             newStart = addDays(dragState.originalStart, dragState.currentDeltaDays);
             newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
           } else {
             newEnd = addDays(dragState.originalEnd, dragState.currentDeltaDays);
             if (new Date(newEnd) < new Date(newStart)) newEnd = newStart;
           }

           if (isProjects && onUpdateProject) {
             onUpdateProject({ ...item as Project, startDate: newStart, endDate: newEnd });
           } else if (!isProjects && onUpdateTask) {
             onUpdateTask({ ...item as Task, startDate: newStart, endDate: newEnd });
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
  }, [dragState, items, ganttConfig.colWidth, isProjects, onUpdateProject, onUpdateTask]);

  const initDrag = (e: React.MouseEvent, itemId: string, type: 'move' | 'resize', item: any) => {
    e.stopPropagation();
    if (e.detail === 2) return;
    setDragState({
      itemId,
      type,
      startX: e.clientX,
      originalStart: item.startDate || new Date().toISOString().split('T')[0],
      originalEnd: item.endDate || new Date().toISOString().split('T')[0],
      currentDeltaDays: 0
    });
  };

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
           {/* Header Row */}
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

           {/* Grid Lines */}
           <div className="absolute inset-0 top-12 flex pointer-events-none z-0 print:h-full">
             {dates.map((date, i) => (
               <div key={i} className={`flex-shrink-0 border-r border-slate-100 dark:border-slate-800/50 h-full ${(date.getDay() === 0 || date.getDay() === 6) ? 'bg-slate-50/50 dark:bg-slate-800/20' : ''}`} style={{ width: `${ganttConfig.colWidth}px` }} />
             ))}
           </div>

           {/* Bars */}
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
                       onDoubleClick={(e) => { e.stopPropagation(); onEdit(item); }}
                       style={{ left: Math.max(0, left), maxWidth: Math.max(width, 200) }}
                     >
                       {label}
                     </div>
                     <div 
                       className={`absolute top-2 h-6 rounded-md ${colorClass} shadow-sm flex items-center px-2 group/bar ${isDragging ? 'brightness-110 shadow-lg ring-2 ring-blue-400/50 z-30' : ''} print:border print:border-slate-500`}
                       style={{ left: `${left}px`, width: `${Math.max(width, 5)}px`, cursor: isDragging ? 'grabbing' : 'grab', opacity: 0.9 }}
                       onMouseDown={(e) => initDrag(e, item.id, 'move', item)}
                       onDoubleClick={(e) => { e.stopPropagation(); onEdit(item); }}
                     >
                       {width > 40 && <span className="text-[10px] text-white/90 truncate ml-auto pointer-events-none print:text-white">{durationDays}j</span>}
                       <div className="absolute right-0 top-0 bottom-0 w-4 cursor-ew-resize hover:bg-black/10 flex items-center justify-center rounded-r-md transition-colors z-40 print:hidden" onMouseDown={(e) => initDrag(e, item.id, 'resize', item)}>
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
