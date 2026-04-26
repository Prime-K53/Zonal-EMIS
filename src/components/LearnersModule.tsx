import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { 
  Users, Search, Filter, Download, ArrowUpRight, ArrowDownRight, 
  TrendingUp, Award, Accessibility, PieChart, Calendar, 
  ChevronRight, School, UserPlus, GraduationCap, History,
  FileText, BarChart3, AlertTriangle, Target, RefreshCw,
  LineChart as LineChartIcon, Users2
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, BarChart, Bar, Legend, Cell
} from 'recharts';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { Learner, PromotionRecord, EnrollmentStats, School as SchoolType } from '../types';
import { cn } from '../lib/utils';

type SubTabType = 'overview' | 'admissions' | 'registry' | 'promotions' | 'sne' | 'back-to-school' | 'repeaters' | 'enrollment';

export const LearnersModule = () => {
  const [activeTab, setActiveTab] = useState<SubTabType>('overview');
  const [learners, setLearners] = useState<Learner[]>([]);
  const [promotionRecords, setPromotionRecords] = useState<PromotionRecord[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStandard, setSelectedStandard] = useState('All');

  useEffect(() => {
    const unsubLearners = dataService.subscribeToLearners(setLearners);
    const unsubPromotions = dataService.subscribeToPromotionRecords(setPromotionRecords);
    const unsubEnrollment = dataService.subscribeToEnrollmentStats(setEnrollmentStats);
    const unsubSchools = dataService.subscribeToSchools((data) => {
      setSchools(data);
      setLoading(false);
    });

    return () => {
      unsubLearners();
      unsubPromotions();
      unsubEnrollment();
      unsubSchools();
    };
  }, []);

  const years = useMemo(() => {
    const yearsSet = new Set<string>();
    yearsSet.add(new Date().getFullYear().toString());
    (enrollmentStats || []).forEach(s => yearsSet.add(s.academicYear));
    (promotionRecords || []).forEach(r => yearsSet.add(r.academicYear));
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [enrollmentStats, promotionRecords]);

  const standards = ['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'];

  const schoolMap = useMemo(() => {
    const map: Record<string, string> = {};
    (schools || []).forEach(s => map[s.id] = s.name);
    return map;
  }, [schools]);

  const filteredLearners = useMemo(() => {
    return (learners || []).filter(l => {
      const matchesSearch = (l.firstName + ' ' + l.lastName).toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStandard = selectedStandard === 'All' || l.standard === selectedStandard;
      const matchesTab = 
        activeTab === 'sne' ? l.isSNE :
        activeTab === 'back-to-school' ? l.status === 'BackToSchool' :
        activeTab === 'admissions' ? l.isAdmission :
        activeTab === 'registry' ? !l.isAdmission :
        true;
      return matchesSearch && matchesStandard && matchesTab;
    });
  }, [learners, searchTerm, selectedStandard, activeTab, selectedYear]);

  const statsByYear = useMemo(() => {
    const yearStats = (enrollmentStats || []).filter(s => s.academicYear === selectedYear);
    const yearPromotions = (promotionRecords || []).filter(r => r.academicYear === selectedYear);
    
    return {
      totalBoys: yearStats.reduce((acc, s) => acc + (s.boys || 0), 0),
      totalGirls: yearStats.reduce((acc, s) => acc + (s.girls || 0), 0),
      totalTransfersIn: yearStats.reduce((acc, s) => acc + (s.transfersIn || 0), 0),
      totalTransfersOut: yearStats.reduce((acc, s) => acc + (s.transfersOut || 0), 0),
      totalDropouts: yearStats.reduce((acc, s) => acc + (s.dropouts || 0), 0),
      totalBackToSchool: yearStats.reduce((acc, s) => acc + (s.backToSchoolBoys || 0) + (s.backToSchoolGirls || 0), 0),
      totalPromoted: yearPromotions.reduce((acc, r) => acc + (r.promoted || 0), 0),
      totalRepeated: yearPromotions.reduce((acc, r) => acc + (r.repeated || 0), 0),
      repeatedBoys: yearPromotions.reduce((acc, r) => acc + (r.repeatedBoys || 0), 0),
      repeatedGirls: yearPromotions.reduce((acc, r) => acc + (r.repeatedGirls || 0), 0),
    };
  }, [enrollmentStats, promotionRecords, selectedYear]);

  const trendData = useMemo(() => {
    const sortedYears = [...years].sort();
    return sortedYears.map(year => {
      const yearStats = (enrollmentStats || []).filter(s => s.academicYear === year);
      return {
        year,
        total: yearStats.reduce((acc, s) => acc + (s.boys || 0) + (s.girls || 0), 0),
        boys: yearStats.reduce((acc, s) => acc + (s.boys || 0), 0),
        girls: yearStats.reduce((acc, s) => acc + (s.girls || 0), 0),
      };
    });
  }, [enrollmentStats, years]);

  const exportToCSV = () => {
    const headers = ['First Name', 'Last Name', 'Gender', 'Standard', 'School', 'Status', 'SNE', 'SNE Type'];
    const csvData = filteredLearners.map(l => [
      l.firstName,
      l.lastName,
      l.gender,
      l.standard,
      schoolMap[l.schoolId] || 'Unknown',
      l.status,
      l.isSNE ? 'Yes' : 'No',
      l.sneType || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `learner_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <RefreshCw className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  const renderOverview = () => {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-emerald-50 border-emerald-100">
            <div className="flex items-center justify-between mb-2">
              <Users size={20} className="text-emerald-600" />
              <span className="text-[10px] font-bold text-emerald-600 uppercase">Total Enrollment</span>
            </div>
            <p className="text-2xl font-black text-emerald-900">{statsByYear.totalBoys + statsByYear.totalGirls}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-medium text-emerald-600">B: {statsByYear.totalBoys}</span>
              <span className="text-[10px] font-medium text-emerald-600">G: {statsByYear.totalGirls}</span>
            </div>
          </Card>
          <Card className="p-4 bg-blue-50 border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp size={20} className="text-blue-600" />
              <span className="text-[10px] font-bold text-blue-600 uppercase">Promoted</span>
            </div>
            <p className="text-2xl font-black text-blue-900">{statsByYear.totalPromoted}</p>
            <p className="text-[10px] font-medium text-blue-600 mt-1">Academic Year {selectedYear}</p>
          </Card>
          <Card className="p-4 bg-amber-50 border-amber-100">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw size={20} className="text-amber-600" />
              <span className="text-[10px] font-bold text-amber-600 uppercase">Back to School</span>
            </div>
            <p className="text-2xl font-black text-amber-900">{statsByYear.totalBackToSchool}</p>
            <p className="text-[10px] font-medium text-amber-600 mt-1">Re-enrolled this year</p>
          </Card>
          <Card className="p-4 bg-red-50 border-red-100">
            <div className="flex items-center justify-between mb-2">
              <AlertTriangle size={20} className="text-red-600" />
              <span className="text-[10px] font-bold text-red-600 uppercase">Dropouts</span>
            </div>
            <p className="text-2xl font-black text-red-900">{statsByYear.totalDropouts}</p>
            <p className="text-[10px] font-medium text-red-600 mt-1">Requiring intervention</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xs font-bold text-zinc-500 uppercase">Enrollment Trends</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Boys</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase">Girls</span>
                </div>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="year" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fontWeight: 700, fill: '#71717a' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Line type="monotone" dataKey="boys" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="girls" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">Enrollment by Standard</h4>
            <div className="space-y-4">
              {standards.map(standard => {
                const stats = (enrollmentStats || []).filter(s => s.standard === standard && s.academicYear === selectedYear);
                const boys = stats.reduce((acc, s) => acc + (s.boys || 0), 0);
                const girls = stats.reduce((acc, s) => acc + (s.girls || 0), 0);
                const total = boys + girls;
                const maxTotal = Math.max(...standards.map(s => {
                  const st = (enrollmentStats || []).filter(stats => stats.standard === s && stats.academicYear === selectedYear);
                  return st.reduce((acc, stats) => acc + (stats.boys || 0) + (stats.girls || 0), 0);
                }), 1);
                
                return (
                  <div key={standard} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>{standard}</span>
                      <span className="text-zinc-400">{total}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden flex">
                      <div className="h-full bg-blue-500" style={{ width: `${(boys / maxTotal) * 100}%` }} />
                      <div className="h-full bg-pink-500" style={{ width: `${(girls / maxTotal) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">SNE Distribution by Difficulty</h4>
            <div className="space-y-4">
              {['Visual', 'Hearing', 'Physical', 'Mental', 'Learning', 'Speech'].map(type => {
                const count = (learners || []).filter(l => l.isSNE && l.sneType?.toLowerCase().includes(type.toLowerCase())).length;
                const totalSNE = (learners || []).filter(l => l.isSNE).length || 1;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
                      <span>{type}</span>
                      <span className="text-zinc-400">{count}</span>
                    </div>
                    <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500" style={{ width: `${(count / totalSNE) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-6">
            <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">Repeaters by Gender ({selectedYear})</h4>
            <div className="flex items-center justify-around h-[200px]">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-8 border-blue-500 flex items-center justify-center mb-2">
                  <span className="text-xl font-black text-blue-900">{statsByYear.repeatedBoys}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Boys</span>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 rounded-full border-8 border-pink-500 flex items-center justify-center mb-2">
                  <span className="text-xl font-black text-pink-900">{statsByYear.repeatedGirls}</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Girls</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderRegistry = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
            <Input 
              placeholder="Search learners by name..." 
              className="pl-10"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={selectedStandard}
            onChange={e => setSelectedStandard(e.target.value)}
          >
            <option value="All">All Standards</option>
            {standards.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">Learner Name</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4">Standard</th>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">SNE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredLearners.map(learner => (
                <tr key={learner.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">
                    {learner.firstName} {learner.lastName}
                  </td>
                  <td className="px-6 py-4">{learner.gender}</td>
                  <td className="px-6 py-4">{learner.standard}</td>
                  <td className="px-6 py-4 text-zinc-500">{schoolMap[learner.schoolId] || 'Unknown'}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase",
                      learner.status === 'Active' ? "bg-emerald-50 text-emerald-600" :
                      learner.status === 'Transferred' ? "bg-blue-50 text-blue-600" :
                      learner.status === 'Dropped' ? "bg-red-50 text-red-600" :
                      learner.status === 'BackToSchool' ? "bg-amber-50 text-amber-600" :
                      "bg-zinc-50 text-zinc-600"
                    )}>
                      {learner.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {learner.isSNE ? (
                      <span className="text-amber-600 font-bold text-[10px] uppercase flex items-center gap-1">
                        <Accessibility size={12} />
                        {learner.sneType}
                      </span>
                    ) : (
                      <span className="text-zinc-300">No</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderEnrollment = () => {
    return (
      <div className="space-y-6">
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">School Name</th>
                <th className="px-6 py-4">Standard</th>
                <th className="px-6 py-4">Boys</th>
                <th className="px-6 py-4">Girls</th>
                <th className="px-6 py-4">Total</th>
                <th className="px-6 py-4">Transfers In</th>
                <th className="px-6 py-4">Transfers Out</th>
                <th className="px-6 py-4">Dropouts</th>
                <th className="px-6 py-4">Back to School</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {(enrollmentStats || []).filter(s => s.academicYear === selectedYear).map(stat => (
                <tr key={stat.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-zinc-900">{schoolMap[stat.schoolId] || 'Unknown'}</td>
                  <td className="px-6 py-4">{stat.standard}</td>
                  <td className="px-6 py-4">{stat.boys}</td>
                  <td className="px-6 py-4">{stat.girls}</td>
                  <td className="px-6 py-4 font-bold">{(stat.boys || 0) + (stat.girls || 0)}</td>
                  <td className="px-6 py-4 text-emerald-600">+{stat.transfersIn}</td>
                  <td className="px-6 py-4 text-blue-600">-{stat.transfersOut}</td>
                  <td className="px-6 py-4 text-red-600">{stat.dropouts}</td>
                  <td className="px-6 py-4 text-amber-600">{(stat.backToSchoolBoys || 0) + (stat.backToSchoolGirls || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPromotions = () => {
    const records = (promotionRecords || []).filter(r => {
      const matchesYear = r.academicYear === selectedYear;
      const matchesStandard = selectedStandard === 'All' || r.standard === selectedStandard;
      const matchesTab = activeTab === 'repeaters' ? (r.repeated || 0) > 0 : true;
      return matchesYear && matchesStandard && matchesTab;
    });

    return (
      <div className="space-y-6">
        <div className="overflow-x-auto rounded-xl border border-zinc-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-4">School Name</th>
                <th className="px-6 py-4">Standard</th>
                <th className="px-6 py-4">Promoted (B/G)</th>
                <th className="px-6 py-4">Repeated (B/G)</th>
                <th className="px-6 py-4">Dropped Out (B/G)</th>
                <th className="px-6 py-4">Promotion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {records.map(record => {
                const total = (record.promoted || 0) + (record.repeated || 0) + (record.droppedOut || 0);
                const rate = total > 0 ? ((record.promoted / total) * 100).toFixed(1) : '0.0';
                return (
                  <tr key={record.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-zinc-900">{schoolMap[record.schoolId] || 'Unknown'}</td>
                    <td className="px-6 py-4">{record.standard}</td>
                    <td className="px-6 py-4 text-emerald-600 font-medium">
                      {record.promoted} <span className="text-[10px] text-zinc-400">({record.promotedBoys || 0}/{record.promotedGirls || 0})</span>
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-medium">
                      {record.repeated} <span className="text-[10px] text-zinc-400">({record.repeatedBoys || 0}/{record.repeatedGirls || 0})</span>
                    </td>
                    <td className="px-6 py-4 text-red-600 font-medium">
                      {record.droppedOut} <span className="text-[10px] text-zinc-400">({record.droppedBoys || 0}/{record.droppedGirls || 0})</span>
                    </td>
                    <td className="px-6 py-4 font-bold">{rate}%</td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500 italic">
                    No records found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Zonal Learners Module</h2>
          <p className="text-sm text-zinc-500 font-medium">Aggregated trends and historical records for all schools in the zone.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-zinc-200 shadow-sm">
            <Calendar size={16} className="text-zinc-400" />
            <select 
              className="bg-transparent text-sm font-bold text-zinc-900 outline-none"
              value={selectedYear}
              onChange={e => setSelectedYear(e.target.value)}
            >
              {years.map(year => <option key={year} value={year}>{year} Academic Year</option>)}
            </select>
          </div>
          <Button 
            variant="outline" 
            className="gap-2"
            onClick={exportToCSV}
          >
            <Download size={16} />
            Export Data
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {[
          { id: 'overview', label: 'Overview', icon: PieChart },
          { id: 'enrollment', label: 'Enrollment', icon: BarChart3 },
          { id: 'registry', label: 'Registry', icon: Users },
          { id: 'promotions', label: 'Promotions', icon: TrendingUp },
          { id: 'sne', label: 'SNE Learners', icon: Accessibility },
          { id: 'back-to-school', label: 'Back to School', icon: RefreshCw },
          { id: 'repeaters', label: 'Repeaters', icon: History },
          { id: 'admissions', label: 'New Admissions', icon: UserPlus },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SubTabType)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-zinc-900 text-white shadow-lg shadow-zinc-900/20" 
                : "bg-white text-zinc-500 hover:bg-zinc-50 border border-zinc-200"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'registry' && renderRegistry()}
        {activeTab === 'enrollment' && renderEnrollment()}
        {activeTab === 'promotions' && renderPromotions()}
        {activeTab === 'sne' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 font-medium">Showing all learners with Special Educational Needs across the zone.</p>
            </div>
            {renderRegistry()}
          </div>
        )}
        {activeTab === 'back-to-school' && (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-800 font-medium">Showing learners who have returned to school after dropping out.</p>
            </div>
            {renderRegistry()}
          </div>
        )}
        {activeTab === 'repeaters' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-xs text-amber-800 font-medium">Showing repetition trends and records across the zone.</p>
            </div>
            {renderPromotions()}
          </div>
        )}
        {activeTab === 'admissions' && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-800 font-medium">Showing new admissions for the {selectedYear} academic year.</p>
            </div>
            {renderRegistry()}
          </div>
        )}
      </div>
    </div>
  );
};
