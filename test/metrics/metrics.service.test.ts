import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from '../../src/services/metrics/metrics.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import {
  calculateAttendanceRate,
  calculateGenderRatio,
  calculateGrowthRate,
  calculateStudentTeacherRatio,
  calculateQualifiedRate,
  calculateInfrastructureScore,
  formatPercentage,
  formatRatio,
} from '../../src/services/metrics/formulas';
import { SchoolMetrics, ZonalMetrics } from '../../src/services/metrics/formulas';

describe('MetricsService', () => {
  let service: MetricsService;
  let prisma: PrismaService;

  const mockPrisma = {
    schoolProfileSummary: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('computeSchoolMetrics', () => {
    it('should compute metrics successfully', async () => {
      const mockProfile = {
        id: '1',
        schoolId: 'school-1',
        periodType: 'DAILY',
        periodValue: '2026-04-26',
        attendanceRate: 85.5,
        attendanceMaleRate: 87.0,
        attendanceFemaleRate: 84.0,
        totalStudents: 200,
        totalBoys: 110,
        totalGirls: 90,
        totalTeachers: 10,
        qualifiedTeachers: 8,
        hasElectricity: true,
        hasWaterSource: true,
        totalClassrooms: 8,
        totalToilets: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.schoolProfileSummary.findFirst.mockResolvedValue(mockProfile);

      const result = await service.computeSchoolMetrics('school-1', 'DAILY', '2026-04-26');

      expect(result).toMatchObject<SchoolMetrics>({
        attendanceRate: 85.5,
        attendanceMaleRate: 87.0,
        attendanceFemaleRate: 84.0,
        totalStudents: 200,
        totalBoys: 110,
        totalGirls: 90,
        genderRatio: 110 / 90,
        growthRate: 0,
        studentTeacherRatio: 200 / 10,
        qualifiedTeacherRate: (8 / 10) * 100,
        infrastructureScore: expect.any(Number),
      });
    });

    it('should return default metrics when no profile found', async () => {
      mockPrisma.schoolProfileSummary.findFirst.mockResolvedValue(null);

      const result = await service.computeSchoolMetrics('school-1', 'DAILY', '2026-04-26');

      expect(result).toEqual(service['getDefaultMetrics']());
    });

    it('should handle division by zero gracefully', async () => {
      const mockProfile = {
        id: '1',
        schoolId: 'school-1',
        periodType: 'DAILY',
        periodValue: '2026-04-26',
        attendanceRate: 0,
        attendanceMaleRate: 0,
        attendanceFemaleRate: 0,
        totalStudents: 0,
        totalBoys: 0,
        totalGirls: 0,
        totalTeachers: 0,
        qualifiedTeachers: 0,
        hasElectricity: false,
        hasWaterSource: false,
        totalClassrooms: 0,
        totalToilets: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.schoolProfileSummary.findFirst.mockResolvedValue(mockProfile);

      const result = await service.computeSchoolMetrics('school-1', 'DAILY', '2026-04-26');

      expect(result.genderRatio).toBe(0);
      expect(result.studentTeacherRatio).toBe(0);
      expect(result.qualifiedTeacherRate).toBe(0);
      expect(result.infrastructureScore).toBe(0);
    });
  });

  describe('computeZonalMetrics', () => {
    it('should compute zonal metrics successfully', async () => {
      const mockProfiles = [
        {
          id: '1',
          schoolId: 'school-1',
          periodType: 'MONTHLY',
          periodValue: '2026-04',
          attendanceRate: 85.0,
          totalStudents: 100,
          totalBoys: 55,
          totalGirls: 45,
          totalTeachers: 5,
          qualifiedTeachers: 4,
          hasElectricity: true,
          hasWaterSource: true,
          totalClassrooms: 4,
          totalToilets: 3,
        },
        {
          id: '2',
          schoolId: 'school-2',
          periodType: 'MONTHLY',
          periodValue: '2026-04',
          attendanceRate: 90.0,
          totalStudents: 150,
          totalBoys: 80,
          totalGirls: 70,
          totalTeachers: 8,
          qualifiedTeachers: 7,
          hasElectricity: true,
          hasWaterSource: true,
          totalClassrooms: 6,
          totalToilets: 4,
        },
      ];

      mockPrisma.schoolProfileSummary.findMany.mockResolvedValue(mockProfiles);

      const result = await service.computeZonalMetrics('North Zone', 'MONTHLY', '2026-04');

      expect(result.averageAttendance).toBe(87.5);
      expect(result.totalStudents).toBe(250);
      expect(result.averageGenderRatio).toBe(135 / 115);
      expect(result.averageStudentTeacherRatio).toBe(250 / 13);
      expect(result.averageQualifiedTeacherRate).toBe((11 / 13) * 100);
      expect(result.schoolsWithGoodInfrastructure).toBe(2);
    });

    it('should return default zonal metrics when no profiles found', async () => {
      mockPrisma.schoolProfileSummary.findMany.mockResolvedValue([]);

      const result = await service.computeZonalMetrics('North Zone', 'MONTHLY', '2026-04');

      expect(result).toEqual(service['getDefaultZonalMetrics']());
    });
  });

  describe('getComparativeMetrics', () => {
    it('should return current and previous metrics with trend', async () => {
      const mockCurrent = {
        attendanceRate: 85.5,
        totalStudents: 200,
      } as SchoolMetrics;

      const mockPrevious = {
        attendanceRate: 80.0,
        totalStudents: 190,
      } as SchoolMetrics;

      jest.spyOn(service, 'computeSchoolMetrics').mockResolvedValue(mockCurrent);
      jest.spyOn(service, 'getPreviousPeriodProfile').mockResolvedValue(mockPrevious);

      const result = await service.getComparativeMetrics('school-1', 'DAILY', '2026-04-26');

      expect(result.current).toBe(mockCurrent);
      expect(result.previous).toBe(mockPrevious);
      expect(result.trend).toBe('improving');
    });

    it('should return stable trend when no change', async () => {
      const mockCurrent = {
        attendanceRate: 85.5,
        totalStudents: 200,
      } as SchoolMetrics;

      const mockPrevious = {
        attendanceRate: 85.5,
        totalStudents: 200,
      } as SchoolMetrics;

      jest.spyOn(service, 'computeSchoolMetrics').mockResolvedValue(mockCurrent);
      jest.spyOn(service, 'getPreviousPeriodProfile').mockResolvedValue(mockPrevious);

      const result = await service.getComparativeMetrics('school-1', 'DAILY', '2026-04-26');

      expect(result.trend).toBe('stable');
    });
  });

  describe('getZoneRanking', () => {
    it('should return zone ranking with schools sorted by score', async () => {
      const mockProfiles = [
        {
          id: '1',
          schoolId: 'school-1',
          periodType: 'MONTHLY',
          periodValue: '2026-04',
          attendanceRate: 90.0,
          totalStudents: 100,
          totalTeachers: 5,
          qualifiedTeachers: 5,
          hasElectricity: true,
          hasWaterSource: true,
          totalClassrooms: 4,
          totalToilets: 3,
          school: { id: 'school-1', name: 'School 1' },
        },
        {
          id: '2',
          schoolId: 'school-2',
          periodType: 'MONTHLY',
          periodValue: '2026-04',
          attendanceRate: 80.0,
          totalStudents: 150,
          totalTeachers: 8,
          qualifiedTeachers: 6,
          hasElectricity: true,
          hasWaterSource: true,
          totalClassrooms: 6,
          totalToilets: 4,
          school: { id: 'school-2', name: 'School 2' },
        },
      ];

      mockPrisma.schoolProfileSummary.findMany.mockResolvedValue(mockProfiles);

      const result = await service.getZoneRanking('North Zone', 'MONTHLY', '2026-04');

      expect(result.schools).toHaveLength(2);
      expect(result.schools[0].schoolId).toBe('school-1');
      expect(result.schools[0].score).toBeGreaterThan(result.schools[1].score);
    });
  });
});