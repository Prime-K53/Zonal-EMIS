import React, { useState } from 'react';
import { Menu, Search, Bell, ChevronDown, Settings } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

export const Layout = ({ children, activeTab, setActiveTab, user }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout } = useAuth();

  return (
    <div className="flex h-screen bg-zinc-50 overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        user={user}
      />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Premium Header / Topbar */}
        <header className="flex h-20 items-center justify-between border-b border-zinc-200 bg-gradient-to-r from-white via-white to-zinc-50 px-8 shadow-[0_1px_20px_rgba(0,0,0,0.03)] backdrop-blur-sm">
          <div className="flex items-center gap-5">
            <button 
              className="text-zinc-500 lg:hidden hover:bg-zinc-100 p-2.5 rounded-xl transition-all duration-200" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xl font-bold text-zinc-900 capitalize tracking-tight">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">Zonal Education Management Information System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div 
              className="hidden md:flex items-center gap-3 px-5 py-3 bg-white rounded-2xl border border-zinc-200 cursor-pointer group hover:border-zinc-300 hover:shadow-md transition-all duration-200 w-80" 
              onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            >
              <Search className="w-4.5 h-4.5 text-zinc-400 group-hover:text-zinc-600 transition-colors" />
              <span className="text-sm font-medium text-zinc-500 flex-1">Search EMIS database...</span>
              <kbd className="px-2 py-1 bg-gradient-to-b from-zinc-50 to-zinc-100 border border-zinc-200 rounded-lg text-[11px] font-bold text-zinc-500 shadow-sm">⌘K</kbd>
            </div>

            {/* Notifications */}
            <button className="relative p-2.5 rounded-xl hover:bg-zinc-100 text-zinc-500 hover:text-zinc-700 transition-all duration-200">
              <Bell size={21} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* User Profile Dropdown */}
            <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
              <div className="flex flex-col items-end hidden sm:block">
                <span className="text-sm font-semibold text-zinc-900">{user?.name || 'System User'}</span>
                <span className="text-[11px] text-zinc-500 uppercase tracking-wide">{user?.role || 'TDC Officer'}</span>
              </div>
              <button 
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-zinc-100 transition-all duration-200"
                onClick={logout}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-500/20">
                  <span className="text-sm font-bold">{(user?.name || 'U').charAt(0).toUpperCase()}</span>
                </div>
                <ChevronDown size={16} className="text-zinc-400" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-gradient-to-b from-zinc-50 to-white">
          {children}
        </main>
      </div>
    </div>
  );
};