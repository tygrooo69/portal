import React, { useState, useEffect, useMemo } from 'react';
import { 
  Clock, Play, Square, PauseCircle, Calendar as CalendarIcon, 
  Users, CheckCircle2, XCircle, ChevronLeft, ChevronRight, 
  Briefcase, Coffee, Sun, Umbrella, AlertCircle
} from 'lucide-react';
import { User, Project, TimeEntry, LeaveRequest } from '../types';

interface TimeManagerProps {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  timeEntries: TimeEntry[];
  leaveRequests: LeaveRequest[];
  onClockIn: (entry: TimeEntry) => void;
  onClockOut: (entryId: string, endTime: string) => void;
  onAddLeaveRequest: (request: LeaveRequest) => void;
  onUpdateLeaveRequest: (request: LeaveRequest) => void;
}

export const TimeManager: React.FC<TimeManagerProps> = ({
  currentUser,
  users,
  projects,
  timeEntries,
  leaveRequests,
  onClockIn,
  onClockOut,
  onAddLeaveRequest,
  onUpdateLeaveRequest
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'timesheet' | 'leaves' | 'team'>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Clock In/Out State
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Leave Request State
  const [leaveType, setLeaveType] = useState<'paid' | 'rtt' | 'sick'>('paid');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEntry = useMemo(() => {
    if (!currentUser) return null;
    return timeEntries.find(t => t.userId === currentUser.id && !t.endTime);
  }, [timeEntries, currentUser]);

  const todayEntries = useMemo(() => {
    if (!currentUser) return [];
    const today = new Date().toISOString().split('T')[0];
    return timeEntries.filter(t => t.userId === currentUser.id && t.startTime.startsWith(today));
  }, [timeEntries, currentUser]);

  const totalTimeToday = useMemo(() => {
    let totalMs = 0;
    todayEntries.forEach(t => {
      const start = new Date(t.startTime).getTime();
      const end = t.endTime ? new Date(t.endTime).getTime() : currentTime.getTime();
      totalMs += (end - start);
    });
    const hrs = Math.floor(totalMs / 3600000);
    const mins = Math.floor((totalMs % 3600000) / 60000);
    return `${hrs}h ${mins}m`;
  }, [todayEntries, currentTime]);

  const handleClockAction = () => {
    if (!currentUser) return;
    
    if (activeEntry) {
      // Clock Out
      onClockOut(activeEntry.id, new Date().toISOString());
    } else {
      // Clock In
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        userId: currentUser.id,
        startTime: new Date().toISOString(),
        projectId: selectedProjectId || undefined,
        type: 'work'
      };
      onClockIn(newEntry);
    }
  };

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !leaveStart || !leaveEnd) return;
    
    const request: LeaveRequest = {
      id: Date.now().toString(),
      userId: currentUser.id,
      type: leaveType,
      startDate: leaveStart,
      endDate: leaveEnd,
      reason: leaveReason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    onAddLeaveRequest(request);
    setLeaveStart('');
    setLeaveEnd('');
    setLeaveReason('');
    alert('Demande de congés envoyée !');
  };

  const getLeaveStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
    }
  };

  const getLeaveStatusLabel = (status: string) => {
     switch(status) {
        case 'approved': return 'Approuvé';
        case 'rejected': return 'Refusé';
        default: return 'En attente';
     }
  };

  if (!currentUser) {
    return (
      <div className="flex h-full items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
        <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <Clock size={48} className="mx-auto text-slate-300 mb-4" />
          <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Authentification Requise</h2>
          <p className="text-slate-500">Veuillez vous connecter pour accéder à la gestion des temps.</p>
        </div>
      </div>
    );
  }

  // --- SUB-COMPONENTS ---

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Clock Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
           <h2 className="text-3xl font-bold text-slate-800 dark:text-white font-mono">
             {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
           </h2>
           <p className="text-slate-500 dark:text-slate-400 mt-1">
             {currentTime.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
           </p>
           {activeEntry && (
             <div className="mt-3 inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 text-sm font-medium animate-pulse">
               <Briefcase size={14} className="mr-2" />
               Au travail depuis {new Date(activeEntry.startTime).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit'})}
             </div>
           )}
        </div>

        <div className="flex flex-col items-center gap-3 w-full md:w-auto">
           {!activeEntry && (
             <select 
               className="w-full md:w-64 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
               value={selectedProjectId}
               onChange={(e) => setSelectedProjectId(e.target.value)}
             >
               <option value="">-- Sélectionner un projet --</option>
               {projects.filter(p => p.status === 'active').map(p => (
                 <option key={p.id} value={p.id}>{p.name}</option>
               ))}
             </select>
           )}
           
           <button 
             onClick={handleClockAction}
             className={`w-full md:w-64 py-4 rounded-xl font-bold text-lg shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3
               ${activeEntry 
                 ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/30' 
                 : 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
               }`}
           >
             {activeEntry ? (
               <><Square size={24} fill="currentColor" /> Arrêter (Stop)</>
             ) : (
               <><Play size={24} fill="currentColor" /> Commencer (Start)</>
             )}
           </button>
           
           <div className="text-sm text-slate-500">
             Total aujourd'hui : <span className="font-semibold text-slate-800 dark:text-white">{totalTimeToday}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Balances */}
         <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
           <h3 className="font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Umbrella size={18} /> Mes Soldes</h3>
           <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                 <span className="text-blue-700 dark:text-blue-300 font-medium">Congés Payés</span>
                 <span className="text-2xl font-bold text-blue-800 dark:text-blue-200">25.0</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                 <span className="text-purple-700 dark:text-purple-300 font-medium">RTT</span>
                 <span className="text-2xl font-bold text-purple-800 dark:text-purple-200">9.5</span>
              </div>
           </div>
         </div>

         {/* Recent Activity */}
         <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="font-semibold text-slate-800 dark:text-white mb-4">Activité Récente</h3>
            <div className="space-y-3">
               {timeEntries.filter(t => t.userId === currentUser.id).sort((a,b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()).slice(0, 5).map(entry => {
                 const project = projects.find(p => p.id === entry.projectId);
                 const duration = entry.endTime 
                    ? Math.round((new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()) / 60000)
                    : null;
                 
                 return (
                   <div key={entry.id} className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                      <div className="flex items-center gap-3">
                         <div className={`w-2 h-10 rounded-full ${entry.endTime ? 'bg-slate-300' : 'bg-green-500'}`} />
                         <div>
                            <p className="font-medium text-slate-800 dark:text-white text-sm">
                               {project ? project.name : 'Tâche générale'}
                            </p>
                            <p className="text-xs text-slate-500">
                               {new Date(entry.startTime).toLocaleDateString()} • {new Date(entry.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} 
                               {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`}
                            </p>
                         </div>
                      </div>
                      <span className="font-mono text-sm font-semibold text-slate-600 dark:text-slate-300">
                        {duration ? `${Math.floor(duration/60)}h ${duration%60}m` : 'En cours...'}
                      </span>
                   </div>
                 );
               })}
               {timeEntries.length === 0 && <p className="text-slate-400 text-sm text-center py-4">Aucune activité enregistrée.</p>}
            </div>
         </div>
      </div>
    </div>
  );

  const renderLeaves = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Form */}
      <div className="md:col-span-1">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 sticky top-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2"><Sun className="text-orange-500" /> Nouvelle demande</h3>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Type d'absence</label>
               <select 
                 value={leaveType}
                 onChange={(e) => setLeaveType(e.target.value as any)}
                 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
               >
                 <option value="paid">Congés Payés</option>
                 <option value="rtt">RTT</option>
                 <option value="sick">Arrêt Maladie</option>
               </select>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Du</label>
                  <input type="date" required value={leaveStart} onChange={e => setLeaveStart(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Au</label>
                  <input type="date" required value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none text-sm" />
               </div>
             </div>

             <div>
               <label className="block text-xs font-medium text-slate-500 mb-1">Motif (Optionnel)</label>
               <textarea 
                 rows={3}
                 value={leaveReason}
                 onChange={e => setLeaveReason(e.target.value)}
                 className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none text-sm"
                 placeholder="Vacances d'été..."
               />
             </div>

             <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md">
               Envoyer la demande
             </button>
          </form>
        </div>
      </div>

      {/* History */}
      <div className="md:col-span-2 space-y-4">
         <h3 className="font-semibold text-slate-800 dark:text-white">Historique de mes demandes</h3>
         {leaveRequests.filter(l => l.userId === currentUser.id).length === 0 ? (
           <div className="p-8 bg-slate-50 dark:bg-slate-900 rounded-xl text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-800">
             Aucune demande de congé effectuée.
           </div>
         ) : (
           <div className="space-y-3">
             {leaveRequests.filter(l => l.userId === currentUser.id).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(req => (
               <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                       <CalendarIcon size={20} />
                     </div>
                     <div>
                        <p className="font-semibold text-slate-800 dark:text-white capitalize">
                          {req.type === 'paid' ? 'Congés Payés' : req.type === 'rtt' ? 'RTT' : 'Maladie'}
                        </p>
                        <p className="text-sm text-slate-500">
                          Du {new Date(req.startDate).toLocaleDateString()} au {new Date(req.endDate).toLocaleDateString()}
                        </p>
                        {req.reason && <p className="text-xs text-slate-400 italic mt-1">"{req.reason}"</p>}
                     </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${getLeaveStatusColor(req.status)}`}>
                     {getLeaveStatusLabel(req.status)}
                  </div>
               </div>
             ))}
           </div>
         )}
      </div>
    </div>
  );

  const renderTeam = () => {
     // Mock check if admin (simple check for demo)
     const pendingRequests = leaveRequests.filter(r => r.status === 'pending');

     return (
       <div className="space-y-8">
          <div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
               <AlertCircle className="text-blue-500" /> Demandes à valider ({pendingRequests.length})
            </h3>
            {pendingRequests.length === 0 ? (
              <p className="text-slate-500 italic">Aucune demande en attente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingRequests.map(req => {
                  const user = users.find(u => u.id === req.userId);
                  return (
                    <div key={req.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md">
                       <div className="flex items-center gap-3 mb-3">
                          <div className={`w-8 h-8 rounded-full ${user?.color || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold`}>
                            {user?.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-slate-500">{new Date(req.createdAt).toLocaleDateString()}</p>
                          </div>
                       </div>
                       <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg mb-4 text-sm">
                          <p><span className="font-medium">Type:</span> {req.type === 'paid' ? 'CP' : 'RTT'}</p>
                          <p><span className="font-medium">Dates:</span> {new Date(req.startDate).toLocaleDateString()} -> {new Date(req.endDate).toLocaleDateString()}</p>
                          {req.reason && <p className="italic text-slate-500 mt-1">"{req.reason}"</p>}
                       </div>
                       <div className="flex gap-2">
                          <button 
                             onClick={() => onUpdateLeaveRequest({...req, status: 'approved'})}
                             className="flex-1 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={16} /> Valider
                          </button>
                          <button 
                             onClick={() => onUpdateLeaveRequest({...req, status: 'rejected'})}
                             className="flex-1 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                          >
                            <XCircle size={16} /> Refuser
                          </button>
                       </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Vue d'équipe (Aujourd'hui)</h3>
             <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                    <tr>
                      <th className="px-6 py-3 font-medium">Employé</th>
                      <th className="px-6 py-3 font-medium">Statut</th>
                      <th className="px-6 py-3 font-medium">Arrivée</th>
                      <th className="px-6 py-3 font-medium">Projet en cours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map(user => {
                      const active = timeEntries.find(t => t.userId === user.id && !t.endTime);
                      const isOnLeave = leaveRequests.some(r => 
                         r.userId === user.id && 
                         r.status === 'approved' && 
                         new Date(r.startDate) <= new Date() && 
                         new Date(r.endDate) >= new Date()
                      );

                      return (
                        <tr key={user.id}>
                          <td className="px-6 py-4 flex items-center gap-3">
                             <div className={`w-6 h-6 rounded-full ${user.color} flex items-center justify-center text-white text-[10px] font-bold`}>
                               {user.name.charAt(0)}
                             </div>
                             <span className="text-slate-700 dark:text-slate-300">{user.name}</span>
                          </td>
                          <td className="px-6 py-4">
                             {isOnLeave ? (
                               <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700">En Congé</span>
                             ) : active ? (
                               <span className="px-2 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Présent</span>
                             ) : (
                               <span className="px-2 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-500">Absent</span>
                             )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                             {active ? new Date(active.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '-'}
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                             {active && active.projectId 
                               ? projects.find(p => p.id === active.projectId)?.name 
                               : active ? 'Général' : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
             </div>
          </div>
       </div>
     );
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
           <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
             <Clock className="text-blue-600" /> Gestion des Temps & Congés
           </h1>
           <p className="text-slate-500 mt-1">Suivez vos heures et gérez vos absences en toute simplicité.</p>
        </div>
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start md:self-auto">
           <button 
             onClick={() => setActiveTab('dashboard')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Mon Espace
           </button>
           <button 
             onClick={() => setActiveTab('leaves')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'leaves' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
           >
             Congés
           </button>
           <button 
             onClick={() => setActiveTab('team')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'team' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Users size={14} /> Équipe
           </button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
         {activeTab === 'dashboard' && renderDashboard()}
         {activeTab === 'leaves' && renderLeaves()}
         {activeTab === 'team' && renderTeam()}
      </div>
    </div>
  );
};