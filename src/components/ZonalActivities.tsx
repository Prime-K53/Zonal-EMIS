import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { 
  Building2, 
  ClipboardList, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ChevronRight, 
  Calendar,
  User,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Clock,
  MoreVertical,
  X,
  Save,
  Filter,
  ArrowUpRight,
  Users,
  TrendingUp,
  FileText,
  Download,
  LayoutGrid,
  List as ListIcon,
  Eye,
  Activity,
  Briefcase,
  Target,
  Zap,
  UserCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { dataService } from '../services/dataService';
import { Department, OfficerOperation, Teacher } from '../types';
import { useAuth } from '../context/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ZonalActivitiesProps {
  onNavigate?: (tab: string) => void;
}

const ZonalActivities: React.FC<ZonalActivitiesProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'departments' | 'operations' | 'metrics'>('departments');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [operations, setOperations] = useState<OfficerOperation[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedOperation, setSelectedOperation] = useState<OfficerOperation | null>(null);

  // Form states
  const [deptForm, setDeptForm] = useState<Omit<Department, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    staffCount: 0,
    headId: ''
  });

  const [opForm, setOpForm] = useState<Omit<OfficerOperation, 'id' | 'submittedAt' | 'updatedAt'>>({
    officerId: user?.id || '',
    officerName: user?.name || '',
    tdcName: '',
    zone: '',
    type: 'Daily',
    date: new Date().toISOString().split('T')[0],
    activities: [],
    challenges: [],
    recommendations: []
  });

  useEffect(() => {
    const unsubDepts = dataService.subscribeToDepartments(setDepartments);
    const unsubOps = dataService.subscribeToOfficerOperations(setOperations);
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    const unsubSchools = dataService.subscribeToSchools(setSchools);

    setLoading(false);

    return () => {
      unsubDepts();
      unsubOps();
      unsubTeachers();
      unsubSchools();
    };
  }, []);

  // Advanced Stats
  const stats = useMemo(() => {
    const totalStaff = departments.reduce((acc, d) => acc + d.staffCount, 0);
    const completedActivities = operations.reduce((acc, op) => 
      acc + (op.activities?.filter(a => a.status === 'Completed').length || 0), 0
    );
    const totalActivities = operations.reduce((acc, op) => acc + (op.activities?.length || 0), 0);
    const completionRate = totalActivities > 0 ? Math.round((completedActivities / totalActivities) * 100) : 0;

    // School Aggregates for Metrics Tab
    const totalEnrollment = schools.reduce((acc, s) => acc + (s.enrollment?.total || 0), 0);
    const totalClassrooms = schools.reduce((acc, s) => acc + (s.infrastructure?.classrooms || s.classrooms || 0), 0);
    const schoolCount = schools.length;
    const teacherCount = teachers.length;
    const ptr = totalEnrollment > 0 && teacherCount > 0 ? Math.round(totalEnrollment / teacherCount) : 0;

    // Chart data
    const statusData = [
      { name: 'Completed', value: completedActivities, color: '#10b981' },
      { name: 'In Progress', value: operations.reduce((acc, op) => acc + (op.activities?.filter(a => a.status === 'In Progress').length || 0), 0), color: '#3b82f6' },
      { name: 'Planned', value: operations.reduce((acc, op) => acc + (op.activities?.filter(a => a.status === 'Planned').length || 0), 0), color: '#94a3b8' },
      { name: 'Deferred', value: operations.reduce((acc, op) => acc + (op.activities?.filter(a => a.status === 'Deferred').length || 0), 0), color: '#f43f5e' },
    ].filter(d => d.value > 0);

    return { 
      totalStaff, 
      completionRate, 
      statusData, 
      totalActivities,
      totalEnrollment,
      totalClassrooms,
      schoolCount,
      teacherCount,
      ptr
    };
  }, [departments, operations, schools, teachers]);

  const currentProgress = useMemo(() => {
    if (!opForm.activities?.length) return 0;
    const completed = opForm.activities.filter(a => a.status === 'Completed').length;
    return Math.round((completed / opForm.activities.length) * 100);
  }, [opForm.activities]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    if (editingItem) {
      await dataService.updateDepartment(editingItem.id, {
        ...deptForm,
        updatedAt: now
      });
    } else {
      await dataService.addDepartment({
        ...deptForm,
        createdAt: now,
        updatedAt: now
      });
    }
    setShowAddModal(false);
    setEditingItem(null);
    setDeptForm({ name: '', description: '', staffCount: 0, headId: '' });
  };

  const handleAddOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const progress = currentProgress;

    if (editingItem) {
      await dataService.updateOfficerOperation(editingItem.id, {
        ...opForm,
        updatedAt: now
      });
    } else {
      await dataService.addOfficerOperation({
        ...opForm,
        submittedAt: now,
        updatedAt: now
      });
    }
    setShowAddModal(false);
    setEditingItem(null);
    setOpForm({
      officerId: user?.id || '',
      officerName: user?.name || '',
      tdcName: '',
      zone: '',
      type: 'Daily',
      date: new Date().toISOString().split('T')[0],
      activities: [],
      challenges: [],
      recommendations: []
    });
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    if (activeTab === 'departments') {
      await dataService.deleteDepartment(id);
    } else {
      await dataService.deleteOfficerOperation(id);
    }
  };

  const filteredDepartments = departments.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredOperations = operations.filter(o => 
    o.officerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.tdcName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.zone.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const data = activeTab === 'departments' ? departments : operations;
    const headers = activeTab === 'departments' 
      ? ['Name', 'Description', 'Staff Count', 'Created At']
      : ['Officer', 'TDC', 'Zone', 'Type', 'Date', 'Activities Count'];
    
    const csvContent = [
      headers.join(','),
      ...data.map(item => {
        if (activeTab === 'departments') {
          const d = item as Department;
          return `"${d.name}","${d.description}",${d.staffCount},"${d.createdAt}"`;
        } else {
          const o = item as OfficerOperation;
          return `"${o.officerName}","${o.tdcName}","${o.zone}","${o.type}","${o.date}",${o.activities.length}`;
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <p className="text-sm font-medium text-zinc-500 animate-pulse">Loading zonal data...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 space-y-8 bg-zinc-50/50 min-h-screen pb-20"
    >
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-[0.2em]">
            <Zap className="w-4 h-4 fill-emerald-600" />
            Operational Intelligence
          </div>
          <h1 className="text-4xl font-black text-zinc-900 tracking-tight">Zonal Activities</h1>
          <p className="text-zinc-500 max-w-2xl text-sm font-medium">
            Strategic oversight of zonal departments and TDC officer performance. 
            Real-time tracking of daily, weekly, and monthly operational milestones.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportToCSV} className="gap-2 rounded-xl h-11 px-5 border-zinc-200 hover:bg-white hover:shadow-md transition-all">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button 
            onClick={() => {
              setEditingItem(null);
              setShowAddModal(true);
            }} 
            className="gap-2 rounded-xl h-11 px-6 bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-5 h-5" />
            New {activeTab === 'departments' ? 'Department' : 'Operation'}
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Departments', value: departments.length, icon: Building2, color: 'blue', trend: '+2' },
          { label: 'Zonal Staff', value: stats.totalStaff, icon: Users, color: 'emerald', trend: '+12' },
          { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: Target, color: 'amber', trend: '85%' },
          { label: 'Total Tasks', value: stats.totalActivities, icon: ClipboardList, color: 'purple', trend: 'Active' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-zinc-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-2xl transition-transform group-hover:scale-110",
                stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                stat.color === 'amber' ? "bg-amber-50 text-amber-600" :
                "bg-purple-50 text-purple-600"
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{stat.trend}</span>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-3xl font-black text-zinc-900">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-2 rounded-2xl border border-zinc-100 shadow-sm flex flex-col gap-1">
            <button
              onClick={() => setActiveTab('departments')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'departments' 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                  : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <Building2 size={18} />
              Departments
            </button>
            <button
              onClick={() => setActiveTab('operations')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'operations' 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                  : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <ClipboardList size={18} />
              Officer Operations
            </button>
            <button
              onClick={() => setActiveTab('metrics')}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === 'metrics' 
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                  : "text-zinc-500 hover:bg-zinc-50"
              )}
            >
              <TrendingUp size={18} />
              Zone Metrics
            </button>
          </div>

          <Card title="Quick Filters" className="p-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-zinc-50 border border-zinc-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
              <div className="flex items-center justify-between p-1 bg-zinc-100 rounded-xl">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all", viewMode === 'grid' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400")}
                >
                  <LayoutGrid size={14} />
                  Grid
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all", viewMode === 'list' ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-400")}
                >
                  <ListIcon size={14} />
                  List
                </button>
              </div>
            </div>
          </Card>

          <Card title="Activity Mix" className="p-4">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.statusData}
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                  >
                    {stats.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              {stats.statusData.map((d) => (
                <div key={d.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{d.name}</span>
                  </div>
                  <span className="text-xs font-bold text-zinc-900">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeTab === 'departments' ? (
              <motion.div
                key="departments"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 gap-6" 
                    : "space-y-4"
                )}
              >
                {filteredDepartments.map((dept) => (
                  <div 
                    key={dept.id} 
                    className={cn(
                      "group bg-white rounded-3xl border border-zinc-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300",
                      viewMode === 'list' ? "flex items-center p-4 gap-6" : "p-6"
                    )}
                  >
                    <div className={cn(
                      "p-4 rounded-2xl transition-colors shrink-0",
                      viewMode === 'list' ? "bg-zinc-50" : "bg-zinc-50 mb-6 w-fit group-hover:bg-emerald-50"
                    )}>
                      <Building2 className={cn(
                        "text-zinc-400 transition-colors",
                        viewMode === 'list' ? "w-6 h-6" : "w-8 h-8 group-hover:text-emerald-600"
                      )} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                         <h3 className="text-xl font-black text-zinc-900 truncate">{dept.name}</h3>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingItem(dept);
                              setDeptForm({
                                name: dept.name,
                                description: dept.description,
                                staffCount: dept.staffCount,
                                headId: dept.headId || ''
                              });
                              setShowAddModal(true);
                            }}
                            className="p-2 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(dept.id)}
                            className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed line-clamp-2 mb-6">
                        {dept.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-6 border-t border-zinc-50">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {[...Array(Math.min(3, dept.staffCount))].map((_, i) => (
                              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                <User size={14} />
                              </div>
                            ))}
                            {dept.staffCount > 3 && (
                              <div className="w-8 h-8 rounded-full border-2 border-white bg-emerald-500 flex items-center justify-center text-[10px] font-bold text-white">
                                +{dept.staffCount - 3}
                              </div>
                            )}
                          </div>
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-2">
                            {dept.staffCount} Staff
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full">
                          <Activity size={12} />
                          Active
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : activeTab === 'operations' ? (
              <motion.div
                key="operations"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {filteredOperations.map((op) => {
                  const completed = op.activities?.filter(a => a.status === 'Completed').length || 0;
                  const progress = (op.activities?.length || 0) > 0 ? Math.round((completed / (op.activities?.length || 1)) * 100) : 0;
                  
                  return (
                    <div key={op.id} className="group bg-white rounded-3xl border border-zinc-100 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 overflow-hidden">
                      <div className="flex flex-col lg:flex-row">
                        {/* Info Section */}
                        <div className="flex-1 p-8 border-b lg:border-b-0 lg:border-r border-zinc-50">
                          <div className="flex items-start justify-between mb-8">
                            <div className="flex items-center gap-5">
                              <div className={cn(
                                "p-4 rounded-2xl shadow-sm",
                                op.type === 'Daily' ? "bg-emerald-50 text-emerald-600" :
                                op.type === 'Weekly' ? "bg-blue-50 text-blue-600" :
                                "bg-purple-50 text-purple-600"
                              )}>
                                <Calendar size={28} />
                              </div>
                              <div>
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="text-xl font-black text-zinc-900">{op.officerName}</h3>
                                  <span className={cn(
                                    "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
                                    op.type === 'Daily' ? "bg-emerald-100 text-emerald-700" :
                                    op.type === 'Weekly' ? "bg-blue-100 text-blue-700" :
                                    "bg-purple-100 text-purple-700"
                                  )}>
                                    {op.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin size={14} className="text-zinc-300" />
                                    {op.tdcName} • {op.zone}
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <Clock size={14} className="text-zinc-300" />
                                    {op.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setSelectedOperation(op)}
                                className="p-2.5 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                              >
                                <Eye size={18} />
                              </button>
                               <button
                                onClick={() => {
                                  setEditingItem(op);
                                  setOpForm({
                                    officerId: op.officerId,
                                    officerName: op.officerName,
                                    tdcName: op.tdcName,
                                    zone: op.zone,
                                    type: op.type,
                                    date: op.date,
                                    activities: op.activities || [],
                                    challenges: op.challenges || [],
                                    recommendations: op.recommendations || []
                                  });
                                  setShowAddModal(true);
                                }}
                                className="p-2.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                              >
                                <Edit2 size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(op.id)}
                                className="p-2.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
 
                          <div className="grid grid-cols-2 gap-6">
                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Overall Progress</p>
                              <div className="flex items-center gap-4">
                                <span className="text-2xl font-black text-zinc-900">{progress}%</span>
                                <div className="flex-1 h-2 bg-zinc-200 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                    className="h-full bg-emerald-500" 
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="p-5 bg-zinc-50 rounded-2xl border border-zinc-100">
                              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Task Breakdown</p>
                              <div className="flex items-center justify-between">
                                <span className="text-2xl font-black text-zinc-900">{completed}/{op.activities?.length || 0}</span>
                                <div className="flex gap-1.5">
                                  {op.activities?.map((a, i) => (
                                    <div 
                                      key={i} 
                                      className={cn(
                                        "w-2 h-5 rounded-full",
                                        a.status === 'Completed' ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" :
                                        a.status === 'In Progress' ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]" :
                                        "bg-zinc-300"
                                      )}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
 
                        {/* Quick View Section */}
                        <div className="lg:w-96 p-8 bg-zinc-50/30 flex flex-col">
                          <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-6">Recent Activities</h4>
                          <div className="space-y-4 flex-1">
                            {op.activities?.slice(0, 3).map((act) => (
                              <div key={act.id} className="flex items-start gap-4 p-3 rounded-2xl bg-white border border-zinc-100 shadow-sm">
                                <div className={cn(
                                  "mt-1.5 w-2 h-2 rounded-full shrink-0",
                                  act.status === 'Completed' ? "bg-emerald-500" :
                                  act.status === 'In Progress' ? "bg-blue-500" :
                                  "bg-zinc-300"
                                )} />
                                <div>
                                  <p className="text-sm font-bold text-zinc-900 line-clamp-1">{act.title}</p>
                                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{act.category}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          {(op.activities?.length || 0) > 3 && (
                            <button 
                              onClick={() => setSelectedOperation(op)}
                              className="mt-6 text-xs font-black text-emerald-600 hover:text-emerald-700 uppercase tracking-widest flex items-center gap-2 group"
                            >
                              View all {op.activities?.length} tasks
                              <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            ) : (
                <motion.div
                  key="metrics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card title="School Profile Hub" className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <div>
                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Enrollment</p>
                            <p className="text-2xl font-black text-blue-900">{stats.totalEnrollment.toLocaleString()}</p>
                          </div>
                          <Users className="w-8 h-8 text-blue-500" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <div>
                            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Total Staffing</p>
                            <p className="text-2xl font-black text-emerald-900">{stats.teacherCount.toLocaleString()}</p>
                          </div>
                          <UserCircle className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-amber-50 rounded-2xl border border-amber-100">
                          <div>
                            <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pupil Teacher Ratio</p>
                            <p className="text-2xl font-black text-amber-900">1:{stats.ptr}</p>
                          </div>
                          <Activity className="w-8 h-8 text-amber-500" />
                        </div>
                      </div>
                    </Card>

                    <Card title="Infrastructure Summary" className="p-6">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Total Classrooms</p>
                            <p className="text-2xl font-black text-zinc-900">{stats.totalClassrooms}</p>
                          </div>
                          <Building2 className="w-8 h-8 text-zinc-400" />
                        </div>
                        <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                          <div>
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Schools reporting</p>
                            <p className="text-2xl font-black text-zinc-900">{stats.schoolCount}</p>
                          </div>
                          <CheckCircle2 className="w-8 h-8 text-zinc-400" />
                        </div>
                        <Button variant="ghost" className="w-full justify-between group" onClick={() => onNavigate?.('reports')}>
                          View Detailed Analysis Report
                          <ArrowUpRight className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                        </Button>
                      </div>
                    </Card>
                  </div>

                  <Card title="Zone School Breakdown" className="p-0 overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-zinc-50 text-zinc-400 text-[10px] uppercase font-black tracking-widest">
                        <tr>
                          <th className="px-6 py-4">School</th>
                          <th className="px-6 py-4">Enrollment</th>
                          <th className="px-6 py-4">Staff</th>
                          <th className="px-6 py-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {schools.map(s => (
                          <tr key={s.id} className="hover:bg-zinc-50 transition-colors">
                            <td className="px-6 py-4 font-bold text-zinc-900">{s.name}</td>
                            <td className="px-6 py-4 font-medium text-zinc-500">{s.enrollment?.total || 0}</td>
                            <td className="px-6 py-4 font-medium text-zinc-500">{teachers.filter(t => t.schoolId === s.id).length}</td>
                            <td className="px-6 py-4 text-right">
                              <Button variant="ghost" size="sm" onClick={() => toast.info(`Viewing ${s.name} profile...`)}>
                                <Eye size={16} />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Operation Detail Modal */}
      <AnimatePresence>
        {selectedOperation && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200"
            >
              <div className="p-10 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-6">
                  <div className="p-5 bg-white rounded-3xl shadow-sm border border-zinc-100">
                    <Calendar className="w-10 h-10 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-zinc-900 tracking-tight">{selectedOperation.officerName}</h2>
                    <p className="text-zinc-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 mt-1">
                      <MapPin className="w-4 h-4 text-emerald-500" />
                      {selectedOperation.tdcName} • {selectedOperation.zone}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedOperation(null)}
                  className="p-3 hover:bg-white hover:shadow-md rounded-2xl transition-all text-zinc-400 hover:text-zinc-900"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-12">
                {/* Activities Section */}
                <section className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <ClipboardList className="w-5 h-5 text-emerald-600" />
                      </div>
                      Detailed Activities
                    </h3>
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">In Progress</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {selectedOperation.activities.map((act) => (
                      <div key={act.id} className="p-6 rounded-3xl border border-zinc-100 bg-zinc-50/30 hover:bg-white hover:shadow-lg transition-all group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex gap-2">
                            <span className={cn(
                              "px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full",
                              act.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                              act.status === 'In Progress' ? "bg-blue-100 text-blue-700" :
                              "bg-zinc-200 text-zinc-600"
                            )}>
                              {act.status}
                            </span>
                            {act.teacherId && (
                              <div className="flex items-center gap-1.5 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-zinc-100 text-zinc-600">
                                <User size={10} />
                                {teachers.find(t => t.id === act.teacherId)?.firstName} {teachers.find(t => t.id === act.teacherId)?.lastName}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{act.category}</span>
                        </div>
                        <h4 className="text-lg font-black text-zinc-900 mb-2 group-hover:text-emerald-600 transition-colors">{act.title}</h4>
                        <p className="text-sm text-zinc-500 font-medium leading-relaxed">{act.description || 'No description provided.'}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-zinc-100">
                  {/* Challenges */}
                  <section className="space-y-6">
                    <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                      </div>
                      Challenges Encountered
                    </h3>
                    <div className="space-y-4">
                      {selectedOperation.challenges.map((c, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-3xl bg-amber-50/30 border border-amber-100/50 group hover:bg-amber-50 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.4)]" />
                          <p className="text-sm text-amber-900 font-bold leading-relaxed">{c}</p>
                        </div>
                      ))}
                      {selectedOperation.challenges.length === 0 && (
                        <p className="text-sm text-zinc-400 italic">No challenges reported.</p>
                      )}
                    </div>
                  </section>

                  {/* Recommendations */}
                  <section className="space-y-6">
                    <h3 className="text-xl font-black text-zinc-900 flex items-center gap-3">
                      <div className="p-2 bg-emerald-50 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      </div>
                      Recommendations
                    </h3>
                    <div className="space-y-4">
                      {selectedOperation.recommendations.map((r, i) => (
                        <div key={i} className="flex gap-4 p-5 rounded-3xl bg-emerald-50/30 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                          <p className="text-sm text-emerald-900 font-bold leading-relaxed">{r}</p>
                        </div>
                      ))}
                      {selectedOperation.recommendations.length === 0 && (
                        <p className="text-sm text-zinc-400 italic">No recommendations provided.</p>
                      )}
                    </div>
                  </section>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100">
                    <Zap className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                    {editingItem ? 'Update' : 'Create'} {activeTab === 'departments' ? 'Department' : 'Operation Log'}
                  </h2>
                </div>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-zinc-400 hover:text-zinc-900">
                  <X size={24} />
                </button>
              </div>

              <form 
                onSubmit={activeTab === 'departments' ? handleAddDepartment : handleAddOperation}
                className="p-10 overflow-y-auto space-y-8"
              >
                {activeTab === 'departments' ? (
                  <>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Department Name</label>
                      <input
                        required
                        type="text"
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900 placeholder:text-zinc-300"
                        placeholder="e.g. Quality Assurance & Standards"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Description</label>
                      <textarea
                        required
                        rows={4}
                        value={deptForm.description}
                        onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                        className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900 placeholder:text-zinc-300 resize-none"
                        placeholder="Describe the department's core functions and responsibilities..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Staff Count</label>
                        <input
                          required
                          type="number"
                          min="0"
                          value={deptForm.staffCount}
                          onChange={(e) => setDeptForm({ ...deptForm, staffCount: parseInt(e.target.value) || 0 })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Head of Department</label>
                        <select
                          value={deptForm.headId}
                          onChange={(e) => setDeptForm({ ...deptForm, headId: e.target.value })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900 appearance-none"
                        >
                          <option value="">Select a Teacher</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">TDC Name</label>
                        <input
                          required
                          type="text"
                          value={opForm.tdcName}
                          onChange={(e) => setOpForm({ ...opForm, tdcName: e.target.value })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900"
                          placeholder="e.g. Riverside TDC"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Zone</label>
                        <input
                          required
                          type="text"
                          value={opForm.zone}
                          onChange={(e) => setOpForm({ ...opForm, zone: e.target.value })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900"
                          placeholder="e.g. Central Zone"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Reporting Cycle</label>
                        <select
                          value={opForm.type}
                          onChange={(e) => setOpForm({ ...opForm, type: e.target.value as any })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900 appearance-none"
                        >
                          <option value="Daily">Daily Log</option>
                          <option value="Weekly">Weekly Summary</option>
                          <option value="Monthly">Monthly Report</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Date</label>
                        <input
                          required
                          type="date"
                          value={opForm.date}
                          onChange={(e) => setOpForm({ ...opForm, date: e.target.value })}
                          className="w-full px-5 py-4 bg-zinc-50 border border-zinc-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Current Progress (Auto)</p>
                          <p className="text-2xl font-black text-emerald-700">{currentProgress}%</p>
                        </div>
                        <div className="flex-1 max-w-[200px] h-2 bg-emerald-200 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${currentProgress}%` }}
                            className="h-full bg-emerald-600" 
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Activities & Tasks</label>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          className="rounded-lg h-8 px-3 text-[10px] font-black uppercase tracking-widest"
                          onClick={() => setOpForm({
                            ...opForm,
                            activities: [...opForm.activities, { 
                              id: Math.random().toString(36).substr(2, 9), 
                              title: '', 
                              description: '',
                              category: 'Other', 
                              status: 'Planned' 
                            }]
                          })}
                        >
                          Add Task
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {opForm.activities.map((act, index) => (
                          <div key={act.id} className="flex gap-3 items-start p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                            <div className="flex-1 space-y-3">
                              <input
                                required
                                type="text"
                                value={act.title}
                                onChange={(e) => {
                                  const newActs = [...opForm.activities];
                                  newActs[index].title = e.target.value;
                                  setOpForm({ ...opForm, activities: newActs });
                                }}
                                className="w-full bg-transparent border-none focus:ring-0 font-bold text-zinc-900 p-0 placeholder:text-zinc-300"
                                placeholder="Activity title..."
                              />
                              <div className="flex gap-4">
                                <select
                                  value={act.category}
                                  onChange={(e) => {
                                    const newActs = [...opForm.activities];
                                    newActs[index].category = e.target.value as any;
                                    setOpForm({ ...opForm, activities: newActs });
                                  }}
                                  className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 focus:outline-none"
                                >
                                  <option value="Inspection">Inspection</option>
                                  <option value="Training">Training</option>
                                  <option value="Meeting">Meeting</option>
                                  <option value="Administrative">Administrative</option>
                                  <option value="Other">Other</option>
                                </select>
                                <select
                                  value={act.status}
                                  onChange={(e) => {
                                    const newActs = [...opForm.activities];
                                    newActs[index].status = e.target.value as any;
                                    setOpForm({ ...opForm, activities: newActs });
                                  }}
                                  className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 focus:outline-none"
                                >
                                  <option value="Planned">Planned</option>
                                  <option value="In Progress">In Progress</option>
                                  <option value="Completed">Completed</option>
                                  <option value="Deferred">Deferred</option>
                                </select>
                                <select
                                  value={act.teacherId || ''}
                                  onChange={(e) => {
                                    const newActs = [...opForm.activities];
                                    newActs[index].teacherId = e.target.value;
                                    setOpForm({ ...opForm, activities: newActs });
                                  }}
                                  className="bg-white border border-zinc-200 rounded-lg px-2 py-1 text-[10px] font-bold text-zinc-600 focus:outline-none max-w-[150px]"
                                >
                                  <option value="">No Teacher Linked</option>
                                  {teachers.map(t => (
                                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <button 
                              type="button"
                              onClick={() => {
                                const newActs = opForm.activities.filter((_, i) => i !== index);
                                setOpForm({ ...opForm, activities: newActs });
                              }}
                              className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest"
                    onClick={() => setShowAddModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 rounded-2xl h-14 font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20"
                  >
                    {editingItem ? 'Update' : 'Create'} Record
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ZonalActivities;
