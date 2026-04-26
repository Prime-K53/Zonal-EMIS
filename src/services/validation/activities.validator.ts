import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import {
  ValidationResult,
  ValidationError,
  createValidationError,
  isValidDate,
  isTodayOrPast,
  isPositiveInt,
  isNonEmptyString,
} from './types';

function toDateString(date: string | Date | undefined): string | undefined {
  if (!date) return undefined;
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
}

export interface SMCMeetingData {
  schoolId: string;
  date: string | Date;
  topic?: string;
  participants?: number;
  decisions?: string;
  nextMeeting?: string | Date;
}

export interface InspectionData {
  schoolId: string;
  teacherId?: string;
  inspectorId: string;
  date: string | Date;
  score?: number;
  type?: string;
  findings?: string;
}

@Injectable()
export class ActivitiesValidator {
  private readonly logger = new Logger(ActivitiesValidator.name);

  constructor(private prisma: PrismaService) {}

  async validateSMCMeetingCreate(data: SMCMeetingData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(data.schoolId)) {
      errors.push(
        createValidationError('schoolId', 'School ID is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isNonEmptyString(data.topic)) {
      errors.push(
        createValidationError('topic', 'Meeting topic is required', 'REQUIRED_FIELD'),
      );
    }

    const meetingDate = data.date ? new Date(data.date) : null;
    if (!meetingDate || isNaN(meetingDate.getTime())) {
      errors.push(
        createValidationError('date', 'Valid meeting date is required', 'INVALID_DATE'),
      );
    } else if (!isTodayOrPast(toDateString(data.date))) {
      errors.push(
        createValidationError(
          'date',
          'Meeting date cannot be in the future',
          'FUTURE_DATE',
        ),
      );
    }

    if (data.participants !== undefined) {
      if (!isPositiveInt(data.participants)) {
        errors.push(
          createValidationError(
            'participants',
            'Must be a positive integer',
            'INVALID_NUMBER',
          ),
        );
      } else if (data.participants < 5) {
        errors.push(
          createValidationError(
            'participants',
            'SMC meetings require at least 5 participants',
            'MINIMUM_PARTICIPANTS',
          ),
        );
      } else if (data.participants > 500) {
        errors.push(
          createValidationError(
            'participants',
            'Maximum 500 participants allowed',
            'MAXIMUM_PARTICIPANTS',
          ),
        );
      }
    }

    if (data.nextMeeting) {
      const nextDate = new Date(data.nextMeeting);
      if (meetingDate && nextDate <= meetingDate) {
        errors.push(
          createValidationError(
            'nextMeeting',
            'Next meeting must be after current meeting',
            'INVALID_DATE',
          ),
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async validateSMCMeetingUpdate(
    data: SMCMeetingData,
    existingId: string,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (data.nextMeeting && data.date) {
      const currentDate = new Date(data.date);
      const nextDate = new Date(data.nextMeeting);
      if (nextDate <= currentDate) {
        errors.push(
          createValidationError(
            'nextMeeting',
            'Next meeting must be after current meeting',
            'INVALID_DATE',
          ),
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async validateInspectionCreate(data: InspectionData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(data.schoolId)) {
      errors.push(
        createValidationError('schoolId', 'School ID is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isNonEmptyString(data.inspectorId)) {
      errors.push(
        createValidationError('inspectorId', 'Inspector ID is required', 'REQUIRED_FIELD'),
      );
    }

    const inspectionDate = data.date ? new Date(data.date) : null;
    if (!inspectionDate || isNaN(inspectionDate.getTime())) {
      errors.push(
        createValidationError('date', 'Valid inspection date is required', 'INVALID_DATE'),
      );
    } else if (!isTodayOrPast(data.date as string)) {
      errors.push(
        createValidationError(
          'date',
          'Inspection date cannot be in the future',
          'FUTURE_DATE',
        ),
      );
    }

    if (data.score !== undefined) {
      if (typeof data.score !== 'number' || isNaN(data.score)) {
        errors.push(
          createValidationError('score', 'Score must be a number', 'INVALID_NUMBER'),
        );
      } else if (data.score < 0 || data.score > 100) {
        errors.push(
          createValidationError(
            'score',
            'Score must be between 0 and 100',
            'INVALID_SCORE',
          ),
        );
      }
    }

    if (data.type && !['School', 'Teacher'].includes(data.type)) {
      errors.push(
        createValidationError(
          'type',
          'Type must be School or Teacher',
          'INVALID_TYPE',
        ),
      );
    }

    if (data.teacherId && !isNonEmptyString(data.teacherId)) {
      errors.push(
        createValidationError(
          'teacherId',
          'Valid teacher ID required when type is Teacher',
          'REQUIRED_FIELD',
        ),
      );
    }

    return { valid: errors.length === 0, errors };
  }

  async validateInspectionUpdate(
    data: InspectionData,
    existingId: string,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (data.score !== undefined) {
      if (typeof data.score !== 'number' || isNaN(data.score)) {
        errors.push(
          createValidationError('score', 'Score must be a number', 'INVALID_NUMBER'),
        );
      } else if (data.score < 0 || data.score > 100) {
        errors.push(
          createValidationError(
            'score',
            'Score must be between 0 and 100',
            'INVALID_SCORE',
          ),
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }
}