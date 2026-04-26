export interface Teacher {
  id: string;
  emisCode: string;
  firstName: string;
  lastName: string;
  nationalId: string;
  employmentNumber?: string;
  registrationNumber?: string;
  tcmRegistrationNumber?: string;
  licenseNumber?: string;
  licenseExpiryDate?: string;
  teachingStandard?: string;
  responsibility?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  retirementDate?: string;
  qualification: string;
  specialization: string;
  schoolId: string;
  status: 'Active' | 'Inactive' | 'Deceased' | 'On Leave' | 'Transferred' | 'Retired';
  
  // Malawi Specific Fields
  grade?: string;
  dateOfFirstAppointment?: string;
  dateOfPresentStandard?: string;
  remarks?: string;
  teachingClass?: string;
  
  // Detailed Profile Fields
  email?: string;
  phone?: string;
  address?: string;
  joiningDate?: string;
  yearsOfExperience?: number;
  subjects?: string[];
  standards?: string[];
  
  professionalInfo?: {
    rank?: string;
    salaryGrade?: string;
    lastPromotionDate?: string;
    probationStatus?: 'Probation' | 'Confirmed';
  };
  
  tpdHistory?: {
    id: string;
    programTitle: string;
    date: string;
    certificateUrl?: string;
  }[];
  
  performanceHistory?: {
    year: string;
    rating: number;
    comments: string;
    supervisor: string;
  }[];

  transferHistory?: {
    id: string;
    fromSchool: string;
    toSchool: string;
    date: string;
    reason: string;
    status: string;
  }[];
  
  leaveRecords?: {
    id: string;
    type: string;
    startDate: string;
    endDate: string;
    duration: number;
    reason?: string;
    status: string;
  }[];
  
  achievementRecords?: {
    id: string;
    title: string;
    date: string;
    type: string;
    description: string;
  }[];

  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }[];

  audit?: {
    changeLog: {
      id: string;
      date: string;
      user: string;
      action: string;
    }[];
  };

  createdAt: string;
  updatedAt: string;
}

export interface Learner {
  id: string;
  schoolId: string;
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  standard: string;
  admissionNumber?: string;
  admissionDate?: string;
  status: 'Active' | 'Transferred' | 'Dropped' | 'Graduated' | 'BackToSchool';
  isAdmission?: boolean;
  isSNE: boolean;
  sneType?: string;
  disabilityType?: string;
  guardianName: string;
  guardianPhone: string;
  address: string;
  enrollmentDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromotionRecord {
  id: string;
  schoolId: string;
  academicYear: string;
  standard: string;
  promoted: number;
  repeated: number;
  droppedOut: number;
  promotedBoys?: number;
  promotedGirls?: number;
  repeatedBoys?: number;
  repeatedGirls?: number;
  droppedBoys?: number;
  droppedGirls?: number;
  createdAt?: string;
}

export interface EnrollmentStats {
  id: string;
  schoolId: string;
  academicYear: string;
  standard: string;
  boys: number;
  girls: number;
  transfersIn: number;
  transfersOut: number;
  dropouts: number;
  backToSchoolBoys?: number;
  backToSchoolGirls?: number;
  createdAt?: string;
}

export interface School {
  id: string;
  emisCode: string;
  name: string;
  zone: string;
  type: 'Primary' | 'Secondary' | 'CDSS' | 'Private';
  primarySubCategory?: 'Full Primary' | 'Junior Primary';
  juniorPrimaryRange?: 'Standard 1-4' | 'Standard 1-7';
  ownership: 'Government' | 'Grant-aided' | 'Private';
  yearEstablished: number;
  registrationStatus: 'Registered' | 'Pending' | 'Not Registered';
  moeRegistrationNumber?: string;
  religiousAffiliation?: string;
  motto?: string;
  vision?: string;
  mission?: string;
  coreValues?: string[];
  
  // Flattened location fields (available at top level from Prisma)
  district?: string;
  tdc?: string;
  traditionalAuthority?: string;
  latitude?: number;
  longitude?: number;
  physicalAddress?: string;
  
