import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  ValidationPipe,
  HttpException,
  HttpStatus,
  Logger,
  Post,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiOkResponse } from '@nestjs/swagger';
import { MetricsService } from '../services/metrics/metrics.service';
import { CacheService } from '../services/cache/cache.service';
import { PerformanceService } from '../services/performance/performance.service';
import {
  GetSchoolMetricsDto,
  GetZoneMetricsDto,
  GetZoneRankingDto,
} from '../dtos/metrics.dto';
import {
  MetricsNotFoundException,
  ZoneNotFoundException,
  InvalidMetricsDataException,
  MetricsCalculationException,
} from '../exceptions/metrics.exceptions';
import {
  SchoolMetrics,
  ComparativeMetrics,
  ZonalMetrics,
  SchoolRanking,
  RankingPagination,
  CacheStats,
  PerformanceStats,
} from '../docs/metrics.swagger';

@ApiTags('metrics')
@Controller('metrics')
export class MetricsController {
  private readonly logger = new Logger(MetricsController.name);

  constructor(
    private metricsService: MetricsService,
    private cacheService: CacheService,
    private performanceService: PerformanceService,
  ) {}

  @Get('school/:schoolId')
  @ApiOperation({ 
    summary: 'Get school metrics and comparison',
    description: 'Retrieves comprehensive metrics for a specific school including attendance, enrollment, infrastructure, and trend analysis compared to the previous period.'
  })
  @ApiParam({ 
    name: 'schoolId', 
    description: 'Unique identifier for the school',
    example: 'school-123'
  })
  @ApiQuery({ 
    name: 'periodType', 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'YEARLY'], 
    required: false,
    description: 'Time period for the metrics calculation'
  })
  @ApiQuery({ 
    name: 'periodValue', 
    required: false,
    description: 'Specific date value for the period (format depends on periodType)',
    example: '2026-04-26'
  })
  @ApiOkResponse({
    description: 'School metrics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                schoolId: { type: 'string' },
                periodType: { type: 'string' },
                periodValue: { type: 'string' },
                metrics: { $ref: '#/components/Schema/SchoolMetrics' },
                comparison: { $ref: '#/components/Schema/ComparativeMetrics' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'School metrics not found' })
  async getSchoolMetrics(
    @Param('schoolId') schoolId: string,
    @Query(new ValidationPipe({ transform: true })) query: GetSchoolMetricsDto,
  ) {
    try {
      const { periodType = 'DAILY', periodValue } = query;
      const periodValueFinal = periodValue || new Date().toISOString().split('T')[0];

      this.logger.log(`Getting metrics for school ${schoolId}, period ${periodType}/${periodValueFinal}`);

      const [current, comparative] = await Promise.all([
        this.metricsService.computeSchoolMetrics(schoolId, periodType, periodValueFinal),
        this.metricsService.getComparativeMetrics(schoolId, periodType, periodValueFinal),
      ]);

      if (!current || current.totalStudents === 0) {
        throw new MetricsNotFoundException(schoolId, periodType, periodValueFinal);
      }

      return {
        success: true,
        data: {
          schoolId,
          periodType,
          periodValue: periodValueFinal,
          metrics: current,
          comparison: comparative,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting school metrics: ${error.message}`, error.stack);
      
      if (error instanceof MetricsNotFoundException) {
        throw error;
      }
      
      if (error instanceof InvalidMetricsDataException) {
        throw error;
      }
      
      throw new MetricsCalculationException(
        `Failed to get school metrics: ${error.message}`,
        { schoolId, periodType, periodValue: query.periodValue },
      );
    }
  }

  @Get('zone/:zone')
  @ApiOperation({ 
    summary: 'Get zone metrics',
    description: 'Retrieves aggregated metrics for all schools within a specific zone, including averages and summary statistics.'
  })
  @ApiParam({ 
    name: 'zone', 
    description: 'Name of the zone to get metrics for',
    example: 'North Zone'
  })
  @ApiQuery({ 
    name: 'periodType', 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'YEARLY'], 
    required: false,
    description: 'Time period for the metrics calculation'
  })
  @ApiQuery({ 
    name: 'periodValue', 
    required: false,
    description: 'Specific date value for the period (format depends on periodType)',
    example: '2026-04'
  })
  @ApiOkResponse({
    description: 'Zone metrics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                zone: { type: 'string' },
                periodType: { type: 'string' },
                periodValue: { type: 'string' },
                metrics: { $ref: '#/components/Schema/ZonalMetrics' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async getZoneMetrics(
    @Param('zone') zone: string,
    @Query(new ValidationPipe({ transform: true })) query: GetZoneMetricsDto,
  ) {
    try {
      const { periodType = 'MONTHLY', periodValue } = query;
      const periodValueFinal = periodValue || new Date().toISOString().slice(0, 7);

      this.logger.log(`Getting metrics for zone ${zone}, period ${periodType}/${periodValueFinal}`);

      const metrics = await this.metricsService.computeZonalMetrics(zone, periodType, periodValueFinal);

      if (!metrics || metrics.averageAttendance === 0) {
        throw new ZoneNotFoundException(zone);
      }

      return {
        success: true,
        data: {
          zone,
          periodType,
          periodValue: periodValueFinal,
          metrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting zone metrics: ${error.message}`, error.stack);
      
      if (error instanceof ZoneNotFoundException) {
        throw error;
      }
      
      throw new MetricsCalculationException(
        `Failed to get zone metrics: ${error.message}`,
        { zone, periodType, periodValue: query.periodValue },
      );
    }
  }

  @Get('zone/:zone/ranking')
  @ApiOperation({ 
    summary: 'Get zone school ranking',
    description: 'Retrieves performance ranking of all schools within a zone, with pagination and sorting options. Schools are scored based on attendance and infrastructure.'
  })
  @ApiParam({ 
    name: 'zone', 
    description: 'Name of the zone to get school rankings for',
    example: 'North Zone'
  })
  @ApiQuery({ 
    name: 'periodType', 
    enum: ['DAILY', 'WEEKLY', 'MONTHLY', 'TERMLY', 'YEARLY'], 
    required: false,
    description: 'Time period for the ranking calculation'
  })
  @ApiQuery({ 
    name: 'periodValue', 
    required: false,
    description: 'Specific date value for the period (format depends on periodType)',
    example: '2026-04'
  })
  @ApiQuery({ 
    name: 'page', 
    required: false,
    description: 'Page number for pagination',
    example: 1,
    type: 'integer',
    minimum: 1
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false,
    description: 'Number of schools per page',
    example: 10,
    type: 'integer',
    minimum: 1,
    maximum: 100
  })
  @ApiQuery({ 
    name: 'sortBy', 
    enum: ['score', 'attendanceRate', 'infrastructureScore'], 
    required: false,
    description: 'Field to sort by'
  })
  @ApiQuery({ 
    name: 'sortOrder', 
    enum: ['asc', 'desc'], 
    required: false,
    description: 'Sort direction'
  })
  @ApiOkResponse({
    description: 'Zone ranking retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                zone: { type: 'string' },
                periodType: { type: 'string' },
                periodValue: { type: 'string' },
                ranking: { $ref: '#/components/Schema/RankingPagination' },
                schools: {
                  type: 'array',
                  items: { $ref: '#/components/Schema/SchoolRanking' },
                },
              },
            },
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 404, description: 'Zone not found' })
  async getZoneRanking(
    @Param('zone') zone: string,
    @Query(new ValidationPipe({ transform: true })) query: GetZoneRankingDto,
  ) {
    try {
      const { periodType = 'MONTHLY', periodValue, page = 1, limit = 10, sortBy = 'score', sortOrder = 'desc' } = query;
      const periodValueFinal = periodValue || new Date().toISOString().slice(0, 7);

      this.logger.log(`Getting ranking for zone ${zone}, period ${periodType}/${periodValueFinal}`);

      const result = await this.metricsService.getZoneRanking(zone, periodType, periodValueFinal, page, limit);

      return {
        success: true,
        data: {
          zone,
          periodType,
          periodValue: periodValueFinal,
          ranking: result.pagination,
          schools: result.schools,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting zone ranking: ${error.message}`, error.stack);
      
      throw new MetricsCalculationException(
        `Failed to get zone ranking: ${error.message}`,
        { zone, periodType, periodValue: query.periodValue },
      );
    }
  }

  @Get('performance/stats')
  @ApiOperation({ 
    summary: 'Get performance statistics',
    description: 'Retrieves detailed performance statistics for all metrics operations, including response times, success rates, and slow operations.'
  })
  @ApiOkResponse({
    description: 'Performance statistics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                schoolMetrics: { $ref: '#/components/Schema/PerformanceStats' },
                zonalMetrics: { $ref: '#/components/Schema/PerformanceStats' },
                comparativeMetrics: { $ref: '#/components/Schema/PerformanceStats' },
                zoneRanking: { $ref: '#/components/Schema/PerformanceStats' },
                slowOperations: {
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
                },
                errorOperations: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      operation: { type: 'string' },
                      duration: { type: 'number' },
                      timestamp: { type: 'string' },
                      success: { type: 'boolean' },
                      error: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getPerformanceStats() {
    try {
      const stats = await this.metricsService.getPerformanceStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting performance stats: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to get performance stats: ${error.message}`);
    }
  }

  @Post('cache/clear')
  @ApiOperation({ 
    summary: 'Clear all metrics cache',
    description: 'Clears the entire metrics cache, forcing fresh calculations on the next request.'
  })
  @ApiOkResponse({
    description: 'Cache cleared successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  async clearCache() {
    try {
      await this.cacheService.clear();
      return {
        success: true,
        message: 'All metrics cache cleared',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to clear cache: ${error.message}`);
    }
  }

  @Get('cache/stats')
  @ApiOperation({ 
    summary: 'Get cache statistics',
    description: 'Retrieves statistics about the current state of the metrics cache including memory usage and entry counts.'
  })
  @ApiOkResponse({
    description: 'Cache statistics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: { $ref: '#/components/Schema/CacheStats' },
          },
        },
      ],
    },
  })
  async getCacheStats() {
    try {
      const stats = await this.cacheService.getCacheStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting cache stats: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to get cache stats: ${error.message}`);
    }
  }

  @Get('logs')
  @ApiOperation({ 
    summary: 'Get metrics logs',
    description: 'Retrieves logs from the metrics service for debugging and monitoring purposes.'
  })
  @ApiQuery({ 
    name: 'level', 
    enum: ['log', 'error', 'warn', 'debug', 'verbose'], 
    required: false,
    description: 'Filter logs by level'
  })
  @ApiQuery({ 
    name: 'limit', 
    required: false,
    description: 'Maximum number of logs to return',
    example: 100,
    type: 'integer',
    minimum: 1,
    maximum: 1000
  })
  @ApiOkResponse({
    description: 'Logs retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  timestamp: { type: 'string' },
                  level: { type: 'string' },
                  message: { type: 'string' },
                  context: { type: 'object' },
                  duration: { type: 'number' },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number,
  ) {
    try {
      const logs = await this.metricsService.getLogs(level, limit);
      return {
        success: true,
        data: logs,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting logs: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to get logs: ${error.message}`);
    }
  }

  @Get('logs/stats')
  @ApiOperation({ 
    summary: 'Get metrics log statistics',
    description: 'Retrieves statistics about the metrics service logs including counts by level and recent errors.'
  })
  @ApiOkResponse({
    description: 'Log statistics retrieved successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                total: { type: 'integer' },
                byLevel: {
                  type: 'object',
                  properties: {
                    log: { type: 'integer' },
                    error: { type: 'integer' },
                    warn: { type: 'integer' },
                    debug: { type: 'integer' },
                    verbose: { type: 'integer' },
                  },
                },
                recentErrors: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      timestamp: { type: 'string' },
                      level: { type: 'string' },
                      message: { type: 'string' },
                      context: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      ],
    },
  })
  async getLogStats() {
    try {
      const stats = await this.metricsService.getLogStats();
      return {
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error getting log stats: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to get log stats: ${error.message}`);
    }
  }

  @Post('logs/clear')
  @ApiOperation({ 
    summary: 'Clear metrics logs',
    description: 'Clears all logs from the metrics service. Use this for cleanup when logs become too large.'
  })
  @ApiOkResponse({
    description: 'Logs cleared successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  async clearLogs() {
    try {
      await this.metricsService.clearLogs();
      return {
        success: true,
        message: 'Metrics logs cleared',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error clearing logs: ${error.message}`, error.stack);
      throw new MetricsCalculationException(`Failed to clear logs: ${error.message}`);
    }
  }

  @Delete('cache/school/:schoolId')
  @ApiOperation({ 
    summary: 'Clear cache for specific school',
    description: 'Clears all cached metrics for a specific school, including any zone rankings that include this school.'
  })
  @ApiParam({ 
    name: 'schoolId', 
    description: 'School ID to clear cache for',
    example: 'school-123'
  })
  @ApiOkResponse({
    description: 'School cache cleared successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  async clearSchoolCache(@Param('schoolId') schoolId: string) {
    try {
      await this.metricsService.invalidateSchoolMetrics(schoolId);
      return {
        success: true,
        message: `Cache cleared for school ${schoolId}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error clearing school cache: ${error.message}`, error.stack);
      throw new MetricsCalculationException(
        `Failed to clear school cache: ${error.message}`,
        { schoolId },
      );
    }
  }

  @Delete('cache/zone/:zone')
  @ApiOperation({ 
    summary: 'Clear cache for specific zone',
    description: 'Clears all cached metrics for a specific zone, including school rankings within that zone.'
  })
  @ApiParam({ 
    name: 'zone', 
    description: 'Zone name to clear cache for',
    example: 'North Zone'
  })
  @ApiOkResponse({
    description: 'Zone cache cleared successfully',
    schema: {
      allOf: [
        { $ref: '#/components/ApiResponse/ApiResponse' },
        {
          properties: {
            data: {
              properties: {
                message: { type: 'string' },
              },
            },
          },
        },
      ],
    },
  })
  async clearZoneCache(@Param('zone') zone: string) {
    try {
      await this.metricsService.invalidateZoneMetrics(zone);
      return {
        success: true,
        message: `Cache cleared for zone ${zone}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(`Error clearing zone cache: ${error.message}`, error.stack);
      throw new MetricsCalculationException(
        `Failed to clear zone cache: ${error.message}`,
        { zone },
      );
    }
  }
}