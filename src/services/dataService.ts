import { toast } from 'sonner';
import { Teacher, School, Inspection, TPDProgram, Resource, ExaminationResult, Transfer, ExamAdministration, DailyAttendance, MonthlyEnrolment, IFAReport, TeachersReturn, TermlyReport, AnnualCensus, Department, OfficerOperation, LeaveRequest, AdvancedInspection, NESStandard, ContinuousAssessment, MaintenanceLog, SMCMeeting, Learner, PromotionRecord, EnrollmentStats, AcademicYear, Term, StandardClass, SystemSettings, JuniorResult, StandardisedResult, PSLCEData } from '../types';

const API_BASE = '/api';

// Auth state tracking
let authVerified = false;
let authPromise: Promise<boolean> | null = null;

const clearLegacyTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
};

const resetAuthVerification = () => {
  authVerified = false;
  authPromise = null;
};

const broadcastUnauthorized = () => {
  resetAuthVerification();
  clearLegacyTokens();
  window.dispatchEvent(new Event('auth:unauthorized'));
};

if (typeof window !== 'undefined') {
  window.addEventListener('auth:changed', resetAuthVerification);
}

/**
 * Check authentication status and block all requests until verified
 */
async function ensureAuthenticated(): Promise<boolean> {
  if (authVerified) return true;
  
  if (!authPromise) {
    authPromise = (async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
        if (res.ok) {
          authVerified = true;
          return true;
        }

        broadcastUnauthorized();
        return false;
      } catch {
        return false;
      }
    })();
  }
  
  return authPromise;
}

/**
 * Central API request handler with proper authentication and retry logic
 * 
 * @param path API endpoint path (without /api prefix)
 * @param options Fetch options
 * @param retries Number of retries for network/5xx errors
 */
