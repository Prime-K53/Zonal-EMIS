import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogOut, 
  School as SchoolIcon, 
  Users, 
  FileText, 
  Settings as SettingsIcon, 
  LayoutDashboard,
  ClipboardList,
  History,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Archive,
  Edit3,
  Search,
  Filter,
  ChevronRight,
  UserCircle,
  User,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  GraduationCap,
  ClipboardCheck,
  X,
  UserPlus,
  Building2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  Legend,
  AreaChart,
  Area
} from 'recharts';
import { Submission, User as AppUser, SubmissionAuditLog, School, Teacher, DailyAttendance, EnrollmentStats, ExaminationResult, ContinuousAssessment, Inspection, Resource } from '../types';
import { dataService } from '../services/dataService';
import { SubmissionReview } from './SubmissionReview';
import { DataEntry } from './DataEntry';
import { Button } from './Button';
import { Input } from './Input';
import { Card } from './Card';
import { SchoolRegistry } from './SchoolRegistry';
import { TeacherRegistry } from './TeacherRegistry';
import { Reports } from './Reports';
import { Settings } from './Settings';
import { cn } from '../lib/utils';

type View = 'dashboard' | 'schools' | 'teachers' | 'records' | 'reports' | 'users' | 'audit' | 'settings' | 'data_entry' | 'edit_record';

