import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AIAssistant } from './components/AIAssistant';
import { AdminApps } from './components/AdminApps';
import { ViewMode, AppItem } from './types';
import { Moon, Sun } from 'lucide-react';

const DEFAULT_APPS: AppItem[] = [
  { id: '1', name: 'Drive Cloud', description: 'Stockage sécurisé', icon: 'Cloud', color: 'bg-blue-500', category: 'utilities', url: 'https://drive.google.com' },
  { id: '2', name: 'Notes Pro', description: 'Prise de notes', icon: 'FileText', color: 'bg-yellow-500', category: 'productivity' },
  { id: '3', name: 'Pixel Studio', description: 'Édition d\'images', icon: 'Image', color: 'bg-purple-500', category: 'creative' },
  { id: '4', name: 'Data View', description: 'Analytique', icon: 'PieChart', color: 'bg-green-500', category: 'analytics' },
  { id: '5', name: 'Security', description: 'Centre de sécurité', icon: 'Shield', color: 'bg-red-500', category: 'utilities' },
  { id: '6', name: 'Calendar', description: 'Gestion du temps', icon: 'Calendar', color: 'bg-indigo-500', category: 'productivity' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apps, setApps] = useState<AppItem[]>([]);

  useEffect(() => {
    // Load apps from local storage or use defaults
    const savedApps = localStorage.getItem('lumina_apps');
    if (savedApps) {
      try {
        setApps(JSON.parse(savedApps));
      } catch (e) {
        setApps(DEFAULT_APPS);
      }
    } else {
      setApps(DEFAULT_APPS);
    }

    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const saveApps = (newApps: AppItem[]) => {
    setApps(newApps);
    localStorage.setItem('lumina_apps', JSON.stringify(newApps));
  };

  const handleAddApp = (app: AppItem) => {
    saveApps([...apps, app]);
  };

  const handleUpdateApp = (updatedApp: AppItem) => {
    saveApps(apps.map(a => a.id === updatedApp.id ? updatedApp : a));
  };

  const handleDeleteApp = (id: string) => {
    saveApps(apps.filter(a => a.id !== id));
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard apps={apps} />;
      case 'ai-chat':
        return (
          <div className="p-6 md:p-8 h-full max-w-5xl mx-auto">
            <AIAssistant />
          </div>
        );
      case 'admin-apps':
        return (
          <AdminApps 
            apps={apps} 
            onAddApp={handleAddApp} 
            onUpdateApp={handleUpdateApp} 
            onDeleteApp={handleDeleteApp} 
          />
        );
      case 'apps':
        return (
          <div className="p-8 flex items-center justify-center h-full">
             <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Catalogue d'Applications</h2>
                <p className="text-slate-500">Fonctionnalité à venir dans la v2.0</p>
             </div>
          </div>
        );
      case 'settings':
        return (
           <div className="p-8 flex flex-col max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Paramètres</h2>
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                 <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">Apparence</p>
                      <p className="text-sm text-slate-500">Basculer entre le mode clair et sombre</p>
                    </div>
                    <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                       {isDarkMode ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-orange-500" />}
                    </button>
                 </div>
                 <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">Clé API Gemini</p>
                      <p className="text-sm text-slate-500">Gérée via les variables d'environnement</p>
                    </div>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200">Connecté</span>
                 </div>
              </div>
           </div>
        );
      default:
        return <Dashboard apps={apps} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar 
        currentView={view} 
        onNavigate={setView} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      
      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Mobile Overlay */}
        <div className="absolute top-4 right-4 z-50 md:hidden">
          {/* Mobile menu trigger would go here normally */}
        </div>

        {/* Theme Toggle (Floating for easy access if not in settings) */}
        <div className="absolute top-6 right-6 z-40 hidden md:block">
          <button 
            onClick={toggleTheme}
            className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
            title="Changer le thème"
          >
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>

        {renderContent()}
      </main>
    </div>
  );
};

export default App;