import React, { useState, useEffect } from 'react';
import { Search, Cloud, Bell, Download, FileText, FileCode, FileJson, CornerDownLeft } from 'lucide-react';
import { AppItem, DocumentItem } from '../types';
import { getIcon } from '../utils/iconHelper';

interface DashboardProps {
  apps: AppItem[];
  documents: DocumentItem[];
}

export const Dashboard: React.FC<DashboardProps> = ({ apps, documents }) => {
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && filteredApps.length > 0) {
      handleAppClick(filteredApps[0]);
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
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-11 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white placeholder-slate-400 transition-all"
          placeholder="Rechercher une application..."
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
          
          {/* Section: Applications */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
                {searchQuery ? 'Résultats de recherche' : 'Mes Applications'}
              </h2>
            </div>
            
            {filteredApps.length === 0 ? (
               <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                 <p className="text-slate-500">
                   {searchQuery ? `Aucune application trouvée pour "${searchQuery}"` : 'Aucune application configurée. Allez dans "Gestion Apps" pour commencer.'}
                 </p>
               </div>
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
          </section>

          {/* Section: Documents */}
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