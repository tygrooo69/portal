import React from 'react';
import { LayoutDashboard, Settings, MessageSquare, Menu, Briefcase, LogIn, LogOut, Clock, FileCheck } from 'lucide-react';
import { ViewMode, User } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  currentUser: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onProfileClick?: () => void;
  logo?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onNavigate, 
  isCollapsed, 
  toggleCollapse, 
  currentUser,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
  logo
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'projects', label: 'Projets & Tâches', icon: Briefcase },
    { id: 'time-manager', label: 'Gestion Temps', icon: Clock },
    { id: 'ai-chat', label: 'Assistant SpotLink', icon: MessageSquare },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  return (
    <>
      {/* Onglet visible uniquement quand le menu est caché */}
      <div 
        className={`fixed top-6 left-0 z-50 transition-transform duration-300 ${
          isCollapsed ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button 
          onClick={toggleCollapse}
          className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-r-xl shadow-lg transition-colors flex items-center justify-center"
          title="Ouvrir le menu"
        >
          <Menu size={24} />
        </button>
      </div>

      {/* Barre latérale principale */}
      <div 
        className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex-shrink-0 z-40 overflow-hidden
          ${isCollapsed ? 'w-0 opacity-0' : 'w-72 opacity-100'}
        `}
      >
        <div className="w-72 flex flex-col h-full"> {/* Container interne fixe pour éviter le reflow du texte pendant l'animation */}
          
          {/* Header Logo Area */}
          <div className="p-6 flex flex-col gap-6 flex-shrink-0">
            <div className="flex items-center justify-between h-16">
               {logo ? (
                  <div className="flex-1 flex justify-start overflow-hidden mr-1 h-full items-center">
                    <img src={logo} alt="Logo" className="h-full w-full object-contain object-left" />
                  </div>
               ) : (
                 <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-bold text-xl">S</span>
                    </div>
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 truncate">
                      SpotLink
                    </span>
                 </div>
               )}
               
               <button onClick={toggleCollapse} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
                 <Menu size={24} />
               </button>
            </div>

            {/* Auth Section: Login OR Profile */}
            {!currentUser ? (
              <button 
                onClick={onLoginClick}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md hover:shadow-lg font-medium"
                title="S'identifier"
              >
                <LogIn size={20} />
                <span>S'identifier</span>
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-100 dark:border-slate-700/50">
                
                {/* Clickable Profile Area */}
                <div 
                  className="flex items-center flex-1 min-w-0 gap-3 cursor-pointer"
                  onClick={onProfileClick}
                  title="Modifier mon profil"
                >
                  <div className={`w-10 h-10 rounded-full ${currentUser.color} flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm text-sm relative`}>
                    {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : getInitials(currentUser.name)}
                    {currentUser.role === 'admin' && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></div>}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 truncate capitalize">{currentUser.role === 'admin' ? 'Responsable' : currentUser.role}</p>
                  </div>
                </div>

                {/* Logout Button */}
                <button 
                  onClick={(e) => { e.stopPropagation(); onLogoutClick(); }} 
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0" 
                  title="Se déconnecter"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Navigation - Scrollable Area */}
          <nav className="flex-1 px-4 space-y-2 overflow-y-auto min-h-0 custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || 
                               (item.id === 'settings' && (currentView === 'admin-apps' || currentView === 'admin-docs' || currentView === 'admin-users'));
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id as ViewMode)}
                  className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group relative
                    ${isActive 
                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                    }`}
                >
                  <Icon size={22} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
                  <span className="font-medium truncate text-sm">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};