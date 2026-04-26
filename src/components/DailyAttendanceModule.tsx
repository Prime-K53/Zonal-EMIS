import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  School as SchoolIcon,
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Download,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  Table as TableIcon
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { DailyAttendance, School, Teacher } from '../types';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addDays } from 'date-fns';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

interface TeachersWeeklyAttendanceReportProps {
  attendance: DailyAttendance[];
  schools: School[];
  teachers: Teacher[];
  onBack: () => void;
}

const TeachersWeeklyAttendanceReport = ({ attendance, schools, teachers, onBack }: TeachersWeeklyAttendanceReportProps) => {
  const [selectedWeekDate, setSelectedWeekDate] = useState(new Date().toISOString().split('T')[0]);
  
  const weekInfo = useMemo(() => {
    const date = parseISO(selectedWeekDate);
    const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
    const end = endOfWeek(date, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start, end }).slice(0, 5); // Mon-Fri
    
    return {
      start,
      end,
      days,
      weekNumber: format(date, 'w'),
      year: format(date, 'yyyy'),
      month: format(date, 'MMMM')
    };
  }, [selectedWeekDate]);

  const reportData = useMemo(() => {
    return schools.map(school => {
      const schoolTeachers = teachers.filter(t => t.schoolId === school.id && t.status === 'Active');
      const staffing = {
        m: schoolTeachers.filter(t => t.gender === 'Male').length,
        f: schoolTeachers.filter(t => t.gender === 'Female').length,
        tt: schoolTeachers.length
      };

      const dailyAttendance = weekInfo.days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const record = attendance.find(a => a.schoolId === school.id && a.date === dateStr);
        return {
          m: record?.teachers.present.male || 0,
          f: record?.teachers.present.female || 0,
          tt: (record?.teachers.present.male || 0) + (record?.teachers.present.female || 0)
        };
      });

      return {
        school,
        staffing,
        dailyAttendance
      };
    });
  }, [schools, teachers, attendance, weekInfo]);

  const totals = useMemo(() => {
    const staffing = {
      m: reportData.reduce((acc, curr) => acc + curr.staffing.m, 0),
      f: reportData.reduce((acc, curr) => acc + curr.staffing.f, 0),
      tt: reportData.reduce((acc, curr) => acc + curr.staffing.tt, 0)
    };

    const dailyAttendance = weekInfo.days.map((_, index) => ({
      m: reportData.reduce((acc, curr) => acc + curr.dailyAttendance[index].m, 0),
      f: reportData.reduce((acc, curr) => acc + curr.dailyAttendance[index].f, 0),
      tt: reportData.reduce((acc, curr) => acc + curr.dailyAttendance[index].tt, 0)
    }));

    return { staffing, dailyAttendance };
  }, [reportData, weekInfo]);

  const exportToExcel = () => {
    const districtName = schools[0]?.location?.district || schools[0]?.district || "DISTRICT";
    const zoneName = schools[0]?.location?.zone || schools[0]?.zone || "ZONE";
    
    // Create worksheet
    const wb = XLSX.utils.book_new();
    
    // Prepare data for Excel
    const wsData: (string | number)[][] = [
      ["[Malawi's Cort of arms]"],
      ["MINISTRY OF EDUCATION"],
      [`${districtName.toUpperCase()} DISTRICT EDUCATION OFFICE`],
      [""],
      [`${zoneName.toUpperCase()} TEACHERS' ATTENDANCE TERM 1, WEEK ${weekInfo.weekNumber} ${weekInfo.year}`],
      [""],
      ["SCHOOL", "TOTAL STAFFING", "", "", "MONDAY", "", "", "TUESDAY", "", "", "WEDNESDAY", "", "", "THURSDAY", "", "", "FRIDAY", "", ""],
      ["", "M", "F", "TT", "M", "F", "TT", "M", "F", "TT", "M", "F", "TT", "M", "F", "TT", "M", "F", "TT"]
    ];

    reportData.forEach(row => {
      wsData.push([
        row.school.name,
        row.staffing.m, row.staffing.f, row.staffing.tt,
        ...row.dailyAttendance.flatMap(d => [d.m, d.f, d.tt])
      ]);
    });

    wsData.push([
      "TOTAL",
      totals.staffing.m, totals.staffing.f, totals.staffing.tt,
      ...totals.dailyAttendance.flatMap(d => [d.m, d.f, d.tt])
    ]);

    wsData.push([""]);
    wsData.push([""]);
    wsData.push(["VERIFIED BY:", `PEA ${zoneName.toUpperCase()}`]);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Merge cells for headers
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 18 } }, // Malawi's Cort of arms
      { s: { r: 1, c: 0 }, e: { r: 1, c: 18 } }, // MINISTRY OF EDUCATION
      { s: { r: 2, c: 0 }, e: { r: 2, c: 18 } }, // DISTRICT EDUCATION OFFICE
      { s: { r: 4, c: 0 }, e: { r: 4, c: 18 } }, // TEACHERS' ATTENDANCE
      { s: { r: 6, c: 0 }, e: { r: 7, c: 0 } }, // SCHOOL
      { s: { r: 6, c: 1 }, e: { r: 6, c: 3 } }, // TOTAL STAFFING
      { s: { r: 6, c: 4 }, e: { r: 6, c: 6 } }, // MONDAY
      { s: { r: 6, c: 7 }, e: { r: 6, c: 9 } }, // TUESDAY
      { s: { r: 6, c: 10 }, e: { r: 6, c: 12 } }, // WEDNESDAY
      { s: { r: 6, c: 13 }, e: { r: 6, c: 15 } }, // THURSDAY
      { s: { r: 6, c: 16 }, e: { r: 6, c: 18 } }, // FRIDAY
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Weekly Attendance");
    XLSX.writeFile(wb, `Teachers_Weekly_Attendance_W${weekInfo.weekNumber}_${weekInfo.year}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft size={18} />
            Back
          </Button>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Teachers Weekly Attendance Report</h2>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="date"
            value={selectedWeekDate}
            onChange={(e) => setSelectedWeekDate(e.target.value)}
            className="w-48"
          />
          <Button onClick={exportToExcel} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Download size={18} />
            Export to Excel
          </Button>
          <Button variant="outline" onClick={() => window.print()} className="gap-2">
            <Printer size={18} />
            Print
          </Button>
        </div>
      </div>

      <Card className="p-0 overflow-hidden bg-white border-zinc-200/60 shadow-sm print:shadow-none print:border-none">
        <div className="p-8 print:p-0">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="text-center space-y-2 mb-10">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center border border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 text-center leading-tight">MALAWI<br/>COAT OF<br/>ARMS</span>
                </div>
              </div>
              <p className="text-xl font-black uppercase tracking-widest text-zinc-900">Ministry of Education</p>
              <p className="text-sm font-bold uppercase text-zinc-500 tracking-wider">
                {(schools[0]?.location?.district || schools[0]?.district || "DISTRICT").toUpperCase()} DISTRICT EDUCATION OFFICE
              </p>
              <div className="pt-6 relative">
                <div className="absolute inset-x-0 top-1/2 h-px bg-zinc-200 -z-10"></div>
                <span className="bg-white px-6 text-lg font-black uppercase tracking-tight text-zinc-800">
                  {(schools[0]?.location?.zone || schools[0]?.zone || "ZONE").toUpperCase()} TEACHERS' ATTENDANCE • TERM 1, WEEK {weekInfo.weekNumber} • {weekInfo.year}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-zinc-900 text-white">
                    <th rowSpan={2} className="border-r border-zinc-800 p-3 text-left align-middle font-bold uppercase tracking-wider">School Name</th>
                    <th colSpan={3} className="border-r border-zinc-800 p-2 text-center font-bold uppercase tracking-wider bg-zinc-800">Total Staffing</th>
                    <th colSpan={3} className="border-r border-zinc-800 p-2 text-center font-bold uppercase tracking-wider">Monday</th>
                    <th colSpan={3} className="border-r border-zinc-800 p-2 text-center font-bold uppercase tracking-wider bg-zinc-800">Tuesday</th>
                    <th colSpan={3} className="border-r border-zinc-800 p-2 text-center font-bold uppercase tracking-wider">Wednesday</th>
                    <th colSpan={3} className="border-r border-zinc-800 p-2 text-center font-bold uppercase tracking-wider bg-zinc-800">Thursday</th>
                    <th colSpan={3} className="p-2 text-center font-bold uppercase tracking-wider">Friday</th>
                  </tr>
                  <tr className="bg-zinc-100 text-zinc-600 border-b border-zinc-200">
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">M</th>
                    <th className="border-r border-zinc-200 p-1.5 text-center font-bold">F</th>
                    <th className="p-1.5 text-center font-bold bg-zinc-200/50">TT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {reportData.map((row, idx) => (
                    <tr key={row.school.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="border-r border-zinc-100 p-3 font-bold text-zinc-900 uppercase">{row.school.name}</td>
                      <td className="border-r border-zinc-100 p-2 text-center text-zinc-600">{row.staffing.m}</td>
                      <td className="border-r border-zinc-100 p-2 text-center text-zinc-600">{row.staffing.f}</td>
                      <td className="border-r border-zinc-100 p-2 text-center font-bold bg-zinc-50 text-zinc-900">{row.staffing.tt}</td>
                      {row.dailyAttendance.map((day, dIdx) => (
                        <React.Fragment key={dIdx}>
                          <td className="border-r border-zinc-100 p-2 text-center text-zinc-500">{day.m || '-'}</td>
                          <td className="border-r border-zinc-100 p-2 text-center text-zinc-500">{day.f || '-'}</td>
                          <td className="border-r border-zinc-100 p-2 text-center font-bold bg-zinc-50/50 text-zinc-800">{day.tt || '-'}</td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                  {/* Empty rows for consistent layout */}
                  {reportData.length < 8 && Array.from({ length: 8 - reportData.length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="bg-zinc-50/20">
                      <td className="border-r border-zinc-100 p-3 h-10"></td>
                      <td className="border-r border-zinc-100 p-2"></td>
                      <td className="border-r border-zinc-100 p-2"></td>
                      <td className="border-r border-zinc-100 p-2 bg-zinc-50/50"></td>
                      {Array.from({ length: 5 }).map((_, dIdx) => (
                        <React.Fragment key={dIdx}>
                          <td className="border-r border-zinc-100 p-2"></td>
                          <td className="border-r border-zinc-100 p-2"></td>
                          <td className="border-r border-zinc-100 p-2 bg-zinc-50/50"></td>
                        </React.Fragment>
                      ))}
                    </tr>
                  ))}
                  <tr className="bg-zinc-900 text-white font-bold">
                    <td className="p-3 uppercase tracking-wider">Total Aggregate</td>
                    <td className="p-2 text-center border-r border-zinc-800">{totals.staffing.m}</td>
                    <td className="p-2 text-center border-r border-zinc-800">{totals.staffing.f}</td>
                    <td className="p-2 text-center border-r border-zinc-800 bg-zinc-800">{totals.staffing.tt}</td>
                    {totals.dailyAttendance.map((day, dIdx) => (
                      <React.Fragment key={dIdx}>
                        <td className="p-2 text-center border-r border-zinc-800">{day.m}</td>
                        <td className="p-2 text-center border-r border-zinc-800">{day.f}</td>
                        <td className="p-2 text-center border-r border-zinc-800 bg-zinc-800">{day.tt}</td>
                      </React.Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="mt-16 flex justify-between items-start">
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Verified By</p>
                  <div className="w-64 h-px bg-zinc-200 mt-8"></div>
                  <p className="text-xs font-bold text-zinc-900 uppercase">Primary Education Advisor (PEA)</p>
                </div>
              </div>
              <div className="text-right space-y-1">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Zone Office Stamp</p>
                <div className="w-32 h-32 border-2 border-dashed border-zinc-200 rounded-full flex items-center justify-center ml-auto">
                  <span className="text-[10px] text-zinc-300 font-bold uppercase">Official Stamp</span>
                </div>
                <p className="text-xs font-bold text-zinc-900 uppercase mt-2">
                  {(schools[0]?.location?.zone || schools[0]?.zone || "ZONE").toUpperCase()} ZONE
                </p>
              </div>
            </div>
          </div>
        </div>
      </Card>

    </div>
  );
};

export const DailyAttendanceModule = () => {
  const [attendance, setAttendance] = useState<DailyAttendance[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState<'dashboard' | 'weekly-report'>('dashboard');

  useEffect(() => {
    const unsubAttendance = dataService.subscribeToDailyAttendance(30, (data) => {
      setAttendance(data);
      setLoading(false);
    });
    
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    
    return () => {
      unsubAttendance();
      unsubSchools();
      unsubTeachers();
    };
  }, []);

  // Aggregate stats for the selected date
  const stats = useMemo(() => {
    const dailyData = attendance.filter(a => a.date === selectedDate);
    
    const learners = {
      present: {
        boys: dailyData.reduce((acc, curr) => acc + (curr.learners.present.boys || 0), 0),
        girls: dailyData.reduce((acc, curr) => acc + (curr.learners.present.girls || 0), 0),
      },
      absent: {
        boys: dailyData.reduce((acc, curr) => acc + (curr.learners.absent.boys || 0), 0),
        girls: dailyData.reduce((acc, curr) => acc + (curr.learners.absent.girls || 0), 0),
      }
    };

    const teachers = {
      present: {
        male: dailyData.reduce((acc, curr) => acc + (curr.teachers.present.male || 0), 0),
        female: dailyData.reduce((acc, curr) => acc + (curr.teachers.present.female || 0), 0),
      },
      absent: {
        male: dailyData.reduce((acc, curr) => acc + (curr.teachers.absent.male || 0), 0),
        female: dailyData.reduce((acc, curr) => acc + (curr.teachers.absent.female || 0), 0),
      }
    };

    const totalPresentLearners = learners.present.boys + learners.present.girls;
    const totalAbsentLearners = learners.absent.boys + learners.absent.girls;
    const totalTeachersPresent = teachers.present.male + teachers.present.female;
    const totalTeachersAbsent = teachers.absent.male + teachers.absent.female;
    const totalLateTeachers = dailyData.reduce((acc, curr) => acc + curr.teachers.late, 0);

    const learnerRate = dailyData.length > 0 && (totalPresentLearners + totalAbsentLearners) > 0
      ? (totalPresentLearners / (totalPresentLearners + totalAbsentLearners)) * 100 
      : 0;
    
    const teacherRate = dailyData.length > 0 && (totalTeachersPresent + totalTeachersAbsent) > 0
      ? (totalTeachersPresent / (totalTeachersPresent + totalTeachersAbsent)) * 100 
      : 0;

    return {
      learnerRate: Math.round(learnerRate * 10) / 10,
      teacherRate: Math.round(teacherRate * 10) / 10,
      learners,
      teachers,
      totalPresentLearners,
      totalAbsentLearners,
      totalTeachersPresent,
      totalTeachersAbsent,
      totalLateTeachers,
      reportingSchools: dailyData.length,
      totalSchools: schools.length
    };
  }, [attendance, selectedDate, schools]);

  // Trend data for the last 14 days
  const trendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last14Days.map(date => {
      const dailyData = attendance.filter(a => a.date === date);
      const present = dailyData.reduce((acc, curr) => acc + curr.learners.present.boys + curr.learners.present.girls, 0);
      const absent = dailyData.reduce((acc, curr) => acc + curr.learners.absent.boys + curr.learners.absent.girls, 0);
      const rate = (present + absent) > 0 ? (present / (present + absent)) * 100 : 0;
      
      const tPresent = dailyData.reduce((acc, curr) => acc + curr.teachers.present.male + curr.teachers.present.female, 0);
      const tAbsent = dailyData.reduce((acc, curr) => acc + curr.teachers.absent.male + curr.teachers.absent.female, 0);
      const tRate = (tPresent + tAbsent) > 0 ? (tPresent / (tPresent + tAbsent)) * 100 : 0;

      return {
        date: date.split('-').slice(1).join('/'),
        learnerRate: Math.round(rate * 10) / 10,
        teacherRate: Math.round(tRate * 10) / 10
      };
    });
  }, [attendance]);

  const filteredSchools = useMemo(() => {
    return schools.filter(school => {
      const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           school.emisCode.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    }).map(school => {
      const dailyRecord = attendance.find(a => a.schoolId === school.id && a.date === selectedDate);
      return {
        ...school,
        dailyRecord
      };
    });
  }, [schools, attendance, selectedDate, searchTerm]);

  const exportReportToCSV = () => {
    const headers = ['School Name', 'EMIS Code', 'Learners Present', 'Learners Absent', 'Learner Rate %', 'Teachers Present', 'Teachers Absent', 'Teacher Rate %', 'Status'];
    const csvData = filteredSchools.map(school => {
      const record = school.dailyRecord;
      const learnerPresent = record ? record.learners.present.boys + record.learners.present.girls : 0;
      const learnerAbsent = record ? record.learners.absent.boys + record.learners.absent.girls : 0;
      const learnerRate = (learnerPresent + learnerAbsent) > 0 ? Math.round((learnerPresent / (learnerPresent + learnerAbsent)) * 100) : 0;
      
      const teacherPresent = record ? record.teachers.present.male + record.teachers.present.female : 0;
      const teacherAbsent = record ? record.teachers.absent.male + record.teachers.absent.female : 0;
      const teacherRate = (teacherPresent + teacherAbsent) > 0 ? Math.round((teacherPresent / (teacherPresent + teacherAbsent)) * 100) : 0;
      
      return [
        school.name,
        school.emisCode,
        learnerPresent,
        learnerAbsent,
        learnerRate,
        teacherPresent,
        teacherAbsent,
        teacherRate,
        record ? 'Reported' : 'Pending'
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_report_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Attendance report exported successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (view === 'weekly-report') {
    return (
      <TeachersWeeklyAttendanceReport 
        attendance={attendance} 
        schools={schools} 
        teachers={teachers}
        onBack={() => setView('dashboard')} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">Daily Attendance Monitoring</h2>
          <p className="text-zinc-500">Aggregated attendance data across all schools in the TDC</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={() => setView('weekly-report')}
          >
            <TableIcon size={18} />
            Weekly Teacher Report
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-48"
          />
          <Button variant="outline" className="gap-2" onClick={exportReportToCSV}>
            <Download size={18} />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-zinc-900">Learner Attendance</h3>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              stats.learnerRate >= 90 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              {stats.learnerRate}% Rate
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-100">
                  <th className="pb-2 font-bold uppercase">Category</th>
                  <th className="pb-2 font-bold uppercase text-right">Total</th>
                  <th className="pb-2 font-bold uppercase text-right">Present</th>
                  <th className="pb-2 font-bold uppercase text-right">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                <tr>
                  <td className="py-2 font-medium">Boys</td>
                  <td className="py-2 text-right">{(stats.learners.present.boys + stats.learners.absent.boys).toLocaleString()}</td>
                  <td className="py-2 text-right text-emerald-600 font-bold">{stats.learners.present.boys.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.learners.absent.boys.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Girls</td>
                  <td className="py-2 text-right">{(stats.learners.present.girls + stats.learners.absent.girls).toLocaleString()}</td>
                  <td className="py-2 text-right text-emerald-600 font-bold">{stats.learners.present.girls.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.learners.absent.girls.toLocaleString()}</td>
                </tr>
                <tr className="bg-zinc-50/50 font-bold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{(stats.totalPresentLearners + stats.totalAbsentLearners).toLocaleString()}</td>
                  <td className="py-2 text-right text-emerald-600">{stats.totalPresentLearners.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.totalAbsentLearners.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <TrendingUp size={20} />
              </div>
              <h3 className="font-bold text-zinc-900">Teacher Attendance</h3>
            </div>
            <span className={cn(
              "text-xs font-bold px-2 py-1 rounded-full",
              stats.teacherRate >= 95 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
            )}>
              {stats.teacherRate}% Rate
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-zinc-500 border-b border-zinc-100">
                  <th className="pb-2 font-bold uppercase">Category</th>
                  <th className="pb-2 font-bold uppercase text-right">Total</th>
                  <th className="pb-2 font-bold uppercase text-right">Present</th>
                  <th className="pb-2 font-bold uppercase text-right">Absent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                <tr>
                  <td className="py-2 font-medium">Male</td>
                  <td className="py-2 text-right">{(stats.teachers.present.male + stats.teachers.absent.male).toLocaleString()}</td>
                  <td className="py-2 text-right text-blue-600 font-bold">{stats.teachers.present.male.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.teachers.absent.male.toLocaleString()}</td>
                </tr>
                <tr>
                  <td className="py-2 font-medium">Female</td>
                  <td className="py-2 text-right">{(stats.teachers.present.female + stats.teachers.absent.female).toLocaleString()}</td>
                  <td className="py-2 text-right text-blue-600 font-bold">{stats.teachers.present.female.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.teachers.absent.female.toLocaleString()}</td>
                </tr>
                <tr className="bg-zinc-50/50 font-bold">
                  <td className="py-2">Total</td>
                  <td className="py-2 text-right">{(stats.totalTeachersPresent + stats.totalTeachersAbsent).toLocaleString()}</td>
                  <td className="py-2 text-right text-blue-600">{stats.totalTeachersPresent.toLocaleString()}</td>
                  <td className="py-2 text-right text-red-500">{stats.totalTeachersAbsent.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500">Late Arrivals (Teachers)</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-zinc-900">{stats.totalLateTeachers}</h3>
            <span className="text-xs text-zinc-400">Today</span>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-10 w-10 rounded-xl bg-zinc-50 flex items-center justify-center text-zinc-600">
              <SchoolIcon size={20} />
            </div>
            <span className="text-xs font-bold px-2 py-1 rounded-full bg-zinc-100 text-zinc-700">
              {stats.reportingSchools}/{stats.totalSchools}
            </span>
          </div>
          <p className="text-sm font-medium text-zinc-500">Reporting Schools</p>
          <div className="flex items-baseline gap-2 mt-1">
            <h3 className="text-2xl font-bold text-zinc-900">
              {stats.totalSchools > 0 ? Math.round((stats.reportingSchools / stats.totalSchools) * 100) : 0}%
            </h3>
            <span className="text-xs text-zinc-400">Compliance</span>
          </div>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <Calendar className="text-emerald-500" size={20} />
          14-Day Attendance Trend
        </h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="colorLearner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorTeacher" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#71717a' }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12, fill: '#71717a' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="top" align="right" iconType="circle" />
              <Area 
                type="monotone" 
                dataKey="learnerRate" 
                name="Learner Rate %" 
                stroke="#10b981" 
                fillOpacity={1} 
                fill="url(#colorLearner)" 
                strokeWidth={2}
              />
              <Area 
                type="monotone" 
                dataKey="teacherRate" 
                name="Teacher Rate %" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorTeacher)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* School List */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-zinc-900">School Attendance Breakdown</h3>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search schools..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Learners (P/A)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Learner Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Teachers (P/A)</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Teacher Rate</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredSchools.map((school) => {
                const record = school.dailyRecord;
                const learnerRate = record 
                  ? (record.learners.present.boys + record.learners.present.girls) / 
                    (record.learners.present.boys + record.learners.present.girls + record.learners.absent.boys + record.learners.absent.girls) * 100
                  : 0;
                const teacherRate = record
                  ? (record.teachers.present.male + record.teachers.present.female) / 
                    (record.teachers.present.male + record.teachers.present.female + record.teachers.absent.male + record.teachers.absent.female) * 100
                  : 0;

                return (
                  <tr key={school.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-zinc-900">{school.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">{school.emisCode}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {record ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-emerald-600">{record.learners.present.boys + record.learners.present.girls}</span>
                          <span className="text-zinc-300">/</span>
                          <span className="text-sm font-medium text-red-500">{record.learners.absent.boys + record.learners.absent.girls}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                learnerRate >= 90 ? "bg-emerald-500" : "bg-amber-500"
                              )}
                              style={{ width: `${learnerRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-zinc-700">{Math.round(learnerRate)}%</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {record ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-blue-600">{record.teachers.present.male + record.teachers.present.female}</span>
                          <span className="text-zinc-300">/</span>
                          <span className="text-sm font-medium text-zinc-500">{record.teachers.absent.male + record.teachers.absent.female}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-zinc-400">No data</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {record ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full",
                                teacherRate >= 95 ? "bg-emerald-500" : "bg-amber-500"
                              )}
                              style={{ width: `${teacherRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-zinc-700">{Math.round(teacherRate)}%</span>
                        </div>
                      ) : "-"}
                    </td>
                    <td className="px-6 py-4">
                      {record ? (
                        <div className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Reported</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <AlertCircle size={16} />
                          <span className="text-xs font-bold uppercase tracking-wider">Pending</span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
