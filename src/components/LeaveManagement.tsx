import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Plus, 
  Search, 
  Filter,
  User,
  Users,
  School,
  FileText,
  ChevronRight,
  MoreVertical,
  Download,
  Loader2
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { Teacher, School as SchoolType, LeaveRequest } from '../types';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';

export const LeaveManagement = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubLeaves = dataService.subscribeToLeaveRequests((data) => {
      setLeaveRequests(data);
      setLoading(false);
    });

    return () => {
      unsubTeachers();
      unsubSchools();
      unsubLeaves();
    };
  }, []);

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

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Leave Management</h2>
          <p className="text-sm text-zinc-500">Track and manage teacher leave applications across the TDC.</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus size={18} />
          New Leave Application
        </Button>
      </div>

      {/* Stats */}
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

      {/* Filters */}
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

      {/* Requests Table */}
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
                          <User size={14} />
                        </div>
                        <span className="font-bold text-zinc-900">{req.teacherName}</span>
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

      {/* Add Modal */}
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
                    value={newRequest.daysRequested}
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
