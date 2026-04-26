export interface SchoolMetrics {
  attendanceRate: number;
  attendanceMaleRate: number;
  attendanceFemaleRate: number;
  totalStudents: number;
  totalBoys: number;
  totalGirls: number;
  genderRatio: number;
  growthRate: number;
  studentTeacherRatio: number;
  qualifiedTeacherRate: number;
  infrastructureScore: number;
}

export interface ZonalMetrics {
  averageAttendance: number;
  averageGenderRatio: number;
  averageGrowthRate: number;
  averageStudentTeacherRatio: number;
  averageQualifiedTeacherRate: number;
  schoolsWithGoodInfrastructure: number;
}

export function calculateAttendanceRate(present: number, absent: number): number {
  const total = present + absent;
  return total > 0 ? (present / total) * 100 : 0;
}

export function calculateGenderRatio(male: number, female: number): number {
  if (female === 0) {
    return male > 0 ? Number.MAX_SAFE_INTEGER : 0;
  }
  return male / female;
}

export function calculateGrowthRate(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
}

export function calculateStudentTeacherRatio(students: number, teachers: number): number {
  if (teachers === 0) {
    return students > 0 ? Number.MAX_SAFE_INTEGER : 0;
  }
  return students / teachers;
}

export function calculateQualifiedRate(qualified: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return (qualified / total) * 100;
}

export function calculateInfrastructureScore(
  hasElectricity: boolean,
  hasWater: boolean,
  classrooms: number,
  toilets: number,
  totalStudents: number,
): number {
  let score = 0;
  
  if (hasElectricity) score += 25;
  if (hasWater) score += 25;
  if (classrooms > 0) score += Math.min(25, (classrooms / Math.max(1, totalStudents / 40)) * 25);
  if (toilets > 0) score += Math.min(25, (toilets / Math.max(1, totalStudents / 30)) * 25);
  
  return Math.min(100, score);
}

export function formatPercentage(value: number): string {
  if (!isFinite(value)) return 'N/A';
  return `${value.toFixed(1)}%`;
}

export function formatRatio(value: number): string {
  if (!isFinite(value)) {
    return value === Number.MAX_SAFE_INTEGER ? 'N/A (no denominator)' : 'N/A';
  }
  return value.toFixed(2);
}