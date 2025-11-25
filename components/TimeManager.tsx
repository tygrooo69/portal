import React, { useState } from 'react';
import { User, Project, Timesheet, LeaveRequest } from '../types';
import { Home } from './TimeManager/Home';
import { TimesheetView } from './TimeManager/TimesheetView';
import { LeaveView } from './TimeManager/LeaveView';
import { ValidationView } from './TimeManager/ValidationView';
import { AssistantDashboard } from './TimeManager/AssistantDashboard';
import { Clock, LogIn } from 'lucide-react';

interface TimeManagerProps {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  onSaveTimesheet: (timesheet: Timesheet) => void;
  onAddLeaveRequest: (request: LeaveRequest) => void;
  onUpdateLeaveRequest: (request: LeaveRequest) => void;
  onLoginClick: () => void;
}

type Mode = 'home' | 'timesheet' | 'leaves' | 'validation' | 'assistant';

export const TimeManager: React.FC<TimeManagerProps> = ({
  currentUser,
  users,
  projects, // Kept if needed for future linking
  timesheets,
  leaveRequests,
  onSaveTimesheet,
  onAddLeaveRequest,
  onUpdateLeaveRequest,
  onLoginClick
}) => {
  const [mode, setMode] = useState<Mode>('home');

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-slate-50 dark:bg-slate-950">
        <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-6 shadow-sm">
          <Clock size={48} />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Gestion des Temps</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md text-lg">
          Connectez-vous pour accéder à vos feuilles d'heures, poser des congés et gérer votre planning.
        </p>
        <button
          onClick={onLoginClick}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold transition-all shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95"
        >
          <LogIn size={24} />
          <span>S'identifier</span>
        </button>
      </div>
    );
  }

  switch (mode) {
    case 'timesheet':
      return (
        <TimesheetView 
          currentUser={currentUser}
          users={users}
          timesheets={timesheets}
          onSaveTimesheet={onSaveTimesheet}
          onBack={() => setMode('home')}
        />
      );
    case 'leaves':
      return (
        <LeaveView 
          currentUser={currentUser}
          users={users}
          leaveRequests={leaveRequests}
          onAddLeaveRequest={onAddLeaveRequest}
          onBack={() => setMode('home')}
        />
      );
    case 'validation':
      return (
        <ValidationView 
          currentUser={currentUser}
          users={users}
          timesheets={timesheets}
          leaveRequests={leaveRequests}
          onSaveTimesheet={onSaveTimesheet}
          onUpdateLeaveRequest={onUpdateLeaveRequest}
          onBack={() => setMode('home')}
        />
      );
    case 'assistant':
      return (
        <AssistantDashboard 
          users={users}
          timesheets={timesheets}
          leaveRequests={leaveRequests}
          onSaveTimesheet={onSaveTimesheet}
          onUpdateLeaveRequest={onUpdateLeaveRequest}
          onAddLeaveRequest={onAddLeaveRequest}
          onBack={() => setMode('home')}
        />
      );
    case 'home':
    default:
      return (
        <Home 
          onNavigate={setMode} 
          currentUser={currentUser} 
        />
      );
  }
};