  location?: {
    district?: string;
    tdc?: string;
    traditionalAuthority?: string;
    latitude?: number;
    longitude?: number;
    physicalAddress?: string;
    zone?: string;
    distanceToDEM?: number;
    distanceToClusterLead?: number;
    nearestHealthFacility?: string;
    distanceToHealthFacility?: number;
    nearestPoliceStation?: string;
    distanceToPoliceStation?: number;
    nearestTradingCenter?: string;
    roadAccessType?: string;
    accessibility?: {
      roadType?: string;
      distanceFromMainRoad?: number;
    };
  };

  administration?: {
    headteacher?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    deputyHeadteacher?: {
      name?: string;
      phone?: string;
      email?: string;
    };
    smc_pta?: string;
    boardOfGovernors?: string;
    studentCouncil?: string;
  };

  enrollment?: {
    total: number;
    byStandard: {
      [standard: string]: {
        boys: number;
        girls: number;
      };
    };
    newAdmissions: number;
    transfersIn: number;
    transfersOut: number;
    dropouts: number;
  };

  staff?: {
    totalTeachers: number;
    qualifiedTeachers: number;
    unqualifiedTeachers: number;
    distribution: string;
    teacherRanks?: string;
    teachersHoused?: number;
    teachersCommuting?: number;
    supportStaff: {
      total: number;
      clerks: number;
      guards: number;
      groundskeepers: number;
      others: number;
    };
  };

  infrastructure?: {
    classrooms: number;
    classroomsPermanent?: number;
    classroomsTemporary?: number;
    classroomsOpenAir?: number;
    staffHouses: number;
    housesGood?: number;
    housesMinorRepairs?: number;
    housesMajorRepairs?: number;
    housesDilapidated?: number;
    toiletsBoys: number;
    toiletsGirls: number;
    toiletsTeachers: number;
    hasLibrary: boolean;
    hasLaboratory: boolean;
    hasICTRoom: boolean;
    hasElectricity: boolean;
    powerSource?: 'ESCOM' | 'Solar' | 'Generator' | 'None';
    hasInternet?: boolean;
    hasFence?: boolean;
    hasPlayground?: boolean;
    hasKitchen?: boolean;
    waterSource: string;
    condition: 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Dilapidated';
  };

  materials?: {
    pupilBookRatio: string;
    textbooks: number;
    exerciseBooks: number;
    consumables: string;
    desks: number;
    chairs: number;
    teachingAids: string;
    scienceKits?: number;
    agricultureTools?: string;
    sportsEquipment?: string;
    libraryBooks?: number;
  };

  timetable?: {
    calendar: string;
    startTime: string;
    endTime: string;
    sessionType: string;
    dailySchedule: string;
  };

  performance?: {
    passRate: number;
    nationalRank?: string;
    nationalExamResults: string;
    topSubjects: string;
    trend: string;
    comments: string;
    pslceResults?: string;
    jceResults?: string;
    msceResults?: string;
  };

  finance?: {
    fundingSources: string;
    schoolGrants: string;
    sigStatus?: string;
    auditStatus?: string;
    budgetUtilization?: number;
    sigBudgetUtilization?: {
      desksRepaired?: number;
      classroomsMaintained?: number;
      teachersHousesMaintained?: number;
      toiletsMaintained?: number;
      textbooksPurchased?: number;
      learnersTokens?: number;
      ovcsSupported?: number;
      teachersTokens?: number;
      infrastructureElectrified?: number;
      washBoreholesRepaired?: number;
    };
    tuitionFees?: string;
    incomeExpenditure: string;
    assets: string;
    communityContributions?: string;
    otherGrants?: string;
  };

  attendance?: {
    studentRate: number;
    teacherRate: number;
    lateArrivals: number;
    absenteeismReasons: string;
    mitigation: string;
    currentTerm?: string;
  };

  health?: {
    waterSource: string;
    feedingProgram: string;
    healthServices: string;
    sanitationStatus: string;
    lastInspected?: string;
    hasSchoolGarden?: boolean;
    dewormingFrequency?: string;
    sanitaryPadProvision?: boolean;
    handwashingStations?: number;
  };

  programs?: {
    clubs: string;
    specialPrograms: string;
    ngoSupport: string;
    lastReview?: string;
    sportsAndGames?: string;
  };

