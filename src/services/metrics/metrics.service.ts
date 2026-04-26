import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { CacheService } from '../cache/cache.service';
import { PerformanceService } from '../performance/performance.service';
import { MetricsLoggerService } from '../logging/metrics-logger.service';
import {
  calculateAttendanceRate,
  calculateGenderRatio,
  calculateGrowthRate,
  calculateStudentTeacherRatio,
  calculateQualifiedRate,
  calculateInfrastructureScore,
  SchoolMetrics,
  ZonalMetrics,
} from './formulas';
import { MetricsCalculationException } from '../../src/exceptions/metrics.exceptions';

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
    private performance: PerformanceService,
    private metricsLogger: MetricsLoggerService,
  ) {}

  async computeSchoolMetrics(
    schoolId: string,
    periodType: string,
    periodValue: string,
  ): Promise<SchoolMetrics> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'computeSchoolMetrics',
      { schoolId, periodType, periodValue },
    );

    return this.performance.trackPerformance(
      'computeSchoolMetrics',
      async () => {
        const cacheKey = this.cache.generateCacheKey(
          'school-metrics',
          schoolId,
          periodType,
          periodValue,
        );

        const cacheStart = Date.now();
        const cached = await this.cache.get<SchoolMetrics>(cacheKey);
        const cacheDuration = Date.now() - cacheStart;

        if (cached) {
          this.metricsLogger.logCacheOperation('hit', cacheKey, cacheDuration, {
            logId,
            schoolId,
          });
          this.logger.debug(`Cache hit for school metrics: ${schoolId}`);
          return cached;
        }

        this.metricsLogger.logCacheOperation('miss', cacheKey, cacheDuration, {
          logId,
          schoolId,
        });

        this.logger.log(`Computing metrics for school ${schoolId}, period ${periodType}/${periodValue}`);

        const profile = await this.prisma.schoolProfileSummary.findFirst({
          where: { schoolId, periodType, periodValue },
        });

        if (!profile) {
          this.logger.warn(`No profile found for school ${schoolId}, period ${periodType}/${periodValue}`);
          const defaultMetrics = this.getDefaultMetrics();
          await this.cache.set(cacheKey, defaultMetrics, this.CACHE_TTL);
          this.metricsLogger.logOperationEnd('computeSchoolMetrics', {
            success: true,
            duration: Date.now() - startTime,
          }, { logId, schoolId });
          return defaultMetrics;
        }

        const genderRatio = calculateGenderRatio(profile.totalBoys, profile.totalGirls);
        const studentTeacherRatio = calculateStudentTeacherRatio(
          profile.totalStudents,
          profile.totalTeachers,
        );
        const qualifiedRate = calculateQualifiedRate(
          profile.qualifiedTeachers,
          profile.totalTeachers,
        );
        const infrastructureScore = calculateInfrastructureScore(
          profile.hasElectricity,
          profile.hasWaterSource,
          profile.totalClassrooms,
          profile.totalToilets,
          profile.totalStudents,
        );

        const previousProfile = await this.getPreviousPeriodProfile(
          schoolId,
          periodType,
          periodValue,
        );
        const growthRate = previousProfile
          ? calculateGrowthRate(profile.totalStudents, previousProfile.totalStudents)
          : 0;

        const metrics: SchoolMetrics = {
          attendanceRate: profile.attendanceRate,
          attendanceMaleRate: profile.attendanceMaleRate,
          attendanceFemaleRate: profile.attendanceFemaleRate,
          totalStudents: profile.totalStudents,
          totalBoys: profile.totalBoys,
          totalGirls: profile.totalGirls,
          genderRatio,
          growthRate,
          studentTeacherRatio,
          qualifiedTeacherRate: qualifiedRate,
          infrastructureScore,
        };

        const cacheSetStart = Date.now();
        await this.cache.set(cacheKey, metrics, this.CACHE_TTL);
        const cacheSetDuration = Date.now() - cacheSetStart;
        
        this.metricsLogger.logCacheOperation('set', cacheKey, cacheSetDuration, {
          logId,
          schoolId,
        });

        this.logger.debug(`Cached metrics for school: ${schoolId}`);

        this.metricsLogger.logOperationEnd('computeSchoolMetrics', {
          success: true,
          duration: Date.now() - startTime,
        }, { logId, schoolId });

        return metrics;
      },
      { schoolId, periodType, periodValue }
    ).then(({ result }) => result);
  }

  async computeZonalMetrics(
    zone: string,
    periodType: string,
    periodValue: string,
  ): Promise<ZonalMetrics> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'computeZonalMetrics',
      { zone, periodType, periodValue },
    );

    return this.performance.trackPerformance(
      'computeZonalMetrics',
      async () => {
        const cacheKey = this.cache.generateCacheKey(
          'zone-metrics',
          zone,
          periodType,
          periodValue,
        );

        const cacheStart = Date.now();
        const cached = await this.cache.get<ZonalMetrics>(cacheKey);
        const cacheDuration = Date.now() - cacheStart;

        if (cached) {
          this.metricsLogger.logCacheOperation('hit', cacheKey, cacheDuration, {
            logId,
            zone,
          });
          this.logger.debug(`Cache hit for zone metrics: ${zone}`);
          return cached;
        }

        this.metricsLogger.logCacheOperation('miss', cacheKey, cacheDuration, {
          logId,
          zone,
        });

        this.logger.log(`Computing metrics for zone ${zone}, period ${periodType}/${periodValue}`);

        const profiles = await this.prisma.schoolProfileSummary.findMany({
          where: {
            school: { zone },
            periodType,
            periodValue,
          },
        });

        if (profiles.length === 0) {
          this.logger.warn(`No profiles found for zone ${zone}, period ${periodType}/${periodValue}`);
          const defaultMetrics = this.getDefaultZonalMetrics();
          await this.cache.set(cacheKey, defaultMetrics, this.CACHE_TTL);
          this.metricsLogger.logOperationEnd('computeZonalMetrics', {
            success: true,
            duration: Date.now() - startTime,
          }, { logId, zone });
          return defaultMetrics;
        }

        const totalStudents = profiles.reduce((sum, p) => sum + p.totalStudents, 0);
        const totalBoys = profiles.reduce((sum, p) => sum + p.totalBoys, 0);
        const totalGirls = profiles.reduce((sum, p) => sum + p.totalGirls, 0);
        const totalTeachers = profiles.reduce((sum, p) => sum + p.totalTeachers, 0);
        const totalQualified = profiles.reduce(
          (sum, p) => sum + p.qualifiedTeachers,
          0,
        );

        const attendanceRates = profiles
          .filter((p) => p.attendanceRate > 0)
          .map((p) => p.attendanceRate);
        const averageAttendance =
          attendanceRates.length > 0
            ? attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length
            : 0;

        const genderRatio = calculateGenderRatio(totalBoys, totalGirls);
        const studentTeacherRatio = calculateStudentTeacherRatio(
          totalStudents,
          totalTeachers,
        );
        const qualifiedRate = calculateQualifiedRate(totalQualified, totalTeachers);

        const schoolsWithGoodInfra = profiles.filter(
          (p) =>
            p.hasElectricity &&
            p.hasWaterSource &&
            p.totalClassrooms > 0 &&
            p.totalToilets > 0,
        ).length;

        const metrics: ZonalMetrics = {
          averageAttendance,
          averageGenderRatio: genderRatio,
          averageGrowthRate: 0,
          averageStudentTeacherRatio: studentTeacherRatio,
          averageQualifiedTeacherRate: qualifiedRate,
          schoolsWithGoodInfrastructure: schoolsWithGoodInfra,
        };

        const cacheSetStart = Date.now();
        await this.cache.set(cacheKey, metrics, this.CACHE_TTL);
        const cacheSetDuration = Date.now() - cacheSetStart;
        
        this.metricsLogger.logCacheOperation('set', cacheKey, cacheSetDuration, {
          logId,
          zone,
        });

        this.logger.debug(`Cached metrics for zone: ${zone}`);

        this.metricsLogger.logOperationEnd('computeZonalMetrics', {
          success: true,
          duration: Date.now() - startTime,
        }, { logId, zone });

        return metrics;
      },
      { zone, periodType, periodValue }
    ).then(({ result }) => result);
  }

  async getComparativeMetrics(
    schoolId: string,
    periodType: string,
    periodValue: string,
  ): Promise<{
    current: SchoolMetrics;
    previous: SchoolMetrics | null;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'getComparativeMetrics',
      { schoolId, periodType, periodValue },
    );

    return this.performance.trackPerformance(
      'getComparativeMetrics',
      async () => {
        const current = await this.computeSchoolMetrics(
          schoolId,
          periodType,
          periodValue,
        );

        const previous = await this.getPreviousPeriodProfile(
          schoolId,
          periodType,
          periodValue,
        );

        let trend: 'improving' | 'declining' | 'stable' = 'stable';

        if (previous) {
          const diff = current.attendanceRate - previous.attendanceRate;
          if (diff > 1) trend = 'improving';
          else if (diff < -1) trend = 'declining';
        }

        this.metricsLogger.logOperationEnd('getComparativeMetrics', {
          success: true,
          duration: Date.now() - startTime,
        }, { logId, schoolId, trend });

        return { current, previous, trend };
      },
      { schoolId, periodType, periodValue }
    ).then(({ result }) => result);
  }

  async getZoneRanking(
    zone: string,
    periodType: string,
    periodValue: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    schools: Array<{
      schoolId: string;
      score: number;
      attendanceRate: number;
      infrastructureScore: number;
    }>;
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'getZoneRanking',
      { zone, periodType, periodValue, page, limit },
    );

    return this.performance.trackPerformance(
      'getZoneRanking',
      async () => {
        const cacheKey = this.cache.generateCacheKey(
          'zone-ranking',
          zone,
          periodType,
          periodValue,
          page.toString(),
          limit.toString(),
        );

        const cacheStart = Date.now();
        const cached = await this.cache.get<{
          schools: Array<{
            schoolId: string;
            score: number;
            attendanceRate: number;
            infrastructureScore: number;
          }>;
          pagination: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
          };
        }>(cacheKey);
        const cacheDuration = Date.now() - cacheStart;

        if (cached) {
          this.metricsLogger.logCacheOperation('hit', cacheKey, cacheDuration, {
            logId,
            zone,
          });
          this.logger.debug(`Cache hit for zone ranking: ${zone}`);
          return cached;
        }

        this.metricsLogger.logCacheOperation('miss', cacheKey, cacheDuration, {
          logId,
          zone,
        });

        this.logger.log(`Computing ranking for zone ${zone}, period ${periodType}/${periodValue}`);

        const profiles = await this.prisma.schoolProfileSummary.findMany({
          where: {
            school: { zone },
            periodType,
            periodValue,
          },
          include: { school: { select: { id: true, name: true } } },
        });

        const schools = profiles.map((p) => {
          const infrastructureScore = calculateInfrastructureScore(
            p.hasElectricity,
            p.hasWaterSource,
            p.totalClassrooms,
            p.totalToilets,
            p.totalStudents,
          );

          return {
            schoolId: p.schoolId,
            score:
              p.attendanceRate * 0.4 +
              infrastructureScore * 0.3 +
              calculateQualifiedRate(p.qualifiedTeachers, p.totalTeachers) * 0.3,
            attendanceRate: p.attendanceRate,
            infrastructureScore,
          };
        });

        // Apply pagination
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedSchools = schools.slice(startIndex, endIndex);

        const result = {
          schools: paginatedSchools,
          pagination: {
            total: schools.length,
            page,
            limit,
            totalPages: Math.ceil(schools.length / limit),
            hasNext: page < Math.ceil(schools.length / limit),
            hasPrev: page > 1,
          },
        };

        const cacheSetStart = Date.now();
        await this.cache.set(cacheKey, result, this.CACHE_TTL);
        const cacheSetDuration = Date.now() - cacheSetStart;
        
        this.metricsLogger.logCacheOperation('set', cacheKey, cacheSetDuration, {
          logId,
          zone,
        });

        this.logger.debug(`Cached ranking for zone: ${zone}`);

        this.metricsLogger.logOperationEnd('getZoneRanking', {
          success: true,
          duration: Date.now() - startTime,
        }, { logId, zone });

        return result;
      },
      { zone, periodType, periodValue, page, limit }
    ).then(({ result }) => result);
  }

  async getPerformanceStats() {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'getPerformanceStats',
      {},
    );

    try {
      const stats = await this.performance.getPerformanceStats();
      
      this.metricsLogger.logOperationEnd('getPerformanceStats', {
        success: true,
        duration: Date.now() - startTime,
      }, { logId });

      return stats;
    } catch (error) {
      this.metricsLogger.logOperationEnd('getPerformanceStats', {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }, { logId });

      throw error;
    }
  }

  async invalidateSchoolMetrics(schoolId: string): Promise<void> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'invalidateSchoolMetrics',
      { schoolId },
    );

    try {
      const keysToDelete = [];
      
      // Clear all cache entries for this school
      for (const key of this.cache['cache'].keys()) {
        if (key.startsWith(`school-metrics:${schoolId}`)) {
          keysToDelete.push(key);
        }
        if (key.startsWith(`zone-ranking:`)) {
          // Also clear zone rankings that might include this school
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        await this.cache.del(key);
      }

      this.logger.log(`Invalidated ${keysToDelete.length} cache entries for school: ${schoolId}`);
      
      this.metricsLogger.logOperationEnd('invalidateSchoolMetrics', {
        success: true,
        duration: Date.now() - startTime,
        invalidatedKeys: keysToDelete.length,
      }, { logId, schoolId });
    } catch (error) {
      this.metricsLogger.logOperationEnd('invalidateSchoolMetrics', {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }, { logId, schoolId });

      this.logger.error(`Error invalidating school metrics cache: ${error.message}`);
      throw new MetricsCalculationException(
        `Failed to invalidate cache: ${error.message}`,
        { schoolId },
      );
    }
  }

  async invalidateZoneMetrics(zone: string): Promise<void> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'invalidateZoneMetrics',
      { zone },
    );

    try {
      const keysToDelete = [];
      
      // Clear all cache entries for this zone
      for (const key of this.cache['cache'].keys()) {
        if (key.startsWith(`zone-metrics:${zone}`)) {
          keysToDelete.push(key);
        }
        if (key.startsWith(`zone-ranking:${zone}`)) {
          keysToDelete.push(key);
        }
      }

      for (const key of keysToDelete) {
        await this.cache.del(key);
      }

      this.logger.log(`Invalidated ${keysToDelete.length} cache entries for zone: ${zone}`);
      
      this.metricsLogger.logOperationEnd('invalidateZoneMetrics', {
        success: true,
        duration: Date.now() - startTime,
        invalidatedKeys: keysToDelete.length,
      }, { logId, zone });
    } catch (error) {
      this.metricsLogger.logOperationEnd('invalidateZoneMetrics', {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }, { logId, zone });

      this.logger.error(`Error invalidating zone metrics cache: ${error.message}`);
      throw new MetricsCalculationException(
        `Failed to invalidate cache: ${error.message}`,
        { zone },
      );
    }
  }

  async getCacheStats(): Promise<any> {
    const { startTime, logId } = this.metricsLogger.logOperationStart(
      'getCacheStats',
      {},
    );

    try {
      const stats = this.cache.getCacheStats();
      
      this.metricsLogger.logOperationEnd('getCacheStats', {
        success: true,
        duration: Date.now() - startTime,
      }, { logId });

      return stats;
    } catch (error) {
      this.metricsLogger.logOperationEnd('getCacheStats', {
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error),
      }, { logId });

      throw error;
    }
  }

  async getLogs(level?: string, limit?: number) {
    return this.metricsLogger.getLogs(level as any, limit);
  }

  async getLogStats() {
    return this.metricsLogger.getLogStats();
  }

  async clearLogs() {
    return this.metricsLogger.clearLogs();
  }

  private async getPreviousPeriodProfile(
    schoolId: string,
    periodType: string,
    currentValue: string,
  ) {
    const current = new Date(currentValue);
    let previousDate: Date;

    switch (periodType) {
      case 'DAILY':
        previousDate = new Date(current);
        previousDate.setDate(previousDate.getDate() - 1);
        break;
      case 'WEEKLY':
        previousDate = new Date(current);
        previousDate.setDate(previousDate.getDate() - 7);
        break;
      case 'MONTHLY':
        previousDate = new Date(current);
        previousDate.setMonth(previousDate.getMonth() - 1);
        break;
      default:
        return null;
    }

    const pv = previousDate.toISOString().split('T')[0];

    return this.prisma.schoolProfileSummary.findFirst({
      where: { schoolId, periodType, periodValue: pv },
    });
  }

  private getDefaultMetrics(): SchoolMetrics {
    return {
      attendanceRate: 0,
      attendanceMaleRate: 0,
      attendanceFemaleRate: 0,
      totalStudents: 0,
      totalBoys: 0,
      totalGirls: 0,
      genderRatio: 0,
      growthRate: 0,
      studentTeacherRatio: 0,
      qualifiedTeacherRate: 0,
      infrastructureScore: 0,
    };
  }

  private getDefaultZonalMetrics(): ZonalMetrics {
    return {
      averageAttendance: 0,
      averageGenderRatio: 0,
      averageGrowthRate: 0,
      averageStudentTeacherRatio: 0,
      averageQualifiedTeacherRate: 0,
      schoolsWithGoodInfrastructure: 0,
    };
  }
}