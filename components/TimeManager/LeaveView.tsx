import React, { useState } from 'react';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { User, LeaveRequest } from '../../types';

interface LeaveViewProps {
  currentUser: User;
  users: User[];
  leaveRequests: LeaveRequest[];
  onAddLeaveRequest: (request: LeaveRequest) => void;
  onBack: () => void;
}

export const LeaveView: React.FC<LeaveViewProps> = ({ 
  currentUser, users, leaveRequests, onAddLeaveRequest, onBack 
}) => {
  const [leaveForm, setLeaveForm] = useState<Partial<LeaveRequest>>({
    type: 'paid',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    halfDay: 'none',
    reason: ''
  });
  const [leaveManager, setLeaveManager] = useState<string>('');
  
  const managers = users.filter(u => u.role === 'admin' || u.role === 'assistant');

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveManager) {
      alert("Veuillez sélectionner un responsable.");
      return;
    }
    if (!leaveForm.startDate || !leaveForm.endDate) return;

    const request: LeaveRequest = {
      id: Date.now().toString(),
      userId: currentUser.id,
      managerId: leaveManager,
      type: leaveForm.type as any,
      startDate: leaveForm.startDate!,
      endDate: leaveForm.endDate!,
      halfDay: leaveForm.halfDay,
      reason: leaveForm.reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    onAddLeaveRequest(request);
    setLeaveForm({
      type: 'paid',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      halfDay: 'none',
      reason: ''
    });
    alert("Demande de congé envoyée !");
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Demandes de Congés</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Form */}
         <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 h-fit">
            <h3 className="font-bold text-lg mb-4">Nouvelle demande</h3>
            <form onSubmit={handleSubmitLeave} className="space-y-4">
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Type d'absence</label>
                  <select 
                    value={leaveForm.type}
                    onChange={(e) => setLeaveForm({...leaveForm, type: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                     <option value="paid">Congés Payés (CP)</option>
                     <option value="rtt">RTT</option>
                     <option value="sick">Maladie / Arrêt</option>
                     <option value="unpaid">Sans solde</option>
                  </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Début</label>
                     <input 
                       type="date"
                       required
                       value={leaveForm.startDate}
                       onChange={(e) => setLeaveForm({...leaveForm, startDate: e.target.value})}
                       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                     />
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1">Fin (inclus)</label>
                     <input 
                       type="date"
                       required
                       value={leaveForm.endDate}
                       onChange={(e) => setLeaveForm({...leaveForm, endDate: e.target.value})}
                       className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                     />
                  </div>
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Précision (Optionnel)</label>
                  <select 
                    value={leaveForm.halfDay}
                    onChange={(e) => setLeaveForm({...leaveForm, halfDay: e.target.value as any})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                     <option value="none">Journée entière</option>
                     <option value="morning">Matin seulement</option>
                     <option value="afternoon">Après-midi seulement</option>
                  </select>
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Motif (Optionnel)</label>
                  <textarea 
                    rows={2}
                    value={leaveForm.reason}
                    onChange={(e) => setLeaveForm({...leaveForm, reason: e.target.value})}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none resize-none"
                  />
               </div>
               <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Responsable (Validation)</label>
                  <select 
                    required
                    value={leaveManager}
                    onChange={(e) => setLeaveManager(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none"
                  >
                     <option value="">-- Sélectionner --</option>
                     {managers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                     ))}
                  </select>
               </div>
               
               <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium mt-2">
                  Envoyer la demande
               </button>
            </form>
         </div>

         {/* List */}
         <div className="lg:col-span-2 space-y-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Mes demandes ({leaveRequests.filter(r => r.userId === currentUser.id).length})</h3>
            
            <div className="grid gap-3">
               {leaveRequests.filter(r => r.userId === currentUser.id).length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl text-slate-500">Aucune demande en cours.</div>
               ) : (
                  leaveRequests
                    .filter(r => r.userId === currentUser.id)
                    .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map(req => {
                       const mgr = users.find(u => u.id === req.managerId);
                       return (
                          <div key={req.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                             <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl
                                   ${req.type === 'paid' ? 'bg-blue-100 text-blue-600' : 
                                     req.type === 'rtt' ? 'bg-purple-100 text-purple-600' :
                                     req.type === 'sick' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}
                                `}>
                                   <CalendarIcon size={20} />
                                </div>
                                <div>
                                   <p className="font-semibold text-slate-800 dark:text-white capitalize">
                                      {req.type === 'paid' ? 'Congés Payés' : req.type === 'rtt' ? 'RTT' : req.type === 'sick' ? 'Maladie' : 'Sans solde'}
                                      {req.halfDay !== 'none' && <span className="text-xs font-normal text-slate-500 ml-2">({req.halfDay === 'morning' ? 'Matin' : 'Après-midi'})</span>}
                                   </p>
                                   <p className="text-sm text-slate-500">
                                      Du {new Date(req.startDate).toLocaleDateString()} au {new Date(req.endDate).toLocaleDateString()}
                                   </p>
                                   <p className="text-xs text-slate-400 mt-1">Envoyé à: {mgr ? mgr.name : '?'}</p>
                                </div>
                             </div>
                             <div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase
                                   ${req.status === 'approved' ? 'bg-green-100 text-green-700' :
                                     req.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                     'bg-yellow-100 text-yellow-700'}
                                `}>
                                   {req.status === 'approved' ? 'Accepté' : req.status === 'rejected' ? 'Refusé' : 'En attente'}
                                </span>
                             </div>
                          </div>
                       );
                    })
               )}
            </div>
         </div>
      </div>
    </div>
  );
};