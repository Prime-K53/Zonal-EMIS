import { Injectable, Logger, LoggerService } from '@nestjs/common';
import { MetricsCalculationException } from '../../src/exceptions/metrics.exceptions';

export interface LogEntry {
  timestamp: string;
  level: 'log' | 'error' | 'warn' | 'debug' | 'verbose';
  message: string;
  context?: Record<string, any>;
  duration?: number;
  schoolId?: string;
  zone?: string;
  periodType?: string;
  periodValue?: string;
}

@Injectable()
export class MetricsLoggerService implements LoggerService {
  private readonly logger = new Logger(MetricsLoggerService.name);
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  log(message: string, context?: Record<string, any>) {
    this.addLog('log', message, context);
  }

  error(message: string, trace?: string, context?: Record<string, any>) {
    this.addLog('error', message, context, trace);
  }

  warn(message: string, context?: Record<string, any>) {
    this.addLog('warn', message, context);
  }

  debug(message: string, context?: Record<string, any>) {
    this.addLog('debug', message, context);
  }

  verbose(message: string, context?: Record<string, any>) {
    this.addLog('verbose', message, context);
  }

  private addLog(
    level: LogEntry['level'],
    message: string,
    context?: Record<string, any>,
    trace?: string,
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        source: 'metrics-service',
      },
    };

    if (trace) {
      entry.context.trace = trace;
    }

    this.logs.push(entry);

    // Keep only the most recent logs
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // Forward to the main logger
    this.logger[level](message, context);
  }

  getLogs(level?: LogEntry['level'], limit?: number): LogEntry[] {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = this.logs.filter(log => log.level === level);
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }

    return filteredLogs;
  }

  getLogStats(): {
    total: number;
    byLevel: Record<LogEntry['level'], number>;
    recentErrors: LogEntry[];
  } {
    const byLevel: Record<LogEntry['level'], number> = {
      log: 0,
      error: 0,
      warn: 0,
      debug: 0,
      verbose: 0,
    };

    this.logs.forEach(log => {
      byLevel[log.level]++;
    });

    const recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-10);

    return {
      total: this.logs.length,
      byLevel,
      recentErrors,
    };
  }

  clearLogs(): void {
    this.logs = [];
    this.logger.log('Metrics logs cleared');
  }

  exportLogs(): LogEntry[] {
    return [...this.logs];
  }

  logOperationStart(
    operation: string,
    context?: Record<string, any>,
  ): { startTime: number; logId: string } {
    const startTime = Date.now();
    const logId = `${operation}-${startTime}-${Math.random().toString(36).substr(2, 9)}`;

    this.log(`Starting operation: ${operation}`, {
      ...context,
      logId,
      startTime,
    });

    return { startTime, logId };
  }

  logOperationEnd(
    operation: string,
    result: { success: boolean; duration: number; error?: string },
    context?: Record<string, any>,
  ): void {
    const logData = {
      ...context,
      operation,
      duration: result.duration,
      success: result.success,
    };

    if (result.error) {
      this.error(`Operation ${operation} failed`, result.error, logData);
    } else {
      this.log(`Operation ${operation} completed successfully`, logData);
    }
  }

  logCacheOperation(
    operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
    key: string,
    duration?: number,
    context?: Record<string, any>,
  ): void {
    const message = `Cache ${operation}: ${key}`;
    const logData = {
      ...context,
      cacheOperation: operation,
      cacheKey: key,
      duration,
    };

    if (operation === 'hit') {
      this.debug(message, logData);
    } else if (operation === 'miss') {
      this.verbose(message, logData);
    } else {
      this.log(message, logData);
    }
  }

  logDatabaseOperation(
    operation: 'query' | 'create' | 'update' | 'delete',
    table: string,
    duration: number,
    context?: Record<string, any>,
  ): void {
    const message = `Database ${operation} on ${table} took ${duration}ms`;
    const logData = {
      ...context,
      databaseOperation: operation,
      table,
      duration,
    };

    if (duration > 1000) {
      this.warn(message, logData);
    } else if (duration > 500) {
      this.log(message, logData);
    } else {
      this.debug(message, logData);
    }
  }

  logApiRequest(
    method: string,
    endpoint: string,
    statusCode: number,
    duration: number,
    context?: Record<string, any>,
  ): void {
    const message = `API ${method} ${endpoint} - ${statusCode} (${duration}ms)`;
    const logData = {
      ...context,
      method,
      endpoint,
      statusCode,
      duration,
    };

    if (statusCode >= 500) {
      this.error(message, undefined, logData);
    } else if (statusCode >= 400) {
      this.warn(message, logData);
    } else if (duration > 2000) {
      this.warn(message, logData);
    } else if (duration > 1000) {
      this.log(message, logData);
    } else {
      this.debug(message, logData);
    }
  }
}