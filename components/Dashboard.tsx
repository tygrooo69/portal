import React, { useState, useEffect } from 'react';
import { Search, Cloud, FileText, Image as ImageIcon, PieChart, Shield, Bell, Calendar } from 'lucide-react';
import { AppItem } from '../types';

const apps: AppItem[] = [
  { id: '1', name: 'Drive Cloud', description: 'Stockage sécurisé', icon: Cloud, color: 'bg-blue-500', category: 'utilities' },
  { id: '2', name: 'Notes Pro', description: 'Prise de notes', icon: FileText, color: 'bg-yellow-500', category: 'productivity' },
  { id: '3', name: 'Pixel Studio', description: 'Édition d\'images', icon: ImageIcon, color: 'bg-purple-500', category: 'creative' },
  { id: '4', name: 'Data View', description: 'Analytique', icon: PieChart, color: 'bg-green-500', category: 'analytics' },
  { id: '5', name: 'Security', description: 'Centre de sécurité', icon: Shield, color: 'bg-red-500', category: 'utilities' },
  { id: '6', name: 'Calendar', description: 'Gestion du temps', icon: Calendar, color: 'bg-indigo-500', category: 'productivity' },
];

export const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Header / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Portail Lumina
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Votre espace de travail centralisé.</p>
        </div>
        <div className="flex items-center space-x-4">
           <div className="hidden md:block text-right">
             <p className="text-2xl font-semibold text-slate-800 dark:text-white">{formatTime(currentTime)}</p>
             <p className="text-sm text-slate-500 capitalize">{formatDate(currentTime)}</p>
           </div>
           <button className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative">
             <Bell size={20} />
             <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-800"></span>
           </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mb-10">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-slate-400 transition-all"
          placeholder="Rechercher une application..."
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <span className="hidden sm:inline-block bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700">CMD+K</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - App Grid */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Section: Quick Access */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Mes Applications</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {apps.map((app) => (
                <button 
                  key={app.id}
                  className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <app.icon size={28} />
                  </div>
                  <span className="font-semibold text-slate-800 dark:text-white">{app.name}</span>
                  <span className="text-xs text-slate-400 mt-1">{app.description}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Sidebar Right - Widgets */}
        <div className="space-y-6">
          
          {/* Weather Widget Mock */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group">
             <div className="relative z-10">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-blue-100 text-sm font-medium">Météo</p>
                   <h3 className="text-3xl font-bold mt-1">Paris</h3>
                 </div>
                 <Cloud className="w-10 h-10 text-blue-200" />
               </div>
               <div className="mt-6 flex items-end gap-2">
                 <span className="text-5xl font-bold">18°</span>
                 <span className="text-blue-100 mb-1.5">Ciel dégagé</span>
               </div>
             </div>
             {/* Decoration */}
             <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
          </div>
          
        </div>
      </div>
    </div>
  );
};