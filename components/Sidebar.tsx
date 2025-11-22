import React from 'react';
import { LayoutDashboard, Settings, MessageSquare, Menu, AppWindow } from 'lucide-react';
import { ViewMode } from '../types';

interface SidebarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, isCollapsed, toggleCollapse }) => {
  const navItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'ai-chat', label: 'Assistant Lumina', icon: MessageSquare },
    { id: 'admin-apps', label: 'Gestion Apps', icon: AppWindow },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className={`flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="p-6 flex items-center justify-between">
        {!isCollapsed && (
           <div className="flex items-center space-x-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
               <span className="text-white font-bold text-lg">L</span>
             </div>
             <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
               Lumina
             </span>
           </div>
        )}
        {isCollapsed && (
          <div className="w-full flex justify-center">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center cursor-pointer" onClick={toggleCollapse}>
               <span className="text-white font-bold text-lg">L</span>
             </div>
          </div>
        )}
        {!isCollapsed && (
           <button onClick={toggleCollapse} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
             <Menu size={20} />
           </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id as ViewMode)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 shadow-sm' 
                  : 'text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50'
                }`}
            >
              <Icon size={20} className={isActive ? 'text-blue-600 dark:text-blue-400' : 'group-hover:text-slate-700 dark:group-hover:text-slate-200'} />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
              {isCollapsed && isActive && <div className="absolute left-16 w-1 h-8 bg-blue-600 rounded-r-full" />}
            </button>
          );
        })}
      </nav>
    </div>
  );
};