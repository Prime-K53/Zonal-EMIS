import React, { useState, useEffect } from 'react';
import { 
  School, MapPin, Users, GraduationCap, Building2, BookOpen, 
  Calendar, BarChart3, Landmark, Activity, Heart, Globe, 
  FileText, History, Phone, Mail, User, Map as MapIcon,
  ChevronRight, Save, X, Plus, Trash2, Upload, Eye, ExternalLink, Copy, Check, AlertCircle,
  ExternalLink as LinkIcon, PhoneCall, Mail as MailIcon, Printer, Download, ArrowLeft,
  ClipboardCheck, CheckCircle, Clock, Search, Filter, MoreVertical, Edit2, UserPlus, Package,
  TrendingUp, Award, Accessibility, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight, AlertTriangle, Target
} from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { School as SchoolType, Teacher, Inspection, SchoolInspectionDetails, TeacherInspectionDetails, ExamAdministration, Learner, PromotionRecord, EnrollmentStats, JuniorResult, StandardisedResult, PSLCEData, Resource } from '../types';
import { cn } from '../lib/utils';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { TeacherProfile } from './TeacherProfile';

import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';


interface SchoolProfileProps {
  school: SchoolType;
  onClose: () => void;
}

type TabType = 
  | 'basic' | 'location' | 'admin' | 'learners-registry' | 'staff' 
  | 'infrastructure' | 'materials' | 'timetable' | 'performance' 
  | 'academics' | 'finance' | 'attendance' | 'health' | 'activities' 
  | 'inspections' | 'assets' | 'documents' | 'audit';

type LearnerSubTab = 'overview' | 'enrollment' | 'admission' | 'registry' | 'promotion' | 'sne' | 'statistics';
type AcademicsSubTab = 'junior' | 'standardised' | 'pslce';

