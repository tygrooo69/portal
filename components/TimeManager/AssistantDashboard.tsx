import React, { useState, useMemo } from 'react';
import { ArrowLeft, Filter, CheckSquare, Square, CheckCircle, Search } from 'lucide-react';
import { User, Timesheet, LeaveRequest } from '../../types';

interface AssistantDashboardProps {
  users: User[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  onSaveTimesheet: (timesheet: Timesheet) => void;
  onUpdateLeaveRequest: (request: LeaveRequest) => void;
  onBack: () => void;
}

export const AssistantDashboard: React.FC<AssistantDashboardProps> = ({
  users, timesheets, leaveRequests, onSaveTimesheet, onUpdateLeaveRequest, onBack
}) => {
  const [filterService, setFilterService] = useState<string>('all');
  const [showProcessed, setShowProcessed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Get unique services
  const services = Array.from(new Set(users.map(u => u.service).filter(Boolean)));

  const filteredData = useMemo(() => {
    let ts = timesheets.filter(t => t.status !== 'draft');
    let lr = leaveRequests.filter(l => l.status !== 'pending');

    if (filterService !== 'all') {
      ts = ts.filter(t => {
        const u = users.find(user => user.id === t.userId);
        return u?.service === filterService;
      });
      lr = lr.filter(l => {
        const u = users.find(user => user.id === l.userId);
        return u?.service === filterService;
      });
    }

    if (!showProcessed) {
      ts = ts.filter(t => !t.isProcessed);
      lr = lr.filter(l => !l.isProcessed);
    }

    if (searchQuery) {
       const lowerQ = searchQuery.toLowerCase();
       ts = ts.filter(t => {
          const u = users.find(user => user.id === t.userId);
          return u?.name.toLowerCase().includes(lowerQ);
       });
       lr = lr.filter(l => {
          const u = users.find(user => user.id === l.userId);
          return u?.name.toLowerCase().includes(lowerQ);
       });
    }

    // Combine and sort
    const combined = [
      ...ts.map(t => ({ ...t, _type: 'timesheet' as const, date: t.weekStartDate })),
      ...lr.map(l => ({ ...l, _type: 'leave' as const, date: l.createdAt }))
    ];

    return combined.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timesheets, leaveRequests, users, filterService, showProcessed, searchQuery]);

  const toggleProcessedTimesheet = (sheet: Timesheet) => {
    onSaveTimesheet({ ...sheet, isProcessed: !sheet.isProcessed });
  };

  const toggleProcessedLeave = (req: LeaveRequest) => {
    onUpdateLeaveRequest({ ...req, isProcessed: !req.isProcessed });
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espace Assistante</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
         <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-500" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Service :</span>
            <select 
              value={filterService}
              onChange={e => setFilterService(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
            >
               <option value="all">Tous les services</option>
               {services.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>

         <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
             <div className="relative w-full md:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un collaborateur..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
             </div>
         </div>

         <label className="flex items-center gap-2 cursor-pointer ml-auto">
            <input 
              type="checkbox" 
              checked={showProcessed} 
              onChange={e => setShowProcessed(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">Afficher les éléments traités</span>
         </label>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
           <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
             <tr>
               <th className="px-6 py-4">Utilisateur</th>
               <th className="px-6 py-4">Service</th>
               <th className="px-6 py-4">Type</th>
               <th className="px-6 py-4">Période / Date</th>
               <th className="px-6 py-4">Statut</th>
               <th className="px-6 py-4 text-center">Traité</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
             {filteredData.map((item: any) => {
               const u = users.find(user => user.id === item.userId);
               const isSheet = item._type === 'timesheet';
               
               return (
                 <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                   <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{u?.name}</td>
                   <td className="px-6 py-4 text-slate-500">{u?.service || '-'}</td>
                   <td className="px-6 py-4">
                     {isSheet ? (
                       <span className="flex items-center gap-2 text-blue-600"><CheckCircle size={16} /> Feuille d'heures</span>
                     ) : (
                       <span className="flex items-center gap-2 text-purple-600"><CheckCircle size={16} /> Congé ({item.type})</span>
                     )}
                   </td>
                   <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {isSheet ? `Semaine du ${item.weekStartDate}` : `Du ${item.startDate} au ${item.endDate}`}
                   </td>
                   <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                          ${item.status === 'approved' ? 'bg-green-100 text-green-700' : 
                            item.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}
                      `}>
                          {item.status === 'approved' ? 'Validé' : item.status === 'rejected' ? 'Refusé' : 'Attente'}
                      </span>
                   </td>
                   <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => isSheet ? toggleProcessedTimesheet(item) : toggleProcessedLeave(item)}
                        className={`p-2 rounded-lg transition-colors ${item.isProcessed ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-slate-500'}`}
                      >
                         {item.isProcessed ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                   </td>
                 </tr>
               );
             })}
             {filteredData.length === 0 && (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune donnée à afficher.</td>
               </tr>
             )}
           </tbody>
        </table>
      </div>
    </div>
  );
};