import React, { useState, useEffect, useMemo } from 'react';
import { cn } from '../lib/utils';
import { 
  Plus, Search, Filter, MoreVertical, Edit2, Trash2, 
  UserPlus, Users, ArrowLeft, Download, UserCheck, 
  UserMinus, MapPin, ArrowRightLeft, 
  Calendar, LayoutGrid, List, AlertTriangle,
  BarChart as BarChartIcon, TrendingUp,
  ClipboardCheck, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Teacher, School, Transfer, LeaveRequest } from '../types';
import { dataService } from '../services/dataService';
import { TeacherProfile } from './TeacherProfile';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, XCircle, Clock, FileText, ChevronRight, Loader2, Eye
} from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

type TabType = 'list' | 'staffing' | 'deployment' | 'transfers' | 'leave' | 'tcm_registration';

export const TeacherRegistry = ({ initialSelectedId }: { initialSelectedId?: string | null }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(initialSelectedId || null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [newTeacher, setNewTeacher] = useState<Omit<Teacher, 'id' | 'createdAt' | 'updatedAt'>>({
    emisCode: '',
    firstName: '',
    lastName: '',
    nationalId: '',
    employmentNumber: '',
    registrationNumber: '',
    tcmRegistrationNumber: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    teachingStandard: '',
    responsibility: '',
    gender: 'Male',
    dateOfBirth: '',
    qualification: '',
    specialization: '',
    schoolId: '',
    status: 'Active',
    standards: [],
    phone: '',
    address: '',
    joiningDate: '',
    dateOfFirstAppointment: '',
    dateOfPresentStandard: '',
    grade: '',
    remarks: '',
    teachingClass: '',
    professionalInfo: {
      rank: '',
      lastPromotionDate: '',
      probationStatus: 'Confirmed'
    }
  });

  const [newTransfer, setNewTransfer] = useState<Omit<Transfer, 'id' | 'createdAt' | 'updatedAt'>>({
    teacherId: '',
    fromSchoolId: '',
    toSchoolId: '',
    reason: '',
    status: 'Pending',
    requestDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (initialSelectedId) {
      setSelectedTeacherId(initialSelectedId);
    }
  }, [initialSelectedId]);

  useEffect(() => {
    const unsubscribeTeachers = dataService.subscribeToTeachers((data) => {
      setTeachers(data);
      setLoading(false);
    });

    const unsubscribeSchools = dataService.subscribeToSchools((data) => {
      setSchools(data);
    });

    const unsubscribeTransfers = dataService.subscribeToTransfers((data) => {
      setTransfers(data);
    });

    const unsubscribeLeaves = dataService.subscribeToLeaveRequests((data) => {
      setLeaveRequests(data);
    });

    return () => {
      unsubscribeTeachers();
      unsubscribeSchools();
      unsubscribeTransfers();
      unsubscribeLeaves();
    };
  }, []);

  const calculateRetirementDate = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const retirementDate = new Date(birthDate.setFullYear(birthDate.getFullYear() + 60));
    return retirementDate.toISOString().split('T')[0];
  };

  const handleAddTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addTeacher({
        ...newTeacher,
        retirementDate: calculateRetirementDate(newTeacher.dateOfBirth),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsAddModalOpen(false);
      setNewTeacher({
        emisCode: '',
        firstName: '',
        lastName: '',
        nationalId: '',
        employmentNumber: '',
        registrationNumber: '',
        tcmRegistrationNumber: '',
        licenseNumber: '',
        licenseExpiryDate: '',
        teachingStandard: '',
        responsibility: '',
        gender: 'Male',
        dateOfBirth: '',
        qualification: '',
        specialization: '',
        schoolId: '',
        status: 'Active',
        standards: [],
        phone: '',
        address: '',
        joiningDate: '',
        dateOfFirstAppointment: '',
        dateOfPresentStandard: '',
        grade: '',
        remarks: '',
        teachingClass: '',
        professionalInfo: {
          rank: '',
          lastPromotionDate: '',
          probationStatus: 'Confirmed'
        }
      });
    } catch (error) {
      console.error('Error adding teacher:', error);
    }
  };

  const handleEditTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;
    try {
      await dataService.updateTeacher(editingTeacher.id, {
        ...editingTeacher,
        retirementDate: calculateRetirementDate(editingTeacher.dateOfBirth),
        updatedAt: new Date().toISOString(),
      });
      setIsEditModalOpen(false);
      setEditingTeacher(null);
    } catch (error) {
      console.error('Error updating teacher:', error);
    }
  };

  const handleRequestTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addTransfer({
        ...newTransfer,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setIsTransferModalOpen(false);
      setNewTransfer({
        teacherId: '',
        fromSchoolId: '',
        toSchoolId: '',
        reason: '',
        status: 'Pending',
        requestDate: new Date().toISOString().split('T')[0],
      });
    } catch (error) {
      console.error('Error requesting transfer:', error);
    }
  };

  const handleUpdateTransferStatus = async (transfer: Transfer, status: 'Approved' | 'Rejected' | 'Completed') => {
    try {
      const updateData: Partial<Transfer> = { 
        status, 
        updatedAt: new Date().toISOString() 
      };
      
      if (status === 'Approved') {
        updateData.effectiveDate = new Date().toISOString().split('T')[0];
        updateData.approvedBy = 'Admin'; // In a real app, this would be the logged-in user
      }

      await dataService.updateTransfer(transfer.id, updateData);

      // If completed, update teacher's school
      if (status === 'Completed') {
        await dataService.updateTeacher(transfer.teacherId, {
          schoolId: transfer.toSchoolId,
          status: 'Active',
          updatedAt: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error updating transfer status:', error);
    }
  };

  const grades = ['Auxiliary', 'Grade L', 'Grade K', 'Grade J', 'Grade I', 'Grade H', 'Grade G'];

  const [statusFilter, setStatusFilter] = useState('All');
  const [genderFilter, setGenderFilter] = useState('All');
  const [schoolFilter, setSchoolFilter] = useState('All');

  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.emisCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nationalId.includes(searchQuery);
    
    const matchesGrade = gradeFilter === 'All' || 
      t.professionalInfo?.rank === gradeFilter || 
      t.professionalInfo?.salaryGrade === gradeFilter ||
      (gradeFilter.includes('Grade') && (t.professionalInfo?.rank === gradeFilter.replace('Grade ', '') || t.professionalInfo?.salaryGrade === gradeFilter.replace('Grade ', '')));

    const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
    const matchesGender = genderFilter === 'All' || t.gender === genderFilter;
    const matchesSchool = schoolFilter === 'All' || t.schoolId === schoolFilter;

    return matchesSearch && matchesGrade && matchesStatus && matchesGender && matchesSchool;
  });

  const stats = {
    total: teachers.length,
    active: teachers.filter(t => t.status === 'Active').length,
    onLeave: teachers.filter(t => t.status === 'On Leave').length,
    transferred: teachers.filter(t => t.status === 'Transferred').length,
  };

  const exportToCSV = () => {
    const headers = [
      'School Name', 
      'Name of Officer', 
      'Sex', 
      'Grade', 
      'Emp. No.', 
      'Date of Birth ', 
      'Reg.No.', 
      'Highest Qualification', 
      'DOFA', 
      'Date of Present Grade', 
      'Home Address', 
      'Remarks', 
      'Teaching Class'
    ];
    
    const csvData = filteredTeachers.map(t => {
      const schoolName = schools.find(s => s.id === t.schoolId)?.name || '';
      return [
        schoolName,
        `${t.firstName} ${t.lastName}`,
        t.gender,
        t.grade || t.professionalInfo?.rank || '',
        t.employmentNumber || '',
        t.dateOfBirth ? new Date(t.dateOfBirth).toLocaleDateString() : '',
        t.registrationNumber || t.emisCode || '',
        t.qualification || '',
        t.dateOfFirstAppointment ? new Date(t.dateOfFirstAppointment).toLocaleDateString() : (t.joiningDate ? new Date(t.joiningDate).toLocaleDateString() : ''),
        t.dateOfPresentStandard ? new Date(t.dateOfPresentStandard).toLocaleDateString() : (t.professionalInfo?.lastPromotionDate || ''),
        t.address || '',
        t.remarks || '',
        t.teachingClass || t.teachingStandard || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teacher_registry_${new Date().toISOString().split('T')[0]}.csv`);
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
          const newTeachers = results.data.map((row: any) => {
            const fullName = row['Name of Officer'] || row['Full Name'] || '';
            const names = fullName.split(' ');
            const firstName = names[0] || 'Unknown';
            const lastName = names.slice(1).join(' ') || 'Teacher';
            
            return {
              firstName,
              lastName,
              gender: ((row['Sex'] || row['Gender'] || 'Male').includes('F') ? 'Female' : 'Male') as 'Male' | 'Female' | 'Other',
              grade: row['Grade'] || '',
              employmentNumber: row['Emp. No.'] || row['Employment No'] || '',
              dateOfBirth: row['Date of Birth '] || row['Date of Birth'] || row['DOB'] || '',
              registrationNumber: row['Reg.No.'] || row['Reg No'] || '',
              emisCode: row['EMIS Code'] || row['Reg.No.'] || row['Reg No'] || Math.random().toString(36).substring(7).toUpperCase(),
              qualification: row['Highest Qualification'] || row['Qualification'] || '',
              specialization: row['Specialization'] || 'General',
              dateOfFirstAppointment: row['DOFA'] || '',
              dateOfPresentStandard: row['Date of Present Grade'] || '',
              address: row['Home Address'] || '',
              remarks: row['Remarks'] || '',
              teachingClass: row['Teaching Class'] || row['Teaching Standard'] || row['Standard'] || '',
              schoolId: schools.find(s => s.name.toLowerCase() === (row['School Name'] || row['Duty Station'] || '').toLowerCase())?.id || '',
              status: 'Active' as any,
              nationalId: row['National ID'] || Math.random().toString(36).substring(7).toUpperCase(),
              professionalInfo: {
                rank: row['Grade'] || '',
                probationStatus: 'Confirmed' as const
              },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          });

          for (const teacher of newTeachers) {
            await dataService.addTeacher(teacher);
          }
          toast.success(`Successfully uploaded ${newTeachers.length} teachers.`);
        } catch (error) {
          console.error('Error bulk uploading teachers:', error);
          toast.error('Failed to upload teachers. Please check the CSV format.');
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
    { id: 'list', label: 'Teachers List', icon: List },
    { id: 'staffing', label: 'Staffing Analysis', icon: BarChartIcon },
    { id: 'tcm_registration', label: 'TCM Registration', icon: ClipboardCheck },
    { id: 'deployment', label: 'Deployment', icon: MapPin },
    { id: 'transfers', label: 'Transfers', icon: ArrowRightLeft },
    { id: 'leave', label: 'Teachers on Leave', icon: Calendar },
  ];

  if (selectedTeacherId) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="gap-2 -ml-2 text-zinc-600 hover:text-zinc-900"
          onClick={() => setSelectedTeacherId(null)}
        >
          <ArrowLeft size={18} />
          Back to Registry
        </Button>
        <TeacherProfile teacherId={selectedTeacherId} />
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'staffing':
        return <StaffingAnalysis teachers={teachers} schools={schools} />;
      case 'tcm_registration':
        return <TCMRegistrationView teachers={teachers} schools={schools} />;
      case 'deployment':
        return (
          <DeploymentView 
            teachers={teachers} 
            schools={schools} 
            onRequestTransfer={(teacherId, schoolId) => {
              setNewTransfer({
                ...newTransfer,
                teacherId,
                fromSchoolId: schoolId,
              });
              setIsTransferModalOpen(true);
            }}
          />
        );
      case 'transfers':
        return (
          <TransfersView 
            transfers={transfers} 
            teachers={teachers} 
            schools={schools} 
            onNewRequest={() => setIsTransferModalOpen(true)}
            onUpdateStatus={handleUpdateTransferStatus}
          />
        );
      case 'leave':
        return (
          <LeaveManagementView 
            teachers={teachers} 
            schools={schools} 
            leaveRequests={leaveRequests}
            onView={setSelectedTeacherId}
          />
        );
      case 'list':
      default:
        return (
          <TeachersList 
            teachers={filteredTeachers} 
            schools={schools}
            loading={loading} 
            onView={setSelectedTeacherId}
            onEdit={(t) => { setEditingTeacher(t); setIsEditModalOpen(true); }}
            onDelete={(id) => setTeacherToDeleteId(id)}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Total Teachers</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.total}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <UserCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">Active</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.active}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <UserMinus size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">On Leave</p>
            <p className="text-2xl font-bold text-zinc-900">{stats.onLeave}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-500">TCM Registered</p>
            <p className="text-2xl font-bold text-zinc-900">
              {teachers.filter(t => t.tcmRegistrationNumber).length}
            </p>
          </div>
        </Card>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-zinc-200 overflow-x-auto pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-emerald-500 text-emerald-600 bg-emerald-50/50"
                : "border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50"
            )}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Header Actions (Only for List tab) */}
      {activeTab === 'list' && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <Input 
              placeholder="Search by name, EMIS code or ID..." 
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
                id="bulk-upload-teachers"
                onChange={handleBulkUpload}
                disabled={isBulkUploading}
              />
              <Button 
                variant="outline" 
                className="gap-2"
                onClick={() => document.getElementById('bulk-upload-teachers')?.click()}
                disabled={isBulkUploading}
              >
                <Plus size={18} />
                {isBulkUploading ? 'Uploading...' : 'Bulk Upload'}
              </Button>
            </div>
            <select 
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
            >
              <option value="All">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
            <select 
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
            >
              <option value="All">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
            <select 
              className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Transferred">Transferred</option>
              <option value="Retired">Retired</option>
            </select>
            <Button 
              variant="outline" 
              className={cn("gap-2", (genderFilter !== 'All' || statusFilter !== 'All' || gradeFilter !== 'All' || schoolFilter !== 'All') && "border-emerald-500 bg-emerald-50 text-emerald-600")}
              onClick={() => {
                setGenderFilter('All');
                setStatusFilter('All');
                setGradeFilter('All');
                setSchoolFilter('All');
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
              <UserPlus size={18} />
              Add Teacher
            </Button>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="mt-6">
        {renderTabContent()}
      </div>

      {/* Add Teacher Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Add New Teacher</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsAddModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleAddTeacher} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">First Name</label>
                  <Input 
                    required
                    placeholder="First Name"
                    value={newTeacher.firstName}
                    onChange={(e) => setNewTeacher({ ...newTeacher, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Name</label>
                  <Input 
                    required
                    placeholder="Last Name"
                    value={newTeacher.lastName}
                    onChange={(e) => setNewTeacher({ ...newTeacher, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sex</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={newTeacher.gender}
                    onChange={(e) => setNewTeacher({ ...newTeacher, gender: e.target.value as any })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                  <Input 
                    required
                    type="date"
                    value={newTeacher.dateOfBirth}
                    onChange={(e) => setNewTeacher({ ...newTeacher, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Retirement Date (Auto)</label>
                  <div className="h-10 rounded-xl border border-zinc-100 bg-zinc-50 px-3 flex items-center text-sm text-zinc-500 font-medium">
                    {calculateRetirementDate(newTeacher.dateOfBirth) || 'Select DOB first'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Employment Number</label>
                  <Input 
                    placeholder="Employment Number"
                    value={newTeacher.employmentNumber}
                    onChange={(e) => setNewTeacher({ ...newTeacher, employmentNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Registration Number</label>
                  <Input 
                    placeholder="Registration Number"
                    value={newTeacher.registrationNumber}
                    onChange={(e) => setNewTeacher({ ...newTeacher, registrationNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">National ID Number</label>
                  <Input 
                    required
                    placeholder="National ID"
                    value={newTeacher.nationalId}
                    onChange={(e) => setNewTeacher({ ...newTeacher, nationalId: e.target.value })}
                  />
                </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">TCM Registration Number</label>
          <Input 
            placeholder="TCM Registration Number"
            value={newTeacher.tcmRegistrationNumber}
            onChange={(e) => setNewTeacher({ ...newTeacher, tcmRegistrationNumber: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">License Number</label>
          <Input 
            placeholder="License Number"
            value={newTeacher.licenseNumber}
            onChange={(e) => setNewTeacher({ ...newTeacher, licenseNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">License Expiry Date</label>
          <Input 
            type="date"
            value={newTeacher.licenseExpiryDate}
            onChange={(e) => setNewTeacher({ ...newTeacher, licenseExpiryDate: e.target.value })}
          />
        </div>
      </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Highest Qualification</label>
                  <Input 
                    required
                    placeholder="Highest Qualification"
                    value={newTeacher.qualification}
                    onChange={(e) => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specialization</label>
                  <Input 
                    placeholder="Specialization"
                    value={newTeacher.specialization}
                    onChange={(e) => setNewTeacher({ ...newTeacher, specialization: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of First Appointment</label>
                  <Input 
                    type="date"
                    value={newTeacher.dateOfFirstAppointment}
                    onChange={(e) => setNewTeacher({ ...newTeacher, dateOfFirstAppointment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Present Standard</label>
                  <Input 
                    type="date"
                    value={newTeacher.dateOfPresentStandard}
                    onChange={(e) => setNewTeacher({ ...newTeacher, dateOfPresentStandard: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teaching Grade</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={newTeacher.grade || ''}
                    onChange={(e) => setNewTeacher({ ...newTeacher, grade: e.target.value })}
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teaching Class</label>
                  <Input 
                    placeholder="e.g. Standard 1"
                    value={newTeacher.teachingClass}
                    onChange={(e) => setNewTeacher({ ...newTeacher, teachingClass: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Responsibility</label>
                  <Input 
                    placeholder="Responsibility"
                    value={newTeacher.responsibility}
                    onChange={(e) => setNewTeacher({ ...newTeacher, responsibility: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Remarks</label>
                <textarea 
                  className="w-full min-h-[60px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Additional remarks..."
                  value={newTeacher.remarks}
                  onChange={(e) => setNewTeacher({ ...newTeacher, remarks: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                  <Input 
                    placeholder="Phone Number"
                    value={newTeacher.phone}
                    onChange={(e) => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duty Station</label>
                  <select 
                    required
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={newTeacher.schoolId}
                    onChange={(e) => setNewTeacher({ ...newTeacher, schoolId: e.target.value })}
                  >
                    <option value="">Select School</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Home Address</label>
                <textarea 
                  className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Home Address"
                  value={newTeacher.address}
                  onChange={(e) => setNewTeacher({ ...newTeacher, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">EMIS Code</label>
                  <Input 
                    required
                    placeholder="EMIS Code"
                    value={newTeacher.emisCode}
                    onChange={(e) => setNewTeacher({ ...newTeacher, emisCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={newTeacher.status}
                    onChange={(e) => setNewTeacher({ ...newTeacher, status: e.target.value as any })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" type="submit">Add Teacher</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {isEditModalOpen && editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-100 p-6">
              <h2 className="text-xl font-bold text-zinc-900">Edit Teacher</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsEditModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleEditTeacher} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">First Name</label>
                  <Input 
                    required
                    placeholder="First Name"
                    value={editingTeacher.firstName}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, firstName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Last Name</label>
                  <Input 
                    required
                    placeholder="Last Name"
                    value={editingTeacher.lastName}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, lastName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Sex</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={editingTeacher.gender}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, gender: e.target.value as any })}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Birth</label>
                  <Input 
                    required
                    type="date"
                    value={editingTeacher.dateOfBirth}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, dateOfBirth: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Retirement Date (Auto)</label>
                  <div className="h-10 rounded-xl border border-zinc-100 bg-zinc-50 px-3 flex items-center text-sm text-zinc-500 font-medium">
                    {calculateRetirementDate(editingTeacher.dateOfBirth) || 'Select DOB first'}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Employment Number</label>
                  <Input 
                    placeholder="Employment Number"
                    value={editingTeacher.employmentNumber}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, employmentNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Registration Number</label>
                  <Input 
                    placeholder="Registration Number"
                    value={editingTeacher.registrationNumber}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, registrationNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">National ID Number</label>
                  <Input 
                    required
                    placeholder="National ID"
                    value={editingTeacher.nationalId}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, nationalId: e.target.value })}
                  />
                </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">TCM Registration Number</label>
          <Input 
            placeholder="TCM Registration Number"
            value={editingTeacher.tcmRegistrationNumber}
            onChange={(e) => setEditingTeacher({ ...editingTeacher, tcmRegistrationNumber: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">License Number</label>
          <Input 
            placeholder="License Number"
            value={editingTeacher.licenseNumber}
            onChange={(e) => setEditingTeacher({ ...editingTeacher, licenseNumber: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">License Expiry Date</label>
          <Input 
            type="date"
            value={editingTeacher.licenseExpiryDate}
            onChange={(e) => setEditingTeacher({ ...editingTeacher, licenseExpiryDate: e.target.value })}
          />
        </div>
      </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Highest Qualification</label>
                  <Input 
                    required
                    placeholder="Highest Qualification"
                    value={editingTeacher.qualification}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, qualification: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Specialization</label>
                  <Input 
                    placeholder="Specialization"
                    value={editingTeacher.specialization}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, specialization: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of First Appointment</label>
                  <Input 
                    type="date"
                    value={editingTeacher.dateOfFirstAppointment || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, dateOfFirstAppointment: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Date of Present Standard</label>
                  <Input 
                    type="date"
                    value={editingTeacher.dateOfPresentStandard || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, dateOfPresentStandard: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teaching Grade</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={editingTeacher.grade || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, grade: e.target.value })}
                  >
                    <option value="">Select Grade</option>
                    {grades.map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teaching Class</label>
                  <Input 
                    placeholder="e.g. Standard 1"
                    value={editingTeacher.teachingClass || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, teachingClass: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Responsibility</label>
                  <Input 
                    placeholder="Responsibility"
                    value={editingTeacher.responsibility || ''}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, responsibility: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Remarks</label>
                <textarea 
                  className="w-full min-h-[60px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Additional remarks..."
                  value={editingTeacher.remarks || ''}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, remarks: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Phone Number</label>
                  <Input 
                    placeholder="Phone Number"
                    value={editingTeacher.phone}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Duty Station</label>
                  <select 
                    required
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={editingTeacher.schoolId}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, schoolId: e.target.value })}
                  >
                    <option value="">Select School</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Home Address</label>
                <textarea 
                  className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                  placeholder="Home Address"
                  value={editingTeacher.address}
                  onChange={(e) => setEditingTeacher({ ...editingTeacher, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">EMIS Code</label>
                  <Input 
                    required
                    placeholder="EMIS Code"
                    value={editingTeacher.emisCode}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, emisCode: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</label>
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={editingTeacher.status}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, status: e.target.value as any })}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Transferred">Transferred</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
                <Button variant="outline" type="button" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700" type="submit">Update Teacher</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      {teacherToDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl p-6">
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="p-3 rounded-full bg-red-50">
                <AlertTriangle size={24} />
              </div>
              <h2 className="text-xl font-bold">Delete Teacher?</h2>
            </div>
            <p className="text-zinc-600 mb-6">
              Are you sure you want to delete this teacher record? This action cannot be undone and will remove all associated records.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setTeacherToDeleteId(null)}>Cancel</Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={async () => {
                  await dataService.deleteTeacher(teacherToDeleteId);
                  setTeacherToDeleteId(null);
                }}
              >
                Delete Record
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Transfer Request Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white shadow-2xl">
            <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-900">New Transfer Request</h2>
              <Button variant="ghost" size="sm" onClick={() => setIsTransferModalOpen(false)}>✕</Button>
            </div>
            <form onSubmit={handleRequestTransfer} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Teacher</label>
                <select 
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newTransfer.teacherId}
                  onChange={(e) => {
                    const teacher = teachers.find(t => t.id === e.target.value);
                    setNewTransfer({ 
                      ...newTransfer, 
                      teacherId: e.target.value,
                      fromSchoolId: teacher?.schoolId || ''
                    });
                  }}
                  required
                >
                  <option value="">Select a teacher</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.firstName} {teacher.lastName} ({schools.find(s => s.id === teacher.schoolId)?.name || 'No School'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Destination School</label>
                <select 
                  className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  value={newTransfer.toSchoolId}
                  onChange={(e) => setNewTransfer({ ...newTransfer, toSchoolId: e.target.value })}
                  required
                >
                  <option value="">Select destination school</option>
                  {schools.filter(s => s.id !== newTransfer.fromSchoolId).map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Reason for Transfer</label>
                <textarea 
                  className="w-full min-h-[100px] rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Explain why this transfer is being requested..."
                  value={newTransfer.reason}
                  onChange={(e) => setNewTransfer({ ...newTransfer, reason: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">Submit Request</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

// Sub-components for Tabs

const TeachersList = ({ teachers, schools, loading, onView, onEdit, onDelete }: any) => (
  <Card className="p-0 overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-zinc-50 border-b border-zinc-200">
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teacher's Name</th>
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Sex</th>
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teaching Standard</th>
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Duty Station</th>
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phone Number</th>
            <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-200">
          {loading ? (
            <tr>
              <td colSpan={6} className="px-6 py-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                  <p className="text-sm text-zinc-500">Loading teachers...</p>
                </div>
              </td>
            </tr>
          ) : teachers.map((teacher: any) => {
            const school = schools?.find((s: any) => s.id === teacher.schoolId);
            return (
              <tr key={teacher.id} className="hover:bg-zinc-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-xs text-zinc-500">{teacher.qualification}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-zinc-600">{teacher.gender}</span>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-zinc-600">{teacher.teachingStandard || 'N/A'}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-900">{school?.name || 'Unassigned'}</span>
                    <span className="text-[10px] text-zinc-400 uppercase font-mono">{teacher.emisCode}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-zinc-600 font-mono">{teacher.phone || 'N/A'}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5 border-zinc-200 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50" 
                      onClick={() => onView(teacher.id)}
                    >
                      <Eye size={14} />
                      View Profile
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100" 
                      onClick={() => onEdit(teacher)}
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600 hover:bg-red-50" 
                      onClick={() => onDelete(teacher.id)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </Card>
);

const StaffingAnalysis = ({ teachers, schools }: { teachers: Teacher[], schools: School[] }) => {
  const standards = ['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'];
  const grades = ['Auxiliary', 'Grade L', 'Grade K', 'Grade J', 'Grade I', 'Grade H', 'Grade G'];

  const gradeStats = useMemo(() => {
    return grades.map(grade => {
      const gradeTeachers = teachers.filter(t => 
        t.professionalInfo?.rank === grade || 
        t.professionalInfo?.salaryGrade === grade ||
        (grade.includes('Grade') && (t.professionalInfo?.rank === grade.replace('Grade ', '') || t.professionalInfo?.salaryGrade === grade.replace('Grade ', '')))
      );
      return {
        grade,
        male: gradeTeachers.filter(t => t.gender === 'Male').length,
        female: gradeTeachers.filter(t => t.gender === 'Female').length,
        total: gradeTeachers.length
      };
    });
  }, [teachers]);
  
  const staffingByStandard = useMemo(() => {
    return standards.map(standard => ({
      name: standard,
      total: teachers.filter(t => t.standards?.includes(standard)).length,
      male: teachers.filter(t => t.standards?.includes(standard) && t.gender === 'Male').length,
      female: teachers.filter(t => t.standards?.includes(standard) && t.gender === 'Female').length,
    }));
  }, [teachers]);

  const schoolStaffing = useMemo(() => {
    return schools.map(school => {
      const schoolTeachers = teachers.filter(t => t.schoolId === school.id);
      const enrollment = school.enrollment?.total || 0;
      const ratio = schoolTeachers.length > 0 ? Math.round(enrollment / schoolTeachers.length) : 0;
      
      return {
        name: school.name,
        teachers: schoolTeachers.length,
        enrollment,
        ratio,
        status: ratio > 40 ? 'Understaffed' : ratio < 20 ? 'Overstaffed' : 'Optimal'
      };
    }).sort((a, b) => b.ratio - a.ratio);
  }, [teachers, schools]);

  return (
    <div className="space-y-8">
      {/* Grade Distribution Table */}
      <Card className="p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">Teaching Grade Distribution</h3>
            <p className="text-sm text-zinc-500">Staffing analysis by grade and gender across all schools</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            <Users size={12} />
            Zonal Aggregate
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-zinc-200 min-w-[800px]">
            <thead>
              <tr>
                <th rowSpan={2} className="border border-zinc-200 p-3 bg-zinc-50 text-left text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</th>
                {grades.map(grade => (
                  <th key={grade} colSpan={2} className="border border-zinc-200 p-3 bg-zinc-50 text-center text-xs font-bold text-zinc-900 uppercase tracking-wider">{grade}</th>
                ))}
              </tr>
              <tr>
                {grades.map(grade => (
                  <React.Fragment key={grade}>
                    <th className="border border-zinc-200 p-2 bg-zinc-50 text-center text-[10px] font-bold text-zinc-500">M</th>
                    <th className="border border-zinc-200 p-2 bg-zinc-50 text-center text-[10px] font-bold text-zinc-500">F</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr className="hover:bg-zinc-50/50 transition-colors">
                <td className="border border-zinc-200 p-3 font-bold text-sm text-zinc-700 bg-zinc-50/30">Count</td>
                {gradeStats.map(stat => (
                  <React.Fragment key={stat.grade}>
                    <td className="border border-zinc-200 p-3 text-center text-sm font-medium text-zinc-600">{stat.male}</td>
                    <td className="border border-zinc-200 p-3 text-center text-sm font-medium text-zinc-600">{stat.female}</td>
                  </React.Fragment>
                ))}
              </tr>
              <tr className="bg-zinc-100/50 font-bold">
                <td className="border border-zinc-200 p-3 text-sm text-zinc-900">Total per Grade</td>
                {gradeStats.map(stat => (
                  <td key={stat.grade} colSpan={2} className="border border-zinc-200 p-3 text-center text-sm text-zinc-900 bg-zinc-100/30">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-zinc-900">{stat.total}</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Teachers</span>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Staffing by Standard</h3>
              <p className="text-sm text-zinc-500">Teacher distribution across standards</p>
            </div>
            <BarChartIcon className="text-zinc-400" size={20} />
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={staffingByStandard}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="male" name="Male" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="female" name="Female" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-zinc-900">Pupil-Teacher Ratio (PTR)</h3>
              <p className="text-sm text-zinc-500">Schools with highest ratios</p>
            </div>
            <TrendingUp className="text-emerald-500" size={20} />
          </div>
          <div className="space-y-4">
            {schoolStaffing.slice(0, 5).map((school, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                    school.status === 'Understaffed' ? "bg-red-100 text-red-600" :
                    school.status === 'Overstaffed' ? "bg-blue-100 text-blue-600" :
                    "bg-emerald-100 text-emerald-600"
                  )}>
                    {school.ratio}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{school.name}</p>
                    <p className="text-xs text-zinc-500">{school.teachers} Teachers • {school.enrollment} Pupils</p>
                  </div>
                </div>
                <div className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  school.status === 'Understaffed' ? "bg-red-50 text-red-700" :
                  school.status === 'Overstaffed' ? "bg-blue-50 text-blue-700" :
                  "bg-emerald-50 text-emerald-700"
                )}>
                  {school.status}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-6 border-b border-zinc-200">
          <h3 className="text-lg font-bold text-zinc-900">Detailed Staffing Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">School Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teachers</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Enrollment</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">PTR</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {schoolStaffing.map((school, index) => (
                <tr key={index} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-zinc-900">{school.name}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{school.teachers}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{school.enrollment}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "text-sm font-bold",
                      school.ratio > 40 ? "text-red-600" : "text-zinc-900"
                    )}>{school.ratio}:1</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      school.status === 'Understaffed' ? "bg-red-50 text-red-700" :
                      school.status === 'Overstaffed' ? "bg-blue-50 text-blue-700" :
                      "bg-emerald-50 text-emerald-700"
                    )}>
                      {school.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const TCMRegistrationView = ({ teachers, schools }: { teachers: Teacher[], schools: School[] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name' | 'regNo' | 'expiry'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const stats = useMemo(() => {
    const registered = teachers.filter(t => t.tcmRegistrationNumber).length;
    const licensed = teachers.filter(t => t.licenseNumber && t.licenseExpiryDate && new Date(t.licenseExpiryDate) > new Date()).length;
    const expired = teachers.filter(t => t.licenseNumber && t.licenseExpiryDate && new Date(t.licenseExpiryDate) <= new Date()).length;
    const pending = teachers.filter(t => t.tcmRegistrationNumber && !t.licenseNumber).length;

    return { registered, licensed, expired, pending };
  }, [teachers]);

  const filteredAndSortedTeachers = useMemo(() => {
    return teachers
      .filter(t => {
        const matchesSearch = `${t.firstName} ${t.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.tcmRegistrationNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            t.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSchool = schoolFilter === 'All' || t.schoolId === schoolFilter;
        
        let matchesStatus = true;
        const isLicensed = t.licenseNumber && t.licenseExpiryDate && new Date(t.licenseExpiryDate) > new Date();
        const isExpired = t.licenseNumber && t.licenseExpiryDate && new Date(t.licenseExpiryDate) <= new Date();
        const isPending = t.tcmRegistrationNumber && !t.licenseNumber;

        if (statusFilter === 'Licensed') matchesStatus = !!isLicensed;
        else if (statusFilter === 'Expired') matchesStatus = !!isExpired;
        else if (statusFilter === 'Pending') matchesStatus = !!isPending;
        else if (statusFilter === 'Unregistered') matchesStatus = !t.tcmRegistrationNumber;

        return matchesSearch && matchesSchool && matchesStatus;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        } else if (sortBy === 'regNo') {
          comparison = (a.tcmRegistrationNumber || '').localeCompare(b.tcmRegistrationNumber || '');
        } else if (sortBy === 'expiry') {
          comparison = (a.licenseExpiryDate || '').localeCompare(b.licenseExpiryDate || '');
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [teachers, searchTerm, schoolFilter, statusFilter, sortBy, sortOrder]);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ClipboardCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Total Registered</p>
              <p className="text-xl font-black text-zinc-900">{stats.registered}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Active Licenses</p>
              <p className="text-xl font-black text-emerald-600">{stats.licensed}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Expired Licenses</p>
              <p className="text-xl font-black text-red-600">{stats.expired}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">License Pending</p>
              <p className="text-xl font-black text-amber-600">{stats.pending}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters and Sorting */}
      <Card className="p-4 border-zinc-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by name, TCM number, or license..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Schools</option>
              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="All">All Statuses</option>
              <option value="Licensed">Licensed</option>
              <option value="Expired">Expired</option>
              <option value="Pending">Pending</option>
              <option value="Unregistered">Unregistered</option>
            </select>
            <div className="flex items-center gap-2 border border-zinc-200 rounded-xl px-2 bg-zinc-50">
              <span className="text-xs font-bold text-zinc-400 uppercase px-1">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent py-2 text-sm focus:outline-none"
              >
                <option value="name">Name</option>
                <option value="regNo">TCM Number</option>
                <option value="expiry">Expiry Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-1 hover:bg-zinc-200 rounded transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card className="p-0 overflow-hidden border-zinc-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200">
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">TCM Reg No</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">License No</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {filteredAndSortedTeachers.map((teacher) => {
                const isLicensed = teacher.licenseNumber && teacher.licenseExpiryDate && new Date(teacher.licenseExpiryDate) > new Date();
                const isExpired = teacher.licenseNumber && teacher.licenseExpiryDate && new Date(teacher.licenseExpiryDate) <= new Date();
                const isPending = teacher.tcmRegistrationNumber && !teacher.licenseNumber;

                return (
                  <tr key={teacher.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-bold">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-[10px] text-zinc-400 uppercase">{schools.find(s => s.id === teacher.schoolId)?.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-zinc-600">{teacher.tcmRegistrationNumber || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-mono text-zinc-600">{teacher.licenseNumber || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-zinc-600">
                        {teacher.licenseExpiryDate ? new Date(teacher.licenseExpiryDate).toLocaleDateString() : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {isLicensed ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
                          <ShieldCheck size={12} />
                          Active
                        </span>
                      ) : isExpired ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-100">
                          <ShieldAlert size={12} />
                          Expired
                        </span>
                      ) : isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-100">
                          <Clock size={12} />
                          Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-zinc-50 text-zinc-500 text-[10px] font-bold uppercase tracking-wider border border-zinc-100">
                          Unregistered
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredAndSortedTeachers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">No matching records found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const DeploymentView = ({ teachers, schools, onRequestTransfer }: { teachers: Teacher[], schools: School[], onRequestTransfer: (tId: string, sId: string) => void }) => {
  return (
    <div className="space-y-6">
      {schools.map(school => {
        const schoolTeachers = teachers.filter(t => t.schoolId === school.id);
        return (
          <Card key={school.id} className="overflow-hidden">
            <div className="bg-zinc-50 p-4 border-b border-zinc-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{school.name}</h3>
                <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{school.emisCode} • {school.zone} Zone</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-zinc-900">{schoolTeachers.length} Teachers</p>
                <p className="text-xs text-zinc-500">Enrollment: {school.enrollment?.total || 0}</p>
              </div>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <tbody className="divide-y divide-zinc-100">
                  {schoolTeachers.map(teacher => (
                    <tr key={teacher.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-xs font-bold">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </div>
                          <span className="text-sm font-medium text-zinc-900">{teacher.firstName} {teacher.lastName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-zinc-500">{teacher.qualification}</td>
                      <td className="px-6 py-3 text-sm text-zinc-500">{teacher.specialization}</td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mr-2",
                            teacher.status === 'Active' ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                          )}>
                            {teacher.status}
                          </span>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] uppercase tracking-wider font-bold"
                            onClick={() => onRequestTransfer(teacher.id, school.id)}
                          >
                            Transfer
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {schoolTeachers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-zinc-400 italic">No teachers deployed to this school</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        );
      })}
    </div>
  );
};

const TransfersView = ({ transfers, teachers, schools, onNewRequest, onUpdateStatus }: { 
  transfers: Transfer[], 
  teachers: Teacher[], 
  schools: School[], 
  onNewRequest: () => void,
  onUpdateStatus: (t: Transfer, s: 'Approved' | 'Rejected' | 'Completed') => void
}) => {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
        <h3 className="text-lg font-bold text-zinc-900">Transfer History & Requests</h3>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={onNewRequest}>
          <Plus size={18} />
          New Transfer Request
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-zinc-200">
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Teacher</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">From</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">To</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            {transfers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((transfer) => {
              const teacher = teachers.find(t => t.id === transfer.teacherId);
              const fromSchool = schools.find(s => s.id === transfer.fromSchoolId);
              const toSchool = schools.find(s => s.id === transfer.toSchoolId);
              return (
                <tr key={transfer.id} className="hover:bg-zinc-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-zinc-900">{teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Unknown'}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{fromSchool?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{toSchool?.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-sm text-zinc-600">{new Date(transfer.requestDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-bold",
                      transfer.status === 'Approved' ? "bg-emerald-50 text-emerald-700" :
                      transfer.status === 'Pending' ? "bg-amber-50 text-amber-700" :
                      transfer.status === 'Rejected' ? "bg-red-50 text-red-700" :
                      transfer.status === 'Completed' ? "bg-blue-50 text-blue-700" :
                      "bg-zinc-100 text-zinc-600"
                    )}>
                      {transfer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {transfer.status === 'Pending' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => onUpdateStatus(transfer, 'Approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => onUpdateStatus(transfer, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      {transfer.status === 'Approved' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                          onClick={() => onUpdateStatus(transfer, 'Completed')}
                        >
                          Complete Transfer
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {transfers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">No transfer records found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

const LeaveManagementView = ({ 
  teachers, 
  schools, 
  leaveRequests,
  onView 
}: { 
  teachers: Teacher[], 
  schools: School[], 
  leaveRequests: LeaveRequest[],
  onView: (id: string) => void
}) => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');

  const [newRequest, setNewRequest] = useState<Partial<LeaveRequest>>({
    type: 'Sick',
    status: 'Pending',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    daysRequested: 1,
    reason: ''
  });

  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.teacherId || !newRequest.reason) return;

    const teacher = teachers.find(t => t.id === newRequest.teacherId);
    if (!teacher) return;

    try {
      await dataService.addLeaveRequest({
        ...newRequest,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        schoolId: teacher.schoolId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as LeaveRequest);
      
      setShowAddModal(false);
      setNewRequest({
        type: 'Sick',
        status: 'Pending',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        daysRequested: 1,
        reason: ''
      });
    } catch (error) {
      console.error("Error adding leave request:", error);
    }
  };

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await dataService.updateLeaveRequest(id, {
        status,
        approvedBy: user?.email || 'System',
        approvalDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error updating leave status:", error);
    }
  };

  const filteredRequests = leaveRequests.filter(req => {
    const matchesSearch = req.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         req.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'All' || req.type === filterType;
    const matchesStatus = filterStatus === 'All' || req.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-zinc-900">Leave Management</h3>
          <p className="text-sm text-zinc-500">Track and manage teacher leave applications.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={18} />
          New Leave Application
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Pending</p>
              <p className="text-xl font-black text-zinc-900">{leaveRequests.filter(r => r.status === 'Pending').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Approved</p>
              <p className="text-xl font-black text-zinc-900">{leaveRequests.filter(r => r.status === 'Approved').length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">On Leave Today</p>
              <p className="text-xl font-black text-zinc-900">
                {leaveRequests.filter(r => {
                  const today = new Date().toISOString().split('T')[0];
                  return r.status === 'Approved' && today >= r.startDate && today <= r.endDate;
                }).length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border-zinc-100">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Total Requests</p>
              <p className="text-xl font-black text-zinc-900">{leaveRequests.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="p-4 border-zinc-100">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by teacher name or reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="All">All Types</option>
              <option value="Sick">Sick Leave</option>
              <option value="Maternity">Maternity</option>
              <option value="Paternity">Paternity</option>
              <option value="Study">Study Leave</option>
              <option value="Compassionate">Compassionate</option>
              <option value="Annual">Annual Leave</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden border-zinc-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-500 uppercase text-[10px] font-black tracking-widest">
              <tr>
                <th className="px-6 py-4">Teacher</th>
                <th className="px-6 py-4">School</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Duration</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredRequests.map((req) => {
                const school = schools.find(s => s.id === req.schoolId);
                return (
                  <tr key={req.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <Users size={14} />
                        </div>
                        <span className="font-bold text-zinc-900 cursor-pointer hover:text-emerald-600" onClick={() => onView(req.teacherId)}>
                          {req.teacherName}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{school?.name || 'Unknown'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {req.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs">
                        <p className="font-bold text-zinc-900">{req.daysRequested} Days</p>
                        <p className="text-zinc-400">{req.startDate} to {req.endDate}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate text-zinc-600">{req.reason}</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                        getStatusColor(req.status)
                      )}>
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRequest(req)}
                          className="p-1.5 text-zinc-400 hover:bg-zinc-100 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <FileText size={18} />
                        </button>
                        {req.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'Approved')}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Approve"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(req.id, 'Rejected')}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Reject"
                            >
                              <XCircle size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredRequests.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    No leave requests found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* View Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900">Leave Application Details</h3>
              <button onClick={() => setSelectedRequest(null)} className="p-2 hover:bg-zinc-100 rounded-full">
                <XCircle size={20} className="text-zinc-400" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Teacher</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedRequest.teacherName}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Type</p>
                  <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded-md text-[10px] font-bold uppercase tracking-wider">
                    {selectedRequest.type}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Duration</p>
                  <p className="text-sm font-bold text-zinc-900">{selectedRequest.daysRequested} Days</p>
                  <p className="text-xs text-zinc-500">{selectedRequest.startDate} to {selectedRequest.endDate}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Status</p>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border",
                    getStatusColor(selectedRequest.status)
                  )}>
                    {selectedRequest.status}
                  </span>
                </div>
              </div>

              {selectedRequest.type === 'Study' && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-4">
                  <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest">Study Leave Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Admission Year</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.admissionYear || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">College</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.collegeName || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Course</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.courseOfStudy || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Ministry Approval</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.ministryApproval || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Mode of Study</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.modeOfStudy || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Progress</p>
                      <p className="text-sm font-bold text-zinc-900">{selectedRequest.progressOfStudy || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Reason</p>
                <p className="text-sm text-zinc-600 bg-zinc-50 p-3 rounded-xl border border-zinc-100">{selectedRequest.reason}</p>
              </div>

              {selectedRequest.status !== 'Pending' && (
                <div className="pt-4 border-t border-zinc-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Processed By</p>
                      <p className="text-xs font-bold text-zinc-900">{selectedRequest.approvedBy}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Date</p>
                      <p className="text-xs font-bold text-zinc-900">{selectedRequest.approvalDate}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setSelectedRequest(null)} className="bg-zinc-900 hover:bg-zinc-800">
                  Close
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
          <Card className="w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-zinc-900">New Leave Application</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full">
                <XCircle size={20} className="text-zinc-400" />
              </button>
            </div>

            <form onSubmit={handleAddRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Teacher</label>
                <select
                  required
                  value={newRequest.teacherId || ''}
                  onChange={(e) => setNewRequest({ ...newRequest, teacherId: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                >
                  <option value="">Select Teacher</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.firstName} {t.lastName} ({t.emisCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Leave Type</label>
                  <select
                    required
                    value={newRequest.type}
                    onChange={(e) => setNewRequest({ ...newRequest, type: e.target.value as any })}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  >
                    <option value="Sick">Sick Leave</option>
                    <option value="Maternity">Maternity</option>
                    <option value="Paternity">Paternity</option>
                    <option value="Study">Study Leave</option>
                    <option value="Compassionate">Compassionate</option>
                    <option value="Annual">Annual Leave</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Days Requested</label>
                  <Input
                    type="number"
                    required
                    min={1}
                    value={newRequest.daysRequested || 1}
                    onChange={(e) => setNewRequest({ ...newRequest, daysRequested: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">Start Date</label>
                  <Input
                    type="date"
                    required
                    value={newRequest.startDate}
                    onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1">End Date</label>
                  <Input
                    type="date"
                    required
                    value={newRequest.endDate}
                    onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                  />
                </div>
              </div>

              {newRequest.type === 'Study' && (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                  <h4 className="text-sm font-bold text-emerald-800 uppercase tracking-wider">Study Leave Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Admission Year</label>
                      <Input
                        type="number"
                        placeholder="e.g. 2024"
                        value={newRequest.admissionYear || ''}
                        onChange={(e) => setNewRequest({ ...newRequest, admissionYear: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Name of College</label>
                      <Input
                        placeholder="College Name"
                        value={newRequest.collegeName || ''}
                        onChange={(e) => setNewRequest({ ...newRequest, collegeName: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Course of Study</label>
                      <Input
                        placeholder="Course Name"
                        value={newRequest.courseOfStudy || ''}
                        onChange={(e) => setNewRequest({ ...newRequest, courseOfStudy: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Ministry's Approval</label>
                      <select
                        value={newRequest.ministryApproval || 'No'}
                        onChange={(e) => setNewRequest({ ...newRequest, ministryApproval: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      >
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Mode of Study</label>
                      <select
                        value={newRequest.modeOfStudy || 'ODL'}
                        onChange={(e) => setNewRequest({ ...newRequest, modeOfStudy: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      >
                        <option value="ODL">ODL</option>
                        <option value="Residential">Residential</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-700 mb-1">Progress of Study</label>
                      <select
                        value={newRequest.progressOfStudy || 'Continuing'}
                        onChange={(e) => setNewRequest({ ...newRequest, progressOfStudy: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      >
                        <option value="Continuing">Continuing</option>
                        <option value="Completed">Completed</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Reason / Description</label>
                <textarea
                  required
                  value={newRequest.reason}
                  onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  placeholder="Provide details about the leave request..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
                  Submit Application
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

const TeachersOnLeave = ({ teachers, onEdit, onView }: { teachers: Teacher[], onEdit: (t: Teacher) => void, onView: (id: string) => void }) => {
  const leaveTeachers = teachers.filter(t => t.status === 'On Leave');
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-zinc-900">Teachers Currently on Leave</h3>
        <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold uppercase tracking-wider">{leaveTeachers.length} Total</span>
      </div>
      <TeachersList 
        teachers={leaveTeachers} 
        loading={false} 
        onView={onView} 
        onEdit={onEdit} 
        onDelete={() => {}} 
      />
    </div>
  );
};
