import React, { useState, useRef } from 'react';
import { Upload, Trash2, FileText, FileCode, FileJson, AlertCircle, BrainCircuit, FileType, ChevronLeft, Loader2 } from 'lucide-react';
import { DocumentItem } from '../types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';
import { ConfirmModal } from './ConfirmModal';

// Set up PDF.js worker using unpkg to ensure matching version and module support
// We use .mjs for the worker as modern pdfjs-dist builds (v3+) use ES modules
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface AdminDocumentsProps {
  documents: DocumentItem[];
  onAddDocuments: (docs: DocumentItem[]) => void; // Changed to accept an array
  onDeleteDocument: (id: string) => void;
  onBack?: () => void;
}

export const AdminDocuments: React.FC<AdminDocumentsProps> = ({ documents, onAddDocuments, onDeleteDocument, onBack }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  
  // Delete Confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const extractPdfText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += `--- Page ${i} ---\n${pageText}\n\n`;
    }
    return fullText;
  };

  const extractDocxText = async (arrayBuffer: ArrayBuffer): Promise<string> => {
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  };

  // Converts a single file to a DocumentItem (or null if failed)
  const convertFileToDoc = async (file: File): Promise<DocumentItem | null> => {
    // Max 20MB per file
    const MAX_SIZE = 20 * 1024 * 1024;
    
    if (file.size > MAX_SIZE) {
      setErrors(prev => [...prev, `Le fichier ${file.name} est trop volumineux (max 20MB).`]);
      return null;
    }

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'txt';
      let content = '';

      if (fileExt === 'pdf') {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractPdfText(arrayBuffer);
      } else if (fileExt === 'docx') {
        const arrayBuffer = await file.arrayBuffer();
        content = await extractDocxText(arrayBuffer);
      } else {
        // Text based files (txt, md, json, csv)
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      if (!content || !content.trim()) {
        throw new Error("Impossible d'extraire du texte de ce fichier ou le fichier est vide.");
      }

      return {
        id: Date.now().toString() + Math.random().toString().slice(2, 8), // More random ID for batch
        name: file.name,
        content: content,
        type: fileExt,
        uploadDate: new Date().toLocaleDateString('fr-FR')
      };
      
    } catch (err) {
      console.error(err);
      setErrors(prev => [...prev, `Erreur sur ${file.name} : ${(err as Error).message}`]);
      return null;
    }
  };

  const processBatch = async (files: File[]) => {
    setIsProcessing(true);
    setErrors([]);
    setTotalFiles(files.length);
    setProcessedCount(0);

    const validDocs: DocumentItem[] = [];

    // Process sequentially to avoid browser freezing on many files, 
    // but fast enough to feel concurrent.
    for (const file of files) {
      const doc = await convertFileToDoc(file);
      if (doc) {
        validDocs.push(doc);
      }
      setProcessedCount(prev => prev + 1);
    }

    if (validDocs.length > 0) {
      onAddDocuments(validDocs);
    }

    setIsProcessing(false);
    setTotalFiles(0);
    setProcessedCount(0);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) {
      processBatch(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      processBatch(files);
      e.target.value = ''; // Reset input
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      onDeleteDocument(deleteId);
      setDeleteId(null);
    }
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'json': return <FileJson className="text-yellow-500" />;
      case 'md':
      case 'txt': return <FileText className="text-blue-500" />;
      case 'pdf': return <FileType className="text-red-500" />;
      case 'docx': return <FileText className="text-blue-700" />;
      default: return <FileCode className="text-slate-500" />;
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto relative">
      <div className="mb-8 flex items-center gap-4">
         {onBack && (
            <button 
              onClick={onBack}
              className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
          )}
         <div>
           <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Base de connaissances</h2>
           <p className="text-slate-500">Importez des documents pour donner du contexte à l'assistant SpotLink.</p>
         </div>
      </div>

      {/* Upload Zone */}
      <div 
        className={`mb-8 border-2 border-dashed rounded-2xl p-10 text-center transition-colors cursor-pointer relative overflow-hidden
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
            : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
          }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
      >
        {isProcessing && (
          <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center z-10 transition-opacity">
            <div className="flex flex-col items-center text-blue-600">
              <Loader2 size={48} className="animate-spin mb-3" />
              <p className="font-semibold text-lg">Traitement en cours...</p>
              <p className="text-sm text-slate-500">{processedCount} / {totalFiles} fichiers</p>
            </div>
          </div>
        )}
        
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".txt,.md,.json,.csv,.pdf,.docx" 
          multiple 
          onChange={handleFileInput}
        />
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Upload size={32} />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-800 dark:text-white">Cliquez ou glissez vos fichiers ici</p>
            <p className="text-sm text-slate-500 mt-1">Sélection multiple supportée (Max 20MB par fichier)</p>
          </div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-800/50">
          <div className="flex items-center gap-2 mb-2 font-medium">
             <AlertCircle size={20} />
             <span>Certains fichiers n'ont pas pu être importés :</span>
          </div>
          <ul className="list-disc list-inside text-sm opacity-80">
            {errors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
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
                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(doc.id); }}
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

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Supprimer le document ?"
        message="Voulez-vous vraiment supprimer ce document ? L'assistant IA ne pourra plus l'utiliser."
        onConfirm={confirmDelete}
        onClose={() => setDeleteId(null)}
      />
    </div>
  );
};