import { LucideIcon } from 'lucide-react';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: 'productivity' | 'utilities' | 'creative' | 'analytics';
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

export type ViewMode = 'dashboard' | 'apps' | 'settings' | 'ai-chat';
