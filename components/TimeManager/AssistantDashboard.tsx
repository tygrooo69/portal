
import React, { useState, useMemo } from 'react';
import { ArrowLeft, Filter, CheckSquare, Square, CheckCircle, Search, X, Calendar, MapPin, Briefcase } from 'lucide-react';
import { User, Timesheet, LeaveRequest } from '../../types';
import { getWeekDays } from './utils';

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
  
  // Date Filters
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Drill Down State
  const [selectedItem, setSelectedItem] = useState<any | null>(null);

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

    // Date Filtering
    if (filterStartDate) {
      ts = ts.filter(t => t.weekStartDate >= filterStartDate);
      lr = lr.filter(l => l.startDate >= filterStartDate);
    }
    
    if (filterEndDate) {
      ts = ts.filter(t => t.weekStartDate <= filterEndDate);
      lr = lr.filter(l => l.endDate <= filterEndDate);
    }

    // Combine and sort
    const combined = [
      ...ts.map(t => ({ ...t, _type: 'timesheet' as const, date: t.weekStartDate })),
      ...lr.map(l => ({ ...l, _type: 'leave' as const, date: l.createdAt }))
    ];

    return combined.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [timesheets, leaveRequests, users, filterService, showProcessed, searchQuery, filterStartDate, filterEndDate]);

  const toggleProcessedTimesheet = (sheet: Timesheet) => {
    onSaveTimesheet({ ...sheet, isProcessed: !sheet.isProcessed });
  };

  const toggleProcessedLeave = (req: LeaveRequest) => {
    onUpdateLeaveRequest({ ...req, isProcessed: !req.isProcessed });
  };

  // Helper to render user avatar
  const renderUserAvatar = (userId: string) => {
    const u = users.find(user => user.id === userId);
    if (!u) return <div className="w-8 h-8 rounded-full bg-slate-200" />;
    return (
      <div className={`w-8 h-8 rounded-full ${u.color || 'bg-slate-400'} flex items-center justify-center text-white font-bold text-xs`}>
        {u.name.charAt(0)}
      </div>
    );
  };

  // Generate days for the modal view if a timesheet is selected
  const modalWeekDays = useMemo(() => {
    if (selectedItem && selectedItem._type === 'timesheet') {
       return getWeekDays(new Date(selectedItem.weekStartDate));
    }
    return [];
  }, [selectedItem]);

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto relative">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espace Assistante</h1>
      </div>

      {/* Filters Area */}
      <div className="flex flex-col gap-4 mb-6 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
         
         <div className="flex flex-col md:flex-row gap-4">
            {/* Service Filter */}
            <div className="flex items-center gap-2">
                <Filter size={18} className="text-slate-500" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Service:</span>
                <select 
                  value={filterService}
                  onChange={e => setFilterService(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none"
                >
                  <option value="all">Tous</option>
                  {services.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>

            {/* Name Search */}
            <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un collaborateur..."
                  className="w-full pl-9 pr-4 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            {/* Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={showProcessed} 
                  onChange={e => setShowProcessed(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">Voir traités</span>
            </label>
         </div>

         {/* Date Filters */}
         <div className="flex flex-col sm:flex-row items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Calendar size={16} className="text-slate-500" /> Période :
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
               <input 
                 type="date" 
                 value={filterStartDate}
                 onChange={e => setFilterStartDate(e.target.value)}
                 className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none w-full sm:w-auto"
               />
               <span className="text-slate-400">au</span>
               <input 
                 type="date" 
                 value={filterEndDate}
                 onChange={e => setFilterEndDate(e.target.value)}
                 className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-sm outline-none w-full sm:w-auto"
               />
            </div>
            {(filterStartDate || filterEndDate) && (
              <button onClick={() => { setFilterStartDate(''); setFilterEndDate(''); }} className="text-xs text-blue-600 hover:underline">
                Effacer dates
              </button>
            )}
         </div>

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
                 <tr 
                    key={item.id} 
                    className="hover:bg-blue-50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                    onClick={() => setSelectedItem(item)}
                 >
                   <td className="px-6 py-4 font-medium text-slate-800 dark:text-white flex items-center gap-3">
                     {renderUserAvatar(item.userId)}
                     {u?.name}
                   </td>
                   <td className="px-6 py-4 text-slate-500">{u?.service || '-'}</td>
                   <td className="px-6 py-4">
                     {isSheet ? (
                       <span className="flex items-center gap-2 text-blue-600"><CheckCircle size={16} /> Feuille d'heures</span>
                     ) : (
                       <span className="flex items-center gap-2 text-purple-600"><CheckCircle size={16} /> Congé ({item.type})</span>
                     )}
                   </td>
                   <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {isSheet ? `Sem. du ${new Date(item.weekStartDate).toLocaleDateString()}` : `${new Date(item.startDate).toLocaleDateString()} -> ${new Date(item.endDate).toLocaleDateString()}`}
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
                   <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => isSheet ? toggleProcessedTimesheet(item) : toggleProcessedLeave(item)}
                        className={`p-2 rounded-lg transition-colors ${item.isProcessed ? 'text-green-600 bg-green-50' : 'text-slate-300 hover:text-slate-500 hover:bg-slate-100'}`}
                        title={item.isProcessed ? "Marquer comme non traité" : "Marquer comme traité"}
                      >
                         {item.isProcessed ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>
                   </td>
                 </tr>
               );
             })}
             {filteredData.length === 0 && (
               <tr>
                 <td colSpan={6} className="px-6 py-8 text-center text-slate-400">Aucune donnée trouvée pour ces critères.</td>
               </tr>
             )}
           </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col max-h-[95vh]">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-3">
                   {renderUserAvatar(selectedItem.userId)}
                   <div>
                      <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                        Détail {selectedItem._type === 'timesheet' ? 'Feuille d\'heures' : 'Demande de Congé'}
                      </h2>
                      <p className="text-sm text-slate-500">
                        {users.find(u => u.id === selectedItem.userId)?.name}
                      </p>
                   </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <X size={20} />
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar">
                {selectedItem._type === 'timesheet' ? (
                   <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                         <span className="text-slate-500">Semaine du :</span>
                         <span className="font-semibold text-slate-800 dark:text-white">{selectedItem.weekStartDate}</span>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse min-w-[800px]">
                           <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500">
                              <tr>
                                 <th className="p-2 rounded-tl-lg w-24">Affaire</th>
                                 <th className="p-2 w-16">Zone</th>
                                 <th className="p-2 w-32">Chantier</th>
                                 {modalWeekDays.map((d, i) => (
                                    <th key={i} className="p-2 text-center border-l border-slate-200 dark:border-slate-700 min-w-[50px]">
                                       <div className="flex flex-col">
                                          <span>{d.toLocaleDateString('fr-FR', { weekday: 'short' })}</span>
                                          <span className="font-normal">{d.getDate()}</span>
                                       </div>
                                    </th>
                                 ))}
                                 <th className="p-2 text-right rounded-tr-lg border-l border-slate-200 dark:border-slate-700 bg-slate-200/50 dark:bg-slate-700/50 w-16">Total</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {(selectedItem as Timesheet).entries.map((entry: any) => (
                                 <tr key={entry.id}>
                                    <td className="p-2 font-medium bg-slate-50/50 dark:bg-slate-800/20">{entry.businessId}</td>
                                    <td className="p-2 text-slate-500 bg-slate-50/50 dark:bg-slate-800/20">{entry.zone}</td>
                                    <td className="p-2 text-slate-500 bg-slate-50/50 dark:bg-slate-800/20 truncate max-w-[150px]" title={entry.site}>{entry.site}</td>
                                    {entry.hours.map((h: number, i: number) => (
                                       <td key={i} className="p-2 text-center border-l border-slate-100 dark:border-slate-800">
                                          {h > 0 ? h : <span className="text-slate-300 dark:text-slate-700">-</span>}
                                       </td>
                                    ))}
                                    <td className="p-2 text-right font-bold text-blue-600 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30">
                                      {entry.hours.reduce((a: number, b: number) => a + b, 0)}
                                    </td>
                                 </tr>
                              ))}
                           </tbody>
                           <tfoot className="bg-slate-50 dark:bg-slate-800/30 font-bold border-t border-slate-200 dark:border-slate-700">
                              <tr>
                                 <td colSpan={3} className="p-2 text-right">Totaux Journaliers</td>
                                 {modalWeekDays.map((_, i) => (
                                    <td key={i} className="p-2 text-center border-l border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">
                                       {(selectedItem as Timesheet).entries.reduce((sum, e) => sum + (e.hours[i] || 0), 0)}
                                    </td>
                                 ))}
                                 <td className="p-2 text-right text-blue-600 text-lg border-l border-slate-200 dark:border-slate-700 bg-blue-50/50 dark:bg-blue-900/10">
                                   {(selectedItem as Timesheet).entries.reduce((sum, e) => sum + e.hours.reduce((a,b)=>a+b,0), 0)}
                                 </td>
                              </tr>
                           </tfoot>
                        </table>
                      </div>
                   </div>
                ) : (
                   <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Type</p>
                            <p className="font-semibold capitalize">{(selectedItem as LeaveRequest).type}</p>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Précision</p>
                            <p className="font-semibold capitalize">{(selectedItem as LeaveRequest).halfDay === 'none' ? 'Journée entière' : (selectedItem as LeaveRequest).halfDay}</p>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Du</p>
                            <p className="font-semibold">{new Date((selectedItem as LeaveRequest).startDate).toLocaleDateString()}</p>
                         </div>
                         <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                            <p className="text-xs text-slate-500 mb-1">Au</p>
                            <p className="font-semibold">{new Date((selectedItem as LeaveRequest).endDate).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                         <p className="text-xs text-slate-500 mb-2">Motif / Commentaire</p>
                         <p className="text-sm italic text-slate-700 dark:text-slate-300">
                            {(selectedItem as LeaveRequest).reason || "Aucun motif précisé."}
                         </p>
                      </div>
                   </div>
                )}
                
                {selectedItem.rejectionReason && (
                   <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
                      <p className="text-xs text-red-600 font-bold mb-1">Motif du refus :</p>
                      <p className="text-sm text-red-700 dark:text-red-300">{selectedItem.rejectionReason}</p>
                   </div>
                )}
             </div>

             <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                 <div className="mr-auto flex items-center gap-2">
                    <span className="text-sm text-slate-500">Statut Traitement :</span>
                    <button 
                      onClick={() => {
                        selectedItem._type === 'timesheet' 
                          ? toggleProcessedTimesheet(selectedItem) 
                          : toggleProcessedLeave(selectedItem);
                        setSelectedItem(prev => ({...prev, isProcessed: !prev.isProcessed}));
                      }}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${selectedItem.isProcessed ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}
                    >
                       {selectedItem.isProcessed ? <><CheckSquare size={16}/> Traité</> : <><Square size={16}/> Non traité</>}
                    </button>
                 </div>
                 <button onClick={() => setSelectedItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-medium">
                   Fermer
                 </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};
