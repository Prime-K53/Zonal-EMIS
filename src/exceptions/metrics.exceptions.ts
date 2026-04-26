import { HttpException, HttpStatus } from '@nestjs/common';

export class MetricsNotFoundException extends HttpException {
  constructor(schoolId: string, periodType: string, periodValue: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Metrics not found for school ${schoolId} for period ${periodType}/${periodValue}`,
        error: 'NOT_FOUND',
        details: {
          schoolId,
          periodType,
          periodValue,
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class ZoneNotFoundException extends HttpException {
  constructor(zone: string) {
    super(
      {
        statusCode: HttpStatus.NOT_FOUND,
        message: `Zone not found: ${zone}`,
        error: 'NOT_FOUND',
        details: {
          zone,
        },
      },
      HttpStatus.NOT_FOUND,
    );
  }
}

export class InvalidMetricsDataException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid metrics data: ${message}`,
        error: 'INVALID_DATA',
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MetricsCalculationException extends HttpException {
  constructor(message: string, details?: any) {
    super(
      {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: `Metrics calculation failed: ${message}`,
        error: 'CALCULATION_ERROR',
        details,
      },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

export class PeriodValueFormatException extends HttpException {
  constructor(periodType: string, periodValue: string) {
    super(
      {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid period value ${periodValue} for period type ${periodType}`,
        error: 'INVALID_PERIOD_FORMAT',
        details: {
          periodType,
          periodValue,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class MetricsCacheException extends HttpException {
  constructor(message: string) {
    super(
      {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: `Metrics cache error: ${message}`,
        error: 'CACHE_ERROR',
      },
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}