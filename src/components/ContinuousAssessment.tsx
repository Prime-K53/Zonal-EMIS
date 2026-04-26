import React, { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Save, 
  X, 
  Download, 
  FileSpreadsheet,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { ContinuousAssessment, School, Teacher } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const ContinuousAssessmentModule = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<ContinuousAssessment[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<ContinuousAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStandard, setFilterStandard] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  // Form State
  const [formData, setFormData] = useState<Partial<ContinuousAssessment>>({
    standard: '',
    subject: '',
    term: 1,
    year: new Date().getFullYear(),
    assessmentType: 'Test',
    date: new Date().toISOString().split('T')[0],
    maxScore: 100,
    results: []
  });

  const [newStudent, setNewStudent] = useState({ name: '', score: 0 });

  useEffect(() => {
    const unsubAssessments = dataService.subscribeToContinuousAssessments(setAssessments);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    setLoading(false);

    return () => {
      unsubAssessments();
      unsubSchools();
      unsubTeachers();
    };
  }, []);

  const handleAddResult = () => {
    if (!newStudent.name) return;
    setFormData(prev => ({
      ...prev,
      results: [...(prev.results || []), { studentName: newStudent.name, score: newStudent.score }]
    }));
    setNewStudent({ name: '', score: 0 });
  };

  const handleRemoveResult = (index: number) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results?.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.standard || !formData.subject || !formData.results?.length) return;

    const avgScore = formData.results.reduce((acc, curr) => acc + curr.score, 0) / formData.results.length;
    const passRate = (formData.results.filter(r => r.score >= (formData.maxScore! / 2)).length / formData.results.length) * 100;

    try {
      await dataService.addContinuousAssessment({
        ...formData,
        schoolId: teachers.find(t => t.email === user?.email)?.schoolId || schools[0]?.id || '',
        teacherId: user?.id || '',
        avgScore,
        passRate,
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ContinuousAssessment);
      setShowAddModal(false);
      setFormData({
        standard: '',
        subject: '',
        term: 1,
        year: new Date().getFullYear(),
        assessmentType: 'Test',
        date: new Date().toISOString().split('T')[0],
        maxScore: 100,
        results: []
      });
    } catch (error) {
      console.error('Error adding assessment:', error);
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = a.subject.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         a.standard.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = filterStandard === 'All' || a.standard === filterStandard;
    const matchesSubject = filterSubject === 'All' || a.subject === filterSubject;
    return matchesSearch && matchesStandard && matchesSubject;
  });

  const standards = ['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'];
  const subjects = ['Chichewa', 'English', 'Mathematics', 'Primary Science', 'Social Studies', 'Life Skills', 'Agriculture', 'Arts'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Continuous Assessment</h1>
          <p className="text-zinc-500">Track student performance and progress</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus size={18} />
          New Assessment
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ClipboardList size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Total Assessments</p>
            <p className="text-xl font-bold text-zinc-900">{assessments.length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Avg. Pass Rate</p>
            <p className="text-xl font-bold text-zinc-900">
              {assessments.length > 0 
                ? (assessments.reduce((acc, curr) => acc + curr.passRate, 0) / assessments.length).toFixed(1)
                : 0}%
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
              placeholder="Search by subject or standard..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterStandard}
            onChange={(e) => setFilterStandard(e.target.value)}
          >
            <option value="All">All Standards</option>
            {standards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="All">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAssessments.map((assessment) => (
          <Card key={assessment.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedAssessment(assessment)}>
            <div className="p-5 border-b border-zinc-100 bg-zinc-50/50">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">
                  {assessment.assessmentType}
                </span>
                <span className="text-xs text-zinc-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {assessment.date}
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900">{assessment.subject}</h3>
              <p className="text-sm text-zinc-500">{assessment.standard} • Term {assessment.term}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Avg Score</p>
                  <p className="text-xl font-bold text-zinc-900">{assessment.avgScore.toFixed(1)}</p>
                </div>
                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Pass Rate</p>
                  <p className={cn(
                    "text-xl font-bold",
                    assessment.passRate >= 70 ? "text-emerald-600" : assessment.passRate >= 40 ? "text-amber-600" : "text-rose-600"
                  )}>{assessment.passRate.toFixed(1)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                  <Users size={14} />
                  {assessment.results.length} Students
                </span>
                <span className="flex items-center gap-1">
                  Max: {assessment.maxScore}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Assessment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">New Continuous Assessment</h2>
                <p className="text-sm text-zinc-500">Record student marks for a specific subject</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Standard</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.standard}
                      onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                      required
                    >
                      <option value="">Select Standard</option>
                      {standards.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Subject</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      required
                    >
                      <option value="">Select Subject</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Assessment Type</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.assessmentType}
                      onChange={(e) => setFormData({ ...formData, assessmentType: e.target.value as any })}
                      required
                    >
                      <option value="Test">Test</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Project">Project</option>
                      <option value="Practical">Practical</option>
                      <option value="Mid-Term">Mid-Term</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Input
                    label="Term"
                    type="number"
                    min={1}
                    max={3}
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: parseInt(e.target.value) as any })}
                    required
                  />
                  <Input
                    label="Max Score"
                    type="number"
                    value={formData.maxScore}
                    onChange={(e) => setFormData({ ...formData, maxScore: parseInt(e.target.value) })}
                    required
                  />
                  <Input
                    label="Date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Users size={18} className="text-emerald-500" />
                    Student Results
                  </h3>
                  
                  <div className="flex gap-4 p-4 bg-emerald-50/50 rounded-xl border border-emerald-100">
                    <div className="flex-1">
                      <Input
                        placeholder="Student Name"
                        value={newStudent.name}
                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                      />
                    </div>
                    <div className="w-32">
                      <Input
                        placeholder="Score"
                        type="number"
                        value={newStudent.score}
                        onChange={(e) => setNewStudent({ ...newStudent, score: parseInt(e.target.value) })}
                      />
                    </div>
                    <Button type="button" onClick={handleAddResult} className="mt-6">
                      Add
                    </Button>
                  </div>

                  <div className="border border-zinc-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50">
                        <tr>
                          <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase">Student Name</th>
                          <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase">Score</th>
                          <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase">Status</th>
                          <th className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {formData.results?.map((result, idx) => (
                          <tr key={idx}>
                            <td className="px-4 py-3 text-sm font-medium text-zinc-900">{result.studentName}</td>
                            <td className="px-4 py-3 text-sm text-zinc-600">{result.score} / {formData.maxScore}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                result.score >= (formData.maxScore! / 2) ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {result.score >= (formData.maxScore! / 2) ? 'Pass' : 'Fail'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <button type="button" onClick={() => handleRemoveResult(idx)} className="text-zinc-400 hover:text-rose-500 transition-colors">
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {!formData.results?.length && (
                          <tr>
                            <td colSpan={4} className="px-4 py-8 text-center text-zinc-500 italic">
                              No results added yet. Use the form above to add students.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit" disabled={!formData.results?.length}>Save Assessment</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* View Details Modal */}
      {selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">{selectedAssessment.subject} Details</h2>
                <p className="text-sm text-zinc-500">{selectedAssessment.standard} • Term {selectedAssessment.term} • {selectedAssessment.date}</p>
              </div>
              <button onClick={() => setSelectedAssessment(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Avg Score</p>
                  <p className="text-2xl font-bold text-zinc-900">{selectedAssessment.avgScore.toFixed(1)}</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Pass Rate</p>
                  <p className="text-2xl font-bold text-emerald-600">{selectedAssessment.passRate.toFixed(1)}%</p>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-center">
                  <p className="text-xs text-zinc-500 mb-1 uppercase font-bold tracking-wider">Students</p>
                  <p className="text-2xl font-bold text-zinc-900">{selectedAssessment.results.length}</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-zinc-900">Student Breakdown</h3>
                <div className="border border-zinc-100 rounded-xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">Student</th>
                        <th className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">Score</th>
                        <th className="px-4 py-2 text-xs font-bold text-zinc-500 uppercase">Performance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-50">
                      {selectedAssessment.results.map((r, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm text-zinc-900">{r.studentName}</td>
                          <td className="px-4 py-2 text-sm text-zinc-600">{r.score} / {selectedAssessment.maxScore}</td>
                          <td className="px-4 py-2">
                            <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={cn(
                                  "h-full rounded-full",
                                  (r.score / selectedAssessment.maxScore) >= 0.7 ? "bg-emerald-500" : (r.score / selectedAssessment.maxScore) >= 0.4 ? "bg-amber-500" : "bg-rose-500"
                                )}
                                style={{ width: `${(r.score / selectedAssessment.maxScore) * 100}%` }}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button onClick={() => setSelectedAssessment(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
