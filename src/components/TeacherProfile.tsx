import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Phone, MapPin, Calendar, GraduationCap, 
  Briefcase, Award, History, FileText, Save, X, 
  Edit2, Plus, Trash2, Upload, Eye, Check, AlertCircle,
  Activity, BookOpen, Shield, Download, Printer, ArrowLeft
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Teacher, School } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';

interface TeacherProfileProps {
  teacherId: string;
  onClose?: () => void;
}

type TabType = 
  | 'basic' | 'professional' | 'history' | 'records' | 'documents' | 'audit';

export const TeacherProfile: React.FC<TeacherProfileProps> = ({ teacherId, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [editedData, setEditedData] = useState<Teacher | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAddingTPD, setIsAddingTPD] = useState(false);
  const [newTPDTitle, setNewTPDTitle] = useState('');
  const [isAddingPerformance, setIsAddingPerformance] = useState(false);
  const [newPerfData, setNewPerfData] = useState({ year: '', rating: 5, comments: '' });
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToTeachers((allTeachers) => {
      const found = allTeachers.find(t => t.id === teacherId);
      if (found) {
        setTeacher(found);
        setEditedData(found);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [teacherId]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToSchools(setSchools);
    return () => unsubscribe();
  }, []);

  const calculateRetirementDate = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const retirementDate = new Date(birthDate.setFullYear(birthDate.getFullYear() + 60));
    return retirementDate.toISOString().split('T')[0];
  };

  const handleSave = async () => {
    if (!editedData || !teacher) return;
    try {
      const changeLogEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        user: user?.email || 'Unknown User',
        action: `Updated ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} information`,
      };

      const updatedAudit = {
        ...editedData.audit,
        changeLog: [changeLogEntry, ...(editedData.audit?.changeLog || [])].slice(0, 50)
      };

      const finalData = {
        ...editedData,
        retirementDate: calculateRetirementDate(editedData.dateOfBirth),
        audit: updatedAudit,
        updatedAt: new Date().toISOString()
      };

      await dataService.updateTeacher(teacher.id, finalData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating teacher profile:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !teacher) return;

    setIsUploading(true);
    try {
      // In a real app, we would upload to Firebase Storage
      // For now, we'll simulate it by creating a local URL or just a placeholder
      const newDoc = {
        id: crypto.randomUUID(),
        name: file.name,
        url: URL.createObjectURL(file), // Temporary URL for demo
        type: file.type.split('/')[1].toUpperCase() || 'FILE',
        uploadedAt: new Date().toISOString().split('T')[0]
      };

      const updatedDocs = [...(teacher.documents || []), newDoc];
      await dataService.updateTeacher(teacher.id, { 
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
        audit: {
          ...teacher.audit,
          changeLog: [{
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            user: user?.email || 'Unknown User',
            action: `Uploaded document: ${file.name}`
          }, ...(teacher.audit?.changeLog || [])].slice(0, 50)
        }
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!teacher) return;

    try {
      const docToDelete = teacher.documents?.find(d => d.id === docId);
      const updatedDocs = (teacher.documents || []).filter(d => d.id !== docId);
      await dataService.updateTeacher(teacher.id, { 
        documents: updatedDocs,
        updatedAt: new Date().toISOString(),
        audit: {
          ...teacher.audit,
          changeLog: [{
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            user: user?.email || 'Unknown User',
            action: `Deleted document: ${docToDelete?.name || 'Unknown'}`
          }, ...(teacher.audit?.changeLog || [])].slice(0, 50)
        }
      });
      setConfirmDeleteDocId(null);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handleAddTPD = async () => {
    if (!teacher || !newTPDTitle) return;

    try {
      const newTPD = {
        id: crypto.randomUUID(),
        programTitle: newTPDTitle,
        date: new Date().toISOString().split('T')[0],
      };

      const updatedTPD = [...(teacher.tpdHistory || []), newTPD];
      await dataService.updateTeacher(teacher.id, { 
        tpdHistory: updatedTPD,
        updatedAt: new Date().toISOString(),
        audit: {
          ...teacher.audit,
          changeLog: [{
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            user: user?.email || 'Unknown User',
            action: `Added TPD record: ${newTPDTitle}`
          }, ...(teacher.audit?.changeLog || [])].slice(0, 50)
        }
      });
      setIsAddingTPD(false);
      setNewTPDTitle('');
    } catch (error) {
      console.error('Error adding TPD record:', error);
    }
  };

  const handleAddPerformance = async () => {
    if (!teacher || !newPerfData.year || !newPerfData.comments) return;

    try {
      const newPerf = {
        year: newPerfData.year,
        rating: newPerfData.rating,
        comments: newPerfData.comments,
        supervisor: user?.email || 'Unknown Supervisor'
      };

      const updatedPerf = [...(teacher.performanceHistory || []), newPerf];
      await dataService.updateTeacher(teacher.id, { 
        performanceHistory: updatedPerf,
        updatedAt: new Date().toISOString(),
        audit: {
          ...teacher.audit,
          changeLog: [{
            id: crypto.randomUUID(),
            date: new Date().toISOString().split('T')[0],
            user: user?.email || 'Unknown User',
            action: `Added performance record for ${newPerfData.year}`
          }, ...(teacher.audit?.changeLog || [])].slice(0, 50)
        }
      });
      setIsAddingPerformance(false);
      setNewPerfData({ year: '', rating: 5, comments: '' });
    } catch (error) {
      console.error('Error adding performance record:', error);
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'basic', label: 'Personal Info', icon: User },
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'history', label: 'History & TPD', icon: History },
    { id: 'records', label: 'Service Records', icon: Activity },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'audit', label: 'Audit Log', icon: Shield },
  ];

  const renderBasicInfo = () => {
    if (!teacher || !editedData) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-zinc-400" />
              Personal Details
            </h3>
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">First Name</label>
                  {isEditing ? (
                    <Input value={editedData.firstName} onChange={e => setEditedData({...editedData, firstName: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Last Name</label>
                  {isEditing ? (
                    <Input value={editedData.lastName} onChange={e => setEditedData({...editedData, lastName: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Gender</label>
                  {isEditing ? (
                    <select 
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                      value={editedData.gender ?? "Male"}
                      onChange={e => setEditedData({...editedData, gender: e.target.value as any})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.gender}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Date of Birth</label>
                  {isEditing ? (
                    <Input type="date" value={editedData.dateOfBirth} onChange={e => setEditedData({...editedData, dateOfBirth: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.dateOfBirth}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Retirement Date</label>
                  <p className="text-sm font-bold text-emerald-600">{teacher.retirementDate || 'Not calculated'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">National ID</label>
                  {isEditing ? (
                    <Input value={editedData.nationalId} onChange={e => setEditedData({...editedData, nationalId: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.nationalId}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Status</label>
                  {isEditing ? (
                    <select 
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                      value={editedData.status ?? "Active"}
                      onChange={e => setEditedData({...editedData, status: e.target.value as any})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="Deceased">Deceased</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Transferred">Transferred</option>
                      <option value="Retired">Retired</option>
                    </select>
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.status}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Phone size={16} className="text-zinc-400" />
              Contact Information
            </h3>
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
                {isEditing ? (
                  <Input type="email" value={editedData.email || ''} onChange={e => setEditedData({...editedData, email: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{teacher.email || 'Not provided'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Phone Number</label>
                {isEditing ? (
                  <Input value={editedData.phone || ''} onChange={e => setEditedData({...editedData, phone: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{teacher.phone || 'Not provided'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Physical Address</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.address || ''}
                    onChange={e => setEditedData({...editedData, address: e.target.value})}
                  />
                ) : (
                  <p className="text-sm text-zinc-600 leading-relaxed">{teacher.address || 'Not provided'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProfessional = () => {
    if (!teacher || !editedData) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={16} className="text-zinc-400" />
              Academic & Qualifications
            </h3>
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Highest Qualification</label>
                {isEditing ? (
                  <Input value={editedData.qualification} onChange={e => setEditedData({...editedData, qualification: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{teacher.qualification}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Specialization</label>
                {isEditing ? (
                  <Input value={editedData.specialization} onChange={e => setEditedData({...editedData, specialization: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{teacher.specialization}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Subjects Taught</label>
                {isEditing ? (
                  <Input 
                    placeholder="e.g., Mathematics, Physics"
                    value={editedData.subjects?.join(', ') || ''} 
                    onChange={e => setEditedData({...editedData, subjects: e.target.value.split(',').map(s => s.trim())})} 
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(teacher.subjects || []).map((s, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium border border-emerald-100">
                        {s}
                      </span>
                    ))}
                    {(!teacher.subjects || teacher.subjects.length === 0) && <p className="text-sm text-zinc-400 italic">None listed</p>}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Briefcase size={16} className="text-zinc-400" />
              Employment Details
            </h3>
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Employment No.</label>
                  {isEditing ? (
                    <Input value={editedData.employmentNumber || ''} onChange={e => setEditedData({...editedData, employmentNumber: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.employmentNumber || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Registration No.</label>
                  {isEditing ? (
                    <Input value={editedData.registrationNumber || ''} onChange={e => setEditedData({...editedData, registrationNumber: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.registrationNumber || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">TCM Registration No.</label>
                {isEditing ? (
                  <Input value={editedData.tcmRegistrationNumber || ''} onChange={e => setEditedData({...editedData, tcmRegistrationNumber: e.target.value})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{teacher.tcmRegistrationNumber || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Current School</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                    value={editedData.schoolId ?? ""}
                    onChange={e => setEditedData({...editedData, schoolId: e.target.value})}
                  >
                    <option value="">Select School</option>
                    {schools.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm font-bold text-zinc-900">
                    {schools.find(s => s.id === teacher.schoolId)?.name || 'Not Assigned'}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Teaching Class</label>
                  {isEditing ? (
                    <Input value={editedData.teachingClass || ''} onChange={e => setEditedData({...editedData, teachingClass: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.teachingClass || teacher.teachingStandard || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Responsibility</label>
                  {isEditing ? (
                    <Input value={editedData.responsibility || ''} onChange={e => setEditedData({...editedData, responsibility: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.responsibility || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Grade</label>
                  {isEditing ? (
                    <Input value={editedData.grade || ''} onChange={e => setEditedData({...editedData, grade: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.grade || teacher.professionalInfo?.rank || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Remarks</label>
                  {isEditing ? (
                    <Input value={editedData.remarks || ''} onChange={e => setEditedData({...editedData, remarks: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.remarks || 'N/A'}</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">1st Appointment Date</label>
                  {isEditing ? (
                    <Input type="date" value={editedData.dateOfFirstAppointment || ''} onChange={e => setEditedData({...editedData, dateOfFirstAppointment: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.dateOfFirstAppointment || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Present Standard Date</label>
                  {isEditing ? (
                    <Input type="date" value={editedData.dateOfPresentStandard || ''} onChange={e => setEditedData({...editedData, dateOfPresentStandard: e.target.value})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900">{teacher.dateOfPresentStandard || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    if (!teacher) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Award size={16} className="text-zinc-400" />
              TPD & Certifications
            </h3>
            <div className="space-y-4">
              {isAddingTPD ? (
                <Card className="p-4 bg-emerald-50/50 border-emerald-200">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase">New TPD Record</p>
                    <Input 
                      placeholder="Program Title" 
                      value={newTPDTitle} 
                      onChange={e => setNewTPDTitle(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingTPD(false)}>Cancel</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddTPD}>Add Record</Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-zinc-200 text-zinc-500 hover:text-emerald-600 hover:border-emerald-200"
                  onClick={() => setIsAddingTPD(true)}
                >
                  <Plus size={14} className="mr-2" />
                  Add TPD Record
                </Button>
              )}
              {(teacher.tpdHistory || []).map((tpd, idx) => (
                <Card key={idx} className="p-4 bg-white border-zinc-100 hover:border-emerald-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{tpd.programTitle}</p>
                      <p className="text-xs text-zinc-500">{tpd.date}</p>
                    </div>
                    {tpd.certificateUrl && (
                      <Button variant="ghost" size="sm" className="text-emerald-600">
                        <Eye size={14} className="mr-2" />
                        View Cert
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
              {(!teacher.tpdHistory || teacher.tpdHistory.length === 0) && (
                <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-sm text-zinc-500">No TPD history recorded.</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-zinc-400" />
              Performance History
            </h3>
            <div className="space-y-4">
              {isAddingPerformance ? (
                <Card className="p-4 bg-emerald-50/50 border-emerald-200">
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-emerald-700 uppercase">New Performance Review</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input 
                        placeholder="Year" 
                        value={newPerfData.year} 
                        onChange={e => setNewPerfData({...newPerfData, year: e.target.value})}
                      />
                      <select 
                        className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm"
                        value={newPerfData.rating}
                        onChange={e => setNewPerfData({...newPerfData, rating: parseInt(e.target.value)})}
                      >
                        {[1, 2, 3, 4, 5].map(r => (
                          <option key={r} value={r}>{r} Stars</option>
                        ))}
                      </select>
                    </div>
                    <textarea 
                      placeholder="Comments" 
                      className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                      value={newPerfData.comments}
                      onChange={e => setNewPerfData({...newPerfData, comments: e.target.value})}
                    />
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setIsAddingPerformance(false)}>Cancel</Button>
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleAddPerformance}>Add Review</Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full border-dashed border-zinc-200 text-zinc-500 hover:text-emerald-600 hover:border-emerald-200"
                  onClick={() => setIsAddingPerformance(true)}
                >
                  <Plus size={14} className="mr-2" />
                  Add Performance Review
                </Button>
              )}
              {(teacher.performanceHistory || []).map((perf, idx) => (
                <Card key={idx} className="p-4 bg-white border-zinc-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-zinc-400 uppercase">Year: {perf.year}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map(s => (
                        <div key={s} className={cn("w-2 h-2 rounded-full", s <= perf.rating ? "bg-emerald-500" : "bg-zinc-200")} />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 italic">"{perf.comments}"</p>
                  <p className="text-[10px] text-zinc-400 mt-2">Supervisor: {perf.supervisor}</p>
                </Card>
              ))}
              {(!teacher.performanceHistory || teacher.performanceHistory.length === 0) && (
                <div className="text-center p-8 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-sm text-zinc-500">No performance records available.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    if (!teacher) return null;
    const documents = teacher.documents || [];

    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <FileText size={16} className="text-zinc-400" />
            Document Repository
          </h3>
          <div>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus size={14} />
              )}
              {isUploading ? 'Uploading...' : 'Upload New'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="p-4 hover:border-emerald-200 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-100 text-blue-600">
                  <FileText size={24} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-zinc-900">{doc.name}</p>
                  <p className="text-xs text-zinc-500">{doc.type} • Uploaded {doc.uploadedAt}</p>
                </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900"
                      onClick={() => window.open(doc.url, '_blank')}
                    >
                      <Eye size={16} />
                    </Button>
                    {confirmDeleteDocId === doc.id ? (
                      <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          Confirm
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 px-2 text-[10px] font-bold text-zinc-400"
                          onClick={() => setConfirmDeleteDocId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 text-zinc-400 hover:text-red-600"
                        onClick={() => setConfirmDeleteDocId(doc.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    )}
                  </div>
              </div>
            </Card>
          ))}
          {documents.length === 0 && (
            <div className="text-center p-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <FileText className="mx-auto text-zinc-300 mb-4" size={48} />
              <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderRecords = () => {
    if (!teacher) return null;
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <History size={16} className="text-zinc-400" />
            Transfer History
          </h3>
          <div className="space-y-4">
            {(teacher.transferHistory || []).map((transfer, idx) => (
              <Card key={idx} className="p-4 bg-white border-zinc-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{transfer.fromSchool} → {transfer.toSchool}</p>
                    <p className="text-xs text-zinc-500">{transfer.date} • {transfer.reason}</p>
                  </div>
                  <span className="px-2 py-1 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase">
                    {transfer.status}
                  </span>
                </div>
              </Card>
            ))}
            {(!teacher.transferHistory || teacher.transferHistory.length === 0) && (
              <div className="text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-sm text-zinc-500">No transfer history recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Calendar size={16} className="text-zinc-400" />
            Leave Records
          </h3>
          <div className="space-y-4">
            {(teacher.leaveRecords || []).map((leave, idx) => (
              <Card key={idx} className="p-4 bg-white border-zinc-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{leave.type} Leave</p>
                    <p className="text-xs text-zinc-500">{leave.startDate} to {leave.endDate} ({leave.duration} days)</p>
                    {leave.reason && <p className="text-xs text-zinc-400 mt-1 italic">"{leave.reason}"</p>}
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-bold uppercase",
                    leave.status === 'Approved' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-600"
                  )}>
                    {leave.status}
                  </span>
                </div>
              </Card>
            ))}
            {(!teacher.leaveRecords || teacher.leaveRecords.length === 0) && (
              <div className="text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-sm text-zinc-500">No leave records recorded.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Award size={16} className="text-zinc-400" />
            Achievements & Behaviour
          </h3>
          <div className="space-y-4">
            {(teacher.achievementRecords || []).map((record, idx) => (
              <Card key={idx} className="p-4 bg-white border-zinc-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{record.title}</p>
                    <p className="text-xs text-zinc-500">{record.date} • {record.type}</p>
                    <p className="text-xs text-zinc-600 mt-1">{record.description}</p>
                  </div>
                </div>
              </Card>
            ))}
            {(!teacher.achievementRecords || teacher.achievementRecords.length === 0) && (
              <div className="text-center p-6 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-sm text-zinc-500">No achievement or behaviour records recorded.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    if (!teacher) return null;
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
          <Shield size={16} className="text-zinc-400" />
          Profile Audit History
        </h3>
        <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden">
          <div className="divide-y divide-zinc-100">
            {(teacher.audit?.changeLog || []).map((log, idx) => (
              <div key={idx} className="p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                    <History size={14} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900">{log.action}</p>
                    <p className="text-xs text-zinc-500">{log.user} • {log.date}</p>
                  </div>
                </div>
              </div>
            ))}
            {(!teacher.audit?.changeLog || teacher.audit.changeLog.length === 0) && (
              <div className="p-8 text-center text-zinc-500 text-sm">
                No audit logs available.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <Card className="p-12 text-center">
        <AlertCircle className="mx-auto text-zinc-300 mb-4" size={48} />
        <h3 className="text-lg font-semibold text-zinc-900">Teacher not found</h3>
        <p className="text-zinc-500">The teacher profile you are looking for does not exist or has been removed.</p>
      </Card>
    );
  }

  return (
    <div className={cn(
      onClose ? "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden" : ""
    )}>
      <Card className={cn(
        "w-full max-w-5xl flex flex-col shadow-2xl overflow-hidden",
        onClose ? "h-[85vh]" : "min-h-[600px]"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
          <div className="flex items-center gap-4">
            {onClose && (
              <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={onClose}>
                <ArrowLeft size={24} />
              </Button>
            )}
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 font-bold text-xl">
              {teacher.firstName[0]}{teacher.lastName[0]}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">{teacher.firstName} {teacher.lastName}</h2>
              <p className="text-sm text-zinc-500 flex items-center gap-2">
                <span className="font-mono">{teacher.emisCode}</span>
                <span className="text-zinc-300">•</span>
                <span>{teacher.status}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={() => window.print()}>
              <Printer size={16} />
              Print
            </Button>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2" onClick={handleSave}>
                  <Save size={18} />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button variant="outline" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-zinc-100 bg-zinc-50/30 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  activeTab === tab.id 
                    ? "bg-white text-emerald-600 shadow-sm border border-zinc-100" 
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <tab.icon size={18} className={cn(activeTab === tab.id ? "text-emerald-500" : "text-zinc-400")} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
            <div className="max-w-3xl mx-auto">
              {activeTab === 'basic' && renderBasicInfo()}
              {activeTab === 'professional' && renderProfessional()}
              {activeTab === 'history' && renderHistory()}
              {activeTab === 'records' && renderRecords()}
              {activeTab === 'documents' && renderDocuments()}
              {activeTab === 'audit' && renderAudit()}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
