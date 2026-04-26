import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  Save, 
  X, 
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreVertical,
  Trash2,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
  MessageSquare,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { dataService } from '../services/dataService';
import { MaintenanceLog, School } from '../types';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';

export const MaintenanceLogModule = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<MaintenanceLog[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState<MaintenanceLog | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterUrgency, setFilterUrgency] = useState('All');

  // Form State
  const [formData, setFormData] = useState<Partial<MaintenanceLog>>({
    category: 'Classroom',
    description: '',
    urgency: 'Medium',
    status: 'Reported',
    estimatedCost: 0,
    actualCost: 0,
    notes: '',
    photoUrls: []
  });

  useEffect(() => {
    const unsubLogs = dataService.subscribeToMaintenanceLogs(setLogs);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    setLoading(false);

    return () => {
      unsubLogs();
      unsubSchools();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.description) return;

    try {
      await dataService.addMaintenanceLog({
        ...formData,
        schoolId: schools[0]?.id || '', // In a real app, this would be the user's school
        reportedBy: user?.email || 'Unknown',
        reportedAt: new Date().toISOString(),
        id: crypto.randomUUID()
      } as MaintenanceLog);
      setShowAddModal(false);
      setFormData({
        category: 'Classroom',
        description: '',
        urgency: 'Medium',
        status: 'Reported',
        estimatedCost: 0,
        actualCost: 0,
        notes: '',
        photoUrls: []
      });
    } catch (error) {
      console.error('Error adding maintenance log:', error);
    }
  };

  const handleUpdateStatus = async (log: MaintenanceLog, newStatus: MaintenanceLog['status']) => {
    try {
      await dataService.updateMaintenanceLog(log.id, { 
        status: newStatus,
        resolvedAt: newStatus === 'Completed' ? new Date().toISOString() : undefined,
        resolvedBy: newStatus === 'Completed' ? user?.email || undefined : undefined
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         l.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || l.status === filterStatus;
    const matchesUrgency = filterUrgency === 'All' || l.urgency === filterUrgency;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const categories = ['Classroom', 'Toilet', 'Water', 'Electricity', 'Furniture', 'Staff House', 'Other'];
  const urgencies = ['Low', 'Medium', 'High', 'Critical'];
  const statuses = ['Reported', 'In Progress', 'Completed', 'Deferred'];

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'High': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Medium': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Low': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-zinc-100 text-zinc-700 border-zinc-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Reported': return <AlertCircle size={14} className="text-zinc-500" />;
      case 'In Progress': return <Clock size={14} className="text-blue-500" />;
      case 'Completed': return <CheckCircle2 size={14} className="text-emerald-500" />;
      case 'Deferred': return <AlertTriangle size={14} className="text-amber-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Maintenance Logs</h1>
          <p className="text-zinc-500">Track and manage school infrastructure maintenance</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus size={18} />
          Report Issue
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Open Issues</p>
            <p className="text-xl font-bold text-zinc-900">{logs.filter(l => l.status !== 'Completed').length}</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-sm text-zinc-500">Completed</p>
            <p className="text-xl font-bold text-zinc-900">{logs.filter(l => l.status === 'Completed').length}</p>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Search by description or category..."
              className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
          >
            <option value="All">All Urgency</option>
            {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </Card>

      <div className="space-y-4">
        {filteredLogs.map((log) => (
          <Card key={log.id} className="p-5 hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedLog(log)}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                  log.status === 'Completed' ? "bg-emerald-50 text-emerald-600" : "bg-zinc-50 text-zinc-600"
                )}>
                  <Wrench size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-zinc-900">{log.category}</span>
                    <span className={cn(
                      "px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border",
                      getUrgencyColor(log.urgency)
                    )}>
                      {log.urgency}
                    </span>
                  </div>
                  <h3 className="text-base font-medium text-zinc-900 line-clamp-1">{log.description}</h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(log.reportedAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {schools.find(s => s.id === log.schoolId)?.name || 'Unknown School'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-6">
                <div className="text-right">
                  <div className="flex items-center gap-1.5 justify-end mb-1">
                    {getStatusIcon(log.status)}
                    <span className="text-sm font-medium text-zinc-900">{log.status}</span>
                  </div>
                  <p className="text-xs text-zinc-500">Reported by: {log.reportedBy}</p>
                </div>
                <ChevronRight className="text-zinc-300" size={20} />
              </div>
            </div>
          </Card>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
            <Wrench className="mx-auto text-zinc-300 mb-4" size={48} />
            <p className="text-zinc-500">No maintenance logs found matching your filters.</p>
          </div>
        )}
      </div>

      {/* Add Log Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Report Maintenance Issue</h2>
                <p className="text-sm text-zinc-500">Provide details about the infrastructure problem</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Category</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                      required
                    >
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Urgency</label>
                    <select
                      className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as any })}
                      required
                    >
                      {urgencies.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">Description</label>
                  <textarea
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[100px]"
                    placeholder="Describe the issue in detail..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="Estimated Cost (MWK)"
                    type="number"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: parseInt(e.target.value) })}
                  />
                  <div>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">Photos (Optional)</label>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" className="w-full gap-2 border-dashed">
                        <Camera size={18} />
                        Upload Photos
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100">
                  <Button variant="outline" type="button" onClick={() => setShowAddModal(false)}>Cancel</Button>
                  <Button type="submit">Report Issue</Button>
                </div>
              </form>
            </div>
          </Card>
        </div>
      )}

      {/* View/Update Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Issue Details</h2>
                <p className="text-sm text-zinc-500">Reported on {new Date(selectedLog.reportedAt).toLocaleDateString()}</p>
              </div>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} className="text-zinc-500" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold uppercase border",
                    getUrgencyColor(selectedLog.urgency)
                  )}>
                    {selectedLog.urgency} Urgency
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                    {getStatusIcon(selectedLog.status)}
                    {selectedLog.status}
                  </span>
                </div>
                <div className="flex gap-2">
                  {selectedLog.status === 'Reported' && (
                    <Button size="sm" onClick={() => handleUpdateStatus(selectedLog, 'In Progress')}>Start Work</Button>
                  )}
                  {selectedLog.status === 'In Progress' && (
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdateStatus(selectedLog, 'Completed')}>Mark Completed</Button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-zinc-900 bg-zinc-50 p-4 rounded-xl border border-zinc-100">{selectedLog.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Category</h3>
                    <p className="text-zinc-900 font-medium">{selectedLog.category}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Reported By</h3>
                    <p className="text-zinc-900 font-medium">{selectedLog.reportedBy}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Est. Cost</h3>
                    <p className="text-zinc-900 font-medium">MWK {selectedLog.estimatedCost?.toLocaleString() || 0}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Actual Cost</h3>
                    <p className="text-zinc-900 font-medium">MWK {selectedLog.actualCost?.toLocaleString() || 0}</p>
                  </div>
                </div>

                {selectedLog.notes && (
                  <div>
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-2">Notes</h3>
                    <p className="text-zinc-900">{selectedLog.notes}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 border-t border-zinc-100 bg-zinc-50/50 flex justify-end">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
