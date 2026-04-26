import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database, 
  Save, 
  LogOut,
  Building2,
  MapPin,
  Mail,
  Phone,
  Lock,
  Smartphone,
  Check,
  Plus,
  Trash2,
  Users,
  Calendar,
  Layers,
  Skull
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { AcademicYear, Term, StandardClass, SystemSettings, School, Teacher } from '../types';
import { useAuth } from '../context/AuthContext';

import { ConfirmModal } from './ConfirmModal';

type SettingsTab = 'profile' | 'notifications' | 'security' | 'system' | 'management';

export const Settings: React.FC = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger'
  });
  
  // Data state
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [terms, setTerms] = useState<Term[]>([]);
  const [classes, setClasses] = useState<StandardClass[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  // Form state for new items
  const [newYear, setNewYear] = useState({ 
    name: '', 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] 
  });
  const [newTerm, setNewTerm] = useState({ 
    academicYearId: '', 
    number: 1, 
    weeks: 12, 
    startDate: new Date().toISOString().split('T')[0], 
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0] 
  });
  const [newClass, setNewClass] = useState({ name: '', code: '' });
  const [districtName, setDistrictName] = useState('');
  const [zoneName, setZoneName] = useState('');
  const [tdcName, setTdcName] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  useEffect(() => {
    const unsubYears = dataService.subscribeToAcademicYears(setAcademicYears);
    const unsubTerms = dataService.subscribeToTerms(setTerms);
    const unsubClasses = dataService.subscribeToStandardClasses(setClasses);
    const unsubSchools = dataService.subscribeToSchools(setSchools);
    const unsubTeachers = dataService.subscribeToTeachers(setTeachers);
    
    dataService.getSystemSettings().then(settings => {
      if (settings) {
        setSystemSettings(settings);
        setDistrictName(settings.districtName || '');
        setZoneName(settings.zoneName || '');
        setTdcName(settings.tdcName || '');
      }
    });

    return () => {
      unsubYears();
      unsubTerms();
      unsubClasses();
      unsubSchools();
      unsubTeachers();
    };
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await dataService.updateSystemSettings({
        districtName,
        zoneName,
        tdcName
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddYear = async () => {
    if (!newYear.name) return;
    await dataService.addAcademicYear({
      ...newYear,
      isCurrent: academicYears.length === 0
    });
    // Automatically move all learners from Admission to Registry
    await dataService.promoteAdmissionsToRegistry();
    setNewYear({ 
      name: '', 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0] 
    });
  };

  const handleAddTerm = async () => {
    if (!newTerm.academicYearId) return;
    await dataService.addTerm({
      ...newTerm,
      number: Number(newTerm.number) as 1 | 2 | 3,
      isCurrent: false
    });
    setNewTerm({ 
      academicYearId: '', 
      number: 1, 
      weeks: 12, 
      startDate: new Date().toISOString().split('T')[0], 
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0] 
    });
  };

  const handleAddClass = async () => {
    if (!newClass.name) return;
    await dataService.addStandardClass(newClass);
    setNewClass({ name: '', code: '' });
  };

  const handleDeleteSchool = (id: string) => {
    const school = schools.find(s => s.id === id);
    if (!school) return;

    setConfirmModal({
      isOpen: true,
      title: 'Delete School Completely?',
      message: `Are you sure you want to delete ${school.name} (${school.emisCode})? This action cannot be undone and will remove all associated records.`,
      onConfirm: () => dataService.deleteSchool(id),
      variant: 'danger'
    });
  };

  const handleDeleteTeacher = (id: string, deceased: boolean = false) => {
    const teacher = teachers.find(t => t.id === id);
    if (!teacher) return;

    if (deceased) {
      setConfirmModal({
        isOpen: true,
        title: 'Move to Deceased Section?',
        message: `Move ${teacher.firstName} ${teacher.lastName} to the deceased section? Their status will be updated but records will be preserved.`,
        onConfirm: () => dataService.updateTeacher(id, { status: 'Deceased' }),
        variant: 'warning'
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Delete Teacher Completely?',
        message: `Are you sure you want to delete ${teacher.firstName} ${teacher.lastName}? This action cannot be undone.`,
        onConfirm: () => dataService.deleteTeacher(id),
        variant: 'danger'
      });
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'User Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'system', label: 'System Config', icon: Database },
    { id: 'management', label: 'Administrative', icon: Layers },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-6 pb-6 border-b border-zinc-100">
              <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 border-4 border-white shadow-sm overflow-hidden">
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User size={40} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">{user?.name || 'TDC Administrator'}</h3>
                <p className="text-sm text-zinc-500">{user?.email}</p>
                <div className="mt-2 flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold uppercase tracking-wider relative overflow-hidden"
                  >
                    Change Photo
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfilePhoto(reader.result as string);
                            toast.success('Profile photo updated');
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:text-red-700 hover:bg-red-50" 
                    onClick={() => {
                      setProfilePhoto(null);
                      toast.success('Profile photo removed');
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Full Name</label>
                <Input defaultValue={user?.name || ''} placeholder="Enter your full name" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Email Address</label>
                <Input defaultValue={user?.email || ''} disabled />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Phone Number</label>
                <Input placeholder="+265 888 000 000" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Job Title</label>
                <Input defaultValue="Primary Education Advisor (PEA)" />
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Email Notifications</h4>
              <div className="space-y-3">
                {[
                  { id: 'n1', label: 'New inspection reports', desc: 'Get notified when a new inspection is submitted' },
                  { id: 'n2', label: 'TPD reminders', desc: 'Reminders for upcoming teacher development sessions' },
                  { id: 'n3', label: 'System updates', desc: 'Important news about EMIS platform updates' }
                ].map(item => (
                  <label key={item.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors cursor-pointer">
                    <input type="checkbox" defaultChecked className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500" />
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{item.label}</p>
                      <p className="text-xs text-zinc-500">{item.desc}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );
      case 'security':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Password Management</h4>
              <div className="grid grid-cols-1 gap-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Current Password</label>
                  <Input 
                    type="password" 
                    value={passwords.current}
                    onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">New Password</label>
                  <Input 
                    type="password" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Confirm New Password</label>
                  <Input 
                    type="password" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                  />
                </div>
                <Button 
                  className="w-fit" 
                  onClick={() => {
                    if (!passwords.current || !passwords.new || !passwords.confirm) {
                      toast.error('Please fill all password fields');
                      return;
                    }
                    if (passwords.new !== passwords.confirm) {
                      toast.error('Passwords do not match');
                      return;
                    }
                    toast.success('Password updated successfully');
                    setPasswords({ current: '', new: '', confirm: '' });
                  }}
                >
                  Update Password
                </Button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Two-Factor Authentication</h4>
              <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center shadow-sm",
                    is2FAEnabled ? "bg-emerald-100 text-emerald-600" : "bg-white text-zinc-400"
                  )}>
                    <Smartphone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-zinc-900">SMS Authentication</p>
                    <p className="text-xs text-zinc-500">Secure your account with mobile verification</p>
                  </div>
                </div>
                <Button 
                  variant={is2FAEnabled ? "secondary" : "outline"} 
                  size="sm" 
                  onClick={() => {
                    setIs2FAEnabled(!is2FAEnabled);
                    toast.success(is2FAEnabled ? '2FA disabled' : '2FA enabled successfully');
                  }}
                >
                  {is2FAEnabled ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </div>
          </div>
        );
      case 'system':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">TDC Name</label>
                <Input value={tdcName} onChange={e => setTdcName(e.target.value)} placeholder="e.g. Lilongwe South TDC" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">District</label>
                <Input value={districtName} onChange={e => setDistrictName(e.target.value)} placeholder="e.g. Lilongwe" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Zone</label>
                <Input value={zoneName} onChange={e => setZoneName(e.target.value)} placeholder="e.g. South Zone" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Default Language</label>
                <select className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all">
                  <option>English (UK)</option>
                  <option>Chichewa</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider mb-4">Data Management</h4>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="gap-2">
                  <Database size={16} />
                  Export All Data (JSON)
                </Button>
                <Button variant="outline" className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Shield size={16} />
                  Clear Local Cache
                </Button>
              </div>
            </div>
          </div>
        );
      case 'management':
        return (
          <div className="space-y-8">
            {/* Academic Years */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Academic Years</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="2025/2026" 
                    className="w-32 h-8 text-xs" 
                    value={newYear.name}
                    onChange={e => setNewYear({...newYear, name: e.target.value})}
                  />
                  <Button size="sm" className="h-8 gap-1" onClick={handleAddYear}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {academicYears.map(year => (
                  <div key={year.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <span className="text-sm font-bold text-zinc-900">{year.name}</span>
                    {year.isCurrent && <span className="text-[10px] font-black bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">Current</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Terms */}
            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Terms</h4>
                <div className="flex gap-2 flex-wrap justify-end">
                  <select 
                    className="h-8 px-2 rounded-lg border border-zinc-200 text-xs"
                    value={newTerm.academicYearId}
                    onChange={e => setNewTerm({...newTerm, academicYearId: e.target.value})}
                  >
                    <option value="">Select Year</option>
                    {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <Input 
                    type="number" 
                    placeholder="Weeks" 
                    className="w-20 h-8 text-xs" 
                    value={newTerm.weeks}
                    onChange={e => setNewTerm({...newTerm, weeks: Number(e.target.value)})}
                  />
                  <Button size="sm" className="h-8 gap-1" onClick={handleAddTerm}>
                    <Plus size={14} /> Add Term
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {terms.map(term => {
                  const year = academicYears.find(y => y.id === term.academicYearId);
                  return (
                    <div key={term.id} className="p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-zinc-900">Term {term.number} ({year?.name})</span>
                        <span className="text-xs text-zinc-500">{term.weeks} Weeks</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Classes */}
            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Standards / Classes</h4>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Standard 1" 
                    className="w-32 h-8 text-xs" 
                    value={newClass.name}
                    onChange={e => setNewClass({...newClass, name: e.target.value})}
                  />
                  <Button size="sm" className="h-8 gap-1" onClick={handleAddClass}>
                    <Plus size={14} /> Add
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {classes.map(cls => (
                  <div key={cls.id} className="px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200">
                    {cls.name}
                  </div>
                ))}
              </div>
            </div>

            {/* School Deletion */}
            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider">Danger Zone: Schools</h4>
              <div className="space-y-3">
                {schools.map(school => (
                  <div key={school.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/30 border border-red-100">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{school.name}</p>
                      <p className="text-xs text-zinc-500">{school.emisCode}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-600 hover:bg-red-100"
                      onClick={() => handleDeleteSchool(school.id)}
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Teacher Management */}
            <div className="space-y-4 pt-6 border-t border-zinc-100">
              <h4 className="text-sm font-bold text-red-600 uppercase tracking-wider">Danger Zone: Teachers</h4>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {teachers.filter(t => t.status !== 'Deceased').map(teacher => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{teacher.firstName} {teacher.lastName}</p>
                      <p className="text-xs text-zinc-500">{teacher.employmentNumber || 'No Emp No'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 gap-1 text-zinc-600 border-zinc-200"
                        onClick={() => handleDeleteTeacher(teacher.id, true)}
                      >
                        <Skull size={14} /> Deceased
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-red-600 hover:bg-red-100"
                        onClick={() => handleDeleteTeacher(teacher.id, false)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight">Settings</h2>
          <p className="text-zinc-500 text-sm">Manage your account and system preferences</p>
        </div>
        <div className="flex items-center gap-3">
          {showSuccess && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold animate-in fade-in slide-in-from-right-4">
              <Check size={16} />
              Changes saved
            </div>
          )}
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="gap-2 min-w-[120px]"
          >
            {isSaving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id
                  ? "bg-zinc-900 text-white shadow-lg shadow-zinc-200"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <tab.icon size={18} />
              {tab.label}
            </button>
          ))}
          
          <div className="pt-4 mt-4 border-t border-zinc-100">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-600 hover:bg-red-50 transition-all"
            >
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <Card className="p-8">
            {renderTabContent()}
          </Card>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
      />
    </div>
  );
};