interface DashboardProps {
  view?: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ view }) => {
  const { user, loading: authLoading, logout } = useAuth();
  const [internalView, setInternalView] = useState<View | null>(null);
  const [recordsSubTab, setRecordsSubTab] = useState<'view' | 'entry'>('view');
  const [initialDataEntryTab, setInitialDataEntryTab] = useState<any>('daily');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendance[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats[]>([]);
  const [examinationResults, setExaminationResults] = useState<ExaminationResult[]>([]);
  const [continuousAssessments, setContinuousAssessments] = useState<ContinuousAssessment[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Map global tabs to internal views
  const mappedView = (view === 'users-management' ? 'users' : view === 'audit-logs' ? 'audit' : view === 'submissions' ? 'records' : view) as View;
  const activeView = internalView || mappedView || 'dashboard';
  
  const setActiveView = (v: View) => setInternalView(v);

  const handleNewEntry = (tab?: any) => {
    if (tab) {
      setInitialDataEntryTab(tab);
      setActiveView('data_entry');
    } else {
      setActiveView('records');
      setRecordsSubTab('entry');
    }
  };

  const isTDC = user?.role === 'TDC_OFFICER' || user?.role === 'ADMIN';

  const fetchSubmissions = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await dataService.getSubmissions();
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to fetch records', err);
      setError('Failed to load records');
      toast.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    fetchSubmissions();
    const unsubscribeTeachers = dataService.subscribeToTeachers((data) => {
      setTeachers(data);
    });
    const unsubscribeSchools = dataService.subscribeToSchools((data) => {
      setSchools(data);
    });
    const unsubscribeAttendance = dataService.subscribeToDailyAttendance(30, (data) => {
      setAttendanceRecords(data);
    });
    const unsubscribeEnrollment = dataService.subscribeToEnrollmentStats((data) => {
      setEnrollmentStats(data);
    });
    const unsubscribeExams = dataService.subscribeToExaminationResults((data) => {
      setExaminationResults(data);
    });
    const unsubscribeCA = dataService.subscribeToContinuousAssessments((data) => {
      setContinuousAssessments(data);
    });
    const unsubscribeInspections = dataService.subscribeToInspections((data) => {
      setInspections(data);
    });
    const unsubscribeResources = dataService.subscribeToResources((data) => {
      setResources(data);
    });
    return () => {
      unsubscribeTeachers();
      unsubscribeSchools();
      unsubscribeAttendance();
      unsubscribeEnrollment();
      unsubscribeExams();
      unsubscribeCA();
      unsubscribeInspections();
      unsubscribeResources();
    };
  }, [user, authLoading]);

  // Reset internal view when global view changes
  useEffect(() => {
    setInternalView(null);
  }, [view]);

  if (authLoading) return null;
  if (!user) return null;

  const handleReview = (id: string) => {
    setSelectedSubmissionId(id);
    setActiveView('edit_record');
  };

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredSubmissions = (submissions || []).filter(s => {
    if (!s) return false;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const schoolId = (s.schoolId || '').toString();
    const type = (s.type || '').toString();
    const safeSearchTerm = (searchTerm || '').toString().toLowerCase();
    
    const matchesSearch = schoolId.toLowerCase().includes(safeSearchTerm) || 
                         type.toLowerCase().includes(safeSearchTerm);
    return matchesStatus && matchesSearch;
  });

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <DashboardOverview 
            submissions={submissions} 
            teachers={teachers}
            schools={schools}
            attendanceRecords={attendanceRecords}
            enrollmentStats={enrollmentStats}
            examinationResults={examinationResults}
            continuousAssessments={continuousAssessments}
            inspections={inspections}
            resources={resources}
            isTDC={isTDC} 
            user={user} 
            onNewEntry={handleNewEntry}
            onEditRecord={handleReview}
            onViewAllRecords={() => setActiveView('records')}
            onViewAllSchools={() => setActiveView('schools')}
            onViewAllTeachers={() => setActiveView('teachers')}
            onViewAllReports={() => setActiveView('reports')}
          />
        );
      case 'users':
        return isTDC ? <UserManagement /> : (
          <DashboardOverview 
            submissions={submissions} 
            teachers={teachers} 
            schools={schools}
            attendanceRecords={attendanceRecords}
            enrollmentStats={enrollmentStats}
            examinationResults={examinationResults}
            continuousAssessments={continuousAssessments}
            inspections={inspections}
            resources={resources}
            isTDC={isTDC} 
            user={user} 
            onNewEntry={handleNewEntry} 
            onEditRecord={handleReview} 
            onViewAllRecords={() => setActiveView('records')} 
            onViewAllSchools={() => setActiveView('schools')}
            onViewAllTeachers={() => setActiveView('teachers')}
            onViewAllReports={() => setActiveView('reports')}
          />
        );
      case 'audit':
        return isTDC ? <AuditLogs /> : (
          <DashboardOverview 
            submissions={submissions} 
            teachers={teachers} 
            schools={schools}
            attendanceRecords={attendanceRecords}
            enrollmentStats={enrollmentStats}
            examinationResults={examinationResults}
            continuousAssessments={continuousAssessments}
            inspections={inspections}
            resources={resources}
            isTDC={isTDC} 
            user={user} 
            onNewEntry={handleNewEntry} 
            onEditRecord={handleReview} 
            onViewAllRecords={() => setActiveView('records')} 
            onViewAllSchools={() => setActiveView('schools')}
            onViewAllTeachers={() => setActiveView('teachers')}
            onViewAllReports={() => setActiveView('reports')}
          />
        );
      case 'data_entry':
        return (
          <DataEntry 
            onCancel={() => setActiveView('records')} 
            onSuccess={() => {
              setActiveView('records');
              setRecordsSubTab('view');
              fetchSubmissions();
            }} 
            initialTab={initialDataEntryTab}
          />
        );
      case 'edit_record':
        return selectedSubmissionId ? (
          <SubmissionReview 
            submissionId={selectedSubmissionId}
            onBack={() => {
              setActiveView('dashboard');
              setSelectedSubmissionId(null);
            }}
            onUpdate={() => {
              setActiveView('dashboard');
              setSelectedSubmissionId(null);
              fetchSubmissions();
            }}
          />
        ) : null;
      case 'schools':
        return <SchoolRegistry />;
      case 'teachers':
        return <TeacherRegistry />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      case 'records':
        return (
          <div className="p-10 bg-[#fafafa] min-h-screen">
            <header className="mb-12">
              <h2 className="text-5xl font-black text-[#1a1a1a] mb-2 tracking-tighter">Records Management</h2>
              <p className="text-[#5A5A40]/60 italic font-serif text-lg">View and manage all manually entered educational data.</p>
            </header>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
              <div className="flex gap-8 border-b border-[#5A5A40]/10 grow md:grow-0">
                <button 
                  onClick={() => setRecordsSubTab('view')}
                  className={cn(
                    "pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4",
                    recordsSubTab === 'view' ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#5A5A40]/40"
                  )}
                >
                  Master Table
                </button>
                <button 
                  onClick={() => setRecordsSubTab('entry')}
                  className={cn(
                    "pb-4 px-2 text-sm font-black uppercase tracking-widest transition-all border-b-4",
                    recordsSubTab === 'entry' ? "border-[#1a1a1a] text-[#1a1a1a]" : "border-transparent text-[#5A5A40]/40"
                  )}
                >
                  Direct Entry
                </button>
              </div>

              {recordsSubTab === 'view' && (
                <div className="flex flex-wrap gap-4 items-center">
                  <div className="relative min-w-[240px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input 
                      type="text" 
                      placeholder="Search by school or type..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-6 py-3 bg-white border border-zinc-200 rounded-2xl text-sm focus:outline-none focus:ring-4 focus:ring-zinc-100 transition-all font-sans"
                    />
                  </div>
                  
                  <div className="flex items-center gap-2 bg-white border border-zinc-200 p-1.5 rounded-2xl shadow-sm">
                    {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((status) => (
                      <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          statusFilter === status 
                            ? "bg-[#1a1a1a] text-white shadow-lg shadow-zinc-200" 
                            : "text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {recordsSubTab === 'view' ? (
              <div className="bg-white rounded-[32px] shadow-2xl shadow-zinc-100 border border-zinc-100 overflow-hidden animate-in fade-in duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-sans">
                    <thead>
                      <tr className="bg-zinc-50 text-zinc-400 text-[10px] uppercase font-black tracking-[0.2em] border-y border-zinc-100">
                        <th className="px-10 py-6">School ID</th>
                        <th className="px-10 py-6">Record Type</th>
                        <th className="px-10 py-6">HR Alert</th>
                        <th className="px-10 py-6">Update Date</th>
                        <th className="px-10 py-6">Life Status</th>
                        <th className="px-10 py-6 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {filteredSubmissions.length > 0 ? (
                        filteredSubmissions.map((submission) => (
                          <TableRow 
                            key={submission.id}
                            submission={submission}
                            isTDC={isTDC}
                            onReview={handleReview}
                            teachers={teachers}
                          />
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="px-10 py-32 text-center">
                            <div className="flex flex-col items-center gap-6">
                              <div className="bg-zinc-50 p-6 rounded-full">
                                <Search className="w-12 h-12 text-zinc-200" />
                              </div>
                              <div>
                                <p className="text-xl font-black text-zinc-900 mb-1">No matching records found</p>
                                <p className="text-zinc-500 font-serif italic text-sm">Adjust your filters or try a different search term</p>
                              </div>
                              <Button variant="ghost" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>Clear all filters</Button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ModuleCard 
                  icon={<Users className="w-6 h-6" />} 
                  title="Learner Enrollment" 
                  description="Manually update student numbers by standard and gender."
                  count="Last updated: 2 days ago"
                  color="bg-blue-50 text-blue-600"
                  onClick={() => handleNewEntry('monthly')}
                />
                <ModuleCard 
                  icon={<GraduationCap className="w-6 h-6" />} 
                  title="Staff Records" 
                  description="Register new teachers or update existing staff details."
                  count={`${teachers.length} teachers registered`}
                  color="bg-emerald-50 text-emerald-600"
                  onClick={() => handleNewEntry('bulk')}
                />
                <ModuleCard 
                  icon={<ClipboardCheck className="w-6 h-6" />} 
                  title="Attendance Logs" 
                  description="Daily entry of teacher and student attendance rates."
                  count={`${attendanceRecords.length} records this month`}
                  color="bg-amber-50 text-amber-600"
                  onClick={() => handleNewEntry('daily')}
                />
                <ModuleCard 
                  icon={<SchoolIcon className="w-6 h-6" />} 
                  title="School Infrastructure" 
                  description="Record classroom conditions, water, and sanitation status."
                  count={`${schools.length} schools in zone`}
                  color="bg-purple-50 text-purple-600"
                  onClick={() => handleNewEntry('yearly')}
                />
              </div>
            )}
          </div>
        );
      default:
        return (
          <DashboardOverview 
            submissions={submissions} 
            teachers={teachers}
            schools={schools}
            attendanceRecords={attendanceRecords}
            enrollmentStats={enrollmentStats}
            examinationResults={examinationResults}
            continuousAssessments={continuousAssessments}
            inspections={inspections}
            resources={resources}
            isTDC={isTDC} 
            user={user} 
            onNewEntry={handleNewEntry}
            onEditRecord={handleReview}
            onViewAllRecords={() => setActiveView('records')}
            onViewAllSchools={() => setActiveView('schools')}
            onViewAllTeachers={() => setActiveView('teachers')}
            onViewAllReports={() => setActiveView('reports')}
          />
        );
    }
  };

  return (
    <div className="font-serif">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeView}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderView()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const DashboardOverview: React.FC<{ 
  submissions: Submission[]; 
  teachers: Teacher[];
  schools: School[];
  attendanceRecords: DailyAttendance[];
  enrollmentStats: EnrollmentStats[];
  examinationResults: ExaminationResult[];
  continuousAssessments: ContinuousAssessment[];
  inspections: Inspection[];
  resources: Resource[];
  isTDC: boolean; 
  user: any; 
  onNewEntry: (tab?: any) => void;
  onEditRecord: (id: string) => void;
  onViewAllRecords: () => void;
  onViewAllSchools: () => void;
  onViewAllTeachers: () => void;
  onViewAllReports: () => void;
}> = ({ 
  submissions, 
  teachers, 
  schools,
  attendanceRecords, 
  enrollmentStats, 
  examinationResults, 
  continuousAssessments,
  inspections,
  resources,
  isTDC, 
  user, 
  onNewEntry, 
  onEditRecord, 
  onViewAllRecords,
  onViewAllSchools,
  onViewAllTeachers,
  onViewAllReports
}) => {
  const totalEnrollment = React.useMemo(() => {
    if (!enrollmentStats || enrollmentStats.length === 0) return 0;
    // Get latest enrollment for each school
    const latestBySchool: Record<string, EnrollmentStats> = {};
    enrollmentStats.forEach(s => {
      if (!latestBySchool[s.schoolId] || s.academicYear > latestBySchool[s.schoolId].academicYear) {
        latestBySchool[s.schoolId] = s;
      }
    });
    return Object.values(latestBySchool).reduce((acc, curr) => acc + curr.boys + curr.girls, 0);
  }, [enrollmentStats]);

  const avgAttendance = React.useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) return 0;
    const totalRate = attendanceRecords.reduce((acc, curr) => {
      const total = curr.learners.present.boys + curr.learners.present.girls + curr.learners.absent.boys + curr.learners.absent.girls;
      const present = curr.learners.present.boys + curr.learners.present.girls;
      return acc + (present / (total || 1)) * 100;
    }, 0);
    return totalRate / attendanceRecords.length;
  }, [attendanceRecords]);

  const avgPerformance = React.useMemo(() => {
    const examScores = (examinationResults || []).map(r => (r.passed.total / (r.candidates.total || 1)) * 100);
    const caScores = (continuousAssessments || []).map(r => r.passRate);
    const allScores = [...examScores, ...caScores];
    if (allScores.length === 0) return 0;
    return allScores.reduce((acc, curr) => acc + curr, 0) / allScores.length;
  }, [examinationResults, continuousAssessments]);

  const stats = {
    total: (submissions || []).length,
    pending: (submissions || []).filter(s => s.status === 'PENDING').length,
    approved: (submissions || []).filter(s => s.status === 'APPROVED').length,
    rejected: (submissions || []).filter(s => s.status === 'REJECTED').length,
    totalTeachers: (teachers || []).length,
    avgTeachersPerSchool: schools.length > 0 ? ((teachers || []).length / schools.length).toFixed(1) : '0',
    totalLearners: totalEnrollment,
    avgInspectionScore: inspections.length > 0 ? Math.round(inspections.reduce((acc, i) => acc + i.score, 0) / inspections.length) : 0,
    resourceCondition: resources.length > 0 ? Math.round((resources.filter(r => r.condition === 'Good').length / resources.length) * 100) : 100,
    avgAttendance,
    avgPerformance
  };

  const upcomingRetirements = (teachers || []).filter(teacher => {
    if (!teacher.retirementDate) return false;
    const retirementDate = new Date(teacher.retirementDate);
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);
    return retirementDate >= today && retirementDate <= sixMonthsFromNow;
  }).sort((a, b) => new Date(a.retirementDate!).getTime() - new Date(b.retirementDate!).getTime());

  // Process attendance data for the chart
  const attendanceData = React.useMemo(() => {
    if (!attendanceRecords || attendanceRecords.length === 0) {
      return [];
    }

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const records = attendanceRecords.filter(r => r.date === date);
      if (records.length === 0) return { name: days[new Date(date).getDay()], students: 0, teachers: 0 };
      
      const avgStudentRate = records.reduce((acc, curr) => {
        const total = curr.learners.present.boys + curr.learners.present.girls + curr.learners.absent.boys + curr.learners.absent.girls;
        const present = curr.learners.present.boys + curr.learners.present.girls;
        return acc + (present / (total || 1)) * 100;
      }, 0) / records.length;

      const avgTeacherRate = records.reduce((acc, curr) => {
        const total = curr.teachers.present.male + curr.teachers.present.female + curr.teachers.absent.male + curr.teachers.absent.female;
        const present = curr.teachers.present.male + curr.teachers.present.female;
        return acc + (present / (total || 1)) * 100;
      }, 0) / records.length;

      return {
        name: days[new Date(date).getDay()],
        students: Math.round(avgStudentRate),
        teachers: Math.round(avgTeacherRate)
      };
    }).filter(d => d.students > 0 || d.teachers > 0).slice(-5);
  }, [attendanceRecords]);

  const retirementForecastData = React.useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const forecast = [];
    
    for (let i = 0; i < 6; i++) {
      const monthIdx = (currentMonth + i) % 12;
      const monthName = months[monthIdx];
      const year = new Date().getFullYear() + (currentMonth + i >= 12 ? 1 : 0);
      
      const count = (teachers || []).filter(t => {
        if (!t.retirementDate) return false;
        const rd = new Date(t.retirementDate);
        return rd.getMonth() === monthIdx && rd.getFullYear() === year;
      }).length;
      
      forecast.push({ name: monthName, count });
    }
    return forecast;
  }, [teachers]);

  const submissionTrendsData = React.useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const count = (submissions || []).filter(s => s.createdAt.startsWith(date)).length;
      return { name: date.split('-').slice(1).join('/'), count };
    });
  }, [submissions]);

  // Process enrollment data for the chart
  const enrollmentData = React.useMemo(() => {
    if (!enrollmentStats || enrollmentStats.length === 0) {
      return [];
    }

    return enrollmentStats.map(s => ({
      month: s.academicYear,
      primary: s.boys + s.girls,
      secondary: 0 // We don't have secondary data in EnrollmentStats yet
    })).sort((a, b) => a.month.localeCompare(b.month));
  }, [enrollmentStats]);

  const performanceData = React.useMemo(() => {
    if ((!examinationResults || examinationResults.length === 0) && (!continuousAssessments || continuousAssessments.length === 0)) {
      return [];
    }

    const subjects: Record<string, { total: number, count: number }> = {};
    
    continuousAssessments.forEach(ca => {
      if (!subjects[ca.subject]) subjects[ca.subject] = { total: 0, count: 0 };
      subjects[ca.subject].total += ca.avgScore;
      subjects[ca.subject].count += 1;
    });

    return Object.entries(subjects).map(([subject, data]) => ({
      subject,
      score: Math.round(data.total / data.count)
    })).sort((a, b) => b.score - a.score);
  }, [examinationResults, continuousAssessments]);

  return (
    <div className="p-10 space-y-12 bg-[#fafafa]">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-5xl font-black text-[#1a1a1a] mb-3 tracking-tighter">
            TDC EMIS <span className="text-[#5A5A40]/40">Analytics</span>
          </h2>
          <p className="text-[#5A5A40]/60 italic font-serif text-lg">
            Welcome, {user?.name}. You are managing data for {schools.length} schools in your zone.
          </p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => onNewEntry()}
            className="flex items-center gap-3 bg-[#1a1a1a] text-white px-8 py-4 rounded-2xl font-black shadow-2xl shadow-zinc-200 hover:bg-[#333] transition-all active:scale-95"
          >
            <PlusCircle className="w-5 h-5" />
            New Data Entry
          </button>
        </div>
      </header>

      {/* Data Entry Modules */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="h-px bg-[#5A5A40]/10 flex-1"></div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5A5A40]/40">Operational Modules</h3>
          <div className="h-px bg-[#5A5A40]/10 flex-1"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ModuleCard 
            icon={<Clock className="text-emerald-600" size={24} />}
            title="Daily Attendance"
            description="Track learner and teacher daily attendance and reasons for absence."
            count="Daily"
            color="bg-emerald-50"
            onClick={() => onNewEntry('daily')}
          />
          <ModuleCard 
            icon={<Calendar className="text-blue-600" size={24} />}
            title="Weekly Teacher"
            description="Detailed weekly attendance tracking for all active staff members."
            count="Weekly"
            color="bg-blue-50"
            onClick={() => onNewEntry('weekly')}
          />
          <ModuleCard 
            icon={<FileText className="text-purple-600" size={24} />}
            title="Monthly Stats"
            description="Enrolment changes, IFA distribution, and teacher return forms."
            count="Monthly"
            color="bg-purple-50"
            onClick={() => onNewEntry('monthly')}
          />
          <ModuleCard 
            icon={<SchoolIcon className="text-amber-600" size={24} />}
            title="Annual Census"
            description="Comprehensive school infrastructure and materials audit."
            count="Yearly"
            color="bg-amber-50"
            onClick={() => onNewEntry('yearly')}
          />
        </div>
      </section>

      {/* Hero Stats */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <StatCard 
          title="Total Learners" 
          value={stats.totalLearners.toLocaleString()} 
          trend="In Zone Enrollment" 
          icon={<GraduationCap className="text-blue-600" size={24} />} 
          color="bg-blue-50"
        />
        <StatCard 
          title="Teachers in Zone" 
          value={stats.totalTeachers.toString()} 
          trend={`Avg ${stats.avgTeachersPerSchool}/school`} 
          icon={<Users className="text-emerald-600" size={24} />} 
          color="bg-emerald-50"
        />
        <StatCard 
          title="Inspection Performance" 
          value={`${stats.avgInspectionScore}%`} 
          trend="Zone Avg Score" 
          icon={<ClipboardCheck className="text-amber-600" size={24} />} 
          color="bg-amber-50"
        />
        <StatCard 
          title="Resource Health" 
          value={`${stats.resourceCondition}%`} 
          trend="Good Condition" 
          icon={<Building2 className="text-purple-600" size={24} />} 
          color="bg-purple-50"
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Submission Trends */}
        <Card className="lg:col-span-2 p-8 border-none shadow-xl shadow-zinc-100 bg-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-zinc-900 tracking-tight">Submission Activity</h3>
              <p className="text-xs text-zinc-500 font-serif italic">Entries over the last 7 days</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-[#5A5A40]"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reports</span>
              </div>
            </div>
          </div>
           <div className="h-[300px]">
             <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={submissionTrendsData}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#5A5A40" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#5A5A40" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#5A5A40" 
                  strokeWidth={4} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card className="p-8 border-none shadow-xl shadow-zinc-100 bg-zinc-900 text-white">
          <h3 className="text-xl font-black mb-1">Queue Status</h3>
          <p className="text-[10px] uppercase font-black tracking-widest text-zinc-400 mb-8">Submission Lifecycle</p>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-emerald-400">Approved</span>
                <span className="text-lg font-black">{stats.approved}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.approved / (stats.total || 1)) * 100}%` }}
                  className="h-full bg-emerald-400"
                ></motion.div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-amber-400">Pending</span>
                <span className="text-lg font-black">{stats.pending}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(stats.pending / (stats.total || 1)) * 100}%` }}
                  className="h-full bg-amber-400"
                ></motion.div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-end mb-2">
                <span className="text-xs font-black uppercase tracking-widest text-rose-400">Rejected</span>
                <span className="text-lg font-black">{stats.rejected}</span>
              </div>
              <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(stats.rejected / (stats.total || 1)) * 100}%` }}
                  className="h-full bg-rose-400"
                ></motion.div>
              </div>
            </div>
          </div>

          <div className="mt-12 p-6 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-2">Overall Success Rate</p>
            <p className="text-3xl font-black text-white">{Math.round((stats.approved / (stats.total || 1)) * 100)}%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Attendance Chart */}
        <Card className="p-8 border-none shadow-xl shadow-zinc-100 bg-white">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-8">Weekly Attendance Trends</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                  label={{ value: 'Rate %', angle: -90, position: 'insideLeft', style: { fontSize: 10, fontWeight: 700, fill: '#A1A1AA' } }}
                />
                <Tooltip 
                   contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }} 
                />
                <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} name="Learners" />
                <Bar dataKey="teachers" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Retirement Forecast */}
        <Card className="p-8 border-none shadow-xl shadow-zinc-100 bg-white">
          <h3 className="text-xl font-black text-zinc-900 tracking-tight mb-8">HR Retirement Forecast</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={retirementForecastData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1AA' }}
                />
                <Tooltip 
                   contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
                    padding: '12px'
                  }} 
                />
                <Bar dataKey="count" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Retiring Teachers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recent Activity / Table */}
      <section className="bg-white rounded-[32px] shadow-2xl shadow-zinc-100 border border-zinc-100 overflow-hidden">
        <div className="p-10 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-2xl font-black text-[#1a1a1a] tracking-tight mb-1">Recent Submissions</h3>
            <p className="text-sm text-zinc-500 font-serif italic">A summary of the latest manual reports in your TDC pool</p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="text-xs font-black uppercase tracking-widest text-zinc-600 hover:bg-zinc-50 gap-2 border-zinc-200 rounded-xl"
              onClick={onViewAllRecords}
            >
              Master Registry
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-sans">
            <thead>
              <tr className="bg-zinc-50 text-zinc-400 text-[10px] uppercase font-black tracking-[0.2em] border-y border-zinc-100">
                <th className="px-10 py-6">School ID</th>
                <th className="px-10 py-6">Record Type</th>
                <th className="px-10 py-6">HR Alert</th>
                <th className="px-10 py-6">Update Date</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(submissions || []).length > 0 ? (
                (submissions || []).slice(0, 5).map((submission) => (
                  <TableRow 
                    key={submission.id}
                    submission={submission}
                    isTDC={isTDC}
                    onReview={onEditRecord}
                    teachers={teachers}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-zinc-300 italic">
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-lg font-bold">No active submissions found.</p>
                      <Button onClick={() => onNewEntry()} variant="ghost" className="text-emerald-600">Start your first entry</Button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-zinc-50 text-center border-t border-zinc-100">
          <button 
            onClick={onViewAllRecords}
            className="text-zinc-500 text-xs font-black uppercase tracking-widest hover:text-zinc-800 flex items-center gap-2 mx-auto transition-colors"
          >
            View all pool records <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
};

const ModuleCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  count: string;
  color: string;
  onClick: () => void;
}> = ({ icon, title, description, count, color, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-6 rounded-3xl border border-[#5A5A40]/10 shadow-sm hover:border-[#5A5A40]/30 hover:shadow-md transition-all text-left group flex flex-col h-full"
  >
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <h4 className="font-bold text-[#1a1a1a] text-lg mb-2">{title}</h4>
    <p className="text-sm text-[#5A5A40]/60 font-serif italic mb-4 flex-1">{description}</p>
    <div className="pt-4 border-t border-[#5A5A40]/5 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-wider text-[#5A5A40]/40">{count}</span>
      <ChevronRight className="w-4 h-4 text-[#5A5A40]/40 group-hover:translate-x-1 transition-transform" />
    </div>
  </button>
);

const QuickActionCard: React.FC<{ icon: React.ReactNode; title: string; description: string; onClick: () => void }> = ({ icon, title, description, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-white p-5 rounded-2xl border border-[#5A5A40]/10 shadow-sm hover:border-[#5A5A40]/30 hover:shadow-md transition-all text-left group"
  >
    <div className="w-10 h-10 bg-[#f5f5f0] rounded-xl flex items-center justify-center mb-3 group-hover:bg-[#5A5A40] group-hover:text-white transition-colors">
      {icon}
    </div>
    <h4 className="font-bold text-[#1a1a1a] text-sm mb-1">{title}</h4>
    <p className="text-[10px] text-[#5A5A40]/60 font-serif italic">{description}</p>
  </button>
);

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await dataService.getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="p-10">
      <header className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-bold text-[#1a1a1a] mb-2">User Management</h2>
          <p className="text-[#5A5A40]/60 italic font-serif">Manage system users and their assignments.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-[#5A5A40] text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-[#5A5A40]/20 hover:bg-[#4A4A30] transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          Add New User
        </button>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#5A5A40]/10 overflow-hidden">
        <table className="w-full text-left font-sans">
          <thead>
            <tr className="bg-[#f5f5f0]/30 text-[#5A5A40]/60 text-xs uppercase tracking-widest">
              <th className="px-8 py-4 font-semibold">Name</th>
              <th className="px-8 py-4 font-semibold">Email</th>
              <th className="px-8 py-4 font-semibold">Role</th>
              <th className="px-8 py-4 font-semibold">Assigned Schools</th>
              <th className="px-8 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#5A5A40]/5">
            {(users || []).map(u => (
              <tr key={u.id} className="hover:bg-[#f5f5f0]/20 transition-all">
                <td className="px-8 py-5 font-bold text-[#1a1a1a]">{u.name}</td>
                <td className="px-8 py-5 text-[#5A5A40] text-sm">{u.email}</td>
                <td className="px-8 py-5">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold border bg-purple-50 text-purple-600 border-purple-100`}>
                    {u.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-8 py-5 text-[#5A5A40]/60 text-sm">{u.assignedSchools?.length || 0} Schools</td>
                <td className="px-8 py-5 text-right">
                  <button 
                    className="p-2 text-[#5A5A40] hover:bg-[#5A5A40]/10 rounded-lg transition-all"
                    onClick={() => setEditingUser(u)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-zinc-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">Edit User</h3>
                <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
            <form className="p-8 space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as any,
              };
              try {
                await dataService.updateUser(editingUser.id, userData);
                toast.success('User updated successfully');
                setEditingUser(null);
                const updatedUsers = await dataService.getUsers();
                setUsers(updatedUsers);
              } catch (err) {
                toast.error('Failed to update user');
              }
            }}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
                <Input name="name" defaultValue={editingUser.name} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
                <Input name="email" type="email" defaultValue={editingUser.email} required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">System Role</label>
                <select 
                  name="role" 
                  defaultValue={editingUser.role}
                  className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all" 
                  required
                >
                  <option value="SCHOOL_HEAD">School Head</option>
                  <option value="TDC_OFFICER">TDC Officer</option>
                  <option value="DATA_CLERK">Data Clerk</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" className="flex-1 px-6 py-3 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="flex-1 bg-[#5A5A40] text-white px-6 py-3 rounded-xl hover:bg-[#4A4A30] transition-all">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            <div className="p-8 border-b border-zinc-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">Add New User</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-all">
                  <X className="w-5 h-5 text-zinc-400" />
                </button>
              </div>
            </div>
            <form className="p-8 space-y-6" onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const userData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                role: formData.get('role') as any,
                assignedSchools: []
              };
              try {
                await dataService.createUser(userData);
                toast.success('User created successfully');
                setShowAddModal(false);
                const updatedUsers = await dataService.getUsers();
                setUsers(updatedUsers);
              } catch (err) {
                toast.error('Failed to create user');
              }
            }}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
                <Input name="name" placeholder="John Doe" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
                <Input name="email" type="email" placeholder="john@example.com" required />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">System Role</label>
                <select name="role" className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all" required>
                  <option value="SCHOOL_HEAD">School Head</option>
                  <option value="TDC_OFFICER">TDC Officer</option>
                  <option value="DATA_CLERK">Data Clerk</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-[#5A5A40] hover:bg-[#4A4A30]">Create User</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<SubmissionAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await dataService.getAllAuditLogs();
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch audit logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <div className="w-12 h-12 border-4 border-[#5A5A40] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[#5A5A40]/60 italic">Loading audit history...</p>
      </div>
    );
  }

  return (
    <div className="p-10">
      <header className="mb-12">
        <h2 className="text-4xl font-bold text-[#1a1a1a] mb-2">Audit Logs</h2>
        <p className="text-[#5A5A40]/60 italic font-serif">Track all data modifications and system actions.</p>
      </header>

      <div className="bg-white rounded-3xl shadow-sm border border-[#5A5A40]/10 overflow-hidden">
        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#5A5A40]/10 bg-[#f5f5f0]/50">
                  <th className="px-8 py-5 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Timestamp</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Action By</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Submission ID</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-[#5A5A40]/40 uppercase tracking-widest">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#5A5A40]/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#f5f5f0]/30 transition-colors">
                    <td className="px-8 py-5 text-[#5A5A40] text-sm">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-[#5A5A40]/10 rounded-full flex items-center justify-center">
                          <User size={12} className="text-[#5A5A40]" />
                        </div>
                        <span className="text-sm font-bold text-[#1a1a1a]">{log.changedBy}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-[#5A5A40]/60 text-xs font-mono">{log.submissionId}</td>
                    <td className="px-8 py-5 text-[#5A5A40]/80 text-sm italic">"{log.reason}"</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-20 text-center text-[#5A5A40]/40 italic">
            No audit records found. History will appear as data is modified by TDC Officers.
          </div>
        )}
      </div>
    </div>
  );
};

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  title?: string; 
  label?: string; 
  value: string; 
  trend: string; 
  color?: string 
}> = ({ icon, title, label, value, trend, color }) => (
  <motion.div 
    whileHover={{ y: -5 }}
    className={cn("p-6 rounded-3xl border border-[#5A5A40]/10 shadow-sm", color || "bg-white")}
  >
    <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
      {icon}
    </div>
    <p className="text-[10px] uppercase font-black tracking-widest text-[#5A5A40]/60 mb-1">{title || label}</p>
    <h4 className="text-3xl font-black text-[#1a1a1a] mb-2">{value}</h4>
    <p className="text-[10px] text-[#5A5A40]/40 uppercase tracking-widest font-black">{trend}</p>
  </motion.div>
);

