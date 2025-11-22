import React, { useState, useRef } from 'react';
import { Upload, Trash2, FileText, FileCode, FileJson, AlertCircle, BrainCircuit } from 'lucide-react';
import { DocumentItem } from '../types';

interface AdminDocumentsProps {
  documents: DocumentItem[];
  onAddDocument: (doc: DocumentItem) => void;
  onDeleteDocument: (id: string) => void;
}

export const AdminDocuments: React.FC<AdminDocumentsProps> = ({ documents, onAddDocument, onDeleteDocument }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = (file: File) => {
    // Max 20MB per file
    const MAX_SIZE = 20 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      setError(`Le fichier ${file.name} est trop volumineux (max 20MB).`);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const newDoc: DocumentItem = {
        id: Date.now().toString() + Math.random().toString().slice(2, 5),
        name: file.name,
        content: content,
        type: file.name.split('.').pop() || 'txt',
        uploadDate: new Date().toLocaleDateString('fr-FR')
      };
      onAddDocument(newDoc);
      setError(null);
    };
    reader.onerror = () => setError("Erreur lors de la lecture du fichier.");
    
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    
    files.forEach(file => processFile(file));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => processFile(file));
      // Reset input
      e.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'json': return <FileJson className="text-yellow-500" />;
      case 'md':
      case 'txt': return <FileText className="text-blue-500" />;
      default: return <FileCode className="text-slate-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Base de connaissances</h2>
        <p className="text-slate-500">Importez des documents pour donner du contexte à l'assistant Lumina.</p>
      </div>

      {/* Upload Zone */}
      <div 
        className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.md,.json,.csv" 
          multiple 
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">Cliquez ou glissez des fichiers ici</p>
            <p className="text-sm text-slate-500 mt-1">Supporte .txt, .md, .json, .csv (Max 20MB)</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl flex items-center gap-2 border border-red-100 dark:border-red-800/50">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {/* Documents List */}
      <div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Documents indexés ({documents.length})</h3>
        
        {documents.length === 0 ? (
          <div className="text-center p-8 text-slate-400 bg-slate-50 dark:bg-slate-900 rounded-xl">
            Aucun document dans la base de connaissances.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => {
              // Check if doc is large (> 2MB)
              const isLarge = doc.content.length > 2 * 1024 * 1024;

              return (
                <div key={doc.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-800 dark:text-white truncate">{doc.name}</h4>
                        {isLarge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 rounded-full flex items-center gap-1" title="Lecture intelligente activée pour ce gros fichier">
                            <BrainCircuit size={10} /> Smart
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">Ajouté le {doc.uploadDate} • {Math.round(doc.content.length / 1024 * 10) / 10} KB</p>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteDocument(doc.id); }}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};