import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Search, Filter, Plus, BookOpen, Calendar, Users, Clock, MoreVertical, CheckCircle2, PlayCircle, Info, Trash2 } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { TPDProgram } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';

export const TPDRegistry = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [programs, setPrograms] = useState<TPDProgram[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<TPDProgram['status'] | 'All'>('All');
  const [editingProgram, setEditingProgram] = useState<TPDProgram | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<TPDProgram | null>(null);
  const [viewingCurriculum, setViewingCurriculum] = useState(false);
  const [managingParticipants, setManagingParticipants] = useState(false);
  const [newProgram, setNewProgram] = useState<Omit<TPDProgram, 'id' | 'createdAt'>>({
    title: '',
    provider: '',
    date: new Date().toISOString().split('T')[0],
    duration: '',
    targetAudience: '',
    status: 'Upcoming',
    participantsCount: 0,
  });

  useEffect(() => {
    const unsubscribe = dataService.subscribeToTPDPrograms((data) => {
      setPrograms(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addTPDProgram({
        ...newProgram,
        createdAt: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewProgram({
        title: '',
        provider: '',
        date: new Date().toISOString().split('T')[0],
        duration: '',
        targetAudience: '',
        status: 'Upcoming',
        participantsCount: 0,
      });
    } catch (error) {
      console.error('Error adding program:', error);
    }
  };

  const handleEditProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProgram) return;
    try {
      await dataService.updateTPDProgram(editingProgram.id, editingProgram);
      setIsEditModalOpen(false);
      setEditingProgram(null);
    } catch (error) {
      console.error('Error updating program:', error);
    }
  };

   const filteredPrograms = programs.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.provider.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: TPDProgram['status']) => {
    switch (status) {
      case 'Completed': return <CheckCircle2 size={16} className="text-emerald-500" />;
      case 'Ongoing': return <PlayCircle size={16} className="text-blue-500" />;
      case 'Upcoming': return <Calendar size={16} className="text-amber-500" />;
      default: return <Info size={16} className="text-zinc-400" />;
    }
  };

  const getStatusColor = (status: TPDProgram['status']) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Ongoing': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Upcoming': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <Input 
            placeholder="Search programs or providers..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter ?? "All"}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="h-10 pl-3 pr-8 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none cursor-pointer"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', backgroundSize: '1rem' }}
            >
              <option value="All">All Statuses</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>
            {statusFilter !== 'All' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600"
                onClick={() => setStatusFilter('All')}
              >
                Reset
              </Button>
            )}
          </div>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            Add Program
          </Button>
        </div>
      </div>

      {/* Add Program Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Add TPD Program</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleAddProgram} className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Program Title</label>
                <Input 
                  required
                  placeholder="e.g. Digital Literacy for Teachers"
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({ ...newProgram, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Provider</label>
                  <Input 
                    required
                    placeholder="e.g. Ministry of Education"
                    value={newProgram.provider}
                    onChange={(e) => setNewProgram({ ...newProgram, provider: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Date</label>
                  <Input 
                    required
                    type="date"
                    value={newProgram.date}
                    onChange={(e) => setNewProgram({ ...newProgram, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Duration</label>
                  <Input 
                    required
                    placeholder="e.g. 3 Days"
                    value={newProgram.duration}
                    onChange={(e) => setNewProgram({ ...newProgram, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newProgram.status ?? "Upcoming"}
                    onChange={(e) => setNewProgram({ ...newProgram, status: e.target.value as any })}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Target Audience</label>
                <Input 
                  required
                  placeholder="e.g. Primary School Teachers"
                  value={newProgram.targetAudience}
                  onChange={(e) => setNewProgram({ ...newProgram, targetAudience: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Create Program</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Program Modal */}
      {isEditModalOpen && editingProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Edit TPD Program</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleEditProgram} className="space-y-4 p-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Program Title</label>
                <Input 
                  required
                  value={editingProgram.title}
                  onChange={(e) => setEditingProgram({ ...editingProgram, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Provider</label>
                  <Input 
                    required
                    value={editingProgram.provider}
                    onChange={(e) => setEditingProgram({ ...editingProgram, provider: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Date</label>
                  <Input 
                    required
                    type="date"
                    value={editingProgram.date}
                    onChange={(e) => setEditingProgram({ ...editingProgram, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Duration</label>
                  <Input 
                    required
                    value={editingProgram.duration}
                    onChange={(e) => setEditingProgram({ ...editingProgram, duration: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingProgram.status ?? "Upcoming"}
                    onChange={(e) => setEditingProgram({ ...editingProgram, status: e.target.value as any })}
                  >
                    <option value="Upcoming">Upcoming</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Participants</label>
                  <Input 
                    required
                    type="number"
                    min="0"
                    value={editingProgram.participantsCount}
                    onChange={(e) => setEditingProgram({ ...editingProgram, participantsCount: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700 uppercase tracking-wider">Target Audience</label>
                  <Input 
                    required
                    value={editingProgram.targetAudience}
                    onChange={(e) => setEditingProgram({ ...editingProgram, targetAudience: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Update Program</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Curriculum Detail Modal */}
      {viewingCurriculum && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl p-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{selectedProgram.title}</h2>
                  <p className="text-xs text-zinc-500 font-medium">{selectedProgram.provider}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setViewingCurriculum(false)}>✕</Button>
            </div>
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Program Description</h3>
                <p className="text-zinc-600 leading-relaxed text-sm">
                  This training program is designed to enhance the professional capacity of teachers in {selectedProgram.targetAudience.toLowerCase()}. 
                  The {selectedProgram.duration} course covers critical skills and methodologies required for modern educational environments.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-3">Core Curriculum Pillars</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Pedagogical Content Knowledge',
                    'Digital Integration in Classroom',
                    'Student Assessment Strategies',
                    'Inclusive Education Practices',
                    'Classroom Management & Leadership'
                  ].map((pillar, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-zinc-700">{pillar}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-emerald-600 shadow-sm shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Scheduled Date</p>
                  <p className="text-sm font-bold text-emerald-900">
                    {new Date(selectedProgram.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-zinc-100 bg-zinc-50">
              <Button onClick={() => setViewingCurriculum(false)}>Close Details</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Participants Manager Modal */}
      {managingParticipants && selectedProgram && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl p-0 overflow-hidden text-left">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500 text-white flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">Manage Participants</h2>
                  <p className="text-xs text-zinc-500 font-medium">{selectedProgram.title}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setManagingParticipants(false)}>✕</Button>
            </div>
            <div className="p-0">
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                <div className="text-sm font-bold text-zinc-500">
                  Total Participants: <span className="text-zinc-900">{selectedProgram.participantsCount}</span>
                </div>
                <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 h-8">
                  <Plus size={14} />
                  Add Participant
                </Button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-zinc-50 text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100">
                    <tr>
                      <th className="px-6 py-3 text-left">Teacher Name</th>
                      <th className="px-6 py-3 text-left">School</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-zinc-900">Teacher {i + 1}</td>
                        <td className="px-6 py-4 text-xs text-zinc-500 font-medium">Primary School {String.fromCharCode(65 + i)}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase tracking-tight">
                            Confirmed
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex justify-end p-6 border-t border-zinc-100 bg-zinc-50 gap-3">
              <Button variant="outline" onClick={() => setManagingParticipants(false)}>Cancel</Button>
              <Button onClick={() => {
                toast.success('Participant list updated');
                setManagingParticipants(false);
              }}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Programs List */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
            <p>Loading TPD programs...</p>
          </div>
        ) : filteredPrograms.map((program) => (
          <Card key={program.id} className="group hover:border-emerald-500 transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="h-12 w-12 rounded-xl bg-zinc-50 text-zinc-600 flex items-center justify-center">
                <BookOpen size={24} />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className={cn(
                  "px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1.5",
                  getStatusColor(program.status)
                )}>
                  {getStatusIcon(program.status)}
                  {program.status}
                </div>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      setEditingProgram(program);
                      setIsEditModalOpen(true);
                    }}
                  >
                    <MoreVertical size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete ${program.title}?`)) {
                        try {
                          await dataService.deleteTPDProgram(program.id);
                        } catch (error) {
                          console.error('Error deleting TPD program:', error);
                        }
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-zinc-900 mb-1">{program.title}</h3>
            <p className="text-sm text-zinc-500 mb-6">{program.provider}</p>

            <div className="grid grid-cols-2 gap-6 pt-6 border-t border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Date</p>
                  <p className="text-sm font-medium text-zinc-700">{new Date(program.date).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Clock size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duration</p>
                  <p className="text-sm font-medium text-zinc-700">{program.duration}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Users size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Participants</p>
                  <p className="text-sm font-medium text-zinc-700">{program.participantsCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                  <Info size={16} />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Audience</p>
                  <p className="text-sm font-medium text-zinc-700 truncate">{program.targetAudience}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => {
                  setSelectedProgram(program);
                  setViewingCurriculum(true);
                }}
              >
                View Details
              </Button>
              <Button 
                variant="secondary" 
                className="flex-1"
                onClick={() => {
                  setSelectedProgram(program);
                  setManagingParticipants(true);
                }}
              >
                Manage Participants
              </Button>
            </div>
          </Card>
        ))}
      </div>
      {!loading && filteredPrograms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <BookOpen size={48} className="text-zinc-200 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900">No programs found</h3>
          <p className="text-zinc-500">No TPD programs match your search criteria.</p>
        </div>
      )}
    </div>
  );
};
