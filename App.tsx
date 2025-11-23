import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AIAssistant } from './components/AIAssistant';
import { AdminApps } from './components/AdminApps';
import { AdminDocuments } from './components/AdminDocuments';
import { Settings } from './components/Settings';
import { ViewMode, AppItem, DocumentItem } from './types';
import { Moon, Sun } from 'lucide-react';
import { api } from './services/api';

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
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Initialize with empty string, will be populated by server or localStorage
  const [apiKey, setApiKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin');

  // Initialize Data
  useEffect(() => {
    const initialize = async () => {
      // 1. Try loading from Server (Disk)
      const serverData = await api.loadData();
      
      if (serverData) {
        setApps(serverData.apps.length > 0 ? serverData.apps : DEFAULT_APPS);
        setDocuments(serverData.documents);
        // Load API key from server if available
        if (serverData.apiKey) {
          setApiKey(serverData.apiKey);
        }
        if (serverData.adminPassword) {
          setAdminPassword(serverData.adminPassword);
        }
      } else {
        // 2. Fallback to LocalStorage (Client)
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

        const savedDocs = localStorage.getItem('lumina_documents');
        if (savedDocs) {
          try {
            setDocuments(JSON.parse(savedDocs));
          } catch (e) {
            console.error(e);
          }
        }
        
        const savedKey = localStorage.getItem('lumina_api_key');
        if (savedKey) setApiKey(savedKey);
      }

      // Check theme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
      
      setIsLoaded(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Unified Save Function
  // Accepts optional newKey or newPassword to ensure update
  const persistData = async (newApps: AppItem[], newDocs: DocumentItem[], newKey?: string, newPwd?: string) => {
    const keyToSave = newKey !== undefined ? newKey : apiKey;
    const pwdToSave = newPwd !== undefined ? newPwd : adminPassword;

    // Update UI immediately
    setApps(newApps);
    setDocuments(newDocs);
    if (newKey !== undefined) setApiKey(newKey);
    if (newPwd !== undefined) setAdminPassword(newPwd);

    // Try Save to Server (storage.json)
    const serverSaved = await api.saveData(newApps, newDocs, keyToSave, pwdToSave);
    
    if (!serverSaved) {
      // Fallback: Save to LocalStorage
      try {
        localStorage.setItem('lumina_apps', JSON.stringify(newApps));
        localStorage.setItem('lumina_documents', JSON.stringify(newDocs));
        if (newKey !== undefined) localStorage.setItem('lumina_api_key', newKey);
      } catch (e) {
        console.warn("LocalStorage quota exceeded or error", e);
      }
    }
  };

  const handleSaveApiKey = (key: string) => {
    persistData(apps, documents, key, undefined);
  };

  const handleSaveAdminPassword = (password: string) => {
    persistData(apps, documents, undefined, password);
  };

  const handleAddApp = (app: AppItem) => {
    persistData([...apps, app], documents);
  };

  const handleUpdateApp = (updatedApp: AppItem) => {
    persistData(apps.map(a => a.id === updatedApp.id ? updatedApp : a), documents);
  };

  const handleDeleteApp = (id: string) => {
    persistData(apps.filter(a => a.id !== id), documents);
  };

  const handleAddDocument = (doc: DocumentItem) => {
    persistData(apps, [...documents, doc]);
  };

  const handleDeleteDocument = (id: string) => {
    persistData(apps, documents.filter(d => d.id !== id));
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderContent = () => {
    if (!isLoaded) return <div className="flex h-full items-center justify-center text-slate-400">Chargement...</div>;

    switch (view) {
      case 'dashboard':
        return <Dashboard apps={apps} documents={documents} />;
      case 'ai-chat':
        return (
          <div className="p-6 md:p-8 h-full max-w-5xl mx-auto">
            <AIAssistant documents={documents} apiKey={apiKey} />
          </div>
        );
      case 'admin-apps':
        return (
          <AdminApps 
            apps={apps} 
            onAddApp={handleAddApp} 
            onUpdateApp={handleUpdateApp} 
            onDeleteApp={handleDeleteApp}
            onBack={() => setView('settings')}
          />
        );
      case 'admin-docs':
        return (
          <AdminDocuments 
            documents={documents}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onBack={() => setView('settings')}
          />
        );
      case 'settings':
        return (
          <Settings 
            currentPassword={adminPassword}
            onNavigate={setView}
            onSavePassword={handleSaveAdminPassword}
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return <Dashboard apps={apps} documents={documents} />;
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
        {/* Theme Toggle (Floating) - Visible only on Dashboard/Chat to keep Settings clean */}
        {view !== 'settings' && view !== 'admin-apps' && view !== 'admin-docs' && (
          <div className="absolute top-6 right-6 z-40 hidden md:block">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              title="Changer le thème"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;