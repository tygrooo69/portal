import React, { useState } from 'react';
import { Plus, Trash2, Save, X, Edit2, Check } from 'lucide-react';
import { AppItem } from '../types';
import { getIcon, getIconNames } from '../utils/iconHelper';

interface AdminAppsProps {
  apps: AppItem[];
  onAddApp: (app: AppItem) => void;
  onUpdateApp: (app: AppItem) => void;
  onDeleteApp: (id: string) => void;
}

const COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
  'bg-teal-500', 'bg-cyan-500', 'bg-slate-500'
];

export const AdminApps: React.FC<AdminAppsProps> = ({ apps, onAddApp, onUpdateApp, onDeleteApp }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<AppItem>>({});
  const [isAdding, setIsAdding] = useState(false);
  
  const emptyForm: AppItem = {
    id: '',
    name: '',
    description: '',
    icon: 'AppWindow',
    color: 'bg-blue-500',
    category: 'productivity',
    url: ''
  };

  const [newAppForm, setNewAppForm] = useState<AppItem>({ ...emptyForm });

  const handleEditClick = (app: AppItem) => {
    setIsEditing(app.id);
    setEditForm({ ...app });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (isEditing && editForm.name) {
      onUpdateApp(editForm as AppItem);
      setIsEditing(null);
      setEditForm({});
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newAppForm.name) {
      onAddApp({ ...newAppForm, id: Date.now().toString() });
      setNewAppForm({ ...emptyForm });
      setIsAdding(false);
    }
  };

  const IconSelector = ({ value, onChange }: { value: string, onChange: (icon: string) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const SelectedIcon = getIcon(value);
    const iconNames = getIconNames();

    return (
      <div className="relative">
        <label className="block text-xs font-medium text-slate-500 mb-1">Icône</label>
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
        >
          <div className="flex items-center gap-2">
            <SelectedIcon size={18} className="text-slate-600 dark:text-slate-300" />
            <span className="text-sm">{value}</span>
          </div>
        </button>
        
        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)}></div>
            <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl grid grid-cols-4 gap-2 p-2">
              {iconNames.map(iconName => {
                const Icon = getIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => { onChange(iconName); setIsOpen(false); }}
                    className={`p-2 flex flex-col items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 ${value === iconName ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' : 'text-slate-500'}`}
                    title={iconName}
                  >
                    <Icon size={20} />
                  </button>
                )
              })}
            </div>
          </>
        )}
      </div>
    );
  };

  const ColorSelector = ({ value, onChange }: { value: string, onChange: (color: string) => void }) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Couleur</label>
      <div className="flex flex-wrap gap-2">
        {COLORS.map(color => (
          <button
            key={color}
            type="button"
            onClick={() => onChange(color)}
            className={`w-6 h-6 rounded-full ${color} ${value === color ? 'ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-900' : ''}`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="p-6 md:p-8 overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion des Applications</h2>
          <p className="text-slate-500">Ajoutez, modifiez ou supprimez les raccourcis du portail.</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          <span>{isAdding ? 'Annuler' : 'Nouvelle App'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Ajouter une application</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nom</label>
                <input 
                  required
                  value={newAppForm.name}
                  onChange={e => setNewAppForm({...newAppForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Ex: Google Drive"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Description</label>
                <input 
                  value={newAppForm.description}
                  onChange={e => setNewAppForm({...newAppForm, description: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Courte description..."
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">URL du lien</label>
                <input 
                  value={newAppForm.url || ''}
                  onChange={e => setNewAppForm({...newAppForm, url: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="space-y-4">
              <IconSelector value={newAppForm.icon} onChange={icon => setNewAppForm({...newAppForm, icon})} />
              <ColorSelector value={newAppForm.color} onChange={color => setNewAppForm({...newAppForm, color})} />
              
              <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Ajouter l'application
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {apps.map(app => {
          const Icon = getIcon(app.icon);
          const isItemEditing = isEditing === app.id;

          if (isItemEditing) {
            return (
              <div key={app.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-500 shadow-md flex flex-col md:flex-row gap-4 items-start md:items-center">
                 <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="Nom"
                    />
                    <input 
                      value={editForm.description}
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="Description"
                    />
                    <input 
                      value={editForm.url || ''}
                      onChange={e => setEditForm({...editForm, url: e.target.value})}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="URL"
                    />
                 </div>
                 <div className="flex items-center gap-2">
                    <button onClick={handleSaveEdit} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check size={18}/></button>
                    <button onClick={handleCancelEdit} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><X size={18}/></button>
                 </div>
              </div>
            );
          }

          return (
            <div key={app.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 ${app.color} rounded-xl flex items-center justify-center text-white shadow-sm`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">{app.name}</h3>
                  <p className="text-sm text-slate-500">{app.description} • <span className="text-xs opacity-70">{app.url || 'Pas de lien'}</span></p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(app)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDeleteApp(app.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};