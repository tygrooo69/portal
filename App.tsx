import React, { useState, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AIAssistant } from './components/AIAssistant';
import { AdminApps } from './components/AdminApps';
import { AdminDocuments } from './components/AdminDocuments';
import { AdminUsers } from './components/AdminUsers';
import { Settings } from './components/Settings';
import { LoginModal } from './components/LoginModal';
import { ProfileModal } from './components/ProfileModal';
import { ProjectManager } from './components/ProjectManager/index';
import { ViewMode, AppItem, DocumentItem, Project, Task, User, Comment, Notification } from './types';
import { Moon, Sun } from 'lucide-react';
import { api } from './services/api';

const DEFAULT_APPS: AppItem[] = [
  { id: '1', name: 'Drive Cloud', description: 'Stockage sécurisé', icon: 'Cloud', color: 'bg-blue-500', category: 'utilities', url: 'https://drive.google.com' },
  { id: '2', name: 'Notes Pro', description: 'Prise de notes', icon: 'FileText', color: 'bg-yellow-500', category: 'productivity' },
  { id: '3', name: 'Pixel Studio', description: 'Édition d\'images', icon: 'Image', color: 'bg-purple-500', category: 'creative' },
  { id: '4', name: 'Data View', description: 'Analytique', icon: 'PieChart', color: 'bg-green-500', category: 'analytics' },
  { id: '5', name: 'Security', description: 'Centre de sécurité', icon: 'Shield', color: 'bg-red-500', category: 'utilities' },
  { id: '6', name: 'Calendar', description: 'Gestion du temps', icon: 'Calendar', color: 'bg-indigo-500', category: 'productivity' },
];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  
  // New State for Projects & Users & Features
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  
  // Initialize with empty string, will be populated by server or localStorage
  const [apiKey, setApiKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin');

  // Initialize Data
  useEffect(() => {
    const initialize = async () => {
      // 1. Try loading from Server (Disk)
      const serverData = await api.loadData();
      
      if (serverData) {
        setApps(serverData.apps.length > 0 ? serverData.apps : DEFAULT_APPS);
        setDocuments(serverData.documents || []);
        
        // Load Projects & Tasks & Users
        if (serverData.projects) setProjects(serverData.projects);
        if (serverData.tasks) setTasks(serverData.tasks);
        if (serverData.users) setUsers(serverData.users);
        if (serverData.comments) setComments(serverData.comments);
        if (serverData.notifications) setNotifications(serverData.notifications);

        if (serverData.apiKey) setApiKey(serverData.apiKey);
        if (serverData.adminPassword) setAdminPassword(serverData.adminPassword);
      } else {
        // 2. Fallback to LocalStorage (Client)
        const savedApps = localStorage.getItem('lumina_apps');
        if (savedApps) {
          try { setApps(JSON.parse(savedApps)); } catch (e) { setApps(DEFAULT_APPS); }
        } else {
          setApps(DEFAULT_APPS);
        }

        const savedDocs = localStorage.getItem('lumina_documents');
        if (savedDocs) {
          try { setDocuments(JSON.parse(savedDocs)); } catch (e) { console.error(e); }
        }

        const savedProjects = localStorage.getItem('lumina_projects');
        if (savedProjects) {
          try { setProjects(JSON.parse(savedProjects)); } catch (e) { console.error(e); }
        }

        const savedTasks = localStorage.getItem('lumina_tasks');
        if (savedTasks) {
          try { setTasks(JSON.parse(savedTasks)); } catch (e) { console.error(e); }
        }

        const savedUsers = localStorage.getItem('lumina_users');
        if (savedUsers) {
          try { setUsers(JSON.parse(savedUsers)); } catch (e) { console.error(e); }
        }
        
        const savedKey = localStorage.getItem('lumina_api_key');
        if (savedKey) setApiKey(savedKey);
      }
      
      // Load current user from session if available
      const savedUserSession = sessionStorage.getItem('lumina_current_user');
      if (savedUserSession) {
        try { setCurrentUser(JSON.parse(savedUserSession)); } catch (e) {}
      }

      // Check theme
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setIsDarkMode(true);
      }
      
      setIsLoaded(true);
    };

    initialize();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // --- ACCESS CONTROL LOGIC ---
  
  // Filter projects: User sees only projects where they are a member
  // If no user is logged in, they see nothing (Strict privacy)
  const authorizedProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(p => p.members && p.members.includes(currentUser.id));
  }, [projects, currentUser]);

  // Filter tasks: User sees tasks only for authorized projects
  const authorizedTasks = useMemo(() => {
    if (!currentUser) return [];
    const authorizedProjectIds = authorizedProjects.map(p => p.id);
    return tasks.filter(t => authorizedProjectIds.includes(t.projectId));
  }, [tasks, authorizedProjects, currentUser]);

  // Filter notifications: User sees only their own notifications
  const userNotifications = useMemo(() => {
    if (!currentUser) return [];
    return notifications.filter(n => n.userId === currentUser.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications, currentUser]);


  // Unified Save Function
  const persistData = async (
    newApps: AppItem[], 
    newDocs: DocumentItem[], 
    newProjects: Project[],
    newTasks: Task[],
    newUsers: User[],
    newComments: Comment[],
    newNotifications: Notification[],
    newKey?: string, 
    newPwd?: string
  ) => {
    const keyToSave = newKey !== undefined ? newKey : apiKey;
    const pwdToSave = newPwd !== undefined ? newPwd : adminPassword;

    // Update UI immediately
    setApps(newApps);
    setDocuments(newDocs);
    setProjects(newProjects);
    setTasks(newTasks);
    setUsers(newUsers);
    setComments(newComments);
    setNotifications(newNotifications);

    if (newKey !== undefined) setApiKey(newKey);
    if (newPwd !== undefined) setAdminPassword(newPwd);

    // Try Save to Server
    const serverSaved = await api.saveData(
      newApps || [], 
      newDocs || [], 
      newProjects || [], 
      newTasks || [], 
      newUsers || [],
      newComments || [],
      newNotifications || [],
      keyToSave, 
      pwdToSave
    );
    
    if (!serverSaved) {
      // Fallback: Save to LocalStorage
      try {
        localStorage.setItem('lumina_apps', JSON.stringify(newApps));
        localStorage.setItem('lumina_documents', JSON.stringify(newDocs));
        localStorage.setItem('lumina_projects', JSON.stringify(newProjects));
        localStorage.setItem('lumina_tasks', JSON.stringify(newTasks));
        localStorage.setItem('lumina_users', JSON.stringify(newUsers));
        if (newKey !== undefined) localStorage.setItem('lumina_api_key', newKey);
      } catch (e) {
        console.warn("LocalStorage quota exceeded or error", e);
      }
    }
  };

  const handleSaveApiKey = (key: string) => {
    persistData(apps, documents, projects, tasks, users, comments, notifications, key, undefined);
  };

  const handleSaveAdminPassword = (password: string) => {
    persistData(apps, documents, projects, tasks, users, comments, notifications, undefined, password);
  };

  const handleAddApp = (app: AppItem) => {
    persistData([...apps, app], documents, projects, tasks, users, comments, notifications);
  };

  const handleUpdateApp = (updatedApp: AppItem) => {
    persistData(apps.map(a => a.id === updatedApp.id ? updatedApp : a), documents, projects, tasks, users, comments, notifications);
  };

  const handleDeleteApp = (id: string) => {
    persistData(apps.filter(a => a.id !== id), documents, projects, tasks, users, comments, notifications);
  };

  const handleAddDocuments = (newDocs: DocumentItem[]) => {
    persistData(apps, [...documents, ...newDocs], projects, tasks, users, comments, notifications);
  };

  const handleDeleteDocument = (id: string) => {
    persistData(apps, documents.filter(d => d.id !== id), projects, tasks, users, comments, notifications);
  };

  // --- Project Handlers ---
  const handleAddProject = (project: Project) => {
    // Current user is already added in ProjectManager/index.tsx
    persistData(apps, documents, [...projects, project], tasks, users, comments, notifications);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    // SECURITY CHECK: Can only update if member
    if (currentUser) {
       const existing = projects.find(p => p.id === updatedProject.id);
       if (existing && existing.members && !existing.members.includes(currentUser.id)) {
         alert("Vous n'êtes pas autorisé à modifier ce projet.");
         return;
       }
    } else {
       return; 
    }

    persistData(apps, documents, projects.map(p => p.id === updatedProject.id ? updatedProject : p), tasks, users, comments, notifications);
  };

  const handleDeleteProject = (id: string) => {
    // SECURITY CHECK
    const project = projects.find(p => p.id === id);
    if (currentUser && project && project.members && !project.members.includes(currentUser.id)) {
      alert("Vous n'êtes pas autorisé à supprimer ce projet.");
      return;
    }

    // Confirmation is now handled in ProjectManager component via Modal

    persistData(
      apps, 
      documents, 
      projects.filter(p => p.id !== id), 
      tasks.filter(t => t.projectId !== id),
      users,
      comments.filter(c => tasks.find(t => t.id === c.taskId && t.projectId === id)), // Clean comments
      notifications
    );
  };

  // --- Task Handlers & Notifications Logic ---

  const handleAddTask = (task: Task) => {
    let newNotifications = [...notifications];
    
    // Notify Assignee if it's not the current user
    if (task.assignee && task.assignee !== currentUser?.id) {
       const notif: Notification = {
          id: Date.now().toString() + 'n',
          userId: task.assignee,
          type: 'assignment',
          message: `Nouvelle tâche assignée : "${task.title}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
          linkProjectId: task.projectId,
          linkTaskId: task.id
       };
       newNotifications.push(notif);
    }

    persistData(apps, documents, projects, [...tasks, task], users, comments, newNotifications);
  };

  // Single Task Update
  const handleUpdateTask = (updatedTask: Task) => {
    const parentProject = projects.find(p => p.id === updatedTask.projectId);
    if (currentUser && parentProject && parentProject.members && !parentProject.members.includes(currentUser.id)) {
       alert("Vous n'avez pas les droits sur le projet parent pour modifier cette tâche.");
       return;
    }

    let newNotifications = [...notifications];
    const oldTask = tasks.find(t => t.id === updatedTask.id);

    // Notify if assignee CHANGED and is not me
    if (oldTask && updatedTask.assignee && updatedTask.assignee !== oldTask.assignee && updatedTask.assignee !== currentUser?.id) {
       const notif: Notification = {
          id: Date.now().toString() + 'n',
          userId: updatedTask.assignee,
          type: 'assignment',
          message: `Tâche assignée : "${updatedTask.title}"`,
          isRead: false,
          createdAt: new Date().toISOString(),
          linkProjectId: updatedTask.projectId,
          linkTaskId: updatedTask.id
       };
       newNotifications.push(notif);
    }

    persistData(apps, documents, projects, tasks.map(t => t.id === updatedTask.id ? updatedTask : t), users, comments, newNotifications);
  };

  // Multiple Task Update (Bulk)
  const handleUpdateTasks = (updatedTasks: Task[]) => {
    // Just verify permission for the first one as a basic check
    if (updatedTasks.length > 0) {
      const parentProject = projects.find(p => p.id === updatedTasks[0].projectId);
      if (currentUser && parentProject && parentProject.members && !parentProject.members.includes(currentUser.id)) {
        alert("Vous n'avez pas les droits sur le projet pour modifier ces tâches.");
        return;
      }
    }

    const newTasksList = tasks.map(t => {
      const updated = updatedTasks.find(u => u.id === t.id);
      return updated ? updated : t;
    });

    persistData(apps, documents, projects, newTasksList, users, comments, notifications);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const parentProject = projects.find(p => p.id === task.projectId);
    if (currentUser && parentProject && parentProject.members && !parentProject.members.includes(currentUser.id)) {
       alert("Vous n'avez pas les droits pour supprimer cette tâche.");
       return;
    }

    // Confirmation is now handled in ProjectManager component via Modal

    persistData(apps, documents, projects, tasks.filter(t => t.id !== id), users, comments.filter(c => c.taskId !== id), notifications);
  };

  // --- Comment Handlers ---
  const handleAddComment = (comment: Comment) => {
    persistData(apps, documents, projects, tasks, users, [...comments, comment], notifications);
  };

  // --- Notification Handlers ---
  const handleMarkNotificationRead = (notifId: string) => {
    const newNotifs = notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    persistData(apps, documents, projects, tasks, users, comments, newNotifs);
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    const newNotifs = notifications.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n);
    persistData(apps, documents, projects, tasks, users, comments, newNotifs);
  };

  // --- User Handlers ---
  const handleAddUser = (user: User) => {
    persistData(apps, documents, projects, tasks, [...users, user], comments, notifications);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    persistData(apps, documents, projects, tasks, newUsers, comments, notifications);
    
    if (currentUser && currentUser.id === updatedUser.id) {
       setCurrentUser(updatedUser);
       sessionStorage.setItem('lumina_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (id: string) => {
    persistData(apps, documents, projects, tasks, users.filter(u => u.id !== id), comments, notifications);
    if (currentUser && currentUser.id === id) {
      handleLogout();
    }
  };

  // --- Login / Logout ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('lumina_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('lumina_current_user');
    setView('dashboard'); // Redirect to dashboard on logout
  };

  const handleProjectClickFromDashboard = (projectId: string) => {
    setTargetProjectId(projectId);
    setTargetTaskId(null); // Reset task selection
    setView('projects');
  };

  const handleTaskClickFromDashboard = (taskId: string, projectId: string) => {
    setTargetProjectId(projectId);
    setTargetTaskId(taskId); // Set task selection
    setView('projects');
  };

  const handleNavigateToProjects = () => {
    setTargetProjectId(null);
    setTargetTaskId(null);
    setView('projects');
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const renderContent = () => {
    if (!isLoaded) return <div className="flex h-full items-center justify-center text-slate-400">Chargement...</div>;

    switch (view) {
      case 'dashboard':
        return (
          <Dashboard 
            apps={apps} 
            documents={documents} 
            projects={authorizedProjects} 
            tasks={authorizedTasks}
            currentUser={currentUser}
            notifications={userNotifications}
            onProjectClick={handleProjectClickFromDashboard} 
            onTaskClick={handleTaskClickFromDashboard}
            onNavigateToProjects={handleNavigateToProjects}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          />
        );
      case 'projects':
        return (
          <ProjectManager 
             projects={authorizedProjects}
             tasks={authorizedTasks}
             users={users}
             comments={comments}
             currentUser={currentUser}
             initialActiveProjectId={targetProjectId}
             initialEditingTaskId={targetTaskId}
             onAddProject={handleAddProject}
             onUpdateProject={handleUpdateProject}
             onDeleteProject={handleDeleteProject}
             onAddTask={handleAddTask}
             onUpdateTask={handleUpdateTask}
             onUpdateTasks={handleUpdateTasks} // Pass the bulk update handler
             onDeleteTask={handleDeleteTask}
             onAddComment={handleAddComment}
          />
        );
      case 'ai-chat':
        return (
          <div className="p-6 md:p-8 h-full max-w-5xl mx-auto">
            <AIAssistant documents={documents} apiKey={apiKey} />
          </div>
        );
      case 'admin-apps':
        return (
          <AdminApps 
            apps={apps} 
            onAddApp={handleAddApp} 
            onUpdateApp={handleUpdateApp} 
            onDeleteApp={handleDeleteApp}
            onBack={() => setView('settings')}
          />
        );
      case 'admin-docs':
        return (
          <AdminDocuments 
            documents={documents}
            onAddDocuments={handleAddDocuments}
            onDeleteDocument={handleDeleteDocument}
            onBack={() => setView('settings')}
          />
        );
      case 'admin-users':
        return (
          <AdminUsers 
             users={users}
             onAddUser={handleAddUser}
             onUpdateUser={handleUpdateUser}
             onDeleteUser={handleDeleteUser}
             onBack={() => setView('settings')}
          />
        );
      case 'settings':
        return (
          <Settings 
            currentPassword={adminPassword}
            onNavigate={setView}
            onSavePassword={handleSaveAdminPassword}
            apiKey={apiKey}
            onSaveApiKey={handleSaveApiKey}
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
          />
        );
      default:
        return (
           <Dashboard 
             apps={apps} 
             documents={documents} 
             projects={authorizedProjects} 
             currentUser={currentUser} 
           />
        );
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans transition-colors duration-300">
      <Sidebar 
        currentView={view} 
        onNavigate={(v) => { setView(v); setTargetProjectId(null); setTargetTaskId(null); }} 
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        currentUser={currentUser}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onLogoutClick={handleLogout}
        onProfileClick={() => setIsProfileModalOpen(true)}
      />
      
      {isLoginModalOpen && (
        <LoginModal 
           users={users}
           onLogin={handleLogin}
           onClose={() => setIsLoginModalOpen(false)}
        />
      )}

      {isProfileModalOpen && currentUser && (
        <ProfileModal
          currentUser={currentUser}
          onSave={handleUpdateUser}
          onClose={() => setIsProfileModalOpen(false)}
        />
      )}

      <main className="flex-1 h-full overflow-hidden flex flex-col relative">
        {/* Theme Toggle - Visible on most screens except admin/settings */}
        {view !== 'settings' && view !== 'admin-apps' && view !== 'admin-docs' && view !== 'admin-users' && (
          <div className="absolute top-6 right-6 z-40 hidden md:block">
            <button 
              onClick={toggleTheme}
              className="p-2.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md shadow-sm border border-slate-200 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition-all"
              title="Changer le thème"
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
            </button>
          </div>
        )}

        {renderContent()}
      </main>
    </div>
  );
};

export default App;