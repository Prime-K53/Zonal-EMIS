import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Save, 
  X, 
  Calendar,
  FileText,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  ChevronRight,
  Loader2,
  MessageSquare,
  ClipboardList,
  Download,
  Link as LinkIcon
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { SMCMeeting, School } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const SMCMeetingModule = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<SMCMeeting[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<SMCMeeting | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');

  // Form State
  const [formData, setFormData] = useState<Partial<SMCMeeting>>({
    date: new Date().toISOString().split('T')[0],
    type: 'Regular',
    attendeesCount: 0,
    agenda: [],
    resolutions: [],
    nextMeetingDate: '',
    minutesUrl: ''
  });

  const [newAgendaItem, setNewAgendaItem] = useState('');
  const [newResolution, setNewResolution] = useState('');

  useEffect(() => {
    const unsubMeetings = dataService.subscribeToSMCMeetings(setMeetings);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    setLoading(false);

    return () => {
      unsubMeetings();
      unsubSchools();
    };
  }, []);

  const handleAddAgenda = () => {
    if (!newAgendaItem) return;
    setFormData(prev => ({
      ...prev,
      agenda: [...(prev.agenda || []), newAgendaItem]
    }));
    setNewAgendaItem('');
  };

  const handleAddResolution = () => {
    if (!newResolution) return;
    setFormData(prev => ({
      ...prev,
      resolutions: [...(prev.resolutions || []), newResolution]
    }));
    setNewResolution('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.date || !formData.agenda?.length) return;

    try {
      await dataService.addSMCMeeting({
        ...formData,
        schoolId: schools[0]?.id || '', // In a real app, this would be the user's school
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        id: crypto.randomUUID()
      } as SMCMeeting);
      setShowAddModal(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        type: 'Regular',
        attendeesCount: 0,
        agenda: [],
        resolutions: [],
        nextMeetingDate: '',
        minutesUrl: ''
      });
    } catch (error) {
      console.error('Error adding SMC meeting:', error);
    }
  };

  const filteredMeetings = meetings.filter(m => {
    const matchesSearch = m.type.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.agenda.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'All' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const meetingTypes = ['Regular', 'Emergency', 'Annual General', 'PTA'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">SMC Meetings</h1>
          <p className="text-zinc-500">Record and track School Management Committee meetings</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus size={18} />
          New Meeting
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Total Meetings</p>
            <p className="text-xl font-bold text-zinc-900">{meetings.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Resolutions</p>
            <p className="text-xl font-bold text-zinc-900">
              {meetings.reduce((acc, curr) => acc + curr.resolutions.length, 0)}
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by agenda or type..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="All">All Types</option>
            {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeetings.map((meeting) => (
          <Card key={meeting.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedMeeting(meeting)}>
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 rounded-md bg-blue-100 text-blue-700 text-xs font-bold uppercase">
                  {meeting.type}
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {meeting.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">SMC Meeting</h3>
              <p className="text-sm text-zinc-500">{schools.find(s => s.id === meeting.schoolId)?.name || 'Unknown School'}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-zinc-500 uppercase font-bold tracking-wider">Top Agenda Items</p>
                <ul className="space-y-1">
                  {meeting.agenda.slice(0, 2).map((item, idx) => (
                    <li key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                      <ChevronRight size={14} className="text-zinc-300 mt-0.5 shrink-0" />
                      <span className="line-clamp-1">{item}</span>
                    </li>
                  ))}
                  {meeting.agenda.length > 2 && (
                    <li className="text-xs text-zinc-400 italic">+{meeting.agenda.length - 2} more items</li>
                  )}
                </ul>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500 pt-2 border-t border-zinc-50">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {meeting.attendeesCount} Attendees
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {meeting.resolutions.length} Resolutions
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Meeting Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Record SMC Meeting</h2>
                <p className="text-sm text-zinc-500">Document meeting agenda, attendees, and resolutions</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Meeting Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Meeting Type</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                      required
                    >
                      {meetingTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <Input
                    label="Attendees Count"
                    type="number"
                    value={formData.attendeesCount}
                    onChange={(e) => setFormData({ ...formData, attendeesCount: parseInt(e.target.value) })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                      <FileText size={18} className="text-blue-500" />
                      Agenda Items
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add agenda item..."
                        value={newAgendaItem}
                        onChange={(e) => setNewAgendaItem(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddAgenda}>Add</Button>
                    </div>
                    <ul className="space-y-2">
                      {formData.agenda?.map((item, idx) => (
                        <li key={idx} className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-sm text-zinc-700 flex-1">{item}</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, agenda: prev.agenda?.filter((_, i) => i !== idx) }))} className="text-zinc-400 hover:text-rose-500">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                      <CheckCircle2 size={18} className="text-emerald-500" />
                      Resolutions
                    </h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add resolution..."
                        value={newResolution}
                        onChange={(e) => setNewResolution(e.target.value)}
                      />
                      <Button type="button" onClick={handleAddResolution}>Add</Button>
                    </div>
                    <ul className="space-y-2">
                      {formData.resolutions?.map((item, idx) => (
                        <li key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-start gap-3">
                          <CheckCircle2 size={14} className="text-emerald-500 mt-1 shrink-0" />
                          <span className="text-sm text-zinc-700 flex-1">{item}</span>
                          <button type="button" onClick={() => setFormData(prev => ({ ...prev, resolutions: prev.resolutions?.filter((_, i) => i !== idx) }))} className="text-zinc-400 hover:text-rose-500">
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Next Meeting Date"
                    type="date"
                    value={formData.nextMeetingDate}
                    onChange={(e) => setFormData({ ...formData, nextMeetingDate: e.target.value })}
                  />
                  <Input
                    label="Minutes URL / Link (Optional)"
                    placeholder="Link to full minutes document"
                    value={formData.minutesUrl}
                    onChange={(e) => setFormData({ ...formData, minutesUrl: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={!formData.agenda?.length}>Save Meeting Record</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Meeting Minutes</h2>
                <p className="text-sm text-zinc-500">{selectedMeeting.type} • {selectedMeeting.date}</p>
              </div>
              <button onClick={() => setSelectedMeeting(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Attendees</p>
                  <p className="text-2xl font-bold text-zinc-900">{selectedMeeting.attendeesCount}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Resolutions</p>
                  <p className="text-2xl font-bold text-emerald-600">{selectedMeeting.resolutions.length}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Next Meeting</p>
                  <p className="text-lg font-bold text-zinc-900">{selectedMeeting.nextMeetingDate || 'TBD'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <FileText size={18} className="text-blue-500" />
                    Agenda
                  </h3>
                  <ul className="space-y-3">
                    {selectedMeeting.agenda.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-sm text-zinc-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-emerald-500" />
                    Resolutions
                  </h3>
                  <ul className="space-y-3">
                    {selectedMeeting.resolutions.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                          <CheckCircle2 size={12} />
                        </div>
                        <span className="text-sm text-zinc-700 font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {selectedMeeting.minutesUrl && (
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-blue-600" />
                    <div>
                      <p className="text-sm font-bold text-blue-900">Meeting Minutes Document</p>
                      <p className="text-xs text-blue-600">Access the full documentation</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-white border-blue-200 text-blue-600 hover:bg-blue-50" onClick={() => window.open(selectedMeeting.minutesUrl, '_blank')}>
                    <LinkIcon size={14} className="mr-2" />
                    View Document
                  </Button>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button onClick={() => setSelectedMeeting(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
