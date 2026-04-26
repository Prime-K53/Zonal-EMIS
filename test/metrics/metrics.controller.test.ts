import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '../../src/components/metrics.controller';
import { MetricsService } from '../../src/services/metrics/metrics.service';
import { GetSchoolMetricsDto, GetZoneMetricsDto, GetZoneRankingDto } from '../../src/dtos/metrics.dto';
import {
  MetricsNotFoundException,
  ZoneNotFoundException,
  MetricsCalculationException,
} from '../../src/exceptions/metrics.exceptions';

describe('MetricsController', () => {
  let controller: MetricsController;
  let service: MetricsService;

  const mockMetricsService = {
    computeSchoolMetrics: jest.fn(),
    getComparativeMetrics: jest.fn(),
    computeZonalMetrics: jest.fn(),
    getZoneRanking: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MetricsController],
      providers: [
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    controller = module.get<MetricsController>(MetricsController);
    service = module.get<MetricsService>(MetricsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getSchoolMetrics', () => {
    it('should return school metrics successfully', async () => {
      const mockMetrics = {
        attendanceRate: 85.5,
        totalStudents: 200,
      } as any;

      const mockComparative = {
        current: mockMetrics,
        previous: null,
        trend: 'stable',
      } as any;

      mockMetricsService.computeSchoolMetrics.mockResolvedValue(mockMetrics);
      mockMetricsService.getComparativeMetrics.mockResolvedValue(mockComparative);

      const query: GetSchoolMetricsDto = {
        schoolId: 'school-1',
        periodType: 'DAILY',
        periodValue: '2026-04-26',
      };

      const result = await controller.getSchoolMetrics('school-1', query);

      expect(result.success).toBe(true);
      expect(result.data.schoolId).toBe('school-1');
      expect(result.data.metrics).toBe(mockMetrics);
      expect(result.data.comparison).toBe(mockComparative);
    });

    it('should throw MetricsNotFoundException when no metrics found', async () => {
      mockMetricsService.computeSchoolMetrics.mockResolvedValue({
        totalStudents: 0,
      } as any);

      const query: GetSchoolMetricsDto = {
        schoolId: 'school-1',
        periodType: 'DAILY',
        periodValue: '2026-04-26',
      };

      await expect(controller.getSchoolMetrics('school-1', query)).rejects.toThrow(
        MetricsNotFoundException,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockMetricsService.computeSchoolMetrics.mockRejectedValue(
        new Error('Database error'),
      );

      const query: GetSchoolMetricsDto = {
        schoolId: 'school-1',
        periodType: 'DAILY',
        periodValue: '2026-04-26',
      };

      await expect(controller.getSchoolMetrics('school-1', query)).rejects.toThrow(
        MetricsCalculationException,
      );
    });
  });

  describe('getZoneMetrics', () => {
    it('should return zone metrics successfully', async () => {
      const mockMetrics = {
        averageAttendance: 85.5,
        totalStudents: 500,
      } as any;

      mockMetricsService.computeZonalMetrics.mockResolvedValue(mockMetrics);

      const query: GetZoneMetricsDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
      };

      const result = await controller.getZoneMetrics('North Zone', query);

      expect(result.success).toBe(true);
      expect(result.data.zone).toBe('North Zone');
      expect(result.data.metrics).toBe(mockMetrics);
    });

    it('should throw ZoneNotFoundException when no zone found', async () => {
      mockMetricsService.computeZonalMetrics.mockResolvedValue({
        averageAttendance: 0,
      } as any);

      const query: GetZoneMetricsDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
      };

      await expect(controller.getZoneMetrics('North Zone', query)).rejects.toThrow(
        ZoneNotFoundException,
      );
    });

    it('should handle service errors gracefully', async () => {
      mockMetricsService.computeZonalMetrics.mockRejectedValue(
        new Error('Database error'),
      );

      const query: GetZoneMetricsDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
      };

      await expect(controller.getZoneMetrics('North Zone', query)).rejects.toThrow(
        MetricsCalculationException,
      );
    });
  });

  describe('getZoneRanking', () => {
    it('should return zone ranking with pagination', async () => {
      const mockRanking = {
        schools: [
          {
            schoolId: 'school-1',
            score: 95.5,
            attendanceRate: 90.0,
            infrastructureScore: 85.0,
          },
          {
            schoolId: 'school-2',
            score: 88.0,
            attendanceRate: 85.0,
            infrastructureScore: 82.0,
          },
        ],
      };

      mockMetricsService.getZoneRanking.mockResolvedValue(mockRanking);

      const query: GetZoneRankingDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
        page: 1,
        limit: 10,
        sortBy: 'score',
        sortOrder: 'desc',
      };

      const result = await controller.getZoneRanking('North Zone', query);

      expect(result.success).toBe(true);
      expect(result.data.zone).toBe('North Zone');
      expect(result.data.ranking.schools).toHaveLength(2);
      expect(result.data.ranking.total).toBe(2);
      expect(result.data.ranking.page).toBe(1);
      expect(result.data.ranking.limit).toBe(10);
    });

    it('should apply sorting correctly', async () => {
      const mockRanking = {
        schools: [
          {
            schoolId: 'school-1',
            score: 88.0,
            attendanceRate: 85.0,
            infrastructureScore: 82.0,
          },
          {
            schoolId: 'school-2',
            score: 95.5,
            attendanceRate: 90.0,
            infrastructureScore: 85.0,
          },
        ],
      };

      mockMetricsService.getZoneRanking.mockResolvedValue(mockRanking);

      const query: GetZoneRankingDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
        sortBy: 'score',
        sortOrder: 'desc',
      };

      const result = await controller.getZoneRanking('North Zone', query);

      expect(result.data.ranking.schools[0].schoolId).toBe('school-2');
      expect(result.data.ranking.schools[1].schoolId).toBe('school-1');
    });

    it('should handle service errors gracefully', async () => {
      mockMetricsService.getZoneRanking.mockRejectedValue(
        new Error('Database error'),
      );

      const query: GetZoneRankingDto = {
        zone: 'North Zone',
        periodType: 'MONTHLY',
        periodValue: '2026-04',
      };

      await expect(controller.getZoneRanking('North Zone', query)).rejects.toThrow(
        MetricsCalculationException,
      );
    });
  });
});