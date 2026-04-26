import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  School, 
  ClipboardList,
  History,
  Sparkles,
  BookOpen,
  MapPin,
  Calendar,
  Wrench,
  Users2,
  BarChart3,
  ShieldCheck,
  ClipboardCheck,
  GraduationCap,
  Package,
  FileText,
  Settings,
  Menu,
  X,
  User,
  LogIn
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { User as AppUser } from '../types';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: AppUser | null;
}

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI Assistant', icon: Sparkles },
  { id: 'submissions', label: 'Records Management', icon: ClipboardList },
  { id: 'teachers', label: 'Teacher Registry', icon: Users },
  { id: 'schools', label: 'School Registry', icon: School },
  { id: 'learners', label: 'Learners Module', icon: GraduationCap },
  { id: 'daily-attendance', label: 'Daily Attendance', icon: ClipboardCheck },
  { id: 'maintenance', label: 'Maintenance Logs', icon: Wrench },
  { id: 'smc', label: 'SMC Meetings', icon: Users2 },
  { id: 'academics', label: 'Examination', icon: BookOpen },
  { id: 'zonal-activities', label: 'Zonal Activities', icon: MapPin },
  { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
  { id: 'tpd', label: 'TPD Registry', icon: GraduationCap },
  { id: 'users-management', label: 'User Management', icon: Users, role: 'TDC_OFFICER' },
  { id: 'audit-logs', label: 'Audit Logs', icon: History, role: 'TDC_OFFICER' },
  { id: 'resources', label: 'Resources', icon: Package },
  { id: 'reports', label: 'Reports', icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, user }: SidebarProps) => {
  const { logout } = useAuth();
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.role) return true;
    return user?.role === item.role;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-zinc-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white text-zinc-600 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-zinc-200",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-100">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-white">
                <GraduationCap size={20} />
              </div>
              <span className="text-lg font-bold text-zinc-900 tracking-tight">EMIS TDC</span>
            </div>
            <button className="text-zinc-500 lg:hidden" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {filteredMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeTab === item.id 
                    ? "bg-emerald-50 text-emerald-600 shadow-sm" 
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                )}
              >
                <item.icon size={18} />
                {item.label}
              </button>
            ))}
          </nav>

          {/* User Profile */}
          <div className="border-t border-zinc-100 p-4">
            {user?.id === 'guest' ? (
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                onClick={() => setActiveTab('settings')}
              >
                <LogIn size={16} />
                Sign In
              </Button>
            ) : (
              <div 
                className={cn(
                  "flex items-center gap-3 rounded-lg p-3 cursor-pointer transition-colors",
                  activeTab === 'settings' ? "bg-zinc-100 text-zinc-900" : "bg-zinc-50 hover:bg-zinc-100"
                )}
                onClick={() => setActiveTab('settings')}
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
                  <User size={16} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-xs font-medium text-zinc-900">{user?.name || 'EMIS User'}</p>
                  <p className="truncate text-[10px] text-zinc-500">{user?.email || 'TDC Coordinator'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
