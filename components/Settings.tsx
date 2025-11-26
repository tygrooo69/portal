import React, { useState, useEffect } from 'react';
import { Moon, Sun, Key, Lock, Unlock, ChevronRight, AppWindow, FileText, ShieldCheck, Users, Image as ImageIcon, Trash2, Upload } from 'lucide-react';
import { ViewMode } from '../types';

interface SettingsProps {
  currentPassword?: string;
  onNavigate: (view: ViewMode) => void;
  onSavePassword: (password: string) => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  logo: string;
  onSaveLogo: (logo: string) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ 
  currentPassword = 'admin', 
  onNavigate, 
  onSavePassword, 
  apiKey, 
  onSaveApiKey,
  logo,
  onSaveLogo,
  isDarkMode,
  toggleTheme
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [error, setError] = useState('');
  
  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [showChangePwd, setShowChangePwd] = useState(false);

  useEffect(() => {
    // Check session storage for persistence during session
    if (sessionStorage.getItem('spotlink_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === currentPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem('spotlink_auth', 'true');
      setError('');
    } else {
      setError('Mot de passe incorrect');
    }
  };

  const handlePasswordChange = () => {
    if (newPassword.length > 0) {
      onSavePassword(newPassword);
      setNewPassword('');
      setShowChangePwd(false);
      alert('Mot de passe administrateur mis à jour');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onSaveLogo(reader.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-full bg-slate-50 dark:bg-slate-950 p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-400">
              <Lock size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-2">Accès Sécurisé</h2>
          <p className="text-center text-slate-500 mb-8">Veuillez entrer le mot de passe administrateur pour accéder aux paramètres.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input 
                type="password" 
                value={inputPassword}
                onChange={(e) => setInputPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                placeholder="Mot de passe..."
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2 ml-1">{error}</p>}
            </div>
            <button 
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all active:scale-95"
            >
              Déverrouiller
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto max-w-3xl mx-auto custom-scrollbar">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
           <Unlock size={24} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Paramètres & Administration</h2>
      </div>

      <div className="space-y-6">
        
        {/* Admin Sections */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden p-4">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4 px-2">Gestion du contenu</h3>
          <div className="grid gap-3">
            <button 
              onClick={() => onNavigate('admin-apps')}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 text-blue-600 rounded-lg flex items-center justify-center">
                  <AppWindow size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 dark:text-white">Gérer les Applications</p>
                  <p className="text-xs text-slate-500">Ajouter, modifier ou supprimer des applications</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button 
              onClick={() => onNavigate('admin-docs')}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 text-purple-600 rounded-lg flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 dark:text-white">Gérer les Documents</p>
                  <p className="text-xs text-slate-500">Base de connaissances pour l'Assistant IA</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>

            <button 
              onClick={() => onNavigate('admin-users')}
              className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-slate-800 dark:text-white">Gérer l'Équipe</p>
                  <p className="text-xs text-slate-500">Ajouter ou supprimer des utilisateurs</p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-blue-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-200 dark:divide-slate-800">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider p-6 pb-2">Configuration générale</h3>
          
          {/* Appearance */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Mode Sombre</p>
                <p className="text-sm text-slate-500">Basculer entre thème clair et sombre</p>
              </div>
            </div>
            <button onClick={toggleTheme} className="relative inline-flex h-6 w-11 items-center rounded-full bg-slate-200 dark:bg-slate-700 transition-colors">
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {/* Logo Customization */}
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                   <ImageIcon size={20} />
                 </div>
                 <div>
                   <p className="font-medium text-slate-800 dark:text-white">Logo de l'application</p>
                   <p className="text-sm text-slate-500">Personnalisez l'identité visuelle (Haut de la barre latérale)</p>
                 </div>
               </div>
               {logo && (
                 <button onClick={() => onSaveLogo('')} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 border border-red-200 dark:border-red-900/30 px-2 py-1 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20">
                   <Trash2 size={12} /> Supprimer
                 </button>
               )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center bg-white dark:bg-slate-800 overflow-hidden flex-shrink-0">
                 {logo ? (
                   <img src={logo} alt="Logo Preview" className="w-full h-full object-contain" />
                 ) : (
                   <span className="text-2xl font-bold text-slate-300">S</span>
                 )}
              </div>
              <div className="flex-1 w-full">
                 <label className="cursor-pointer flex flex-col items-center justify-center w-full px-4 py-6 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 border-dashed rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors group">
                   <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload size={24} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                      <p className="mb-2 text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold">Cliquez pour importer</span></p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPG ou SVG (Max 2MB)</p>
                   </div>
                   <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                 </label>
              </div>
            </div>
          </div>

          {/* API Key */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <Key size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-800 dark:text-white">Clé API Gemini</p>
                <p className="text-sm text-slate-500">Clé pour le service d'intelligence artificielle</p>
              </div>
            </div>
            <input 
              type="password" 
              value={apiKey}
              onChange={(e) => onSaveApiKey(e.target.value)}
              placeholder="Collez votre clé API ici (AIza...)"
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            />
             <p className="text-xs text-slate-400 mt-2">Cette clé sera stockée de manière sécurisée sur le serveur.</p>
          </div>

          {/* Admin Password Change */}
          <div className="p-6">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <p className="font-medium text-slate-800 dark:text-white">Sécurité Administrateur</p>
                    <p className="text-sm text-slate-500">Changer le mot de passe d'accès</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowChangePwd(!showChangePwd)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {showChangePwd ? 'Annuler' : 'Modifier'}
                </button>
             </div>
             
             {showChangePwd && (
               <div className="flex gap-2 animate-in slide-in-from-top-2">
                  <input 
                    type="text" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe..."
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
                  />
                  <button 
                    onClick={handlePasswordChange}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                    Enregistrer
                  </button>
               </div>
             )}
          </div>
        </div>
        
        <div className="text-center text-xs text-slate-400 pt-4">
          SpotLink Portal v1.7.0 • Build 2024
        </div>
      </div>
    </div>
  );
};