import React, { useState } from 'react';
import { Plus, Trash2, X, Edit2, Check, ChevronLeft, Lock, Shield, Briefcase, Copy, User as UserIcon, Search } from 'lucide-react';
import { User } from '../types';
import { ConfirmModal } from './ConfirmModal';

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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const emptyForm: User = {
    id: '',
    name: '',
    email: '',
    password: '',
    color: 'bg-blue-500',
    avatar: '',
    role: 'user',
    service: '',
    employeeCode: '',
    jobTitle: '',
    secteur: ''
  };

  const [newUserForm, setNewUserForm] = useState<User>({ ...emptyForm });

  // Filter Logic
  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query) ||
      (user.service && user.service.toLowerCase().includes(query)) ||
      (user.employeeCode && user.employeeCode.toLowerCase().includes(query))
    );
  });

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

  const handleDuplicateClick = (user: User) => {
    // Pre-fill form with shared team attributes (Role, Service, Color, Job Title, Secteur)
    // But clear unique fields (Name, Email, Password, Employee Code)
    setNewUserForm({
      ...emptyForm,
      role: user.role,
      service: user.service,
      color: user.color,
      jobTitle: user.jobTitle,
      secteur: user.secteur,
      employeeCode: ''
    });
    setIsAdding(true);
    
    // Scroll to top to show form
    const mainContainer = document.querySelector('main');
    if (mainContainer) mainContainer.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUserForm.name && newUserForm.email) {
      onAddUser({ ...newUserForm, id: Date.now().toString() });
      setNewUserForm({ ...emptyForm });
      setIsAdding(false);
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteUser(deleteId);
      setDeleteId(null);
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

  const getInitials = (name: string) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="p-6 md:p-8 overflow-y-auto h-full relative">
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
            <p className="text-slate-500">Gérez les membres, leurs rôles et leurs services.</p>
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
                  autoFocus
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
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Rôle</label>
                    <select
                      value={newUserForm.role}
                      onChange={e => setNewUserForm({...newUserForm, role: e.target.value as any})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                    >
                      <option value="user">Utilisateur</option>
                      <option value="assistant">Assistante</option>
                      <option value="admin">Responsable</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Service</label>
                    <input 
                      type="text"
                      value={newUserForm.service || ''}
                      onChange={e => setNewUserForm({...newUserForm, service: e.target.value})}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                      placeholder="Ex: GT, MT, .."
                    />
                 </div>
               </div>

               {/* Adibat Section */}
               <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative mt-2">
                  <span className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[10px] font-semibold text-slate-500">Adibat</span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Code Salarié</label>
                        <input 
                          type="text"
                          value={newUserForm.employeeCode || ''}
                          onChange={e => setNewUserForm({...newUserForm, employeeCode: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                          placeholder="Ex: 00123"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Poste</label>
                        <input 
                          type="text"
                          value={newUserForm.jobTitle || ''}
                          onChange={e => setNewUserForm({...newUserForm, jobTitle: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                          placeholder="Ex: MOP1, MOA1, .."
                        />
                    </div>
                  </div>
                  
                  {newUserForm.role === 'admin' && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                       <label className="block text-xs font-medium text-slate-500 mb-1">Secteur (Responsable)</label>
                       <input 
                          type="text"
                          value={newUserForm.secteur || ''}
                          onChange={e => setNewUserForm({...newUserForm, secteur: e.target.value})}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                          placeholder="Ex: R5, 31, .."
                        />
                    </div>
                  )}
               </div>

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

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input
          type="text"
          placeholder="Rechercher par nom, email, service ou code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white shadow-sm transition-all"
        />
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredUsers.map(user => {
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
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                      <input 
                        type="text"
                        value={editForm.password || ''}
                        onChange={e => setEditForm({...editForm, password: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="Nouveau mot de passe"
                      />
                   </div>
                   <div>
                      <select
                        value={editForm.role}
                        onChange={e => setEditForm({...editForm, role: e.target.value as any})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm dark:text-white"
                      >
                        <option value="user">Utilisateur</option>
                        <option value="assistant">Assistante</option>
                        <option value="admin">Responsable</option>
                      </select>
                   </div>
                   <div>
                      <input 
                        type="text"
                        value={editForm.service || ''}
                        onChange={e => setEditForm({...editForm, service: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                        placeholder="Ex: GT, MT, .."
                      />
                   </div>
                 </div>

                 {/* Adibat Section (Edit Mode) */}
                 <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-3 relative">
                    <span className="absolute -top-2.5 left-3 bg-white dark:bg-slate-900 px-1 text-[10px] font-semibold text-slate-500">Adibat</span>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Code Salarié</label>
                          <input 
                            type="text"
                            value={editForm.employeeCode || ''}
                            onChange={e => setEditForm({...editForm, employeeCode: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                            placeholder="Code"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">Poste</label>
                          <input 
                            type="text"
                            value={editForm.jobTitle || ''}
                            onChange={e => setEditForm({...editForm, jobTitle: e.target.value})}
                            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                            placeholder="Ex: MOP1, MOA1, .."
                          />
                      </div>
                    </div>
                    {editForm.role === 'admin' && (
                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                           <label className="block text-xs font-medium text-slate-500 mb-1">Secteur (Responsable)</label>
                           <input 
                              type="text"
                              value={editForm.secteur || ''}
                              onChange={e => setEditForm({...editForm, secteur: e.target.value})}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                              placeholder="Ex: R5, 31, .."
                            />
                        </div>
                    )}
                 </div>

                 <ColorSelector value={editForm.color || 'bg-blue-500'} onChange={color => setEditForm({...editForm, color})} />
                 <div className="flex justify-end gap-2">
                    <button onClick={handleSaveEdit} className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center gap-2"><Check size={16}/> Enregistrer</button>
                    <button onClick={handleCancelEdit} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-2"><X size={16}/> Annuler</button>
                 </div>
              </div>
            );
          }

          return (
            <div key={user.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between group hover:shadow-md transition-all gap-4">
              <div className="flex items-center gap-4 min-w-0 flex-1">
                <div className={`w-12 h-12 rounded-full ${user.color} flex items-center justify-center text-white font-bold text-lg shadow-sm relative flex-shrink-0`}>
                  {getInitials(user.name)}
                  {user.role === 'admin' && <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1"><Shield size={10} /></div>}
                  {user.role === 'assistant' && <div className="absolute -top-1 -right-1 bg-blue-500 text-white rounded-full p-1"><Briefcase size={10} /></div>}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                    {user.name}
                    {user.password && <Lock size={12} className="text-slate-400" />}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span className="truncate">{user.email}</span>
                    {user.service && (
                      <>
                        <span>•</span>
                        <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs">{user.service}</span>
                      </>
                    )}
                  </div>
                  {/* Display Adibat Information */}
                  {(user.employeeCode || user.jobTitle || user.secteur) && (
                    <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {user.employeeCode && (
                            <span className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 flex items-center gap-1">
                                <span className="font-medium">Code:</span> {user.employeeCode}
                            </span>
                        )}
                        {user.jobTitle && (
                            <span className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 flex items-center gap-1">
                                <span className="font-medium">Poste:</span> {user.jobTitle}
                            </span>
                        )}
                        {user.role === 'admin' && user.secteur && (
                            <span className="bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 px-2 py-1 rounded border border-red-100 dark:border-red-800 flex items-center gap-1">
                                <span className="font-medium">Secteur:</span> {user.secteur}
                            </span>
                        )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity self-end md:self-center">
                <button 
                  onClick={() => handleDuplicateClick(user)} 
                  className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Dupliquer (créer un membre similaire)"
                >
                  <Copy size={18} />
                </button>
                <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDeleteClick(user.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {filteredUsers.length === 0 && (
          <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            Aucun utilisateur trouvé.
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Supprimer l'utilisateur ?"
        message="Voulez-vous vraiment supprimer ce compte ? Cette action est irréversible."
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};