export const SchoolProfile: React.FC<SchoolProfileProps> = ({ school, onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const [activeLearnerSubTab, setActiveLearnerSubTab] = useState<LearnerSubTab>('overview');
  const [activeAcademicsSubTab, setActiveAcademicsSubTab] = useState<AcademicsSubTab>('junior');
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<SchoolType>(school);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [examAdmins, setExamAdmins] = useState<ExamAdministration[]>([]);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [promotionRecords, setPromotionRecords] = useState<PromotionRecord[]>([]);
  const [enrollmentStats, setEnrollmentStats] = useState<EnrollmentStats[]>([]);
  const [juniorResults, setJuniorResults] = useState<JuniorResult[]>([]);
  const [standardisedResults, setStandardisedResults] = useState<StandardisedResult[]>([]);
  const [pslceData, setPslceData] = useState<PSLCEData[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<number>(new Date().getFullYear());
  const [selectedTerm, setSelectedTerm] = useState<number>(1);
  
  const [isJuniorFormOpen, setIsJuniorFormOpen] = useState(false);
  const [isStandardisedFormOpen, setIsStandardisedFormOpen] = useState(false);
  const [isPSLCEFormOpen, setIsPSLCEFormOpen] = useState(false);
  
  const [editingJunior, setEditingJunior] = useState<JuniorResult | null>(null);
  const [editingStandardised, setEditingStandardised] = useState<StandardisedResult | null>(null);
  const [editingPSLCE, setEditingPSLCE] = useState<PSLCEData | null>(null);

  const [juniorForm, setJuniorForm] = useState<Partial<JuniorResult>>({
    className: 'P-Klass',
    registered: { boys: 0, girls: 0 },
    sat: { boys: 0, girls: 0 },
    passed: { boys: 0, girls: 0 },
    failed: { boys: 0, girls: 0 }
  });

  const [standardisedForm, setStandardisedForm] = useState<Partial<StandardisedResult>>({
    learnerName: '',
    sex: 'M',
    className: 'Standard 5',
    scores: { CHI: 0, ENG: 0, ARTS: 0, MAT: 0, PSCI: 0, SES: 0 },
    total: 0
  });

  const [pslceForm, setPslceForm] = useState<Partial<PSLCEData>>({
    summary: {
      registered: { boys: 0, girls: 0 },
      sat: { boys: 0, girls: 0 },
      passed: { boys: 0, girls: 0 },
      failed: { boys: 0, girls: 0 },
      notSat: { boys: 0, girls: 0 }
    },
    selection: {
      national: { boys: 0, girls: 0 },
      districtBoarding: { boys: 0, girls: 0 },
      day: { boys: 0, girls: 0 },
      cdss: { boys: 0, girls: 0 }
    },
    subjectGrades: {
      CHI: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
      ENG: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
      ARTS: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
      MAT: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
      PSCI: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
      SES: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } }
    }
  });

  // Auto-calculation for Junior Results
  useEffect(() => {
    if (isJuniorFormOpen && juniorForm.sat && juniorForm.passed) {
      const failedBoys = Math.max(0, (juniorForm.sat.boys || 0) - (juniorForm.passed.boys || 0));
      const failedGirls = Math.max(0, (juniorForm.sat.girls || 0) - (juniorForm.passed.girls || 0));
      
      if (juniorForm.failed?.boys !== failedBoys || juniorForm.failed?.girls !== failedGirls) {
        setJuniorForm(prev => ({
          ...prev,
          failed: {
            boys: failedBoys,
            girls: failedGirls
          }
        }));
      }
    }
  }, [isJuniorFormOpen, juniorForm.sat?.boys, juniorForm.sat?.girls, juniorForm.passed?.boys, juniorForm.passed?.girls]);

  // Auto-calculation for Standardised Results (Total Score)
  useEffect(() => {
    if (isStandardisedFormOpen && standardisedForm.scores) {
      const total = Object.values(standardisedForm.scores).reduce((sum, score) => sum + (score || 0), 0);
      if (standardisedForm.total !== total) {
        setStandardisedForm(prev => ({ ...prev, total }));
      }
    }
  }, [isStandardisedFormOpen, standardisedForm.scores]);

  // Auto-calculation for PSLCE Data
  useEffect(() => {
    if (isPSLCEFormOpen && pslceForm.summary) {
      const summary = pslceForm.summary;
      const failedBoys = Math.max(0, (summary.sat?.boys || 0) - (summary.passed?.boys || 0));
      const failedGirls = Math.max(0, (summary.sat?.girls || 0) - (summary.passed?.girls || 0));
      const notSatBoys = Math.max(0, (summary.registered?.boys || 0) - (summary.sat?.boys || 0));
      const notSatGirls = Math.max(0, (summary.registered?.girls || 0) - (summary.sat?.girls || 0));

      if (
        summary.failed?.boys !== failedBoys || 
        summary.failed?.girls !== failedGirls ||
        summary.notSat?.boys !== notSatBoys ||
        summary.notSat?.girls !== notSatGirls
      ) {
        setPslceForm(prev => ({
          ...prev,
          summary: {
            ...prev.summary!,
            failed: { boys: failedBoys, girls: failedGirls },
            notSat: { boys: notSatBoys, girls: notSatGirls }
          }
        }));
      }
    }
  }, [
    isPSLCEFormOpen, 
    pslceForm.summary?.sat?.boys, 
    pslceForm.summary?.sat?.girls, 
    pslceForm.summary?.passed?.boys, 
    pslceForm.summary?.passed?.girls,
    pslceForm.summary?.registered?.boys,
    pslceForm.summary?.registered?.girls
  ]);

  const [isInspectionFormOpen, setIsInspectionFormOpen] = useState(false);
  const [inspectionType, setInspectionType] = useState<'School' | 'Teacher'>('School');
  const [inspectionForm, setInspectionForm] = useState<Partial<Inspection>>({
    type: 'School',
    date: new Date().toISOString().split('T')[0],
    status: 'Draft',
    score: 0,
    findings: '',
    recommendations: '',
    schoolDetails: {
      leadership: { planning: 3, governance: 3, financialManagement: 3, records: 3 },
      teachingLearning: { curriculumDelivery: 3, learnerAssessment: 3, teacherAttendance: 3 },
      learnerWelfare: { safety: 3, health: 3, inclusion: 3, discipline: 3 },
      infrastructure: { classrooms: 3, toilets: 3, water: 3, textbooks: 3 },
      community: { smcPtaInvolvement: 3 }
    },
    teacherDetails: {
      teacherId: '',
      teacherName: '',
      subject: '',
      standard: '',
      preparation: { schemeOfWork: 3, lessonPlan: 3, teachingAids: 3 },
      delivery: { introduction: 3, contentKnowledge: 3, methodology: 3, learnerEngagement: 3 },
      management: { discipline: 3, organization: 3, environment: 3 },
      assessment: { questioning: 3, feedback: 3, marking: 3 },
      professionalism: { punctuality: 3, dressCode: 3, records: 3 }
    }
  });

  // Auto-calculation for Inspection Score
  useEffect(() => {
    if (!isInspectionFormOpen) return;

    let totalScore = 0;
    let maxPossible = 0;

    if (inspectionType === 'School' && inspectionForm.schoolDetails) {
      const d = inspectionForm.schoolDetails;
      const values = [
        ...Object.values(d.leadership),
        ...Object.values(d.teachingLearning),
        ...Object.values(d.learnerWelfare),
        ...Object.values(d.infrastructure),
        ...Object.values(d.community)
      ];
      totalScore = values.reduce((a, b) => a + b, 0);
      maxPossible = values.length * 5;
    } else if (inspectionType === 'Teacher' && inspectionForm.teacherDetails) {
      const d = inspectionForm.teacherDetails;
      const values = [
        ...Object.values(d.preparation),
        ...Object.values(d.delivery),
        ...Object.values(d.management),
        ...Object.values(d.assessment),
        ...Object.values(d.professionalism)
      ];
      totalScore = values.reduce((a, b) => a + b, 0);
      maxPossible = values.length * 5;
    }

    const percentage = maxPossible > 0 ? Math.round((totalScore / maxPossible) * 100) : 0;
    if (inspectionForm.score !== percentage) {
      setInspectionForm(prev => ({ ...prev, score: percentage }));
    }
  }, [isInspectionFormOpen, inspectionType, inspectionForm.schoolDetails, inspectionForm.teacherDetails]);

  const [isUploading, setIsUploading] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [viewingInspection, setViewingInspection] = useState<Inspection | null>(null);
  const [isTeacherFormOpen, setIsTeacherFormOpen] = useState(false);
  const [isLearnerFormOpen, setIsLearnerFormOpen] = useState(false);
  const [learnerSearchTerm, setLearnerSearchTerm] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [editingLearner, setEditingLearner] = useState<Learner | null>(null);
  const [teacherToDeleteId, setTeacherToDeleteId] = useState<string | null>(null);
  const [learnerToDeleteId, setLearnerToDeleteId] = useState<string | null>(null);
  const [teacherForm, setTeacherForm] = useState<Partial<Teacher>>({
    firstName: '',
    lastName: '',
    emisCode: '',
    nationalId: '',
    gender: 'Male',
    dateOfBirth: '',
    qualification: '',
    specialization: '',
    status: 'Active'
  });

  const [learnerForm, setLearnerForm] = useState<Partial<Learner>>({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    standard: 'P-Klass',
    status: 'Active',
    isSNE: false,
    sneType: '',
    guardianName: '',
    guardianPhone: '',
    address: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  const [enrollmentForm, setEnrollmentForm] = useState<Omit<EnrollmentStats, 'id'>>({
    standard: 'P-Klass',
    academicYear: new Date().getFullYear().toString(),
    boys: 0,
    girls: 0,
    transfersIn: 0,
    transfersOut: 0,
    dropouts: 0,
    schoolId: school.id,
    createdAt: new Date().toISOString()
  });

  const [promotionForm, setPromotionForm] = useState<Omit<PromotionRecord, 'id'>>({
    standard: 'P-Klass',
    academicYear: new Date().getFullYear().toString(),
    promoted: 0,
    repeated: 0,
    droppedOut: 0,
    schoolId: school.id,
    createdAt: new Date().toISOString()
  });

  const handleInspectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    
    const inspectionData: Omit<Inspection, 'id'> = {
      schoolId: school.id,
      inspectorId: inspectionForm.inspectorId || 'System',
      date: inspectionForm.date || now.split('T')[0],
      score: inspectionForm.score || 0,
      findings: inspectionForm.findings || '',
      recommendations: inspectionForm.recommendations || '',
      status: inspectionForm.status as Inspection['status'] || 'Draft',
      photoUrls: [],
      type: inspectionType,
      schoolDetails: inspectionType === 'School' ? inspectionForm.schoolDetails as SchoolInspectionDetails : undefined,
      teacherDetails: inspectionType === 'Teacher' ? inspectionForm.teacherDetails as TeacherInspectionDetails : undefined,
    };

    try {
      if (viewingInspection) {
        await dataService.updateInspection(viewingInspection.id, inspectionData);
      } else {
        await dataService.addInspection(inspectionData);
      }
      setIsInspectionFormOpen(false);
      setViewingInspection(null);
    } catch (error) {
      console.error('Error saving inspection:', error);
    }
  };

  const handleJuniorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJunior) {
        await dataService.updateJuniorResult(editingJunior.id, juniorForm);
      } else {
        await dataService.addJuniorResult({
          ...juniorForm as Omit<JuniorResult, 'id'>,
          schoolId: school.id,
          year: selectedAcademicYear,
          term: selectedTerm,
          createdAt: new Date().toISOString()
        });
      }
      setIsJuniorFormOpen(false);
      setEditingJunior(null);
      setJuniorForm({
        className: 'P-Klass',
        registered: { boys: 0, girls: 0 },
        sat: { boys: 0, girls: 0 },
        passed: { boys: 0, girls: 0 },
        failed: { boys: 0, girls: 0 }
      });
    } catch (error) {
      console.error('Error saving junior result:', error);
    }
  };

  const handleStandardisedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total = Object.values(standardisedForm.scores || {}).reduce((a, b) => a + b, 0);
      if (editingStandardised) {
        await dataService.updateStandardisedResult(editingStandardised.id, { ...standardisedForm, total });
      } else {
        await dataService.addStandardisedResult({
          ...standardisedForm as Omit<StandardisedResult, 'id'>,
          total,
          schoolId: school.id,
          year: selectedAcademicYear,
          term: selectedTerm,
          createdAt: new Date().toISOString()
        });
      }
      setIsStandardisedFormOpen(false);
      setEditingStandardised(null);
      setStandardisedForm({
        learnerName: '',
        sex: 'M',
        className: 'Standard 5',
        scores: { CHI: 0, ENG: 0, ARTS: 0, MAT: 0, PSCI: 0, SES: 0 },
        total: 0
      });
    } catch (error) {
      console.error('Error saving standardised result:', error);
    }
  };

  const handlePSLCESubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPSLCE) {
        await dataService.updatePSLCEData(editingPSLCE.id, pslceForm);
      } else {
        await dataService.addPSLCEData({
          ...pslceForm as Omit<PSLCEData, 'id'>,
          schoolId: school.id,
          year: selectedAcademicYear,
          createdAt: new Date().toISOString()
        });
      }
      setIsPSLCEFormOpen(false);
      setEditingPSLCE(null);
      setPslceForm({
        summary: {
          registered: { boys: 0, girls: 0 },
          sat: { boys: 0, girls: 0 },
          passed: { boys: 0, girls: 0 },
          failed: { boys: 0, girls: 0 },
          notSat: { boys: 0, girls: 0 }
        },
        selection: {
          national: { boys: 0, girls: 0 },
          districtBoarding: { boys: 0, girls: 0 },
          day: { boys: 0, girls: 0 },
          cdss: { boys: 0, girls: 0 }
        },
        subjectGrades: {
          CHI: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
          ENG: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
          ARTS: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
          MAT: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
          PSCI: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } },
          SES: { A: { boys: 0, girls: 0 }, B: { boys: 0, girls: 0 }, C: { boys: 0, girls: 0 }, D: { boys: 0, girls: 0 } }
        }
      });
    } catch (error) {
      console.error('Error saving PSLCE data:', error);
    }
  };

  const handleDeleteJunior = async (id: string) => {
    try {
      await dataService.deleteJuniorResult(id);
    } catch (error) {
      console.error('Error deleting junior result:', error);
    }
  };

  const handleDeleteStandardised = async (id: string) => {
    try {
      await dataService.deleteStandardisedResult(id);
    } catch (error) {
      console.error('Error deleting standardised result:', error);
    }
  };

  const handleDeletePSLCE = async (id: string) => {
    try {
      await dataService.deletePSLCEData(id);
    } catch (error) {
      console.error('Error deleting PSLCE data:', error);
    }
  };

  useEffect(() => {
    setEditedData(school);
  }, [school]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToTeachers((allTeachers) => {
      const schoolTeachers = allTeachers.filter(t => t.schoolId === school.id);
      setTeachers(schoolTeachers);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToInspections((allInspections) => {
      const schoolInspections = allInspections.filter(i => i.schoolId === school.id);
      setInspections(schoolInspections);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToExamAdministration((allExams) => {
      const schoolExams = allExams.filter(e => e.schoolId === school.id);
      setExamAdmins(schoolExams);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToLearners((allLearners) => {
      const schoolLearners = allLearners.filter(l => l.schoolId === school.id);
      setLearners(schoolLearners);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToJuniorResults((all) => {
      setJuniorResults(all.filter(r => r.schoolId === school.id));
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToStandardisedResults((all) => {
      setStandardisedResults(all.filter(r => r.schoolId === school.id));
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToPSLCEData((all) => {
      setPslceData(all.filter(r => r.schoolId === school.id));
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToPromotionRecords((allRecords) => {
      const schoolRecords = allRecords.filter(r => r.schoolId === school.id);
      setPromotionRecords(schoolRecords);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToEnrollmentStats((allStats) => {
      const schoolStats = allStats.filter(s => s.schoolId === school.id);
      setEnrollmentStats(schoolStats);
    });
    return () => unsubscribe();
  }, [school.id]);

  useEffect(() => {
    const unsubscribe = dataService.subscribeToResources((allResources) => {
      const schoolResources = allResources.filter(r => r.schoolId === school.id);
      setResources(schoolResources);
    });
    return () => unsubscribe();
  }, [school.id]);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Resource | null>(null);
  const [assetForm, setAssetForm] = useState<Partial<Resource>>({
    name: '',
    category: 'Other',
    quantity: 0,
    condition: 'Good'
  });

  const handleAssetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAsset) {
        await dataService.updateResource(editingAsset.id, {
          ...assetForm,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await dataService.addResource({
          ...assetForm as Omit<Resource, 'id'>,
          schoolId: school.id,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        });
      }
      setIsAssetModalOpen(false);
      setEditingAsset(null);
      setAssetForm({ name: '', category: 'Other', quantity: 0, condition: 'Good' });
    } catch (error) {
      console.error('Error saving asset:', error);
    }
  };

  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const generateAISummary = async () => {
    setIsGeneratingAI(true);
    try {
      const enrollment = school.enrollment?.total || 0;
      const teacherCount = teachers.length;
      const ratio = teacherCount > 0 ? Math.round(enrollment / teacherCount) : 0;
      const avgScore = inspections.length > 0
        ? (inspections.reduce((acc: number, i: any) => acc + i.score, 0) / inspections.length).toFixed(1)
        : 'N/A';
      const recentInspection = inspections[0];
      const inspectionStatus = recentInspection ? recentInspection.status : 'No inspections recorded';

      const academicNote = examAdmins.length > 0
        ? `${examAdmins.length} examination record(s) on file. Review the Academics tab for detailed pass rate analysis.`
        : 'No examination records are currently on file.';
      const staffingNote = ratio > 40
        ? '⚠️ Student-teacher ratio exceeds the recommended 40:1. Additional staffing may be needed.'
        : ratio > 0 ? '✅ Staffing levels are within acceptable range.' : 'Staffing data is incomplete.';
      const scoreNum = parseFloat(avgScore as string);
      const inspectionNote = !isNaN(scoreNum) && scoreNum < 60
        ? '⚠️ Below-average inspection score. Targeted support is recommended.'
        : (!isNaN(scoreNum) && scoreNum >= 75 ? '✅ Good inspection performance.' : '');
      const recommendations: string[] = [];
      if (ratio > 40) recommendations.push('- **Priority:** Request additional teacher deployment to reduce student-teacher ratio.');
      if (!isNaN(scoreNum) && scoreNum < 60) recommendations.push('- **Priority:** Schedule follow-up inspection and provide pedagogical support.');
      if (enrollment === 0) recommendations.push('- Update enrollment data to enable complete analysis.');
      recommendations.push('- Ensure all infrastructure and resource data is kept current in the system.');

      const summary = [
        `## School Summary: ${school.name}`,
        '',
        '**Overview**',
        `${school.name} is a ${school.type} school with a current enrollment of **${enrollment.toLocaleString()} students** served by **${teacherCount} teachers** (${ratio}:1 student-teacher ratio).`,
        '',
        '**Academic Performance**',
        academicNote,
        '',
        '**Staffing**',
        staffingNote,
        '',
        '**Inspection Status**',
        `Average inspection score: **${avgScore}**. Most recent status: **${inspectionStatus}**.`,
        inspectionNote,
        '',
        '**Strategic Recommendations**',
        ...recommendations,
      ].join('\n');

      setAiSummary(summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      setAiSummary("Error generating summary. Please try again later.");
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: School },
    { id: 'location', label: 'Location & Access', icon: MapPin },
    { id: 'admin', label: 'Administration', icon: User },
    { id: 'learners-registry', label: 'Learners Registry', icon: Users },
    { id: 'staff', label: 'Staff / Teachers', icon: GraduationCap },
    { id: 'infrastructure', label: 'Infrastructure', icon: Building2 },
    { id: 'assets', label: 'School Assets', icon: Package },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'performance', label: 'Performance', icon: BarChart3 },
    { id: 'academics', label: 'Academics', icon: ClipboardCheck },
    { id: 'finance', label: 'Finance', icon: Landmark },
    { id: 'attendance', label: 'Attendance', icon: Activity },
    { id: 'health', label: 'Health & Sanitation', icon: Heart },
    { id: 'activities', label: 'Programs', icon: Globe },
    { id: 'inspections', label: 'Inspections', icon: ClipboardCheck },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'audit', label: 'Audit & History', icon: History },
  ];

  const handleSave = async () => {
    try {
      const changeLogEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString(),
        user: user?.email || 'Unknown User',
        action: `Updated ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} information`,
        type: 'Update'
      };

      const updatedAudit = {
        ...editedData.audit,
        changeLog: [changeLogEntry, ...(editedData.audit?.changeLog || [])].slice(0, 50)
      };

      const finalData = {
        ...editedData,
        audit: updatedAudit
      };

      await dataService.updateSchool(school.id, finalData);
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating school profile:', error);
    }
  };

  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTeacher) {
        await dataService.updateTeacher(editingTeacher.id, teacherForm);
      } else {
        await dataService.addTeacher({
          ...teacherForm,
          schoolId: school.id,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as any);
      }
      setIsTeacherFormOpen(false);
      setEditingTeacher(null);
      setTeacherForm({
        firstName: '',
        lastName: '',
        emisCode: '',
        nationalId: '',
        gender: 'Male',
        dateOfBirth: '',
        qualification: '',
        specialization: '',
        status: 'Active'
      });
    } catch (error) {
      console.error('Error saving teacher:', error);
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await dataService.deleteTeacher(teacherId);
      setTeacherToDeleteId(null);
    } catch (error) {
      console.error('Error deleting teacher:', error);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    try {
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newDoc = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.includes('pdf') ? 'Legal' : file.type.includes('sheet') ? 'Finance' : 'Other',
        url: '#',
        uploadDate: new Date().toISOString().split('T')[0],
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        status: 'Pending'
      };

      const updatedDocs = [...(school.documents || []), newDoc];
      
      const changeLogEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString(),
        user: user?.email || 'Unknown User',
        action: `Uploaded document: ${file.name}`,
        type: 'Upload'
      };

      const updatedAudit = {
        ...school.audit,
        changeLog: [changeLogEntry, ...(school.audit?.changeLog || [])].slice(0, 50)
      };

      await dataService.updateSchool(school.id, { 
        documents: updatedDocs as any,
        audit: updatedAudit as any
      });
    } catch (error) {
      console.error('Error uploading document:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      const docToDelete = school.documents?.find(d => d.id === docId);
      const updatedDocs = (school.documents || []).filter(d => d.id !== docId);
      
      const changeLogEntry = {
        id: crypto.randomUUID(),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleTimeString(),
        user: user?.email || 'Unknown User',
        action: `Deleted document: ${docToDelete?.name || 'Unknown'}`,
        type: 'Delete'
      };

      const updatedAudit = {
        ...school.audit,
        changeLog: [changeLogEntry, ...(school.audit?.changeLog || [])].slice(0, 50)
      };

      await dataService.updateSchool(school.id, { 
        documents: updatedDocs as any,
        audit: updatedAudit as any
      });
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (selectedTeacherId) {
    return (
      <div className="fixed inset-0 z-[60] bg-white overflow-y-auto p-6 custom-scrollbar">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button 
            variant="ghost" 
            className="gap-2 -ml-2 text-zinc-600 hover:text-zinc-900"
            onClick={() => setSelectedTeacherId(null)}
          >
            <ArrowLeft size={18} />
            Back to School Profile
          </Button>
          <TeacherProfile teacherId={selectedTeacherId} />
        </div>
      </div>
    );
  }

  const renderBasicInfo = () => {
    const fields = [
      { label: 'School Name', value: school.name, icon: School },
      { label: 'EMIS Code', value: school.emisCode, icon: FileText, mono: true },
      { label: 'School Type', value: school.type, icon: Building2 },
      { label: 'Ownership', value: school.ownership, icon: Landmark },
      { label: 'Year Established', value: school.yearEstablished, icon: Calendar },
    ];

    const filledFields = fields.filter(f => f.value).length + (school.registrationStatus ? 1 : 0);
    const completeness = Math.round((filledFields / 6) * 100);

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-900 text-white space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Teachers</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black">{teachers.length}</span>
              <Users size={20} className="text-emerald-400" />
            </div>
            <p className="text-[10px] text-zinc-500 font-serif italic">Live Staff Count</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Total Enrollment</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-zinc-900">
                {enrollmentStats.length > 0 ? enrollmentStats[enrollmentStats.length - 1].boys + enrollmentStats[enrollmentStats.length - 1].girls : (school.enrollment?.total || 0)}
              </span>
              <GraduationCap size={20} className="text-blue-500" />
            </div>
            <p className="text-[10px] text-zinc-500 font-serif italic">Learner Registry</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Latest Inspection</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-zinc-900">
                {inspections.length > 0 ? inspections[0].score : 'N/A'}
              </span>
              <Award size={20} className={cn(inspections.length > 0 && inspections[0].score >= 75 ? "text-emerald-500" : "text-amber-500")} />
            </div>
            <p className="text-[10px] text-zinc-500 font-serif italic">Quality Grade</p>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-zinc-100 shadow-sm space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Resource Health</p>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-zinc-900">
                {resources.length > 0 ? Math.round((resources.filter(r => r.condition === 'Good').length / resources.length) * 100) : 100}%
              </span>
              <Package size={20} className="text-purple-500" />
            </div>
            <p className="text-[10px] text-zinc-500 font-serif italic">Asset Condition</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-zinc-200">
              <p className="text-xs font-bold text-zinc-500 uppercase">Teacher Ratio</p>
              <p className="text-xl font-black text-zinc-900">1:{school.enrollment?.total && teachers.length > 0 ? Math.round(school.enrollment.total / teachers.length) : '0'}</p>
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Profile Completeness</h3>
              <p className="text-xs text-zinc-500 mt-1">Basic information accuracy score.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-2xl font-bold text-emerald-600">{completeness}%</span>
            </div>
            <div className="w-32 h-2 bg-zinc-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500" 
                style={{ width: `${completeness}%` }} 
              />
            </div>
          </div>
        </div>

        {/* AI Summary Section */}
        <div className="p-6 rounded-2xl bg-indigo-50 border border-indigo-100 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Target size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider">AI Performance Summary</h3>
                <p className="text-xs text-indigo-600 mt-1">AI-generated overview based on current data.</p>
              </div>
            </div>
            <Button 
              onClick={generateAISummary} 
              disabled={isGeneratingAI}
              variant="outline"
              className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2"
            >
              {isGeneratingAI ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </div>
              ) : (
                <>
                  <TrendingUp size={16} />
                  Generate Summary
                </>
              )}
            </Button>
          </div>

          {aiSummary && (
            <div className="p-4 bg-white rounded-xl border border-indigo-100 text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {aiSummary}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <School size={14} className="text-zinc-400" />
                School Name
              </label>
              {isEditing ? (
                <Input value={editedData.name} onChange={e => setEditedData({...editedData, name: e.target.value})} />
              ) : (
                <p className="text-xl font-bold text-zinc-900">{school.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <FileText size={14} className="text-zinc-400" />
                EMIS Code
              </label>
              {isEditing ? (
                <Input value={editedData.emisCode} onChange={e => setEditedData({...editedData, emisCode: e.target.value})} />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-mono font-medium text-zinc-700 bg-zinc-100 px-2 py-1 rounded">{school.emisCode}</p>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(school.emisCode);
                      // Add toast notification if available
                    }}
                    className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors"
                  >
                    <Copy size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Building2 size={14} className="text-zinc-400" />
                  School Type
                </label>
                  {isEditing ? (
                    <div className="space-y-4">
                      <select 
                        className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                        value={editedData.type ?? "Primary"}
                        onChange={e => setEditedData({...editedData, type: e.target.value as any})}
                      >
                        <option value="Primary">Primary</option>
                        <option value="Secondary">Secondary</option>
                        <option value="CDSS">CDSS</option>
                        <option value="Private">Private</option>
                      </select>

                      {editedData.type === 'Primary' && (
                        <div className="space-y-4 pl-4 border-l-2 border-emerald-100 animate-in slide-in-from-left-2 duration-200">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase">Primary Category</label>
                            <select 
                              className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                              value={editedData.primarySubCategory || ''}
                              onChange={e => setEditedData({...editedData, primarySubCategory: e.target.value as any})}
                            >
                              <option value="">Select Category...</option>
                              <option value="Full Primary">Full Primary School</option>
                              <option value="Junior Primary">Junior Primary School</option>
                            </select>
                          </div>

                          {editedData.primarySubCategory === 'Junior Primary' && (
                            <div className="space-y-2 animate-in slide-in-from-left-2 duration-200">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase">Class Range</label>
                              <select 
                                className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                                value={editedData.juniorPrimaryRange || ''}
                                onChange={e => setEditedData({...editedData, juniorPrimaryRange: e.target.value as any})}
                              >
                                <option value="">Select Range...</option>
                                <option value="Standard 1-4">Standard 1 to 4</option>
                                <option value="Standard 1-7">Standard 1 to 7</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-zinc-700">{school.type}</p>
                      {school.type === 'Primary' && school.primarySubCategory && (
                        <p className="text-xs text-zinc-500">
                          {school.primarySubCategory}
                          {school.primarySubCategory === 'Junior Primary' && school.juniorPrimaryRange && ` (${school.juniorPrimaryRange})`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Landmark size={14} className="text-zinc-400" />
                Ownership
              </label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.ownership ?? "Government"}
                    onChange={e => setEditedData({...editedData, ownership: e.target.value as any})}
                  >
                    <option value="Government">Government</option>
                    <option value="Grant-aided">Grant-aided</option>
                    <option value="Private">Private</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.ownership}</p>
                )}
              </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Target size={14} className="text-zinc-400" />
                School Motto
              </label>
              {isEditing ? (
                <Input value={editedData.motto || ''} onChange={e => setEditedData({...editedData, motto: e.target.value})} placeholder="e.g. Education for Service" />
              ) : (
                <p className="text-sm font-medium text-zinc-700 italic">"{school.motto || 'No motto defined'}"</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Eye size={14} className="text-zinc-400" />
                Vision Statement
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[80px]"
                  value={editedData.vision || ''} 
                  onChange={e => setEditedData({...editedData, vision: e.target.value})}
                  placeholder="The school's long-term vision..."
                />
              ) : (
                <p className="text-sm text-zinc-600 leading-relaxed">{school.vision || 'No vision statement defined'}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Target size={14} className="text-zinc-400" />
                Mission Statement
              </label>
              {isEditing ? (
                <textarea 
                  className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none min-h-[80px]"
                  value={editedData.mission || ''} 
                  onChange={e => setEditedData({...editedData, mission: e.target.value})}
                  placeholder="The school's mission..."
                />
              ) : (
                <p className="text-sm text-zinc-600 leading-relaxed">{school.mission || 'No mission statement defined'}</p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                <Activity size={14} className="text-zinc-400" />
                Core Values
              </label>
              {isEditing ? (
                <Input 
                  value={Array.isArray(editedData.coreValues) ? editedData.coreValues.join(', ') : ''} 
                  onChange={e => setEditedData({...editedData, coreValues: e.target.value.split(',').map(v => v.trim()).filter(v => v !== '')})} 
                  placeholder="e.g. Integrity, Excellence, Discipline" 
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Array.isArray(school.coreValues) && school.coreValues.length > 0 ? (
                    school.coreValues.map((value, idx) => (
                      <span key={idx} className="px-2 py-1 bg-zinc-100 text-zinc-600 text-[10px] font-bold rounded uppercase tracking-wider">
                        {value}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-zinc-400 italic">No core values defined</span>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Calendar size={14} className="text-zinc-400" />
                  Year Established
                </label>
                {isEditing ? (
                  <Input type="number" value={editedData.yearEstablished} onChange={e => setEditedData({...editedData, yearEstablished: parseInt(e.target.value)})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.yearEstablished}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <FileText size={14} className="text-zinc-400" />
                  MOE Registration No.
                </label>
                {isEditing ? (
                  <Input value={editedData.moeRegistrationNumber || ''} onChange={e => setEditedData({...editedData, moeRegistrationNumber: e.target.value})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.moeRegistrationNumber || 'N/A'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Check size={14} className="text-zinc-400" />
                  Registration Status
                </label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.registrationStatus}
                    onChange={e => setEditedData({...editedData, registrationStatus: e.target.value as any})}
                  >
                    <option value="Registered">Registered</option>
                    <option value="Pending">Pending</option>
                    <option value="Not Registered">Not Registered</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      school.registrationStatus === 'Registered' ? "bg-emerald-100 text-emerald-700" :
                      school.registrationStatus === 'Pending' ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {school.registrationStatus}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center gap-2">
                  <Landmark size={14} className="text-zinc-400" />
                  Religious Affiliation
                </label>
                {isEditing ? (
                  <Input value={editedData.religiousAffiliation || ''} onChange={e => setEditedData({...editedData, religiousAffiliation: e.target.value})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.religiousAffiliation || 'None'}</p>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex gap-3">
              <AlertCircle size={18} className="text-blue-500 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-900 uppercase">System Note</p>
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Basic school information is synchronized with the national EMIS database. 
                  Changes may require official verification.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLocation = () => {
    const googleMapsUrl = school.location?.latitude && school.location?.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${school.location?.latitude},${school.location?.longitude}`
      : null;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Administrative Hierarchy */}
          <div className="md:col-span-2 space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <MapIcon size={16} className="text-zinc-400" />
              Administrative Hierarchy
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">District</label>
                {isEditing ? (
                  <Input value={editedData.location?.district} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), district: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.district || school.district}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Zone</label>
                {isEditing ? (
                  <Input value={editedData.location?.zone} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), zone: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.zone || school.zone}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">TDC</label>
                {isEditing ? (
                  <Input value={editedData.location?.tdc} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), tdc: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.tdc || school.tdc}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Distance to DEM (km)</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.distanceToDEM} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), distanceToDEM: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.distanceToDEM || 'N/A'} km</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Distance to Cluster Lead (km)</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.distanceToClusterLead} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), distanceToClusterLead: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.distanceToClusterLead || 'N/A'} km</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nearest Health Facility</label>
                {isEditing ? (
                  <Input value={editedData.location?.nearestHealthFacility} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), nearestHealthFacility: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.nearestHealthFacility || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Dist. to Health Facility (km)</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.distanceToHealthFacility} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), distanceToHealthFacility: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.distanceToHealthFacility || 'N/A'} km</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nearest Police Station</label>
                {isEditing ? (
                  <Input value={editedData.location?.nearestPoliceStation} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), nearestPoliceStation: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.nearestPoliceStation || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Dist. to Police Station (km)</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.distanceToPoliceStation} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), distanceToPoliceStation: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.distanceToPoliceStation || 'N/A'} km</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Road Access Type</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.location?.roadAccessType || ''}
                    onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), roadAccessType: e.target.value}})}
                  >
                    <option value="">Select Type</option>
                    <option value="Tarmac">Tarmac</option>
                    <option value="All-weather Gravel">All-weather Gravel</option>
                    <option value="Earth Road">Earth Road</option>
                    <option value="Footpath Only">Footpath Only</option>
                  </select>
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.roadAccessType || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Nearest Trading Center</label>
                {isEditing ? (
                  <Input value={editedData.location?.nearestTradingCenter || ''} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), nearestTradingCenter: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.nearestTradingCenter || 'N/A'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">GPS Latitude</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.latitude || ''} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), latitude: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-mono text-zinc-700">{school.location?.latitude || 'N/A'}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">GPS Longitude</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.longitude || ''} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), longitude: parseFloat(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-mono text-zinc-700">{school.location?.longitude || 'N/A'}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-zinc-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Traditional Authority (TA)</label>
                {isEditing ? (
                  <Input value={editedData.location?.traditionalAuthority} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), traditionalAuthority: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.traditionalAuthority || school.traditionalAuthority}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Physical Address</label>
                {isEditing ? (
                  <Input value={editedData.location?.physicalAddress} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), physicalAddress: e.target.value}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.physicalAddress || school.physicalAddress}</p>
                )}
              </div>
            </div>
          </div>

          {/* GPS & Map */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-zinc-400" />
              GPS Coordinates
            </h3>

            <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Latitude</label>
                  {isEditing ? (
                    <Input type="number" step="any" value={editedData.location?.latitude} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), latitude: parseFloat(e.target.value)}})} />
                  ) : (
                    <p className="text-sm font-mono font-medium text-zinc-700">{school.location?.latitude || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Longitude</label>
                  {isEditing ? (
                    <Input type="number" step="any" value={editedData.location?.longitude} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), longitude: parseFloat(e.target.value)}})} />
                  ) : (
                    <p className="text-sm font-mono font-medium text-zinc-700">{school.location?.longitude || 'N/A'}</p>
                  )}
                </div>
              </div>

              {googleMapsUrl && (
                <a 
                  href={googleMapsUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors"
                >
                  <LinkIcon size={14} />
                  View on Google Maps
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Accessibility */}
        <div className="pt-8 border-t border-zinc-100 space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-zinc-400" />
            Accessibility & Infrastructure
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Road Type</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.location?.accessibility?.roadType || ''}
                    onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), accessibility: {...(editedData.location?.accessibility || {}), roadType: e.target.value}}})}
                  >
                    <option value="Tarmac">Tarmac</option>
                    <option value="Gravel">Gravel</option>
                    <option value="Earth">Earth</option>
                    <option value="Seasonal">Seasonal</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                      school.location?.accessibility?.roadType === 'Tarmac' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-700"
                    )}>
                      {school.location?.accessibility?.roadType || 'N/A'}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Distance from Main Road (km)</label>
                {isEditing ? (
                  <Input type="number" value={editedData.location?.accessibility?.distanceFromMainRoad} onChange={e => setEditedData({...editedData, location: {...(editedData.location || {}), accessibility: {...(editedData.location?.accessibility || {}), distanceFromMainRoad: parseFloat(e.target.value)}}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.location?.accessibility?.distanceFromMainRoad || 0} km</p>
                )}
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-amber-50 border border-amber-100">
              <div className="flex gap-4">
                <div className="p-2 bg-amber-100 rounded-lg h-fit">
                  <AlertCircle size={20} className="text-amber-600" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-amber-900">Accessibility Note</p>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    Schools with 'Earth' or 'Seasonal' road types may experience access challenges during the rainy season. 
                    This affects delivery of materials and inspection visits.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAdmin = () => {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Headteacher */}
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-zinc-400" />
                Headteacher
              </h4>
              {!isEditing && (
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded uppercase">Active</span>
              )}
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</label>
                {isEditing ? (
                  <Input value={editedData.administration?.headteacher?.name} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, headteacher: {...editedData.administration.headteacher, name: e.target.value}}})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{school.administration?.headteacher?.name || 'Not Assigned'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <PhoneCall size={10} />
                    Phone
                  </label>
                  {isEditing ? (
                    <Input value={editedData.administration?.headteacher?.phone} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, headteacher: {...editedData.administration.headteacher, phone: e.target.value}}})} />
                  ) : (
                    <p className="text-sm text-zinc-700">{school.administration?.headteacher?.phone || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <MailIcon size={10} />
                    Email
                  </label>
                  {isEditing ? (
                    <Input value={editedData.administration?.headteacher?.email} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, headteacher: {...editedData.administration.headteacher, email: e.target.value}}})} />
                  ) : (
                    <p className="text-sm text-zinc-700 truncate">{school.administration?.headteacher?.email || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Deputy Headteacher */}
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-zinc-400" />
                Deputy Headteacher
              </h4>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Full Name</label>
                {isEditing ? (
                  <Input value={editedData.administration?.deputyHeadteacher?.name} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, deputyHeadteacher: {...editedData.administration.deputyHeadteacher, name: e.target.value}}})} />
                ) : (
                  <p className="text-sm font-bold text-zinc-900">{school.administration?.deputyHeadteacher?.name || 'Not Assigned'}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <PhoneCall size={10} />
                    Phone
                  </label>
                  {isEditing ? (
                    <Input value={editedData.administration?.deputyHeadteacher?.phone} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, deputyHeadteacher: {...editedData.administration.deputyHeadteacher, phone: e.target.value}}})} />
                  ) : (
                    <p className="text-sm text-zinc-700">{school.administration?.deputyHeadteacher?.phone || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase flex items-center gap-1">
                    <MailIcon size={10} />
                    Email
                  </label>
                  {isEditing ? (
                    <Input value={editedData.administration?.deputyHeadteacher?.email} onChange={e => setEditedData({...editedData, administration: {...editedData.administration, deputyHeadteacher: {...editedData.administration.deputyHeadteacher, email: e.target.value}}})} />
                  ) : (
                    <p className="text-sm text-zinc-700 truncate">{school.administration?.deputyHeadteacher?.email || 'N/A'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Governance & Representation */}
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Users size={16} className="text-zinc-400" />
            Governance & Representation
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase">Board of Governors (Secondary)</label>
              {isEditing ? (
                <textarea 
                  className="w-full min-h-[120px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                  placeholder="List members and their roles..."
                  value={editedData.administration?.boardOfGovernors}
                  onChange={e => setEditedData({...editedData, administration: {...editedData.administration, boardOfGovernors: e.target.value}})}
                />
              ) : (
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{school.administration?.boardOfGovernors || 'No information provided.'}</p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase">SMC / PTA Committee</label>
              {isEditing ? (
                <textarea 
                  className="w-full min-h-[120px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                  placeholder="List members and their roles..."
                  value={editedData.administration?.smc_pta}
                  onChange={e => setEditedData({...editedData, administration: {...editedData.administration, smc_pta: e.target.value}})}
                />
              ) : (
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{school.administration?.smc_pta || 'No information provided.'}</p>
              )}
            </div>

            <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
              <label className="text-xs font-bold text-zinc-500 uppercase">Student Council / Prefects</label>
              {isEditing ? (
                <textarea 
                  className="w-full min-h-[120px] rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                  placeholder="List student leaders..."
                  value={editedData.administration?.studentCouncil}
                  onChange={e => setEditedData({...editedData, administration: {...editedData.administration, studentCouncil: e.target.value}})}
                />
              ) : (
                <p className="text-sm text-zinc-700 whitespace-pre-wrap leading-relaxed">{school.administration?.studentCouncil || 'No information provided.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const handleLearnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingLearner) {
        await dataService.updateLearner(editingLearner.id, learnerForm);
      } else {
        await dataService.addLearner({
          ...learnerForm as Omit<Learner, 'id'>,
          schoolId: school.id,
          isAdmission: learnerForm.isAdmission || activeLearnerSubTab === 'admission'
        });
      }
      setIsLearnerFormOpen(false);
      setEditingLearner(null);
      setLearnerForm({
        firstName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '',
        standard: 'P-Klass',
        status: 'Active',
        isAdmission: false,
        isSNE: false,
        sneType: '',
        guardianName: '',
        guardianPhone: '',
        address: '',
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error saving learner:', error);
    }
  };

  const handleEnrollmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addEnrollmentStats(enrollmentForm);
      setEnrollmentForm({
        standard: 'P-Klass',
        academicYear: new Date().getFullYear().toString(),
        boys: 0,
        girls: 0,
        transfersIn: 0,
        transfersOut: 0,
        dropouts: 0,
        schoolId: school.id,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving enrollment stats:', error);
    }
  };

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dataService.addPromotionRecord(promotionForm);
      setPromotionForm({
        standard: 'P-Klass',
        academicYear: new Date().getFullYear().toString(),
        promoted: 0,
        repeated: 0,
        droppedOut: 0,
        schoolId: school.id,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error saving promotion record:', error);
    }
  };

  const renderLearnersRegistry = () => {
    const subTabs: { id: LearnerSubTab; label: string; icon: any }[] = [
      { id: 'overview', label: 'Overview', icon: PieChart },
      { id: 'enrollment', label: 'Enrollment', icon: Users },
      { id: 'admission', label: 'Admission', icon: UserPlus },
      { id: 'registry', label: 'Registry', icon: FileText },
      { id: 'promotion', label: 'Promotion', icon: TrendingUp },
      { id: 'sne', label: 'SNE Learners', icon: Accessibility },
      { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    ];

    const renderSubTabContent = () => {
      switch (activeLearnerSubTab) {
        case 'overview':
          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-emerald-50 border-emerald-100">
                  <p className="text-[10px] font-bold text-emerald-600 uppercase">Total Learners</p>
                  <p className="text-2xl font-black text-emerald-900">{learners.length}</p>
                </Card>
                <Card className="p-4 bg-blue-50 border-blue-100">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">Boys</p>
                  <p className="text-2xl font-black text-blue-900">{learners.filter(l => l.gender === 'Male').length}</p>
                </Card>
                <Card className="p-4 bg-pink-50 border-pink-100">
                  <p className="text-[10px] font-bold text-pink-600 uppercase">Girls</p>
                  <p className="text-2xl font-black text-pink-900">{learners.filter(l => l.gender === 'Female').length}</p>
                </Card>
                <Card className="p-4 bg-amber-50 border-amber-100">
                  <p className="text-[10px] font-bold text-amber-600 uppercase">SNE Learners</p>
                  <p className="text-2xl font-black text-amber-900">{learners.filter(l => l.isSNE).length}</p>
                </Card>
                <Card className="p-4 bg-indigo-50 border-indigo-100">
                  <p className="text-[10px] font-bold text-indigo-600 uppercase">New Admissions</p>
                  <p className="text-2xl font-black text-indigo-900">
                    {learners.filter(l => {
                      const admissionDate = l.admissionDate ? new Date(l.admissionDate) : null;
                      const currentYear = new Date().getFullYear();
                      return admissionDate && admissionDate.getFullYear() === currentYear;
                    }).length}
                  </p>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Standard Distribution</h4>
                  <div className="space-y-4">
                    {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(standard => {
                      const count = learners.filter(l => l.standard === standard).length;
                      const percentage = learners.length > 0 ? (count / learners.length) * 100 : 0;
                      return (
                        <div key={standard} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold">
                            <span>{standard}</span>
                            <span>{count}</span>
                          </div>
                          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-4">Gender Distribution</h4>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Boys', value: learners.filter(l => l.gender === 'Male').length },
                            { name: 'Girls', value: learners.filter(l => l.gender === 'Female').length }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#ec4899" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          );
        case 'enrollment':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 uppercase">Enrollment Data (Numerical)</h4>
              </div>
              
              <Card className="p-6 bg-zinc-50 border-zinc-200">
                <form onSubmit={handleEnrollmentSubmit} className="grid grid-cols-2 md:grid-cols-6 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Standard</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={enrollmentForm.standard}
                      onChange={e => setEnrollmentForm({...enrollmentForm, standard: e.target.value})}
                    >
                      {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Boys</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={enrollmentForm.boys}
                      onChange={e => setEnrollmentForm({...enrollmentForm, boys: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Girls</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={enrollmentForm.girls}
                      onChange={e => setEnrollmentForm({...enrollmentForm, girls: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Transfers In</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={enrollmentForm.transfersIn}
                      onChange={e => setEnrollmentForm({...enrollmentForm, transfersIn: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Transfers Out</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={enrollmentForm.transfersOut}
                      onChange={e => setEnrollmentForm({...enrollmentForm, transfersOut: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-emerald-600 text-white h-9">
                    <Save size={14} className="mr-2" />
                    Save
                  </Button>
                </form>
              </Card>

              <div className="overflow-x-auto rounded-xl border border-zinc-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Boys</th>
                      <th className="px-4 py-3">Girls</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3">Transfers In</th>
                      <th className="px-4 py-3">Transfers Out</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(standard => {
                      const stats = enrollmentStats.find(s => s.standard === standard && s.academicYear === enrollmentForm.academicYear);
                      return (
                        <tr key={standard}>
                          <td className="px-4 py-3 font-bold">{standard}</td>
                          <td className="px-4 py-3">{stats?.boys || 0}</td>
                          <td className="px-4 py-3">{stats?.girls || 0}</td>
                          <td className="px-4 py-3 font-bold">{(stats?.boys || 0) + (stats?.girls || 0)}</td>
                          <td className="px-4 py-3">{stats?.transfersIn || 0}</td>
                          <td className="px-4 py-3">{stats?.transfersOut || 0}</td>
                          <td className="px-4 py-3 text-right">
                            {stats && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-600"
                                onClick={() => dataService.deleteEnrollmentStats(stats.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        case 'admission':
        case 'registry':
        case 'sne':
          const filteredLearners = learners.filter(l => {
            const matchesSearch = (l.firstName + ' ' + l.lastName).toLowerCase().includes(learnerSearchTerm.toLowerCase());
            if (activeLearnerSubTab === 'sne') return l.isSNE && matchesSearch;
            if (activeLearnerSubTab === 'admission') return l.isAdmission && matchesSearch;
            if (activeLearnerSubTab === 'registry') return !l.isAdmission && matchesSearch;
            return matchesSearch;
          });

          const handleExportLearners = () => {
            const dataToExport = filteredLearners.map(l => ({
              'First Name': l.firstName,
              'Last Name': l.lastName,
              'Gender': l.gender,
              'Date of Birth': l.dateOfBirth,
              'Standard': l.standard,
              'Guardian Name': l.guardianName,
              'Guardian Phone': l.guardianPhone,
              'Address': l.address,
              'Enrollment Date': l.enrollmentDate,
              'Is SNE': l.isSNE ? 'Yes' : 'No',
              'SNE Type': l.sneType || ''
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Learners");
            XLSX.writeFile(wb, `Learners_${activeLearnerSubTab}_${school.name}.xlsx`);
          };

          const handleImportLearners = (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (evt) => {
              const bstr = evt.target?.result;
              const wb = XLSX.read(bstr, { type: 'binary' });
              const wsname = wb.SheetNames[0];
              const ws = wb.Sheets[wsname];
              const data = XLSX.utils.sheet_to_json(ws) as any[];

              const newLearners = data.map(row => ({
                schoolId: school.id,
                firstName: row['First Name'] || '',
                lastName: row['Last Name'] || '',
                gender: (row['Gender'] === 'Female' ? 'Female' : 'Male') as 'Male' | 'Female',
                dateOfBirth: row['Date of Birth'] || '',
                standard: row['Standard'] || 'P-Klass',
                status: 'Active' as const,
                isAdmission: activeLearnerSubTab === 'admission',
                isSNE: row['Is SNE'] === 'Yes',
                sneType: row['SNE Type'] || '',
                guardianName: row['Guardian Name'] || '',
                guardianPhone: row['Guardian Phone'] || '',
                address: row['Address'] || '',
                enrollmentDate: row['Enrollment Date'] || new Date().toISOString().split('T')[0]
              }));

              for (const learner of newLearners) {
                await dataService.addLearner(learner);
              }
              alert(`Successfully imported ${newLearners.length} learners.`);
            };
            reader.readAsBinaryString(file);
          };

          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 uppercase">
                    {activeLearnerSubTab === 'admission' ? 'New Admissions' : 
                     activeLearnerSubTab === 'registry' ? 'Learner Registry' : 'SNE Learners'}
                  </h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Manage individual learner profiles and records.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
                    <Input 
                      placeholder="Search learners..." 
                      className="pl-9 h-9 text-xs w-64 bg-zinc-50 border-zinc-200"
                      value={learnerSearchTerm}
                      onChange={e => setLearnerSearchTerm(e.target.value)}
                    />
                  </div>
                  {(activeLearnerSubTab === 'admission' || activeLearnerSubTab === 'registry') && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 h-9"
                        onClick={handleExportLearners}
                      >
                        <Download size={14} />
                        Export
                      </Button>
                      <div className="relative">
                        <input 
                          type="file" 
                          id="learner-import" 
                          className="hidden" 
                          accept=".xlsx, .xls, .csv"
                          onChange={handleImportLearners}
                        />
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="gap-2 h-9"
                          onClick={() => document.getElementById('learner-import')?.click()}
                        >
                          <Upload size={14} />
                          Import
                        </Button>
                      </div>
                    </>
                  )}
                  <Button 
                    size="sm" 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    onClick={() => {
                      setEditingLearner(null);
                      setLearnerForm({
                        firstName: '',
                        lastName: '',
                        gender: 'Male',
                        dateOfBirth: '',
                        standard: 'P-Klass',
                        status: 'Active',
                        isAdmission: activeLearnerSubTab === 'admission',
                        isSNE: activeLearnerSubTab === 'sne',
                        sneType: '',
                        guardianName: '',
                        guardianPhone: '',
                        address: '',
                        enrollmentDate: new Date().toISOString().split('T')[0]
                      });
                      setIsLearnerFormOpen(true);
                    }}
                  >
                    <UserPlus size={14} />
                    Add Learner
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {filteredLearners.length === 0 ? (
                  <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                    <Users size={48} className="text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-500 font-medium">No learners found in this section.</p>
                  </div>
                ) : (
                  filteredLearners.map(learner => (
                    <Card key={learner.id} className="p-4 hover:border-emerald-500 transition-all group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold text-xs">
                            {learner.firstName[0]}{learner.lastName[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{learner.firstName} {learner.lastName}</p>
                            <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-medium">
                              <span>{learner.gender}</span>
                              <span className="text-zinc-300">•</span>
                              <span>{learner.standard}</span>
                              {learner.isSNE && (
                                <>
                                  <span className="text-zinc-300">•</span>
                                  <span className="text-amber-600 font-bold uppercase tracking-tighter flex items-center gap-1">
                                    <Accessibility size={10} />
                                    SNE: {learner.sneType}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setEditingLearner(learner);
                              setLearnerForm(learner);
                              setIsLearnerFormOpen(true);
                            }}
                          >
                            <Edit2 size={14} className="text-zinc-400" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 hover:text-red-600"
                            onClick={async () => {
                              if (confirm('Are you sure you want to delete this learner?')) {
                                await dataService.deleteLearner(learner.id);
                              }
                            }}
                          >
                            <Trash2 size={14} className="text-zinc-400" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        case 'promotion':
          return (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 uppercase">Promotion Records (Numerical)</h4>
                  <p className="text-[10px] text-zinc-500 font-medium">Track student progression across academic years.</p>
                </div>
              </div>

              <Card className="p-6 bg-zinc-50 border-zinc-200">
                <form onSubmit={handlePromotionSubmit} className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Standard</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={promotionForm.standard}
                      onChange={e => setPromotionForm({...promotionForm, standard: e.target.value})}
                    >
                      {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Promoted</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={promotionForm.promoted}
                      onChange={e => setPromotionForm({...promotionForm, promoted: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Repeated</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={promotionForm.repeated}
                      onChange={e => setPromotionForm({...promotionForm, repeated: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Dropped Out</label>
                    <Input 
                      type="number" 
                      className="h-9 text-xs" 
                      value={promotionForm.droppedOut}
                      onChange={e => setPromotionForm({...promotionForm, droppedOut: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <Button type="submit" size="sm" className="bg-emerald-600 text-white h-9">
                    <Save size={14} className="mr-2" />
                    Save
                  </Button>
                </form>
              </Card>

              <div className="overflow-x-auto rounded-xl border border-zinc-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Standard</th>
                      <th className="px-4 py-3">Promoted</th>
                      <th className="px-4 py-3">Repeated</th>
                      <th className="px-4 py-3">Dropped Out</th>
                      <th className="px-4 py-3">Total</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(standard => {
                      const record = promotionRecords.find(r => r.standard === standard && r.academicYear === promotionForm.academicYear);
                      return (
                        <tr key={standard}>
                          <td className="px-4 py-3 font-bold">{standard}</td>
                          <td className="px-4 py-3">{record?.promoted || 0}</td>
                          <td className="px-4 py-3">{record?.repeated || 0}</td>
                          <td className="px-4 py-3">{record?.droppedOut || 0}</td>
                          <td className="px-4 py-3 font-bold">{(record?.promoted || 0) + (record?.repeated || 0) + (record?.droppedOut || 0)}</td>
                          <td className="px-4 py-3 text-right">
                            {record && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-7 w-7 p-0 text-red-600"
                                onClick={() => dataService.deletePromotionRecord(record.id)}
                              >
                                <Trash2 size={12} />
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        case 'statistics':
          const totalBoys = enrollmentStats.reduce((acc, s) => acc + (s.boys || 0), 0);
          const totalGirls = enrollmentStats.reduce((acc, s) => acc + (s.girls || 0), 0);
          const gpi = totalBoys > 0 ? (totalGirls / totalBoys).toFixed(2) : '0.00';
          
          const totalPromoted = promotionRecords.reduce((acc, r) => acc + (r.promoted || 0), 0);
          const totalRepeated = promotionRecords.reduce((acc, r) => acc + (r.repeated || 0), 0);
          const totalDropped = promotionRecords.reduce((acc, r) => acc + (r.droppedOut || 0), 0);
          const totalPromotionBase = totalPromoted + totalRepeated + totalDropped;
          
          const promotionRate = totalPromotionBase > 0 ? ((totalPromoted / totalPromotionBase) * 100).toFixed(1) : '0.0';
          const dropoutRate = totalPromotionBase > 0 ? ((totalDropped / totalPromotionBase) * 100).toFixed(1) : '0.0';
          const repetitionRate = totalPromotionBase > 0 ? ((totalRepeated / totalPromotionBase) * 100).toFixed(1) : '0.0';

          return (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">Enrollment Growth</h4>
                  <div className="h-48 flex items-end gap-2">
                    {[45, 52, 48, 61, 55, 67, 72].map((val, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full bg-emerald-500/20 rounded-t-lg relative group" style={{ height: `${val}%` }}>
                          <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            {val}%
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-400">202{i}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">Gender Parity Index</h4>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-2xl font-black text-zinc-900">{gpi}</p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase",
                          parseFloat(gpi) >= 0.95 ? "text-emerald-600" : "text-amber-600"
                        )}>
                          {parseFloat(gpi) >= 0.95 ? "Near Parity" : "Gender Gap"}
                        </p>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <Award size={24} />
                      </div>
                    </div>
                    <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                      <p className="text-[10px] text-zinc-500 leading-relaxed">
                        The Gender Parity Index (GPI) measures the relative access to education of males and females. A value of 1 indicates perfect equality.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              <Card className="p-6">
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-6">Key Performance Indicators</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Retention Rate</p>
                    <p className="text-xl font-bold text-zinc-900">{(100 - parseFloat(dropoutRate)).toFixed(1)}%</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <ArrowUpRight size={12} />
                      Stable
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Dropout Rate</p>
                    <p className="text-xl font-bold text-zinc-900">{dropoutRate}%</p>
                    <div className="flex items-center gap-1 text-[10px] text-red-600 font-bold">
                      <ArrowDownRight size={12} />
                      Target: &lt;2%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Promotion Rate</p>
                    <p className="text-xl font-bold text-zinc-900">{promotionRate}%</p>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                      <ArrowUpRight size={12} />
                      Target: &gt;90%
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase">Repetition Rate</p>
                    <p className="text-xl font-bold text-zinc-900">{repetitionRate}%</p>
                    <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold">
                      <ArrowDownRight size={12} />
                      Target: &lt;5%
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 bg-emerald-50 border-emerald-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
                      <TrendingUp size={18} />
                    </div>
                    <h5 className="text-xs font-bold text-emerald-900 uppercase">Retention Strategy</h5>
                  </div>
                  <p className="text-[10px] text-emerald-700 leading-relaxed">
                    Current retention is at {(100 - parseFloat(dropoutRate)).toFixed(1)}%. Focus on early warning systems for at-risk learners to maintain target levels.
                  </p>
                </Card>
                <Card className="p-6 bg-amber-50 border-amber-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-amber-500 flex items-center justify-center text-white">
                      <AlertTriangle size={18} />
                    </div>
                    <h5 className="text-xs font-bold text-amber-900 uppercase">Dropout Alert</h5>
                  </div>
                  <p className="text-[10px] text-amber-700 leading-relaxed">
                    Dropout rate is {dropoutRate}%. Grade-specific interventions recommended for grades with rates exceeding 5%.
                  </p>
                </Card>
                <Card className="p-6 bg-blue-50 border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-blue-500 flex items-center justify-center text-white">
                      <Target size={18} />
                    </div>
                    <h5 className="text-xs font-bold text-blue-900 uppercase">Promotion Goal</h5>
                  </div>
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    Aiming for {promotionRate}% promotion rate. Remedial classes for repeaters can help improve overall progression.
                  </p>
                </Card>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div className="space-y-8">
        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl overflow-x-auto no-scrollbar">
          {subTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveLearnerSubTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                activeLearnerSubTab === tab.id
                  ? "bg-white text-emerald-600 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sub-tab Content */}
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {renderSubTabContent()}
        </div>
      </div>
    );
  };

  const renderStaff = () => {
    const totalTeachers = school.staff?.totalTeachers || 0;
    const qualifiedTeachers = school.staff?.qualifiedTeachers || 0;
    const totalStudents = school.enrollment?.total || 0;
    const ptr = totalTeachers > 0 ? Math.round(totalStudents / totalTeachers) : 0;
    const qualificationRate = totalTeachers > 0 ? Math.round((qualifiedTeachers / totalTeachers) * 100) : 0;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Staff Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Teachers</p>
              <p className="text-lg font-bold text-zinc-900">{totalTeachers}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Qualified</p>
              <p className="text-lg font-bold text-zinc-900">{qualifiedTeachers} ({qualificationRate}%)</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">PTR</p>
              <p className={cn(
                "text-lg font-bold",
                ptr > 60 ? "text-red-600" : ptr > 40 ? "text-amber-600" : "text-emerald-600"
              )}>{ptr}:1</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <School size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Support Staff</p>
              <p className="text-lg font-bold text-zinc-900">{school.staff?.supportStaff?.total || 0}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staff Distribution & Ranks */}
          <div className="lg:col-span-1 space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Activity size={16} className="text-zinc-400" />
                Staff Distribution
              </h3>
              <div className="space-y-3 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Teacher Distribution (by Standard/Subject)</label>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., Std 1: 2, Std 2: 2, Science: 3..."
                      value={editedData.staff?.distribution}
                      onChange={e => setEditedData({...editedData, staff: {...editedData.staff, distribution: e.target.value}})}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                      {school.staff?.distribution || 'No distribution data recorded.'}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Teacher Ranks (Grade Distribution)</label>
                  {isEditing ? (
                    <textarea 
                      className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                      placeholder="e.g., Grade I: 5, Grade J: 3, Grade K: 2..."
                      value={editedData.staff?.teacherRanks}
                      onChange={e => setEditedData({...editedData, staff: {...editedData.staff, teacherRanks: e.target.value}})}
                    />
                  ) : (
                    <p className="text-sm text-zinc-600 leading-relaxed bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                      {school.staff?.teacherRanks || 'No rank data recorded.'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <School size={16} className="text-zinc-400" />
                Housing & Commuting
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Teachers Housed</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.teachersHoused} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, teachersHoused: parseInt(e.target.value)}})} />
                  ) : (
                    <p className="text-lg font-bold text-zinc-900">{school.staff?.teachersHoused || 0}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Commuting</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.teachersCommuting} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, teachersCommuting: parseInt(e.target.value)}})} />
                  ) : (
                    <p className="text-lg font-bold text-zinc-900">{school.staff?.teachersCommuting || 0}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-zinc-400" />
                Support Staff Details
              </h3>
              <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Clerks</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.supportStaff?.clerks} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, supportStaff: {...editedData.staff.supportStaff, clerks: parseInt(e.target.value)}}})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-700">{school.staff?.supportStaff?.clerks || 0}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Guards</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.supportStaff?.guards} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, supportStaff: {...editedData.staff.supportStaff, guards: parseInt(e.target.value)}}})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-700">{school.staff?.supportStaff?.guards || 0}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Groundskeepers</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.supportStaff?.groundskeepers} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, supportStaff: {...editedData.staff.supportStaff, groundskeepers: parseInt(e.target.value)}}})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-700">{school.staff?.supportStaff?.groundskeepers || 0}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">Others</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.staff?.supportStaff?.others} onChange={e => setEditedData({...editedData, staff: {...editedData.staff, supportStaff: {...editedData.staff.supportStaff, others: parseInt(e.target.value)}}})} />
                  ) : (
                    <p className="text-sm font-bold text-zinc-700">{school.staff?.supportStaff?.others || 0}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Teacher Registry */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-zinc-400" />
                Teacher Registry
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 h-9"
                  onClick={() => {
                    const dataToExport = teachers.map(t => ({
                      'First Name': t.firstName,
                      'Last Name': t.lastName,
                      'Gender': t.gender,
                      'Employment Number': t.employmentNumber || '',
                      'Qualification': t.qualification || '',
                      'Responsibility': t.responsibility || 'Teacher',
                      'Status': t.status || 'Active'
                    }));
                    const ws = XLSX.utils.json_to_sheet(dataToExport);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Teachers");
                    XLSX.writeFile(wb, `Teachers_${school.name}.xlsx`);
                  }}
                >
                  <Download size={14} />
                  Export
                </Button>
                <div className="relative">
                  <input 
                    type="file" 
                    id="teacher-import" 
                    className="hidden" 
                    accept=".xlsx, .xls, .csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        const bstr = evt.target?.result;
                        const wb = XLSX.read(bstr, { type: 'binary' });
                        const wsname = wb.SheetNames[0];
                        const ws = wb.Sheets[wsname];
                        const data = XLSX.utils.sheet_to_json(ws) as any[];
                        const newTeachers = data.map(row => ({
                          schoolId: school.id,
                          emisCode: school.emisCode,
                          firstName: row['First Name'] || '',
                          lastName: row['Last Name'] || '',
                          gender: (row['Gender'] === 'Female' ? 'Female' : row['Gender'] === 'Other' ? 'Other' : 'Male') as 'Male' | 'Female' | 'Other',
                          employmentNumber: row['Employment Number'] || '',
                          qualification: row['Qualification'] || '',
                          specialization: row['Specialization'] || '',
                          status: 'Active' as const,
                          nationalId: row['National ID'] || '',
                          dateOfBirth: row['Date of Birth'] || '',
                          subjects: [],
                          classes: [],
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }));
                        for (const teacher of newTeachers) {
                          await dataService.addTeacher(teacher);
                        }
                        alert(`Successfully imported ${newTeachers.length} teachers.`);
                      };
                      reader.readAsBinaryString(file);
                    }}
                  />
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2 h-9"
                    onClick={() => document.getElementById('teacher-import')?.click()}
                  >
                    <Upload size={14} />
                    Import
                  </Button>
                </div>
                <Button 
                  size="sm" 
                  className="bg-zinc-900 text-white hover:bg-zinc-800 gap-2"
                  onClick={() => {
                    setEditingTeacher(null);
                    setTeacherForm({
                      id: '',
                      emisCode: school.emisCode,
                      firstName: '',
                      lastName: '',
                      gender: 'Male',
                      dateOfBirth: '',
                      qualification: '',
                      specialization: '',
                      schoolId: school.id,
                      status: 'Active',
                      nationalId: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    });
                    setIsTeacherFormOpen(true);
                  }}
                >
                  <Plus size={14} />
                  Add Teacher
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
              <div className="divide-y divide-zinc-50">
                {teachers.length > 0 ? (
                  teachers.map((teacher) => (
                    <div key={teacher.id} className="p-4 hover:bg-zinc-50 transition-colors flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-lg group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                          {teacher.firstName[0]}{teacher.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-zinc-900">{teacher.firstName} {teacher.lastName}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{teacher.gender}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase">{teacher.qualification}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-200" />
                            <span className={cn(
                              "text-[10px] font-bold uppercase px-1.5 py-0.5 rounded",
                              teacher.status === 'Active' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                            )}>
                              {teacher.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-blue-600"
                          onClick={() => setSelectedTeacherId(teacher.id)}
                          title="View Profile"
                        >
                          <Eye size={14} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-zinc-400 hover:text-zinc-900"
                          onClick={() => {
                            setEditingTeacher(teacher);
                            setTeacherForm(teacher);
                            setIsTeacherFormOpen(true);
                          }}
                          title="Edit Teacher"
                        >
                          <Save size={14} />
                        </Button>
                        {teacherToDeleteId === teacher.id ? (
                          <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-[10px] font-bold text-red-600 hover:bg-red-50"
                              onClick={() => handleDeleteTeacher(teacher.id)}
                            >
                              Confirm
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-2 text-[10px] font-bold text-zinc-400"
                              onClick={() => setTeacherToDeleteId(null)}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-zinc-400 hover:text-red-600"
                            onClick={() => setTeacherToDeleteId(teacher.id)}
                            title="Delete Teacher"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                      <Users size={24} className="text-zinc-300" />
                    </div>
                    <p className="text-xs text-zinc-400 italic">No teachers assigned to this school yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInfrastructure = () => {
    const totalToilets = (school.infrastructure?.toiletsBoys || 0) + (school.infrastructure?.toiletsGirls || 0);
    const studentToToiletRatio = school.enrollment?.total > 0 && totalToilets > 0 ? Math.round(school.enrollment.total / totalToilets) : 0;

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Infrastructure Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Classrooms</p>
              <Building2 size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{school.infrastructure?.classrooms || 0}</p>
              <p className="text-[10px] font-medium text-zinc-500">Condition: {school.infrastructure?.condition || 'Not specified'}</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Sanitation Ratio</p>
              <Activity size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className={cn(
                "text-3xl font-bold",
                studentToToiletRatio > 60 ? "text-red-600" : studentToToiletRatio > 40 ? "text-amber-600" : "text-emerald-600"
              )}>{studentToToiletRatio > 0 ? `${studentToToiletRatio}:1` : 'N/A'}</p>
              <p className="text-[10px] font-medium text-zinc-500">Students per toilet</p>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Staff Housing</p>
              <School size={16} className="text-zinc-400" />
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-zinc-900">{school.infrastructure?.staffHouses || 0}</p>
              <p className="text-[10px] font-medium text-zinc-500">Units available</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Buildings & Facilities */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={16} className="text-zinc-400" />
              Buildings & Facilities
            </h3>
            
            <div className="grid grid-cols-2 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Total Classrooms</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.classrooms} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, classrooms: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.classrooms || 0}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Total Staff Houses</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.staffHouses} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, staffHouses: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.staffHouses || 0}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Permanent</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.classroomsPermanent} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, classroomsPermanent: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.classroomsPermanent || 0}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Temporary</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.classroomsTemporary} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, classroomsTemporary: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.classroomsTemporary || 0}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Open Air</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.classroomsOpenAir} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, classroomsOpenAir: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.classroomsOpenAir || 0}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Houses in Good Condition</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.housesGood} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, housesGood: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.housesGood || 0}</p>
                )}
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase">Houses Dilapidated</label>
                {isEditing ? (
                  <Input type="number" value={editedData.infrastructure?.housesDilapidated} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, housesDilapidated: parseInt(e.target.value)}})} />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.housesDilapidated || 0}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Specialized Rooms & Facilities</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Library', key: 'hasLibrary' },
                  { label: 'Laboratory', key: 'hasLaboratory' },
                  { label: 'ICT Room', key: 'hasICTRoom' },
                  { label: 'Electricity', key: 'hasElectricity' },
                  { label: 'Internet', key: 'hasInternet' },
                  { label: 'Fence', key: 'hasFence' },
                  { label: 'Playground', key: 'hasPlayground' },
                  { label: 'Kitchen', key: 'hasKitchen' }
                ].map(facility => (
                  <div key={facility.key} className="flex items-center justify-between p-3 rounded-xl bg-white border border-zinc-100 shadow-sm hover:border-blue-200 transition-colors">
                    <span className="text-xs font-medium text-zinc-600">{facility.label}</span>
                    {isEditing ? (
                      <input 
                        type="checkbox" 
                        className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-900"
                        checked={(editedData.infrastructure as any)?.[facility.key]}
                        onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, [facility.key]: e.target.checked}})}
                      />
                    ) : (
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        (school.infrastructure as any)?.[facility.key] ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-300"
                      )} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase">Power Source</label>
              {isEditing ? (
                <select 
                  className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                  value={editedData.infrastructure?.powerSource}
                  onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, powerSource: e.target.value as any}})}
                >
                  <option value="None">None</option>
                  <option value="ESCOM">ESCOM</option>
                  <option value="Solar">Solar</option>
                  <option value="Generator">Generator</option>
                </select>
              ) : (
                <p className="text-sm font-medium text-zinc-700 bg-white p-3 rounded-xl border border-zinc-100 shadow-sm">{school.infrastructure?.powerSource || 'None'}</p>
              )}
            </div>
          </div>

          {/* Sanitation & Water */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Heart size={16} className="text-zinc-400" />
              Sanitation & Water
            </h3>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Boys</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.infrastructure?.toiletsBoys} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, toiletsBoys: parseInt(e.target.value)}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.toiletsBoys || 0}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Girls</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.infrastructure?.toiletsGirls} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, toiletsGirls: parseInt(e.target.value)}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.toiletsGirls || 0}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Teachers</label>
                  {isEditing ? (
                    <Input type="number" value={editedData.infrastructure?.toiletsTeachers} onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, toiletsTeachers: parseInt(e.target.value)}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.infrastructure?.toiletsTeachers || 0}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Water Source</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={editedData.infrastructure?.waterSource}
                    onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, waterSource: e.target.value}})}
                  >
                    <option value="Borehole">Borehole</option>
                    <option value="Piped">Piped Water</option>
                    <option value="Well">Protected Well</option>
                    <option value="None">None</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-2 text-sm font-medium text-zinc-700 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                    <Globe size={14} className="text-blue-500" />
                    {school.infrastructure?.waterSource || 'Not specified'}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <h4 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">Maintenance & Condition</h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Overall Condition</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={editedData.infrastructure?.condition}
                    onChange={e => setEditedData({...editedData, infrastructure: {...editedData.infrastructure, condition: e.target.value as any}})}
                  >
                    <option value="Excellent">Excellent</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                    <option value="Dilapidated">Dilapidated</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase",
                      school.infrastructure?.condition === 'Excellent' ? "bg-emerald-100 text-emerald-700" :
                      school.infrastructure?.condition === 'Good' ? "bg-blue-100 text-blue-700" :
                      school.infrastructure?.condition === 'Fair' ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {school.infrastructure?.condition || 'Not specified'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAssets = () => {
    const categories: Resource['category'][] = [
      'Electronics', 'Computers', 'Printers', 'Textbooks', 'Library Books', 
      'Furniture', 'Lab Equipment', 'Sports Equipment', 'Other'
    ];

    const assetsByCategory = categories.reduce((acc, cat) => {
      acc[cat] = resources.filter(r => r.category === cat);
      return acc;
    }, {} as Record<string, Resource[]>);

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">School Assets & Inventory</h3>
            <p className="text-sm text-zinc-500">Manage and track all school equipment and materials</p>
          </div>
          <Button 
            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
            onClick={() => {
              setEditingAsset(null);
              setAssetForm({ name: '', category: 'Other', quantity: 0, condition: 'Good' });
              setIsAssetModalOpen(true);
            }}
          >
            <Plus size={18} />
            Record New Asset
          </Button>
        </div>

        {/* Aggregation Overview for this school */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">ICT & Electronics</p>
            <p className="text-2xl font-bold text-zinc-900">
              {resources.filter(r => ['Electronics', 'Computers', 'Printers'].includes(r.category)).reduce((sum, r) => sum + r.quantity, 0)}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Books & Materials</p>
            <p className="text-2xl font-bold text-zinc-900">
              {resources.filter(r => ['Textbooks', 'Library Books'].includes(r.category)).reduce((sum, r) => sum + r.quantity, 0)}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Furniture Units</p>
            <p className="text-2xl font-bold text-zinc-900">
              {resources.filter(r => r.category === 'Furniture').reduce((sum, r) => sum + r.quantity, 0)}
            </p>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-100">
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Total Items</p>
            <p className="text-2xl font-bold text-zinc-900">
              {resources.reduce((sum, r) => sum + r.quantity, 0)}
            </p>
          </Card>
        </div>

        <div className="space-y-6">
          {categories.map(category => {
            const categoryAssets = assetsByCategory[category];
            if (!categoryAssets || categoryAssets.length === 0) return null;

            return (
              <div key={category} className="space-y-4">
                <h4 className="text-sm font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-2">
                  <Package size={14} className="text-zinc-400" />
                  {category}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryAssets.map(asset => (
                    <Card key={asset.id} className="p-4 hover:border-emerald-500 transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div className="h-8 w-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-500">
                          <Package size={16} />
                        </div>
                        <div className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold border",
                          asset.condition === 'Good' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                          asset.condition === 'Fair' ? "bg-amber-50 text-amber-700 border-amber-100" :
                          "bg-red-50 text-red-700 border-red-100"
                        )}>
                          {asset.condition}
                        </div>
                      </div>
                      <h5 className="font-bold text-zinc-900">{asset.name}</h5>
                      <div className="mt-4 flex items-center justify-between text-sm">
                        <span className="text-zinc-500 font-medium">Qty: {asset.quantity}</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingAsset(asset);
                              setAssetForm(asset);
                              setIsAssetModalOpen(true);
                            }}
                            className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={async () => {
                              if (window.confirm(`Delete ${asset.name}?`)) {
                                await dataService.deleteResource(asset.id);
                              }
                            }}
                            className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Asset Modal */}
        {isAssetModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">{editingAsset ? 'Edit Asset' : 'Record New Asset'}</h2>
                  <p className="text-xs text-zinc-500">Update school inventory details</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsAssetModalOpen(false)} className="h-8 w-8 p-0">
                  <X size={18} />
                </Button>
              </div>
              
              <form onSubmit={handleAssetSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Asset Name</label>
                  <Input 
                    required
                    placeholder="e.g., Dell Latitude Laptop"
                    value={assetForm.name}
                    onChange={e => setAssetForm({...assetForm, name: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Category</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={assetForm.category}
                      onChange={e => setAssetForm({...assetForm, category: e.target.value as any})}
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Condition</label>
                    <select 
                      className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={assetForm.condition}
                      onChange={e => setAssetForm({...assetForm, condition: e.target.value as any})}
                    >
                      <option value="Good">Good</option>
                      <option value="Fair">Fair</option>
                      <option value="Poor">Poor</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantity</label>
                  <Input 
                    type="number"
                    min="1"
                    required
                    value={assetForm.quantity}
                    onChange={e => setAssetForm({...assetForm, quantity: parseInt(e.target.value) || 0})}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-zinc-100 mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAssetModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 px-8">
                    {editingAsset ? 'Update Asset' : 'Save Asset'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    );
  };

  const renderTimetable = () => {
    const totalHours = 7; // Mock calculation or from data
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Daily Hours</p>
              <p className="text-lg font-bold text-zinc-900">{totalHours} Hours</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <History size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Shift Type</p>
              <p className="text-lg font-bold text-zinc-900">{school.timetable?.sessionType || 'Single Shift'}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Term Status</p>
              <p className="text-lg font-bold text-zinc-900">In Session</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Schedule</p>
              <p className="text-lg font-bold text-zinc-900">Active</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Academic Calendar & Schedule */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Calendar size={16} className="text-zinc-400" />
              Academic Calendar
            </h3>
            
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Current Term / Calendar Details</label>
                  {isEditing ? (
                    <Input 
                      value={editedData.timetable?.calendar || ''} 
                      onChange={e => setEditedData({...editedData, timetable: {...editedData.timetable, calendar: e.target.value}})} 
                      placeholder="e.g., Term 1: Jan - April, Term 2: May - Aug..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                      {school.timetable?.calendar || 'Standard Academic Calendar (Jan - Dec)'}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">School Start Time</label>
                    {isEditing ? (
                      <Input 
                        value={editedData.timetable?.startTime || '07:30'} 
                        onChange={e => setEditedData({...editedData, timetable: {...editedData.timetable, startTime: e.target.value}})} 
                      />
                    ) : (
                      <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        {school.timetable?.startTime || '07:30'}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">School End Time</label>
                    {isEditing ? (
                      <Input 
                        value={editedData.timetable?.endTime || '14:30'} 
                        onChange={e => setEditedData({...editedData, timetable: {...editedData.timetable, endTime: e.target.value}})} 
                      />
                    ) : (
                      <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                        {school.timetable?.endTime || '14:30'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-zinc-400" />
              Session Management
            </h3>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Shift Configuration</label>
                {isEditing ? (
                  <select 
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.timetable?.sessionType || 'Single Shift'}
                    onChange={e => setEditedData({...editedData, timetable: {...editedData.timetable, sessionType: e.target.value}})}
                  >
                    <option value="Single Shift">Single Shift</option>
                    <option value="Double Shift">Double Shift (Morning/Afternoon)</option>
                    <option value="Overlapping">Overlapping Sessions</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      school.timetable?.sessionType === 'Double Shift' ? "bg-amber-500" : "bg-emerald-500"
                    )} />
                    <p className="text-sm font-medium text-zinc-700">{school.timetable?.sessionType || 'Single Shift'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Daily Schedule (Break & Assembly)</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="e.g., Assembly: 07:30-07:45, Break: 10:30-11:00..."
                    value={editedData.timetable?.dailySchedule}
                    onChange={e => setEditedData({...editedData, timetable: {...editedData.timetable, dailySchedule: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-600 whitespace-pre-line leading-relaxed">
                      {school.timetable?.dailySchedule || 'No specific break times defined.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformance = () => {
    const passRate = school.performance?.passRate || 0;
    const trend = school.performance?.trend || 'Stable';
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Performance Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={cn(
            "p-4 flex items-center gap-4",
            passRate >= 75 ? "bg-emerald-50 border-emerald-100" : 
            passRate >= 50 ? "bg-amber-50 border-amber-100" : "bg-rose-50 border-rose-100"
          )}>
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              passRate >= 75 ? "bg-emerald-100 text-emerald-600" : 
              passRate >= 50 ? "bg-amber-100 text-amber-600" : "bg-rose-100 text-rose-600"
            )}>
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Pass Rate</p>
              <p className="text-lg font-bold text-zinc-900">{passRate}%</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">National Rank</p>
              <p className="text-lg font-bold text-zinc-900">{school.performance?.nationalRank || 'N/A'}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Trend</p>
              <p className="text-lg font-bold text-zinc-900">{trend}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <GraduationCap size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Top Subject</p>
              <p className="text-lg font-bold text-zinc-900 truncate max-w-[100px]">{school.performance?.topSubjects?.split(',')[0] || 'N/A'}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Academic Results */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <GraduationCap size={16} className="text-zinc-400" />
              Academic Results
            </h3>
            
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Overall Pass Rate (%)</label>
                  {isEditing ? (
                    <Input 
                      type="number" 
                      value={editedData.performance?.passRate} 
                      onChange={e => setEditedData({...editedData, performance: {...editedData.performance, passRate: parseInt(e.target.value)}})} 
                    />
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-bold text-zinc-900">{passRate}%</p>
                      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            passRate >= 75 ? "bg-emerald-500" : passRate >= 50 ? "bg-amber-500" : "bg-rose-500"
                          )}
                          style={{ width: `${passRate}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">National Exam Grade</label>
                  {isEditing ? (
                    <Input 
                      value={editedData.performance?.nationalExamResults || ''} 
                      onChange={e => setEditedData({...editedData, performance: {...editedData.performance, nationalExamResults: e.target.value}})} 
                    />
                  ) : (
                    <p className="text-sm font-bold text-zinc-900 bg-zinc-50 p-3 rounded-xl border border-zinc-100">
                      {school.performance?.nationalExamResults || 'N/A'}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">PSLCE (Std 8)</label>
                  {isEditing ? (
                    <Input value={editedData.performance?.pslceResults || ''} onChange={e => setEditedData({...editedData, performance: {...editedData.performance, pslceResults: e.target.value}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.performance?.pslceResults || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">JCE (Form 2)</label>
                  {isEditing ? (
                    <Input value={editedData.performance?.jceResults || ''} onChange={e => setEditedData({...editedData, performance: {...editedData.performance, jceResults: e.target.value}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.performance?.jceResults || 'N/A'}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase">MSCE (Form 4)</label>
                  {isEditing ? (
                    <Input value={editedData.performance?.msceResults || ''} onChange={e => setEditedData({...editedData, performance: {...editedData.performance, msceResults: e.target.value}})} />
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.performance?.msceResults || 'N/A'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Top Performing Subjects</label>
                {isEditing ? (
                  <Input 
                    placeholder="e.g., Mathematics, English, Science"
                    value={editedData.performance?.topSubjects || ''} 
                    onChange={e => setEditedData({...editedData, performance: {...editedData.performance, topSubjects: e.target.value}})} 
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {school.performance?.topSubjects ? (
                      school.performance.topSubjects.split(',').map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium border border-blue-100">
                          {s.trim()}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 italic">No top subjects recorded</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Performance Trend Analysis */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Activity size={16} className="text-zinc-400" />
              Trend Analysis
            </h3>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Performance Trend</label>
                {isEditing ? (
                  <select 
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    value={editedData.performance?.trend || 'Stable'}
                    onChange={e => setEditedData({...editedData, performance: {...editedData.performance, trend: e.target.value}})}
                  >
                    <option value="Improving">Improving</option>
                    <option value="Stable">Stable</option>
                    <option value="Declining">Declining</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      trend === 'Improving' ? "bg-emerald-500" : trend === 'Declining' ? "bg-rose-500" : "bg-blue-500"
                    )} />
                    <p className="text-sm font-medium text-zinc-700">{trend}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Performance Comments</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="Provide context for performance trends..."
                    value={editedData.performance?.comments || ''}
                    onChange={e => setEditedData({...editedData, performance: {...editedData.performance, comments: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-600 leading-relaxed italic">
                      {school.performance?.comments || 'No comments available.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinance = () => {
    const isPrivate = school.type === 'Private';
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Finance Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Landmark size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">SIG Status</p>
              <p className="text-lg font-bold text-zinc-900">{school.finance?.sigStatus || 'N/A'}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Audit</p>
              <p className="text-lg font-bold text-zinc-900">{school.finance?.auditStatus || 'N/A'}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Utilization</p>
              <p className="text-lg font-bold text-zinc-900">{school.finance?.budgetUtilization || 0}%</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Check size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Assets</p>
              <p className="text-lg font-bold text-zinc-900">{school.finance?.assets ? 'Listed' : 'None'}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Funding Sources */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Landmark size={16} className="text-zinc-400" />
              Funding & Grants
            </h3>
            
            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Primary Funding Source</label>
                {isEditing ? (
                  <Input 
                    value={editedData.finance?.fundingSources || ''} 
                    onChange={e => setEditedData({...editedData, finance: {...editedData.finance, fundingSources: e.target.value}})} 
                  />
                ) : (
                  <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    {school.finance?.fundingSources || 'N/A'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Other Grants & Support</label>
                {isEditing ? (
                  <Input 
                    value={editedData.finance?.otherGrants || ''} 
                    onChange={e => setEditedData({...editedData, finance: {...editedData.finance, otherGrants: e.target.value}})} 
                  />
                ) : (
                  <p className="text-sm font-medium text-zinc-700 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    {school.finance?.otherGrants || 'None recorded'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Community Contributions</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[80px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="e.g., Bricks for classrooms, Labor for fencing..."
                    value={editedData.finance?.communityContributions || ''}
                    onChange={e => setEditedData({...editedData, finance: {...editedData.finance, communityContributions: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-600 italic">
                      {school.finance?.communityContributions || 'No community contributions recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Financial Management */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              Financial Management
            </h3>

            <div className="space-y-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Income/Expenditure Status</label>
                {isEditing ? (
                  <Input 
                    value={editedData.finance?.incomeExpenditure || ''} 
                    onChange={e => setEditedData({...editedData, finance: {...editedData.finance, incomeExpenditure: e.target.value}})} 
                  />
                ) : (
                  <div className="flex items-center gap-3 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      school.finance?.incomeExpenditure === 'Balanced' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <p className="text-sm font-medium text-zinc-700">{school.finance?.incomeExpenditure || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Major School Assets</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                    placeholder="List major assets..."
                    value={editedData.finance?.assets || ''}
                    onChange={e => setEditedData({...editedData, finance: {...editedData.finance, assets: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {school.finance?.assets || 'No assets recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SIG Budget Utilization Details */}
        <div className="mt-8 space-y-6">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
            <Activity size={16} className="text-zinc-400" />
            SIG Budget Utilization Details
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Desks repaired', key: 'desksRepaired' },
              { label: 'Classrooms maintained', key: 'classroomsMaintained' },
              { label: 'Staff houses maintained', key: 'teachersHousesMaintained' },
              { label: 'Toilets maintained', key: 'toiletsMaintained' },
              { label: 'Textbooks purchased', key: 'textbooksPurchased' },
              { label: 'Learners supported', key: 'learnersTokens' },
              { label: 'OVCs supported', key: 'ovcsSupported' },
              { label: 'Teachers supported', key: 'teachersTokens' },
              { label: 'Electrification works', key: 'infrastructureElectrified' },
              { label: 'WASH/Boreholes repaired', key: 'washBoreholesRepaired' },
            ].map((item) => (
              <div key={item.key} className="space-y-2 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">{item.label}</label>
                {isEditing ? (
                  <Input 
                    type="number"
                    value={editedData.finance?.sigBudgetUtilization?.[item.key as keyof NonNullable<typeof editedData.finance.sigBudgetUtilization>] || 0} 
                    onChange={e => {
                      const val = parseInt(e.target.value) || 0;
                      setEditedData({
                        ...editedData, 
                        finance: {
                          ...editedData.finance, 
                          sigBudgetUtilization: {
                            ...(editedData.finance?.sigBudgetUtilization || {}),
                            [item.key]: val
                          }
                        }
                      });
                    }} 
                    className="h-8 text-sm"
                  />
                ) : (
                  <p className="text-lg font-bold text-zinc-900">
                    {school.finance?.sigBudgetUtilization?.[item.key as keyof NonNullable<typeof school.finance.sigBudgetUtilization>] || 0}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAttendance = () => {
    const studentRate = school.attendance?.studentRate || 0;
    const teacherRate = school.attendance?.teacherRate || 0;
    const lateArrivals = school.attendance?.lateArrivals || 0;
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Attendance Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              studentRate >= 90 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Student Rate</p>
              <p className="text-lg font-bold text-zinc-900">{studentRate}%</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              teacherRate >= 95 ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              <User size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Teacher Rate</p>
              <p className="text-lg font-bold text-zinc-900">{teacherRate}%</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Late Arrivals</p>
              <p className="text-lg font-bold text-zinc-900">{lateArrivals}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <Activity size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Status</p>
              <p className="text-lg font-bold text-zinc-900">Normal</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Attendance Analysis */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <Users size={16} className="text-zinc-400" />
                Student Attendance
              </h3>
              {isEditing ? (
                <Input 
                  value={editedData.attendance?.currentTerm || ''} 
                  onChange={e => setEditedData({...editedData, attendance: {...editedData.attendance, currentTerm: e.target.value}})} 
                  placeholder="e.g. Term 1 2024"
                  className="h-6 text-[10px] w-32"
                />
              ) : (
                <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-2 py-0.5 rounded">
                  {school.attendance?.currentTerm || 'Current Term'}
                </span>
              )}
            </div>
            
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Average Daily Rate (%)</label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={editedData.attendance?.studentRate} 
                    onChange={e => setEditedData({...editedData, attendance: {...editedData.attendance, studentRate: parseInt(e.target.value)}})} 
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-zinc-900">{studentRate}%</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        studentRate >= 90 ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {studentRate >= 90 ? 'Above Target' : 'Below Target'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          studentRate >= 90 ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${studentRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Common Reasons for Absenteeism</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    placeholder="e.g., Illness, seasonal farming, distance..."
                    value={editedData.attendance?.absenteeismReasons}
                    onChange={e => setEditedData({...editedData, attendance: {...editedData.attendance, absenteeismReasons: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                    <p className="text-sm text-zinc-600 italic leading-relaxed">
                      {school.attendance?.absenteeismReasons ? `"${school.attendance.absenteeismReasons}"` : 'No absenteeism reasons recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Teacher Attendance Analysis */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
                <User size={16} className="text-zinc-400" />
                Teacher Attendance
              </h3>
              <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-100 px-2 py-0.5 rounded">
                {school.attendance?.currentTerm || 'Current Term'}
              </span>
            </div>

            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Average Daily Rate (%)</label>
                {isEditing ? (
                  <Input 
                    type="number" 
                    value={editedData.attendance?.teacherRate} 
                    onChange={e => setEditedData({...editedData, attendance: {...editedData.attendance, teacherRate: parseInt(e.target.value)}})} 
                  />
                ) : (
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-bold text-zinc-900">{teacherRate}%</span>
                      <span className={cn(
                        "text-[10px] font-bold uppercase",
                        teacherRate >= 95 ? "text-emerald-600" : "text-amber-600"
                      )}>
                        {teacherRate >= 95 ? 'Excellent' : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-3 overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-1000",
                          teacherRate >= 95 ? "bg-emerald-500" : "bg-amber-500"
                        )}
                        style={{ width: `${teacherRate}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Mitigation Strategies</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    placeholder="Steps taken to improve attendance..."
                    value={editedData.attendance?.mitigation}
                    onChange={e => setEditedData({...editedData, attendance: {...editedData.attendance, mitigation: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {school.attendance?.mitigation || 'No mitigation strategies recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHealth = () => {
    const waterSource = school.health?.waterSource || 'N/A';
    const hasFeeding = school.health?.feedingProgram && school.health?.feedingProgram !== 'None';
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <Globe size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Water Access</p>
              <p className="text-xl font-bold text-zinc-900">{waterSource}</p>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
              hasFeeding ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
            )}>
              <Heart size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Feeding Program</p>
              <p className="text-xl font-bold text-zinc-900">{hasFeeding ? 'Active' : 'Not Active'}</p>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Health Services</p>
              <p className="text-xl font-bold text-zinc-900">{school.health?.healthServices ? 'Available' : 'N/A'}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Water & Sanitation */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Globe size={16} className="text-zinc-400" />
              Water & Sanitation
            </h3>
            
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Primary Water Source</label>
                {isEditing ? (
                  <select 
                    className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    value={editedData.health?.waterSource || 'Borehole'}
                    onChange={e => setEditedData({...editedData, health: {...editedData.health, waterSource: e.target.value}})}
                  >
                    <option value="Borehole">Borehole</option>
                    <option value="Piped Water">Piped Water</option>
                    <option value="Protected Well">Protected Well</option>
                    <option value="Unprotected Source">Unprotected Source</option>
                  </select>
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                      <Globe size={16} />
                    </div>
                    <p className="text-sm font-bold text-zinc-700">{waterSource}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Sanitation Condition</label>
                {isEditing ? (
                  <div className="space-y-4">
                    <Input 
                      value={editedData.health?.sanitationStatus || ''} 
                      onChange={e => setEditedData({...editedData, health: {...editedData.health, sanitationStatus: e.target.value}})} 
                      placeholder="Sanitation Status"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Handwashing Stations</label>
                        <Input 
                          type="number"
                          value={editedData.health?.handwashingStations || 0} 
                          onChange={e => setEditedData({...editedData, health: {...editedData.health, handwashingStations: parseInt(e.target.value)}})} 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase">Last Health Inspection</label>
                        <Input 
                          type="date"
                          value={editedData.health?.lastInspected || ''} 
                          onChange={e => setEditedData({...editedData, health: {...editedData.health, lastInspected: e.target.value}})} 
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          school.health?.sanitationStatus === 'Good' ? "bg-emerald-500" : "bg-amber-500"
                        )} />
                        <p className="text-sm font-bold text-zinc-700">{school.health?.sanitationStatus || 'N/A'}</p>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        Last Inspected: {school.health?.lastInspected ? new Date(school.health.lastInspected).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                      <span className="text-xs font-medium text-zinc-600">Handwashing Stations</span>
                      <span className="text-sm font-bold text-zinc-900">{school.health?.handwashingStations || 0}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Health & Safety */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Heart size={16} className="text-zinc-400" />
              Health & Safety Services
            </h3>

            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">School Garden</label>
                  {isEditing ? (
                    <select 
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={editedData.health?.hasSchoolGarden ? 'Yes' : 'No'}
                      onChange={e => setEditedData({...editedData, health: {...editedData.health, hasSchoolGarden: e.target.value === 'Yes'}})}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.health?.hasSchoolGarden ? 'Yes' : 'No'}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase">Sanitary Pad Provision</label>
                  {isEditing ? (
                    <select 
                      className="w-full h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                      value={editedData.health?.sanitaryPadProvision ? 'Yes' : 'No'}
                      onChange={e => setEditedData({...editedData, health: {...editedData.health, sanitaryPadProvision: e.target.value === 'Yes'}})}
                    >
                      <option value="No">No</option>
                      <option value="Yes">Yes</option>
                    </select>
                  ) : (
                    <p className="text-sm font-medium text-zinc-700">{school.health?.sanitaryPadProvision ? 'Yes' : 'No'}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Deworming Frequency</label>
                {isEditing ? (
                  <Input 
                    value={editedData.health?.dewormingFrequency || ''} 
                    onChange={e => setEditedData({...editedData, health: {...editedData.health, dewormingFrequency: e.target.value}})} 
                    placeholder="e.g., Twice a year"
                  />
                ) : (
                  <p className="text-sm font-medium text-zinc-700">{school.health?.dewormingFrequency || 'N/A'}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Feeding Program Provider</label>
                {isEditing ? (
                  <Input 
                    value={editedData.health?.feedingProgram || ''} 
                    onChange={e => setEditedData({...editedData, health: {...editedData.health, feedingProgram: e.target.value}})} 
                  />
                ) : (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 border border-zinc-100">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Heart size={16} />
                    </div>
                    <p className="text-sm font-bold text-zinc-700">{school.health?.feedingProgram || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Available Health Services</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    placeholder="e.g., First Aid, Deworming, Vaccinations..."
                    value={editedData.health?.healthServices}
                    onChange={e => setEditedData({...editedData, health: {...editedData.health, healthServices: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {school.health?.healthServices || 'No health services recorded.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivities = () => {
    const clubCount = (school.programs?.clubs || '').split(',').filter(c => c.trim()).length;
    const specialCount = (school.programs?.specialPrograms || '').split(',').filter(s => s.trim()).length;
    const ngoCount = (school.programs?.ngoSupport || '').split(',').filter(n => n.trim()).length;
    
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-500 text-white flex items-center justify-center shadow-sm">
              <Users size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Active Clubs</p>
              <p className="text-2xl font-bold text-zinc-900">{clubCount}</p>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <Landmark size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">NGO Partners</p>
              <p className="text-2xl font-bold text-zinc-900">{ngoCount} Active</p>
            </div>
          </Card>
          <Card className="p-6 bg-zinc-50 border-zinc-100 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-sm">
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Special Programs</p>
              <p className="text-2xl font-bold text-zinc-900">{specialCount}</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Clubs & Programs */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-zinc-400" />
              Extracurricular Activities
            </h3>
            
            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">School Clubs</label>
                {isEditing ? (
                  <Input 
                    placeholder="e.g., Wildlife, Drama, Debate..."
                    value={editedData.programs?.clubs || ''} 
                    onChange={e => setEditedData({...editedData, programs: {...editedData.programs, clubs: e.target.value}})} 
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {(school.programs?.clubs || 'N/A').split(',').map((c, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold border border-zinc-200 hover:bg-zinc-200 transition-colors cursor-default">
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Sports & Games</label>
                {isEditing ? (
                  <Input 
                    placeholder="e.g., Football, Netball, Athletics..."
                    value={editedData.programs?.sportsAndGames || ''} 
                    onChange={e => setEditedData({...editedData, programs: {...editedData.programs, sportsAndGames: e.target.value}})} 
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Activity size={16} />
                    </div>
                    <p className="text-sm font-bold text-zinc-700">
                      {school.programs?.sportsAndGames || 'N/A'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">Special Empowerment Programs</label>
                {isEditing ? (
                  <Input 
                    value={editedData.programs?.specialPrograms || ''} 
                    onChange={e => setEditedData({...editedData, programs: {...editedData.programs, specialPrograms: e.target.value}})} 
                  />
                ) : (
                  <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
                      <GraduationCap size={16} />
                    </div>
                    <p className="text-sm font-bold text-zinc-700">
                      {school.programs?.specialPrograms || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* External Support */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Landmark size={16} className="text-zinc-400" />
              External Support & Partners
            </h3>

            <div className="space-y-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase">NGO Support & Projects</label>
                {isEditing ? (
                  <textarea 
                    className="w-full min-h-[100px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-zinc-900 transition-all"
                    placeholder="List active NGOs and their projects..."
                    value={editedData.programs?.ngoSupport}
                    onChange={e => setEditedData({...editedData, programs: {...editedData.programs, ngoSupport: e.target.value}})}
                  />
                ) : (
                  <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-zinc-200 group-hover:bg-zinc-900 transition-colors" />
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {school.programs?.ngoSupport || 'No NGO support recorded.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <div className="flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase">
                  <span>Last Partnership Review</span>
                  {isEditing ? (
                    <Input 
                      type="date"
                      value={editedData.programs?.lastReview || ''} 
                      onChange={e => setEditedData({...editedData, programs: {...editedData.programs, lastReview: e.target.value}})} 
                      className="h-6 text-[10px] w-32"
                    />
                  ) : (
                    <span className="text-zinc-900">{school.programs?.lastReview ? new Date(school.programs.lastReview).toLocaleDateString() : 'N/A'}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDocuments = () => {
    const documents = school.documents || [];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Documents</p>
              <p className="text-lg font-bold text-zinc-900">{documents.length}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Upload size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Last Upload</p>
              <p className="text-lg font-bold text-zinc-900">
                {documents.length > 0 ? documents[documents.length - 1].uploadDate : 'No uploads'}
              </p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
              <Globe size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Storage Status</p>
              <p className="text-lg font-bold text-zinc-900">Active</p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <FileText size={16} className="text-zinc-400" />
              Document Repository
            </h3>
            <div className="flex items-center gap-2">
              <input
                type="file"
                id="school-doc-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700 gap-2"
                onClick={() => document.getElementById('school-doc-upload')?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus size={14} />
                )}
                {isUploading ? 'Uploading...' : 'Upload New'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {documents.length > 0 ? (
              documents.map((doc) => (
                <Card key={doc.id} className="p-4 hover:border-emerald-200 transition-colors group">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-3 rounded-xl",
                      doc.type === 'Legal' ? "bg-amber-100 text-amber-600" :
                      doc.type === 'Finance' ? "bg-emerald-100 text-emerald-600" :
                      "bg-blue-100 text-blue-600"
                    )}>
                      <FileText size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-zinc-900 truncate">{doc.name}</p>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                          doc.status === 'Verified' ? "bg-emerald-100 text-emerald-700" : "bg-zinc-100 text-zinc-500"
                        )}>
                          {doc.status}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {doc.type} • {doc.size} • Uploaded on {doc.uploadDate}
                      </p>
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
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 text-zinc-400 hover:text-red-600"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <FileText size={48} className="text-zinc-200 mx-auto mb-4" />
                <p className="text-zinc-500 font-medium">No documents uploaded yet.</p>
              </div>
            )}
          </div>

          <div 
            className="border-2 border-dashed border-zinc-200 rounded-2xl p-8 text-center bg-zinc-50/50 hover:bg-zinc-50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('school-doc-upload')?.click()}
          >
            <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-zinc-100 flex items-center justify-center mx-auto mb-3">
              <Upload size={20} className="text-zinc-400" />
            </div>
            <p className="text-sm font-bold text-zinc-900">Click or drag to upload</p>
            <p className="text-xs text-zinc-500 mt-1">PDF, XLSX, ZIP or Images (Max 20MB)</p>
          </div>
        </div>
      </div>
    );
  };

  const renderAudit = () => {
    const changeLog = school.audit?.changeLog || [];
    const inspectionHistory = school.audit?.inspectionHistory || [];

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <History size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Total Changes</p>
              <p className="text-lg font-bold text-zinc-900">{changeLog.length}</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Compliance Status</p>
              <p className="text-lg font-bold text-zinc-900">Active</p>
            </div>
          </Card>
          <Card className="p-4 bg-zinc-50 border-zinc-200 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">Last Inspection</p>
              <p className="text-lg font-bold text-zinc-900">
                {inspectionHistory.length > 0 ? inspectionHistory[0].date : 'None'}
              </p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Inspection History */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <Check size={16} className="text-zinc-400" />
              Inspection History
            </h3>

            <div className="space-y-4">
              {inspectionHistory.length > 0 ? (
                inspectionHistory.map((inspection, idx) => (
                  <Card key={idx} className="p-4 border-zinc-100 shadow-sm relative overflow-hidden">
                    <div className={cn(
                      "absolute top-0 left-0 w-1 h-full",
                      inspection.status === 'Passed' ? "bg-emerald-500" : "bg-amber-500"
                    )} />
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-zinc-900">{inspection.inspector}</p>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                        inspection.status === 'Passed' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                      )}>
                        {inspection.status}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mb-3">{inspection.notes}</p>
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">{inspection.date}</p>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              inspection.score >= 80 ? "bg-emerald-500" : "bg-amber-500"
                            )} 
                            style={{ width: `${inspection.score}%` }} 
                          />
                        </div>
                        <span className="text-[10px] font-bold text-zinc-700">{inspection.score}%</span>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <div className="p-8 text-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                  <p className="text-xs text-zinc-400 italic">No inspection history available.</p>
                </div>
              )}
            </div>
          </div>

          {/* Change Log */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <History size={16} className="text-zinc-400" />
              Activity Log
            </h3>

            <div className="bg-zinc-50 rounded-2xl border border-zinc-100 overflow-hidden">
              <div className="divide-y divide-zinc-100 max-h-[400px] overflow-y-auto">
                {changeLog.length > 0 ? (
                  changeLog.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-white transition-colors">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-bold text-zinc-900">{log.action}</p>
                        <span className="text-[10px] text-zinc-400">{log.date} {log.timestamp}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-zinc-500">by {log.user}</p>
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                          log.type === 'Create' ? "bg-blue-100 text-blue-700" :
                          log.type === 'Upload' ? "bg-purple-100 text-purple-700" :
                          log.type === 'Delete' ? "bg-red-100 text-red-700" :
                          "bg-zinc-200 text-zinc-700"
                        )}>
                          {log.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-xs text-zinc-400 italic">No activity log entries.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAcademics = () => {
    const juniorClasses = ['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4'];
    const standardisedClasses = ['Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'];
    const subjects = ['CHI', 'ENG', 'ARTS', 'MAT', 'P/SCI', 'SES'];
    const grades = ['A', 'B', 'C', 'D', 'F'];
    const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-zinc-900">Learners Results</h2>
            <p className="text-zinc-500">Academic performance and examination results breakdown.</p>
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
              {(['junior', 'standardised', 'pslce'] as AcademicsSubTab[]).filter(tab => {
                if (school.type !== 'Primary') return true;
                if (school.primarySubCategory === 'Junior Primary') {
                  if (school.juniorPrimaryRange === 'Standard 1-4') return tab === 'junior';
                  if (school.juniorPrimaryRange === 'Standard 1-7') return tab === 'junior' || tab === 'standardised';
                }
                return true;
              }).map((tab) => (
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
          <Card className="overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">Junior Classes (P-Klass to Standard 4)</h3>
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  setEditingJunior(null);
                  setJuniorForm({
                    className: 'P-Klass',
                    registered: { boys: 0, girls: 0 },
                    sat: { boys: 0, girls: 0 },
                    passed: { boys: 0, girls: 0 },
                    failed: { boys: 0, girls: 0 }
                  });
                  setIsJuniorFormOpen(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                Add Record
              </Button>
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
                    <th rowSpan={2} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Pass %</th>
                    <th rowSpan={2} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Actions</th>
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
                    const record = juniorResults.find(r => r.className === cls && r.year === selectedAcademicYear && r.term === selectedTerm);
                    
                    if (!record) {
                      return (
                        <tr key={cls} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-4 py-3 text-sm font-bold text-zinc-700 border-r border-zinc-100">{cls}</td>
                          <td colSpan={13} className="px-4 py-3 text-xs text-center text-zinc-400 italic">No data recorded for this term</td>
                        </tr>
                      );
                    }

                    const regT = record.registered.boys + record.registered.girls;
                    const satT = record.sat.boys + record.sat.girls;
                    const passT = record.passed.boys + record.passed.girls;
                    const failT = record.failed.boys + record.failed.girls;
                    const passRate = satT > 0 ? Math.round((passT / satT) * 100) : 0;

                    return (
                      <tr key={cls} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-4 py-3 text-sm font-bold text-zinc-700 border-r border-zinc-100">{cls}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{record.registered.boys}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{record.registered.girls}</td>
                        <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-zinc-50/30">{regT}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{record.sat.boys}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100">{record.sat.girls}</td>
                        <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-zinc-50/30">{satT}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-emerald-600">{record.passed.boys}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-emerald-600">{record.passed.girls}</td>
                        <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-emerald-50 text-emerald-700">{passT}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-rose-600">{record.failed.boys}</td>
                        <td className="px-2 py-3 text-sm text-center border-r border-zinc-100 text-rose-600">{record.failed.girls}</td>
                        <td className="px-2 py-3 text-sm text-center font-bold border-r border-zinc-100 bg-rose-50 text-rose-700">{failT}</td>
                        <td className="px-4 py-3 text-sm text-center font-black text-zinc-900 border-r border-zinc-100">{passRate}%</td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingJunior(record);
                                setJuniorForm(record);
                                setIsJuniorFormOpen(true);
                              }}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              onClick={() => dataService.deleteJuniorResult(record.id)}
                              className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {activeAcademicsSubTab === 'standardised' && (
          <div className="space-y-6">
            <Card className="overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">Standardised Examination (Standard 5 - 8)</h3>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => {
                    setEditingStandardised(null);
                    setStandardisedForm({
                      learnerName: '',
                      sex: 'M',
                      className: 'Standard 5',
                      scores: { CHI: 0, ENG: 0, ARTS: 0, MAT: 0, PSCI: 0, SES: 0 },
                      total: 0
                    });
                    setIsStandardisedFormOpen(true);
                  }}
                >
                  <Plus size={16} className="mr-2" />
                  Add Result
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">Name of Learner</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Sex</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Class</th>
                      {subjects.map(sub => (
                        <th key={sub} className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">{sub}</th>
                      ))}
                      <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center bg-zinc-100/50">Total</th>
                      <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {standardisedResults
                      .filter(r => r.year === selectedAcademicYear && r.term === selectedTerm)
                      .map(record => (
                        <tr key={record.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="px-6 py-4 text-sm font-medium text-zinc-900">{record.learnerName}</td>
                          <td className="px-4 py-4 text-sm text-center text-zinc-600">{record.sex}</td>
                          <td className="px-4 py-4 text-sm text-center text-zinc-600">{record.className}</td>
                          {subjects.map(sub => (
                            <td key={sub} className="px-4 py-4 text-sm text-center font-bold text-zinc-700">
                              {record.scores[sub as keyof typeof record.scores]}
                            </td>
                          ))}
                          <td className="px-6 py-4 text-sm text-center font-black text-emerald-700 bg-emerald-50/30">{record.total}</td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button 
                                onClick={() => {
                                  setEditingStandardised(record);
                                  setStandardisedForm(record);
                                  setIsStandardisedFormOpen(true);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => dataService.deleteStandardisedResult(record.id)}
                                className="p-1 text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {standardisedResults.filter(r => r.year === selectedAcademicYear && r.term === selectedTerm).length === 0 && (
                      <tr>
                        <td colSpan={subjects.length + 4} className="px-6 py-8 text-center text-zinc-400 italic text-sm">
                          No standardised results recorded for this term.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6 bg-emerald-50 border-emerald-100">
                <h4 className="text-xs font-bold text-emerald-800 uppercase mb-4">Class Summary</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">Average Score</span>
                    <span className="font-bold text-emerald-900">74.5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">Highest Score</span>
                    <span className="font-bold text-emerald-900">542</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-emerald-700">Lowest Score</span>
                    <span className="font-bold text-emerald-900">312</span>
                  </div>
                </div>
              </Card>
              <Card className="p-6 bg-blue-50 border-blue-100">
                <h4 className="text-xs font-bold text-blue-800 uppercase mb-4">Subject Averages</h4>
                <div className="space-y-2">
                  {subjects.map(sub => (
                    <div key={sub} className="flex justify-between text-[10px]">
                      <span className="text-blue-700 font-bold">{sub}</span>
                      <span className="font-bold text-blue-900">68%</span>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6 bg-amber-50 border-amber-100">
                <h4 className="text-xs font-bold text-amber-800 uppercase mb-4">Gender Gap</h4>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">Boys Avg</span>
                    <span className="font-bold text-amber-900">72.1</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-amber-700">Girls Avg</span>
                    <span className="font-bold text-amber-900">76.8</span>
                  </div>
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-[10px] text-amber-600 font-medium italic">Girls are performing 6.5% better on average.</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeAcademicsSubTab === 'pslce' && (
          <div className="space-y-10">
            <div className="flex justify-end">
              <Button 
                size="sm" 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  const record = pslceData.find(d => d.year === selectedAcademicYear);
                  if (record) {
                    setEditingPSLCE(record);
                    setPslceForm(record);
                  } else {
                    setEditingPSLCE(null);
                    setPslceForm({
                      summary: {
                        registered: { boys: 0, girls: 0 },
                        sat: { boys: 0, girls: 0 },
                        passed: { boys: 0, girls: 0 },
                        failed: { boys: 0, girls: 0 },
                        notSat: { boys: 0, girls: 0 }
                      },
                      selection: {
                        national: { boys: 0, girls: 0 },
                        districtBoarding: { boys: 0, girls: 0 },
                        day: { boys: 0, girls: 0 },
                        cdss: { boys: 0, girls: 0 }
                      }
                    });
                  }
                  setIsPSLCEFormOpen(true);
                }}
              >
                <Plus size={16} className="mr-2" />
                {pslceData.find(d => d.year === selectedAcademicYear) ? 'Edit Record' : 'Add Record'}
              </Button>
            </div>
            {/* Section 1: Summary */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">1</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">PSLCE Summary by Gender</h3>
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
                      const record = pslceData.find(d => d.year === selectedAcademicYear);
                      if (!record) {
                        return (
                          <tr>
                            <td colSpan={7} className="px-6 py-8 text-center text-zinc-400 italic text-sm">
                              No PSLCE summary data recorded for this year.
                            </td>
                          </tr>
                        );
                      }

                      const types = [
                        { label: 'Boys', data: record.summary, key: 'boys' },
                        { label: 'Girls', data: record.summary, key: 'girls' },
                        { label: 'Total', data: record.summary, key: 'total' }
                      ];

                      return types.map(type => {
                        const reg = type.key === 'total' ? type.data.registered.boys + type.data.registered.girls : type.data.registered[type.key as 'boys' | 'girls'];
                        const sat = type.key === 'total' ? type.data.sat.boys + type.data.sat.girls : type.data.sat[type.key as 'boys' | 'girls'];
                        const passed = type.key === 'total' ? type.data.passed.boys + type.data.passed.girls : type.data.passed[type.key as 'boys' | 'girls'];
                        const failed = type.key === 'total' ? type.data.failed.boys + type.data.failed.girls : type.data.failed[type.key as 'boys' | 'girls'];
                        const notSat = type.key === 'total' ? type.data.notSat.boys + type.data.notSat.girls : type.data.notSat[type.key as 'boys' | 'girls'];
                        const passRate = sat > 0 ? Math.round((passed / sat) * 100) : 0;

                        return (
                          <tr key={type.label} className={cn("hover:bg-zinc-50/50 transition-colors", type.label === 'Total' && "bg-zinc-50/30 font-bold")}>
                            <td className="px-6 py-4 text-sm font-bold text-zinc-700">{type.label}</td>
                            <td className="px-4 py-4 text-sm text-center">{reg}</td>
                            <td className="px-4 py-4 text-sm text-center">{sat}</td>
                            <td className="px-4 py-4 text-sm text-center text-emerald-600">{passed}</td>
                            <td className="px-4 py-4 text-sm text-center text-rose-600">{failed}</td>
                            <td className="px-4 py-4 text-sm text-center text-amber-600">{notSat}</td>
                            <td className="px-6 py-4 text-sm text-center font-black text-zinc-900 bg-zinc-100/20">{passRate}%</td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </Card>
            </section>

            {/* Section 2: Selection List */}
            <section className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">2</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Selection List</h3>
              </div>
              
              {(() => {
                const record = pslceData.find(d => d.year === selectedAcademicYear);
                if (!record) return <p className="text-sm text-zinc-400 italic">No selection data available.</p>;

                const selections = [
                  { label: 'National SS', data: record.selection.national },
                  { label: 'District Boarding SS', data: record.selection.districtBoarding },
                  { label: 'Day SS', data: record.selection.day },
                  { label: 'CDSS', data: record.selection.cdss }
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

            {/* Section 3: Pass by Subject */}
            <section className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold">3</div>
                <h3 className="text-lg font-bold text-zinc-900 uppercase tracking-tight">Pass by Subject (Grade Distribution)</h3>
              </div>
              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100">
                        <th rowSpan={2} className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest border-r border-zinc-100">Subject</th>
                        <th colSpan={5} className="px-4 py-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center border-r border-zinc-100">Grades</th>
                        <th rowSpan={2} className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-center bg-zinc-100/50">Total</th>
                      </tr>
                      <tr className="bg-zinc-50/50 border-b border-zinc-100">
                        {grades.map(g => (
                          <th key={g} className="px-4 py-2 text-[10px] font-bold text-zinc-500 text-center border-r border-zinc-100">{g}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {subjects.map(sub => {
                        const counts = grades.map(() => Math.floor(Math.random() * 20));
                        const total = counts.reduce((a, b) => a + b, 0);
                        return (
                          <tr key={sub} className="hover:bg-zinc-50/50 transition-colors">
                            <td className="px-6 py-3 text-sm font-bold text-zinc-700 border-r border-zinc-100">{sub}</td>
                            {counts.map((c, idx) => (
                              <td key={idx} className="px-4 py-3 text-sm text-center border-r border-zinc-100">{c}</td>
                            ))}
                            <td className="px-6 py-3 text-sm text-center font-black text-zinc-900 bg-zinc-100/20">{total}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </section>
          </div>
        )}
      </div>
    );
  };


  const renderInspections = () => {
    const getStatusIcon = (status: Inspection['status']) => {
      switch (status) {
        case 'Approved': return <CheckCircle size={16} className="text-emerald-500" />;
        case 'Submitted': return <Clock size={16} className="text-blue-500" />;
        case 'Draft': return <AlertCircle size={16} className="text-zinc-400" />;
        default: return <AlertCircle size={16} className="text-zinc-400" />;
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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-zinc-900">Inspection History</h3>
            <p className="text-sm text-zinc-500">Review all past and pending inspection reports for this school.</p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
            onClick={() => {
              setInspectionType('School');
              setInspectionForm({
                type: 'School',
                date: new Date().toISOString().split('T')[0],
                status: 'Draft',
                score: 0,
                findings: '',
                recommendations: '',
                schoolDetails: {
                  leadership: { planning: 3, governance: 3, financialManagement: 3, records: 3 },
                  teachingLearning: { curriculumDelivery: 3, learnerAssessment: 3, teacherAttendance: 3 },
                  learnerWelfare: { safety: 3, health: 3, inclusion: 3, discipline: 3 },
                  infrastructure: { classrooms: 3, toilets: 3, water: 3, textbooks: 3 },
                  community: { smcPtaInvolvement: 3 }
                }
              });
              setIsInspectionFormOpen(true);
            }}
          >
            <Plus size={16} />
            New Inspection
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {inspections.length === 0 ? (
            <div className="text-center py-12 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
              <ClipboardCheck size={48} className="text-zinc-200 mx-auto mb-4" />
              <p className="text-zinc-500 font-medium">No inspection records found for this school.</p>
            </div>
          ) : (
            inspections.map((inspection) => (
              <Card key={inspection.id} className="p-6 hover:border-emerald-500 transition-all group">
                <div className="flex items-center gap-6">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 text-zinc-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                    {inspection.type === 'Teacher' ? <User size={28} /> : <ClipboardCheck size={28} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex flex-col">
                        <p className="text-sm font-bold text-zinc-900">
                          {inspection.type === 'Teacher' ? `Teacher: ${inspection.teacherDetails?.teacherName}` : 'School Inspection'}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Inspector: {inspection.inspectorId}</p>
                      </div>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 uppercase tracking-wider",
                        getStatusColor(inspection.status)
                      )}>
                        {getStatusIcon(inspection.status)}
                        {inspection.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600 border border-zinc-200 uppercase tracking-wider">
                        {inspection.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        {new Date(inspection.date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <BarChart3 size={14} />
                        Score: {inspection.score}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Score</p>
                    <p className={cn(
                      "text-2xl font-black",
                      inspection.score >= 80 ? "text-emerald-600" :
                      inspection.score >= 60 ? "text-amber-600" :
                      "text-red-600"
                    )}>{inspection.score}%</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-9 rounded-lg"
                    onClick={() => {
                      setViewingInspection(inspection);
                      setInspectionType(inspection.type);
                      setInspectionForm(inspection);
                      setIsInspectionFormOpen(true);
                    }}
                  >
                    View Report
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'basic': return renderBasicInfo();
      case 'location': return renderLocation();
      case 'admin': return renderAdmin();
      case 'learners-registry': return renderLearnersRegistry();
      case 'staff': return renderStaff();
      case 'infrastructure': return renderInfrastructure();
      case 'assets': return renderAssets();
      case 'timetable': return renderTimetable();
      case 'performance': return renderPerformance();
      case 'finance': return renderFinance();
      case 'attendance': return renderAttendance();
      case 'health': return renderHealth();
      case 'activities': return renderActivities();
      case 'academics': return renderAcademics();
      case 'inspections': return renderInspections();
      case 'documents': return renderDocuments();
      case 'audit': return renderAudit();
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md overflow-hidden">
      <div className="w-full max-w-6xl h-[90vh] flex flex-col bg-white rounded-2xl border border-zinc-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 p-6 bg-zinc-50/50 shrink-0">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <School size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-zinc-900">{school.name}</h2>
              <p className="text-sm text-zinc-500 flex items-center gap-2">
                <span className="font-mono">{school.emisCode}</span>
                <span className="text-zinc-300">•</span>
                <span>{school.zone} Zone</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
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
            <Button variant="ghost" size="sm" className="h-10 w-10 p-0" onClick={onClose}>
              <X size={24} />
            </Button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Sidebar Tabs */}
          <div className="w-64 border-r border-zinc-100 bg-zinc-50/30 overflow-y-auto p-4 space-y-1 custom-scrollbar shrink-0 h-full">
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
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar min-h-0 h-full">
            <div className="max-w-4xl mx-auto">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Inspection Form Modal */}
        {isInspectionFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm overflow-y-auto">
            <Card className="w-full max-w-4xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 my-8">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {viewingInspection ? 'Edit Inspection Report' : 'New Inspection Report'}
                  </h3>
                  <p className="text-xs text-zinc-500">EMIS Malawi Standard Inspection Form</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex bg-zinc-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionType('School');
                        setInspectionForm(prev => ({ ...prev, type: 'School' }));
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        inspectionType === 'School' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      School
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setInspectionType('Teacher');
                        setInspectionForm(prev => ({ 
                          ...prev, 
                          type: 'Teacher',
                          teacherDetails: prev.teacherDetails || {
                            teacherId: '',
                            teacherName: '',
                            subject: '',
                            standard: '',
                            preparation: { schemeOfWork: 3, lessonPlan: 3, teachingAids: 3 },
                            delivery: { introduction: 3, contentKnowledge: 3, methodology: 3, learnerEngagement: 3 },
                            management: { discipline: 3, organization: 3, environment: 3 },
                            assessment: { questioning: 3, feedback: 3, marking: 3 },
                            professionalism: { punctuality: 3, dressCode: 3, records: 3 }
                          }
                        }));
                      }}
                      className={cn(
                        "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                        inspectionType === 'Teacher' ? "bg-white text-emerald-600 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                      )}
                    >
                      Teacher
                    </button>
                  </div>
                  <button onClick={() => setIsInspectionFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <form onSubmit={handleInspectionSubmit} className="p-6 space-y-8">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Inspection Date</label>
                    <Input 
                      type="date" 
                      required
                      value={inspectionForm.date}
                      onChange={e => setInspectionForm({...inspectionForm, date: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Inspector ID/Name</label>
                    <Input 
                      placeholder="Enter inspector name..."
                      required
                      value={inspectionForm.inspectorId}
                      onChange={e => setInspectionForm({...inspectionForm, inspectorId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Status</label>
                    <select 
                      className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                      value={inspectionForm.status}
                      onChange={e => setInspectionForm({...inspectionForm, status: e.target.value as any})}
                    >
                      <option value="Draft">Draft</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Approved">Approved</option>
                    </select>
                  </div>
                </div>

                {inspectionType === 'School' ? (
                  <div className="space-y-8">
                    {/* School Inspection Sections */}
                    {[
                      { title: 'Leadership & Management', key: 'leadership', fields: ['planning', 'governance', 'financialManagement', 'records'] },
                      { title: 'Teaching & Learning', key: 'teachingLearning', fields: ['curriculumDelivery', 'learnerAssessment', 'teacherAttendance'] },
                      { title: 'Learner Welfare', key: 'learnerWelfare', fields: ['safety', 'health', 'inclusion', 'discipline'] },
                      { title: 'Infrastructure & Resources', key: 'infrastructure', fields: ['classrooms', 'toilets', 'water', 'textbooks'] },
                      { title: 'Community Participation', key: 'community', fields: ['smcPtaInvolvement'] }
                    ].map(section => (
                      <div key={section.key} className="space-y-4">
                        <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">{section.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {section.fields.map(field => (
                            <div key={field} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-zinc-600 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {((inspectionForm.schoolDetails as any)?.[section.key]?.[field]) || 0} / 5
                                </span>
                              </div>
                              <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="1"
                                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                value={((inspectionForm.schoolDetails as any)?.[section.key]?.[field]) || 3}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setInspectionForm({
                                    ...inspectionForm,
                                    schoolDetails: {
                                      ...inspectionForm.schoolDetails!,
                                      [section.key]: {
                                        ...(inspectionForm.schoolDetails as any)[section.key],
                                        [field]: val
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Teacher Inspection Sections */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Teacher</label>
                        <select 
                          className="w-full h-10 px-3 rounded-xl border border-zinc-200 bg-white text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                          required
                          value={inspectionForm.teacherDetails?.teacherId}
                          onChange={e => {
                            const teacher = teachers.find(t => t.id === e.target.value);
                            setInspectionForm({
                              ...inspectionForm,
                              teacherDetails: {
                                ...inspectionForm.teacherDetails!,
                                teacherId: e.target.value,
                                teacherName: teacher ? `${teacher.firstName} ${teacher.lastName}` : ''
                              }
                            });
                          }}
                        >
                          <option value="">Select Teacher...</option>
                          {teachers.map(t => (
                            <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Subject & Standard</label>
                        <div className="grid grid-cols-2 gap-2">
                          <Input 
                            placeholder="Subject"
                            value={inspectionForm.teacherDetails?.subject}
                            onChange={e => setInspectionForm({
                              ...inspectionForm,
                              teacherDetails: { ...inspectionForm.teacherDetails!, subject: e.target.value }
                            })}
                          />
                          <Input 
                            placeholder="Standard"
                            value={inspectionForm.teacherDetails?.standard}
                            onChange={e => setInspectionForm({
                              ...inspectionForm,
                              teacherDetails: { ...inspectionForm.teacherDetails!, standard: e.target.value }
                            })}
                          />
                        </div>
                      </div>
                    </div>

                    {[
                      { title: 'Preparation', key: 'preparation', fields: ['schemeOfWork', 'lessonPlan', 'teachingAids'] },
                      { title: 'Lesson Delivery', key: 'delivery', fields: ['introduction', 'contentKnowledge', 'methodology', 'learnerEngagement'] },
                      { title: 'Classroom Management', key: 'management', fields: ['discipline', 'organization', 'environment'] },
                      { title: 'Assessment', key: 'assessment', fields: ['questioning', 'feedback', 'marking'] },
                      { title: 'Professionalism', key: 'professionalism', fields: ['punctuality', 'dressCode', 'records'] }
                    ].map(section => (
                      <div key={section.key} className="space-y-4">
                        <h4 className="text-xs font-black text-zinc-900 uppercase tracking-widest border-b border-zinc-100 pb-2">{section.title}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {section.fields.map(field => (
                            <div key={field} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-zinc-600 capitalize">{field.replace(/([A-Z])/g, ' $1')}</label>
                                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                                  {((inspectionForm.teacherDetails as any)?.[section.key]?.[field]) || 0} / 5
                                </span>
                              </div>
                              <input 
                                type="range" 
                                min="1" 
                                max="5" 
                                step="1"
                                className="w-full h-1.5 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                                value={((inspectionForm.teacherDetails as any)?.[section.key]?.[field]) || 3}
                                onChange={e => {
                                  const val = parseInt(e.target.value);
                                  setInspectionForm({
                                    ...inspectionForm,
                                    teacherDetails: {
                                      ...inspectionForm.teacherDetails!,
                                      [section.key]: {
                                        ...(inspectionForm.teacherDetails as any)[section.key],
                                        [field]: val
                                      }
                                    }
                                  });
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Findings & Recommendations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Key Findings</label>
                    <textarea 
                      className="w-full min-h-[120px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="Summarize main observations..."
                      value={inspectionForm.findings}
                      onChange={e => setInspectionForm({...inspectionForm, findings: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Recommendations</label>
                    <textarea 
                      className="w-full min-h-[120px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="List required actions..."
                      value={inspectionForm.recommendations}
                      onChange={e => setInspectionForm({...inspectionForm, recommendations: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-2xl border border-zinc-100">
                  <div>
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Overall Performance Score</p>
                    <p className={cn(
                      "text-3xl font-black",
                      (inspectionForm.score || 0) >= 80 ? "text-emerald-600" :
                      (inspectionForm.score || 0) >= 60 ? "text-amber-600" :
                      "text-red-600"
                    )}>{inspectionForm.score}%</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="outline" type="button" onClick={() => setIsInspectionFormOpen(false)}>Cancel</Button>
                    <Button className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]">
                      {viewingInspection ? 'Update Report' : 'Submit Report'}
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
        {isJuniorFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-lg bg-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingJunior ? 'Edit Junior Class Record' : 'Add Junior Class Record'}
                </h3>
                <button onClick={() => setIsJuniorFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleJuniorSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Class</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={juniorForm.className}
                      onChange={(e) => setJuniorForm({ ...juniorForm, className: e.target.value as any })}
                      required
                    >
                      {['P-Klass', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4'].map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                  
                  {/* Registered */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Registered Boys</label>
                    <Input 
                      type="number" 
                      value={juniorForm.registered?.boys}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        registered: { ...juniorForm.registered!, boys: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Registered Girls</label>
                    <Input 
                      type="number" 
                      value={juniorForm.registered?.girls}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        registered: { ...juniorForm.registered!, girls: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>

                  {/* Sat */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Sat Boys</label>
                    <Input 
                      type="number" 
                      value={juniorForm.sat?.boys}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        sat: { ...juniorForm.sat!, boys: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Sat Girls</label>
                    <Input 
                      type="number" 
                      value={juniorForm.sat?.girls}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        sat: { ...juniorForm.sat!, girls: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>

                  {/* Passed */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Passed Boys</label>
                    <Input 
                      type="number" 
                      value={juniorForm.passed?.boys}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        passed: { ...juniorForm.passed!, boys: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Passed Girls</label>
                    <Input 
                      type="number" 
                      value={juniorForm.passed?.girls}
                      onChange={(e) => setJuniorForm({ 
                        ...juniorForm, 
                        passed: { ...juniorForm.passed!, girls: parseInt(e.target.value) || 0 } 
                      })}
                      required
                    />
                  </div>

                  {/* Failed */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Failed Boys (Auto)</label>
                    <Input 
                      type="number" 
                      value={juniorForm.failed?.boys}
                      readOnly
                      className="bg-zinc-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase block">Failed Girls (Auto)</label>
                    <Input 
                      type="number" 
                      value={juniorForm.failed?.girls}
                      readOnly
                      className="bg-zinc-50"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsJuniorFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingJunior ? 'Update Record' : 'Save Record'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Standardised Form Modal */}
        {isStandardisedFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingStandardised ? 'Edit Standardised Result' : 'Add Standardised Result'}
                </h3>
                <button onClick={() => setIsStandardisedFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleStandardisedSubmit} className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Learner Name</label>
                    <Input 
                      value={standardisedForm.learnerName}
                      onChange={(e) => setStandardisedForm({ ...standardisedForm, learnerName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Sex</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={standardisedForm.sex}
                      onChange={(e) => setStandardisedForm({ ...standardisedForm, sex: e.target.value as 'M' | 'F' })}
                      required
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-zinc-500 uppercase mb-1 block">Class</label>
                    <select 
                      className="w-full h-10 px-3 rounded-lg border border-zinc-200 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      value={standardisedForm.className}
                      onChange={(e) => setStandardisedForm({ ...standardisedForm, className: e.target.value as any })}
                      required
                    >
                      {['Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].filter(cls => {
                        if (school.primarySubCategory === 'Junior Primary' && school.juniorPrimaryRange === 'Standard 1-7') {
                          return cls !== 'Standard 8';
                        }
                        return true;
                      }).map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>

                  {/* Scores */}
                  {['CHI', 'ENG', 'ARTS', 'MAT', 'PSCI', 'SES'].map(sub => (
                    <div key={sub} className="space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase block">{sub}</label>
                      <Input 
                        type="number" 
                        value={standardisedForm.scores?.[sub as keyof typeof standardisedForm.scores]}
                        onChange={(e) => setStandardisedForm({ 
                          ...standardisedForm, 
                          scores: { ...standardisedForm.scores!, [sub]: parseInt(e.target.value) || 0 } 
                        })}
                        required
                      />
                    </div>
                  ))}

                  {/* Total */}
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-emerald-600 uppercase mb-1 block">Total Score (Auto)</label>
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center">
                      <span className="text-2xl font-black text-emerald-700">{standardisedForm.total}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsStandardisedFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingStandardised ? 'Update Result' : 'Save Result'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* PSLCE Form Modal */}
        {isPSLCEFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-4xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingPSLCE ? 'Edit PSLCE Data' : 'Add PSLCE Data'}
                </h3>
                <button onClick={() => setIsPSLCEFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handlePSLCESubmit} className="p-6 space-y-8">
                {/* Summary Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Summary Data</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {['registered', 'sat', 'passed', 'failed', 'notSat'].map(field => (
                      <React.Fragment key={field}>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            {field} (B) {['failed', 'notSat'].includes(field) && '(Auto)'}
                          </label>
                          <Input 
                            type="number" 
                            value={pslceForm.summary?.[field as keyof typeof pslceForm.summary]?.boys}
                            onChange={(e) => setPslceForm({ 
                              ...pslceForm, 
                              summary: { 
                                ...pslceForm.summary!, 
                                [field]: { ...pslceForm.summary![field as keyof typeof pslceForm.summary], boys: parseInt(e.target.value) || 0 } 
                              } 
                            })}
                            readOnly={['failed', 'notSat'].includes(field)}
                            className={['failed', 'notSat'].includes(field) ? 'bg-zinc-50' : ''}
                            required={!['failed', 'notSat'].includes(field)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block">
                            {field} (G) {['failed', 'notSat'].includes(field) && '(Auto)'}
                          </label>
                          <Input 
                            type="number" 
                            value={pslceForm.summary?.[field as keyof typeof pslceForm.summary]?.girls}
                            onChange={(e) => setPslceForm({ 
                              ...pslceForm, 
                              summary: { 
                                ...pslceForm.summary!, 
                                [field]: { ...pslceForm.summary![field as keyof typeof pslceForm.summary], girls: parseInt(e.target.value) || 0 } 
                              } 
                            })}
                            readOnly={['failed', 'notSat'].includes(field)}
                            className={['failed', 'notSat'].includes(field) ? 'bg-zinc-50' : ''}
                            required={!['failed', 'notSat'].includes(field)}
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Selection Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Selection Data</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['national', 'districtBoarding', 'day', 'cdss'].map(field => (
                      <React.Fragment key={field}>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block">{field} (B)</label>
                          <Input 
                            type="number" 
                            value={pslceForm.selection?.[field as keyof typeof pslceForm.selection]?.boys}
                            onChange={(e) => setPslceForm({ 
                              ...pslceForm, 
                              selection: { 
                                ...pslceForm.selection!, 
                                [field]: { ...pslceForm.selection![field as keyof typeof pslceForm.selection], boys: parseInt(e.target.value) || 0 } 
                              } 
                            })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase block">{field} (G)</label>
                          <Input 
                            type="number" 
                            value={pslceForm.selection?.[field as keyof typeof pslceForm.selection]?.girls}
                            onChange={(e) => setPslceForm({ 
                              ...pslceForm, 
                              selection: { 
                                ...pslceForm.selection!, 
                                [field]: { ...pslceForm.selection![field as keyof typeof pslceForm.selection], girls: parseInt(e.target.value) || 0 } 
                              } 
                            })}
                            required
                          />
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Subject Grades Section */}
                <div className="space-y-4">
                  <h4 className="text-sm font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Pass by Subject (Grade Distribution)</h4>
                  <div className="space-y-6">
                    {['CHI', 'ENG', 'ARTS', 'MAT', 'PSCI', 'SES'].map(subject => (
                      <div key={subject} className="bg-zinc-50 p-4 rounded-xl space-y-3">
                        <h5 className="text-xs font-bold text-zinc-700 uppercase tracking-wider">{subject}</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['A', 'B', 'C', 'D'].map(grade => (
                            <div key={grade} className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block">{grade} (B)</label>
                                <Input 
                                  type="number" 
                                  value={pslceForm.subjectGrades?.[subject]?.[grade as 'A'|'B'|'C'|'D']?.boys}
                                  onChange={(e) => setPslceForm({ 
                                    ...pslceForm, 
                                    subjectGrades: { 
                                      ...pslceForm.subjectGrades!, 
                                      [subject]: { 
                                        ...pslceForm.subjectGrades![subject], 
                                        [grade]: { ...pslceForm.subjectGrades![subject][grade as 'A'|'B'|'C'|'D'], boys: parseInt(e.target.value) || 0 } 
                                      } 
                                    } 
                                  })}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase block">{grade} (G)</label>
                                <Input 
                                  type="number" 
                                  value={pslceForm.subjectGrades?.[subject]?.[grade as 'A'|'B'|'C'|'D']?.girls}
                                  onChange={(e) => setPslceForm({ 
                                    ...pslceForm, 
                                    subjectGrades: { 
                                      ...pslceForm.subjectGrades!, 
                                      [subject]: { 
                                        ...pslceForm.subjectGrades![subject], 
                                        [grade]: { ...pslceForm.subjectGrades![subject][grade as 'A'|'B'|'C'|'D'], girls: parseInt(e.target.value) || 0 } 
                                      } 
                                    } 
                                  })}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsPSLCEFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingPSLCE ? 'Update Data' : 'Save Data'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Learner Form Modal */}
        {isLearnerFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingLearner ? 'Edit Learner Profile' : 'Register New Learner'}
                </h3>
                <button onClick={() => setIsLearnerFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleLearnerSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">First Name</label>
                    <Input 
                      value={learnerForm.firstName}
                      onChange={e => setLearnerForm({...learnerForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Last Name</label>
                    <Input 
                      value={learnerForm.lastName}
                      onChange={e => setLearnerForm({...learnerForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Gender</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={learnerForm.gender}
                      onChange={e => setLearnerForm({...learnerForm, gender: e.target.value as any})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Date of Birth</label>
                    <Input 
                      type="date"
                      value={learnerForm.dateOfBirth}
                      onChange={e => setLearnerForm({...learnerForm, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Standard</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={learnerForm.standard}
                      onChange={e => setLearnerForm({...learnerForm, standard: e.target.value})}
                    >
                      {['P-Klass', 'Standard 1', 'Standard 1', 'Standard 2', 'Standard 3', 'Standard 4', 'Standard 5', 'Standard 6', 'Standard 7', 'Standard 8'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Guardian Name</label>
                    <Input 
                      value={learnerForm.guardianName}
                      onChange={e => setLearnerForm({...learnerForm, guardianName: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Guardian Phone</label>
                    <Input 
                      value={learnerForm.guardianPhone}
                      onChange={e => setLearnerForm({...learnerForm, guardianPhone: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Address</label>
                  <Input 
                    value={learnerForm.address}
                    onChange={e => setLearnerForm({...learnerForm, address: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-4 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox"
                      checked={learnerForm.isSNE}
                      onChange={e => setLearnerForm({...learnerForm, isSNE: e.target.checked})}
                      className="rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-zinc-700 uppercase">SNE Learner</span>
                  </label>
                  {learnerForm.isSNE && (
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">Disability/SNE Type</label>
                      <Input 
                        placeholder="e.g. Visual Impairment"
                        value={learnerForm.sneType}
                        onChange={e => setLearnerForm({...learnerForm, sneType: e.target.value})}
                        className="h-9 text-xs"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsLearnerFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingLearner ? 'Update Profile' : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}

        {/* Teacher Form Modal */}
        {isTeacherFormOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <Card className="w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                <h3 className="text-lg font-bold text-zinc-900">
                  {editingTeacher ? 'Edit Teacher Profile' : 'Add New Teacher'}
                </h3>
                <button onClick={() => setIsTeacherFormOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleTeacherSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">First Name</label>
                    <Input 
                      value={teacherForm.firstName}
                      onChange={e => setTeacherForm({...teacherForm, firstName: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Last Name</label>
                    <Input 
                      value={teacherForm.lastName}
                      onChange={e => setTeacherForm({...teacherForm, lastName: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">National ID</label>
                    <Input 
                      value={teacherForm.nationalId}
                      onChange={e => setTeacherForm({...teacherForm, nationalId: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">TCM Registration No</label>
                    <Input 
                      value={teacherForm.emisCode}
                      onChange={e => setTeacherForm({...teacherForm, emisCode: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Gender</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={teacherForm.gender}
                      onChange={e => setTeacherForm({...teacherForm, gender: e.target.value as any})}
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Date of Birth</label>
                    <Input 
                      type="date"
                      value={teacherForm.dateOfBirth}
                      onChange={e => setTeacherForm({...teacherForm, dateOfBirth: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Status</label>
                    <select 
                      className="w-full h-9 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs"
                      value={teacherForm.status}
                      onChange={e => setTeacherForm({...teacherForm, status: e.target.value as any})}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                      <option value="On Leave">On Leave</option>
                      <option value="Suspended">Suspended</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Highest Qualification</label>
                    <Input 
                      placeholder="e.g. Diploma in Education"
                      value={teacherForm.qualification}
                      onChange={e => setTeacherForm({...teacherForm, qualification: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">Specialization</label>
                    <Input 
                      placeholder="e.g. Mathematics, Science"
                      value={teacherForm.specialization}
                      onChange={e => setTeacherForm({...teacherForm, specialization: e.target.value})}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setIsTeacherFormOpen(false)}>Cancel</Button>
                  <Button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    {editingTeacher ? 'Update Profile' : 'Add Teacher'}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
