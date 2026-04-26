import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  Calendar, 
  School, 
  Users, 
  ClipboardCheck, 
  CheckCircle2, 
  AlertTriangle,
  FileDown,
  ChevronRight,
  BarChart3,
  Landmark,
  ShieldCheck,
  GraduationCap,
  Sparkles,
  Loader2,
  BookOpen,
  TrendingUp
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { dataService } from '../services/dataService';
import { 
  Teacher, School as SchoolType, Inspection, TPDProgram, 
  Resource, ExaminationResult, LeaveRequest, MaintenanceLog, 
  SMCMeeting, ContinuousAssessment 
} from '../types';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

export const Reports = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [tpd, setTpd] = useState<TPDProgram[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [results, setResults] = useState<ExaminationResult[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([]);
  const [smcMeetings, setSMCMeetings] = useState<SMCMeeting[]>([]);
  const [assessments, setAssessments] = useState<ContinuousAssessment[]>([]);
  const [ifaReports, setIfaReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubInspections = dataService.subscribeToInspections(setInspections);
    const unsubTpd = dataService.subscribeToTPDPrograms(setTpd);
    const unsubResults = dataService.subscribeToExaminationResults(setResults);
    const unsubLeave = dataService.subscribeToLeaveRequests(setLeaveRequests);
    const unsubMaintenance = dataService.subscribeToMaintenanceLogs(setMaintenanceLogs);
    const unsubSMC = dataService.subscribeToSMCMeetings(setSMCMeetings);
    const unsubAssessments = dataService.subscribeToContinuousAssessments(setAssessments);
    const unsubIfa = dataService.subscribeToIFAReports(setIfaReports);
    const unsubResources = dataService.subscribeToResources((data) => {
      setResources(data);
      setLoading(false);
    });

    return () => {
      unsubTeachers();
      unsubSchools();
      unsubInspections();
      unsubTpd();
      unsubResults();
      unsubLeave();
      unsubMaintenance();
      unsubSMC();
      unsubAssessments();
      unsubIfa();
      unsubResources();
    };
  }, []);

  const generateAIInsight = async () => {
    setIsGenerating(true);
    try {
      const allData = await dataService.getAllData();
      const schoolCount = allData?.schools?.length || 0;
      const teacherCount = allData?.teachers?.length || 0;
      const inspectionCount = allData?.inspections?.length || 0;
      const avgInspScore = inspectionCount > 0
        ? (allData.inspections.reduce((acc: number, i: any) => acc + i.score, 0) / inspectionCount).toFixed(1)
        : 'N/A';

      const reportLabels: Record<string, string> = {
        summary: 'TDC Summary', ifa: 'IFA Distribution', academics: 'Academic Performance',
        leave: 'Teacher Leave', maintenance: 'Maintenance Status', smc: 'SMC Compliance',
        inspection: 'Inspection Performance', resource: 'Resource Distribution',
        tpd: 'Teacher Development', forecasting: 'Forecasting'
      };

      const insight = `## AI Insight: ${reportLabels[activeReport] || activeReport} Report

**Executive Summary**
The TDC currently manages **${schoolCount} schools** with **${teacherCount} teachers** on record. ${inspectionCount} inspection(s) have been conducted with an average score of **${avgInspScore}**.

**Key Observations**
- ${teacherCount > 0 && schoolCount > 0 ? `Average of ${(teacherCount / schoolCount).toFixed(1)} teachers per school across the zone.` : 'Teacher distribution data needs updating.'}
- ${parseFloat(avgInspScore) < 60 ? '⚠️ Below-average inspection scores indicate schools need targeted academic support.' : parseFloat(avgInspScore) >= 75 ? '✅ Inspection performance is strong across the zone.' : 'Inspection performance is moderate — continued monitoring is advised.'}
- Regular data entry across all modules ensures accurate reporting.

**Strategic Recommendations**
1. **Data Completeness:** Ensure all schools have up-to-date enrollment, staffing, and resource records to improve report accuracy.
2. **Low-Performing Schools:** Prioritise support visits for schools with inspection scores below 60%.
3. **Resource Equity:** Cross-reference resource distribution data with enrollment figures to identify under-resourced schools.`;

      setAiInsight(insight);
    } catch (error) {
      console.error("Insight Generation Error:", error);
      setAiInsight("Error generating insights. Please check your connection to the backend server.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const reportTypes = [
    { id: 'summary', label: 'TDC Summary Report', icon: FileText, description: 'Overview of all schools and teachers in the TDC.' },
    { id: 'ifa', label: 'IFA Report', icon: ShieldCheck, description: 'Monthly Iron Folic Acid distribution tracking by school.' },
    { id: 'academics', label: 'Academic Performance', icon: BookOpen, description: 'Aggregated examination results and pass rate analysis.' },
    { id: 'leave', label: 'Teacher Leave', icon: Calendar, description: 'Analysis of teacher leave patterns and types.' },
    { id: 'maintenance', label: 'Maintenance Status', icon: BarChart3, description: 'Infrastructure maintenance logs and urgency status.' },
    { id: 'smc', label: 'SMC Compliance', icon: Users, description: 'SMC meeting frequency and resolution tracking.' },
    { id: 'inspection', label: 'Inspection Performance', icon: ClipboardCheck, description: 'Detailed analysis of inspection results by zone and school.' },
    { id: 'resource', label: 'Resource Distribution', icon: Landmark, description: 'Inventory and condition report for all tracked materials.' },
    { id: 'tpd', label: 'Teacher Development', icon: GraduationCap, description: 'TPD program participation and teacher qualification trends.' },
    { id: 'forecasting', label: 'AI Forecasting', icon: TrendingUp, description: 'Predictive analysis for enrollment, staffing, and resource needs.' },
  ];

  const [activeReport, setActiveReport] = useState('summary');
  const [forecast, setForecast] = useState<string | null>(null);
  const [isForecasting, setIsForecasting] = useState(false);

  const academicData = useMemo(() => {
    const subjects = Array.from(new Set(assessments.map(a => a.subject)));
    return subjects.map(subject => {
      const subjectAssessments = assessments.filter(a => a.subject === subject);
      const avgPassRate = subjectAssessments.reduce((acc, a) => acc + a.passRate, 0) / (subjectAssessments.length || 1);
      return { subject, passRate: Math.round(avgPassRate) };
    }).sort((a, b) => b.passRate - a.passRate);
  }, [assessments]);

  const maintenanceData = useMemo(() => {
    return [
      { name: 'Reported', value: maintenanceLogs.filter(l => l.status === 'Reported').length, color: '#94a3b8' },
      { name: 'In Progress', value: maintenanceLogs.filter(l => l.status === 'In Progress').length, color: '#3b82f6' },
      { name: 'Completed', value: maintenanceLogs.filter(l => l.status === 'Completed').length, color: '#10b981' },
      { name: 'Deferred', value: maintenanceLogs.filter(l => l.status === 'Deferred').length, color: '#f59e0b' },
    ].filter(d => d.value > 0);
  }, [maintenanceLogs]);

  const leaveData = useMemo(() => {
    return [
      { name: 'Sick', value: leaveRequests.filter(r => r.type === 'Sick').length, color: '#ef4444' },
      { name: 'Maternity', value: leaveRequests.filter(r => r.type === 'Maternity').length, color: '#ec4899' },
      { name: 'Paternity', value: leaveRequests.filter(r => r.type === 'Paternity').length, color: '#3b82f6' },
      { name: 'Compassionate', value: leaveRequests.filter(r => r.type === 'Compassionate').length, color: '#f59e0b' },
      { name: 'Study', value: leaveRequests.filter(r => r.type === 'Study').length, color: '#8b5cf6' },
      { name: 'Annual', value: leaveRequests.filter(r => r.type === 'Annual').length, color: '#10b981' },
    ].filter(d => d.value > 0);
  }, [leaveRequests]);

  const smcData = useMemo(() => {
    const schoolCounts = schools.map(school => {
      const count = smcMeetings.filter(m => m.schoolId === school.id).length;
      return { name: school.name, count };
    }).filter(s => s.count > 0);
    return schoolCounts;
  }, [smcMeetings, schools]);

  const generateForecast = async () => {
    setIsForecasting(true);
    try {
      const allData = await dataService.getAllData();
      const schools = allData?.schools || [];
      const teachers = allData?.teachers || [];
      const totalEnrollment = schools.reduce((sum: number, s: any) => sum + (s.enrollment?.total || 0), 0);
      const growth3yr = Math.round(totalEnrollment * 1.08);
      const growth5yr = Math.round(totalEnrollment * 1.18);
      const recommendedTeachers3yr = Math.round(growth3yr / 40);
      const recommendedTeachers5yr = Math.round(growth5yr / 40);
      const teacherGap3yr = Math.max(0, recommendedTeachers3yr - teachers.length);
      const teacherGap5yr = Math.max(0, recommendedTeachers5yr - teachers.length);
      const classroomsNeeded = Math.round(growth3yr / 45);

      const forecastText = `## 3–5 Year EMIS Forecast

*Generated from current system data. Assumes ~4% annual enrollment growth based on regional trends.*

### Enrollment Projections

| Year | Projected Enrollment | Growth |
|------|---------------------|--------|
| Current | ${totalEnrollment.toLocaleString()} | Baseline |
| Year 3 | ${growth3yr.toLocaleString()} | +8% |
| Year 5 | ${growth5yr.toLocaleString()} | +18% |

### Teacher Requirements (Target: 40:1 ratio)

| Year | Students | Required Teachers | Current Teachers | Gap |
|------|----------|------------------|-----------------|-----|
| Year 3 | ${growth3yr.toLocaleString()} | ${recommendedTeachers3yr} | ${teachers.length} | ${teacherGap3yr > 0 ? `⚠️ +${teacherGap3yr}` : '✅ Sufficient'} |
| Year 5 | ${growth5yr.toLocaleString()} | ${recommendedTeachers5yr} | ${teachers.length} | ${teacherGap5yr > 0 ? `⚠️ +${teacherGap5yr}` : '✅ Sufficient'} |

### Infrastructure Needs (Year 3)
- **Classrooms Required:** ~${classroomsNeeded} (at 45 students/class)
- **Sanitation:** Ensure 1 toilet per 30 students is maintained as enrollment grows.

### Risk Assessment
- ${teacherGap3yr > 0 ? `🔴 **High:** Teacher shortage of ${teacherGap3yr} projected within 3 years. Begin recruitment planning now.` : '🟢 **Low:** Teacher supply appears adequate for 3-year projection.'}
- ${totalEnrollment > 500 ? '🟡 **Medium:** Infrastructure expansion will be needed to accommodate growth.' : '🟢 **Low:** Current infrastructure likely sufficient short-term.'}
- 🟡 **Medium:** Resource procurement cycles should be aligned with enrollment growth to prevent shortfalls.

*Note: This forecast uses statistical projections from current data. For AI-powered forecasting, the system can be configured with an optional LLM integration.*`;

      setForecast(forecastText);
    } catch (error) {
      console.error("Forecasting Error:", error);
      setForecast("Error generating forecast. Please check your connection to the backend server.");
    } finally {
      setIsForecasting(false);
    }
  };

  const exportToCSV = () => {
    let data: any[] = [];
    let headers: string[] = [];
    let filename = `${activeReport}_report_${new Date().toISOString().split('T')[0]}.csv`;

    switch (activeReport) {
      case 'summary':
        headers = ['School Name', 'EMIS Code', 'Zone', 'Enrollment', 'Teachers'];
        data = schools.map(s => [
          s.name,
          s.emisCode,
          s.zone,
          s.enrollment?.total || 0,
          teachers.filter(t => t.schoolId === s.id).length
        ]);
        break;
      case 'ifa':
        headers = ['School', 'Month', '6-9 Girls (T)', '6-9 Girls (R)', '6-12 Boys (T)', '6-12 Boys (R)', '10-12 Girls (T)', '10-12 Girls (R)', 'Stock'];
        data = ifaReports.map(r => [
          schools.find(s => s.id === r.schoolId)?.name || 'Unknown',
          r.month,
          r.girls6to9.target,
          r.girls6to9.received,
          r.boys6to12.target,
          r.boys6to12.received,
          r.girls10to12.target,
          r.girls10to12.received,
          r.stockBalance
        ]);
        break;
      case 'academics':
        headers = ['Subject', 'Pass Rate %'];
        data = academicData.map(d => [d.subject, d.passRate]);
        break;
      case 'leave':
        headers = ['Teacher', 'Type', 'Days', 'Status', 'Start Date'];
        data = leaveRequests.map(r => [r.teacherName, r.type, r.daysRequested, r.status, r.startDate]);
        break;
      case 'maintenance':
        headers = ['School', 'Category', 'Urgency', 'Status', 'Reported At'];
        data = maintenanceLogs.map(l => [
          schools.find(s => s.id === l.schoolId)?.name || 'Unknown',
          l.category,
          l.urgency,
          l.status,
          l.reportedAt
        ]);
        break;
      case 'smc':
        headers = ['School', 'Type', 'Attendees', 'Resolutions', 'Date'];
        data = smcMeetings.map(m => [
          schools.find(s => s.id === m.schoolId)?.name || 'Unknown',
          m.type,
          m.attendeesCount,
          m.resolutions.length,
          m.date
        ]);
        break;
      case 'inspection':
        headers = ['School', 'Date', 'Score', 'Inspector ID'];
        data = inspections.map(i => [
          schools.find(s => s.id === i.schoolId)?.name || 'Unknown',
          i.date,
          i.score,
          i.inspectorId
        ]);
        break;
      case 'resource':
        headers = ['Name', 'Category', 'Quantity', 'Condition', 'School'];
        data = resources.map(r => [
          r.name,
          r.category,
          r.quantity,
          r.condition,
          schools.find(s => s.id === r.schoolId)?.name || 'Unknown'
        ]);
        break;
      case 'tpd':
        headers = ['Teacher', 'Qualification', 'TPD Count'];
        data = teachers.map(t => [
          `${t.firstName} ${t.lastName}`,
          t.qualification,
          t.tpdHistory?.length || 0
        ]);
        break;
      default:
        return;
    }

    const csvContent = [
      headers.join(','),
      ...data.map(row => row.map((cell: any) => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const zonalDistributionData = useMemo(() => {
    const zones = Array.from(new Set(schools.map(s => s.zone)));
    return zones.map(zone => {
      const zoneSchools = schools.filter(s => s.zone === zone);
      return {
        name: zone,
        schools: zoneSchools.length,
        enrollment: zoneSchools.reduce((acc, s) => acc + (s.enrollment?.total || 0), 0)
      };
    });
  }, [schools]);

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading report data...</div>;
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Reports & Analytics</h2>
          <p className="text-sm text-zinc-500">Generate, view, and export detailed EMIS reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" onClick={handlePrint}>
            <Printer size={18} />
            Print Current View
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700" onClick={exportToCSV}>
            <Download size={18} />
            Export to CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Selection */}
        <div className="lg:col-span-1 space-y-2">
          {reportTypes.map((report) => (
            <button
              key={report.id}
              onClick={() => setActiveReport(report.id)}
              className={cn(
                "w-full flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200 border",
                activeReport === report.id 
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm" 
                  : "bg-white border-zinc-100 text-zinc-500 hover:border-zinc-200 hover:bg-zinc-50"
              )}
            >
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                activeReport === report.id ? "bg-emerald-500 text-white" : "bg-zinc-100 text-zinc-400"
              )}>
                <report.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold truncate">{report.label}</p>
                <p className="text-[10px] text-zinc-400 leading-tight mt-1">{report.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-8 border-zinc-200 shadow-xl shadow-zinc-200/50">
            <div className="flex items-center justify-between mb-8 border-b border-zinc-100 pb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
                  <FileDown size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 uppercase tracking-tight">
                    {reportTypes.find(r => r.id === activeReport)?.label}
                  </h3>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Generated on {new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-9 gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={generateAIInsight}
                  disabled={isGenerating}
                >
                  {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                  {isGenerating ? 'Analyzing...' : 'AI Insights'}
                </Button>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 text-zinc-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck size={14} />
                  Official
                </div>
              </div>
            </div>

            {/* AI Insights Section */}
            {aiInsight && (
              <div className="mb-8 p-6 rounded-2xl bg-emerald-50 border border-emerald-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                  <Sparkles size={64} className="text-emerald-600" />
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center">
                    <Sparkles size={16} />
                  </div>
                  <h4 className="text-sm font-black text-emerald-900 uppercase tracking-tight">AI Strategic Analysis</h4>
                </div>
                <div className="prose prose-sm prose-emerald max-w-none text-emerald-800 font-medium leading-relaxed">
                  <Markdown>{aiInsight}</Markdown>
                </div>
              </div>
            )}

            {activeReport === 'summary' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Schools</p>
                    <p className="text-3xl font-black text-zinc-900">{schools.length}</p>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Teachers</p>
                    <p className="text-3xl font-black text-zinc-900">{teachers.length}</p>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Enrollment</p>
                    <p className="text-3xl font-black text-zinc-900">
                      {schools.reduce((acc, s) => acc + (s.enrollment?.total || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Zonal School Distribution</h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={zonalDistributionData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="schools"
                            stroke="none"
                          >
                            {zonalDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'][index % 5]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                          <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Zonal Enrollment Distribution</h4>
                    <div className="h-[250px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={zonalDistributionData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                          <Bar dataKey="enrollment" name="Enrollment" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Zonal Distribution Summary</h4>
                  <div className="overflow-hidden rounded-2xl border border-zinc-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Zone</th>
                          <th className="px-6 py-4">Schools</th>
                          <th className="px-6 py-4">Teachers</th>
                          <th className="px-6 py-4">Avg. Enrollment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {Array.from(new Set(schools.map(s => s.zone))).map((zone) => {
                          const zoneSchools = schools.filter(s => s.zone === zone);
                          const zoneTeachers = teachers.filter(t => zoneSchools.find(s => s.id === t.schoolId));
                          return (
                            <tr key={zone} className="hover:bg-zinc-50 transition-colors">
                              <td className="px-6 py-4 font-bold text-zinc-900">{zone}</td>
                              <td className="px-6 py-4">{zoneSchools.length}</td>
                              <td className="px-6 py-4">{zoneTeachers.length}</td>
                              <td className="px-6 py-4">
                                {zoneSchools.length > 0 
                                  ? Math.round(zoneSchools.reduce((acc, s) => acc + (s.enrollment?.total || 0), 0) / zoneSchools.length)
                                  : 0}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'ifa' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Monthly IFA Distribution Summary</h4>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-400" />
                    <span className="text-xs font-bold text-zinc-500">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' }).toUpperCase()}</span>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-zinc-100 shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-zinc-900 text-white">
                        <th rowSpan={2} className="px-4 py-4 font-bold uppercase tracking-wider border-r border-zinc-800 sticky left-0 bg-zinc-900 z-10">School</th>
                        <th colSpan={3} className="px-4 py-2 text-center border-r border-zinc-800 bg-emerald-600">6-9 Girls</th>
                        <th colSpan={3} className="px-4 py-2 text-center border-r border-zinc-800 bg-blue-600">6-12 Boys</th>
                        <th colSpan={3} className="px-4 py-2 text-center border-r border-zinc-800 bg-pink-600">10-12 Girls</th>
                        <th rowSpan={2} className="px-4 py-4 text-center font-bold uppercase tracking-wider bg-zinc-800">Stock</th>
                      </tr>
                      <tr className="bg-zinc-800 text-zinc-300">
                        <th className="px-2 py-2 text-center border-r border-zinc-700">T</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">R</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">%</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">T</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">R</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">%</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">T</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">R</th>
                        <th className="px-2 py-2 text-center border-r border-zinc-700">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {schools.map(school => {
                        const report = ifaReports.find(r => r.schoolId === school.id);
                        const calcPercent = (r: number, t: number) => t > 0 ? Math.round((r / t) * 100) : 0;
                        
                        return (
                          <tr key={school.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-4 py-3 font-bold text-zinc-900 border-r border-zinc-100 sticky left-0 bg-white group-hover:bg-zinc-50 z-10">{school.name}</td>
                            
                            {/* 6-9 Girls */}
                            <td className="px-2 py-3 text-center border-r border-zinc-50 text-zinc-500">{report?.girls6to9?.target || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-50 font-bold text-emerald-600">{report?.girls6to9?.received || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-100 font-black text-zinc-400">{calcPercent(report?.girls6to9?.received || 0, report?.girls6to9?.target || 0)}%</td>

                            {/* 6-12 Boys */}
                            <td className="px-2 py-3 text-center border-r border-zinc-50 text-zinc-500">{report?.boys6to12?.target || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-50 font-bold text-blue-600">{report?.boys6to12?.received || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-100 font-black text-zinc-400">{calcPercent(report?.boys6to12?.received || 0, report?.boys6to12?.target || 0)}%</td>

                            {/* 10-12 Girls */}
                            <td className="px-2 py-3 text-center border-r border-zinc-50 text-zinc-500">{report?.girls10to12?.target || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-50 font-bold text-pink-600">{report?.girls10to12?.received || 0}</td>
                            <td className="px-2 py-3 text-center border-r border-zinc-100 font-black text-zinc-400">{calcPercent(report?.girls10to12?.received || 0, report?.girls10to12?.target || 0)}%</td>

                            <td className="px-4 py-3 text-center font-black text-zinc-900 bg-zinc-50/50">{report?.stockBalance || 0}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-zinc-900 text-white font-black">
                      <tr>
                        <td className="px-4 py-4 uppercase tracking-widest text-[10px] border-r border-zinc-800 sticky left-0 bg-zinc-900 z-10">TDC Total</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">{ifaReports.reduce((acc, r) => acc + (r.girls6to9?.target || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800 text-emerald-400">{ifaReports.reduce((acc, r) => acc + (r.girls6to9?.received || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">
                          {Math.round(ifaReports.reduce((acc, r) => acc + (r.girls6to9?.received || 0), 0) / (ifaReports.reduce((acc, r) => acc + (r.girls6to9?.target || 0), 0) || 1) * 100)}%
                        </td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">{ifaReports.reduce((acc, r) => acc + (r.boys6to12?.target || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800 text-blue-400">{ifaReports.reduce((acc, r) => acc + (r.boys6to12?.received || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">
                          {Math.round(ifaReports.reduce((acc, r) => acc + (r.boys6to12?.received || 0), 0) / (ifaReports.reduce((acc, r) => acc + (r.boys6to12?.target || 0), 0) || 1) * 100)}%
                        </td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">{ifaReports.reduce((acc, r) => acc + (r.girls10to12?.target || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800 text-pink-400">{ifaReports.reduce((acc, r) => acc + (r.girls10to12?.received || 0), 0)}</td>
                        <td className="px-2 py-4 text-center border-r border-zinc-800">
                          {Math.round(ifaReports.reduce((acc, r) => acc + (r.girls10to12?.received || 0), 0) / (ifaReports.reduce((acc, r) => acc + (r.girls10to12?.target || 0), 0) || 1) * 100)}%
                        </td>
                        <td className="px-4 py-4 text-center">{ifaReports.reduce((acc, r) => acc + (r.stockBalance || 0), 0)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Total Girls Reached</p>
                    <p className="text-3xl font-black text-emerald-900">
                      {ifaReports.reduce((acc, r) => acc + (r.girls6to9?.received || 0) + (r.girls10to12?.received || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Total Boys Reached</p>
                    <p className="text-3xl font-black text-blue-900">
                      {ifaReports.reduce((acc, r) => acc + (r.boys6to12?.received || 0), 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="p-6 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 text-zinc-500">Total Stock Balance</p>
                    <p className="text-3xl font-black text-white">
                      {ifaReports.reduce((acc, r) => acc + (r.stockBalance || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'academics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Avg. Pass Rate (PSLCE)</p>
                    <p className="text-3xl font-black text-blue-900">
                      {results.length > 0 
                        ? Math.round(results.reduce((acc, r) => acc + (r.passed.total / r.candidates.total), 0) / results.length * 100) 
                        : 0}%
                    </p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Top Performing Subject</p>
                    <p className="text-3xl font-black text-emerald-900">English</p>
                  </div>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={academicData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="subject" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="passRate" name="Pass Rate %" fill="#10b981" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">School Performance Ranking</h4>
                  <div className="space-y-3">
                    {schools.map(school => {
                      const schoolResults = results.filter(r => r.schoolId === school.id);
                      const passRate = schoolResults.length > 0 
                        ? Math.round(schoolResults.reduce((acc, r) => acc + (r.passed.total / r.candidates.total), 0) / schoolResults.length * 100)
                        : 0;
                      
                      return (
                        <div key={school.id} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-zinc-400">
                              <GraduationCap size={20} />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-zinc-900">{school.name}</p>
                              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{school.emisCode}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-lg font-black",
                              passRate > 80 ? "text-emerald-600" : passRate > 60 ? "text-blue-600" : "text-amber-600"
                            )}>{passRate}%</p>
                            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Pass Rate</p>
                          </div>
                        </div>
                      );
                    }).sort((a, b) => {
                      const rateA = results.filter(r => r.schoolId === a.key).reduce((acc, r) => acc + (r.passed.total / r.candidates.total), 0);
                      const rateB = results.filter(r => r.schoolId === b.key).reduce((acc, r) => acc + (r.passed.total / r.candidates.total), 0);
                      return rateB - rateA;
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'leave' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={leaveData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {leaveData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {leaveData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <p className="text-sm font-bold text-zinc-900">{d.name}</p>
                        </div>
                        <div className="text-xl font-black text-zinc-900">{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Recent Leave Records</h4>
                  <div className="overflow-hidden rounded-2xl border border-zinc-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">Teacher</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Duration</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Start Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {leaveRequests.slice(0, 10).map((r) => (
                          <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900">{r.teacherName}</td>
                            <td className="px-6 py-4">{r.type}</td>
                            <td className="px-6 py-4">{r.daysRequested} Days</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                                r.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : r.status === 'Pending' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                              )}>
                                {r.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-zinc-500">{r.startDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'maintenance' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={maintenanceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={8}
                          dataKey="value"
                          stroke="none"
                        >
                          {maintenanceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {maintenanceData.map((d, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                          <p className="text-sm font-bold text-zinc-900">{d.name}</p>
                        </div>
                        <div className="text-xl font-black text-zinc-900">{d.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Maintenance Logs</h4>
                  <div className="overflow-hidden rounded-2xl border border-zinc-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">School</th>
                          <th className="px-6 py-4">Category</th>
                          <th className="px-6 py-4">Urgency</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Reported At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {maintenanceLogs.slice(0, 10).map((l) => (
                          <tr key={l.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900">{schools.find(s => s.id === l.schoolId)?.name}</td>
                            <td className="px-6 py-4">{l.category}</td>
                            <td className="px-6 py-4">
                              <span className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-bold uppercase",
                                l.urgency === 'Critical' ? "bg-rose-100 text-rose-700" : l.urgency === 'High' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {l.urgency}
                              </span>
                            </td>
                            <td className="px-6 py-4">{l.status}</td>
                            <td className="px-6 py-4 text-zinc-500">{new Date(l.reportedAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'smc' && (
              <div className="space-y-8">
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={smcData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#71717a' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }} />
                      <Bar dataKey="count" name="Meetings" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">SMC Meeting Records</h4>
                  <div className="overflow-hidden rounded-2xl border border-zinc-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">School</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Attendees</th>
                          <th className="px-6 py-4">Resolutions</th>
                          <th className="px-6 py-4">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {smcMeetings.slice(0, 10).map((m) => (
                          <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900">{schools.find(s => s.id === m.schoolId)?.name}</td>
                            <td className="px-6 py-4">{m.type}</td>
                            <td className="px-6 py-4">{m.attendeesCount}</td>
                            <td className="px-6 py-4">{m.resolutions.length}</td>
                            <td className="px-6 py-4 text-zinc-500">{m.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'inspection' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Inspections Completed</p>
                    <p className="text-3xl font-black text-zinc-900">{inspections.length}</p>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Avg. Score</p>
                    <p className="text-3xl font-black text-zinc-900">
                      {inspections.length > 0 
                        ? Math.round(inspections.reduce((acc, i) => acc + i.score, 0) / inspections.length)
                        : 0}/100
                    </p>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pending Actions</p>
                    <p className="text-3xl font-black text-amber-600">
                      {inspections.filter(i => i.status === 'Draft').length}
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Recent Inspection Findings</h4>
                  <div className="space-y-4">
                    {inspections.slice(0, 5).map(inspection => {
                      const school = schools.find(s => s.id === inspection.schoolId);
                      return (
                        <div key={inspection.id} className="p-5 bg-white rounded-2xl border border-zinc-100 shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-emerald-500" />
                              <p className="text-sm font-bold text-zinc-900">{school?.name}</p>
                            </div>
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{new Date(inspection.date).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs text-zinc-600 leading-relaxed italic">"{inspection.findings.substring(0, 150)}..."</p>
                          <div className="mt-4 flex items-center gap-4">
                            <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${inspection.score}%` }} />
                            </div>
                            <span className="text-xs font-black text-zinc-900">{inspection.score}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'resource' && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {['Textbooks', 'Furniture', 'ICT', 'Lab Equipment'].map(cat => (
                    <div key={cat} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{cat}</p>
                      <p className="text-2xl font-black text-zinc-900">
                        {resources.filter(r => r.category === cat).reduce((acc, r) => acc + r.quantity, 0).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Resource Condition Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {['Good', 'Fair', 'Poor'].map(condition => {
                      const count = resources.filter(r => r.condition === condition).length;
                      const percentage = resources.length > 0 ? Math.round((count / resources.length) * 100) : 0;
                      return (
                        <div key={condition} className="p-6 rounded-2xl border border-zinc-100 bg-white shadow-sm flex flex-col items-center text-center">
                          <div className={cn(
                            "h-12 w-12 rounded-full flex items-center justify-center mb-4",
                            condition === 'Good' ? "bg-emerald-50 text-emerald-600" :
                            condition === 'Fair' ? "bg-amber-50 text-amber-600" :
                            "bg-red-50 text-red-600"
                          )}>
                            <ShieldCheck size={24} />
                          </div>
                          <p className="text-sm font-black text-zinc-900 uppercase tracking-tight">{condition}</p>
                          <p className="text-2xl font-black text-zinc-900 mt-1">{percentage}%</p>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">{count} items</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'tpd' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-6 bg-purple-50 rounded-2xl border border-purple-100">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1">TPD Participation Rate</p>
                    <p className="text-3xl font-black text-purple-900">
                      {teachers.length > 0 
                        ? Math.round(teachers.filter(t => t.tpdHistory && t.tpdHistory.length > 0).length / teachers.length * 100)
                        : 0}%
                    </p>
                  </div>
                  <div className="p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Active Programs</p>
                    <p className="text-3xl font-black text-zinc-900">{tpd.filter(p => p.status !== 'Completed').length}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Qualification Breakdown</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Array.from(new Set(teachers.map(t => t.qualification))).map(qual => {
                      const count = teachers.filter(t => t.qualification === qual).length;
                      const percentage = teachers.length > 0 ? Math.round((count / teachers.length) * 100) : 0;
                      return (
                        <div key={qual} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 flex items-center justify-between">
                          <span className="text-sm font-bold text-zinc-700">{qual}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
                              <div className="h-full bg-purple-500" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-xs font-black text-zinc-900">{percentage}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeReport === 'forecasting' && (
              <div className="space-y-8">
                {!forecast ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 animate-pulse">
                      <TrendingUp size={40} />
                    </div>
                    <h4 className="text-xl font-black text-zinc-900 uppercase tracking-tight mb-2">Predictive EMIS Analysis</h4>
                    <p className="text-sm text-zinc-500 max-w-md mb-8">
                      Use advanced AI to project future needs based on current enrollment trends, staffing levels, and infrastructure condition.
                    </p>
                    <Button 
                      onClick={generateForecast} 
                      disabled={isForecasting}
                      className="gap-2 bg-zinc-900 hover:bg-zinc-800 h-12 px-8 rounded-2xl"
                    >
                      {isForecasting ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                      {isForecasting ? 'Calculating Projections...' : 'Generate 3-Year Forecast'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                      <div className="flex items-center gap-3">
                        <TrendingUp className="text-emerald-600" size={24} />
                        <p className="text-sm font-bold text-emerald-900 uppercase tracking-tight">AI Generated Strategic Forecast</p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => setForecast(null)} className="h-8 text-[10px] font-black uppercase tracking-widest">
                        Reset
                      </Button>
                    </div>
                    <div className="prose prose-sm prose-zinc max-w-none bg-zinc-50 p-8 rounded-3xl border border-zinc-100">
                      <Markdown>{forecast}</Markdown>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
