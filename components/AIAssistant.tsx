import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { ChatMessage, DocumentItem } from '../types';
import { generateAIResponse } from '../services/geminiService';

interface AIAssistantProps {
  documents?: DocumentItem[];
  apiKey?: string;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ documents = [], apiKey }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Bonjour ! Je suis Lumina, votre assistante virtuelle. Comment puis-je vous aider à être plus productif aujourd\'hui ?',
      timestamp: new Date()
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare history for the API
      // Filter out the welcome message as Gemini history must NOT start with a model message
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // Pass the optional apiKey (from settings) to the service
      const responseText = await generateAIResponse(userMsg.text, history, documents, apiKey);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Je rencontre des difficultés techniques pour le moment. Veuillez réessayer plus tard.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg shadow-md">
          <Bot className="text-white w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-slate-800 dark:text-white">Assistant Lumina</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Propulsé par Gemini 
            {documents.length > 0 && <span className="ml-1 text-blue-500">• {documents.length} docs indexés</span>}
            {apiKey && <span className="ml-1 text-green-500">• Clé perso active</span>}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[80%] md:max-w-[70%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' 
                  : 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300'
              }`}>
                {msg.role === 'user' ? <UserIcon size={16} /> : <Sparkles size={16} />}
              </div>
              <div
                className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start w-full">
             <div className="flex max-w-[80%] gap-3">
               <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center">
                  <Sparkles size={16} />
               </div>
               <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-tl-none flex items-center">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                  <span className="ml-2 text-sm text-slate-400">Lumina réfléchit...</span>
               </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={documents.length > 0 ? "Posez une question sur vos documents..." : "Posez une question..."}
            className="w-full pl-4 pr-12 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl border-transparent focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder-slate-400"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="mt-2 text-center">
          <p className="text-[10px] text-slate-400">L'IA peut faire des erreurs. Vérifiez les informations importantes.</p>
        </div>
      </div>
    </div>
  );
};