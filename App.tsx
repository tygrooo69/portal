import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AIAssistant } from './components/AIAssistant';
import { AdminApps } from './components/AdminApps';
import { AdminDocuments } from './components/AdminDocuments';
import { ViewMode, AppItem, DocumentItem } from './types';
import { Moon, Sun, Key, Save, Check } from 'lucide-react';

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [tempApiKey, setTempApiKey] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');

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

    // Load Documents from local storage
    const savedDocs = localStorage.getItem('lumina_documents');
    if (savedDocs) {
      try {
        setDocuments(JSON.parse(savedDocs));
      } catch (e) {
        console.error('Failed to parse documents', e);
      }
    }

    // Load API Key
    const savedKey = localStorage.getItem('lumina_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setTempApiKey(savedKey);
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

  // Document management
  const saveDocuments = (newDocs: DocumentItem[]) => {
    setDocuments(newDocs);
    try {
      localStorage.setItem('lumina_documents', JSON.stringify(newDocs));
    } catch (e) {
      alert("Erreur: Stockage local saturé. Impossible de sauvegarder plus de documents.");
    }
  };

  const handleAddDocument = (doc: DocumentItem) => {
    saveDocuments([...documents, doc]);
  };

  const handleDeleteDocument = (id: string) => {
    saveDocuments(documents.filter(d => d.id !== id));
  };

  const handleSaveApiKey = () => {
    localStorage.setItem('lumina_api_key', tempApiKey);
    setApiKey(tempApiKey);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard apps={apps} />;
      case 'ai-chat':
        return (
          <div className="p-6 md:p-8 h-full max-w-5xl mx-auto">
            <AIAssistant apiKey={apiKey} documents={documents} />
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
      case 'admin-docs':
        return (
          <AdminDocuments 
            documents={documents}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
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
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
                 
                 {/* Appearance Settings */}
                 <div className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-800 dark:text-white">Apparence</p>
                      <p className="text-sm text-slate-500">Basculer entre le mode clair et sombre</p>
                    </div>
                    <button onClick={toggleTheme} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg transition-colors hover:bg-slate-200 dark:hover:bg-slate-700">
                       {isDarkMode ? <Moon size={20} className="text-blue-400" /> : <Sun size={20} className="text-orange-500" />}
                    </button>
                 </div>

                 {/* API Key Settings */}
                 <div className="p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-slate-800 dark:text-white flex items-center gap-2">
                          <Key size={18} className="text-blue-500" /> Clé API Gemini
                        </p>
                        <p className="text-sm text-slate-500">Définissez votre propre clé (écrase celle du serveur)</p>
                      </div>
                      {saveStatus === 'saved' && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full border border-green-200 flex items-center gap-1 animate-fade-in">
                          <Check size={12} /> Sauvegardé
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-2 mt-1">
                      <input 
                        type="password" 
                        value={tempApiKey}
                        onChange={(e) => setTempApiKey(e.target.value)}
                        placeholder="Collez votre clé API Google ici (AIza...)"
                        className="flex-1 px-3 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                      />
                      <button 
                        onClick={handleSaveApiKey}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                      >
                        <Save size={16} />
                        <span className="hidden sm:inline">Enregistrer</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      La clé est stockée localement dans votre navigateur. Si vide, la variable d'environnement du serveur sera utilisée.
                    </p>
                 </div>

                 {/* Version Info */}
                 <div className="p-4 bg-slate-50 dark:bg-slate-950/50">
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>Version 1.3.0</span>
                      <span>Lumina Portal</span>
                    </div>
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