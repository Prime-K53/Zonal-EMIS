import { ApiProperty } from '@nestjs/swagger';

export class SchoolMetrics {
  @ApiProperty({
    description: 'Overall attendance rate percentage',
    example: 85.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  attendanceRate: number;

  @ApiProperty({
    description: 'Male students attendance rate percentage',
    example: 87.0,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  attendanceMaleRate: number;

  @ApiProperty({
    description: 'Female students attendance rate percentage',
    example: 84.0,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  attendanceFemaleRate: number;

  @ApiProperty({
    description: 'Total number of students',
    example: 200,
    type: 'integer',
    minimum: 0,
  })
  totalStudents: number;

  @ApiProperty({
    description: 'Total number of male students',
    example: 110,
    type: 'integer',
    minimum: 0,
  })
  totalBoys: number;

  @ApiProperty({
    description: 'Total number of female students',
    example: 90,
    type: 'integer',
    minimum: 0,
  })
  totalGirls: number;

  @ApiProperty({
    description: 'Gender ratio (boys to girls)',
    example: 1.22,
    type: 'number',
  })
  genderRatio: number;

  @ApiProperty({
    description: 'Student growth rate percentage compared to previous period',
    example: 5.2,
    type: 'number',
  })
  growthRate: number;

  @ApiProperty({
    description: 'Student to teacher ratio',
    example: 20.0,
    type: 'number',
  })
  studentTeacherRatio: number;

  @ApiProperty({
    description: 'Percentage of qualified teachers',
    example: 80.0,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  qualifiedTeacherRate: number;

  @ApiProperty({
    description: 'Infrastructure quality score (0-100)',
    example: 75.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  infrastructureScore: number;
}

export class ComparativeMetrics {
  @ApiProperty({
    description: 'Current period metrics',
    type: () => SchoolMetrics,
  })
  current: SchoolMetrics;

  @ApiProperty({
    description: 'Previous period metrics (if available)',
    type: () => SchoolMetrics,
    required: false,
  })
  previous: SchoolMetrics | null;

  @ApiProperty({
    description: 'Trend direction',
    enum: ['improving', 'declining', 'stable'],
    example: 'improving',
  })
  trend: 'improving' | 'declining' | 'stable';
}

export class ZonalMetrics {
  @ApiProperty({
    description: 'Average attendance rate across all schools in the zone',
    example: 82.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  averageAttendance: number;

  @ApiProperty({
    description: 'Average gender ratio across all schools in the zone',
    example: 1.15,
    type: 'number',
  })
  averageGenderRatio: number;

  @ApiProperty({
    description: 'Average growth rate across all schools in the zone',
    example: 3.2,
    type: 'number',
  })
  averageGrowthRate: number;

  @ApiProperty({
    description: 'Average student to teacher ratio across all schools in the zone',
    example: 18.5,
    type: 'number',
  })
  averageStudentTeacherRatio: number;

  @ApiProperty({
    description: 'Average qualified teacher rate across all schools in the zone',
    example: 78.3,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  averageQualifiedTeacherRate: number;

  @ApiProperty({
    description: 'Number of schools with good infrastructure in the zone',
    example: 12,
    type: 'integer',
    minimum: 0,
  })
  schoolsWithGoodInfrastructure: number;
}

export class SchoolRanking {
  @ApiProperty({
    description: 'School ID',
    example: 'school-123',
    type: 'string',
  })
  schoolId: string;

  @ApiProperty({
    description: 'Overall performance score (0-100)',
    example: 92.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  score: number;

  @ApiProperty({
    description: 'School attendance rate percentage',
    example: 90.0,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  attendanceRate: number;

  @ApiProperty({
    description: 'School infrastructure quality score (0-100)',
    example: 85.0,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  infrastructureScore: number;
}

export class RankingPagination {
  @ApiProperty({
    description: 'List of ranked schools',
    type: () => SchoolRanking,
    isArray: true,
  })
  schools: SchoolRanking[];

  @ApiProperty({
    description: 'Total number of schools in the zone',
    example: 25,
    type: 'integer',
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
    type: 'integer',
    minimum: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
    type: 'integer',
    minimum: 1,
  })
  totalPages: number;

  @ApiProperty({
    description: 'Whether there are more pages available',
    example: true,
    type: 'boolean',
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there are previous pages available',
    example: false,
    type: 'boolean',
  })
  hasPrev: boolean;
}

export class CacheStats {
  @ApiProperty({
    description: 'Total number of cached entries',
    example: 150,
    type: 'integer',
  })
  totalEntries: number;

  @ApiProperty({
    description: 'Memory usage of the cache',
    example: '2.5 MB',
    type: 'string',
  })
  memoryUsage: string;
}

export class PerformanceStats {
  @ApiProperty({
    description: 'Total number of operations',
    example: 1250,
    type: 'integer',
  })
  total: number;

  @ApiProperty({
    description: 'Average operation duration in milliseconds',
    example: 45.2,
    type: 'number',
  })
  average: number;

  @ApiProperty({
    description: 'Minimum operation duration in milliseconds',
    example: 12,
    type: 'number',
  })
  min: number;

  @ApiProperty({
    description: 'Maximum operation duration in milliseconds',
    example: 250,
    type: 'number',
  })
  max: number;

  @ApiProperty({
    description: 'Success rate percentage',
    example: 98.5,
    type: 'number',
    minimum: 0,
    maximum: 100,
  })
  successRate: number;

  @ApiProperty({
    description: 'Recent operation metrics',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        operation: { type: 'string' },
        duration: { type: 'number' },
        timestamp: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  recentMetrics: any[];
}

export class ApiResponse<T> {
  @ApiProperty({
    description: 'Whether the request was successful',
    example: true,
    type: 'boolean',
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    type: 'object',
  })
  data: T;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2026-04-26T10:30:00.000Z',
    type: 'string',
  })
  timestamp: string;
}

export class PaginatedApiResponse<T> extends ApiResponse<T> {
  @ApiProperty({
    description: 'Pagination information',
    type: 'object',
  })
  data: {
    schools: T[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  };
}