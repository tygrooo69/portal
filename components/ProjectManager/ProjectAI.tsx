import React, { useState, useRef } from 'react';
import { FileText, Upload, Trash2, FileCode, FileJson, BrainCircuit, Loader2, AlertCircle, FileType } from 'lucide-react';
import { AIAssistant } from '../AIAssistant';
import { Project, DocumentItem } from '../../types';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

// Set up PDF.js worker using unpkg
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface ProjectAIProps {
  project: Project;
  documents: DocumentItem[];
  onAddDocuments: (docs: DocumentItem[]) => void;
  onDeleteDocument: (id: string) => void;
  apiKey?: string; // Added apiKey prop
}

export const ProjectAI: React.FC<ProjectAIProps> = ({ project, documents, onAddDocuments, onDeleteDocument, apiKey }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectDocs = documents.filter(d => d.projectId === project.id);

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

  const convertFileToDoc = async (file: File): Promise<DocumentItem | null> => {
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
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      if (!content || !content.trim()) {
        throw new Error("Contenu vide ou illisible.");
      }

      return {
        id: Date.now().toString() + Math.random().toString().slice(2, 8),
        projectId: project.id,
        name: file.name,
        content: content,
        type: fileExt,
        uploadDate: new Date().toLocaleDateString('fr-FR')
      };
    } catch (err) {
      setErrors(prev => [...prev, `Erreur ${file.name}: ${(err as Error).message}`]);
      return null;
    }
  };

  const processBatch = async (files: File[]) => {
    setIsProcessing(true);
    setErrors([]);
    const validDocs: DocumentItem[] = [];
    for (const file of files) {
      const doc = await convertFileToDoc(file);
      if (doc) validDocs.push(doc);
    }
    if (validDocs.length > 0) {
      onAddDocuments(validDocs);
    }
    setIsProcessing(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    if (files.length > 0) processBatch(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      processBatch(files);
      e.target.value = '';
    }
  };

  const getFileIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'json': return <FileJson size={18} className="text-yellow-500" />;
      case 'md': case 'txt': return <FileText size={18} className="text-blue-500" />;
      case 'pdf': return <FileType size={18} className="text-red-500" />;
      case 'docx': return <FileText size={18} className="text-blue-700" />;
      default: return <FileCode size={18} className="text-slate-500" />;
    }
  };

  return (
    <div className="flex h-full gap-4 p-6 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Left Panel: Documents Context */}
      <div className="w-80 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BrainCircuit size={18} className="text-indigo-600" />
            Contexte du Projet
          </h3>
          <p className="text-xs text-slate-500 mt-1">Fichiers techniques analysés par l'IA.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Upload Zone */}
          <div 
            className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors cursor-pointer relative
              ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isProcessing && fileInputRef.current?.click()}
          >
            {isProcessing && (
              <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 flex items-center justify-center z-10">
                <Loader2 size={24} className="animate-spin text-blue-600" />
              </div>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.md,.json,.csv,.pdf,.docx" multiple onChange={handleFileInput} />
            <div className="flex flex-col items-center gap-2">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600">
                <Upload size={18} />
              </div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">Ajouter un fichier</p>
              <p className="text-[10px] text-slate-400">Glisser-déposer ou cliquer</p>
            </div>
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800 text-xs text-red-600">
              <div className="flex items-center gap-1 font-bold mb-1"><AlertCircle size={12}/> Erreurs</div>
              <ul className="list-disc list-inside">{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </div>
          )}

          {/* Document List */}
          <div className="space-y-2">
            {projectDocs.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4 italic">Aucun document lié.</p>
            ) : (
              projectDocs.map(doc => (
                <div key={doc.id} className="group flex items-center justify-between p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {getFileIcon(doc.type)}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[140px]" title={doc.name}>{doc.name}</p>
                      <p className="text-[10px] text-slate-400">{doc.uploadDate}</p>
                    </div>
                  </div>
                  <button onClick={() => onDeleteDocument(doc.id)} className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Right Panel: AI Chat */}
      <div className="flex-1 h-full flex flex-col min-w-0">
         <div className="h-full bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <AIAssistant documents={projectDocs} apiKey={apiKey} />
         </div>
      </div>
    </div>
  );
};