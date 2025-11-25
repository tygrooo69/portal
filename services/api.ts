import { AppItem, DocumentItem, Project, Task, User, Comment, Notification, Timesheet, LeaveRequest } from '../types';

interface StorageData {
  apps: AppItem[];
  documents: DocumentItem[];
  projects?: Project[];
  tasks?: Task[];
  users?: User[];
  comments?: Comment[];
  notifications?: Notification[];
  timesheets?: Timesheet[];
  leaveRequests?: LeaveRequest[];
  apiKey?: string;
  adminPassword?: string;
  logo?: string;
}

export const api = {
  async loadData(): Promise<StorageData | null> {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        console.warn('API not accessible, falling back to localStorage logic in App');
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to load data from server:", error);
      return null;
    }
  },

  async saveData(
    apps: AppItem[], 
    documents: DocumentItem[], 
    projects: Project[], 
    tasks: Task[], 
    users: User[],
    comments: Comment[],
    notifications: Notification[],
    timesheets: Timesheet[],
    leaveRequests: LeaveRequest[],
    apiKey?: string, 
    adminPassword?: string,
    logo?: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          apps, 
          documents, 
          projects, 
          tasks, 
          users, 
          comments, 
          notifications, 
          timesheets,
          leaveRequests,
          apiKey, 
          adminPassword, 
          logo 
        }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to save data to server:", error);
      return false;
    }
  }
};
