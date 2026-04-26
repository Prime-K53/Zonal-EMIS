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
  LogIn,
  ChevronRight
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

const navigationSections = [
  {
    heading: 'Main',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
      { id: 'assistant', label: 'AI Assistant', icon: Sparkles, badge: 'NEW' },
    ]
  },
  {
    heading: 'Data Management',
    items: [
      { id: 'submissions', label: 'Records Management', icon: ClipboardList, badge: null },
      { id: 'teachers', label: 'Teacher Registry', icon: Users, badge: null },
      { id: 'schools', label: 'School Registry', icon: School, badge: null },
      { id: 'learners', label: 'Learners Module', icon: GraduationCap, badge: null },
    ]
  },
  {
    heading: 'Operations',
    items: [
      { id: 'daily-attendance', label: 'Daily Attendance', icon: ClipboardCheck, badge: null },
      { id: 'academics', label: 'Examination Results', icon: BookOpen, badge: null },
      { id: 'zonal-activities', label: 'Zonal Activities', icon: MapPin, badge: null },
      { id: 'inspections', label: 'Inspections', icon: ShieldCheck, badge: null },
      { id: 'tpd', label: 'TPD Registry', icon: GraduationCap, badge: null },
      { id: 'maintenance', label: 'Maintenance Logs', icon: Wrench, badge: null },
      { id: 'smc', label: 'SMC Meetings', icon: Users2, badge: null },
      { id: 'resources', label: 'Resource Inventory', icon: Package, badge: null },
    ]
  },
  {
    heading: 'Reporting',
    items: [
      { id: 'reports', label: 'Analytics & Reports', icon: BarChart3, badge: null },
    ]
  },
  {
    heading: 'Administration',
    items: [
      { id: 'users-management', label: 'User Management', icon: Users, role: 'TDC_OFFICER', badge: null },
      { id: 'audit-logs', label: 'Audit Logs', icon: History, role: 'TDC_OFFICER', badge: null },
      { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
    ]
  }
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

  const filterItem = (item: any) => {
    if (!item.role) return true;
    return user?.role === item.role || (user?.role === 'ADMIN' && item.role === 'TDC_OFFICER');
  };

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
        "fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-zinc-50 text-zinc-600 transition-transform duration-400 ease-in-out lg:static lg:translate-x-0 border-r border-zinc-200 shadow-[2px_0_24px_rgba(0,0,0,0.04)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-zinc-100 bg-white">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                <GraduationCap size={22} />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-zinc-900 tracking-tight">EMIS TDC</span>
                <span className="text-[10px] font-medium text-emerald-600 uppercase tracking-wider">Zonal Office</span>
              </div>
            </div>
            <button className="text-zinc-500 lg:hidden hover:bg-zinc-100 p-2 rounded-lg transition-colors" onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
            {navigationSections.map((section, sectionIndex) => {
              const visibleItems = section.items.filter(filterItem);
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={sectionIndex} className="space-y-1">
                  <div className="px-3 mb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 select-none">
                      {section.heading}
                    </h3>
                  </div>
                  
                  {visibleItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                        activeTab === item.id 
                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.01]" 
                          : "text-zinc-600 hover:bg-white hover:text-zinc-900 hover:shadow-sm"
                      )}
                    >
                      <item.icon size={19} className={cn(
                        "transition-transform duration-200",
                        activeTab === item.id ? "" : "group-hover:scale-110"
                      )} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wide",
                          activeTab === item.id 
                            ? "bg-white/20 text-white" 
                            : "bg-emerald-100 text-emerald-700"
                        )}>
                          {item.badge}
                        </span>
                      )}
                      {activeTab === item.id && (
                        <ChevronRight size={16} className="opacity-80" />
                      )}
                    </button>
                  ))}
                </div>
              )
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="border-t border-zinc-200 p-5 bg-white/80 backdrop-blur-sm">
            {user?.id === 'guest' ? (
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md shadow-emerald-500/20"
                onClick={() => setActiveTab('settings')}
              >
                <LogIn size={16} />
                Sign In to System
              </Button>
            ) : (
              <div 
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3.5 cursor-pointer transition-all duration-200",
                  activeTab === 'settings' 
                    ? "bg-zinc-100 text-zinc-900 shadow-sm" 
                    : "bg-transparent hover:bg-zinc-100"
                )}
                onClick={() => setActiveTab('settings')}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md">
                  <User size={18} />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-semibold text-zinc-900">{user?.name || 'EMIS User'}</p>
                  <p className="truncate text-[11px] text-zinc-500 uppercase tracking-wide">{user?.role || 'TDC Coordinator'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};