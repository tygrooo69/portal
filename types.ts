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
  id: string;
  name: string;
  email: string;
  password?: string; // New password field
  avatar?: string; // URL or initials
  color: string; // Tailwind color class for fallback
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
  members?: string[]; // Array of User IDs
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
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
  assignee?: string; // User ID
  subtasks?: Subtask[]; // Checklist
  dependencies?: string[]; // Array of Task IDs that must finish before this task starts
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string; // ISO String
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'deadline' | 'mention';
  message: string;
  isRead: boolean;
  createdAt: string;
  linkProjectId?: string;
  linkTaskId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export type ViewMode = 'dashboard' | 'projects' | 'apps' | 'settings' | 'ai-chat' | 'admin-apps' | 'admin-docs' | 'admin-users';