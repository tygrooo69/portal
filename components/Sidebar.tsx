import React from 'react';
import { LayoutDashboard, Settings, MessageSquare, Menu, Briefcase, LogIn, LogOut } from 'lucide-react';
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
    { id: 'ai-chat', label: 'Assistant Lumina', icon: MessageSquare },
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
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'} flex-shrink-0 z-50`}>
      {/* Header Logo Area */}
      <div className="p-6 flex items-center justify-between flex-shrink-0">
        {!isCollapsed && (
           <div className="flex items-center space-x-3 overflow-hidden">
             {logo ? (
                <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-md flex-shrink-0" />
             ) : (
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm">
                  <span className="text-white font-bold text-lg">L</span>
                </div>
             )}
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 truncate">
               Lumina
             </span>
           </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
             <div className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors" onClick={toggleCollapse}>
               {logo ? (
                 <img src={logo} alt="Logo" className="w-8 h-8 object-contain rounded-md" />
               ) : (
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
                   <span className="text-white font-bold text-lg">L</span>
                 </div>
               )}
             </div>
          </div>
        )}
        {!isCollapsed && (
           <button onClick={toggleCollapse} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
             <Menu size={20} />
           </button>
        )}
      </div>

      {/* Navigation - Scrollable Area */}
      <nav className="flex-1 px-4 space-y-2 mt-2 overflow-y-auto min-h-0 custom-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id || 
                           (item.id === 'settings' && (currentView === 'admin-apps' || currentView === 'admin-docs' || currentView === 'admin-users'));
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewMode)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={20} className={`flex-shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'}`} />
              {!isCollapsed && <span className="font-medium truncate">{item.label}</span>}
              {isCollapsed && isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full" />}
            </button>
          );
        })}
      </nav>

      {/* User Profile Section - Fixed at bottom */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex-shrink-0 bg-white dark:bg-slate-900">
        {currentUser ? (
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors`}>
            
            {/* Clickable Profile Area */}
            <div 
              className={`flex items-center flex-1 min-w-0 gap-3 cursor-pointer ${isCollapsed ? 'justify-center' : ''}`}
              onClick={onProfileClick}
              title="Modifier mon profil"
            >
              <div className={`w-9 h-9 rounded-full ${currentUser.color} flex items-center justify-center text-white font-bold flex-shrink-0 border-2 border-white dark:border-slate-700 shadow-sm text-xs`}>
                {currentUser.avatar ? <img src={currentUser.avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" /> : getInitials(currentUser.name)}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 truncate">{currentUser.email}</p>
                </div>
              )}
            </div>

            {/* Logout Button */}
            {!isCollapsed && (
              <button 
                onClick={(e) => { e.stopPropagation(); onLogoutClick(); }} 
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0" 
                title="Se déconnecter"
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        ) : (
          <button 
            onClick={onLoginClick}
            className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3'} px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors font-medium`}
            title="S'identifier"
          >
            <LogIn size={20} />
            {!isCollapsed && <span>S'identifier</span>}
          </button>
        )}
      </div>
    </div>
  );
};