import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Filter, Plus, MapPin, Users, GraduationCap, 
  MoreVertical, School, Trash2, Eye, LayoutGrid, 
  BarChart3, TrendingUp, Building2, Droplets, 
  Zap, BookOpen, ShieldCheck, AlertTriangle, Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { School as SchoolType } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { SchoolProfile } from './SchoolProfile';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { toast } from 'sonner';

import { useAuth } from '../context/AuthContext';

type TabType = 'registry' | 'map' | 'infrastructure' | 'learners-registry' | 'performance';

export const SchoolRegistry = ({ onNavigateMainTab, initialSelectedId }: { onNavigateMainTab?: (tab: string) => void; initialSelectedId?: string | null }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('registry');
  const [searchQuery, setSearchQuery] = useState('');
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<SchoolType | null>(null);
  const [editingSchool, setEditingSchool] = useState<SchoolType | null>(null);
  const [schoolToDeleteId, setSchoolToDeleteId] = useState<string | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  
  const initialSchoolState: Omit<SchoolType, 'id' | 'createdAt'> = {
    emisCode: '',
    name: '',
    zone: '',
    type: 'Primary',
    primarySubCategory: 'Full Primary',
    juniorPrimaryRange: 'Standard 1-4',
    ownership: 'Government',
    yearEstablished: new Date().getFullYear(),
    registrationStatus: 'Pending',
    location: {
      district: '',
      tdc: '',
      traditionalAuthority: '',
      latitude: 0,
      longitude: 0,
      physicalAddress: '',
      zone: '',
      accessibility: {
        roadType: '',
        distanceFromMainRoad: 0,
      }
    },
    administration: {
      headteacher: { name: '', phone: '', email: '' },
      deputyHeadteacher: { name: '', phone: '', email: '' },
      smc_pta: '',
    },
    enrollment: {
      total: 0,
      byStandard: {},
      newAdmissions: 0,
      transfersIn: 0,
      transfersOut: 0,
      dropouts: 0,
    },
    staff: {
      totalTeachers: 0,
      qualifiedTeachers: 0,
      unqualifiedTeachers: 0,
      distribution: '',
      supportStaff: { total: 0, clerks: 0, guards: 0, groundskeepers: 0, others: 0 },
    },
    infrastructure: {
      classrooms: 0,
      staffHouses: 0,
      toiletsBoys: 0,
      toiletsGirls: 0,
      toiletsTeachers: 0,
      hasLibrary: false,
      hasLaboratory: false,
      hasICTRoom: false,
      hasElectricity: false,
      waterSource: '',
      condition: 'Good',
    },
    materials: {
      pupilBookRatio: '',
      textbooks: 0,
      exerciseBooks: 0,
      consumables: '',
      desks: 0,
      chairs: 0,
      teachingAids: '',
    },
    timetable: {
      calendar: '',
      startTime: '',
      endTime: '',
      sessionType: 'Single',
      dailySchedule: '',
    },
    performance: {
      passRate: 0,
      nationalExamResults: '',
      topSubjects: '',
      trend: '',
      comments: '',
    },
    finance: {
      fundingSources: '',
      schoolGrants: '',
      tuitionFees: '',
      incomeExpenditure: '',
      assets: '',
    },
    attendance: {
      studentRate: 0,
      teacherRate: 0,
      lateArrivals: 0,
      absenteeismReasons: '',
      mitigation: '',
    },
    health: {
      waterSource: '',
      feedingProgram: '',
      healthServices: '',
      sanitationStatus: '',
    },
    programs: {
      clubs: '',
      specialPrograms: '',
      ngoSupport: '',
    },
    documents: [],
    audit: {
      changeLog: [],
      inspectionHistory: [],
    },
  };

  const [newSchool, setNewSchool] = useState(initialSchoolState);

  useEffect(() => {
    if (initialSelectedId && schools.length > 0) {
      const school = schools.find(s => s.id === initialSelectedId);
      if (school) {
        setSelectedSchool(school);
      }
    }
  }, [initialSelectedId, schools]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToSchools((data) => {
      setSchools(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addSchool({
        ...newSchool,
        createdAt: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewSchool(initialSchoolState);
    } catch (error) {
      console.error('Error adding school:', error);
    }
  };

  const handleEditSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSchool) return;
    try {
      await dataService.updateSchool(editingSchool.id, editingSchool);
      setIsEditModalOpen(false);
      setEditingSchool(null);
    } catch (error) {
      console.error('Error updating school:', error);
    }
  };

  const [ownershipFilter, setOwnershipFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredSchools = useMemo(() => {
    let result = schools;
    
    // Role-based filtering
    // if (user?.role === 'DATA_COLLECTOR' && user.assigned_schools) {
    //   result = result.filter(s => user.assigned_schools.includes(s.id));
    // }

    if (searchQuery) {
      result = result.filter(s => 
        (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.emisCode || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.zone || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (ownershipFilter !== 'All') {
      result = result.filter(s => s.ownership === ownershipFilter);
    }

    if (typeFilter !== 'All') {
      result = result.filter(s => s.type === typeFilter);
    }

    if (statusFilter !== 'All') {
      result = result.filter(s => s.registrationStatus === statusFilter);
    }

    return result;
  }, [schools, searchQuery, user, ownershipFilter, typeFilter, statusFilter]);

  const exportToCSV = () => {
    const headers = ['EMIS Code', 'Name', 'Zone', 'Type', 'Ownership', 'Year Established', 'Status', 'District', 'TDC'];
    const csvData = schools.map(s => [
      s.emisCode,
      s.name,
      s.zone,
      s.type,
      s.ownership,
      s.yearEstablished,
      s.registrationStatus,
      s.location?.district || '',
      s.location?.tdc || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `school_registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkUploading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const newSchools = results.data.map((row: any) => ({
            emisCode: row['EMIS Code'] || '',
            name: row['Name'] || '',
            zone: row['Zone'] || '',
            type: (row['Type'] || 'Primary') as any,
            ownership: (row['Ownership'] || 'Government') as any,
            yearEstablished: parseInt(row['Year Established']) || new Date().getFullYear(),
            registrationStatus: (row['Status'] || 'Pending') as any,
            location: {
              district: row['District'] || '',
              tdc: row['TDC'] || '',
              traditionalAuthority: '',
              latitude: 0,
              longitude: 0,
              physicalAddress: '',
              zone: row['Zone'] || '',
              accessibility: { roadType: 'Dirt', distanceFromMainRoad: 0 }
            },
            administration: {
              headteacher: { name: '', phone: '', email: '' },
              deputyHeadteacher: { name: '', phone: '', email: '' },
              smc_pta: ''
            },
            enrollment: {
              total: 0,
              byStandard: {},
              newAdmissions: 0,
              transfersIn: 0,
              transfersOut: 0,
              dropouts: 0
            },
            staff: {
              totalTeachers: 0,
              qualifiedTeachers: 0,
              unqualifiedTeachers: 0,
              distribution: '',
              supportStaff: { total: 0, clerks: 0, guards: 0, groundskeepers: 0, others: 0 }
            },
              infrastructure: {
                classrooms: 0,
                staffHouses: 0,
                toiletsBoys: 0,
                toiletsGirls: 0,
                toiletsTeachers: 0,
                hasLibrary: false,
                hasLaboratory: false,
                hasICTRoom: false,
                hasElectricity: false,
                waterSource: '',
                condition: 'Good' as any
              },
            materials: {
              pupilBookRatio: '',
              textbooks: 0,
              exerciseBooks: 0,
              consumables: '',
              desks: 0,
              chairs: 0,
              teachingAids: ''
            },
            timetable: {
              calendar: '',
              startTime: '07:30',
              endTime: '13:30',
              sessionType: 'Single',
              dailySchedule: ''
            },
            performance: {
              passRate: 0,
              nationalExamResults: '',
              topSubjects: '',
              trend: '',
              comments: ''
            },
            finance: {
              fundingSources: '',
              schoolGrants: '',
              incomeExpenditure: '',
              assets: ''
            },
            attendance: {
              studentRate: 0,
              teacherRate: 0,
              lateArrivals: 0,
              absenteeismReasons: '',
              mitigation: ''
            },
            health: {
              waterSource: '',
              feedingProgram: '',
              healthServices: '',
              sanitationStatus: ''
            },
            programs: {
              clubs: '',
              specialPrograms: '',
              ngoSupport: ''
            },
            documents: [],
            audit: {
              changeLog: [],
              inspectionHistory: []
            },
            createdAt: new Date().toISOString()
          }));

          for (const school of newSchools) {
            await dataService.addSchool(school);
          }
          toast.success(`Successfully uploaded ${newSchools.length} schools.`);
        } catch (error) {
          console.error('Error bulk uploading schools:', error);
          toast.error('Failed to upload schools. Please check the CSV format.');
        } finally {
          setIsBulkUploading(false);
          e.target.value = '';
        }
      },
      error: (error) => {
        console.error('PapaParse error:', error);
        toast.error('Error parsing CSV file.');
        setIsBulkUploading(false);
      }
    });
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'registry', label: 'School Registry', icon: LayoutGrid },
    { id: 'map', label: 'Map View', icon: MapPin },
    { id: 'infrastructure', label: 'Infrastructure Audit', icon: Building2 },
    { id: 'learners-registry', label: 'Learners Registry', icon: Users },
    { id: 'performance', label: 'Performance Analysis', icon: BarChart3 },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return <MapView schools={schools} />;
      case 'infrastructure':
        return <InfrastructureAudit schools={schools} />;
      case 'learners-registry':
        return <EnrollmentTrends schools={schools} />;
      case 'performance':
        return <PerformanceAnalysis schools={schools} />;
      case 'registry':
      default:
        return (
          <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <Input 
                  placeholder="Search by school name or EMIS code..." 
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={exportToCSV}
                >
                  <Download size={18} />
                  Export CSV
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    id="bulk-upload-schools"
                    onChange={handleBulkUpload}
                    disabled={isBulkUploading}
                  />
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    onClick={() => document.getElementById('bulk-upload-schools')?.click()}
                    disabled={isBulkUploading}
                  >
                    <Plus size={18} />
                    {isBulkUploading ? 'Uploading...' : 'Bulk Upload'}
                  </Button>
                </div>
                <select 
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={ownershipFilter}
                  onChange={(e) => setOwnershipFilter(e.target.value)}
                >
                  <option value="All">All Ownership</option>
                  <option value="Government">Government</option>
                  <option value="Grant-aided">Grant-aided</option>
                  <option value="Private">Private</option>
                </select>
                <select 
                  className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-medium"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="All">All Types</option>
                  <option value="Primary">Primary</option>
                  <option value="Secondary">Secondary</option>
                  <option value="Combined">Combined</option>
                </select>
                <Button 
                  variant="outline" 
                  className={cn("gap-2", (ownershipFilter !== 'All' || typeFilter !== 'All' || statusFilter !== 'All') && "border-emerald-500 bg-emerald-50 text-emerald-600")}
                  onClick={() => {
                    setOwnershipFilter('All');
                    setTypeFilter('All');
                    setStatusFilter('All');
                    setSearchQuery('');
                    toast.success('Filters cleared');
                  }}
                >
                  <Filter size={18} />
                  Reset
                </Button>
                <Button 
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus size={18} />
                  Add School
                </Button>
              </div>
            </div>

            {/* Schools Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center py-24 text-zinc-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mb-4"></div>
                  <p>Loading school registry...</p>
                </div>
              ) : filteredSchools.map((school) => (
                <Card key={school.id} className="group hover:border-emerald-500 transition-all duration-300">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <School size={24} />
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-zinc-600 hover:text-zinc-700 hover:bg-zinc-50"
                        onClick={() => {
                          setEditingSchool(school);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <MoreVertical size={16} />
                      </Button>
                      {schoolToDeleteId === school.id ? (
                        <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50"
                            onClick={async () => {
                              try {
                                await dataService.deleteSchool(school.id);
                                setSchoolToDeleteId(null);
                              } catch (error) {
                                console.error('Error deleting school:', error);
                              }
                            }}
                          >
                            Confirm
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 px-2 text-[10px] font-bold text-zinc-400"
                            onClick={() => setSchoolToDeleteId(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => setSchoolToDeleteId(school.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">{school.name}</h3>
                  <p className="text-sm text-zinc-500 mb-4 flex items-center gap-1">
                    <MapPin size={14} />
                    {school.zone}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-100">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">EMIS Code</p>
                      <p className="text-sm font-mono font-medium text-zinc-700">{school.emisCode}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Type</p>
                      <p className="text-sm font-medium text-zinc-700">{school.type}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Enrollment</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
                        <Users size={14} className="text-zinc-400" />
                        {school.enrollment?.total || 0}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Teachers</p>
                      <div className="flex items-center gap-1 text-sm font-medium text-zinc-700">
                        <GraduationCap size={14} className="text-zinc-400" />
                        {school.staff?.totalTeachers || 0}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 gap-2"
                      onClick={() => setSelectedSchool(school)}
                    >
                      <Eye size={14} />
                      View Profile
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        if (onNavigateMainTab) {
                          onNavigateMainTab('inspections');
                        } else {
                          toast.info('Navigating to inspections module...');
                        }
                      }}
                    >
                      Inspection
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white text-emerald-600 shadow-sm" 
                : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            )}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {renderTabContent()}

      {/* Add School Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Add New School</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleAddSchool} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Name</label>
                <Input 
                  required
                  placeholder="e.g. Central Primary School"
                  value={newSchool.name}
                  onChange={(e) => setNewSchool({ ...newSchool, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">EMIS Code</label>
                  <Input 
                    required
                    placeholder="EMIS Code"
                    value={newSchool.emisCode}
                    onChange={(e) => setNewSchool({ ...newSchool, emisCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Zone</label>
                  <Input 
                    required
                    placeholder="e.g. North Zone"
                    value={newSchool.zone}
                    onChange={(e) => setNewSchool({ ...newSchool, zone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Type</label>
                  <select 
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={newSchool.type}
                    onChange={(e) => setNewSchool({ ...newSchool, type: e.target.value as any })}
                  >
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Combined">Combined</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Enrollment</label>
                  <Input 
                    required
                    type="number"
                    min="0"
                    value={newSchool.enrollment.total}
                    onChange={(e) => setNewSchool({ ...newSchool, enrollment: { ...newSchool.enrollment, total: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>

              {newSchool.type === 'Primary' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Sub-Category</label>
                    <select 
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={newSchool.primarySubCategory}
                      onChange={(e) => setNewSchool({ ...newSchool, primarySubCategory: e.target.value as any })}
                    >
                      <option value="Full Primary">Full Primary</option>
                      <option value="Junior Primary">Junior Primary</option>
                    </select>
                  </div>
                  {newSchool.primarySubCategory === 'Junior Primary' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Junior Primary Range</label>
                      <select 
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={newSchool.juniorPrimaryRange}
                        onChange={(e) => setNewSchool({ ...newSchool, juniorPrimaryRange: e.target.value as any })}
                      >
                        <option value="Standard 1-4">Standard 1-4</option>
                        <option value="Standard 1-7">Standard 1-7</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Latitude</label>
                  <Input 
                    type="number"
                    step="any"
                    value={newSchool.location.latitude}
                    onChange={(e) => setNewSchool({ ...newSchool, location: { ...newSchool.location, latitude: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Longitude</label>
                  <Input 
                    type="number"
                    step="any"
                    value={newSchool.location.longitude}
                    onChange={(e) => setNewSchool({ ...newSchool, location: { ...newSchool.location, longitude: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Register School</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit School Modal */}
      {isEditModalOpen && editingSchool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Edit School</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleEditSchool} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">School Name</label>
                <Input 
                  required
                  value={editingSchool.name}
                  onChange={(e) => setEditingSchool({ ...editingSchool, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">EMIS Code</label>
                  <Input 
                    required
                    value={editingSchool.emisCode}
                    onChange={(e) => setEditingSchool({ ...editingSchool, emisCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Zone</label>
                  <Input 
                    required
                    value={editingSchool.zone}
                    onChange={(e) => setEditingSchool({ ...editingSchool, zone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Type</label>
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    value={editingSchool.type}
                    onChange={(e) => setEditingSchool({ ...editingSchool, type: e.target.value as any })}
                  >
                    <option value="Primary">Primary</option>
                    <option value="Secondary">Secondary</option>
                    <option value="Combined">Combined</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Enrollment</label>
                  <Input 
                    required
                    type="number"
                    min="0"
                    value={editingSchool.enrollment.total}
                    onChange={(e) => setEditingSchool({ ...editingSchool, enrollment: { ...editingSchool.enrollment, total: parseInt(e.target.value) || 0 } })}
                  />
                </div>
              </div>

              {editingSchool.type === 'Primary' && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Primary Sub-Category</label>
                    <select 
                      className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      value={editingSchool.primarySubCategory || 'Full Primary'}
                      onChange={(e) => setEditingSchool({ ...editingSchool, primarySubCategory: e.target.value as any })}
                    >
                      <option value="Full Primary">Full Primary</option>
                      <option value="Junior Primary">Junior Primary</option>
                    </select>
                  </div>
                  {editingSchool.primarySubCategory === 'Junior Primary' && (
                    <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Junior Primary Range</label>
                      <select 
                        className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        value={editingSchool.juniorPrimaryRange || 'Standard 1-4'}
                        onChange={(e) => setEditingSchool({ ...editingSchool, juniorPrimaryRange: e.target.value as any })}
                      >
                        <option value="Standard 1-4">Standard 1-4</option>
                        <option value="Standard 1-7">Standard 1-7</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Latitude</label>
                  <Input 
                    type="number"
                    step="any"
                    value={editingSchool.location.latitude}
                    onChange={(e) => setEditingSchool({ ...editingSchool, location: { ...editingSchool.location, latitude: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Longitude</label>
                  <Input 
                    type="number"
                    step="any"
                    value={editingSchool.location.longitude}
                    onChange={(e) => setEditingSchool({ ...editingSchool, location: { ...editingSchool.location, longitude: parseFloat(e.target.value) || 0 } })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Update School</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* School Profile View */}
      {selectedSchool && (
        <SchoolProfile 
          school={selectedSchool} 
          onClose={() => setSelectedSchool(null)} 
        />
      )}
      {!loading && filteredSchools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <School size={48} className="text-zinc-200 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900">No schools found</h3>
          <p className="text-zinc-500">No schools match your search criteria.</p>
        </div>
      )}
    </div>
  );
};

const InfrastructureAudit = ({ schools }: { schools: SchoolType[] }) => {
  const stats = useMemo(() => {
    return {
      electricity: schools.filter(s => s.infrastructure?.hasElectricity).length,
      water: schools.filter(s => s.infrastructure?.waterSource).length,
      library: schools.filter(s => s.infrastructure?.hasLibrary).length,
      lab: schools.filter(s => s.infrastructure?.hasLaboratory).length,
      ict: schools.filter(s => s.infrastructure?.hasICTRoom).length,
      total: schools.length
    };
  }, [schools]);

  const conditionData = useMemo(() => {
    const counts: Record<string, number> = {};
    schools.forEach(s => {
      const cond = s.infrastructure?.condition || 'Unknown';
      counts[cond] = (counts[cond] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [schools]);

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6'];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Zap size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Electricity</p>
            <p className="text-xl font-black text-zinc-900">{Math.round((stats.electricity / stats.total) * 100)}%</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Droplets size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Water Access</p>
            <p className="text-xl font-black text-zinc-900">{Math.round((stats.water / stats.total) * 100)}%</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Libraries</p>
            <p className="text-xl font-black text-zinc-900">{Math.round((stats.library / stats.total) * 100)}%</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <LayoutGrid size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">ICT Rooms</p>
            <p className="text-xl font-black text-zinc-900">{Math.round((stats.ict / stats.total) * 100)}%</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Labs</p>
            <p className="text-xl font-black text-zinc-900">{Math.round((stats.lab / stats.total) * 100)}%</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Infrastructure Condition</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={conditionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {conditionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Critical Maintenance Needs</h3>
          <div className="space-y-4">
            {schools.filter(s => s.infrastructure?.condition === 'Poor').slice(0, 5).map((school, index) => (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-red-50 border border-red-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <AlertTriangle size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{school.name}</p>
                    <p className="text-xs text-zinc-500">{school.zone} Zone • EMIS: {school.emisCode}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-100">
                  Audit
                </Button>
              </div>
            ))}
            {schools.filter(s => s.infrastructure?.condition === 'Poor').length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400">
                <ShieldCheck size={48} className="mb-2 opacity-20" />
                <p>No critical maintenance needs identified</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

const EnrollmentTrends = ({ schools }: { schools: SchoolType[] }) => {
  const trendData = useMemo(() => {
    // Mocking historical data based on current enrollment
    return [
      { year: '2022', primary: 45000, secondary: 12000 },
      { year: '2023', primary: 48000, secondary: 13500 },
      { year: '2024', primary: 52000, secondary: 15000 },
      { year: '2025', primary: 55000, secondary: 18000 },
      { year: '2026', primary: schools.filter(s => s.type === 'Primary').reduce((acc, s) => acc + (s.enrollment?.total || 0), 0), secondary: schools.filter(s => s.type === 'Secondary').reduce((acc, s) => acc + (s.enrollment?.total || 0), 0) },
    ];
  }, [schools]);

  const zoneDistribution = useMemo(() => {
    const zones: Record<string, number> = {};
    schools.forEach(s => {
      zones[s.zone] = (zones[s.zone] || 0) + (s.enrollment?.total || 0);
    });
    return Object.entries(zones).map(([name, value]) => ({ name, value }));
  }, [schools]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Enrollment Growth Trend</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="year" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend />
                <Area type="monotone" dataKey="primary" name="Primary Enrollment" stroke="#10b981" fillOpacity={1} fill="url(#colorPrimary)" strokeWidth={2} />
                <Area type="monotone" dataKey="secondary" name="Secondary Enrollment" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSecondary)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-zinc-900 mb-6">Enrollment by Zone</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" name="Total Students" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
};

const PerformanceAnalysis = ({ schools }: { schools: SchoolType[] }) => {
  const performanceData = useMemo(() => {
    return schools.map(s => ({
      name: s.name,
      passRate: s.performance?.passRate || 0,
      attendance: s.attendance?.studentRate || 0,
    })).sort((a, b) => b.passRate - a.passRate).slice(0, 10);
  }, [schools]);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-bold text-zinc-900 mb-6">Top Performing Schools (Pass Rate vs Attendance)</h3>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
            <YAxis axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
            />
            <Legend />
            <Bar dataKey="passRate" name="Pass Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="attendance" name="Attendance (%)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};

const MapView = ({ schools }: { schools: SchoolType[] }) => {
  // TDC Coordinates (Mock center for the district)
  const TDC_LAT = -13.9626;
  const TDC_LON = 33.7741;

  return (
    <Card className="p-0 overflow-hidden h-[600px] flex flex-col">
      <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div>
          <h3 className="text-sm font-black text-zinc-900 uppercase tracking-tight">Geospatial School Distribution</h3>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">District: Lilongwe City • TDC: TDC Center</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            Primary
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-2">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            Secondary
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-zinc-100 overflow-hidden">
        {/* Mock Map Background - SVG Grid */}
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Map Container */}
        <div className="absolute inset-0 p-8">
          <div className="relative w-full h-full border-2 border-dashed border-zinc-300 rounded-3xl flex items-center justify-center">
            {/* TDC Center Point */}
            <div className="absolute h-4 w-4 bg-zinc-900 rounded-full flex items-center justify-center shadow-lg z-10">
              <div className="absolute -top-8 whitespace-nowrap text-[10px] font-black text-zinc-900 uppercase tracking-widest bg-white px-2 py-1 rounded-md border border-zinc-200">
                TDC Center
              </div>
            </div>

            {/* School Points */}
            {schools.map((school, idx) => {
              // Simple projection for mock visualization
              const latDiff = (school.location?.latitude || TDC_LAT) - TDC_LAT;
              const lonDiff = (school.location?.longitude || TDC_LON) - TDC_LON;
              
              // Scale for visualization (clamped)
              const top = 50 + (latDiff * 500);
              const left = 50 + (lonDiff * 500);

              return (
                <motion.div
                  key={school.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="absolute cursor-pointer group"
                  style={{ top: `${top}%`, left: `${left}%` }}
                >
                  <div className={cn(
                    "h-3 w-3 rounded-full border-2 border-white shadow-md transition-transform group-hover:scale-150",
                    school.type === 'Primary' ? "bg-emerald-500" : "bg-blue-500"
                  )} />
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                    <div className="bg-zinc-900 text-white p-2 rounded-lg text-[10px] whitespace-nowrap shadow-xl">
                      <p className="font-black uppercase tracking-widest">{school.name}</p>
                      <p className="opacity-70">{school.type} • {school.zone} Zone</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Map Controls Overlay */}
        <div className="absolute bottom-6 right-6 flex flex-col gap-2">
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white shadow-md">+</Button>
          <Button size="sm" variant="outline" className="h-8 w-8 p-0 bg-white shadow-md">-</Button>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-6 left-6 bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-zinc-200 shadow-lg max-w-[200px]">
          <h4 className="text-[10px] font-black text-zinc-900 uppercase tracking-widest mb-3">Map Legend</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Total Schools</span>
              <span className="text-zinc-900">{schools.length}</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold text-zinc-600">
              <span>Avg. Distance</span>
              <span className="text-zinc-900">4.2 km</span>
            </div>
          </div>
        </div>
      </div>

      {/* List view for schools with coordinates */}
      <div className="h-48 bg-white border-t border-zinc-100 overflow-y-auto">
        <table className="w-full text-left text-[10px] font-bold uppercase tracking-widest">
          <thead className="bg-zinc-50 text-zinc-400 sticky top-0">
            <tr>
              <th className="px-6 py-3">School Name</th>
              <th className="px-6 py-3">Latitude</th>
              <th className="px-6 py-3">Longitude</th>
              <th className="px-6 py-3">Distance from TDC</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {schools.map(school => (
              <tr key={school.id} className="hover:bg-zinc-50 transition-colors">
                <td className="px-6 py-3 text-zinc-900">{school.name}</td>
                <td className="px-6 py-3 text-zinc-500 font-mono">{school.location?.latitude?.toFixed(4) || '0.0000'}</td>
                <td className="px-6 py-3 text-zinc-500 font-mono">{school.location?.longitude?.toFixed(4) || '0.0000'}</td>
                <td className="px-6 py-3 text-zinc-500">
                  {Math.sqrt(
                    Math.pow((school.location?.latitude || TDC_LAT) - TDC_LAT, 2) + 
                    Math.pow((school.location?.longitude || TDC_LON) - TDC_LON, 2)
                  ).toFixed(2)} km
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};