async function apiRequest<T>(path: string, options: RequestInit = {}, retries = 2): Promise<T> {
  // Block all API calls except auth/me until auth is verified
  if (!path.includes('/auth/')) {
    const authenticated = await ensureAuthenticated();
    if (!authenticated) {
      throw new Error('Unauthorized - please login again');
    }
  }

  const token = localStorage.getItem('token') || localStorage.getItem('access_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as any) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const message = errorData.message || (typeof errorData === 'string' ? errorData : null) || res.statusText || `HTTP ${res.status}`;
      
      // Handle 401 Unauthorized immediately - no retry
      if (res.status === 401) {
        broadcastUnauthorized();
        throw new Error('Unauthorized - please login again');
      }

      // Don't retry on any client errors (4xx)
      if (res.status >= 400 && res.status < 500) {
        console.error(`❌ API Error [${res.status}] ${path}:`, message);
        throw new Error(message);
      }
      
      // Retry only on server errors (5xx)
      if (retries > 0) {
        console.warn(`🔄 Retrying API call to ${path} (${retries} retries left)...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return apiRequest(path, options, retries - 1);
      }
      
      throw new Error(message);
    }

    return res.json();
  } catch (err: any) {
    // Retry only on network errors, not application errors
    if (err.message === 'Failed to fetch' && retries > 0) {
      console.warn(`🔄 Connection failed for ${path}, retrying... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return apiRequest(path, options, retries - 1);
    }
    
    console.error(`❌ Network Error for ${path}:`, err);
    throw err;
  }
}

/**
 * Check if user is currently authenticated
 */
export function isAuthenticated(): boolean {
  return authVerified;
}

export const dataService = {
  // Teachers
  subscribeToTeachers: (callback: (teachers: Teacher[]) => void) => {
    const fetchTeachers = async () => {
      try {
        const teachers = await apiRequest<Teacher[]>('/teachers');
        callback(teachers);
      } catch (err: any) {
        console.error('Failed to fetch teachers:', err);
        // Only show toast once every few minutes to prevent spam
        const now = Date.now();
        if (!(window as any)._lastTeacherError || now - (window as any)._lastTeacherError > 60000) {
          toast.error(`Failed to fetch teachers: ${err.message || 'Connection error'}`);
          (window as any)._lastTeacherError = now;
        }
      }
    };
    fetchTeachers();
    const interval = setInterval(fetchTeachers, 30000); 
    return () => clearInterval(interval);
  },
  addTeacher: async (teacher: Omit<Teacher, 'id'>) => {
    return apiRequest<Teacher>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
  },
  updateTeacher: async (id: string, teacher: Partial<Teacher>) => {
    return apiRequest<Teacher>(`/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(teacher),
    });
  },
  deleteTeacher: async (id: string) => {
    return apiRequest<void>(`/teachers/${id}`, {
      method: 'DELETE',
    });
  },

  // Schools
  subscribeToSchools: (callback: (schools: School[]) => void) => {
    const fetchSchools = async () => {
      try {
        const { data } = await apiRequest<{ data: School[] }>('/schools?take=1000');
        callback(data);
      } catch (err: any) {
        console.error('Failed to fetch schools:', err);
        const now = Date.now();
        if (!(window as any)._lastSchoolError || now - (window as any)._lastSchoolError > 60000) {
          toast.error(`Failed to fetch schools: ${err.message || 'Connection error'}`);
          (window as any)._lastSchoolError = now;
        }
      }
    };
    fetchSchools();
    const interval = setInterval(fetchSchools, 60000);
    return () => clearInterval(interval);
  },
  addSchool: async (school: Omit<School, 'id'>) => {
    return apiRequest<School>('/schools', {
      method: 'POST',
      body: JSON.stringify(school),
    });
  },
  updateSchool: async (id: string, school: Partial<School>) => {
    return apiRequest<School>(`/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(school),
    });
  },
  deleteSchool: async (id: string) => {
    return apiRequest<void>(`/schools/${id}`, {
      method: 'DELETE',
    });
  },

  // Generic EMIS records
  _subscribeToEmis: <T>(entity: string, callback: (records: T[]) => void, intervalMs = 60000) => {
    const fetchData = async () => {
      try {
        const records = await apiRequest<T[]>(`/emis/${entity}`);
        callback(records);
      } catch (err: any) {
        console.error(`Failed to fetch ${entity}:`, err);
        const now = Date.now();
        const key = `_last${entity}Error`;
        if (!(window as any)[key] || now - (window as any)[key] > 60000) {
          toast.error(`Failed to fetch ${entity}: ${err.message || 'Connection error'}`);
          (window as any)[key] = now;
        }
      }
    };
    fetchData();
    const interval = setInterval(fetchData, intervalMs);
    return () => clearInterval(interval);
  },

  // Inspections
  subscribeToInspections: (callback: (inspections: Inspection[]) => void) => {
    return dataService._subscribeToEmis('inspections', callback);
  },
  addInspection: async (inspection: Omit<Inspection, 'id'>) => {
    return apiRequest<Inspection>('/emis/inspections', {
      method: 'POST',
      body: JSON.stringify(inspection),
    });
  },
  deleteInspection: async (id: string) => {
    return apiRequest<void>(`/emis/inspections/${id}`, {
      method: 'DELETE',
    });
  },
  updateInspection: async (id: string, inspection: Partial<Inspection>) => {
    return apiRequest<Inspection>(`/emis/inspections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(inspection),
    });
  },

  // TPD Programs
  subscribeToTPDPrograms: (callback: (programs: TPDProgram[]) => void) => {
    return dataService._subscribeToEmis('tpd-programs', callback);
  },
  addTPDProgram: async (program: Omit<TPDProgram, 'id'>) => {
    return apiRequest<TPDProgram>('/emis/tpd-programs', {
      method: 'POST',
      body: JSON.stringify(program),
    });
  },
  deleteTPDProgram: async (id: string) => {
    return apiRequest<void>(`/emis/tpd-programs/${id}`, {
      method: 'DELETE',
    });
  },
  updateTPDProgram: async (id: string, program: Partial<TPDProgram>) => {
    return apiRequest<TPDProgram>(`/emis/tpd-programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(program),
    });
  },

  // Resources
  subscribeToResources: (callback: (resources: Resource[]) => void) => {
    return dataService._subscribeToEmis('resources', callback);
  },
  addResource: async (resource: Omit<Resource, 'id'>) => {
    return apiRequest<Resource>('/emis/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  },
  deleteResource: async (id: string) => {
    return apiRequest<void>(`/emis/resources/${id}`, {
      method: 'DELETE',
    });
  },
  updateResource: async (id: string, resource: Partial<Resource>) => {
    return apiRequest<Resource>(`/emis/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(resource),
    });
  },

  // Examination Results
  subscribeToExaminationResults: (callback: (results: ExaminationResult[]) => void) => {
    return dataService._subscribeToEmis('examination-results', callback);
  },
  addExaminationResult: async (result: Omit<ExaminationResult, 'id'>) => {
    return apiRequest<ExaminationResult>('/emis/examination-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
  },

  // Exam Administration
  subscribeToExamAdministration: (callback: (admin: ExamAdministration[]) => void) => {
    return dataService._subscribeToEmis('exam-administration', callback);
  },
  addExamAdministration: async (admin: Omit<ExamAdministration, 'id'>) => {
    return apiRequest<ExamAdministration>('/emis/exam-administration', {
      method: 'POST',
      body: JSON.stringify(admin),
    });
  },
  deleteExamAdministration: async (id: string) => {
    return apiRequest<void>(`/emis/exam-administration/${id}`, {
      method: 'DELETE',
    });
  },

  // Transfers
  subscribeToTransfers: (callback: (transfers: Transfer[]) => void) => {
    return dataService._subscribeToEmis('transfer-history', callback);
  },
  addTransfer: async (transfer: Omit<Transfer, 'id'>) => {
    return apiRequest<Transfer>('/emis/transfer-history', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
  },
  updateTransfer: async (id: string, transfer: Partial<Transfer>) => {
    return apiRequest<Transfer>(`/emis/transfer-history/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(transfer),
    });
  },

  // Junior Results
  subscribeToJuniorResults: (callback: (results: JuniorResult[]) => void) => {
    return dataService._subscribeToEmis('junior-results', callback);
  },
  addJuniorResult: async (result: Omit<JuniorResult, 'id'>) => {
    return apiRequest<JuniorResult>('/emis/junior-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
  },
  updateJuniorResult: async (id: string, result: Partial<JuniorResult>) => {
    return apiRequest<JuniorResult>(`/emis/junior-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(result),
    });
  },
  deleteJuniorResult: async (id: string) => {
    return apiRequest<void>(`/emis/junior-results/${id}`, {
      method: 'DELETE',
    });
  },

  // Standardised Results
  subscribeToStandardisedResults: (callback: (results: StandardisedResult[]) => void) => {
    return dataService._subscribeToEmis('standardised-results', callback);
  },
  addStandardisedResult: async (result: Omit<StandardisedResult, 'id'>) => {
    return apiRequest<StandardisedResult>('/emis/standardised-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
  },
  updateStandardisedResult: async (id: string, result: Partial<StandardisedResult>) => {
    return apiRequest<StandardisedResult>(`/emis/standardised-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(result),
    });
  },
  deleteStandardisedResult: async (id: string) => {
    return apiRequest<void>(`/emis/standardised-results/${id}`, {
      method: 'DELETE',
    });
  },

  // PSLCE Data
  subscribeToPSLCEData: (callback: (data: PSLCEData[]) => void) => {
    return dataService._subscribeToEmis('pslce-data', callback);
  },
  addPSLCEData: async (data: Omit<PSLCEData, 'id'>) => {
    return apiRequest<PSLCEData>('/emis/pslce-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updatePSLCEData: async (id: string, data: Partial<PSLCEData>) => {
    return apiRequest<PSLCEData>(`/emis/pslce-data/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deletePSLCEData: async (id: string) => {
    return apiRequest<void>(`/emis/pslce-data/${id}`, {
      method: 'DELETE',
    });
  },

  // Daily Attendance
  addDailyAttendance: async (attendance: Omit<DailyAttendance, 'id'>) => {
    return apiRequest<DailyAttendance>('/emis/daily-attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
  },
  subscribeToDailyAttendance: (days: number, callback: (attendance: DailyAttendance[]) => void) => {
    const fetchData = async () => {
      try {
        const records = await apiRequest<DailyAttendance[]>(`/emis/daily-attendance?days=${days}`);
        callback(records);
      } catch (err) {
        console.error('Failed to fetch daily attendance:', err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  },

  // Monthly Enrolment
  addMonthlyEnrolment: async (enrolment: Omit<MonthlyEnrolment, 'id'>) => {
    return apiRequest<MonthlyEnrolment>('/emis/monthly-enrolment', {
      method: 'POST',
      body: JSON.stringify(enrolment),
    });
  },

  // IFA Report
  subscribeToIFAReports: (callback: (reports: IFAReport[]) => void) => {
    return dataService._subscribeToEmis('ifa-reports', callback);
  },
  addIFAReport: async (report: Omit<IFAReport, 'id'>) => {
    return apiRequest<IFAReport>('/emis/ifa-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // Teachers Return
  addTeachersReturn: async (report: Omit<TeachersReturn, 'id'>) => {
    return apiRequest<TeachersReturn>('/emis/teachers-returns', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // Termly Report
  addTermlyReport: async (report: Omit<TermlyReport, 'id'>) => {
    return apiRequest<TermlyReport>('/emis/termly-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
  },

  // Annual Census
  addAnnualCensus: async (census: Omit<AnnualCensus, 'id'>) => {
    return apiRequest<AnnualCensus>('/emis/annual-census', {
      method: 'POST',
      body: JSON.stringify(census),
    });
  },

  // Departments
  subscribeToDepartments: (callback: (departments: Department[]) => void) => {
    return dataService._subscribeToEmis('departments', callback);
  },
  addDepartment: async (department: Omit<Department, 'id'>) => {
    return apiRequest<Department>('/emis/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
  },
  updateDepartment: async (id: string, department: Partial<Department>) => {
    return apiRequest<Department>(`/emis/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(department),
    });
  },
  deleteDepartment: async (id: string) => {
    return apiRequest<void>(`/emis/departments/${id}`, {
      method: 'DELETE',
    });
  },

  // Officer Operations
  subscribeToOfficerOperations: (callback: (operations: OfficerOperation[]) => void) => {
    return dataService._subscribeToEmis('officer-operations', callback);
  },
  addOfficerOperation: async (operation: Omit<OfficerOperation, 'id'>) => {
    return apiRequest<OfficerOperation>('/emis/officer-operations', {
      method: 'POST',
      body: JSON.stringify(operation),
    });
  },
  updateOfficerOperation: async (id: string, operation: Partial<OfficerOperation>) => {
    return apiRequest<OfficerOperation>(`/emis/officer-operations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(operation),
    });
  },
  deleteOfficerOperation: async (id: string) => {
    return apiRequest<void>(`/emis/officer-operations/${id}`, {
      method: 'DELETE',
    });
  },

  // Leave Requests
  subscribeToLeaveRequests: (callback: (requests: LeaveRequest[]) => void) => {
    return dataService._subscribeToEmis('leave-requests', callback);
  },
  addLeaveRequest: async (request: Omit<LeaveRequest, 'id'>) => {
    return apiRequest<LeaveRequest>('/emis/leave-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  },
  updateLeaveRequest: async (id: string, request: Partial<LeaveRequest>) => {
    return apiRequest<LeaveRequest>(`/emis/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
  },

  // Advanced Inspections
  subscribeToAdvancedInspections: (callback: (inspections: AdvancedInspection[]) => void) => {
    const fetchInspections = async () => {
      try {
        const records = await apiRequest<AdvancedInspection[]>('/emis/inspections?isAdvanced=true');
        callback(records);
      } catch (err) {
        console.error('Failed to fetch advanced inspections:', err);
      }
    };
    fetchInspections();
    const interval = setInterval(fetchInspections, 60000);
    return () => clearInterval(interval);
  },
  addAdvancedInspection: async (inspection: Omit<AdvancedInspection, 'id'>) => {
    return apiRequest<AdvancedInspection>('/emis/inspections', {
      method: 'POST',
      body: JSON.stringify({ ...inspection, isAdvanced: true }),
    });
  },

  // NES Standards
  subscribeToNESStandards: (callback: (standards: NESStandard[]) => void) => {
    return dataService._subscribeToEmis('nes-standards', callback);
  },
  addNESStandard: async (standard: Omit<NESStandard, 'id'>) => {
    return apiRequest<NESStandard>('/emis/nes-standards', {
      method: 'POST',
      body: JSON.stringify(standard),
    });
  },
  
  // Continuous Assessment
  subscribeToContinuousAssessments: (callback: (cas: ContinuousAssessment[]) => void) => {
    return dataService._subscribeToEmis('continuous-assessments', callback);
  },
  addContinuousAssessment: async (ca: Omit<ContinuousAssessment, 'id'>) => {
    return apiRequest<ContinuousAssessment>('/emis/continuous-assessments', {
      method: 'POST',
      body: JSON.stringify(ca),
    });
  },
  deleteContinuousAssessment: async (id: string) => {
    return apiRequest<void>(`/emis/continuous-assessments/${id}`, {
      method: 'DELETE',
    });
  },

  // Maintenance Logs
  subscribeToMaintenanceLogs: (callback: (logs: MaintenanceLog[]) => void) => {
    return dataService._subscribeToEmis('maintenance-logs', callback);
  },
  addMaintenanceLog: async (log: Omit<MaintenanceLog, 'id'>) => {
    return apiRequest<MaintenanceLog>('/emis/maintenance-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
  },
  updateMaintenanceLog: async (id: string, log: Partial<MaintenanceLog>) => {
    return apiRequest<MaintenanceLog>(`/emis/maintenance-logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(log),
    });
  },

  // SMC Meetings
  subscribeToSMCMeetings: (callback: (meetings: SMCMeeting[]) => void) => {
    return dataService._subscribeToEmis('smc-meetings', callback);
  },
  addSMCMeeting: async (meeting: Omit<SMCMeeting, 'id'>) => {
    return apiRequest<SMCMeeting>('/emis/smc-meetings', {
      method: 'POST',
      body: JSON.stringify(meeting),
    });
  },

  // Learners
  subscribeToLearners: (callback: (learners: Learner[]) => void) => {
    const fetchLearners = async () => {
      try {
        const { data } = await apiRequest<{ data: Learner[] }>('/learners?take=1000');
        callback(data);
      } catch (err: any) {
        console.error('Failed to fetch learners:', err);
        const now = Date.now();
        if (!(window as any)._lastLearnerError || now - (window as any)._lastLearnerError > 60000) {
          toast.error(`Failed to fetch learners: ${err.message || 'Connection error'}`);
          (window as any)._lastLearnerError = now;
        }
      }
    };
    fetchLearners();
    const interval = setInterval(fetchLearners, 60000);
    return () => clearInterval(interval);
  },
  addLearner: async (learner: Omit<Learner, 'id'>) => {
    return apiRequest<Learner>('/learners', {
      method: 'POST',
      body: JSON.stringify(learner),
    });
  },
  updateLearner: async (id: string, learner: Partial<Learner>) => {
    return apiRequest<Learner>(`/learners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(learner),
    });
  },
  deleteLearner: async (id: string) => {
    return apiRequest<void>(`/learners/${id}`, {
      method: 'DELETE',
    });
  },

  // Promotion Records
  subscribeToPromotionRecords: (callback: (records: PromotionRecord[]) => void) => {
    return dataService._subscribeToEmis('promotion-records', callback);
  },
  addPromotionRecord: async (record: Omit<PromotionRecord, 'id'>) => {
    return apiRequest<any>('/emis/promotion-records', {
       method: 'POST',
       body: JSON.stringify(record),
    });
  },
  deletePromotionRecord: async (id: string) => {
    return apiRequest<void>(`/emis/promotion-records/${id}`, {
      method: 'DELETE',
    });
  },

  // Enrollment Stats
  subscribeToEnrollmentStats: (callback: (stats: EnrollmentStats[]) => void) => {
     return dataService._subscribeToEmis('enrollment-stats', callback);
  },
  addEnrollmentStats: async (stats: Omit<EnrollmentStats, 'id'>) => {
    return apiRequest<any>('/emis/enrollment-stats', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
  },
  deleteEnrollmentStats: async (id: string) => {
    return apiRequest<void>(`/emis/enrollment-stats/${id}`, {
      method: 'DELETE',
    });
  },

  // Audit Logs
  subscribeToAuditLogs: (callback: (logs: any[]) => void) => {
     return dataService._subscribeToEmis('audit-logs', callback);
  },
  getAllAuditLogs: async () => {
    return apiRequest<any[]>('/audit-logs');
  },
  getSubmissionAuditLogs: async (submissionId: string) => {
    return apiRequest<any[]>(`/submissions/${submissionId}/audit-logs`);
  },
  
  // Academic Years
  subscribeToAcademicYears: (callback: (years: AcademicYear[]) => void) => {
    return dataService._subscribeToEmis('academic-years', callback);
  },
  addAcademicYear: async (year: Omit<AcademicYear, 'id'>) => {
    return apiRequest<any>('/emis/academic-years', {
      method: 'POST',
      body: JSON.stringify(year),
    });
  },
  
  // Terms
  subscribeToTerms: (callback: (terms: Term[]) => void) => {
    return dataService._subscribeToEmis('terms', callback);
  },
  addTerm: async (term: Omit<Term, 'id'>) => {
    return apiRequest<any>('/emis/terms', {
      method: 'POST',
      body: JSON.stringify(term),
    });
  },
  
  // Standard Classes
  subscribeToStandardClasses: (callback: (classes: StandardClass[]) => void) => {
    return dataService._subscribeToEmis('standard-classes', callback);
  },
  addStandardClass: async (classData: Omit<StandardClass, 'id'>) => {
    return apiRequest<any>('/emis/standard-classes', {
      method: 'POST',
      body: JSON.stringify(classData),
    });
  },
  promoteAdmissionsToRegistry: async () => {
    return apiRequest<any>('/learners/promote-admissions', {
      method: 'POST',
    });
  },
  
  // System Settings
  getSystemSettings: async () => {
    try {
      const records = await apiRequest<SystemSettings[]>('/emis/system-settings');
      return records[0] || null;
    } catch (err) {
      console.error('Failed to get system settings:', err);
      return null;
    }
  },
  updateSystemSettings: async (settings: Partial<SystemSettings>) => {
    // Assuming one setting record
    const current = await dataService.getSystemSettings();
    if (current?.id) {
       return apiRequest<any>(`/emis/system-settings/${current.id}`, {
         method: 'PATCH',
         body: JSON.stringify(settings),
       });
    } else {
       return apiRequest<any>('/emis/system-settings', {
         method: 'POST',
         body: JSON.stringify(settings),
       });
    }
  },

  // Submissions (API-based)
  getSubmissions: async () => {
    return apiRequest<any>('/submissions');
  },
  addSubmission: async (submission: any) => {
    return apiRequest<any>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
  },
  updateSubmissionStatus: async (id: string, status: string, feedback?: string) => {
    return apiRequest<any>(`/submissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    });
  },
  editSubmissionByTDC: async (id: string, updatedData: any, reason: string) => {
    return apiRequest<any>(`/submissions/${id}/edit-by-tdc`, {
      method: 'PUT',
      body: JSON.stringify({ updatedData, reason }),
    });
  },
  getAllData: async () => {
    return apiRequest<any>('/emis/all-data');
  },

  // User Management (API-based)
  getUsers: async () => {
    return apiRequest<any>('/users');
  },
  createUser: async (userData: any) => {
    return apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  updateUser: async (id: string, userData: any) => {
    return apiRequest<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },
  deleteUser: async (id: string) => {
    return apiRequest<any>(`/users/${id}`, {
      method: 'DELETE',
    });
  }
};
