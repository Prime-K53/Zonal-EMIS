import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Plus, ClipboardCheck, AlertCircle, CheckCircle, 
  Clock, Calendar, Users, FileText, MoreVertical, X, Trash2,
  TrendingUp, BarChart3, ShieldCheck, Eye, Download, Printer,
  LayoutGrid, List, ChevronRight, Info, Camera, MapPin,
  ArrowUpRight, ArrowDownRight, Activity, Edit2
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Inspection, School } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  Cell, PieChart, Pie
} from 'recharts';

export const InspectionModule = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingInspection, setEditingInspection] = useState<Inspection | null>(null);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);
  
  const [newInspection, setNewInspection] = useState<Omit<Inspection, 'id'>>({
    schoolId: '',
    inspectorId: '',
    date: new Date().toISOString().split('T')[0],
    score: 0,
    findings: '',
    recommendations: '',
    status: 'Draft',
    photoUrls: [],
    type: 'School'
  });

  // Categorized scores for more detail
  const [categories, setCategories] = useState({
    infrastructure: 0,
    academic: 0,
    management: 0,
    community: 0
  });

  useEffect(() => {
    const unsubInspections = dataService.subscribeToInspections((data) => {
      setInspections(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setLoading(false);
    });
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    return () => {
      unsubInspections();
      unsubSchools();
    };
  }, []);

  const stats = useMemo(() => {
    const total = inspections.length;
    const avgScore = total > 0 
      ? Math.round(inspections.reduce((acc, curr) => acc + curr.score, 0) / total) 
      : 0;
    const pending = inspections.filter(i => i.status === 'Submitted').length;
    const approved = inspections.filter(i => i.status === 'Approved').length;
    
    // Calculate trend (dummy for now, but based on recent vs overall)
    const recentAvg = inspections.slice(0, 5).reduce((acc, curr) => acc + curr.score, 0) / Math.min(total, 5);
    const trend = total > 5 ? Math.round(recentAvg - avgScore) : 0;

    return { total, avgScore, pending, approved, trend };
  }, [inspections]);

  const chartData = useMemo(() => {
    return inspections
      .slice(0, 10)
      .reverse()
      .map(i => ({
        date: new Date(i.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        score: i.score,
        school: schools.find(s => s.id === i.schoolId)?.name || 'Unknown'
      }));
  }, [inspections, schools]);

  const handleAddInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Calculate total score from categories if we were using them
      const totalScore = Math.round(
        (categories.infrastructure + categories.academic + categories.management + categories.community) / 4
      );
      
      await dataService.addInspection({
        ...newInspection,
        score: totalScore || newInspection.score,
        categories: { ...categories }
      });
      
      setIsAddModalOpen(false);
      setNewInspection({
        schoolId: '',
        inspectorId: '',
        date: new Date().toISOString().split('T')[0],
        score: 0,
        findings: '',
        recommendations: '',
        status: 'Draft',
        photoUrls: [],
        type: 'School'
      });
    } catch (error) {
      console.error('Error adding inspection:', error);
    }
  };

  const handleEditInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInspection) return;
    try {
      await dataService.updateInspection(editingInspection.id, editingInspection);
      setIsEditModalOpen(false);
      setEditingInspection(null);
    } catch (error) {
      console.error('Error updating inspection:', error);
    }
  };

  const filteredInspections = inspections.filter(i => {
    const schoolName = schools.find(s => s.id === i.schoolId)?.name || i.schoolId;
    return (schoolName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (i.inspectorId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
           (i.findings || '').toLowerCase().includes(searchQuery.toLowerCase());
  });

  const getStatusIcon = (status: Inspection['status']) => {
    switch (status) {
      case 'Approved': return <CheckCircle size={14} />;
      case 'Submitted': return <Clock size={14} />;
      case 'Draft': return <AlertCircle size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getStatusColor = (status: Inspection['status']) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'Submitted': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'Draft': return 'bg-zinc-50 text-zinc-700 border-zinc-100';
      default: return 'bg-zinc-50 text-zinc-700 border-zinc-100';
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">Inspection Management</h1>
          <p className="text-zinc-500 font-medium">Monitor and evaluate school performance across the zone.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="h-11 rounded-2xl border-zinc-200 gap-2 font-bold"
          >
            <Download size={18} />
            Export Data
          </Button>
          <Button 
            className="h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 gap-2 font-bold shadow-lg shadow-emerald-600/20"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus size={18} />
            New Inspection
          </Button>
        </div>
      </div>

      {/* Stats & Trends Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Stats */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-4">
          <Card className="p-6 bg-white border-zinc-100 shadow-sm flex flex-col justify-between">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Total Records</p>
              <p className="text-3xl font-black text-zinc-900">{stats.total}</p>
            </div>
          </Card>
          <Card className="p-6 bg-white border-zinc-100 shadow-sm flex flex-col justify-between">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <TrendingUp size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Avg. Score</p>
                {stats.trend !== 0 && (
                  <span className={cn(
                    "flex items-center text-[10px] font-bold",
                    stats.trend > 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {stats.trend > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {Math.abs(stats.trend)}%
                  </span>
                )}
              </div>
              <p className="text-3xl font-black text-zinc-900">{stats.avgScore}%</p>
            </div>
          </Card>
          <Card className="p-6 bg-white border-zinc-100 shadow-sm flex flex-col justify-between">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pending Review</p>
              <p className="text-3xl font-black text-zinc-900">{stats.pending}</p>
            </div>
          </Card>
          <Card className="p-6 bg-white border-zinc-100 shadow-sm flex flex-col justify-between">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Approved</p>
              <p className="text-3xl font-black text-zinc-900">{stats.approved}</p>
            </div>
          </Card>
        </div>

        {/* Trend Chart */}
        <Card className="lg:col-span-8 p-6 bg-white border-zinc-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" />
                Performance Trends
              </h3>
              <p className="text-xs text-zinc-500">Inspection score history for the last 10 records</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-400">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Score %
              </div>
            </div>
          </div>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                  domain={[0, 100]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #f4f4f5', 
                    borderRadius: '12px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}
                  labelStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#71717a', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <Input 
            placeholder="Search by school, inspector or findings..." 
            className="pl-12 h-12 rounded-2xl border-zinc-200 bg-white shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "p-2 rounded-xl transition-all",
              viewMode === 'list' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <List size={20} />
          </button>
          <button 
            onClick={() => setViewMode('grid')}
            className={cn(
              "p-2 rounded-xl transition-all",
              viewMode === 'grid' ? "bg-emerald-50 text-emerald-600 shadow-sm" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            <LayoutGrid size={20} />
          </button>
        </div>
        <Button variant="outline" className="h-12 rounded-2xl border-zinc-200 gap-2 font-bold px-6">
          <Filter size={18} />
          Filters
        </Button>
      </div>

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-32 text-zinc-400"
          >
            <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
            <p className="font-bold uppercase tracking-widest text-[10px]">Loading Records</p>
          </motion.div>
        ) : filteredInspections.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="h-20 w-20 rounded-3xl bg-zinc-50 flex items-center justify-center text-zinc-200 mb-6">
              <ClipboardCheck size={40} />
            </div>
            <h3 className="text-xl font-black text-zinc-900">No Records Found</h3>
            <p className="text-zinc-500 max-w-xs mx-auto mt-2">We couldn't find any inspection records matching your search criteria.</p>
            <Button 
              variant="outline" 
              className="mt-8 rounded-2xl border-zinc-200"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          </motion.div>
        ) : viewMode === 'list' ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {filteredInspections.map((inspection, idx) => (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group hover:border-emerald-500 transition-all duration-300 p-5 bg-white border-zinc-100 shadow-sm">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-14 w-14 rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ClipboardCheck size={28} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-black text-zinc-900 truncate">
                            {schools.find(s => s.id === inspection.schoolId)?.name || 'Unknown School'}
                          </h3>
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1.5 uppercase tracking-widest",
                            getStatusColor(inspection.status)
                          )}>
                            {getStatusIcon(inspection.status)}
                            {inspection.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-zinc-500 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-zinc-300" />
                            {new Date(inspection.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Users size={14} className="text-zinc-300" />
                            Inspector: {inspection.inspectorId}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-zinc-300" />
                            {schools.find(s => s.id === inspection.schoolId)?.zone || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 lg:border-l border-zinc-100 lg:pl-8">
                      <div className="flex flex-col justify-center">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Score</p>
                        <div className="flex items-end gap-1">
                          <span className={cn(
                            "text-2xl font-black leading-none",
                            inspection.score >= 80 ? "text-emerald-600" :
                            inspection.score >= 60 ? "text-amber-600" :
                            "text-red-600"
                          )}>{inspection.score}%</span>
                        </div>
                      </div>
                      <div className="hidden sm:flex flex-col justify-center col-span-2">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Key Findings</p>
                        <p className="text-xs text-zinc-600 line-clamp-2 font-medium leading-relaxed italic">
                          "{inspection.findings}"
                        </p>
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="h-10 rounded-xl border-zinc-200 hover:bg-zinc-50 font-bold"
                          onClick={() => {
                            setViewingInspection(inspection);
                            setCategories(inspection.categories || { infrastructure: 0, academic: 0, management: 0, community: 0 });
                            setIsViewModalOpen(true);
                          }}
                        >
                          <Eye size={16} className="mr-2" />
                          Details
                        </Button>
                        <div className="relative group/menu">
                          <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl">
                            <MoreVertical size={18} className="text-zinc-400" />
                          </Button>
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-zinc-100 rounded-2xl shadow-xl shadow-zinc-200/50 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 p-2">
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-50 rounded-xl transition-colors"
                              onClick={() => {
                                setEditingInspection(inspection);
                                setCategories(inspection.categories || { infrastructure: 0, academic: 0, management: 0, community: 0 });
                                setIsEditModalOpen(true);
                              }}
                            >
                              <Edit2 size={14} className="mr-2" /> Edit Record
                            </button>
                            <button 
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              onClick={async () => {
                                if (window.confirm(`Are you sure you want to delete this inspection record?`)) {
                                  try {
                                    await dataService.deleteInspection(inspection.id);
                                  } catch (error) {
                                    console.error('Error deleting inspection:', error);
                                  }
                                }
                              }}
                            >
                              <Trash2 size={14} className="mr-2" /> Delete Record
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredInspections.map((inspection, idx) => (
              <motion.div
                key={inspection.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="group hover:border-emerald-500 transition-all duration-300 bg-white border-zinc-100 shadow-sm overflow-hidden flex flex-col h-full">
                  <div className="p-6 flex-1">
                    <div className="flex items-start justify-between mb-6">
                      <div className="h-12 w-12 rounded-2xl bg-zinc-50 text-zinc-400 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <ClipboardCheck size={24} />
                      </div>
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-black border flex items-center gap-1.5 uppercase tracking-widest",
                        getStatusColor(inspection.status)
                      )}>
                        {getStatusIcon(inspection.status)}
                        {inspection.status}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-black text-zinc-900 mb-2 line-clamp-1">
                      {schools.find(s => s.id === inspection.schoolId)?.name || 'Unknown School'}
                    </h3>
                    
                    <div className="flex items-center gap-3 text-[11px] text-zinc-500 font-bold uppercase tracking-wider mb-6">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-zinc-300" />
                        {new Date(inspection.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-zinc-200"></span>
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-zinc-300" />
                        {inspection.inspectorId}
                      </span>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Performance Score</p>
                          <span className={cn(
                            "text-sm font-black",
                            inspection.score >= 80 ? "text-emerald-600" :
                            inspection.score >= 60 ? "text-amber-600" :
                            "text-red-600"
                          )}>{inspection.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${inspection.score}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                            className={cn(
                              "h-full rounded-full",
                              inspection.score >= 80 ? "bg-emerald-500" :
                              inspection.score >= 60 ? "bg-amber-500" :
                              "bg-red-500"
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-zinc-600 line-clamp-3 font-medium leading-relaxed italic border-l-2 border-zinc-100 pl-4 py-1">
                      "{inspection.findings}"
                    </p>
                  </div>

                  <div className="p-4 bg-zinc-50/50 border-t border-zinc-100 flex items-center justify-between gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-50 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete this inspection record?`)) {
                          try {
                            await dataService.deleteInspection(inspection.id);
                          } catch (error) {
                            console.error('Error deleting inspection:', error);
                          }
                        }
                      }}
                    >
                      Delete
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-xl border-zinc-200 font-bold text-[10px] uppercase tracking-widest"
                        onClick={() => {
                          setViewingInspection(inspection);
                          setCategories(inspection.categories || { infrastructure: 0, academic: 0, management: 0, community: 0 });
                          setIsViewModalOpen(true);
                        }}
                      >
                        View Report
                      </Button>
                      <Button 
                        size="sm" 
                        className="bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest"
                        onClick={() => {
                          setEditingInspection(inspection);
                          setCategories(inspection.categories || { infrastructure: 0, academic: 0, management: 0, community: 0 });
                          setIsEditModalOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Inspection Modal Enhanced */}
      {isViewModalOpen && viewingInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-4xl max-h-[90vh] flex flex-col"
          >
            <Card className="flex flex-col shadow-2xl overflow-hidden bg-white border-none h-full">
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ClipboardCheck size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Inspection Report</h2>
                    <p className="text-sm text-zinc-500 font-bold uppercase tracking-wider">
                      {schools.find(s => s.id === viewingInspection.schoolId)?.name} • {new Date(viewingInspection.date).toLocaleDateString(undefined, { dateStyle: 'long' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl h-10 font-bold" onClick={() => window.print()}>
                    <Printer size={18} />
                    Print
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsViewModalOpen(false)} className="h-10 w-10 p-0 rounded-xl">
                    <X size={24} />
                  </Button>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Score Breakdown Section */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 p-6 rounded-3xl bg-zinc-900 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-zinc-900/20">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Overall Performance</p>
                    <div className="relative h-24 w-24 flex items-center justify-center mb-2">
                      <svg className="h-full w-full -rotate-90">
                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                        <circle 
                          cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 40}
                          strokeDashoffset={2 * Math.PI * 40 * (1 - viewingInspection.score / 100)}
                          className={cn(
                            "transition-all duration-1000",
                            viewingInspection.score >= 80 ? "text-emerald-500" :
                            viewingInspection.score >= 60 ? "text-amber-500" :
                            "text-red-500"
                          )}
                        />
                      </svg>
                      <span className="absolute text-2xl font-black">{viewingInspection.score}%</span>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                      viewingInspection.score >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                      viewingInspection.score >= 60 ? "bg-amber-500/20 text-amber-400" :
                      "bg-red-500/20 text-red-400"
                    )}>
                      {viewingInspection.score >= 80 ? "Excellent" : viewingInspection.score >= 60 ? "Satisfactory" : "Needs Improvement"}
                    </span>
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                          <LayoutGrid size={16} />
                        </div>
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Status</span>
                      </div>
                      <span className={cn(
                        "px-3 py-1.5 rounded-xl text-xs font-black border inline-flex items-center gap-2 w-fit",
                        getStatusColor(viewingInspection.status)
                      )}>
                        {getStatusIcon(viewingInspection.status)}
                        {viewingInspection.status}
                      </span>
                    </div>
                    <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                          <Users size={16} />
                        </div>
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Inspector</span>
                      </div>
                      <p className="text-sm font-black text-zinc-900">{viewingInspection.inspectorId}</p>
                    </div>
                    <div className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 flex flex-col justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                          <Calendar size={16} />
                        </div>
                        <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Date</span>
                      </div>
                      <p className="text-sm font-black text-zinc-900">{new Date(viewingInspection.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                    </div>
                  </div>
                </div>

                {/* Detailed Sections */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500"></div>
                      Key Findings & Observations
                    </h3>
                    <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm leading-relaxed text-zinc-700 font-medium italic relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1 bg-emerald-500/20"></div>
                      "{viewingInspection.findings}"
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                      Strategic Recommendations
                    </h3>
                    <div className="p-6 rounded-3xl bg-white border border-zinc-100 shadow-sm leading-relaxed text-zinc-700 font-medium relative overflow-hidden">
                      <div className="absolute top-0 left-0 h-full w-1 bg-blue-500/20"></div>
                      {viewingInspection.recommendations}
                    </div>
                  </div>
                </div>

                {/* Photo Evidence Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Camera size={16} />
                    Photo Evidence
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {viewingInspection.photoUrls && viewingInspection.photoUrls.length > 0 ? (
                      viewingInspection.photoUrls.map((url, i) => (
                        <div key={i} className="aspect-video rounded-2xl overflow-hidden border border-zinc-100 group cursor-pointer shadow-sm">
                          <img 
                            src={url} 
                            alt={`Evidence ${i + 1}`} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ))
                    ) : (
                      [1, 2, 3, 4].map(i => (
                        <div key={i} className="aspect-video rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col items-center justify-center text-zinc-300 group cursor-pointer hover:bg-zinc-100 transition-colors">
                          <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">No Evidence {i}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  className="rounded-xl h-11 px-8 font-bold border-zinc-200"
                  onClick={() => setIsViewModalOpen(false)}
                >
                  Close Report
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 px-8 font-bold shadow-lg shadow-emerald-600/20"
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setEditingInspection(viewingInspection);
                    setCategories(viewingInspection.categories || { infrastructure: 0, academic: 0, management: 0, community: 0 });
                    setIsEditModalOpen(true);
                  }}
                >
                  Edit Record
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <Card className="overflow-hidden shadow-2xl bg-white border-none">
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">New Inspection Record</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)} className="h-10 w-10 p-0 rounded-xl">
                  <X size={24} />
                </Button>
              </div>
              <form onSubmit={handleAddInspection} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">School</label>
                    <select
                      className="w-full h-12 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                      value={newInspection.schoolId}
                      onChange={(e) => setNewInspection({ ...newInspection, schoolId: e.target.value })}
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inspector ID</label>
                    <Input
                      placeholder="Enter inspector ID"
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={newInspection.inspectorId}
                      onChange={(e) => setNewInspection({ ...newInspection, inspectorId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</label>
                    <Input
                      type="date"
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={newInspection.date}
                      onChange={(e) => setNewInspection({ ...newInspection, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Score (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={newInspection.score}
                      onChange={(e) => setNewInspection({ ...newInspection, score: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                
                {/* Categorized Scoring Placeholder */}
                <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} />
                    Categorized Scoring (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {['Infrastructure', 'Academic', 'Management', 'Community'].map(cat => (
                      <div key={cat} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{cat}</label>
                        <Input 
                          type="number" 
                          placeholder="0-100" 
                          className="h-10 rounded-xl border-zinc-200 text-xs font-bold"
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setCategories(prev => ({ ...prev, [cat.toLowerCase()]: val }));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Findings</label>
                  <textarea
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px] transition-all"
                    placeholder="Enter key findings..."
                    required
                    value={newInspection.findings}
                    onChange={(e) => setNewInspection({ ...newInspection, findings: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recommendations</label>
                  <textarea
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px] transition-all"
                    placeholder="Enter recommendations..."
                    required
                    value={newInspection.recommendations}
                    onChange={(e) => setNewInspection({ ...newInspection, recommendations: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" className="h-12 rounded-2xl px-8 font-bold border-zinc-200" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl px-8 font-bold shadow-lg shadow-emerald-600/20">
                    Save Record
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingInspection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-2xl"
          >
            <Card className="overflow-hidden shadow-2xl bg-white border-none">
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">Edit Inspection</h2>
                <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)} className="h-10 w-10 p-0 rounded-xl">
                  <X size={24} />
                </Button>
              </div>
              <form onSubmit={handleEditInspection} className="p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">School</label>
                    <select
                      className="w-full h-12 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                      value={editingInspection.schoolId}
                      onChange={(e) => setEditingInspection({ ...editingInspection, schoolId: e.target.value })}
                    >
                      <option value="">Select School</option>
                      {schools.map(school => (
                        <option key={school.id} value={school.id}>{school.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Inspector ID</label>
                    <Input
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={editingInspection.inspectorId}
                      onChange={(e) => setEditingInspection({ ...editingInspection, inspectorId: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Date</label>
                    <Input
                      type="date"
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={editingInspection.date}
                      onChange={(e) => setEditingInspection({ ...editingInspection, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Score (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      required
                      className="h-12 rounded-2xl border-zinc-200 font-bold"
                      value={editingInspection.score}
                      onChange={(e) => setEditingInspection({ ...editingInspection, score: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2 sm:col-span-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</label>
                    <select
                      className="w-full h-12 rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm font-bold focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                      required
                      value={editingInspection.status}
                      onChange={(e) => setEditingInspection({ ...editingInspection, status: e.target.value as any })}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                </div>

                {/* Categorized Scoring Section */}
                <div className="p-6 rounded-3xl bg-zinc-50 border border-zinc-100 space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                    <Info size={14} />
                    Categorized Scoring (Optional)
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    {['Infrastructure', 'Academic', 'Management', 'Community'].map(cat => (
                      <div key={cat} className="space-y-1.5">
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{cat}</label>
                        <Input 
                          type="number" 
                          placeholder="0-100" 
                          className="h-10 rounded-xl border-zinc-200 text-xs font-bold"
                          value={categories[cat.toLowerCase() as keyof typeof categories] || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const newCategories = { ...categories, [cat.toLowerCase()]: val };
                            setCategories(newCategories);
                            
                            // Recalculate average score
                            const totalScore = Math.round(
                              (newCategories.infrastructure + newCategories.academic + newCategories.management + newCategories.community) / 4
                            );
                            setEditingInspection({ ...editingInspection, score: totalScore, categories: newCategories });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Findings</label>
                  <textarea
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px] transition-all"
                    required
                    value={editingInspection.findings}
                    onChange={(e) => setEditingInspection({ ...editingInspection, findings: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Recommendations</label>
                  <textarea
                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 min-h-[100px] transition-all"
                    required
                    value={editingInspection.recommendations}
                    onChange={(e) => setEditingInspection({ ...editingInspection, recommendations: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" className="h-12 rounded-2xl px-8 font-bold border-zinc-200" onClick={() => setIsEditModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 h-12 rounded-2xl px-8 font-bold shadow-lg shadow-emerald-600/20">
                    Update Record
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
};
