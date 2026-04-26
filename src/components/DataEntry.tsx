import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { 
  Clock, 
  Calendar, 
  Layers, 
  Archive, 
  Plus, 
  Save, 
  X, 
  CheckCircle2, 
  AlertCircle,
  School as SchoolIcon,
  Users,
  FileText,
  ClipboardCheck,
  TrendingUp,
  ChevronRight,
  Search,
  Upload,
  FileSpreadsheet,
  Download,
  Loader2,
  History as HistoryIcon,
  PlusCircle,
  ArrowLeft,
  MessageSquare,
  Edit3
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { School, Teacher, DailyAttendance, MonthlyEnrolment, IFAReport, TeachersReturn, TermlyReport, AnnualCensus, Submission } from '../types';
import { useAuth } from '../context/AuthContext';
import { parseISO, format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { cn } from '../lib/utils';

type EntryType = 'daily' | 'weekly' | 'monthly' | 'termly' | 'yearly' | 'bulk' | 'history';

interface DataEntryProps {
  onCancel?: () => void;
  onSuccess?: () => void;
  initialTab?: EntryType;
}

export const DataEntry: React.FC<DataEntryProps> = ({ onCancel, onSuccess, initialTab }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<EntryType>(initialTab || 'daily');
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initial States
  const initialDailyForm: Partial<DailyAttendance> = {
    date: new Date().toISOString().split('T')[0],
    learners: {
      present: { boys: 0, girls: 0 },
      absent: { boys: 0, girls: 0 },
      reasons: {}
    },
    teachers: {
      present: { male: 0, female: 0 },
      absent: { male: 0, female: 0 },
      onLeave: 0,
      late: 0
    }
  };

  const initialWeeklyTeacherReport = {
    weekStartDate: format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    teachers: [] as {
      teacherId: string;
      name: string;
      attendance: { [key: string]: 'Present' | 'Absent' | 'Leave' | 'Late' };
    }[]
  };

  const initialMonthlyEnrolment: Partial<MonthlyEnrolment> = {
    month: new Date().toISOString().slice(0, 7),
    enrolment: {},
    newAdmissions: 0,
    transfersIn: 0,
    transfersOut: 0,
    dropouts: { boys: 0, girls: 0, reasons: {} }
  };

  const initialIfaReport: Partial<IFAReport> = {
    month: new Date().toISOString().slice(0, 7),
    girls6to9: { received: 0, target: 0 },
    boys6to12: { received: 0, target: 0 },
    girls10to12: { received: 0, target: 0 },
    stockBalance: 0,
    remarks: ''
  };

  const initialTeachersReturn: Partial<TeachersReturn> = {
    month: new Date().toISOString().slice(0, 7),
    teachers: []
  };

  const initialTermlyReport: Partial<TermlyReport> = {
    term: 1,
    year: new Date().getFullYear(),
    academicPerformance: [],
    activities: [],
    challenges: []
  };

  const initialAnnualCensus: Partial<AnnualCensus> = {
    year: new Date().getFullYear(),
    infrastructure: {
      classrooms: { good: 0, fair: 0, poor: 0 },
      toilets: { boys: 0, girls: 0, teachers: 0 },
      houses: 0
    },
    materials: {
      desks: 0,
      textbooks: 0
    },
    staffing: {
      qualified: 0,
      unqualified: 0
    }
  };

  // Form States
  const [dailyForm, setDailyForm] = useState<Partial<DailyAttendance>>(initialDailyForm);
  const [weeklyForm, setWeeklyForm] = useState(initialWeeklyTeacherReport);
  const [monthlyType, setMonthlyType] = useState<'enrolment' | 'ifa' | 'return'>('enrolment');
  const [monthlyEnrolment, setMonthlyEnrolment] = useState<Partial<MonthlyEnrolment>>(initialMonthlyEnrolment);
  const [ifaReport, setIfaReport] = useState<Partial<IFAReport>>(initialIfaReport);
  const [teachersReturn, setTeachersReturn] = useState<Partial<TeachersReturn>>(initialTeachersReturn);
  const [termlyReport, setTermlyReport] = useState<Partial<TermlyReport>>(initialTermlyReport);
  const [annualCensus, setAnnualCensus] = useState<Partial<AnnualCensus>>(initialAnnualCensus);

  const [bulkType, setBulkType] = useState<'teachers' | 'schools'>('teachers');
  const [csvData, setCsvData] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [viewingSubmissionId, setViewingSubmissionId] = useState<string | null>(null);

  // Draft Preservation Logic
  useEffect(() => {
    const draft = localStorage.getItem(`emis_data_entry_draft_${activeTab}`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (activeTab === 'daily') setDailyForm(prev => ({ ...prev, ...parsed }));
        if (activeTab === 'weekly') setWeeklyForm(prev => ({ ...prev, ...parsed }));
        if (activeTab === 'monthly') {
           if (monthlyType === 'enrolment') setMonthlyEnrolment(prev => ({ ...prev, ...parsed }));
           if (monthlyType === 'ifa') setIfaReport(prev => ({ ...prev, ...parsed }));
           if (monthlyType === 'return') setTeachersReturn(prev => ({ ...prev, ...parsed }));
        }
        if (activeTab === 'termly') setTermlyReport(prev => ({ ...prev, ...parsed }));
        if (activeTab === 'yearly') setAnnualCensus(prev => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
    setIsDraftLoaded(true);
    
    // Fetch submissions for history tab
    dataService.getSubmissions().then(setSubmissions).catch(console.error);
  }, [activeTab]);

  useEffect(() => {
    if (!isDraftLoaded) return;
    const currentForm = activeTab === 'daily' ? dailyForm :
                      activeTab === 'weekly' ? weeklyForm :
                      activeTab === 'monthly' ? (monthlyType === 'enrolment' ? monthlyEnrolment : monthlyType === 'ifa' ? ifaReport : teachersReturn) :
                      activeTab === 'termly' ? termlyReport :
                      activeTab === 'yearly' ? annualCensus : null;
    
    if (currentForm) {
      localStorage.setItem(`emis_data_entry_draft_${activeTab}`, JSON.stringify(currentForm));
    }
  }, [dailyForm, weeklyForm, monthlyEnrolment, ifaReport, teachersReturn, termlyReport, annualCensus, activeTab, monthlyType, isDraftLoaded]);

  const clearDraft = (tab: EntryType) => {
    localStorage.removeItem(`emis_data_entry_draft_${tab}`);
  };

  const selectedSchool = useMemo(() => 
    schools.find(s => s.id === selectedSchoolId),
    [schools, selectedSchoolId]
  );

  useEffect(() => {
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    return () => {
      unsubSchools();
      unsubTeachers();
    };
  }, []);

  useEffect(() => {
    if (selectedSchoolId && activeTab === 'weekly') {
      const schoolTeachers = teachers.filter(t => t.schoolId === selectedSchoolId && t.status === 'Active');
      setWeeklyForm(prev => ({
        ...prev,
        teachers: schoolTeachers.map(t => ({
          teacherId: t.id,
          name: `${t.firstName} ${t.lastName}`,
          attendance: {}
        }))
      }));
    }
  }, [selectedSchoolId, activeTab, teachers]);

  useEffect(() => {
    if (selectedSchoolId && monthlyType === 'return') {
      const schoolTeachers = teachers.filter(t => t.schoolId === selectedSchoolId);
      setTeachersReturn(prev => ({
        ...prev,
        teachers: schoolTeachers.map(t => ({
          teacherId: t.id,
          name: `${t.firstName} ${t.lastName}`,
          sex: t.gender,
          standard: t.professionalInfo?.salaryGrade || t.teachingStandard || '',
          empNo: t.employmentNumber || '',
          dob: t.dateOfBirth,
          regNo: t.registrationNumber || t.tcmRegistrationNumber || '',
          highestQualification: t.qualification,
          dofa: t.dateOfFirstAppointment || '',
          dateOfPresentStandard: t.dateOfPresentStandard || '',
          homeAddress: t.address || '',
          daysPresent: 20, // Default for a month
          daysAbsent: 0,
          remarks: ''
        }))
      }));
    }
  }, [selectedSchoolId, monthlyType, teachers, schools]);

  useEffect(() => {
    if (selectedSchoolId && activeTab === 'daily') {
      const schoolTeachers = teachers.filter(t => t.schoolId === selectedSchoolId && t.status === 'Active');
      const maleCount = schoolTeachers.filter(t => t.gender?.toLowerCase() === 'male').length;
      const femaleCount = schoolTeachers.filter(t => t.gender?.toLowerCase() === 'female').length;
      
      setDailyForm(prev => ({
        ...prev,
        teachers: {
          present: { male: maleCount, female: femaleCount },
          absent: { male: 0, female: 0 },
          onLeave: 0,
          late: 0
        }
      }));
    }
  }, [selectedSchoolId, activeTab, teachers]);

  const checkDuplicate = (type: string, dateOrMonth: string) => {
    return submissions.some(s => 
      s.schoolId === selectedSchoolId && 
      s.type === type && 
      (s.data.date === dateOrMonth || s.data.month === dateOrMonth) &&
      s.status !== 'REJECTED'
    );
  };

  const handleWeeklySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return setError('Please select a school');
    setLoading(true);
    setError(null);
    try {
      // For now, we'll store weekly reports in a new collection or handle them specially
      // Since the dataService might not have addWeeklyTeacherReport, I'll check first
      // Actually, I'll just use a generic submission for now or add it to dataService
      await dataService.addSubmission({
        type: 'weekly_teacher_report',
        schoolId: selectedSchoolId,
        data: weeklyForm,
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString()
      });
      
      setSuccess('Weekly teacher report submitted successfully');
      toast.success('Weekly teacher report submitted successfully');
      clearDraft('weekly');
      setWeeklyForm(initialWeeklyTeacherReport);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit weekly report');
      toast.error('Failed to submit weekly report');
    } finally {
      setLoading(false);
    }
  };

  const renderWeeklyForm = () => {
    const school = selectedSchool;
    const startDate = parseISO(weeklyForm.weekStartDate);
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(startDate, i));

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Week Starting (Monday)</label>
            <Input
              type="date"
              value={weeklyForm.weekStartDate ?? ""}
              onChange={(e) => setWeeklyForm({ ...weeklyForm, weekStartDate: e.target.value })}
              className="rounded-xl border-zinc-200 focus:ring-emerald-500/20"
            />
          </div>
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Selected School</p>
              <p className="text-sm font-black text-zinc-900">{school?.name || 'Please select a school'}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Zone</p>
              <p className="text-sm font-black text-zinc-900">{school?.location?.zone || school?.zone || 'N/A'}</p>
            </div>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-900 text-white">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider border-r border-zinc-800">Teacher Name</th>
                  {weekDays.map((day, i) => (
                    <th key={i} className="px-4 py-4 text-center border-r border-zinc-800 last:border-r-0">
                      <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{format(day, 'EEE')}</span>
                        <span className="text-xs font-bold">{format(day, 'dd/MM')}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {weeklyForm.teachers.map((t, tIdx) => (
                  <tr key={t.teacherId} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4 border-r border-zinc-100">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-zinc-900">{t.name}</span>
                        <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">Active Teacher</span>
                      </div>
                    </td>
                    {weekDays.map((day, dIdx) => {
                      const dateKey = format(day, 'yyyy-MM-dd');
                      const status = t.attendance[dateKey] || 'Present';
                      
                      return (
                        <td key={dIdx} className="p-2 border-r border-zinc-100 last:border-r-0">
                          <div className="relative group/select">
                            <select
                              value={status ?? "Present"}
                              onChange={(e) => {
                                const newTeachers = [...weeklyForm.teachers];
                                newTeachers[tIdx].attendance[dateKey] = e.target.value as any;
                                setWeeklyForm({ ...weeklyForm, teachers: newTeachers });
                              }}
                              className={cn(
                                "w-full p-2.5 text-xs font-black rounded-xl border-none focus:ring-2 outline-none transition-all appearance-none text-center cursor-pointer shadow-sm",
                                status === 'Present' ? "bg-emerald-50 text-emerald-700 ring-emerald-100" :
                                status === 'Absent' ? "bg-red-50 text-red-700 ring-red-100" :
                                status === 'Leave' ? "bg-blue-50 text-blue-700 ring-blue-100" : "bg-amber-50 text-amber-700 ring-amber-100"
                              )}
                            >
                              <option value="Present">P</option>
                              <option value="Absent">A</option>
                              <option value="Leave">L</option>
                              <option value="Late">T</option>
                            </select>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover/select:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
                              {status}
                            </div>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {weeklyForm.teachers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="text-zinc-200" size={48} />
                        <p className="text-sm font-medium text-zinc-400 italic">No active teachers found for this school.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
          <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-emerald-500"></div>
              <span>P: Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>A: Absent</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>L: Leave</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-amber-500"></div>
              <span>T: Late</span>
            </div>
          </div>
          <Button 
            onClick={handleWeeklySubmit} 
            disabled={loading || !selectedSchoolId || weeklyForm.teachers.length === 0}
            className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 h-12 rounded-xl shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Submitting...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save size={18} />
                <span>Submit Weekly Report</span>
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const handleDailySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return setError('Please select a school');

    if (checkDuplicate('daily_attendance', dailyForm.date!)) {
      return setError('A report for this school and date already exists. Check history.');
    }

    setLoading(true);
    setError(null);
    try {
      await dataService.addDailyAttendance({
        ...dailyForm,
        schoolId: selectedSchoolId,
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString()
      } as DailyAttendance);
      setSuccess('Daily attendance submitted successfully');
      toast.success('Daily attendance submitted successfully');
      clearDraft('daily');
      setDailyForm(initialDailyForm);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit daily attendance');
      toast.error('Failed to submit daily attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleMonthlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return setError('Please select a school');

    if (checkDuplicate(monthlyType === 'enrolment' ? 'monthly_enrolment' : monthlyType === 'ifa' ? 'ifa_report' : 'teachers_return', monthlyEnrolment.month! || ifaReport.month! || teachersReturn.month!)) {
      return setError('A report for this school and month already exists. Check history.');
    }

    setLoading(true);
    setError(null);
    try {
      if (monthlyType === 'enrolment') {
        await dataService.addMonthlyEnrolment({
          ...monthlyEnrolment,
          schoolId: selectedSchoolId,
          year: parseInt(monthlyEnrolment.month?.split('-')[0] || '2024'),
          submittedBy: user?.email || 'Unknown',
          createdAt: new Date().toISOString()
        } as MonthlyEnrolment);
        setMonthlyEnrolment(initialMonthlyEnrolment);
      } else if (monthlyType === 'ifa') {
        await dataService.addIFAReport({
          ...ifaReport,
          schoolId: selectedSchoolId,
          year: parseInt(ifaReport.month?.split('-')[0] || '2024'),
          submittedBy: user?.email || 'Unknown',
          createdAt: new Date().toISOString()
        } as IFAReport);
        setIfaReport(initialIfaReport);
      } else {
        await dataService.addTeachersReturn({
          ...teachersReturn,
          schoolId: selectedSchoolId,
          year: parseInt(teachersReturn.month?.split('-')[0] || '2024'),
          submittedBy: user?.email || 'Unknown',
          createdAt: new Date().toISOString()
        } as TeachersReturn);
        setTeachersReturn(initialTeachersReturn);
      }
      setSuccess('Monthly report submitted successfully');
      toast.success('Monthly report submitted successfully');
      clearDraft('monthly');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit monthly report');
      toast.error('Failed to submit monthly report');
    } finally {
      setLoading(false);
    }
  };

  const handleTermlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return setError('Please select a school');
    setLoading(true);
    setError(null);
    try {
      await dataService.addTermlyReport({
        ...termlyReport,
        schoolId: selectedSchoolId,
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString()
      } as TermlyReport);
      setSuccess('Termly report submitted successfully');
      toast.success('Termly report submitted successfully');
      clearDraft('termly');
      setTermlyReport(initialTermlyReport);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit termly report');
      toast.error('Failed to submit termly report');
    } finally {
      setLoading(false);
    }
  };

  const handleYearlySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchoolId) return setError('Please select a school');
    setLoading(true);
    setError(null);
    try {
      await dataService.addAnnualCensus({
        ...annualCensus,
        schoolId: selectedSchoolId,
        submittedBy: user?.email || 'Unknown',
        createdAt: new Date().toISOString()
      } as AnnualCensus);
      setSuccess('Annual census submitted successfully');
      toast.success('Annual census submitted successfully');
      clearDraft('yearly');
      setAnnualCensus(initialAnnualCensus);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to submit annual census');
      toast.error('Failed to submit annual census');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        setCsvData(results.data);
        setSuccess(`Loaded ${results.data.length} records from CSV`);
      },
      error: (err) => {
        setError(`CSV Parse Error: ${err.message}`);
      }
    });
  };

  const handleBulkImport = async () => {
    if (csvData.length === 0) return setError('No data to import');
    setImporting(true);
    setError(null);
    let successCount = 0;
    let failCount = 0;

    try {
      if (bulkType === 'teachers') {
        for (const row of csvData) {
          try {
            if (!row.firstName || !row.lastName || !row.schoolId) {
              failCount++;
              continue;
            }
            await dataService.addTeacher({
              ...row,
              status: 'Active',
              createdAt: new Date().toISOString()
            } as Teacher);
            successCount++;
          } catch (err) {
            failCount++;
          }
        }
      } else {
        for (const row of csvData) {
          try {
            if (!row.name || !row.emisCode) {
              failCount++;
              continue;
            }
            await dataService.addSchool({
              ...row,
              createdAt: new Date().toISOString()
            } as School);
            successCount++;
          } catch (err) {
            failCount++;
          }
        }
      }
      
      if (failCount > 0) {
        setSuccess(`Imported ${successCount} records. ${failCount} records failed.`);
        toast.warning(`Imported ${successCount} records. ${failCount} records failed.`);
      } else {
        setSuccess(`Successfully imported all ${successCount} records.`);
        toast.success(`Successfully imported all ${successCount} records.`);
      }
      setCsvData([]);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('A critical error occurred during import');
      toast.error('A critical error occurred during import');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = bulkType === 'teachers' 
      ? ['firstName', 'lastName', 'email', 'phone', 'schoolId', 'qualification', 'specialization', 'standardLevel']
      : ['name', 'emisCode', 'zone', 'type', 'ownership', 'yearEstablished'];
    
    const csvContent = headers.join(',') + '\n';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bulkType}_template.csv`;
    a.click();
  };

  const renderSchoolSelector = () => (
    <div className="mb-8">
      <label className="block text-sm font-medium text-zinc-700 mb-2">Select School for Data Entry</label>
      <div className="relative">
        <select
          value={selectedSchoolId}
          onChange={(e) => setSelectedSchoolId(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all appearance-none"
        >
          <option value="">Choose a school...</option>
          {schools.map(school => (
            <option key={school.id} value={school.id}>{school.name} ({school.emisCode})</option>
          ))}
        </select>
        <SchoolIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
      </div>
    </div>
  );

  const renderDailyForm = () => (
    <form onSubmit={handleDailySubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white border border-zinc-200 flex items-center justify-center text-emerald-600 shadow-sm">
            <Calendar size={20} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Attendance Date</p>
            <Input
              type="date"
              value={dailyForm.date ?? ""}
              onChange={(e) => setDailyForm({ ...dailyForm, date: e.target.value })}
              className="h-8 border-none bg-transparent p-0 font-black text-zinc-900 focus:ring-0"
            />
          </div>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">School Status</p>
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span>Active Session</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <Users size={20} />
                </div>
                <h3 className="font-black text-zinc-900 tracking-tight">Learner Attendance</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Present</p>
                <p className="text-lg font-black text-emerald-600">{(dailyForm.learners?.present?.boys || 0) + (dailyForm.learners?.present?.girls || 0)}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Boys Present</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.learners?.present?.boys ?? 0}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      learners: {
                        ...dailyForm.learners!,
                        present: { ...dailyForm.learners!.present, boys: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Girls Present</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.learners?.present?.girls ?? 0}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      learners: {
                        ...dailyForm.learners!,
                        present: { ...dailyForm.learners!.present, girls: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-emerald-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Boys Absent</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.learners?.absent?.boys ?? 0}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      learners: {
                        ...dailyForm.learners!,
                        absent: { ...dailyForm.learners!.absent, boys: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-red-500/20 font-bold text-red-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Girls Absent</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.learners?.absent?.girls ?? 0}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      learners: {
                        ...dailyForm.learners!,
                        absent: { ...dailyForm.learners!.absent, girls: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-red-500/20 font-bold text-red-600"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-zinc-200/60 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <ClipboardCheck size={20} />
                </div>
                <h3 className="font-black text-zinc-900 tracking-tight">Teacher Attendance</h3>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Present</p>
                <p className="text-lg font-black text-blue-600">{(dailyForm.teachers?.present?.male || 0) + (dailyForm.teachers?.present?.female || 0)}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Male Present</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.teachers?.present?.male}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      teachers: {
                        ...dailyForm.teachers!,
                        present: { ...dailyForm.teachers!.present, male: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-blue-500/20 font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Female Present</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.teachers?.present?.female}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      teachers: {
                        ...dailyForm.teachers!,
                        present: { ...dailyForm.teachers!.present, female: parseInt(e.target.value) || 0 }
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-blue-500/20 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">On Leave</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.teachers?.onLeave}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      teachers: {
                        ...dailyForm.teachers!,
                        onLeave: parseInt(e.target.value) || 0
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-amber-500/20 font-bold text-amber-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Late Arrivals</label>
                  <Input
                    type="number"
                    min="0"
                    value={dailyForm.teachers?.late}
                    onChange={(e) => setDailyForm({
                      ...dailyForm,
                      teachers: {
                        ...dailyForm.teachers!,
                        late: parseInt(e.target.value) || 0
                      }
                    })}
                    className="rounded-xl border-zinc-200 focus:ring-orange-500/20 font-bold text-orange-600"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Staffing</label>
                  <div className="h-10 px-4 flex items-center bg-zinc-50 border border-zinc-200 rounded-xl font-black text-zinc-600">
                    {teachers.filter(t => t.schoolId === selectedSchoolId && t.status === 'Active').length}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-5 border-zinc-200 bg-zinc-50/50">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Enrollment Reference (Enrolment)</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-zinc-100">
                <span className="text-xs font-bold text-zinc-500">Boys</span>
                <span className="text-sm font-black text-zinc-900">142</span> {/** Hardcoded for prototype or fetched */}
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-zinc-100">
                <span className="text-xs font-bold text-zinc-500">Girls</span>
                <span className="text-sm font-black text-zinc-900">158</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-zinc-100">
                <span className="text-xs font-bold text-zinc-500">Total</span>
                <span className="text-sm font-black text-emerald-600">300</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
              <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Attendance Rate</p>
              <p className="text-2xl font-black">
                {Math.round((((dailyForm.learners?.present?.boys || 0) + (dailyForm.learners?.present?.girls || 0)) / 300) * 100 || 0)}%
              </p>
            </div>

            {(((dailyForm.learners?.present?.boys || 0) + (dailyForm.learners?.present?.girls || 0)) > 300) && (
              <div className="mt-4 p-3 rounded-xl bg-red-100 text-red-700 flex items-start gap-2 border border-red-200">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <p className="text-[10px] font-bold leading-tight">CRITICAL: Attendance exceeds enrollment! Please verify numbers.</p>
              </div>
            )}
          </Card>

          <Card className="p-5 border-zinc-200">
            <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Quick Mark Staff</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {teachers.filter(t => t.schoolId === selectedSchoolId && t.status === 'Active').map(teacher => (
                <div key={teacher.id} className="flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg group transition-colors">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-900 leading-none mb-1">{teacher.firstName} {teacher.lastName}</span>
                    <span className="text-[8px] font-medium text-zinc-400 uppercase">{teacher.gender}</span>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" className="w-6 h-6 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">P</button>
                    <button type="button" className="w-6 h-6 rounded bg-red-50 text-red-600 border border-red-100 text-[10px] font-black flex items-center justify-center hover:bg-red-600 hover:text-white transition-all">A</button>
                  </div>
                </div>
              ))}
              {teachers.filter(t => t.schoolId === selectedSchoolId && t.status === 'Active').length === 0 && (
                <p className="text-[10px] text-zinc-400 italic text-center py-4">No staff records found for this school.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit" 
          disabled={loading || !selectedSchoolId}
          className="bg-zinc-900 hover:bg-zinc-800 text-white px-10 h-12 rounded-xl shadow-xl shadow-zinc-200 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="animate-spin" size={18} />
              <span>Submitting...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Save size={18} />
              <span>Submit Daily Attendance</span>
            </div>
          )}
        </Button>
      </div>
    </form>
  );

  const renderMonthlyForm = () => (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
        {[
          { id: 'enrolment', label: 'Monthly Enrolment', icon: Users },
          { id: 'ifa', label: 'IFA Report', icon: FileText },
          { id: 'return', label: 'Teachers Return', icon: ClipboardCheck }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setMonthlyType(type.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              monthlyType === type.id 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <type.icon size={16} />
            {type.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleMonthlySubmit} className="space-y-6">
        {monthlyType === 'enrolment' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Input
                label="Month"
                type="month"
                value={monthlyEnrolment.month ?? ""}
                onChange={(e) => setMonthlyEnrolment({ ...monthlyEnrolment, month: e.target.value })}
              />
              <Input
                label="New Admissions"
                type="number"
                value={monthlyEnrolment.newAdmissions ?? 0}
                onChange={(e) => setMonthlyEnrolment({ ...monthlyEnrolment, newAdmissions: parseInt(e.target.value) || 0 })}
              />
              <Input
                label="Dropouts (Total)"
                type="number"
                value={(monthlyEnrolment.dropouts?.boys || 0) + (monthlyEnrolment.dropouts?.girls || 0)}
                readOnly
              />
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-zinc-900">Enrolment by Standard</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(standard => (
                  <div key={standard} className="p-3 bg-zinc-50 rounded-lg border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-500 mb-2">{standard}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        placeholder="B"
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                        onChange={(e) => setMonthlyEnrolment({
                          ...monthlyEnrolment,
                          enrolment: {
                            ...monthlyEnrolment.enrolment,
                            [standard]: { boys: parseInt(e.target.value), girls: monthlyEnrolment.enrolment?.[standard]?.girls || 0 }
                          }
                        })}
                      />
                      <input
                        placeholder="G"
                        type="number"
                        className="w-full px-2 py-1 text-xs border border-zinc-200 rounded"
                        onChange={(e) => setMonthlyEnrolment({
                          ...monthlyEnrolment,
                          enrolment: {
                            ...monthlyEnrolment.enrolment,
                            [standard]: { girls: parseInt(e.target.value), boys: monthlyEnrolment.enrolment?.[standard]?.boys || 0 }
                          }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {monthlyType === 'ifa' && (
          <Card className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Input
                label="Month"
                type="month"
                value={ifaReport.month ?? ""}
                onChange={(e) => setIfaReport({ ...ifaReport, month: e.target.value })}
              />
              <Input
                label="Stock Balance (Tablets)"
                type="number"
                value={ifaReport.stockBalance ?? 0}
                onChange={(e) => setIfaReport({ ...ifaReport, stockBalance: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-zinc-900">IFA Distribution Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'girls6to9', label: 'Girls (6-9 yrs)', key: 'girls6to9' },
                  { id: 'boys6to12', label: 'Boys (6-12 yrs)', key: 'boys6to12' },
                  { id: 'girls10to12', label: 'Girls (10-12 yrs)', key: 'girls10to12' }
                ].map(group => (
                  <div key={group.id} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                    <p className="text-xs font-bold text-zinc-500 mb-3">{group.label}</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">Target</label>
                        <Input
                          type="number"
                          value={(ifaReport as any)[group.key]?.target}
                          onChange={(e) => setIfaReport({
                            ...ifaReport,
                            [group.key]: { ...(ifaReport as any)[group.key], target: parseInt(e.target.value) || 0 }
                          })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold text-zinc-400">Received</label>
                        <Input
                          type="number"
                          value={(ifaReport as any)[group.key]?.received}
                          onChange={(e) => setIfaReport({
                            ...ifaReport,
                            [group.key]: { ...(ifaReport as any)[group.key], received: parseInt(e.target.value) || 0 }
                          })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-zinc-700 mb-2">Remarks</label>
              <textarea
                className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
                rows={3}
                value={ifaReport.remarks}
                onChange={(e) => setIfaReport({ ...ifaReport, remarks: e.target.value })}
              />
            </div>
          </Card>
        )}

        {monthlyType === 'return' && (
          <Card className="p-0 overflow-hidden border-zinc-200/60 shadow-sm">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/30">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-zinc-900">Teachers Return</h3>
                  <p className="text-sm text-zinc-500">Monthly staff attendance and record verification</p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                  <div className="w-48">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Reporting Month</label>
                    <Input
                      type="month"
                      value={teachersReturn.month}
                      onChange={(e) => {
                        const month = e.target.value;
                        const date = new Date(month + "-01");
                        const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
                        // Assume 20 working days average or calculate based on weekends
                        const workingDays = Math.min(22, daysInMonth - 8); 
                        
                        const newTeachers = (teachersReturn.teachers || []).map(t => ({
                          ...t,
                          daysPresent: workingDays,
                          daysAbsent: 0
                        }));
                        
                        setTeachersReturn({ 
                          ...teachersReturn, 
                          month,
                          teachers: newTeachers
                        });
                      }}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">District / EMIS</p>
                    <p className="text-sm font-bold text-zinc-700">
                      {(selectedSchool?.location?.district || selectedSchool?.district || 'DEDZA').toUpperCase()} • {selectedSchool?.emisCode || '---'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[1600px]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50 border-b border-zinc-200">
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 w-12 text-center">S/No</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Zone / School</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Officer Details</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 w-16 text-center">Sex</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 w-24">Standard</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Employment</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Dates (DOB/DOFA)</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Qualification</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100">Address</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 w-24 text-center">Present</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-r border-zinc-100 w-24 text-center">Absent</th>
                      <th className="p-3 text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {teachersReturn.teachers?.map((t, idx) => {
                      const school = selectedSchool;
                      return (
                        <tr key={t.teacherId} className="hover:bg-emerald-50/30 transition-colors group">
                          <td className="p-3 text-xs text-zinc-400 text-center border-r border-zinc-50">{idx + 1}</td>
                          <td className="p-3 border-r border-zinc-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-900">{school?.name || 'N/A'}</span>
                              <span className="text-[10px] text-zinc-500 uppercase">{school?.zone || 'N/A'}</span>
                            </div>
                          </td>
                          <td className="p-3 border-r border-zinc-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-900">{t.name}</span>
                              <span className="text-[10px] text-zinc-500 font-mono">Reg: {t.regNo || '---'}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center border-r border-zinc-50">
                            <span className={cn(
                              "inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold",
                              t.sex?.toLowerCase() === 'male' ? "bg-blue-50 text-blue-600" : "bg-pink-50 text-pink-600"
                            )}>
                              {t.sex?.charAt(0)}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-zinc-600 border-r border-zinc-50 font-medium">{t.standard}</td>
                          <td className="p-3 border-r border-zinc-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-zinc-700">{t.empNo}</span>
                              <span className="text-[10px] text-zinc-400 uppercase">Emp Number</span>
                            </div>
                          </td>
                          <td className="p-3 border-r border-zinc-50">
                            <div className="flex flex-col">
                              <span className="text-xs text-zinc-600">B: {t.dob}</span>
                              <span className="text-xs text-zinc-600">A: {t.dofa}</span>
                            </div>
                          </td>
                          <td className="p-3 border-r border-zinc-50">
                            <div className="flex flex-col">
                              <span className="text-xs font-medium text-zinc-700">{t.highestQualification}</span>
                              <span className="text-[10px] text-zinc-400 italic">Std: {t.dateOfPresentStandard}</span>
                            </div>
                          </td>
                          <td className="p-3 border-r border-zinc-50 max-w-[150px] truncate">
                            <span className="text-xs text-zinc-500">{t.homeAddress}</span>
                          </td>
                          <td className="p-3 border-r border-zinc-50">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 text-xs text-center font-bold text-emerald-600 bg-emerald-50/50 border border-emerald-100 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                              value={t.daysPresent ?? 0}
                              onChange={(e) => {
                                const newTeachers = [...teachersReturn.teachers!];
                                newTeachers[idx].daysPresent = parseInt(e.target.value);
                                setTeachersReturn({ ...teachersReturn, teachers: newTeachers });
                              }}
                            />
                          </td>
                          <td className="p-3 border-r border-zinc-50">
                            <input
                              type="number"
                              className="w-full px-2 py-1.5 text-xs text-center font-bold text-red-600 bg-red-50/50 border border-red-100 rounded-lg focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                              value={t.daysAbsent ?? 0}
                              onChange={(e) => {
                                const newTeachers = [...teachersReturn.teachers!];
                                newTeachers[idx].daysAbsent = parseInt(e.target.value);
                                setTeachersReturn({ ...teachersReturn, teachers: newTeachers });
                              }}
                            />
                          </td>
                          <td className="p-3">
                            <input
                              type="text"
                              placeholder="Add remarks..."
                              className="w-full px-2 py-1.5 text-xs bg-transparent border-b border-transparent hover:border-zinc-200 focus:border-emerald-500 outline-none transition-all"
                              value={t.remarks ?? ""}
                              onChange={(e) => {
                                const newTeachers = [...teachersReturn.teachers!];
                                newTeachers[idx].remarks = e.target.value;
                                setTeachersReturn({ ...teachersReturn, teachers: newTeachers });
                              }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 text-[10px] text-zinc-400 italic">
              * This return should be submitted by the 5th of every month. Ensure all details match the teacher's professional records.
            </div>
          </Card>
        )}

        <div className="flex justify-end gap-3">
          <Button className="gap-2" type="submit" disabled={loading}>
            <Save size={18} />
            {loading ? 'Submitting...' : 'Submit Monthly Report'}
          </Button>
        </div>
      </form>
    </div>
  );

  const renderTermlyForm = () => (
    <form onSubmit={handleTermlySubmit} className="space-y-6">
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Term</label>
            <select
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={termlyReport.term}
              onChange={(e) => setTermlyReport({ ...termlyReport, term: parseInt(e.target.value) as any })}
            >
              <option value={1}>Term 1</option>
              <option value={2}>Term 2</option>
              <option value={3}>Term 3</option>
            </select>
          </div>
          <Input
            label="Year"
            type="number"
            value={termlyReport.year ?? new Date().getFullYear()}
            onChange={(e) => setTermlyReport({ ...termlyReport, year: parseInt(e.target.value) || new Date().getFullYear() })}
          />
        </div>

        <div className="space-y-6">
          <h4 className="font-bold text-zinc-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Academic Performance Summary
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map((standard, idx) => (
              <div key={standard} className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-4">
                <span className="text-sm font-bold text-zinc-500 w-24">{standard}</span>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Avg Score %"
                    type="number"
                    onChange={(e) => {
                      const newPerf = [...(termlyReport.academicPerformance || [])];
                      newPerf[idx] = { standard, avgScore: parseInt(e.target.value), passRate: newPerf[idx]?.passRate || 0 };
                      setTermlyReport({ ...termlyReport, academicPerformance: newPerf });
                    }}
                  />
                  <Input
                    placeholder="Pass Rate %"
                    type="number"
                    onChange={(e) => {
                      const newPerf = [...(termlyReport.academicPerformance || [])];
                      newPerf[idx] = { standard, passRate: parseInt(e.target.value), avgScore: newPerf[idx]?.avgScore || 0 };
                      setTermlyReport({ ...termlyReport, academicPerformance: newPerf });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button className="gap-2" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? 'Submitting...' : 'Submit Termly Report'}
        </Button>
      </div>
    </form>
  );

  const renderYearlyForm = () => (
    <form onSubmit={handleYearlySubmit} className="space-y-6">
      <Card className="p-6">
        <div className="mb-8">
          <Input
            label="Census Year"
            type="number"
            value={annualCensus.year ?? new Date().getFullYear()}
            onChange={(e) => setAnnualCensus({ ...annualCensus, year: parseInt(e.target.value) || new Date().getFullYear() })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="font-bold text-zinc-900 flex items-center gap-2">
              <Plus size={18} className="text-emerald-500" />
              Infrastructure Status
            </h4>
            <div className="space-y-4">
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                <p className="text-sm font-medium text-zinc-700 mb-3">Classrooms Condition</p>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label="Good"
                    type="number"
                    onChange={(e) => setAnnualCensus({
                      ...annualCensus,
                      infrastructure: {
                        ...annualCensus.infrastructure!,
                        classrooms: { ...annualCensus.infrastructure!.classrooms, good: parseInt(e.target.value) }
                      }
                    })}
                  />
                  <Input
                    label="Fair"
                    type="number"
                    onChange={(e) => setAnnualCensus({
                      ...annualCensus,
                      infrastructure: {
                        ...annualCensus.infrastructure!,
                        classrooms: { ...annualCensus.infrastructure!.classrooms, fair: parseInt(e.target.value) }
                      }
                    })}
                  />
                  <Input
                    label="Poor"
                    type="number"
                    onChange={(e) => setAnnualCensus({
                      ...annualCensus,
                      infrastructure: {
                        ...annualCensus.infrastructure!,
                        classrooms: { ...annualCensus.infrastructure!.classrooms, poor: parseInt(e.target.value) }
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-bold text-zinc-900 flex items-center gap-2">
              <Archive size={18} className="text-emerald-500" />
              Teaching & Learning Materials
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Total Desks"
                type="number"
                onChange={(e) => setAnnualCensus({
                  ...annualCensus,
                  materials: { ...annualCensus.materials!, desks: parseInt(e.target.value) }
                })}
              />
              <Input
                label="Total Textbooks"
                type="number"
                onChange={(e) => setAnnualCensus({
                  ...annualCensus,
                  materials: { ...annualCensus.materials!, textbooks: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end gap-3">
        <Button className="gap-2" type="submit" disabled={loading}>
          <Save size={18} />
          {loading ? 'Submitting...' : 'Submit Annual Census'}
        </Button>
      </div>
    </form>
  );

  const renderBulkForm = () => (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-zinc-100 rounded-xl w-fit">
        {[
          { id: 'teachers', label: 'Teachers', icon: Users },
          { id: 'schools', label: 'Schools', icon: SchoolIcon }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setBulkType(type.id as any)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              bulkType === type.id 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-900"
            )}
          >
            <type.icon size={16} />
            {type.label}
          </button>
        ))}
      </div>

      <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
          <Upload size={32} />
        </div>
        <h3 className="text-lg font-bold text-zinc-900 mb-2">Bulk Import {bulkType === 'teachers' ? 'Teachers' : 'Schools'}</h3>
        <p className="text-sm text-zinc-500 max-w-sm mb-6">
          Upload a CSV file with the required columns to bulk add multiple records at once.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Button variant="outline" className="gap-2" onClick={downloadTemplate}>
            <Download size={18} />
            Download Template
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".csv"
              className="absolute inset-0 opacity-0 cursor-pointer"
              onChange={handleFileUpload}
            />
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <FileSpreadsheet size={18} />
              Choose CSV File
            </Button>
          </div>
        </div>

        {csvData.length > 0 && (
          <div className="mt-8 w-full">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-zinc-900">Preview: {csvData.length} records found</p>
              <Button 
                className="gap-2" 
                onClick={handleBulkImport}
                disabled={importing}
              >
                {importing ? <Loader2 className="animate-spin" size={18} /> : <CheckCircle2 size={18} />}
                Confirm Import
              </Button>
            </div>
            <div className="overflow-x-auto rounded-xl border border-zinc-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-50 text-zinc-500 uppercase font-black tracking-widest">
                  <tr>
                    {Object.keys(csvData[0]).slice(0, 5).map(key => (
                      <th key={key} className="px-4 py-3">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).slice(0, 5).map((val: any, j) => (
                        <td key={j} className="px-4 py-3 text-zinc-600">{val}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <Card className="p-6 border-zinc-200 shadow-sm bg-zinc-900 text-white overflow-hidden relative">
        <div className="relative z-10">
          <h3 className="text-xl font-black mb-1">Your Submission History</h3>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-widest">Track status of manual educational data entries</p>
          
          <div className="grid grid-cols-3 gap-4 mt-8">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total</p>
              <p className="text-2xl font-black">{submissions.filter(s => s.userId === user?.email || s.data?.submittedBy === user?.email).length}</p>
            </div>
            <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 backdrop-blur-sm">
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Approved</p>
              <p className="text-2xl font-black text-emerald-400">{submissions.filter(s => (s.userId === user?.email || s.data?.submittedBy === user?.email) && s.status === 'APPROVED').length}</p>
            </div>
            <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/20 backdrop-blur-sm">
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Pending</p>
              <p className="text-2xl font-black text-amber-400">{submissions.filter(s => (s.userId === user?.email || s.data?.submittedBy === user?.email) && s.status === 'PENDING').length}</p>
            </div>
          </div>
        </div>
        <HistoryIcon className="absolute bottom-[-20px] right-[-20px] h-64 w-64 text-white/5 rotate-12" />
      </Card>

      <Card className="overflow-hidden border-zinc-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50 text-[10px] uppercase font-black text-zinc-400 tracking-widest border-b border-zinc-100">
                <th className="px-6 py-4">Submission ID</th>
                <th className="px-6 py-4">Report Type</th>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Submitted Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {submissions
                .filter(s => s.userId === user?.email || s.data?.submittedBy === user?.email)
                .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((sub) => (
                  <tr key={sub.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-mono font-bold text-zinc-400">#{sub.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {sub.type === 'daily_attendance' && <Clock size={14} className="text-emerald-500" />}
                        {sub.type === 'monthly_enrolment' && <FileText size={14} className="text-blue-500" />}
                        <span className="text-xs font-black text-zinc-900 capitalize">{sub.type.replace(/_/g, ' ')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-zinc-600">{schools.find(s => s.id === sub.schoolId || s.emisCode === sub.schoolId)?.name || 'Multiple/Direct'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium text-zinc-500">{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={cn(
                          "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider w-fit",
                          sub.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" :
                          sub.status === 'REJECTED' ? "bg-red-50 text-red-600" :
                          "bg-amber-50 text-amber-600"
                        )}>
                          {sub.status}
                        </span>
                        {sub.feedback && <p className="text-[9px] text-zinc-400 italic max-w-[150px] truncate">{sub.feedback}</p>}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-xs font-bold text-emerald-600 hover:bg-emerald-50"
                        onClick={() => setViewingSubmissionId(sub.id)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              {submissions.filter(s => s.userId === user?.email || s.data?.submittedBy === user?.email).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <HistoryIcon className="h-12 w-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-sm font-bold text-zinc-400">No submission history found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Data Entry Portal</h2>
          <p className="text-zinc-500">Submit periodic EMIS reports for schools in your TDC</p>
        </div>
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="gap-2">
            <X size={18} />
            Cancel
          </Button>
        )}
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} />
            <p className="font-medium">{success}</p>
          </div>
          <button onClick={() => setSuccess(null)}><X size={18} /></button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} />
            <p className="font-medium">{error}</p>
          </div>
          <button onClick={() => setError(null)}><X size={18} /></button>
        </div>
      )}

      <div className="flex gap-4 border-b border-zinc-200">
        {[
          { id: 'daily', label: 'Daily', icon: Clock },
          { id: 'weekly', label: 'Weekly', icon: Calendar },
          { id: 'monthly', label: 'Monthly', icon: FileText },
          { id: 'termly', label: 'Termly', icon: TrendingUp },
          { id: 'yearly', label: 'Yearly', icon: SchoolIcon },
          { id: 'bulk', label: 'Bulk Import', icon: Upload },
          { id: 'history', label: 'History', icon: HistoryIcon }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as EntryType);
              setSuccess(null);
              setError(null);
            }}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all border-b-2",
              activeTab === tab.id 
                ? "border-emerald-500 text-emerald-600" 
                : "border-transparent text-zinc-500 hover:text-zinc-900"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-5xl">
        {viewingSubmissionId ? (
          <div className="space-y-6">
            <Button 
              variant="outline" 
              onClick={() => setViewingSubmissionId(null)}
              className="gap-2 mb-4"
            >
              <ArrowLeft size={18} />
              Back to History
            </Button>
            <SubmissionDetailView 
              submissionId={viewingSubmissionId} 
              schools={schools}
              onClose={() => setViewingSubmissionId(null)}
              setActiveTab={setActiveTab}
              setDailyForm={setDailyForm}
              setWeeklyForm={setWeeklyForm}
              setMonthlyType={setMonthlyType}
              setMonthlyEnrolment={setMonthlyEnrolment}
              setIfaReport={setIfaReport}
              setTeachersReturn={setTeachersReturn}
              setTermlyReport={setTermlyReport}
              setAnnualCensus={setAnnualCensus}
              setSelectedSchoolId={setSelectedSchoolId}
              setViewingSubmissionId={setViewingSubmissionId}
            />
          </div>
        ) : (
          <>
            {renderSchoolSelector()}
            
            {activeTab === 'daily' && renderDailyForm()}
            {activeTab === 'weekly' && renderWeeklyForm()}
            {activeTab === 'monthly' && renderMonthlyForm()}
            {activeTab === 'termly' && renderTermlyForm()}
            {activeTab === 'yearly' && renderYearlyForm()}
            {activeTab === 'bulk' && renderBulkForm()}
            {activeTab === 'history' && renderHistory()}
          </>
        )}
      </div>
    </div>
  );
};

const SubmissionDetailView: React.FC<{ 
  submissionId: string; 
  schools: School[];
  onClose: () => void;
  setActiveTab: (t: EntryType) => void;
  setDailyForm: (d: any) => void;
  setWeeklyForm: (d: any) => void;
  setMonthlyType: (d: any) => void;
  setMonthlyEnrolment: (d: any) => void;
  setIfaReport: (d: any) => void;
  setTeachersReturn: (d: any) => void;
  setTermlyReport: (d: any) => void;
  setAnnualCensus: (d: any) => void;
  setSelectedSchoolId: (d: any) => void;
  setViewingSubmissionId: (d: any) => void;
}> = ({ 
  submissionId, 
  schools, 
  onClose,
  setActiveTab,
  setDailyForm,
  setWeeklyForm,
  setMonthlyType,
  setMonthlyEnrolment,
  setIfaReport,
  setTeachersReturn,
  setTermlyReport,
  setAnnualCensus,
  setSelectedSchoolId,
  setViewingSubmissionId
}) => {
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const data = await dataService.getSubmission(submissionId);
        if (data) {
          setSubmission(data);
        }
      } catch (err) {
        console.error('Failed to fetch submission', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [submissionId]);

  if (loading) return <div className="p-12 text-center text-zinc-500 italic">Finding record details...</div>;
  if (!submission) return <div className="p-12 text-center text-red-500 font-bold">Record not found.</div>;

  const school = schools.find(s => s.id === submission.schoolId || s.emisCode === submission.schoolId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="p-8 border-zinc-200">
        <header className="flex justify-between items-start mb-8 pb-6 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-black text-zinc-900 capitalize">{submission.type.replace(/_/g, ' ')}</h3>
              <span className={cn(
                "text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-wider",
                submission.status === 'APPROVED' ? "bg-emerald-50 text-emerald-600" :
                submission.status === 'REJECTED' ? "bg-red-50 text-red-600" :
                "bg-amber-50 text-amber-600"
              )}>
                {submission.status}
              </span>
            </div>
            <p className="text-sm font-bold text-zinc-500">{school?.name || submission.schoolId} • EMIS Code: {school?.emisCode || 'N/A'}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Submission ID</p>
            <p className="text-xs font-mono font-bold text-zinc-900">#{submission.id.toUpperCase()}</p>
          </div>
        </header>

        {submission.feedback && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
            <MessageSquare size={20} className="text-amber-600 shrink-0" />
            <div>
              <p className="text-[10px] font-black text-amber-900 uppercase tracking-widest mb-1">Supervisor Feedback</p>
              <p className="text-sm text-amber-800 italic">"{submission.feedback}"</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(submission.data).map(([key, value]: [string, any]) => (
            <div key={key} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
              <p className="text-base font-bold text-zinc-900">
                {typeof value === 'object' ? JSON.stringify(value) : value.toString()}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Submitted On</p>
              <p className="text-xs font-bold text-zinc-900">{new Date(submission.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Last Update</p>
              <p className="text-xs font-bold text-zinc-900">{new Date(submission.updatedAt).toLocaleString()}</p>
            </div>
          </div>
          
          {submission.status === 'REJECTED' && (
            <Button 
              className="gap-2 bg-zinc-900 hover:bg-zinc-800"
              onClick={() => {
                const typeMap: Record<string, EntryType> = {
                  'daily_attendance': 'daily',
                  'weekly_teacher_report': 'weekly',
                  'monthly_enrolment': 'monthly',
                  'ifa_report': 'monthly',
                  'teachers_return': 'monthly',
                  'termly_report': 'termly',
                  'annual_census': 'yearly'
                };
                
                // Pre-fill the form with rejected data
                const type = typeMap[submission.type] || 'daily';
                setActiveTab(type);
                if (submission.type === 'daily_attendance') setDailyForm(submission.data);
                if (submission.type === 'weekly_teacher_report') setWeeklyForm(submission.data);
                if (submission.type === 'monthly_enrolment') { setMonthlyType('enrolment'); setMonthlyEnrolment(submission.data); }
                if (submission.type === 'ifa_report') { setMonthlyType('ifa'); setIfaReport(submission.data); }
                if (submission.type === 'teachers_return') { setMonthlyType('return'); setTeachersReturn(submission.data); }
                if (submission.type === 'termly_report') setTermlyReport(submission.data);
                if (submission.type === 'annual_census') setAnnualCensus(submission.data);
                
                setSelectedSchoolId(submission.schoolId);
                setViewingSubmissionId(null);
                toast.info("Record data loaded. Please correct errors and resubmit.");
              }}
            >
              <Edit3 size={18} />
              Edit & Re-submit
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};
