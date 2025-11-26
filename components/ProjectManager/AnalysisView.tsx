
import React, { useMemo } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';
import { CheckCircle, Clock, AlertTriangle, Activity, Users, Briefcase } from 'lucide-react';
import { Project, Task, User } from '../../types';

interface AnalysisViewProps {
  tasks: Task[];
  projects?: Project[]; // Optional, mainly for overview
  users: User[];
  isOverview: boolean;
}

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6'];

export const AnalysisView: React.FC<AnalysisViewProps> = ({ tasks, projects = [], users, isOverview }) => {
  
  // --- CALCULATIONS ---

  const kpis = useMemo(() => {
    const totalTasks = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const todo = tasks.filter(t => t.status === 'todo').length;
    
    const now = new Date();
    now.setHours(0,0,0,0);
    const overdue = tasks.filter(t => t.status !== 'done' && new Date(t.endDate) < now).length;
    
    const progressRate = totalTasks > 0 ? Math.round((completed / totalTasks) * 100) : 0;

    return { totalTasks, completed, inProgress, todo, overdue, progressRate };
  }, [tasks]);

  const statusData = useMemo(() => [
    { name: 'À faire', value: kpis.todo, color: '#94a3b8' },
    { name: 'En cours', value: kpis.inProgress, color: '#3b82f6' },
    { name: 'Terminé', value: kpis.completed, color: '#22c55e' },
  ].filter(d => d.value > 0), [kpis]);

  const priorityData = useMemo(() => {
    const high = tasks.filter(t => t.priority === 'high').length;
    const medium = tasks.filter(t => t.priority === 'medium').length;
    const low = tasks.filter(t => t.priority === 'low').length;
    return [
      { name: 'Haute', value: high, fill: '#ef4444' },
      { name: 'Moyenne', value: medium, fill: '#3b82f6' },
      { name: 'Basse', value: low, fill: '#94a3b8' },
    ];
  }, [tasks]);

  const workloadData = useMemo(() => {
    // Get top 10 active users
    const userCounts = users.map(user => {
      const count = tasks.filter(t => t.assignee === user.id && t.status !== 'done').length;
      return { name: user.name.split(' ')[0], value: count };
    })
    .filter(u => u.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);
    
    return userCounts;
  }, [tasks, users]);

  const projectsStatusData = useMemo(() => {
    if (!isOverview) return [];
    const active = projects.filter(p => p.status === 'active' || !p.status).length;
    const onHold = projects.filter(p => p.status === 'on-hold').length;
    const completed = projects.filter(p => p.status === 'completed').length;
    return [
      { name: 'Actifs', value: active, fill: '#3b82f6' },
      { name: 'En pause', value: onHold, fill: '#f97316' },
      { name: 'Terminés', value: completed, fill: '#22c55e' },
    ];
  }, [projects, isOverview]);

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950">
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-lg">
             <Activity size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500 dark:text-slate-400">Avancement Global</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpis.progressRate}%</p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg">
             <CheckCircle size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500 dark:text-slate-400">Tâches Terminées</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpis.completed} <span className="text-sm font-normal text-slate-400">/ {kpis.totalTasks}</span></p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg">
             <AlertTriangle size={24} />
           </div>
           <div>
             <p className="text-sm text-slate-500 dark:text-slate-400">En Retard</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white">{kpis.overdue}</p>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
           <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
             {isOverview ? <Briefcase size={24} /> : <Clock size={24} />}
           </div>
           <div>
             <p className="text-sm text-slate-500 dark:text-slate-400">{isOverview ? 'Projets Actifs' : 'Tâches en cours'}</p>
             <p className="text-2xl font-bold text-slate-800 dark:text-white">{isOverview ? projects.filter(p => p.status === 'active').length : kpis.inProgress}</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Chart 1: Task Status */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">État des Tâches</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={80}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                 />
                 <Legend />
               </PieChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 2: Workload */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Users size={20}/> Charge de travail (Tâches actives)</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" opacity={0.3} />
                 <XAxis type="number" hide />
                 <YAxis dataKey="name" type="category" width={80} tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                 />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 3: Priority */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
           <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Répartition par Priorité</h3>
           <div className="h-64 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={priorityData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.3} />
                 <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                 <YAxis hide />
                 <Tooltip 
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                 />
                 <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                 </Bar>
               </BarChart>
             </ResponsiveContainer>
           </div>
        </div>

        {/* Chart 4: Project Status (Overview Only) or Timeline Placeholder */}
        {isOverview ? (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">État des Projets</h3>
             <div className="h-64 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={projectsStatusData}
                     cx="50%"
                     cy="50%"
                     innerRadius={0}
                     outerRadius={80}
                     paddingAngle={2}
                     dataKey="value"
                   >
                     {projectsStatusData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.fill} />
                     ))}
                   </Pie>
                   <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                   />
                   <Legend />
                 </PieChart>
               </ResponsiveContainer>
             </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center text-center text-slate-400">
             <Briefcase size={48} className="mb-4 opacity-50" />
             <p>Les données spécifiques au projet s'affichent ici.</p>
          </div>
        )}

      </div>
    </div>
  );
};