  documents?: {
    id: string;
    name: string;
    url: string;
    type: string;
    size: string;
    uploadDate: string;
    status: string;
  }[];

  audit?: {
    changeLog: {
      id: string;
      date: string;
      timestamp: string;
      user: string;
      action: string;
      type: string;
    }[];
    inspectionHistory: {
      date: string;
      inspector: string;
      status: string;
      notes: string;
      score: number;
    }[];
  };

  createdAt: string;
}

export interface DailyAttendance {
  id: string;
  schoolId: string;
  date: string;
  learners: {
    present: { boys: number; girls: number };
    absent: { boys: number; girls: number };
    reasons: { [reason: string]: number };
  };
  teachers: {
    present: { male: number; female: number };
    absent: { male: number; female: number };
    onLeave: number;
    late: number;
  };
  submittedBy: string;
  createdAt: string;
}

export interface MonthlyEnrolment {
  id: string;
  schoolId: string;
  month: string; // YYYY-MM
  year: number;
  enrolment: {
    [standard: string]: {
      boys: number;
      girls: number;
    };
  };
  newAdmissions: number;
  transfersIn: number;
  transfersOut: number;
  dropouts: {
    boys: number;
    girls: number;
    reasons: { [reason: string]: number };
  };
  submittedBy: string;
  createdAt: string;
}

export interface IFAReport {
  id: string;
  schoolId: string;
  month: string;
  year: number;
  girls6to9: { received: number; target: number };
  boys6to12: { received: number; target: number };
  girls10to12: { received: number; target: number };
  stockBalance: number;
  remarks: string;
  submittedBy: string;
  createdAt: string;
}

export interface TeachersReturn {
  id: string;
  schoolId: string;
  month: string;
  year: number;
  teachers: {
    teacherId: string;
    name: string;
    sex: string;
    standard: string;
    empNo: string;
    dob: string;
    regNo: string;
    highestQualification: string;
    dofa: string;
    dateOfPresentStandard: string;
    homeAddress: string;
    daysPresent: number;
    daysAbsent: number;
    remarks: string;
  }[];
  submittedBy: string;
  createdAt: string;
}

export interface TermlyReport {
  id: string;
  schoolId: string;
  term: 1 | 2 | 3;
  year: number;
  academicPerformance: {
    standard: string;
    avgScore: number;
    passRate: number;
  }[];
  activities: string[];
  challenges: string[];
  submittedBy: string;
  createdAt: string;
}

export interface AnnualCensus {
  id: string;
  schoolId: string;
  year: number;
  infrastructure: {
    classrooms: { good: number; fair: number; poor: number };
    toilets: { boys: number; girls: number; teachers: number };
    houses: number;
  };
  materials: {
    desks: number;
    textbooks: number;
  };
  staffing: {
    qualified: number;
    unqualified: number;
  };
  submittedBy: string;
  createdAt: string;
}

export interface Transfer {
  id: string;
  teacherId: string;
  fromSchoolId: string;
  toSchoolId: string;
  requestDate: string;
  effectiveDate?: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Completed';
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExaminationResult {
  id: string;
  schoolId: string;
  year: number;
  examType: 'PSLCE' | 'JCE' | 'MSCE' | 'Standard 8' | 'Standard 4';
  candidates: {
    total: number;
    boys: number;
    girls: number;
  };
  passed: {
    total: number;
    boys: number;
    girls: number;
  };
  standards: {
    [standard: string]: number;
  };
  subjectPerformance: {
    subject: string;
    avgScore: number;
    passRate: number;
  }[];
  createdAt: string;
}

export interface JuniorResult {
  id: string;
  schoolId: string;
  year: number;
  term: number;
  className: string;
  registered: { boys: number; girls: number };
  sat: { boys: number; girls: number };
  passed: { boys: number; girls: number };
  failed: { boys: number; girls: number };
  createdAt: string;
}

export interface StandardisedResult {
  id: string;
  schoolId: string;
  year: number;
  term: number;
  learnerName: string;
  sex: 'M' | 'F';
  className: string;
  scores: {
    CHI: number;
    ENG: number;
    ARTS: number;
    MAT: number;
    PSCI: number;
    SES: number;
  };
  total: number;
  createdAt: string;
}

export interface PSLCEData {
  id: string;
  schoolId: string;
  year: number;
  summary: {
    registered: { boys: number; girls: number };
    sat: { boys: number; girls: number };
    passed: { boys: number; girls: number };
    failed: { boys: number; girls: number };
    notSat: { boys: number; girls: number };
  };
  selection: {
    national: { boys: number; girls: number };
    districtBoarding: { boys: number; girls: number };
    day: { boys: number; girls: number };
    cdss: { boys: number; girls: number };
  };
  subjectGrades: {
    [subject: string]: {
      A: { boys: number; girls: number };
      B: { boys: number; girls: number };
      C: { boys: number; girls: number };
      D: { boys: number; girls: number };
    };
  };
  createdAt: string;
}

export interface ExamAdministration {
  id: string;
  teacherId: string;
  schoolId: string;
  examType: 'PSLCE' | 'JCE' | 'MSCE' | 'Standard 8' | 'Standard 4';
  year: number;
  role: 'Supervisor' | 'Invigilator' | 'Marker' | 'Cluster Leader' | 'Security';
  status: 'Assigned' | 'Completed' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface SchoolInspectionDetails {
  leadership: {
    planning: number;
    governance: number;
    financialManagement: number;
    records: number;
  };
  teachingLearning: {
    curriculumDelivery: number;
    learnerAssessment: number;
    teacherAttendance: number;
  };
  learnerWelfare: {
    safety: number;
    health: number;
    inclusion: number;
    discipline: number;
  };
  infrastructure: {
    classrooms: number;
    toilets: number;
    water: number;
    textbooks: number;
  };
  community: {
    smcPtaInvolvement: number;
  };
}

export interface TeacherInspectionDetails {
  teacherId: string;
  teacherName: string;
  subject: string;
  standard: string;
  preparation: {
    schemeOfWork: number;
    lessonPlan: number;
    teachingAids: number;
  };
  delivery: {
    introduction: number;
    contentKnowledge: number;
    methodology: number;
    learnerEngagement: number;
  };
  management: {
    discipline: number;
    organization: number;
    environment: number;
  };
  assessment: {
    questioning: number;
    feedback: number;
    marking: number;
  };
  professionalism: {
    punctuality: number;
    dressCode: number;
    records: number;
  };
}

export interface Inspection {
  id: string;
  schoolId: string;
  inspectorId: string;
  date: string;
  score: number;
  findings: string;
  recommendations: string;
  status: 'Draft' | 'Submitted' | 'Approved';
  photoUrls: string[];
  type: 'School' | 'Teacher';
  schoolDetails?: SchoolInspectionDetails;
  teacherDetails?: TeacherInspectionDetails;
  categories?: {
    infrastructure: number;
    academic: number;
    management: number;
    community: number;
  };
}

export interface TPDProgram {
  id: string;
  title: string;
  provider: string;
  date: string;
  duration: string;
  targetAudience: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
  participantsCount: number;
  createdAt: string;
}

export interface Resource {
  id: string;
  name: string;
  category: 'Textbooks' | 'Library Books' | 'Furniture' | 'Electronics' | 'Computers' | 'Printers' | 'Lab Equipment' | 'Sports Equipment' | 'Other';
  schoolId: string;
  quantity: number;
  condition: 'Good' | 'Fair' | 'Poor';
  lastUpdated: string;
  createdAt: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
  headId?: string;
  staffCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface OfficerOperation {
  id: string;
  officerId: string;
  officerName: string;
  tdcName: string;
  zone: string;
  type: 'Daily' | 'Weekly' | 'Monthly';
  date: string;
  activities: {
    id: string;
    title: string;
    description: string;
    status: 'Planned' | 'In Progress' | 'Completed' | 'Deferred';
    category: 'Inspection' | 'Training' | 'Meeting' | 'Administrative' | 'Other';
    teacherId?: string;
  }[];
  challenges: string[];
  recommendations: string[];
  submittedAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  teacherId: string;
  teacherName: string;
  schoolId: string;
  type: 'Sick' | 'Maternity' | 'Paternity' | 'Study' | 'Compassionate' | 'Annual' | 'Other';
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  
  // Study Leave specific fields
  admissionYear?: number;
  collegeName?: string;
  courseOfStudy?: string;
  modeOfStudy?: 'ODL' | 'Residential';
  progressOfStudy?: 'Completed' | 'Continuing';
  ministryApproval?: 'Yes' | 'No';

  approvedBy?: string;
  approvalDate?: string;
  comments?: string;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdvancedInspection {
  id: string;
  schoolId: string;
  inspectorId: string;
  inspectorName: string;
  date: string;
  type: 'Operations' | 'Classroom Observation' | 'Follow-up' | 'Special';
  
  // For Operations Inspection
  operations?: {
    managementScore: number;
    financeScore: number;
    infrastructureScore: number;
    communityEngagementScore: number;
    recordsScore: number;
  };

  // For Classroom Observation (NES)
  classroomObservation?: {
    teacherId: string;
    subject: string;
    standard: string;
    topic: string;
    nesStandardId: string; // Standard being observed
    nesStandardTitle: string;
    strengths: string[];
    areasForImprovement: string[];
    rating: 1 | 2 | 3 | 4; // 1: Below Standard, 2: Approaching, 3: Meeting, 4: Exceeding
  };

  overallScore: number;
  generalFindings: string;
  recommendations: string;
  actionPlan: {
    task: string;
    responsible: string;
    deadline: string;
    status: 'Pending' | 'In Progress' | 'Completed';
  }[];
  status: 'Draft' | 'Submitted' | 'Approved';
  createdAt: string;
  updatedAt: string;
}

export interface NESStandard {
  id: string;
  number: number;
  title: string;
  description: string;
  indicators: string[];
}

export interface ContinuousAssessment {
  id: string;
  schoolId: string;
  teacherId: string;
  standard: string;
  subject: string;
  term: 1 | 2 | 3;
  year: number;
  assessmentType: 'Test' | 'Assignment' | 'Project' | 'Practical' | 'Mid-Term';
  date: string;
  maxScore: number;
  results: {
    studentName: string;
    studentId?: string;
    score: number;
    remarks?: string;
  }[];
  avgScore: number;
  passRate: number;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceLog {
  id: string;
  schoolId: string;
  category: 'Classroom' | 'Toilet' | 'Water' | 'Electricity' | 'Furniture' | 'Staff House' | 'Other';
  description: string;
  urgency: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'In Progress' | 'Completed' | 'Deferred';
  estimatedCost?: number;
  actualCost?: number;
  reportedBy: string;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
  photoUrls?: string[];
}

export type UserRole = 'ADMIN' | 'TDC_OFFICER' | 'SCHOOL_HEAD' | 'DATA_CLERK';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  assignedSchools: string[]; // school IDs
  createdAt: string;
  updatedAt: string;
}

export type SubmissionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPDATED_BY_TDC';

export interface Submission {
  id: string;
  schoolId: string;
  userId: string;
  data: any;
  type: string;
  status: SubmissionStatus;
  feedback?: string;
  reviewedBy?: string;
  version: number;
  reasonForEdit?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionAuditLog {
  id: string;
  submissionId: string;
  changedBy: string;
  role: UserRole;
  previousData: any;
  updatedData: any;
  reason: string;
  timestamp: string;
}

export interface SMCMeeting {
  id: string;
  schoolId: string;
  date: string;
  type: 'Regular' | 'Emergency' | 'Annual General' | 'PTA';
  attendeesCount: number;
  agenda: string[];
  decisions: string[];
  resolutions: string[];
  actionItems: {
    task: string;
    responsible: string;
    deadline: string;
    status: 'Pending' | 'In Progress' | 'Completed';
  }[];
  minutesUrl?: string;
  nextMeetingDate?: string;
  submittedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g., "2025/2026"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface Term {
  id: string;
  academicYearId: string;
  number: 1 | 2 | 3;
  weeks: number;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface StandardClass {
  id: string;
  name: string; // e.g., "Standard 1"
  code: string; // e.g., "STD1"
}

export interface SystemSettings {
  id: string;
  districtName: string;
  zoneName: string;
  tdcName: string;
  currentAcademicYearId?: string;
  currentTermId?: string;
}
