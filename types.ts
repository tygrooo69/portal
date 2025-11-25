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

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'on-hold';
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  priority: 'low' | 'medium' | 'high';
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

export type ViewMode = 'dashboard' | 'projects' | 'apps' | 'settings' | 'ai-chat' | 'admin-apps' | 'admin-docs';