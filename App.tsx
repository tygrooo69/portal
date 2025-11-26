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
import { TimeManager } from './components/TimeManager';
import { ViewMode, AppItem, DocumentItem, Project, Task, User, Comment, Notification, Timesheet, LeaveRequest } from './types';
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
  
  // Time & Leave Management
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [targetProjectId, setTargetProjectId] = useState<string | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<string | null>(null);

  const [isLoaded, setIsLoaded] = useState(false);
  
  // Initialize with empty string, will be populated by server or localStorage
  const [apiKey, setApiKey] = useState('');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [logo, setLogo] = useState('');

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
        
        // Time & Leave
        if (serverData.timesheets) setTimesheets(serverData.timesheets);
        if (serverData.leaveRequests) setLeaveRequests(serverData.leaveRequests);

        if (serverData.apiKey) setApiKey(serverData.apiKey);
        if (serverData.adminPassword) setAdminPassword(serverData.adminPassword);
        if (serverData.logo) setLogo(serverData.logo);
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

        const savedLogo = localStorage.getItem('lumina_logo');
        if (savedLogo) setLogo(savedLogo);
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
  
  const authorizedProjects = useMemo(() => {
    if (!currentUser) return [];
    return projects.filter(p => p.members && p.members.includes(currentUser.id));
  }, [projects, currentUser]);

  const authorizedTasks = useMemo(() => {
    if (!currentUser) return [];
    const authorizedProjectIds = authorizedProjects.map(p => p.id);
    return tasks.filter(t => authorizedProjectIds.includes(t.projectId));
  }, [tasks, authorizedProjects, currentUser]);

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
    newTimesheets: Timesheet[],
    newLeaveRequests: LeaveRequest[],
    newKey?: string, 
    newPwd?: string,
    newLogo?: string
  ) => {
    const keyToSave = newKey !== undefined ? newKey : apiKey;
    const pwdToSave = newPwd !== undefined ? newPwd : adminPassword;
    const logoToSave = newLogo !== undefined ? newLogo : logo;

    // Update UI immediately
    setApps(newApps);
    setDocuments(newDocs);
    setProjects(newProjects);
    setTasks(newTasks);
    setUsers(newUsers);
    setComments(newComments);
    setNotifications(newNotifications);
    setTimesheets(newTimesheets);
    setLeaveRequests(newLeaveRequests);

    if (newKey !== undefined) setApiKey(newKey);
    if (newPwd !== undefined) setAdminPassword(newPwd);
    if (newLogo !== undefined) setLogo(newLogo);

    // Try Save to Server
    const serverSaved = await api.saveData(
      newApps || [], 
      newDocs || [], 
      newProjects || [], 
      newTasks || [], 
      newUsers || [],
      newComments || [],
      newNotifications || [],
      newTimesheets || [],
      newLeaveRequests || [],
      keyToSave, 
      pwdToSave,
      logoToSave
    );
    
    if (!serverSaved) {
      // Fallback: Save to LocalStorage (Only minimal set if needed, usually server is reliable in this demo)
      try {
        localStorage.setItem('lumina_apps', JSON.stringify(newApps));
        localStorage.setItem('lumina_documents', JSON.stringify(newDocs));
        localStorage.setItem('lumina_projects', JSON.stringify(newProjects));
        localStorage.setItem('lumina_tasks', JSON.stringify(newTasks));
        localStorage.setItem('lumina_users', JSON.stringify(newUsers));
        if (newKey !== undefined) localStorage.setItem('lumina_api_key', newKey);
        if (newLogo !== undefined) localStorage.setItem('lumina_logo', newLogo);
      } catch (e) {
        console.warn("LocalStorage quota exceeded or error", e);
      }
    }
  };

  const handleSaveApiKey = (key: string) => {
    persistData(apps, documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests, key, undefined, undefined);
  };

  const handleSaveAdminPassword = (password: string) => {
    persistData(apps, documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests, undefined, password, undefined);
  };

  const handleSaveLogo = (newLogo: string) => {
    persistData(apps, documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests, undefined, undefined, newLogo);
  };

  const handleAddApp = (app: AppItem) => {
    persistData([...apps, app], documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleUpdateApp = (updatedApp: AppItem) => {
    persistData(apps.map(a => a.id === updatedApp.id ? updatedApp : a), documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleDeleteApp = (id: string) => {
    persistData(apps.filter(a => a.id !== id), documents, projects, tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleAddDocuments = (newDocs: DocumentItem[]) => {
    persistData(apps, [...documents, ...newDocs], projects, tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleDeleteDocument = (id: string) => {
    persistData(apps, documents.filter(d => d.id !== id), projects, tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  // --- Project Handlers ---
  const handleAddProject = (project: Project) => {
    persistData(apps, documents, [...projects, project], tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleUpdateProject = (updatedProject: Project) => {
    if (currentUser) {
       const existing = projects.find(p => p.id === updatedProject.id);
       if (existing && existing.members && !existing.members.includes(currentUser.id)) {
         alert("Vous n'êtes pas autorisé à modifier ce projet.");
         return;
       }
    } else { return; }

    persistData(apps, documents, projects.map(p => p.id === updatedProject.id ? updatedProject : p), tasks, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleDeleteProject = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (currentUser && project && project.members && !project.members.includes(currentUser.id)) {
      alert("Vous n'êtes pas autorisé à supprimer ce projet.");
      return;
    }

    persistData(
      apps, 
      documents, 
      projects.filter(p => p.id !== id), 
      tasks.filter(t => t.projectId !== id),
      users,
      comments.filter(c => tasks.find(t => t.id === c.taskId && t.projectId === id)),
      notifications,
      timesheets,
      leaveRequests
    );
  };

  // --- Task Handlers ---

  const handleAddTask = (task: Task) => {
    let newNotifications = [...notifications];
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
    persistData(apps, documents, projects, [...tasks, task], users, comments, newNotifications, timesheets, leaveRequests);
  };

  const handleUpdateTask = (updatedTask: Task) => {
    const parentProject = projects.find(p => p.id === updatedTask.projectId);
    if (currentUser && parentProject && parentProject.members && !parentProject.members.includes(currentUser.id)) {
       alert("Vous n'avez pas les droits sur le projet parent pour modifier cette tâche.");
       return;
    }

    let newNotifications = [...notifications];
    const oldTask = tasks.find(t => t.id === updatedTask.id);

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

    persistData(apps, documents, projects, tasks.map(t => t.id === updatedTask.id ? updatedTask : t), users, comments, newNotifications, timesheets, leaveRequests);
  };

  const handleUpdateTasks = (updatedTasks: Task[]) => {
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
    persistData(apps, documents, projects, newTasksList, users, comments, notifications, timesheets, leaveRequests);
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const parentProject = projects.find(p => p.id === task.projectId);
    if (currentUser && parentProject && parentProject.members && !parentProject.members.includes(currentUser.id)) {
       alert("Vous n'avez pas les droits pour supprimer cette tâche.");
       return;
    }
    persistData(apps, documents, projects, tasks.filter(t => t.id !== id), users, comments.filter(c => c.taskId !== id), notifications, timesheets, leaveRequests);
  };

  const handleAddComment = (comment: Comment) => {
    persistData(apps, documents, projects, tasks, users, [...comments, comment], notifications, timesheets, leaveRequests);
  };

  const handleMarkNotificationRead = (notifId: string) => {
    const newNotifs = notifications.map(n => n.id === notifId ? { ...n, isRead: true } : n);
    persistData(apps, documents, projects, tasks, users, comments, newNotifs, timesheets, leaveRequests);
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    const newNotifs = notifications.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n);
    persistData(apps, documents, projects, tasks, users, comments, newNotifs, timesheets, leaveRequests);
  };

  const handleAddUser = (user: User) => {
    persistData(apps, documents, projects, tasks, [...users, user], comments, notifications, timesheets, leaveRequests);
  };

  const handleUpdateUser = (updatedUser: User) => {
    const newUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
    persistData(apps, documents, projects, tasks, newUsers, comments, notifications, timesheets, leaveRequests);
    if (currentUser && currentUser.id === updatedUser.id) {
       setCurrentUser(updatedUser);
       sessionStorage.setItem('lumina_current_user', JSON.stringify(updatedUser));
    }
  };

  const handleDeleteUser = (id: string) => {
    persistData(apps, documents, projects, tasks, users.filter(u => u.id !== id), comments, notifications, timesheets, leaveRequests);
    if (currentUser && currentUser.id === id) {
      handleLogout();
    }
  };

  // --- Time Manager Handlers ---
  const handleSaveTimesheet = (sheet: Timesheet) => {
    // If updating an existing sheet (by week and user), replace it
    const existingIndex = timesheets.findIndex(t => t.id === sheet.id);
    let newTimesheets = [...timesheets];
    if (existingIndex >= 0) {
      newTimesheets[existingIndex] = sheet;
    } else {
      newTimesheets.push(sheet);
    }
    
    // Notifications for validation
    let newNotifs = [...notifications];
    if (sheet.status === 'submitted') {
       // Notify Manager
       if (sheet.managerId) {
         newNotifs.push({
           id: Date.now() + Math.random().toString(),
           userId: sheet.managerId,
           type: 'timesheet_status',
           message: `${currentUser?.name} a soumis une feuille d'heures.`,
           isRead: false,
           createdAt: new Date().toISOString()
         });
       }
    } else if (sheet.status === 'approved' || sheet.status === 'rejected') {
       // Notify User
       newNotifs.push({
         id: Date.now() + Math.random().toString(),
         userId: sheet.userId,
         type: 'timesheet_status',
         message: `Votre feuille d'heures a été ${sheet.status === 'approved' ? 'validée' : 'refusée'}.`,
         isRead: false,
         createdAt: new Date().toISOString()
       });
    }

    persistData(apps, documents, projects, tasks, users, comments, newNotifs, newTimesheets, leaveRequests);
  };

  const handleDeleteTimesheet = (id: string) => {
    const newTimesheets = timesheets.filter(t => t.id !== id);
    persistData(apps, documents, projects, tasks, users, comments, notifications, newTimesheets, leaveRequests);
  };

  const handleAddLeaveRequest = (request: LeaveRequest) => {
    let newNotifs = [...notifications];
    if (request.managerId) {
         newNotifs.push({
           id: Date.now() + Math.random().toString(),
           userId: request.managerId,
           type: 'leave_request',
           message: `${currentUser?.name} a fait une demande de congé.`,
           isRead: false,
           createdAt: new Date().toISOString()
         });
    }
    persistData(apps, documents, projects, tasks, users, comments, newNotifs, timesheets, [...leaveRequests, request]);
  };

  const handleUpdateLeaveRequest = (request: LeaveRequest) => {
    const newReqs = leaveRequests.map(r => r.id === request.id ? request : r);
    // Notify requester
    let newNotifs = [...notifications];
    if (request.status !== 'pending') {
       newNotifs.push({
         id: Date.now().toString(),
         userId: request.userId,
         type: 'leave_status',
         message: `Votre demande de congé a été ${request.status === 'approved' ? 'acceptée' : 'refusée'}.`,
         isRead: false,
         createdAt: new Date().toISOString()
       });
    }
    persistData(apps, documents, projects, tasks, users, comments, newNotifs, timesheets, newReqs);
  };

  // --- Login / Logout ---
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    sessionStorage.setItem('lumina_current_user', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('lumina_current_user');
    setView('dashboard');
  };

  const handleProjectClickFromDashboard = (projectId: string) => {
    setTargetProjectId(projectId);
    setTargetTaskId(null);
    setView('projects');
  };

  const handleTaskClickFromDashboard = (taskId: string, projectId: string) => {
    setTargetProjectId(projectId);
    setTargetTaskId(taskId);
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
             onUpdateTasks={handleUpdateTasks} 
             onDeleteTask={handleDeleteTask}
             onAddComment={handleAddComment}
          />
        );
      case 'time-manager':
        return (
          <TimeManager 
            currentUser={currentUser}
            users={users}
            projects={authorizedProjects}
            timesheets={timesheets}
            leaveRequests={leaveRequests}
            onSaveTimesheet={handleSaveTimesheet}
            onDeleteTimesheet={handleDeleteTimesheet}
            onAddLeaveRequest={handleAddLeaveRequest}
            onUpdateLeaveRequest={handleUpdateLeaveRequest}
            onLoginClick={() => setIsLoginModalOpen(true)}
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
            logo={logo}
            onSaveLogo={handleSaveLogo}
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
        logo={logo}
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