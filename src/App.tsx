import React, { useState, useEffect, ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { TeacherRegistry } from './components/TeacherRegistry';
import { SchoolRegistry } from './components/SchoolRegistry';
import { LearnersModule } from './components/LearnersModule';
import { InspectionModule } from './components/InspectionModule';
import { TPDRegistry } from './components/TPDRegistry';
import { ResourceTracking } from './components/ResourceTracking';
import { EMISAssistant } from './components/EMISAssistant';
import { Reports } from './components/Reports';
import { Settings } from './components/Settings';
import { Academics } from './components/Academics';
import { DataEntry } from './components/DataEntry';
import { AdvancedInspections } from './components/AdvancedInspections';
import { DailyAttendanceModule } from './components/DailyAttendanceModule';
import { MaintenanceLogModule } from './components/MaintenanceLog';
import { SMCMeetingModule } from './components/SMCMeeting';
import ZonalActivities from './components/ZonalActivities';
import { CommandPalette } from './components/CommandPalette';
import { Card } from './components/Card';
import { Button } from './components/Button';
import { GraduationCap, AlertCircle, LogIn } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { Toaster } from 'sonner';
import { Login } from './components/Login';

// Error Boundary Component
interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "Something went wrong.";

      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 p-6 text-center">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Application Error</h2>
          <p className="text-zinc-500 max-w-md mt-2">{errorMessage}</p>
          <Button 
            className="mt-6"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </Button>
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default function App() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [commandSelectedId, setCommandSelectedId] = useState<string | null>(null);

  console.log('App render - user:', user, 'loading:', loading);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

   const handleCommandSelect = (type: string, id: string) => {
    if (type === 'nav') {
      setActiveTab(id);
      setCommandSelectedId(null);
    } else if (type === 'teacher') {
      setActiveTab('teachers');
      setCommandSelectedId(id);
    } else if (type === 'school') {
      setActiveTab('schools');
      setCommandSelectedId(id);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Toaster position="top-right" richColors />
        <Login />
      </ErrorBoundary>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
      case 'submissions':
      case 'users-management':
      case 'audit-logs':
        return <Dashboard view={activeTab} />;
      case 'assistant':
        return <EMISAssistant />;
      case 'teachers':
        return <TeacherRegistry initialSelectedId={commandSelectedId} />;
      case 'schools':
        return <SchoolRegistry 
          onNavigateMainTab={setActiveTab} 
          initialSelectedId={commandSelectedId} 
        />;
      case 'learners':
        return <LearnersModule />;
      case 'daily-attendance':
        return <DailyAttendanceModule />;
      case 'academics':
        return <Academics />;
      case 'zonal-activities':
        return <ZonalActivities onNavigate={setActiveTab} />;
      case 'inspections':
        return <AdvancedInspections />;
      case 'maintenance':
        return <MaintenanceLogModule />;
      case 'smc':
        return <SMCMeetingModule />;
      case 'tpd':
        return <TPDRegistry />;
      case 'resources':
        return <ResourceTracking />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard view="dashboard" />;
    }
  };

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={user!}>
        {renderContent()}
      </Layout>
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelect={handleCommandSelect}
      />
    </ErrorBoundary>
  );
}
