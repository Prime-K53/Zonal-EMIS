import React, { useState } from 'react';
import { Menu, Search } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User | null;
}

export const Layout = ({ children, activeTab, setActiveTab, user }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button 
              className="text-zinc-500 lg:hidden" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-semibold text-zinc-900 capitalize">
              {activeTab.replace('-', ' ')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-zinc-100 rounded-2xl border border-zinc-200 cursor-pointer group hover:bg-zinc-200 transition-all" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}>
              <Search className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600" />
              <span className="text-xs font-medium text-zinc-500">Search EMIS...</span>
              <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-400 shadow-sm ml-4">⌘K</kbd>
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Current Date</span>
              <span className="text-sm font-semibold text-zinc-900">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
