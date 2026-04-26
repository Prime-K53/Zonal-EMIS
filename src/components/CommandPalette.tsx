import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Users, School, ClipboardCheck, GraduationCap, X, Command, ArrowRight } from 'lucide-react';
import { dataService } from '../services/dataService';
import { Teacher, School as SchoolType } from '../types';
import { cn } from '../lib/utils';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: string, id: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, onSelect }) => {
  const [query, setQuery] = useState('');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (isOpen) {
      const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
      const unsubSchools = dataService.subscribeToSchools(setSchools);
      return () => {
        unsubTeachers();
        unsubSchools();
      };
    }
  }, [isOpen]);

  const filteredResults = React.useMemo(() => {
    if (!query) return [];
    
    const q = query.toLowerCase();
    const teacherResults = teachers
      .filter(t => `${t.firstName} ${t.lastName}`.toLowerCase().includes(q) || t.emisCode.toLowerCase().includes(q))
      .slice(0, 5)
      .map(t => ({ id: t.id, title: `${t.firstName} ${t.lastName}`, subtitle: `Teacher • ${t.emisCode}`, type: 'teacher', icon: Users }));

    const schoolResults = schools
      .filter(s => s.name.toLowerCase().includes(q) || s.emisCode.toLowerCase().includes(q))
      .slice(0, 5)
      .map(s => ({ id: s.id, title: s.name, subtitle: `School • ${s.emisCode}`, type: 'school', icon: School }));

    const navigationResults = [
      { id: 'dashboard', title: 'Go to Dashboard', subtitle: 'Navigation', type: 'nav', icon: Command },
      { id: 'teachers', title: 'View Teacher Registry', subtitle: 'Navigation', type: 'nav', icon: Users },
      { id: 'schools', title: 'View School Registry', subtitle: 'Navigation', type: 'nav', icon: School },
      { id: 'inspections', title: 'View Inspections', subtitle: 'Navigation', type: 'nav', icon: ClipboardCheck },
    ].filter(n => n.title.toLowerCase().includes(q));

    return [...navigationResults, ...teacherResults, ...schoolResults];
  }, [query, teachers, schools]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredResults.length);
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredResults.length) % filteredResults.length);
    }
    if (e.key === 'Enter' && filteredResults[selectedIndex]) {
      const result = filteredResults[selectedIndex];
      onSelect(result.type, result.id);
      onClose();
    }
  }, [filteredResults, selectedIndex, onClose, onSelect]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-zinc-900/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden"
          >
            <div className="flex items-center px-4 border-b border-zinc-100">
              <Search className="w-5 h-5 text-zinc-400" />
              <input
                autoFocus
                placeholder="Search teachers, schools, or navigation..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 h-14 bg-transparent border-none focus:ring-0 text-zinc-900 placeholder:text-zinc-400 text-base"
              />
              <div className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-md">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">ESC</span>
              </div>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-2">
              {filteredResults.length > 0 ? (
                <div className="space-y-1">
                  {filteredResults.map((result, i) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => {
                        onSelect(result.type, result.id);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(i)}
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left",
                        i === selectedIndex ? "bg-emerald-50 text-emerald-900" : "hover:bg-zinc-50 text-zinc-600"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-lg",
                        i === selectedIndex ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-500"
                      )}>
                        <result.icon size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate">{result.title}</p>
                        <p className="text-[10px] font-medium opacity-60 uppercase tracking-wider">{result.subtitle}</p>
                      </div>
                      {i === selectedIndex && (
                        <ArrowRight size={16} className="text-emerald-500 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              ) : query ? (
                <div className="py-12 text-center">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-50 text-zinc-400 mb-3">
                    <Search size={24} />
                  </div>
                  <p className="text-sm font-medium text-zinc-500">No results found for "{query}"</p>
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Quick Navigation</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'dashboard', label: 'Dashboard', icon: Command },
                      { id: 'teachers', label: 'Teachers', icon: Users },
                      { id: 'schools', label: 'Schools', icon: School },
                      { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
                    ].map((nav) => (
                      <button
                        key={nav.id}
                        onClick={() => {
                          onSelect('nav', nav.id);
                          onClose();
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-zinc-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
                      >
                        <div className="p-2 rounded-lg bg-zinc-50 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                          <nav.icon size={16} />
                        </div>
                        <span className="text-sm font-bold text-zinc-600 group-hover:text-emerald-900">{nav.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-3 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-500 shadow-sm">↑↓</kbd>
                  <span className="text-[10px] font-medium text-zinc-400">Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 bg-white border border-zinc-200 rounded text-[10px] font-bold text-zinc-500 shadow-sm">ENTER</kbd>
                  <span className="text-[10px] font-medium text-zinc-400">Select</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium text-zinc-400">Search powered by</span>
                <span className="text-[10px] font-bold text-emerald-600">EMIS Intelligence</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
