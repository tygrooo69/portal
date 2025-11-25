import React, { useState, useEffect } from 'react';
import { Search, Cloud, Bell, Download, FileText, FileCode, FileJson, CornerDownLeft, Briefcase, Calendar, Clock, AlertCircle, CheckSquare } from 'lucide-react';
import { AppItem, DocumentItem, Project, Task, User } from '../types';
import { getIcon } from '../utils/iconHelper';

interface DashboardProps {
  apps: AppItem[];
  documents: DocumentItem[];
  projects?: Project[];
  tasks?: Task[];
  currentUser: User | null;
  onProjectClick?: (projectId: string) => void;
  onTaskClick?: (taskId: string, projectId: string) => void;
  onNavigateToProjects?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  apps, 
  documents, 
  projects = [], 
  tasks = [], 
  currentUser,
  onProjectClick,
  onTaskClick,
  onNavigateToProjects
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleAppClick = (app: AppItem) => {
    if (app.url) {
      window.open(app.url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  // Filter apps based on search query
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter projects based on search query
  const filteredProjects = searchQuery ? projects.filter(proj => 
    proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (proj.description && proj.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Filter tasks based on search query
  const filteredTasks = searchQuery ? tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Filter Projects for Widget based on User
  // If logged in: show only projects where user is a member
  // If not logged in: show all (public view)
  const widgetProjects = currentUser 
    ? projects.filter(p => p.members && p.members.includes(currentUser.id))
    : projects;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (filteredApps.length > 0) handleAppClick(filteredApps[0]);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'json': return <FileJson className="text-yellow-500" />;
      case 'md':
      case 'txt': return <FileText className="text-blue-500" />;
      default: return <FileCode className="text-slate-500" />;
    }
  };

  // Helper pour calculer les jours restants
  const getDaysRemaining = (endDateStr?: string) => {
    if (!endDateStr) return null;
    const end = new Date(endDateStr);
    const now = new Date();
    // Reset hours for simpler day calc
    end.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getDaysRemainingBadge = (days: number) => {
    if (days < 0) {
      return <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/30 px-2 py-0.5 rounded-full flex items-center gap-1"><AlertCircle size={10}/> En retard ({Math.abs(days)}j)</span>;
    } else if (days === 0) {
      return <span className="text-xs font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">Aujourd'hui</span>;
    } else if (days <= 7) {
      return <span className="text-xs font-medium text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">{days} jours restants</span>;
    } else {
      return <span className="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full">{days} jours restants</span>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 md:p-8">
      {/* Header / Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
            Portail Lumina
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {currentUser ? `Bonjour ${currentUser.name}, votre espace de travail centralisé.` : 'Votre espace de travail centralisé.'}
          </p>
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-slate-400 transition-all"
          placeholder="Rechercher une application, un projet ou une tâche..."
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <span className="hidden sm:inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700">
            Entrée <CornerDownLeft size={10} />
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - App Grid & Documents */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* SEARCH RESULTS SECTION */}
          {searchQuery && (
            <div className="space-y-6 animate-in fade-in slide-in-from-top-4">
              
              {/* Projects Results */}
              {filteredProjects.length > 0 && (
                <section>
                   <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Projets trouvés</h2>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                     {filteredProjects.map(proj => (
                       <div 
                          key={proj.id}
                          onClick={() => onProjectClick && onProjectClick(proj.id)}
                          className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 cursor-pointer flex items-center gap-3 transition-colors"
                       >
                          <div className={`w-3 h-3 rounded-full ${proj.color}`}></div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{proj.name}</p>
                            <p className="text-xs text-slate-500">{proj.status === 'active' ? 'Actif' : 'En pause'}</p>
                          </div>
                       </div>
                     ))}
                   </div>
                </section>
              )}

              {/* Tasks Results */}
              {filteredTasks.length > 0 && (
                <section>
                   <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Tâches trouvées</h2>
                   <div className="grid grid-cols-1 gap-2">
                     {filteredTasks.map(task => {
                       const parentProject = projects.find(p => p.id === task.projectId);
                       return (
                         <div 
                            key={task.id}
                            onClick={() => onTaskClick && onTaskClick(task.id, task.projectId)}
                            className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-400 cursor-pointer flex items-center justify-between transition-colors"
                         >
                            <div className="flex items-center gap-3">
                              <CheckSquare size={16} className={task.status === 'done' ? 'text-green-500' : 'text-blue-500'} />
                              <div>
                                <p className={`font-medium text-sm ${task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800 dark:text-white'}`}>{task.title}</p>
                                <p className="text-[10px] text-slate-400">Projet: {parentProject?.name || 'Inconnu'}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] px-2 py-0.5 rounded border ${task.priority === 'high' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                              {task.priority === 'high' ? 'Urgent' : 'Normal'}
                            </span>
                         </div>
                       );
                     })}
                   </div>
                </section>
              )}

              {filteredProjects.length === 0 && filteredTasks.length === 0 && filteredApps.length === 0 && (
                 <div className="text-center p-8 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <p className="text-slate-500">Aucun résultat trouvé pour "{searchQuery}"</p>
                 </div>
              )}
              
              <hr className="border-slate-200 dark:border-slate-800 my-4" />
            </div>
          )}

          {/* Section: Applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {searchQuery ? 'Applications' : 'Mes Applications'}
              </h2>
            </div>
            
            {filteredApps.length === 0 && searchQuery ? (
               <div className="p-4 text-sm text-slate-500 italic">Aucune application correspondante.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {filteredApps.map((app) => {
                  const Icon = getIcon(app.icon);
                  return (
                    <button 
                      key={app.id}
                      onClick={() => handleAppClick(app)}
                      className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all duration-300 hover:-translate-y-1"
                    >
                      <div className={`w-14 h-14 ${app.color} rounded-2xl flex items-center justify-center text-white shadow-lg mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={28} />
                      </div>
                      <span className="font-semibold text-slate-800 dark:text-white">{app.name}</span>
                      <span className="text-xs text-slate-400 mt-1">{app.description}</span>
                    </button>
                  );
                })}
              </div>
            )}
            
            {filteredApps.length === 0 && !searchQuery && (
              <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                 <p className="text-slate-500">Aucune application configurée. Allez dans "Gestion Apps" pour commencer.</p>
              </div>
            )}
          </section>

          {/* Section: Documents */}
          {!searchQuery && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white">Documents & Ressources</h2>
              </div>

              {documents.length === 0 ? (
                 <div className="p-6 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                   <p className="text-sm text-slate-500">Aucun document disponible. Importez des fichiers dans "Gestion Docs".</p>
                 </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl flex-shrink-0">
                             {getFileIcon(doc.type)}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-medium text-slate-800 dark:text-white truncate pr-4">{doc.name}</h4>
                            <p className="text-xs text-slate-500">
                              {doc.uploadDate} • {Math.round(doc.content.length / 1024 * 10) / 10} KB
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                          title="Télécharger"
                        >
                          <Download size={20} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

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

          {/* Project Status Summary Widget */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-0 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
             <div 
               onClick={onNavigateToProjects}
               className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
               title="Voir tous les projets"
             >
               <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                 <Briefcase size={18} />
               </div>
               <div className="flex-1">
                 <h3 className="font-semibold text-slate-800 dark:text-white group-hover:text-blue-600 transition-colors">Suivi des Projets</h3>
                 {currentUser && <p className="text-xs text-slate-500">Mes projets assignés</p>}
               </div>
               <CornerDownLeft size={16} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
             </div>
             
             {widgetProjects.length === 0 ? (
               <div className="p-6 text-center text-sm text-slate-400">
                 {currentUser ? 'Aucun projet assigné.' : 'Aucun projet actif.'}
               </div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                     <tr>
                       <th className="px-5 py-3 font-medium">Nom</th>
                       <th className="px-5 py-3 font-medium">Échéance</th>
                       <th className="px-5 py-3 font-medium text-right">Priorité</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                     {widgetProjects.slice(0, 5).map(proj => {
                       const daysRemaining = getDaysRemaining(proj.endDate);
                       return (
                        <tr 
                          key={proj.id} 
                          onClick={() => onProjectClick && onProjectClick(proj.id)}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                        >
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${proj.color}`} />
                              <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px] group-hover:text-blue-600 transition-colors">{proj.name}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-slate-500 dark:text-slate-400">
                              {proj.endDate ? (
                                <div className="flex flex-col gap-1">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar size={12} />
                                    {new Date(proj.endDate).toLocaleDateString(undefined, {month:'numeric', day:'numeric'})}
                                  </span>
                                  {daysRemaining !== null && getDaysRemainingBadge(daysRemaining)}
                                </div>
                              ) : '-'}
                          </td>
                          <td className="px-5 py-3 text-right">
                            {proj.priority ? (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                proj.priority === 'high' 
                                  ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800' 
                                  : proj.priority === 'medium'
                                    ? 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800'
                                    : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400'
                              }`}>
                                {proj.priority === 'high' ? 'Haute' : proj.priority === 'medium' ? 'Moy.' : 'Basse'}
                              </span>
                            ) : <span className="text-slate-300">-</span>}
                          </td>
                        </tr>
                       );
                     })}
                   </tbody>
                 </table>
                 {widgetProjects.length > 5 && (
                    <div className="px-5 py-3 text-center border-t border-slate-100 dark:border-slate-800">
                      <span className="text-xs text-slate-400">Et {widgetProjects.length - 5} autres...</span>
                    </div>
                 )}
               </div>
             )}
          </div>
          
        </div>
      </div>
    </div>
  );
};