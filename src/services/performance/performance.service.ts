import { Injectable, Logger } from '@nestjs/common';
import { MetricsCalculationException } from '../../src/exceptions/metrics.exceptions';

export interface PerformanceMetrics {
  operation: string;
  duration: number;
  timestamp: string;
  schoolId?: string;
  zone?: string;
  periodType?: string;
  periodValue?: string;
  success: boolean;
  error?: string;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private metrics: PerformanceMetrics[] = [];
  private readonly MAX_METRICS = 1000;

  async trackPerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    options: {
      schoolId?: string;
      zone?: string;
      periodType?: string;
      periodValue?: string;
    } = {},
  ): Promise<{ result: T; metrics: PerformanceMetrics }> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;

      const metrics: PerformanceMetrics = {
        operation,
        duration,
        timestamp,
        success: true,
        ...options,
      };

      this.recordMetrics(metrics);
      this.logger.debug(`${operation} completed in ${duration}ms`);

      return { result, metrics };
    } catch (error) {
      const duration = Date.now() - startTime;

      const metrics: PerformanceMetrics = {
        operation,
        duration,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        ...options,
      };

      this.recordMetrics(metrics);
      this.logger.error(`${operation} failed after ${duration}ms: ${error.message}`);

      throw error;
    }
  }

  private recordMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  getPerformanceStats(operation?: string): {
    total: number;
    average: number;
    min: number;
    max: number;
    successRate: number;
    recentMetrics: PerformanceMetrics[];
  } {
    let filteredMetrics = this.metrics;

    if (operation) {
      filteredMetrics = this.metrics.filter(m => m.operation === operation);
    }

    if (filteredMetrics.length === 0) {
      return {
        total: 0,
        average: 0,
        min: 0,
        max: 0,
        successRate: 0,
        recentMetrics: [],
      };
    }

    const successful = filteredMetrics.filter(m => m.success).length;
    const durations = filteredMetrics.map(m => m.duration);

    return {
      total: filteredMetrics.length,
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      successRate: (successful / filteredMetrics.length) * 100,
      recentMetrics: filteredMetrics.slice(-10),
    };
  }

  getSlowOperations(threshold: number = 1000): PerformanceMetrics[] {
    return this.metrics
      .filter(m => m.duration > threshold && m.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  getErrorOperations(): PerformanceMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);
  }

  clearMetrics(): void {
    this.metrics = [];
    this.logger.log('Performance metrics cleared');
  }

  exportMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }
}