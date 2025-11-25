import React, { useState } from 'react';
import { ArrowLeft, Search, History, Clock } from 'lucide-react';
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
  const [validationTab, setValidationTab] = useState<'timesheets' | 'leaves'>('timesheets');
  const [viewType, setViewType] = useState<'pending' | 'history'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  
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

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
       <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Espace Responsable</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-start md:items-center">
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
           <button 
             onClick={() => setValidationTab('timesheets')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${validationTab === 'timesheets' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500'}`}
           >
             Feuilles d'heures
           </button>
           <button 
             onClick={() => setValidationTab('leaves')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${validationTab === 'leaves' ? 'bg-slate-100 dark:bg-slate-800 text-blue-600' : 'text-slate-500'}`}
           >
             Congés
           </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* View Type Toggle */}
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

      <div className="space-y-4">
         {validationTab === 'timesheets' && (
            myTimesheets.length === 0 ? (
               <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  {viewType === 'pending' ? "Aucune feuille d'heures à valider." : "Aucun historique de feuille d'heures."}
               </div>
            ) : (
               myTimesheets.map(sheet => {
                  const u = users.find(usr => usr.id === sheet.userId);
                  const totalHours = sheet.entries.reduce((sum, e) => sum + e.hours.reduce((a,b)=>a+b,0), 0);
                  const isHistory = viewType === 'history';

                  return (
                    <div key={sheet.id} className={`bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 ${isHistory ? 'opacity-80 hover:opacity-100' : ''}`}>
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className={`w-10 h-10 rounded-full ${u?.color || 'bg-gray-400'} flex items-center justify-center text-white font-bold`}>
                                {u?.name.charAt(0)}
                             </div>
                             <div>
                                <p className="font-bold">{u?.name}</p>
                                <p className="text-sm text-slate-500">Semaine du {sheet.weekStartDate}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-2xl font-bold text-blue-600">{totalHours} h</p>
                             {isHistory && (
                               <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sheet.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                  {sheet.status === 'approved' ? 'Validé' : 'Refusé'}
                               </span>
                             )}
                          </div>
                       </div>
                       
                       {/* Mini Preview */}
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
            )
         )}

         {validationTab === 'leaves' && (
            myLeaves.length === 0 ? (
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
                                 {req.type === 'paid' ? 'Congés Payés' : req.type === 'rtt' ? 'RTT' : req.type === 'sick' ? 'Maladie' : 'Sans solde'}
                              </p>
                              <p className="text-xs text-slate-500">Du {req.startDate} au {req.endDate}</p>
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
            )
         )}
      </div>
    </div>
  );
};