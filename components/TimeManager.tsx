import React, { useState } from 'react';
import { User, Project, Timesheet, LeaveRequest } from '../types';
import { Home } from './TimeManager/Home';
import { TimesheetView } from './TimeManager/TimesheetView';
import { LeaveView } from './TimeManager/LeaveView';
import { ValidationView } from './TimeManager/ValidationView';
import { AssistantDashboard } from './TimeManager/AssistantDashboard';

interface TimeManagerProps {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  timesheets: Timesheet[];
  leaveRequests: LeaveRequest[];
  onSaveTimesheet: (timesheet: Timesheet) => void;
  onAddLeaveRequest: (request: LeaveRequest) => void;
  onUpdateLeaveRequest: (request: LeaveRequest) => void;
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
  onUpdateLeaveRequest
}) => {
  const [mode, setMode] = useState<Mode>('home');

  if (!currentUser) return <div className="p-8 text-center text-slate-500">Veuillez vous connecter.</div>;

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