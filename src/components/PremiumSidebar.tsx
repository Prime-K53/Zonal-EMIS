import React, { useState } from 'react';
import { 
  Menu, 
  Search, 
  Bell, 
  ChevronDown, 
  Settings, 
  X,
  ChevronRight,
  Home,
  Users,
  School,
  BookOpen,
  Calendar,
  MapPin,
  Wrench,
  BarChart3,
  Shield,
  FileText,
  User,
  LogOut,
  Sparkles,
  History,
  Archive,
  Layers,
  Plus,
  Moon,
  Sun
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

const navigationSections = [
  {
    heading: 'Core Modules',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, badge: null },
      { id: 'assistant', label: 'AI Assistant', icon: Sparkles, badge: 'BETA' },
    ]
  },
  {
    heading: 'Data Management',
    items: [
      { id: 'data-entry', label: 'Data Entry Portal', icon: FileText, badge: 'NEW' },
      { id: 'submissions', label: 'Records Management', icon: Archive, badge: null },
      { id: 'teachers', label: 'Teacher Registry', icon: Users, badge: null },
      { id: 'schools', label: 'School Registry', icon: School, badge: null },
      { id: 'learners', label: 'Learners Module', icon: Users, badge: null },
    ]
  },
  {
    heading: 'Operations',
    items: [
      { id: 'daily-attendance', label: 'Daily Attendance', icon: Calendar, badge: null },
      { id: 'academics', label: 'Examination Results', icon: BookOpen, badge: null },
      { id: 'zonal-activities', label: 'Zonal Activities', icon: MapPin, badge: null },
      { id: 'inspections', label: 'Inspections', icon: Shield, badge: null },
      { id: 'tpd', label: 'TPD Registry', icon: Users, badge: null },
      { id: 'maintenance', label: 'Maintenance Logs', icon: Wrench, badge: null },
      { id: 'smc', label: 'SMC Meetings', icon: Users, badge: null },
      { id: 'resources', label: 'Resource Inventory', icon: Layers, badge: null },
    ]
  },
  {
    heading: 'Analytics & Reporting',
    items: [
      { id: 'reports', label: 'Analytics & Reports', icon: BarChart3, badge: null },
      { id: 'history', label: 'Data History', icon: History, badge: null },
    ]
  },
  {
    heading: 'Administration',
    items: [
      { id: 'users-management', label: 'User Management', icon: Users, role: 'TDC_OFFICER', badge: null },
      { id: 'audit-logs', label: 'Audit Logs', icon: FileText, role: 'TDC_OFFICER', badge: null },
      { id: 'settings', label: 'System Settings', icon: Settings, badge: null },
    ]
  }
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen, user }: SidebarProps) => {
  const { logout } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  
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

  const getActiveItem = () => {
    for (const section of navigationSections) {
      const item = section.items.find(i => i.id === activeTab);
      if (item) return item;
    }
    return null;
  };

  const activeItem = getActiveItem();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-gradient-to-b from-white via-white to-slate-50 text-slate-600 transition-all duration-300 ease-in-out lg:static lg:translate-x-0 border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.06)]",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          {/* Logo Header */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                  <BookOpen size={22} />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full border-2 border-white shadow-sm animate-pulse"></div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-slate-900 tracking-tight">EMIS TDC</span>
                <span className="text-[10px] font-medium bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Zonal Office</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <button className="text-slate-500 hover:bg-slate-100 p-2 rounded-lg transition-colors lg:hidden" onClick={() => setIsOpen(false)}>
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-7">
            {navigationSections.map((section, sectionIndex) => {
              const visibleItems = section.items.filter(filterItem);
              if (visibleItems.length === 0) return null;
              
              return (
                <div key={sectionIndex} className="space-y-1">
                  <div className="px-3 mb-3">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.15em] text-slate-400 select-none flex items-center gap-2">
                      {section.heading}
                      {section.heading === 'Core Modules' && (
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      )}
                    </h3>
                  </div>
                  
                  {visibleItems.map((item) => {
                    const isActive = activeTab === item.id;
                    const Icon = item.icon;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsOpen(false);
                        }}
                        className={cn(
                          "group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 relative overflow-hidden",
                          "hover:bg-gradient-to-r hover:from-slate-50 hover:to-slate-100 hover:shadow-sm",
                          isActive 
                            ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25 scale-[1.01] border border-emerald-400/20" 
                            : "text-slate-600 hover:text-slate-900"
                        )}
                      >
                        <div className={cn(
                          "flex-shrink-0 w-5 h-5 flex items-center justify-center rounded-lg transition-all duration-200",
                          isActive 
                            ? "bg-white/20 text-white" 
                            : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                        )}>
                          <Icon size={16} />
                        </div>
                        
                        <span className="flex-1 text-left transition-all duration-200">
                          {item.label}
                        </span>
                        
                        {item.badge && (
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0",
                            isActive 
                              ? "bg-white/20 text-white" 
                              : "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-sm"
                          )}>
                            {item.badge}
                          </span>
                        )}
                        
                        {isActive && (
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-lg"></div>
                        )}
                        
                        {isActive && (
                          <ChevronRight size={14} className="opacity-80 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            })}
          </nav>

          {/* User Profile Footer */}
          <div className="border-t border-slate-200 p-5 bg-white/80 backdrop-blur-sm">
            {user?.id === 'guest' ? (
              <Button 
                variant="default" 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all"
                onClick={() => setActiveTab('settings')}
              >
                <LogOut size={16} />
                Sign In to System
              </Button>
            ) : (
              <div 
                className={cn(
                  "flex items-center gap-3 rounded-xl p-3.5 cursor-pointer transition-all duration-200 group",
                  activeTab === 'settings' 
                    ? "bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 border border-emerald-400/20 shadow-sm" 
                    : "hover:bg-slate-100"
                )}
                onClick={() => setActiveTab('settings')}
              >
                <div className="relative">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                    <User size={18} />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                
                <div className="flex-1 overflow-hidden">
                  <p className="truncate text-sm font-bold text-slate-900">{user?.name || 'EMIS User'}</p>
                  <p className="truncate text-[10px] text-emerald-600 font-medium uppercase tracking-wide">{user?.role || 'TDC Coordinator'}</p>
                </div>
                
                <ChevronDown size={16} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};