import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  ClipboardCheck, 
  Search, 
  Filter, 
  Plus, 
  ChevronRight, 
  Star, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  User, 
  School, 
  BookOpen, 
  Layout, 
  Settings,
  MoreVertical,
  Download,
  Loader2,
  XCircle,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { Teacher, School as SchoolType, AdvancedInspection, NESStandard } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

const NES_STANDARDS: Omit<NESStandard, 'id'>[] = [
  { number: 1, title: 'Learning', description: 'Learners make good progress in their learning.', indicators: ['Progress in lessons', 'Attainment in tests', 'Application of skills'] },
  { number: 2, title: 'Teaching', description: 'Teaching is effective and promotes learning.', indicators: ['Subject knowledge', 'Lesson planning', 'Assessment for learning'] },
  { number: 3, title: 'Curriculum', description: 'The curriculum is broad, balanced and relevant.', indicators: ['Coverage of syllabus', 'Co-curricular activities', 'Local relevance'] },
  { number: 4, title: 'Leadership & Management', description: 'Leadership and management are effective.', indicators: ['Vision and direction', 'Staff management', 'Resource management'] },
  { number: 5, title: 'Community Engagement', description: 'The school engages effectively with the community.', indicators: ['PTA/SMC involvement', 'Community support', 'Communication'] },
];

