import React, { useState, useMemo } from 'react';
import { ArrowLeft, Search, History, Clock, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Users, UserX, Activity, Info, FileText, Image as ImageIcon } from 'lucide-react';
import { User, Timesheet, LeaveRequest } from '../../types';

interface ValidationViewProps {
  currentUser: User;
  users: User[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  onSaveTimesheet: (timesheet: Timesheet) => void;
  onUpdateLeaveRequest: (request: LeaveRequest) => void;
  onBack: () => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  currentUser, users, timesheets, leaveRequests, onSaveTimesheet, onUpdateLeaveRequest, onBack
}) => {
  const [validationTab, setValidationTab] = useState<'timesheets' | 'leaves' | 'planning'>('timesheets');
  const [viewType, setViewType] = useState<'pending' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for Planning View
  const [planningDate, setPlanningDate] = useState(new Date());

  // State for Image Preview Modal
  const [previewImages, setPreviewImages] = useState<string[] | null>(null);

  // Filter logic
  const filterBySearch = (userId: string) => {
    if (!searchQuery) return true;
    const u = users.find(usr => usr.id === userId);
    return u?.name.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const myTimesheets = timesheets.filter(t => {
    const isMyScope = t.managerId === currentUser.id;
    const matchesSearch = filterBySearch(t.userId);
    const matchesStatus = viewType === 'pending' 
      ? t.status === 'submitted' 
      : (t.status === 'approved' || t.status === 'rejected');
    
    return isMyScope && matchesSearch && matchesStatus;
  }).sort((a,b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime());

  const myLeaves = leaveRequests.filter(l => {
    const isMyScope = l.managerId === currentUser.id;
    const matchesSearch = filterBySearch(l.userId);
    const matchesStatus = viewType === 'pending'
      ? l.status === 'pending'
      : (l.status === 'approved' || l.status === 'rejected');

    return isMyScope && matchesSearch && matchesStatus;
  }).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const validateTimesheet = (sheet: Timesheet, approved: boolean) => {
    onSaveTimesheet({ 
      ...sheet, 
      status: approved ? 'approved' : 'rejected' 
    });
  };

  const validateLeave = (req: LeaveRequest, approved: boolean) => {
    onUpdateLeaveRequest({
      ...req,
      status: approved ? 'approved' : 'rejected'
    });
  };

  // --- PLANNING LOGIC ---

  const changePlanningMonth = (delta: number) => {
    const newDate = new Date(planningDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setPlanningDate(newDate);
  };

  const daysInMonth = useMemo(() => {
    const year = planningDate.getFullYear();
    const month = planningDate.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let i = 1; i <= days; i++) {
      result.push(new Date(year, month, i));
    }
    return result;
  }, [planningDate]);

  const planningUsers = users.filter(u => filterBySearch(u.id));

  const getLeaveForUserDate = (userId: string, date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return leaveRequests.find(req => {
      return req.userId === userId && 
             req.startDate <= dateStr && 
             req.endDate >= dateStr &&
             req.status !== 'rejected';
    });
  };

  const getLeaveColor = (type: string) => {
    switch(type) {
      case 'paid': return 'bg-blue-500';
      case 'rtt': return 'bg-purple-500';
      case 'rcr': return 'bg-teal-500';
      case 'sick': return 'bg-red-500';
      case 'unpaid': return 'bg-slate-500';
      default: return 'bg-gray-400';
    }
  };

  // KPIs Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const activeEmployeesCount = users.length;
  
  const absentsToday = users.filter(u => {
    return leaveRequests.some(req => 
      req.userId === u.id && req.startDate <= todayStr && req.endDate >= todayStr && req.status === 'approved'
    );
  }).length;

  const absentsTomorrow = users.filter(u => {
    return leaveRequests.some(req => 
      req.userId === u.id && req.startDate <= tomorrowStr && req.endDate >= tomorrowStr && req.status === 'approved'
    );
  }).length;

  const presenceRate = activeEmployeesCount > 0 
    ? Math.round(((activeEmployeesCount - absentsToday) / activeEmployeesCount) * 100) 
    : 0;

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto flex flex-col relative">
       <div className="flex items-center gap-4 mb-6 flex-shrink-0">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espace Responsable</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center flex-shrink-0">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 w-full md:w-fit overflow-x-auto">
           <button 
             onClick={() => setValidationTab('timesheets')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${validationTab === 'timesheets' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             Feuilles d'heures
           </button>
           <button 
             onClick={() => setValidationTab('leaves')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${validationTab === 'leaves' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             Congés
           </button>
           <button 
             onClick={() => setValidationTab('planning')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${validationTab === 'planning' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
           >
             Planning d'équipe
           </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* View Type Toggle - Hide in Planning */}
          {validationTab !== 'planning' && (
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
               <button 
                 onClick={() => setViewType('pending')}
                 className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewType === 'pending' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
               >
                 <Clock size={16} /> À Traiter
               </button>
               <button 
                 onClick={() => setViewType('history')}
                 className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${viewType === 'history' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500'}`}
               >
                 <History size={16} /> Historique
               </button>
            </div>
          )}

          {/* Search */}
          <div className="relative">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <input 
               type="text" 
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Rechercher un nom..."
               className="pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
             />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
         {validationTab === 'timesheets' && (
            <div className="overflow-y-auto space-y-4 pb-6">
                {myTimesheets.length === 0 ? (
                   <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      {viewType === 'pending' ? "Aucune feuille d'heures à valider." : "Aucun historique de feuille d'heures."}
                   </div>
                ) : (
                   myTimesheets.map(sheet => {
                      const u = users.find(usr => usr.id === sheet.userId);
                      const isInterim = sheet.type === 'interim';
                      const totalHours = !isInterim ? sheet.entries.reduce((sum, e) => sum + e.hours.reduce((a,b)=>a+b,0), 0) : 0;
                      const isHistory = viewType === 'history';

                      return (
                        <div key={sheet.id} className={`bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 ${isHistory ? 'opacity-80 hover:opacity-100' : ''}`}>
                           <div className="flex justify-between items-start mb-4">
                              <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full ${u?.color || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}>
                                    {u?.name.charAt(0)}
                                 </div>
                                 <div>
                                    <p className="font-bold flex items-center gap-2">
                                       {isInterim ? `Intérimaire: ${sheet.interimName}` : u?.name}
                                       {isInterim && <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[10px] rounded-full">INTÉRIM</span>}
                                    </p>
                                    <p className="text-sm text-slate-500">
                                       {isInterim ? `Soumis par ${u?.name} le ${new Date(sheet.submittedAt!).toLocaleDateString()}` : `Semaine du ${sheet.weekStartDate}`}
                                    </p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 {!isInterim && <p className="text-2xl font-bold text-blue-600">{totalHours} h</p>}
                                 {isHistory && (
                                   <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sheet.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                      {sheet.status === 'approved' ? 'Validé' : 'Refusé'}
                                   </span>
                                 )}
                              </div>
                           </div>
                           
                           {isInterim ? (
                              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg mb-4 flex items-center justify-between">
                                 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <ImageIcon size={20} />
                                    <span className="text-sm font-medium">{(sheet.attachments || []).length} document(s) joint(s)</span>
                                 </div>
                                 <button 
                                   onClick={() => setPreviewImages(sheet.attachments || [])}
                                   className="text-sm text-blue-600 hover:underline font-medium"
                                 >
                                    Voir les images
                                 </button>
                              </div>
                           ) : (
                              <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-lg text-xs mb-4 overflow-x-auto">
                                 <table className="w-full text-left">
                                    <thead>
                                       <tr className="text-slate-500"><th className="pb-1">Affaire</th><th className="pb-1">Chantier</th><th className="pb-1 text-right">H</th></tr>
                                    </thead>
                                    <tbody>
                                       {sheet.entries.map(e => (
                                          <tr key={e.id}>
                                             <td className="py-1">{e.businessId}</td>
                                             <td className="py-1">{e.site}</td>
                                             <td className="py-1 text-right font-medium">{e.hours.reduce((a,b)=>a+b,0)}</td>
                                          </tr>
                                       ))}
                                    </tbody>
                                 </table>
                              </div>
                           )}

                           {!isHistory && (
                             <div className="flex justify-end gap-3">
                                <button onClick={() => {
                                   const r = prompt("Motif du refus :");
                                   if (r) onSaveTimesheet({ ...sheet, status: 'rejected', rejectionReason: r });
                                }} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Refuser</button>
                                <button onClick={() => validateTimesheet(sheet, true)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Valider</button>
                             </div>
                           )}
                        </div>
                      );
                   })
                )}
            </div>
         )}

         {/* ... Leaves and Planning tabs ... */}
         {validationTab === 'leaves' && (
            <div className="overflow-y-auto space-y-4 pb-6">
                {myLeaves.length === 0 ? (
                   <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                      {viewType === 'pending' ? "Aucune demande de congé à valider." : "Aucun historique de congés."}
                   </div>
                ) : (
                   myLeaves.map(req => {
                      const u = users.find(usr => usr.id === req.userId);
                      const isHistory = viewType === 'history';
                      return (
                         <div key={req.id} className={`bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 ${isHistory ? 'opacity-80 hover:opacity-100' : ''}`}>
                            <div className="flex items-center gap-4">
                               <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${u?.color || 'bg-gray-400'}`}>
                                  {u?.name.charAt(0)}
                               </div>
                               <div>
                                  <p className="font-bold">{u?.name}</p>
                                  <p className="text-sm text-slate-600 dark:text-slate-300 capitalize">
                                     {req.type === 'paid' ? 'Congés Payés' : 
                                      req.type === 'rtt' ? 'RTT' : 
                                      req.type === 'rcr' ? 'RCR' :
                                      req.type === 'sick' ? 'Maladie' : 'Sans solde'}
                                  </p>
                                  <p className="text-xs text-slate-500">Du {new Date(req.startDate).toLocaleDateString()} au {new Date(req.endDate).toLocaleDateString()}</p>
                                  {req.reason && <p className="text-xs text-slate-400 mt-1 italic">"{req.reason}"</p>}
                               </div>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                               {isHistory ? (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${req.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                     {req.status === 'approved' ? 'Accepté' : 'Refusé'}
                                  </span>
                               ) : (
                                 <div className="flex gap-3">
                                    <button onClick={() => validateLeave(req, false)} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Refuser</button>
                                    <button onClick={() => validateLeave(req, true)} className="px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Valider</button>
                                 </div>
                               )}
                            </div>
                         </div>
                      );
                   })
                )}
            </div>
         )}

         {validationTab === 'planning' && (
            <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
               {/* Header Planning */}
               <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-900/50">
                  {/* KPIs */}
                  <div className="flex gap-4 overflow-x-auto w-full lg:w-auto pb-2 lg:pb-0">
                     <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[140px]">
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg"><UserX size={18}/></div>
                        <div>
                           <p className="text-xs text-slate-500">Absents (Auj.)</p>
                           <p className="font-bold text-slate-800 dark:text-white">{absentsToday}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[140px]">
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 rounded-lg"><CalendarIcon size={18}/></div>
                        <div>
                           <p className="text-xs text-slate-500">Absents (Dem.)</p>
                           <p className="font-bold text-slate-800 dark:text-white">{absentsTomorrow}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-3 px-4 py-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 min-w-[140px]">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg"><Activity size={18}/></div>
                        <div>
                           <p className="text-xs text-slate-500">Présence</p>
                           <p className="font-bold text-slate-800 dark:text-white">{presenceRate}%</p>
                        </div>
                     </div>
                  </div>

                  {/* Month Navigator */}
                  <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                     <button onClick={() => changePlanningMonth(-1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><ChevronLeft size={20} /></button>
                     <span className="font-bold text-slate-800 dark:text-white w-32 text-center select-none">
                       {planningDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                     </span>
                     <button onClick={() => changePlanningMonth(1)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300"><ChevronRight size={20} /></button>
                  </div>
               </div>

               {/* Calendar Grid */}
               <div className="flex-1 overflow-auto relative custom-scrollbar">
                  <table className="w-full border-collapse min-w-max">
                     <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-20 shadow-sm">
                        <tr>
                           <th className="sticky left-0 z-30 bg-slate-50 dark:bg-slate-800 p-3 text-left min-w-[200px] border-b border-r border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                              Employé
                           </th>
                           {daysInMonth.map((d, i) => {
                              const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                              return (
                                <th key={i} className={`p-2 text-center border-b border-slate-200 dark:border-slate-700 min-w-[40px] ${isWeekend ? 'bg-slate-100/50 dark:bg-slate-800/50' : ''}`}>
                                   <div className="flex flex-col items-center">
                                      <span className="text-[10px] text-slate-400 font-normal">{d.toLocaleDateString('fr-FR', {weekday: 'short'}).charAt(0)}</span>
                                      <span className={`text-sm font-bold ${new Date().toDateString() === d.toDateString() ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-700 dark:text-slate-300'}`}>
                                        {d.getDate()}
                                      </span>
                                   </div>
                                </th>
                              );
                           })}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {planningUsers.map(u => (
                           <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                              <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 p-3 border-r border-slate-100 dark:border-slate-800 flex items-center gap-3 shadow-[4px_0_8px_-2px_rgba(0,0,0,0.05)]">
                                 <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${u.color || 'bg-gray-400'}`}>
                                    {u.name.charAt(0)}
                                 </div>
                                 <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{u.name}</p>
                                    <p className="text-[10px] text-slate-400 truncate">{u.service || 'N/A'}</p>
                                 </div>
                              </td>
                              {daysInMonth.map((d, i) => {
                                 const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                                 const leave = getLeaveForUserDate(u.id, d);
                                 
                                 return (
                                    <td key={i} className={`p-1 border-r border-slate-50 dark:border-slate-800/50 h-12 relative ${isWeekend ? 'bg-slate-100/30 dark:bg-slate-800/30' : ''}`}>
                                       {leave && (
                                          <div 
                                            className={`w-full h-8 rounded-md mx-auto transition-all flex items-center justify-center group relative cursor-help
                                              ${getLeaveColor(leave.type)} 
                                              ${leave.status === 'pending' ? 'opacity-50 bg-[length:8px_8px] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)]' : 'shadow-sm'}
                                            `}
                                            title={`${leave.type.toUpperCase()} - ${leave.status === 'pending' ? 'En attente' : 'Validé'}`}
                                          >
                                             {leave.status === 'pending' && <Clock size={12} className="text-white opacity-80" />}
                                             {/* Tooltip */}
                                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-50 whitespace-nowrap px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-lg pointer-events-none">
                                                {leave.type === 'paid' ? 'Congés Payés' : 
                                                 leave.type === 'rtt' ? 'RTT' : 
                                                 leave.type === 'rcr' ? 'RCR' :
                                                 leave.type === 'sick' ? 'Maladie' : 'Sans solde'}
                                             </div>
                                          </div>
                                       )}
                                    </td>
                                 );
                              })}
                           </tr>
                        ))}
                        {planningUsers.length === 0 && (
                           <tr>
                              <td colSpan={daysInMonth.length + 1} className="p-8 text-center text-slate-400 italic">
                                 Aucun employé trouvé.
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
               
               {/* Legend */}
               <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> CP</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-purple-500"></span> RTT</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-teal-500"></span> RCR</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Maladie</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-slate-500"></span> Sans solde</div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded bg-blue-500 opacity-50 bg-[length:4px_4px] bg-[linear-gradient(45deg,rgba(255,255,255,0.5)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.5)_50%,rgba(255,255,255,0.5)_75%,transparent_75%,transparent)]"></span> En attente</div>
               </div>
            </div>
         )}
      </div>

      {/* Image Preview Modal */}
      {previewImages && (
         <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setPreviewImages(null)}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">Documents joints ({previewImages.length})</h3>
                  <button onClick={() => setPreviewImages(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><FileText size={20}/></button>
               </div>
               <div className="grid gap-4">
                  {previewImages.map((src, idx) => (
                     <img key={idx} src={src} alt={`Scan ${idx+1}`} className="w-full rounded-lg shadow-sm border border-slate-200 dark:border-slate-800" />
                  ))}
               </div>
            </div>
         </div>
      )}
    </div>
  );
};