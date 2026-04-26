import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Award, 
  Filter, 
  Download, 
  Search,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  ClipboardList,
  Plus,
  Save,
  X,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Loader2,
  MoreVertical,
  Trash2
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { ExaminationResult, School, ExamAdministration, Teacher, ContinuousAssessment, JuniorResult, StandardisedResult, PSLCEData } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const Academics = () => {
  const [activeTab, setActiveTab] = useState<'performance' | 'administration' | 'assessments' | 'zonal-results'>('performance');
  const [activeAcademicsSubTab, setActiveAcademicsSubTab] = useState<'junior' | 'standardised' | 'pslce'>('junior');
  const [results, setResults] = useState<ExaminationResult[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [examAdmin, setExamAdmin] = useState<ExamAdministration[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assessments, setAssessments] = useState<ContinuousAssessment[]>([]);
  const [juniorResults, setJuniorResults] = useState<JuniorResult[]>([]);
  const [standardisedResults, setStandardisedResults] = useState<StandardisedResult[]>([]);
  const [pslceData, setPslceData] = useState<PSLCEData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('2025');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  const [selectedExam, setSelectedExam] = useState<'PSLCE' | 'JCE' | 'MSCE'>('PSLCE');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'passRate', direction: 'desc' });
  const [showTopPerformers, setShowTopPerformers] = useState(false);

  useEffect(() => {
    const unsubResults = dataService.subscribeToExaminationResults(setResults);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubExamAdmin = dataService.subscribeToExamAdministration(setExamAdmin);
    const unsubAssessments = dataService.subscribeToContinuousAssessments(setAssessments);
    const unsubJunior = dataService.subscribeToJuniorResults(setJuniorResults);
    const unsubStandardised = dataService.subscribeToStandardisedResults(setStandardisedResults);
    const unsubPSLCE = dataService.subscribeToPSLCEData(setPslceData);
    const unsubTeachers = dataService.subscribeToTeachers((data) => {
      setTeachers(data);
      setLoading(false);
    });

    return () => {
      unsubResults();
      unsubSchools();
      unsubExamAdmin();
      unsubAssessments();
      unsubJunior();
      unsubStandardised();
      unsubPSLCE();
      unsubTeachers();
    };
  }, []);

  // Use real data results
  const displayResults = results;

  const filteredResults = displayResults.filter(r => {
    const matchesExam = r.examType === selectedExam;
    const matchesYear = r.year.toString() === selectedYear;
    const matchesSearch = (schools.find(s => s.id === r.schoolId)?.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || false;
    
    if (showTopPerformers) {
      const passRate = r.candidates.total > 0 ? (r.passed.total / r.candidates.total) : 0;
      return matchesExam && matchesYear && matchesSearch && passRate >= 0.85;
    }
    
    return matchesExam && matchesYear && matchesSearch;
  });

  const sortedResults = useMemo(() => {
    const base = [...filteredResults];
    return base.sort((a, b) => {
      const schoolA = schools.find(s => s.id === a.schoolId);
      const schoolB = schools.find(s => s.id === b.schoolId);
      
      let valA: any;
      let valB: any;

      switch (sortConfig.key) {
        case 'schoolName':
          valA = schoolA?.name || '';
          valB = schoolB?.name || '';
          break;
        case 'zone':
          valA = schoolA?.zone || '';
          valB = schoolB?.zone || '';
          break;
        case 'passRate':
          valA = a.candidates.total > 0 ? (a.passed.total / a.candidates.total) : 0;
          valB = b.candidates.total > 0 ? (b.passed.total / b.candidates.total) : 0;
          break;
        default:
          return 0;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredResults, sortConfig, schools]);

  const schoolJuniorPerformance = useMemo(() => {
    const schoolMap = new Map<string, { registered: number; sat: number; passed: number }>();
    
    juniorResults
      .filter(r => r.year === selectedAcademicYear && r.term === selectedTerm)
      .forEach(r => {
        const current = schoolMap.get(r.schoolId) || { registered: 0, sat: 0, passed: 0 };
        schoolMap.set(r.schoolId, {
          registered: current.registered + r.registered.boys + r.registered.girls,
          sat: current.sat + r.sat.boys + r.sat.girls,
          passed: current.passed + r.passed.boys + r.passed.girls
        });
      });

    return Array.from(schoolMap.entries()).map(([schoolId, data]) => {
      const school = schools.find(s => s.id === schoolId);
      return {
        schoolId,
        name: school?.name || 'Unknown',
        zone: school?.zone || 'Unknown',
        ...data,
        passRate: data.sat > 0 ? Math.round((data.passed / data.sat) * 100) : 0
      };
    }).sort((a, b) => {
      if (sortConfig.key === 'schoolName') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'zone') {
        return sortConfig.direction === 'asc' ? a.zone.localeCompare(b.zone) : b.zone.localeCompare(a.zone);
      }
      return sortConfig.direction === 'asc' ? a.passRate - b.passRate : b.passRate - a.passRate;
    });
  }, [juniorResults, selectedAcademicYear, selectedTerm, schools, sortConfig]);

  const schoolStandardisedPerformance = useMemo(() => {
    const schoolMap = new Map<string, { totalLearners: number; totalScore: number }>();
    
    standardisedResults
      .filter(r => r.year === selectedAcademicYear && r.term === selectedTerm)
      .forEach(r => {
        const current = schoolMap.get(r.schoolId) || { totalLearners: 0, totalScore: 0 };
        schoolMap.set(r.schoolId, {
          totalLearners: current.totalLearners + 1,
          totalScore: current.totalScore + r.total
        });
      });

    return Array.from(schoolMap.entries()).map(([schoolId, data]) => {
      const school = schools.find(s => s.id === schoolId);
      const avgScore = data.totalLearners > 0 ? Math.round(data.totalScore / data.totalLearners) : 0;
      return {
        schoolId,
        name: school?.name || 'Unknown',
        zone: school?.zone || 'Unknown',
        ...data,
        avgScore,
        passRate: avgScore
      };
    }).sort((a, b) => {
      if (sortConfig.key === 'schoolName') {
        return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
      }
      if (sortConfig.key === 'zone') {
        return sortConfig.direction === 'asc' ? a.zone.localeCompare(b.zone) : b.zone.localeCompare(a.zone);
      }
      return sortConfig.direction === 'asc' ? a.avgScore - b.avgScore : b.avgScore - a.avgScore;
    });
  }, [standardisedResults, selectedAcademicYear, selectedTerm, schools, sortConfig]);

  const schoolPSLCEPerformance = useMemo(() => {
    return pslceData
      .filter(r => r.year === selectedAcademicYear)
      .map(r => {
        const school = schools.find(s => s.id === r.schoolId);
        const sat = r.summary.sat.boys + r.summary.sat.girls;
        const passed = r.summary.passed.boys + r.summary.passed.girls;
        return {
          schoolId: r.schoolId,
          name: school?.name || 'Unknown',
          zone: school?.zone || 'Unknown',
          sat,
          passed,
          passRate: sat > 0 ? Math.round((passed / sat) * 100) : 0
        };
      }).sort((a, b) => {
        if (sortConfig.key === 'schoolName') {
          return sortConfig.direction === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
        }
        if (sortConfig.key === 'zone') {
          return sortConfig.direction === 'asc' ? a.zone.localeCompare(b.zone) : b.zone.localeCompare(a.zone);
        }
        return sortConfig.direction === 'asc' ? a.passRate - b.passRate : b.passRate - a.passRate;
      });
  }, [pslceData, selectedAcademicYear, schools, sortConfig]);

  const trendData = useMemo(() => {
    const years = ['2022', '2023', '2024', '2025'];
    return years.map(year => {
      const yearResults = displayResults.filter(r => r.year.toString() === year && r.examType === selectedExam);
      const total = yearResults.reduce((acc, r) => acc + r.candidates.total, 0);
      const passed = yearResults.reduce((acc, r) => acc + r.passed.total, 0);
      return {
        year,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0
      };
    });
  }, [displayResults, selectedExam]);

  const totalCandidates = filteredResults.reduce((acc, r) => acc + r.candidates.total, 0);
  const totalPassed = filteredResults.reduce((acc, r) => acc + r.passed.total, 0);
  const avgPassRate = totalCandidates > 0 ? Math.round((totalPassed / totalCandidates) * 100) : 0;

  const schoolPerformanceData = filteredResults.map(r => ({
    name: schools.find(s => s.id === r.schoolId)?.name || 'Unknown',
    passRate: Math.round((r.passed.total / r.candidates.total) * 100),
    total: r.candidates.total
  })).sort((a, b) => b.passRate - a.passRate);

  const genderPerformanceData = [
    { name: 'Boys', passed: filteredResults.reduce((acc, r) => acc + r.passed.boys, 0), total: filteredResults.reduce((acc, r) => acc + r.candidates.boys, 0) },
    { name: 'Girls', passed: filteredResults.reduce((acc, r) => acc + r.passed.girls, 0), total: filteredResults.reduce((acc, r) => acc + r.candidates.girls, 0) },
  ].map(g => ({
    ...g,
    rate: g.total > 0 ? Math.round((g.passed / g.total) * 100) : 0
  }));

  const subjectData = filteredResults.length > 0 ? filteredResults[0].subjectPerformance.map(s => ({
    subject: s.subject,
    avg: Math.round(filteredResults.reduce((acc, r) => acc + (r.subjectPerformance.find(sp => sp.subject === s.subject)?.avgScore || 0), 0) / filteredResults.length)
  })) : [];

  // Use real data examAdmin
  const displayExamAdmin = examAdmin;

  const exportToCSV = () => {
    const headers = ['School Name', 'Exam Type', 'Year', 'Candidates', 'Passed', 'Pass Rate %'];
    const csvData = sortedResults.map(r => {
      const school = schools.find(s => s.id === r.schoolId);
      const total = r.candidates.total;
      const passed = r.passed.total;
      const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
      return [
        school?.name || 'Unknown',
        r.examType,
        r.year,
        total,
        passed,
        rate
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
    link.setAttribute('download', `academic_performance_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center">Loading academic data...</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Examination & Performance</h2>
          <p className="text-sm text-zinc-500">Aggregated examination results and performance analytics for the zone.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={exportToCSV}
          >
            <Download size={18} />
            Export Data
          </Button>
          <Button 
            className={cn(
              "gap-2 transition-all",
              showTopPerformers ? "bg-amber-600 hover:bg-amber-700 ring-2 ring-amber-500/20" : "bg-emerald-600 hover:bg-emerald-700"
            )}
            onClick={() => {
              setShowTopPerformers(!showTopPerformers);
              if (!showTopPerformers) {
                toast.success('Filtering for top performers (Pass rate ≥ 85%)');
              } else {
                toast.info('Showing all performers');
              }
            }}
          >
            <Award size={18} />
            {showTopPerformers ? 'Showing Top' : 'Top Performers'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200">
        <button
          onClick={() => setActiveTab('performance')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'performance' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Performance Analytics
        </button>
        <button
          onClick={() => setActiveTab('administration')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'administration' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Examination Administration
        </button>
        <button
          onClick={() => setActiveTab('assessments')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'assessments' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Continuous Assessment
        </button>
        <button
          onClick={() => setActiveTab('zonal-results')}
          className={cn(
            "px-6 py-3 text-sm font-bold border-b-2 transition-all",
            activeTab === 'zonal-results' ? "border-emerald-500 text-emerald-600" : "border-transparent text-zinc-500 hover:text-zinc-700"
          )}
        >
          Zonal Results
        </button>
      </div>

      {activeTab === 'performance' ? (
        <>
          {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Total Candidates</p>
              <h3 className="text-2xl font-black text-zinc-900">{totalCandidates}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Avg Pass Rate</p>
              <h3 className="text-2xl font-black text-zinc-900">{avgPassRate}%</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Top School</p>
              <h3 className="text-lg font-black text-zinc-900 truncate">{schoolPerformanceData[0]?.name || 'N/A'}</h3>
            </div>
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Top Subject</p>
              <h3 className="text-lg font-black text-zinc-900">{subjectData.sort((a, b) => b.avg - a.avg)[0]?.subject || 'N/A'}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <Input 
              placeholder="Search schools..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-zinc-400" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-zinc-400" />
            <div className="flex p-1 bg-zinc-100 rounded-xl">
              {(['PSLCE', 'JCE', 'MSCE'] as const).map((exam) => (
                <button
                  key={exam}
                  onClick={() => setSelectedExam(exam)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                    selectedExam === exam ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {exam}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Performance Trend (Pass Rate %)" className="lg:col-span-2">
          <div className="h-[350px] w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="year" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="passRate" 
                  name="Pass Rate" 
                  stroke="#10b981" 
                  strokeWidth={4} 
                  dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Gender Performance">
          <div className="h-[350px] w-full p-4 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={genderPerformanceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="passed"
                >
                  <Cell fill="#0ea5e9" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="w-full space-y-3 mt-4">
              {genderPerformanceData.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full", i === 0 ? "bg-sky-500" : "bg-emerald-500")} />
                    <span className="text-sm font-bold text-zinc-700">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-zinc-900">{item.rate}% Pass Rate</p>
                    <p className="text-[10px] text-zinc-400 font-bold">{item.passed} of {item.total} passed</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Pass Rate by School" className="lg:col-span-2">
          <div className="h-[350px] w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={schoolPerformanceData} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f1f1" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fill: '#71717a', fontWeight: 500 }}
                  width={120}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`${value}%`, 'Pass Rate']}
                />
                <Bar dataKey="passRate" radius={[0, 4, 4, 0]} barSize={20}>
                  {schoolPerformanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.passRate > 80 ? '#10b981' : entry.passRate > 60 ? '#3b82f6' : '#f59e0b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Subject Performance Analysis">
          <div className="h-[350px] w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f1f1" />
                <XAxis 
                  dataKey="subject" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a', fontWeight: 600 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="avg" name="Average Score" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Detailed Results Table */}
      <Card className="overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">School Performance Breakdown</h3>
          <Button variant="ghost" size="sm" className="text-emerald-600 font-bold">View Full Details</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th 
                  className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => setSortConfig({ 
                    key: 'schoolName', 
                    direction: sortConfig.key === 'schoolName' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                  })}
                >
                  <div className="flex items-center gap-1">
                    School Name
                    {sortConfig.key === 'schoolName' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Candidates</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Passed</th>
                <th 
                  className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors"
                  onClick={() => setSortConfig({ 
                    key: 'passRate', 
                    direction: sortConfig.key === 'passRate' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                  })}
                >
                  <div className="flex items-center gap-1">
                    Pass Rate
                    {sortConfig.key === 'passRate' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                  </div>
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Top Subject</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sortedResults.map((result) => {
                const school = schools.find(s => s.id === result.schoolId);
                const passRate = Math.round((result.passed.total / result.candidates.total) * 100);
                const topSubject = [...result.subjectPerformance].sort((a, b) => b.avgScore - a.avgScore)[0];
                
                return (
                  <tr key={result.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                          <BookOpen size={16} />
                        </div>
                        <span className="text-sm font-bold text-zinc-900">{school?.name || 'Unknown School'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-600">{result.candidates.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-600">{result.passed.total}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 w-16 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              passRate > 80 ? "bg-emerald-500" : passRate > 60 ? "bg-blue-500" : "bg-amber-500"
                            )}
                            style={{ width: `${passRate}%` }}
                          />
                        </div>
                        <span className="text-sm font-black text-zinc-900">{passRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-1 rounded-md">{topSubject?.subject}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <ChevronRight size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
        </>
      ) : activeTab === 'administration' ? (
        <ExamAdministrationView 
          examAdmin={displayExamAdmin} 
          teachers={teachers} 
          schools={schools} 
        />
      ) : activeTab === 'assessments' ? (
        <ContinuousAssessmentView 
          assessments={assessments}
          schools={schools}
          teachers={teachers}
        />
      ) : (
        renderZonalResults()
      )}
    </div>
  );

  function renderZonalResults() {
    const juniorClasses = ['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4'];
    const subjects = ['CHI', 'ENG', 'ARTS', 'MAT', 'P/SCI', 'SES'];
    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Zonal Academic Results</h2>
            <p className="text-zinc-500 text-sm">Aggregated performance data across all schools in the zone.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 p-1 rounded-lg">
              <select 
                className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(parseInt(e.target.value))}
              >
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
              {activeAcademicsSubTab !== 'pslce' && (
                <select 
                  className="bg-transparent text-xs font-bold text-zinc-600 outline-none px-2 border-l border-zinc-200"
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(parseInt(e.target.value))}
                >
                  <option value={1}>Term 1</option>
                  <option value={2}>Term 2</option>
                  <option value={3}>Term 3</option>
                </select>
              )}
            </div>
            <div className="flex p-1 bg-zinc-100 rounded-xl">
              {(['junior', 'standardised', 'pslce'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveAcademicsSubTab(tab)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase tracking-wider",
                    activeAcademicsSubTab === tab 
                      ? "bg-white text-emerald-600 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700"
                  )}
                >
                  {tab === 'junior' ? 'Junior Classes' : tab === 'standardised' ? 'Standardised Exam' : 'PSLCE Results'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeAcademicsSubTab === 'junior' && (
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="text-lg font-bold text-zinc-900">Junior Classes (P-Klass to Standard 4) - Zonal Aggregate</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th rowSpan={2} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-r border-zinc-100">Class</th>
                      <th colSpan={3} className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Registered</th>
                      <th colSpan={3} className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Sat</th>
                      <th colSpan={3} className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Passed</th>
                      <th colSpan={3} className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Failed</th>
                      <th rowSpan={2} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Pass %</th>
                    </tr>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">B</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">G</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100 bg-zinc-100/50">T</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">B</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">G</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100 bg-zinc-100/50">T</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">B</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">G</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100 bg-zinc-100/50">T</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">B</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100">G</th>
                      <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-r border-zinc-100 bg-zinc-100/50">T</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {juniorClasses.map(cls => {
                      const classResults = juniorResults.filter(r => r.className === cls && r.year === selectedAcademicYear && r.term === selectedTerm);
                      
                      const regB = classResults.reduce((sum, r) => sum + r.registered.boys, 0);
                      const regG = classResults.reduce((sum, r) => sum + r.registered.girls, 0);
                      const satB = classResults.reduce((sum, r) => sum + r.sat.boys, 0);
                      const satG = classResults.reduce((sum, r) => sum + r.sat.girls, 0);
                      const passB = classResults.reduce((sum, r) => sum + r.passed.boys, 0);
                      const passG = classResults.reduce((sum, r) => sum + r.passed.girls, 0);
                      const failB = classResults.reduce((sum, r) => sum + r.failed.boys, 0);
                      const failG = classResults.reduce((sum, r) => sum + r.failed.girls, 0);
                      
                      const satT = satB + satG;
                      const passT = passB + passG;
                      const passRate = satT > 0 ? Math.round((passT / satT) * 100) : 0;

                      return (
                        <tr key={cls} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-zinc-700 border-r border-zinc-100">{cls}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{regB}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{regG}</td>
                          <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-zinc-50/30">{regB + regG}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{satB}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{satG}</td>
                          <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-zinc-50/30">{satB + satG}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-emerald-600">{passB}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-emerald-600">{passG}</td>
                          <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-emerald-50/30 text-emerald-700">{passB + passG}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-rose-600">{failB}</td>
                          <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-rose-600">{failG}</td>
                          <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-rose-50/30 text-rose-700">{failB + failG}</td>
                          <td className="px-2 py-3 text-sm text-center font-black text-zinc-900">{passRate}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">School Performance Breakdown (Junior)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th 
                        className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'schoolName', 
                          direction: sortConfig.key === 'schoolName' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center gap-1">
                          School Name
                          {sortConfig.key === 'schoolName' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'zone', 
                          direction: sortConfig.key === 'zone' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center gap-1">
                          Zone
                          {sortConfig.key === 'zone' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Registered</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sat</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Passed</th>
                      <th 
                        className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'passRate', 
                          direction: sortConfig.key === 'passRate' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Pass %
                          {sortConfig.key === 'passRate' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {schoolJuniorPerformance.map(item => (
                      <tr key={item.schoolId} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-zinc-900">{item.name}</td>
                        <td className="px-4 py-4 text-sm text-zinc-600">{item.zone}</td>
                        <td className="px-4 py-4 text-sm text-center">{item.registered}</td>
                        <td className="px-4 py-4 text-sm text-center">{item.sat}</td>
                        <td className="px-4 py-4 text-sm text-center text-emerald-600">{item.passed}</td>
                        <td className="px-6 py-4 text-sm text-center font-black text-zinc-900">{item.passRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeAcademicsSubTab === 'standardised' && (
          <div className="space-y-8">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Standardised Examination (Standard 5 - 8) - Zonal Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th 
                        className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'schoolName', 
                          direction: sortConfig.key === 'schoolName' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center gap-1">
                          School Name
                          {sortConfig.key === 'schoolName' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                      <th 
                        className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'zone', 
                          direction: sortConfig.key === 'zone' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center gap-1">
                          Zone
                          {sortConfig.key === 'zone' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Learners</th>
                      <th 
                        className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center cursor-pointer hover:text-emerald-600 transition-colors" 
                        onClick={() => setSortConfig({ 
                          key: 'passRate', 
                          direction: sortConfig.key === 'passRate' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                        })}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Avg Score
                          {sortConfig.key === 'passRate' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {schoolStandardisedPerformance.map(item => (
                      <tr key={item.schoolId} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-zinc-900">{item.name}</td>
                        <td className="px-4 py-4 text-sm text-zinc-600">{item.zone}</td>
                        <td className="px-4 py-4 text-sm text-center">{item.totalLearners}</td>
                        <td className="px-6 py-4 text-sm text-center font-black text-emerald-700">{item.avgScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Top Learners (Standardised)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name of Learner</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sex</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">School</th>
                      {subjects.map(sub => (
                        <th key={sub} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">{sub}</th>
                      ))}
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center bg-zinc-100/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {standardisedResults
                      .filter(r => r.year === selectedAcademicYear && r.term === selectedTerm)
                      .sort((a, b) => b.total - a.total)
                      .map(record => (
                        <tr key={record.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">{record.learnerName}</td>
                          <td className="px-4 py-4 text-sm text-center text-zinc-600">{record.sex}</td>
                          <td className="px-4 py-4 text-sm text-center text-zinc-600">
                            {schools.find(s => s.id === record.schoolId)?.name || 'Unknown'}
                          </td>
                          {subjects.map(sub => (
                            <td key={sub} className="px-4 py-4 text-sm text-center font-bold text-zinc-700">
                              {record.scores[sub as keyof typeof record.scores]}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-sm text-center font-black text-emerald-700 bg-emerald-50/30">{record.total}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeAcademicsSubTab === 'pslce' && (
          <div className="space-y-10">
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">1</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Zonal PSLCE Summary</h3>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Gender</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Registered</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sat</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Passed</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Failed</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Not Sat</th>
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center bg-zinc-100/50">Pass %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(() => {
                      const yearResults = pslceData.filter(d => d.year === selectedAcademicYear);
                      
                      const summary = {
                        boys: { registered: 0, sat: 0, passed: 0, failed: 0, notSat: 0 },
                        girls: { registered: 0, sat: 0, passed: 0, failed: 0, notSat: 0 }
                      };

                      yearResults.forEach(r => {
                        (['boys', 'girls'] as const).forEach(g => {
                          summary[g].registered += r.summary.registered[g];
                          summary[g].sat += r.summary.sat[g];
                          summary[g].passed += r.summary.passed[g];
                          summary[g].failed += r.summary.failed[g];
                          summary[g].notSat += r.summary.notSat[g];
                        });
                      });

                      const types = [
                        { label: 'Boys', data: summary.boys },
                        { label: 'Girls', data: summary.girls },
                        { label: 'Total', data: {
                          registered: summary.boys.registered + summary.girls.registered,
                          sat: summary.boys.sat + summary.girls.sat,
                          passed: summary.boys.passed + summary.girls.passed,
                          failed: summary.boys.failed + summary.girls.failed,
                          notSat: summary.boys.notSat + summary.girls.notSat
                        }}
                      ];

                      return types.map(type => {
                        const passRate = type.data.sat > 0 ? Math.round((type.data.passed / type.data.sat) * 100) : 0;
                        return (
                          <tr key={type.label} className={cn("hover:bg-zinc-50/50 transition-colors", type.label === 'Total' && "bg-zinc-50/30 font-bold")}>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-700">{type.label}</td>
                            <td className="px-4 py-4 text-sm text-center">{type.data.registered}</td>
                            <td className="px-4 py-4 text-sm text-center">{type.data.sat}</td>
                            <td className="px-4 py-4 text-sm text-center text-emerald-600">{type.data.passed}</td>
                            <td className="px-4 py-4 text-sm text-center text-rose-600">{type.data.failed}</td>
                            <td className="px-4 py-4 text-sm text-center text-amber-600">{type.data.notSat}</td>
                            <td className="px-6 py-4 text-sm text-center font-black text-zinc-900 bg-zinc-100/20">{passRate}%</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </Card>
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">School Performance Breakdown (PSLCE)</h3>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th 
                          className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                          onClick={() => setSortConfig({ 
                            key: 'schoolName', 
                            direction: sortConfig.key === 'schoolName' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                          })}
                        >
                          <div className="flex items-center gap-1">
                            School Name
                            {sortConfig.key === 'schoolName' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                          </div>
                        </th>
                        <th 
                          className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest cursor-pointer hover:text-emerald-600 transition-colors" 
                          onClick={() => setSortConfig({ 
                            key: 'zone', 
                            direction: sortConfig.key === 'zone' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                          })}
                        >
                          <div className="flex items-center gap-1">
                            Zone
                            {sortConfig.key === 'zone' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                          </div>
                        </th>
                        <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sat</th>
                        <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Passed</th>
                        <th 
                          className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center cursor-pointer hover:text-emerald-600 transition-colors" 
                          onClick={() => setSortConfig({ 
                            key: 'passRate', 
                            direction: sortConfig.key === 'passRate' && sortConfig.direction === 'desc' ? 'asc' : 'desc' 
                          })}
                        >
                          <div className="flex items-center justify-center gap-1">
                            Pass %
                            {sortConfig.key === 'passRate' && (sortConfig.direction === 'desc' ? <TrendingUp size={10} className="rotate-180" /> : <TrendingUp size={10} />)}
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {schoolPSLCEPerformance.map(item => (
                        <tr key={item.schoolId} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-zinc-900">{item.name}</td>
                          <td className="px-4 py-4 text-sm text-zinc-600">{item.zone}</td>
                          <td className="px-4 py-4 text-sm text-center">{item.sat}</td>
                          <td className="px-4 py-4 text-sm text-center text-emerald-600">{item.passed}</td>
                          <td className="px-6 py-4 text-sm text-center font-black text-zinc-900">{item.passRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>

            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">3</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Zonal Selection List</h3>
              </div>
              
              {(() => {
                const yearResults = pslceData.filter(d => d.year === selectedAcademicYear);
                const selection = {
                  national: { boys: 0, girls: 0 },
                  districtBoarding: { boys: 0, girls: 0 },
                  day: { boys: 0, girls: 0 },
                  cdss: { boys: 0, girls: 0 }
                };

                yearResults.forEach(r => {
                  (['national', 'districtBoarding', 'day', 'cdss'] as const).forEach(field => {
                    selection[field].boys += r.selection[field].boys;
                    selection[field].girls += r.selection[field].girls;
                  });
                });

                const selections = [
                  { label: 'National SS', data: selection.national },
                  { label: 'District Boarding SS', data: selection.districtBoarding },
                  { label: 'Day SS', data: selection.day },
                  { label: 'CDSS', data: selection.cdss }
                ];

                return (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {selections.map(sel => (
                      <Card key={sel.label} className="p-4 bg-zinc-50 border-zinc-200">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">{sel.label}</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">M</p>
                            <p className="text-sm font-bold text-zinc-900">{sel.data.boys}</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-bold text-zinc-500 uppercase">F</p>
                            <p className="text-sm font-bold text-zinc-900">{sel.data.girls}</p>
                          </div>
                          <div className="bg-white rounded-lg border border-zinc-100 py-1">
                            <p className="text-[9px] font-bold text-emerald-600 uppercase">T</p>
                            <p className="text-sm font-black text-emerald-700">{sel.data.boys + sel.data.girls}</p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                );
              })()}
            </section>

            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">4</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Zonal Pass by Subject (Grade Distribution)</h3>
              </div>
              <Card className="overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Subject</th>
                      {['A', 'B', 'C', 'D'].map(grade => (
                        <th key={grade} colSpan={3} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-l border-zinc-100">Grade {grade}</th>
                      ))}
                    </tr>
                    <tr className="bg-zinc-50/50 border-b border-zinc-100">
                      <th className="px-6 py-2"></th>
                      {['A', 'B', 'C', 'D'].map(grade => (
                        <React.Fragment key={grade}>
                          <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center border-l border-zinc-100">M</th>
                          <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center">F</th>
                          <th className="px-2 py-2 text-[9px] font-bold text-zinc-500 text-center bg-zinc-100/30">T</th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {(() => {
                      const yearResults = pslceData.filter(d => d.year === selectedAcademicYear);
                      const subjects = ['CHI', 'ENG', 'ARTS', 'MAT', 'PSCI', 'SES'];
                      const grades = ['A', 'B', 'C', 'D'] as const;

                      return subjects.map(sub => {
                        const aggregated = {
                          A: { boys: 0, girls: 0 },
                          B: { boys: 0, girls: 0 },
                          C: { boys: 0, girls: 0 },
                          D: { boys: 0, girls: 0 }
                        };

                        yearResults.forEach(r => {
                          if (r.subjectGrades?.[sub]) {
                            grades.forEach(g => {
                              aggregated[g].boys += r.subjectGrades[sub][g].boys;
                              aggregated[g].girls += r.subjectGrades[sub][g].girls;
                            });
                          }
                        });

                        return (
                          <tr key={sub} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-4 text-sm font-bold text-zinc-700">{sub}</td>
                            {grades.map(g => (
                              <React.Fragment key={g}>
                                <td className="px-2 py-4 text-sm text-center border-l border-zinc-100">{aggregated[g].boys}</td>
                                <td className="px-2 py-4 text-sm text-center">{aggregated[g].girls}</td>
                                <td className="px-2 py-4 text-sm text-center font-bold bg-zinc-50/50">{aggregated[g].boys + aggregated[g].girls}</td>
                              </React.Fragment>
                            ))}
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </Card>
            </section>
          </div>
        )}
      </div>
    );
  }
};

const ContinuousAssessmentView = ({ assessments, schools, teachers }: {
  assessments: ContinuousAssessment[],
  schools: School[],
  teachers: Teacher[]
}) => {
  const { user } = useAuth();
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

  // Auto-calculation for Continuous Assessment
  const currentStats = React.useMemo(() => {
    if (!formData.results?.length) return { avgScore: 0, passRate: 0 };
    const total = formData.results.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = total / formData.results.length;
    const passCount = formData.results.filter(r => r.score >= (formData.maxScore! / 2)).length;
    const passRate = (passCount / formData.results.length) * 100;
    return { avgScore, passRate };
  }, [formData.results, formData.maxScore]);

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

    const { avgScore, passRate } = currentStats;

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
    const matchesSearch = (a.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (a.standard || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStandard = filterStandard === 'All' || a.standard === filterStandard;
    const matchesSubject = filterSubject === 'All' || a.subject === filterSubject;
    return matchesSearch && matchesStandard && matchesSubject;
  });

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await dataService.deleteContinuousAssessment(id);
    } catch (error) {
      console.error('Error deleting assessment:', error);
    }
  };

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
            value={filterStandard ?? "All"}
            onChange={(e) => setFilterStandard(e.target.value)}
          >
            <option value="All">All Standards</option>
            {standards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterSubject ?? "All"}
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
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-700 text-xs font-bold uppercase">
                    {assessment.assessmentType}
                  </span>
                  <button 
                    onClick={(e) => handleDelete(assessment.id, e)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
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
              <div className="flex items-center gap-4 mr-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Avg Score</p>
                  <p className="text-lg font-bold text-emerald-600">{currentStats.avgScore.toFixed(1)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Pass Rate</p>
                  <p className="text-lg font-bold text-blue-600">{currentStats.passRate.toFixed(1)}%</p>
                </div>
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
                      value={formData.standard ?? ""}
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
                      value={formData.subject ?? ""}
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
                      value={formData.assessmentType ?? "Test"}
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

const ExamAdministrationView = ({ examAdmin, teachers, schools }: { 
  examAdmin: ExamAdministration[], 
  teachers: Teacher[], 
  schools: School[] 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [formData, setFormData] = useState<Partial<ExamAdministration>>({
    examType: 'PSLCE',
    year: new Date().getFullYear(),
    role: 'Invigilator',
    status: 'Assigned'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacherId || !formData.schoolId || !formData.role) return;

    try {
      await dataService.addExamAdministration({
        ...formData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as ExamAdministration);
      setShowAddModal(false);
      setFormData({
        examType: 'PSLCE',
        year: new Date().getFullYear(),
        role: 'Invigilator',
        status: 'Assigned'
      });
    } catch (error) {
      console.error('Error adding exam administration:', error);
    }
  };

  const years = Array.from(new Set(examAdmin.map(ea => ea.year.toString()))).sort((a, b) => b.localeCompare(a));
  const roles = ['Supervisor', 'Invigilator', 'Marker', 'Cluster Leader', 'Security'];

  const filteredAdmin = examAdmin.filter(ea => {
    const teacher = teachers.find(t => t.id === ea.teacherId);
    const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}`.toLowerCase() : '';
    const matchesSearch = (teacherName || '').includes(searchTerm.toLowerCase()) || 
                          (ea.examType || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = selectedYear === 'All' || ea.year.toString() === selectedYear;
    const matchesRole = selectedRole === 'All' || ea.role === selectedRole;
    return matchesSearch && matchesYear && matchesRole;
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await dataService.deleteExamAdministration(id);
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Examination Administration</h1>
          <p className="text-zinc-500">Manage teacher assignments for national examinations</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus size={18} />
          Add Assignment
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-1 min-w-[240px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <Input 
              placeholder="Search teachers or exams..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-zinc-400" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Years</option>
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-zinc-400" />
            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Roles</option>
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Examination Administration Records</h3>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full text-xs font-bold">{filteredAdmin.length} Records</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Teacher</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Exam Type</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Year</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Assigned Center</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredAdmin.map((admin) => {
                const teacher = teachers.find(t => t.id === admin.teacherId);
                const school = schools.find(s => s.id === admin.schoolId);
                
                return (
                  <tr key={admin.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px] font-bold">
                          {teacher ? `${teacher.firstName[0]}${teacher.lastName[0]}` : '??'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown Teacher'}</p>
                          <p className="text-[10px] text-zinc-400 font-medium">{teacher?.emisCode || 'No EMIS'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-zinc-700">{admin.examType}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-zinc-600">{admin.year}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider",
                        admin.role === 'Supervisor' ? "bg-purple-50 text-purple-700" :
                        admin.role === 'Invigilator' ? "bg-blue-50 text-blue-700" :
                        admin.role === 'Marker' ? "bg-amber-50 text-amber-700" :
                        "bg-zinc-100 text-zinc-600"
                      )}>
                        {admin.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600">{school?.name || 'Unknown Center'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold",
                        admin.status === 'Completed' ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        <div className={cn("h-1.5 w-1.5 rounded-full", admin.status === 'Completed' ? "bg-emerald-500" : "bg-amber-500")} />
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDelete(admin.id)}
                        className="p-2 hover:bg-rose-50 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredAdmin.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">No administration records found for the selected filters</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Assignment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900">Add Exam Assignment</h2>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Teacher</label>
                <select
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                >
                  <option value="">Select Teacher</option>
                  {teachers.sort((a, b) => a.firstName.localeCompare(b.firstName)).map(t => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Exam Type</label>
                <select
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value as any })}
                  required
                >
                  <option value="PSLCE">PSLCE</option>
                  <option value="JCE">JCE</option>
                  <option value="MSCE">MSCE</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Year</label>
                  <Input
                    type="number"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Role</label>
                  <select
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    required
                  >
                    {roles.map(role => <option key={role} value={role}>{role}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Assigned Center (School)</label>
                <select
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                  value={formData.schoolId}
                  onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                  required
                >
                  <option value="">Select School</option>
                  {schools.sort((a, b) => a.name.localeCompare(b.name)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button type="submit">Save Assignment</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};
