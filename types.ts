import { LucideIcon } from 'lucide-react';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: string; // Changed to string for storage/serialization
  color: string;
  category: 'productivity' | 'utilities' | 'creative' | 'analytics';
  url?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  content: string;
  type: string;
  uploadDate: string;
}

export interface User {
  name: string;
  email: string;
  avatarUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export type ViewMode = 'dashboard' | 'apps' | 'settings' | 'ai-chat' | 'admin-apps' | 'admin-docs';