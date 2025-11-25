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
  password?: string;
  avatar?: string;
  color: string;
  // New fields for hierarchical management
  role: 'admin' | 'assistant' | 'user';
  service?: string; // e.g., "Maçonnerie", "Electricité", "Administratif"
  // Adibat fields
  employeeCode?: string;
  jobTitle?: string;
  secteur?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'active' | 'completed' | 'on-hold';
  members?: string[];
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
  startDate: string;
  endDate: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  subtasks?: Subtask[];
  dependencies?: string[];
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'assignment' | 'deadline' | 'mention' | 'leave_request' | 'leave_status' | 'timesheet_status';
  message: string;
  isRead: boolean;
  createdAt: string;
  linkProjectId?: string;
  linkTaskId?: string;
  linkLeaveId?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

// New Structure for Weekly Timesheets
export interface TimesheetEntry {
  id: string;
  businessId: string; // Numéro d'affaire
  zone: string;       // N° Zone
  site: string;       // Nom chantier
  hours: number[];    // Array of 7 numbers (Mon-Sun)
}

export interface Timesheet {
  id: string;
  userId: string;
  managerId?: string; // ID du responsable sélectionné
  weekStartDate: string; // YYYY-MM-DD (Monday)
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  entries: TimesheetEntry[];
  rejectionReason?: string;
  submittedAt?: string;
  isProcessed?: boolean; // Traité par l'assistante
  
  // Interim Fields
  type?: 'standard' | 'interim';
  interimName?: string;
  attachments?: string[]; // Base64 images
}

export interface LeaveRequest {
  id: string;
  userId: string;
  managerId?: string; // ID du responsable sélectionné
  type: 'paid' | 'rtt' | 'sick' | 'unpaid' | 'rcr';
  startDate: string;
  endDate: string;
  halfDay?: 'morning' | 'afternoon' | 'none';
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  isProcessed?: boolean; // Traité par l'assistante
}

export type ViewMode = 'dashboard' | 'projects' | 'apps' | 'settings' | 'ai-chat' | 'admin-apps' | 'admin-docs' | 'admin-users' | 'time-manager';