export const AdvancedInspections = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [inspections, setInspections] = useState<AdvancedInspection[]>([]);
  const [nesStandards, setNesStandards] = useState<NESStandard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'All' | 'Operations' | 'Classroom Observation'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInspection, setSelectedInspection] = useState<AdvancedInspection | null>(null);

  const [newInspection, setNewInspection] = useState<Partial<AdvancedInspection>>({
    type: 'Operations',
    date: new Date().toISOString().split('T')[0],
    status: 'Submitted',
    overallScore: 0,
    generalFindings: '',
    recommendations: '',
    actionPlan: []
  });

  useEffect(() => {
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubInspections = dataService.subscribeToAdvancedInspections(setInspections);
    const unsubNES = dataService.subscribeToNESStandards((data) => {
      if (data.length === 0) {
        // Bootstrap NES Standards if none exist
        NES_STANDARDS.forEach(s => dataService.addNESStandard(s));
      }
      setNesStandards(data);
      setLoading(false);
    });

    return () => {
      unsubTeachers();
      unsubSchools();
      unsubInspections();
      unsubNES();
    };
  }, []);

  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInspection.schoolId || !newInspection.type) return;

    const school = schools.find(s => s.id === newInspection.schoolId);
    if (!school) return;

    try {
      await dataService.addAdvancedInspection({
        ...newInspection,
        inspectorId: user?.id || 'unknown',
        inspectorName: user?.name || user?.email || 'Inspector',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as AdvancedInspection);
      
      setShowAddModal(false);
      setNewInspection({
        type: 'Operations',
        date: new Date().toISOString().split('T')[0],
        status: 'Submitted',
        overallScore: 0,
        generalFindings: '',
        recommendations: '',
        actionPlan: []
      });
    } catch (error) {
      console.error("Error adding inspection:", error);
    }
  };

  const filteredInspections = inspections.filter(ins => {
    const school = schools.find(s => s.id === ins.schoolId);
    const matchesSearch = school?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ins.generalFindings.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = activeTab === 'All' || ins.type === activeTab;
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Advanced Inspections</h2>
          <p className="text-sm text-zinc-500">Conduct and manage detailed school operations and NES classroom observations.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={18} />
          New Inspection
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-2xl w-fit">
        {['All', 'Operations', 'Classroom Observation'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-bold transition-all",
              activeTab === tab 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search & Filter */}
      <Card className="p-4 border-zinc-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Search by school name or findings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
        </div>
      </Card>

      {/* Inspections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredInspections.map((ins) => {
          const school = schools.find(s => s.id === ins.schoolId);
          return (
            <Card key={ins.id} className="group hover:shadow-xl transition-all duration-300 border-zinc-100 overflow-hidden">
              <div className={cn(
                "h-2 w-full",
                ins.type === 'Operations' ? "bg-blue-500" : "bg-purple-500"
              )} />
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className={cn(
                    "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest",
                    ins.type === 'Operations' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                  )}>
                    {ins.type}
                  </span>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{ins.date}</span>
                </div>

                <h3 className="text-lg font-bold text-zinc-900 mb-1">{school?.name}</h3>
                <p className="text-xs text-zinc-500 mb-4 flex items-center gap-1">
                  <User size={12} />
                  {ins.inspectorName}
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500">Overall Score</span>
                    <span className="font-black text-zinc-900">{ins.overallScore}%</span>
                  </div>
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all duration-500",
                        ins.overallScore > 80 ? "bg-emerald-500" : ins.overallScore > 60 ? "bg-blue-500" : "bg-amber-500"
                      )} 
                      style={{ width: `${ins.overallScore}%` }} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-zinc-600 line-clamp-2 italic">"{ins.generalFindings}"</p>
                </div>

                <div className="mt-6 pt-6 border-t border-zinc-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-zinc-50 flex items-center justify-center text-zinc-400">
                      <FileText size={16} />
                    </div>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      {ins.actionPlan.length} Actions
                    </span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] font-black uppercase tracking-widest gap-1"
                    onClick={() => setSelectedInspection(ins)}
                  >
                    View Report
                    <ArrowRight size={12} />
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Report Modal */}
      {selectedInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-3xl p-0 animate-in fade-in zoom-in duration-200 h-[90vh] flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50 rounded-t-3xl">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                  <ClipboardCheck size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Inspection Report</h3>
                  <p className="text-xs text-zinc-500 font-medium">Ref: {selectedInspection.id.substring(0, 8).toUpperCase()}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInspection(null)} className="p-2 hover:bg-zinc-100 rounded-full">
                <XCircle size={20} className="text-zinc-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* Report Header */}
              <div className="grid grid-cols-2 gap-8 pb-8 border-b border-zinc-100">
                <div>
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">School Name</label>
                  <p className="text-lg font-bold text-zinc-900">{schools.find(s => s.id === selectedInspection.schoolId)?.name}</p>
                  <p className="text-sm text-zinc-500">{schools.find(s => s.id === selectedInspection.schoolId)?.emisCode}</p>
                </div>
                <div className="text-right">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Inspection Date</label>
                  <p className="text-lg font-bold text-zinc-900">{new Date(selectedInspection.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                  <p className="text-sm text-zinc-500">{selectedInspection.type} Inspection</p>
                </div>
              </div>

              {/* Scores Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-4">Overall Performance Score</label>
                  <div className="flex items-center gap-4">
                    <div className="text-4xl font-black text-emerald-600">{selectedInspection.overallScore}%</div>
                    <div className="flex-1 h-3 bg-zinc-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${selectedInspection.overallScore}%` }} />
                    </div>
                  </div>
                </div>
                <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                  <label className="text-[10px] font-black text-blue-400 uppercase tracking-widest block mb-4">Inspector Details</label>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">{selectedInspection.inspectorName}</p>
                      <p className="text-xs text-blue-600">Ministry Authorized Inspector</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Findings & Recommendations */}
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-600">
                      <AlertCircle size={14} />
                    </div>
                    General Findings
                  </h4>
                  <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100 text-sm text-zinc-600 leading-relaxed italic">
                    "{selectedInspection.generalFindings}"
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <CheckCircle2 size={14} />
                    </div>
                    Inspector Recommendations
                  </h4>
                  <div className="p-5 bg-emerald-50/30 rounded-2xl border border-emerald-100 text-sm text-emerald-800 leading-relaxed">
                    {selectedInspection.recommendations}
                  </div>
                </div>
              </div>

              {/* Action Plan */}
              {selectedInspection.actionPlan.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-4">
                    <div className="h-6 w-6 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
                      <FileText size={14} />
                    </div>
                    Follow-up Action Plan
                  </h4>
                  <div className="space-y-3">
                    {selectedInspection.actionPlan.map((action, idx) => (
                      <div key={idx} className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-2xl shadow-sm">
                        <div className="h-8 w-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 text-xs font-bold font-mono">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-zinc-900">{action.task}</p>
                          <p className="text-xs text-zinc-500">Deadline: {action.deadline} • Responsibility: {action.responsible}</p>
                        </div>
                        <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest">
                          {action.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-100 bg-zinc-50 flex justify-between rounded-b-3xl">
              <Button variant="outline" className="gap-2" onClick={() => window.print()}>
                <Printer size={16} />
                Print PDF
              </Button>
              <Button onClick={() => setSelectedInspection(null)}>Close Report</Button>
            </div>
          </Card>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900">New Advanced Inspection</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                <XCircle size={20} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleAddInspection} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">School</label>
                  <select
                    required
                    value={newInspection.schoolId || ''}
                    onChange={(e) => setNewInspection({ ...newInspection, schoolId: e.target.value })}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="">Select School</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.emisCode})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Inspection Type</label>
                  <select
                    required
                    value={newInspection.type}
                    onChange={(e) => setNewInspection({ ...newInspection, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="Operations">Operations Inspection</option>
                    <option value="Classroom Observation">Classroom Observation (NES)</option>
                    <option value="Follow-up">Follow-up</option>
                    <option value="Special">Special Inspection</option>
                  </select>
                </div>
              </div>

              {newInspection.type === 'Operations' && (
                <div className="space-y-4 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Operations Scoring (0-100)</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Management</label>
                      <Input 
                        type="number" 
                        max={100} 
                        min={0} 
                        onChange={(e) => setNewInspection({
                          ...newInspection,
                          operations: { ...newInspection.operations!, managementScore: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Finance</label>
                      <Input 
                        type="number" 
                        max={100} 
                        min={0} 
                        onChange={(e) => setNewInspection({
                          ...newInspection,
                          operations: { ...newInspection.operations!, financeScore: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Infrastructure</label>
                      <Input 
                        type="number" 
                        max={100} 
                        min={0} 
                        onChange={(e) => setNewInspection({
                          ...newInspection,
                          operations: { ...newInspection.operations!, infrastructureScore: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Records</label>
                      <Input 
                        type="number" 
                        max={100} 
                        min={0} 
                        onChange={(e) => setNewInspection({
                          ...newInspection,
                          operations: { ...newInspection.operations!, recordsScore: parseInt(e.target.value) }
                        })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {newInspection.type === 'Classroom Observation' && (
                <div className="space-y-4 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <h4 className="text-sm font-bold text-purple-900 uppercase tracking-tight">NES Classroom Observation</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">Teacher</label>
                      <select
                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        onChange={(e) => {
                          const teacher = teachers.find(t => t.id === e.target.value);
                          setNewInspection({
                            ...newInspection,
                            classroomObservation: { ...newInspection.classroomObservation!, teacherId: e.target.value }
                          });
                        }}
                      >
                        <option value="">Select Teacher</option>
                        {teachers.filter(t => t.schoolId === newInspection.schoolId).map(t => (
                          <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-purple-700 mb-1">NES Standard</label>
                      <select
                        className="w-full px-4 py-2 bg-white border border-purple-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                        onChange={(e) => {
                          const std = nesStandards.find(s => s.id === e.target.value);
                          setNewInspection({
                            ...newInspection,
                            classroomObservation: { 
                              ...newInspection.classroomObservation!, 
                              nesStandardId: e.target.value,
                              nesStandardTitle: std?.title || ''
                            }
                          });
                        }}
                      >
                        <option value="">Select Standard</option>
                        {nesStandards.map(s => (
                          <option key={s.id} value={s.id}>Standard {s.number}: {s.title}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Overall Score (0-100)</label>
                  <Input
                    type="number"
                    required
                    max={100}
                    min={0}
                    value={newInspection.overallScore}
                    onChange={(e) => setNewInspection({ ...newInspection, overallScore: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Inspection Date</label>
                  <Input
                    type="date"
                    required
                    value={newInspection.date}
                    onChange={(e) => setNewInspection({ ...newInspection, date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">General Findings</label>
                <textarea
                  required
                  value={newInspection.generalFindings}
                  onChange={(e) => setNewInspection({ ...newInspection, generalFindings: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Summary of key findings..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Recommendations</label>
                <textarea
                  required
                  value={newInspection.recommendations}
                  onChange={(e) => setNewInspection({ ...newInspection, recommendations: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Key recommendations for the school..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Inspection Report
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
