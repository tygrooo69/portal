import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Save, Send, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { User, Timesheet, TimesheetEntry } from '../../types';
import { getMonday, getWeekDays } from './utils';
import { ConfirmModal } from '../ConfirmModal';

interface TimesheetViewProps {
  currentUser: User;
  users: User[];
  timesheets: Timesheet[];
  onSaveTimesheet: (timesheet: Timesheet) => void;
  onBack: () => void;
}

export const TimesheetView: React.FC<TimesheetViewProps> = ({ 
  currentUser, users, timesheets, onSaveTimesheet, onBack 
}) => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getMonday(new Date()));
  const [currentTimesheet, setCurrentTimesheet] = useState<Timesheet | null>(null);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedManager, setSelectedManager] = useState<string>('');
  
  // Delete Confirmation State
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);

  const managers = users.filter(u => u.role === 'admin' || u.role === 'assistant');

  useEffect(() => {
    const weekStr = currentWeekStart.toISOString().split('T')[0];
    const existingSheet = timesheets.find(t => t.userId === currentUser.id && t.weekStartDate === weekStr);
    
    if (existingSheet) {
      setCurrentTimesheet(existingSheet);
    } else {
      setCurrentTimesheet({
        id: Date.now().toString(),
        userId: currentUser.id,
        weekStartDate: weekStr,
        status: 'draft',
        entries: [
          { id: Date.now().toString(), businessId: '', zone: '', site: '', hours: [0,0,0,0,0,0,0] }
        ]
      });
    }
  }, [currentWeekStart, currentUser, timesheets]);

  const changeWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeekStart);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    setCurrentWeekStart(newDate);
  };

  const handleDateSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const selectedDate = new Date(e.target.value);
      setCurrentWeekStart(getMonday(selectedDate));
    }
  };

  const handleEntryChange = (entryId: string, field: keyof TimesheetEntry, value: any, dayIndex?: number) => {
    if (!currentTimesheet || currentTimesheet.status === 'submitted' || currentTimesheet.status === 'approved') return;
    const newEntries = currentTimesheet.entries.map(entry => {
      if (entry.id === entryId) {
        if (field === 'hours' && dayIndex !== undefined) {
          const newHours = [...entry.hours];
          newHours[dayIndex] = Number(value);
          return { ...entry, hours: newHours };
        }
        return { ...entry, [field]: value };
      }
      return entry;
    });
    setCurrentTimesheet({ ...currentTimesheet, entries: newEntries });
  };

  const addEntryRow = () => {
    if (!currentTimesheet) return;
    const newRow: TimesheetEntry = {
      id: Date.now().toString() + Math.random(),
      businessId: '',
      zone: '',
      site: '',
      hours: [0,0,0,0,0,0,0]
    };
    setCurrentTimesheet({ ...currentTimesheet, entries: [...currentTimesheet.entries, newRow] });
  };

  const requestRemoveEntryRow = (entryId: string) => {
    setDeleteEntryId(entryId);
  };

  const confirmRemoveEntryRow = () => {
    if (!currentTimesheet || !deleteEntryId) return;
    setCurrentTimesheet({ 
      ...currentTimesheet, 
      entries: currentTimesheet.entries.filter(e => e.id !== deleteEntryId) 
    });
    setDeleteEntryId(null);
  };

  const saveDraft = () => {
    if (currentTimesheet) {
      onSaveTimesheet({ ...currentTimesheet, status: 'draft' });
    }
  };

  const confirmSubmitTimesheet = () => {
    if (!currentTimesheet || !selectedManager) {
      alert("Veuillez sélectionner un responsable.");
      return;
    }
    onSaveTimesheet({ 
      ...currentTimesheet, 
      status: 'submitted', 
      submittedAt: new Date().toISOString(),
      managerId: selectedManager
    });
    setShowSubmitModal(false);
  };

  const weekDays = getWeekDays(currentWeekStart);
  const isReadOnly = currentTimesheet?.status === 'submitted' || currentTimesheet?.status === 'approved';

  return (
    <div className="p-4 md:p-8 h-full overflow-y-auto relative bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center gap-4 mb-6">
         <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ArrowLeft /></button>
         <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Saisie des Heures</h1>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
         <div className="flex-1 space-y-6">
            {/* Week Selector */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
              <button onClick={() => changeWeek('prev')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronLeft /></button>
              
              <div className="text-center flex flex-col items-center gap-2">
                  <div className="flex items-center gap-3 relative group">
                      <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                        Semaine du {currentWeekStart.toLocaleDateString()}
                      </h2>
                      {/* Date Input Overlay */}
                      <div className="relative flex items-center justify-center p-2 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-all cursor-pointer shadow-sm" title="Choisir une date">
                         <CalendarIcon size={20} />
                         <input 
                           type="date" 
                           className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                           onChange={handleDateSelect}
                         />
                      </div>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase
                        ${currentTimesheet?.status === 'draft' ? 'bg-slate-100 text-slate-600' : 
                          currentTimesheet?.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' :
                          currentTimesheet?.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'}
                    `}>
                        {currentTimesheet?.status === 'draft' ? 'Brouillon' : 
                        currentTimesheet?.status === 'submitted' ? 'En attente' :
                        currentTimesheet?.status === 'approved' ? 'Validé' : 'Refusé'}
                    </span>
                  </div>
              </div>

              <button onClick={() => changeWeek('next')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><ChevronRight /></button>
            </div>

            {/* --- DESKTOP VIEW (Table) --- */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-medium">
                    <tr>
                      <th className="px-4 py-3 text-left w-32">N° Affaire</th>
                      <th className="px-4 py-3 text-left w-24">Zone</th>
                      <th className="px-4 py-3 text-left w-48">Chantier</th>
                      {weekDays.map((day, i) => (
                        <th key={i} className="px-2 py-3 text-center min-w-[60px]">
                          <div className="flex flex-col">
                            <span>{day.toLocaleDateString(undefined, {weekday: 'short'})}</span>
                            <span className="text-xs font-normal">{day.getDate()}</span>
                          </div>
                        </th>
                      ))}
                      <th className="px-4 py-3 text-center font-bold">Total</th>
                      {!isReadOnly && <th className="px-4 py-3 w-10"></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {currentTimesheet?.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              disabled={isReadOnly}
                              value={entry.businessId}
                              onChange={(e) => handleEntryChange(entry.id, 'businessId', e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                              placeholder="Ex: MXXXXX"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              disabled={isReadOnly}
                              value={entry.zone}
                              onChange={(e) => handleEntryChange(entry.id, 'zone', e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                              placeholder="Ex: Z1"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <input 
                              type="text" 
                              disabled={isReadOnly}
                              value={entry.site}
                              onChange={(e) => handleEntryChange(entry.id, 'site', e.target.value)}
                              className="w-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                              placeholder="Nom du chantier"
                            />
                          </td>
                          {entry.hours.map((h, i) => (
                            <td key={i} className="px-2 py-2">
                              <input 
                                type="number" 
                                min="0"
                                step="0.5"
                                disabled={isReadOnly}
                                value={h || ''}
                                onChange={(e) => handleEntryChange(entry.id, 'hours', e.target.value, i)}
                                className="w-full text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded py-1 outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                          ))}
                          <td className="px-4 py-2 text-center font-bold text-blue-600">
                            {entry.hours.reduce((a, b) => a + b, 0)}
                          </td>
                          {!isReadOnly && (
                            <td className="px-4 py-2 text-center">
                              <button onClick={() => requestRemoveEntryRow(entry.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          )}
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 text-right">Total</td>
                      {weekDays.map((_, i) => (
                        <td key={i} className="px-2 py-3 text-center">
                          {currentTimesheet?.entries.reduce((sum, entry) => sum + (entry.hours[i] || 0), 0)}
                        </td>
                      ))}
                      <td className="px-4 py-3 text-center text-lg text-blue-600">
                         {currentTimesheet?.entries.reduce((sum, entry) => sum + entry.hours.reduce((a,b)=>a+b,0), 0)}
                      </td>
                      {!isReadOnly && <td></td>}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* --- MOBILE VIEW (Cards) --- */}
            <div className="md:hidden space-y-4">
              {currentTimesheet?.entries.map((entry) => (
                <div key={entry.id} className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                   {/* Header: Project Info */}
                   <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">N° Affaire</label>
                        <input 
                          type="text" 
                          disabled={isReadOnly}
                          value={entry.businessId}
                          onChange={(e) => handleEntryChange(entry.id, 'businessId', e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                          placeholder="MXXXXX"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">Zone</label>
                        <input 
                          type="text" 
                          disabled={isReadOnly}
                          value={entry.zone}
                          onChange={(e) => handleEntryChange(entry.id, 'zone', e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                          placeholder="Z..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] uppercase text-slate-400 font-semibold block mb-1">Chantier</label>
                        <input 
                          type="text" 
                          disabled={isReadOnly}
                          value={entry.site}
                          onChange={(e) => handleEntryChange(entry.id, 'site', e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                          placeholder="Nom du chantier"
                        />
                      </div>
                   </div>

                   {/* Hours Grid - Compact */}
                   <div className="grid grid-cols-4 gap-2 mb-4">
                      {entry.hours.map((h, i) => (
                        <div key={i} className="flex flex-col items-center">
                           <span className="text-[10px] text-slate-500 mb-1">{weekDays[i].toLocaleDateString('fr-FR', {weekday: 'short'})}</span>
                           <input 
                              type="number"
                              min="0"
                              step="0.5"
                              placeholder="0"
                              disabled={isReadOnly}
                              value={h || ''}
                              onChange={(e) => handleEntryChange(entry.id, 'hours', e.target.value, i)}
                              className="w-full text-center bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 text-sm font-semibold outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                           />
                        </div>
                      ))}
                      <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                         <span className="text-[10px] text-blue-600 dark:text-blue-400 mb-1 font-bold">TOTAL</span>
                         <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                           {entry.hours.reduce((a, b) => a + b, 0)}
                         </span>
                      </div>
                   </div>

                   {/* Footer */}
                   {!isReadOnly && (
                     <div className="flex justify-end pt-2">
                        <button onClick={() => requestRemoveEntryRow(entry.id)} className="text-red-500 text-xs flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                           <Trash2 size={14} /> Supprimer la ligne
                        </button>
                     </div>
                   )}
                </div>
              ))}
              
              {/* Mobile Total Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex justify-between items-center">
                 <span className="font-bold text-slate-700 dark:text-slate-300">Total Semaine</span>
                 <span className="text-xl font-bold text-blue-600">
                    {currentTimesheet?.entries.reduce((sum, entry) => sum + entry.hours.reduce((a,b)=>a+b,0), 0)} h
                 </span>
              </div>
            </div>

            {/* Common Actions */}
            {!isReadOnly && (
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button onClick={addEntryRow} className="w-full md:w-auto flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-2 px-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl transition-colors">
                  <Plus size={18} /> Ajouter une ligne
                </button>

                <div className="flex gap-3 w-full md:w-auto">
                  <button onClick={saveDraft} className="flex-1 md:flex-none px-6 py-3 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl font-medium hover:bg-slate-200 flex items-center justify-center gap-2">
                    <Save size={18} /> <span className="md:hidden">Brouillon</span><span className="hidden md:inline">Enregistrer Brouillon</span>
                  </button>
                  <button onClick={() => setShowSubmitModal(true)} className="flex-1 md:flex-none px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2">
                    <Send size={18} /> Soumettre
                  </button>
                </div>
              </div>
            )}
         </div>

         {/* Sidebar: Status / History (Hidden on small mobile unless needed, keeping logic simple for now) */}
         <div className="w-full xl:w-80 space-y-4 hidden xl:block">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
               <h3 className="font-bold text-slate-800 dark:text-white mb-4">Mes Validations</h3>
               <div className="space-y-3">
                  {timesheets
                    .filter(t => t.userId === currentUser.id && t.status !== 'draft')
                    .sort((a,b) => b.weekStartDate.localeCompare(a.weekStartDate))
                    .slice(0, 5)
                    .map(t => (
                      <div key={t.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-between">
                         <div>
                           <p className="text-sm font-medium">Semaine {t.weekStartDate}</p>
                           <p className="text-xs text-slate-500">Resp: {users.find(u => u.id === t.managerId)?.name || '?'}</p>
                         </div>
                         <div className={`px-2 py-1 rounded-full text-xs font-bold ${
                           t.status === 'approved' ? 'bg-green-100 text-green-700' : 
                           t.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                           'bg-yellow-100 text-yellow-700'
                         }`}>
                            {t.status === 'approved' ? 'Validé' : t.status === 'rejected' ? 'Refusé' : 'Attente'}
                         </div>
                      </div>
                  ))}
                  {timesheets.filter(t => t.userId === currentUser.id && t.status !== 'draft').length === 0 && (
                    <p className="text-sm text-slate-400">Aucun historique.</p>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* Submit Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 w-full max-w-md border border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold mb-4">Transmettre la feuille</h3>
              <p className="text-sm text-slate-500 mb-4">Veuillez sélectionner le Responsable qui validera votre saisie.</p>
              
              <div className="mb-6">
                <label className="block text-xs font-medium text-slate-500 mb-1">Responsable</label>
                <select 
                  value={selectedManager}
                  onChange={(e) => setSelectedManager(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                >
                  <option value="">-- Sélectionner --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name} ({m.role === 'admin' ? 'Responsable' : 'Assistant'})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 justify-end">
                 <button onClick={() => setShowSubmitModal(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300">Annuler</button>
                 <button onClick={confirmSubmitTimesheet} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Envoyer</button>
              </div>
           </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!deleteEntryId}
        title="Supprimer la ligne ?"
        message="Voulez-vous vraiment supprimer cette ligne de saisie ?"
        onConfirm={confirmRemoveEntryRow}
        onClose={() => setDeleteEntryId(null)}
      />
    </div>
  );
};