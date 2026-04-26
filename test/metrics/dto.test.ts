import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MetricsController } from '../../src/components/metrics.controller';
import { MetricsService } from '../../src/services/metrics/metrics.service';
import { GetSchoolMetricsDto, GetZoneMetricsDto, GetZoneRankingDto } from '../../src/dtos/metrics.dto';

describe('Metrics DTO Validation', () => {
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

  describe('GetSchoolMetricsDto', () => {
    const validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('should validate required schoolId', async () => {
      const dto = {
        schoolId: 'school-123',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetSchoolMetricsDto,
      });

      expect(result.schoolId).toBe('school-123');
      expect(result.periodType).toBe('DAILY');
    });

    it('should accept optional periodType', async () => {
      const dto = {
        schoolId: 'school-123',
        periodType: 'MONTHLY',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetSchoolMetricsDto,
      });

      expect(result.schoolId).toBe('school-123');
      expect(result.periodType).toBe('MONTHLY');
    });

    it('should reject invalid periodType', async () => {
      const dto = {
        schoolId: 'school-123',
        periodType: 'INVALID',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetSchoolMetricsDto,
        }),
      ).rejects.toThrow();
    });

    it('should accept optional periodValue', async () => {
      const dto = {
        schoolId: 'school-123',
        periodValue: '2026-04-26',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetSchoolMetricsDto,
      });

      expect(result.schoolId).toBe('school-123');
      expect(result.periodValue).toBe('2026-04-26');
    });

    it('should reject invalid periodValue format', async () => {
      const dto = {
        schoolId: 'school-123',
        periodValue: 'invalid-date',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetSchoolMetricsDto,
        }),
      ).rejects.toThrow();
    });
  });

  describe('GetZoneMetricsDto', () => {
    const validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('should validate required zone', async () => {
      const dto = {
        zone: 'North Zone',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneMetricsDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.periodType).toBe('MONTHLY');
    });

    it('should accept optional periodType', async () => {
      const dto = {
        zone: 'North Zone',
        periodType: 'WEEKLY',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneMetricsDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.periodType).toBe('WEEKLY');
    });

    it('should reject invalid periodType', async () => {
      const dto = {
        zone: 'North Zone',
        periodType: 'INVALID',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneMetricsDto,
        }),
      ).rejects.toThrow();
    });

    it('should accept optional periodValue', async () => {
      const dto = {
        zone: 'North Zone',
        periodValue: '2026-04',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneMetricsDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.periodValue).toBe('2026-04');
    });

    it('should reject invalid periodValue format', async () => {
      const dto = {
        zone: 'North Zone',
        periodValue: 'invalid-date',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneMetricsDto,
        }),
      ).rejects.toThrow();
    });
  });

  describe('GetZoneRankingDto', () => {
    const validationPipe = new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    it('should validate required zone', async () => {
      const dto = {
        zone: 'North Zone',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneRankingDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.periodType).toBe('MONTHLY');
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.sortBy).toBe('score');
      expect(result.sortOrder).toBe('desc');
    });

    it('should accept optional pagination parameters', async () => {
      const dto = {
        zone: 'North Zone',
        page: 2,
        limit: 20,
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneRankingDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });

    it('should reject invalid page number', async () => {
      const dto = {
        zone: 'North Zone',
        page: 0,
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneRankingDto,
        }),
      ).rejects.toThrow();
    });

    it('should reject invalid limit number', async () => {
      const dto = {
        zone: 'North Zone',
        limit: 101,
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneRankingDto,
        }),
      ).rejects.toThrow();
    });

    it('should accept optional sortBy parameter', async () => {
      const dto = {
        zone: 'North Zone',
        sortBy: 'attendanceRate',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneRankingDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.sortBy).toBe('attendanceRate');
    });

    it('should reject invalid sortBy parameter', async () => {
      const dto = {
        zone: 'North Zone',
        sortBy: 'invalid',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneRankingDto,
        }),
      ).rejects.toThrow();
    });

    it('should accept optional sortOrder parameter', async () => {
      const dto = {
        zone: 'North Zone',
        sortOrder: 'asc',
      };

      const result = await validationPipe.transform(dto, {
        type: 'body',
        metatype: GetZoneRankingDto,
      });

      expect(result.zone).toBe('North Zone');
      expect(result.sortOrder).toBe('asc');
    });

    it('should reject invalid sortOrder parameter', async () => {
      const dto = {
        zone: 'North Zone',
        sortOrder: 'invalid',
      };

      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: GetZoneRankingDto,
        }),
      ).rejects.toThrow();
    });
  });
});