const TableRow: React.FC<{ 
  submission: Submission; 
  isTDC: boolean; 
  onReview: (id: string) => void;
  teachers: Teacher[];
}> = ({ submission, isTDC, onReview, teachers }) => {
  const getStatusStyles = (s: string) => {
    switch (s) {
      case 'APPROVED': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'REJECTED': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'PENDING': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'UPDATED_BY_TDC': return 'bg-blue-50 text-blue-600 border-blue-100';
      default: return 'bg-gray-50 text-gray-600 border-gray-100';
    }
  };

  const retiringCount = React.useMemo(() => {
    return (teachers || []).filter(t => {
      if (t.schoolId !== submission.schoolId || !t.retirementDate) return false;
      const retirementDate = new Date(t.retirementDate);
      const today = new Date();
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(today.getMonth() + 6);
      return retirementDate >= today && retirementDate <= sixMonthsFromNow;
    }).length;
  }, [teachers, submission.schoolId]);

  return (
    <tr className="hover:bg-zinc-50/50 transition-all group border-b border-zinc-100 last:border-0 font-sans">
      <td className="px-10 py-6">
        <p className="font-black text-[#1a1a1a] tracking-tight">{submission.schoolId}</p>
        <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-0.5">Report v{submission.version}</p>
      </td>
      <td className="px-10 py-6">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-zinc-600 capitalize">{submission.type.replace(/_/g, ' ')}</span>
          <span className="text-[10px] text-zinc-400 font-serif italic">Manual Submission</span>
        </div>
      </td>
      <td className="px-10 py-6">
        {retiringCount > 0 ? (
          <div className="flex items-center gap-2 text-rose-600 bg-rose-50 px-3 py-1 rounded-full w-fit border border-rose-100">
            <AlertCircle size={10} className="fill-rose-600 text-white" />
            <span className="text-[10px] font-black uppercase tracking-widest">{retiringCount} Retiring</span>
          </div>
        ) : (
          <span className="text-[10px] text-zinc-300 font-black uppercase tracking-widest">Clear</span>
        )}
      </td>
      <td className="px-10 py-6 text-zinc-500 text-sm font-medium">
        {new Date(submission.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
      </td>
      <td className="px-10 py-6">
        <div className={cn(
          "px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] w-fit border",
          getStatusStyles(submission.status)
        )}>
          {submission.status.replace(/_/g, ' ')}
        </div>
      </td>
      <td className="px-10 py-6 text-right">
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
          <button 
            onClick={() => onReview(submission.id)}
            className="p-3 text-zinc-400 hover:text-[#1a1a1a] hover:bg-zinc-100 rounded-2xl transition-all" 
            title="Review Details"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
