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

// Subscription registry for auto-refresh after mutations
type DataCallback<T> = (data: T) => void;
interface SubscriptionEntry {
  fetchFn: () => Promise<void>;
  callbacks: Set<DataCallback<any>>;
  intervalId: ReturnType<typeof setInterval>;
}
const subscriptionRegistry: Record<string, SubscriptionEntry> = {};

// Broadcast data change to trigger immediate refresh
function broadcastDataChange(entity: string) {
  const entry = subscriptionRegistry[entity];
  if (entry) {
    entry.fetchFn();
  }
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
  // Authentication
  getCurrentUser: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
    if (!res.ok) return null;
    return res.json();
  },
  login: async (email: string, password: string) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }
    const data = await res.json();
    resetAuthVerification();
    window.dispatchEvent(new Event('auth:changed'));
    return data;
  },
  signup: async (email: string, password: string, name: string) => {
    const res = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Signup failed' }));
      throw new Error(error.message || 'Signup failed');
    }
    const data = await res.json();
    resetAuthVerification();
    window.dispatchEvent(new Event('auth:changed'));
    return data;
  },
  logout: async () => {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' });
    resetAuthVerification();
    clearLegacyTokens();
    window.dispatchEvent(new Event('auth:changed'));
  },

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
    const result = await apiRequest<Teacher>('/teachers', {
      method: 'POST',
      body: JSON.stringify(teacher),
    });
    broadcastDataChange('teachers');
    return result;
  },
  updateTeacher: async (id: string, teacher: Partial<Teacher>) => {
    const result = await apiRequest<Teacher>(`/teachers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(teacher),
    });
    broadcastDataChange('teachers');
    return result;
  },
  deleteTeacher: async (id: string) => {
    const result = await apiRequest<void>(`/teachers/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('teachers');
    return result;
  },

  // Schools
  subscribeToSchools: (callback: (schools: School[]) => void) => {
    const entity = 'schools';
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
    
    if (!subscriptionRegistry[entity]) {
      subscriptionRegistry[entity] = {
        fetchFn: fetchSchools,
        callbacks: new Set(),
        intervalId: setInterval(fetchSchools, 60000)
      };
    }
    subscriptionRegistry[entity].callbacks.add(callback);
    
    fetchSchools();
    return () => {
      subscriptionRegistry[entity].callbacks.delete(callback);
      if (subscriptionRegistry[entity].callbacks.size === 0) {
        clearInterval(subscriptionRegistry[entity].intervalId);
        delete subscriptionRegistry[entity];
      }
    };
  },
  addSchool: async (school: Omit<School, 'id'>) => {
    const result = await apiRequest<School>('/schools', {
      method: 'POST',
      body: JSON.stringify(school),
    });
    broadcastDataChange('schools');
    return result;
  },
  updateSchool: async (id: string, school: Partial<School>) => {
    const result = await apiRequest<School>(`/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(school),
    });
    broadcastDataChange('schools');
    return result;
  },
  deleteSchool: async (id: string) => {
    const result = await apiRequest<void>(`/schools/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('schools');
    return result;
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
    
    // Register in subscription registry for auto-refresh after mutations
    if (!subscriptionRegistry[entity]) {
      subscriptionRegistry[entity] = {
        fetchFn: fetchData,
        callbacks: new Set(),
        intervalId: setInterval(fetchData, intervalMs)
      };
    }
    subscriptionRegistry[entity].callbacks.add(callback);
    
    fetchData();
    return () => {
      subscriptionRegistry[entity].callbacks.delete(callback);
      if (subscriptionRegistry[entity].callbacks.size === 0) {
        clearInterval(subscriptionRegistry[entity].intervalId);
        delete subscriptionRegistry[entity];
      }
    };
  },

  // Inspections
  subscribeToInspections: (callback: (inspections: Inspection[]) => void) => {
    return dataService._subscribeToEmis('inspections', callback);
  },
  addInspection: async (inspection: Omit<Inspection, 'id'>) => {
    const result = await apiRequest<Inspection>('/emis/inspections', {
      method: 'POST',
      body: JSON.stringify(inspection),
    });
    broadcastDataChange('inspections');
    return result;
  },
  deleteInspection: async (id: string) => {
    const result = await apiRequest<void>(`/emis/inspections/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('inspections');
    return result;
  },
  updateInspection: async (id: string, inspection: Partial<Inspection>) => {
    const result = await apiRequest<Inspection>(`/emis/inspections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(inspection),
    });
    broadcastDataChange('inspections');
    return result;
  },

  // TPD Programs
  subscribeToTPDPrograms: (callback: (programs: TPDProgram[]) => void) => {
    return dataService._subscribeToEmis('tpd-programs', callback);
  },
  addTPDProgram: async (program: Omit<TPDProgram, 'id'>) => {
    const result = await apiRequest<TPDProgram>('/emis/tpd-programs', {
      method: 'POST',
      body: JSON.stringify(program),
    });
    broadcastDataChange('tpd-programs');
    return result;
  },
  deleteTPDProgram: async (id: string) => {
    const result = await apiRequest<void>(`/emis/tpd-programs/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('tpd-programs');
    return result;
  },
  updateTPDProgram: async (id: string, program: Partial<TPDProgram>) => {
    const result = await apiRequest<TPDProgram>(`/emis/tpd-programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(program),
    });
    broadcastDataChange('tpd-programs');
    return result;
  },

  // Resources
  subscribeToResources: (callback: (resources: Resource[]) => void) => {
    return dataService._subscribeToEmis('resources', callback);
  },
  addResource: async (resource: Omit<Resource, 'id'>) => {
    const result = await apiRequest<Resource>('/emis/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
    broadcastDataChange('resources');
    return result;
  },
  deleteResource: async (id: string) => {
    const result = await apiRequest<void>(`/emis/resources/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('resources');
    return result;
  },
  updateResource: async (id: string, resource: Partial<Resource>) => {
    const result = await apiRequest<Resource>(`/emis/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(resource),
    });
    broadcastDataChange('resources');
    return result;
  },

  // Examination Results
  subscribeToExaminationResults: (callback: (results: ExaminationResult[]) => void) => {
    return dataService._subscribeToEmis('examination-results', callback);
  },
  addExaminationResult: async (result: Omit<ExaminationResult, 'id'>) => {
    const res = await apiRequest<ExaminationResult>('/emis/examination-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
    broadcastDataChange('examination-results');
    return res;
  },

  // Exam Administration
  subscribeToExamAdministration: (callback: (admin: ExamAdministration[]) => void) => {
    return dataService._subscribeToEmis('exam-administration', callback);
  },
  addExamAdministration: async (admin: Omit<ExamAdministration, 'id'>) => {
    const result = await apiRequest<ExamAdministration>('/emis/exam-administration', {
      method: 'POST',
      body: JSON.stringify(admin),
    });
    broadcastDataChange('exam-administration');
    return result;
  },
  deleteExamAdministration: async (id: string) => {
    const result = await apiRequest<void>(`/emis/exam-administration/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('exam-administration');
    return result;
  },

  // Transfers
  subscribeToTransfers: (callback: (transfers: Transfer[]) => void) => {
    return dataService._subscribeToEmis('transfer-history', callback);
  },
  addTransfer: async (transfer: Omit<Transfer, 'id'>) => {
    const result = await apiRequest<Transfer>('/emis/transfer-history', {
      method: 'POST',
      body: JSON.stringify(transfer),
    });
    broadcastDataChange('transfer-history');
    return result;
  },
  updateTransfer: async (id: string, transfer: Partial<Transfer>) => {
    const result = await apiRequest<Transfer>(`/emis/transfer-history/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(transfer),
    });
    broadcastDataChange('transfer-history');
    return result;
  },

  // Junior Results
  subscribeToJuniorResults: (callback: (results: JuniorResult[]) => void) => {
    return dataService._subscribeToEmis('junior-results', callback);
  },
  addJuniorResult: async (result: Omit<JuniorResult, 'id'>) => {
    const res = await apiRequest<JuniorResult>('/emis/junior-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
    broadcastDataChange('junior-results');
    return res;
  },
  updateJuniorResult: async (id: string, result: Partial<JuniorResult>) => {
    const res = await apiRequest<JuniorResult>(`/emis/junior-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(result),
    });
    broadcastDataChange('junior-results');
    return res;
  },
  deleteJuniorResult: async (id: string) => {
    const result = await apiRequest<void>(`/emis/junior-results/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('junior-results');
    return result;
  },

  // Standardised Results
  subscribeToStandardisedResults: (callback: (results: StandardisedResult[]) => void) => {
    return dataService._subscribeToEmis('standardised-results', callback);
  },
  addStandardisedResult: async (result: Omit<StandardisedResult, 'id'>) => {
    const res = await apiRequest<StandardisedResult>('/emis/standardised-results', {
      method: 'POST',
      body: JSON.stringify(result),
    });
    broadcastDataChange('standardised-results');
    return res;
  },
  updateStandardisedResult: async (id: string, result: Partial<StandardisedResult>) => {
    const res = await apiRequest<StandardisedResult>(`/emis/standardised-results/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(result),
    });
    broadcastDataChange('standardised-results');
    return res;
  },
  deleteStandardisedResult: async (id: string) => {
    const result = await apiRequest<void>(`/emis/standardised-results/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('standardised-results');
    return result;
  },

  // PSLCE Data
  subscribeToPSLCEData: (callback: (data: PSLCEData[]) => void) => {
    return dataService._subscribeToEmis('pslce-data', callback);
  },
  addPSLCEData: async (data: Omit<PSLCEData, 'id'>) => {
    const result = await apiRequest<PSLCEData>('/emis/pslce-data', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updatePSLCEData: async (id: string, data: Partial<PSLCEData>) => {
    const result = await apiRequest<PSLCEData>(`/emis/pslce-data/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    broadcastDataChange('pslce-data');
    return result;
  },
  deletePSLCEData: async (id: string) => {
    const result = await apiRequest<void>(`/emis/pslce-data/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('pslce-data');
    return result;
  },

  // Daily Attendance
  addDailyAttendance: async (attendance: Omit<DailyAttendance, 'id'>) => {
    const result = await apiRequest<DailyAttendance>('/emis/daily-attendance', {
      method: 'POST',
      body: JSON.stringify(attendance),
    });
    broadcastDataChange('daily-attendance');
    return result;
  },
  subscribeToDailyAttendance: (days: number, callback: (attendance: DailyAttendance[]) => void) => {
    const entity = 'daily-attendance';
    const fetchData = async () => {
      try {
        const records = await apiRequest<DailyAttendance[]>(`/emis/daily-attendance?days=${days}`);
        callback(records);
      } catch (err) {
        console.error('Failed to fetch daily attendance:', err);
      }
    };
    
    // Register in subscription registry for auto-refresh after mutations
    if (!subscriptionRegistry[entity]) {
      subscriptionRegistry[entity] = {
        fetchFn: fetchData,
        callbacks: new Set(),
        intervalId: setInterval(fetchData, 60000)
      };
    }
    subscriptionRegistry[entity].callbacks.add(callback);
    
    fetchData();
    return () => {
      subscriptionRegistry[entity].callbacks.delete(callback);
      if (subscriptionRegistry[entity].callbacks.size === 0) {
        clearInterval(subscriptionRegistry[entity].intervalId);
        delete subscriptionRegistry[entity];
      }
    };
  },

  // Monthly Enrolment
  addMonthlyEnrolment: async (enrolment: Omit<MonthlyEnrolment, 'id'>) => {
    const result = await apiRequest<MonthlyEnrolment>('/emis/monthly-enrolment', {
      method: 'POST',
      body: JSON.stringify(enrolment),
    });
    broadcastDataChange('monthly-enrolment');
    return result;
  },

  // IFA Report
  subscribeToIFAReports: (callback: (reports: IFAReport[]) => void) => {
    return dataService._subscribeToEmis('ifa-reports', callback);
  },
  addIFAReport: async (report: Omit<IFAReport, 'id'>) => {
    const result = await apiRequest<IFAReport>('/emis/ifa-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
    broadcastDataChange('ifa-reports');
    return result;
  },

  // Teachers Return
  addTeachersReturn: async (report: Omit<TeachersReturn, 'id'>) => {
    const result = await apiRequest<TeachersReturn>('/emis/teachers-returns', {
      method: 'POST',
      body: JSON.stringify(report),
    });
    broadcastDataChange('teachers-returns');
    return result;
  },

  // Termly Report
  addTermlyReport: async (report: Omit<TermlyReport, 'id'>) => {
    const result = await apiRequest<TermlyReport>('/emis/termly-reports', {
      method: 'POST',
      body: JSON.stringify(report),
    });
    broadcastDataChange('termly-reports');
    return result;
  },

  // Annual Census
  addAnnualCensus: async (census: Omit<AnnualCensus, 'id'>) => {
    const result = await apiRequest<AnnualCensus>('/emis/annual-census', {
      method: 'POST',
      body: JSON.stringify(census),
    });
    broadcastDataChange('annual-census');
    return result;
  },

  // Departments
  subscribeToDepartments: (callback: (departments: Department[]) => void) => {
    return dataService._subscribeToEmis('departments', callback);
  },
  addDepartment: async (department: Omit<Department, 'id'>) => {
    const result = await apiRequest<Department>('/emis/departments', {
      method: 'POST',
      body: JSON.stringify(department),
    });
    broadcastDataChange('departments');
    return result;
  },
  updateDepartment: async (id: string, department: Partial<Department>) => {
    const result = await apiRequest<Department>(`/emis/departments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(department),
    });
    broadcastDataChange('departments');
    return result;
  },
  deleteDepartment: async (id: string) => {
    const result = await apiRequest<void>(`/emis/departments/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('departments');
    return result;
  },

  // Officer Operations
  subscribeToOfficerOperations: (callback: (operations: OfficerOperation[]) => void) => {
    return dataService._subscribeToEmis('officer-operations', callback);
  },
  addOfficerOperation: async (operation: Omit<OfficerOperation, 'id'>) => {
    const result = await apiRequest<OfficerOperation>('/emis/officer-operations', {
      method: 'POST',
      body: JSON.stringify(operation),
    });
    broadcastDataChange('officer-operations');
    return result;
  },
  updateOfficerOperation: async (id: string, operation: Partial<OfficerOperation>) => {
    const result = await apiRequest<OfficerOperation>(`/emis/officer-operations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(operation),
    });
    broadcastDataChange('officer-operations');
    return result;
  },
  deleteOfficerOperation: async (id: string) => {
    const result = await apiRequest<void>(`/emis/officer-operations/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('officer-operations');
    return result;
  },

  // Leave Requests
  subscribeToLeaveRequests: (callback: (requests: LeaveRequest[]) => void) => {
    return dataService._subscribeToEmis('leave-requests', callback);
  },
  addLeaveRequest: async (request: Omit<LeaveRequest, 'id'>) => {
    const result = await apiRequest<LeaveRequest>('/emis/leave-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    broadcastDataChange('leave-requests');
    return result;
  },
  updateLeaveRequest: async (id: string, request: Partial<LeaveRequest>) => {
    const result = await apiRequest<LeaveRequest>(`/emis/leave-requests/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(request),
    });
    broadcastDataChange('leave-requests');
    return result;
  },

  // Advanced Inspections
  subscribeToAdvancedInspections: (callback: (inspections: AdvancedInspection[]) => void) => {
    const entity = 'advanced-inspections';
    const fetchInspections = async () => {
      try {
        const records = await apiRequest<AdvancedInspection[]>('/emis/inspections?isAdvanced=true');
        callback(records);
      } catch (err) {
        console.error('Failed to fetch advanced inspections:', err);
      }
    };
    
    if (!subscriptionRegistry[entity]) {
      subscriptionRegistry[entity] = {
        fetchFn: fetchInspections,
        callbacks: new Set(),
        intervalId: setInterval(fetchInspections, 60000)
      };
    }
    subscriptionRegistry[entity].callbacks.add(callback);
    
    fetchInspections();
    return () => {
      subscriptionRegistry[entity].callbacks.delete(callback);
      if (subscriptionRegistry[entity].callbacks.size === 0) {
        clearInterval(subscriptionRegistry[entity].intervalId);
        delete subscriptionRegistry[entity];
      }
    };
  },
  addAdvancedInspection: async (inspection: Omit<AdvancedInspection, 'id'>) => {
    const result = await apiRequest<AdvancedInspection>('/emis/inspections', {
      method: 'POST',
      body: JSON.stringify({ ...inspection, isAdvanced: true }),
    });
    broadcastDataChange('advanced-inspections');
    return result;
  },

  // NES Standards
  subscribeToNESStandards: (callback: (standards: NESStandard[]) => void) => {
    return dataService._subscribeToEmis('nes-standards', callback);
  },
  addNESStandard: async (standard: Omit<NESStandard, 'id'>) => {
    const result = await apiRequest<NESStandard>('/emis/nes-standards', {
      method: 'POST',
      body: JSON.stringify(standard),
    });
    broadcastDataChange('nes-standards');
    return result;
  },
  
  // Continuous Assessment
  subscribeToContinuousAssessments: (callback: (cas: ContinuousAssessment[]) => void) => {
    return dataService._subscribeToEmis('continuous-assessments', callback);
  },
  addContinuousAssessment: async (ca: Omit<ContinuousAssessment, 'id'>) => {
    const result = await apiRequest<ContinuousAssessment>('/emis/continuous-assessments', {
      method: 'POST',
      body: JSON.stringify(ca),
    });
    broadcastDataChange('continuous-assessments');
    return result;
  },
  deleteContinuousAssessment: async (id: string) => {
    const result = await apiRequest<void>(`/emis/continuous-assessments/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('continuous-assessments');
    return result;
  },

  // Maintenance Logs
  subscribeToMaintenanceLogs: (callback: (logs: MaintenanceLog[]) => void) => {
    return dataService._subscribeToEmis('maintenance-logs', callback);
  },
  addMaintenanceLog: async (log: Omit<MaintenanceLog, 'id'>) => {
    const result = await apiRequest<MaintenanceLog>('/emis/maintenance-logs', {
      method: 'POST',
      body: JSON.stringify(log),
    });
    broadcastDataChange('maintenance-logs');
    return result;
  },
  updateMaintenanceLog: async (id: string, log: Partial<MaintenanceLog>) => {
    const result = await apiRequest<MaintenanceLog>(`/emis/maintenance-logs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(log),
    });
    broadcastDataChange('maintenance-logs');
    return result;
  },

  // SMC Meetings
  subscribeToSMCMeetings: (callback: (meetings: SMCMeeting[]) => void) => {
    return dataService._subscribeToEmis('smc-meetings', callback);
  },
  addSMCMeeting: async (meeting: Omit<SMCMeeting, 'id'>) => {
    const result = await apiRequest<SMCMeeting>('/emis/smc-meetings', {
      method: 'POST',
      body: JSON.stringify(meeting),
    });
    broadcastDataChange('smc-meetings');
    return result;
  },

  // Learners
  subscribeToLearners: (callback: (learners: Learner[]) => void) => {
    const entity = 'learners';
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
    
    if (!subscriptionRegistry[entity]) {
      subscriptionRegistry[entity] = {
        fetchFn: fetchLearners,
        callbacks: new Set(),
        intervalId: setInterval(fetchLearners, 60000)
      };
    }
    subscriptionRegistry[entity].callbacks.add(callback);
    
    fetchLearners();
    return () => {
      subscriptionRegistry[entity].callbacks.delete(callback);
      if (subscriptionRegistry[entity].callbacks.size === 0) {
        clearInterval(subscriptionRegistry[entity].intervalId);
        delete subscriptionRegistry[entity];
      }
    };
  },
  addLearner: async (learner: Omit<Learner, 'id'>) => {
    const result = await apiRequest<Learner>('/learners', {
      method: 'POST',
      body: JSON.stringify(learner),
    });
    broadcastDataChange('learners');
    return result;
  },
  updateLearner: async (id: string, learner: Partial<Learner>) => {
    const result = await apiRequest<Learner>(`/learners/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(learner),
    });
    broadcastDataChange('learners');
    return result;
  },
  deleteLearner: async (id: string) => {
    const result = await apiRequest<void>(`/learners/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('learners');
    return result;
  },

  // Promotion Records
  subscribeToPromotionRecords: (callback: (records: PromotionRecord[]) => void) => {
    return dataService._subscribeToEmis('promotion-records', callback);
  },
  addPromotionRecord: async (record: Omit<PromotionRecord, 'id'>) => {
    const result = await apiRequest<any>('/emis/promotion-records', {
       method: 'POST',
       body: JSON.stringify(record),
    });
    broadcastDataChange('promotion-records');
    return result;
  },
  deletePromotionRecord: async (id: string) => {
    const result = await apiRequest<void>(`/emis/promotion-records/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('promotion-records');
    return result;
  },

  // Enrollment Stats
  subscribeToEnrollmentStats: (callback: (stats: EnrollmentStats[]) => void) => {
     return dataService._subscribeToEmis('enrollment-stats', callback);
  },
  addEnrollmentStats: async (stats: Omit<EnrollmentStats, 'id'>) => {
    const result = await apiRequest<any>('/emis/enrollment-stats', {
      method: 'POST',
      body: JSON.stringify(stats),
    });
    broadcastDataChange('enrollment-stats');
    return result;
  },
  deleteEnrollmentStats: async (id: string) => {
    const result = await apiRequest<void>(`/emis/enrollment-stats/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('enrollment-stats');
    return result;
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
    const result = await apiRequest<any>('/emis/academic-years', {
      method: 'POST',
      body: JSON.stringify(year),
    });
    broadcastDataChange('academic-years');
    return result;
  },
  
  // Terms
  subscribeToTerms: (callback: (terms: Term[]) => void) => {
    return dataService._subscribeToEmis('terms', callback);
  },
  addTerm: async (term: Omit<Term, 'id'>) => {
    const result = await apiRequest<any>('/emis/terms', {
      method: 'POST',
      body: JSON.stringify(term),
    });
    broadcastDataChange('terms');
    return result;
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
  getSubmission: async (id: string) => {
    return apiRequest<any>(`/submissions/${id}`);
  },
  addSubmission: async (submission: any) => {
    const result = await apiRequest<any>('/submissions', {
      method: 'POST',
      body: JSON.stringify(submission),
    });
    broadcastDataChange('submissions');
    return result;
  },
  updateSubmissionStatus: async (id: string, status: string, feedback?: string) => {
    const result = await apiRequest<any>(`/submissions/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, feedback }),
    });
    broadcastDataChange('submissions');
    return result;
  },
  editSubmissionByTDC: async (id: string, updatedData: any, reason: string) => {
    const result = await apiRequest<any>(`/submissions/${id}/edit-by-tdc`, {
      method: 'PUT',
      body: JSON.stringify({ updatedData, reason }),
    });
    broadcastDataChange('submissions');
    return result;
  },
  getAllData: async () => {
    return apiRequest<any>('/emis/all-data');
  },

  // User Management (API-based)
  getUsers: async () => {
    return apiRequest<any>('/users');
  },
  createUser: async (userData: any) => {
    const result = await apiRequest<any>('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    broadcastDataChange('users');
    return result;
  },
  updateUser: async (id: string, userData: any) => {
    const result = await apiRequest<any>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
    broadcastDataChange('users');
    return result;
  },
  deleteUser: async (id: string) => {
    const result = await apiRequest<any>(`/users/${id}`, {
      method: 'DELETE',
    });
    broadcastDataChange('users');
    return result;
  }
};
