import React, { useState } from 'react';
import { User } from '../types';
import { LogIn, X, AlertCircle, Info } from 'lucide-react';

interface LoginModalProps {
  users: User[];
  onLogin: (user: User) => void;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ users, onLogin, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      setError('Aucun utilisateur trouvé avec cet email.');
      return;
    }

    if (user.password && user.password !== password) {
      setError('Mot de passe incorrect.');
      return;
    }

    onLogin(user);
    onClose();
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 p-8 scale-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600">
              <LogIn size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Connexion</h2>
              <p className="text-sm text-slate-500">Accédez à votre espace membre</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
              placeholder="votre@email.com"
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Mot de passe</label>
            <input 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-500/30 active:scale-95"
            >
              S'identifier
            </button>
          </div>
          
          <div className="text-center mt-6 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
             <div className="flex flex-col items-center gap-2">
                <Info size={16} className="text-blue-500" />
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Pas encore de compte ?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Veuillez contacter le <span className="font-semibold text-blue-600 dark:text-blue-400">support informatique</span> pour la création de vos accès.
                </p>
             </div>
          </div>

          <div className="text-center mt-2">
             <p className="text-[10px] text-slate-400 opacity-60">Test: alice@lumina.com / 1234</p>
          </div>
        </form>
      </div>
    </div>
  );
};