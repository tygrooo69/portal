import React, { useState } from 'react';
import { Plus, Trash2, X, Edit2, Check, ChevronLeft, Lock } from 'lucide-react';
import { User } from '../types';

interface AdminUsersProps {
  users: User[];
  onAddUser: (user: User) => void;
  onUpdateUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  onBack?: () => void;
}

const COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
  'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 
  'bg-teal-500', 'bg-cyan-500', 'bg-slate-500'
];

export const AdminUsers: React.FC<AdminUsersProps> = ({ users, onAddUser, onUpdateUser, onDeleteUser, onBack }) => {
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<User>>({});
  const [isAdding, setIsAdding] = useState(false);
  
  const emptyForm: User = {
    id: '',
    name: '',
    email: '',
    password: '',
    color: 'bg-blue-500',
    avatar: ''
  };

  const [newUserForm, setNewUserForm] = useState<User>({ ...emptyForm });

  const handleEditClick = (user: User) => {
    setIsEditing(user.id);
    setEditForm({ ...user });
  };

  const handleCancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
  };

  const handleSaveEdit = () => {
    if (isEditing && editForm.name && editForm.email) {
      onUpdateUser(editForm as User);
      setIsEditing(null);
      setEditForm({});
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.name && newUserForm.email) {
      onAddUser({ ...newUserForm, id: Date.now().toString() });
      setNewUserForm({ ...emptyForm });
      setIsAdding(false);
    }
  };

  const ColorSelector = ({ value, onChange }: { value: string, onChange: (color: string) => void }) => (
    <div>
      <label className="block text-xs font-medium text-slate-500 mb-1">Couleur d'avatar</label>
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
        <div className="flex items-center gap-4">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestion de l'Équipe</h2>
            <p className="text-slate-500">Gérez les membres qui peuvent être assignés aux tâches et projets.</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          {isAdding ? <X size={18} /> : <Plus size={18} />}
          <span>{isAdding ? 'Annuler' : 'Nouveau Membre'}</span>
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">Ajouter un utilisateur</h3>
          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Nom Complet</label>
                <input 
                  required
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({...newUserForm, name: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Ex: Jean Dupont"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input 
                  type="email"
                  required
                  value={newUserForm.email}
                  onChange={e => setNewUserForm({...newUserForm, email: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="jean@lumina.com"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Mot de passe</label>
                <input 
                  type="text"
                  value={newUserForm.password}
                  onChange={e => setNewUserForm({...newUserForm, password: e.target.value})}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  placeholder="Mot de passe initial"
                />
              </div>
            </div>
            <div className="space-y-4">
              <ColorSelector value={newUserForm.color} onChange={color => setNewUserForm({...newUserForm, color})} />
              
              <div className="pt-4 flex justify-end">
                <button type="submit" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                  Ajouter le membre
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {users.map(user => {
          const isItemEditing = isEditing === user.id;

          if (isItemEditing) {
            return (
              <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border-2 border-blue-500 shadow-md flex flex-col gap-4">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      value={editForm.name}
                      onChange={e => setEditForm({...editForm, name: e.target.value})}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="Nom"
                    />
                    <input 
                      value={editForm.email}
                      onChange={e => setEditForm({...editForm, email: e.target.value})}
                      className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
                      placeholder="Email"
                    />
                 </div>
                 <div className="flex items-center gap-4">
                   <div className="flex-1">
                      <input 
                        type="text"
                        value={editForm.password || ''}
                        onChange={e => setEditForm({...editForm, password: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="Nouveau mot de passe"
                      />
                   </div>
                   <ColorSelector value={editForm.color || 'bg-blue-500'} onChange={color => setEditForm({...editForm, color})} />
                 </div>
                 <div className="flex justify-end gap-2">
                    <button onClick={handleSaveEdit} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"><Check size={16}/> Enregistrer</button>
                    <button onClick={handleCancelEdit} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-2"><X size={16}/> Annuler</button>
                 </div>
              </div>
            );
          }

          return (
            <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between group hover:shadow-md transition-all">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${user.color} flex items-center justify-center text-white font-bold text-lg shadow-sm`}>
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    {user.name}
                    {user.password && <Lock size={12} className="text-slate-400" />}
                  </h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => onDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
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