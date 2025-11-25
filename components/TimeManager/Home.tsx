import React from 'react';
import { Clock, CalendarDays, Briefcase, FileCheck } from 'lucide-react';
import { User } from '../../types';

interface HomeProps {
  onNavigate: (mode: 'timesheet' | 'leaves' | 'validation' | 'assistant') => void;
  currentUser: User;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, currentUser }) => {
  const canValidate = currentUser.role === 'assistant' || currentUser.role === 'admin';
  const isAssistant = currentUser.role === 'assistant';

  return (
    <div className="p-6 md:p-8 h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">Gestion du Temps</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
         <button 
           onClick={() => onNavigate('timesheet')}
           className="group flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-blue-500 transition-all duration-300 transform hover:-translate-y-1"
         >
            <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 transition-transform">
               <Clock size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Saisie des Heures</h2>
            <p className="text-center text-slate-500">Remplir ma feuille d'heures hebdomadaire</p>
         </button>

         <button 
           onClick={() => onNavigate('leaves')}
           className="group flex flex-col items-center justify-center p-10 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl hover:shadow-2xl hover:border-green-500 transition-all duration-300 transform hover:-translate-y-1"
         >
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
               <CalendarDays size={40} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Demande de Congés</h2>
            <p className="text-center text-slate-500">Poser des CP, RTT ou arrêts</p>
         </button>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-4xl">
        {canValidate && (
           <button 
             onClick={() => onNavigate('validation')}
             className="px-6 py-6 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-3 shadow-md"
           >
             <Briefcase size={24} /> Espace Responsable (Validation)
           </button>
        )}
        
        {isAssistant && (
           <button 
             onClick={() => onNavigate('assistant')}
             className="px-6 py-6 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-2xl font-bold text-lg hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors flex items-center justify-center gap-3 shadow-md"
           >
             <FileCheck size={24} /> Espace Assistante (Suivi)
           </button>
        )}
      </div>
    </div>
  );
};