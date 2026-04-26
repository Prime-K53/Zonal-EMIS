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

export interface AttendanceData {
  schoolId: string;
  date: string;
  learners?: string;
  teachers?: string;
  submittedBy?: string;
}

@Injectable()
export class AttendanceValidator {
  private readonly logger = new Logger(AttendanceValidator.name);

  constructor(private prisma: PrismaService) {}

  async validateCreate(data: AttendanceData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(data.schoolId)) {
      errors.push(
        createValidationError('schoolId', 'School ID is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isValidDate(data.date)) {
      errors.push(
        createValidationError('date', 'Date must be a valid date', 'INVALID_DATE'),
      );
    } else if (!isTodayOrPast(data.date)) {
      errors.push(
        createValidationError(
          'date',
          'Date cannot be in the future',
          'FUTURE_DATE',
          data.date,
        ),
      );
    }

    if (!isNonEmptyString(data.submittedBy)) {
      errors.push(
        createValidationError(
          'submittedBy',
          'Submitted by is required',
          'REQUIRED_FIELD',
        ),
      );
    }

    if (data.learners) {
      try {
        const learnersData = JSON.parse(data.learners);
        const personErrors = this.validateLearnersAttendance(learnersData);
        errors.push(...personErrors);
      } catch (e) {
        errors.push(
          createValidationError(
            'learners',
            'Invalid JSON format for learners data',
            'INVALID_JSON',
          ),
        );
      }
    }

    if (data.teachers) {
      try {
        const teachersData = JSON.parse(data.teachers);
        const teacherErrors = this.validateTeachersAttendance(teachersData);
        errors.push(...teacherErrors);
      } catch (e) {
        errors.push(
          createValidationError(
            'teachers',
            'Invalid JSON format for teachers data',
            'INVALID_JSON',
          ),
        );
      }
    }

    if (errors.length === 0 && data.schoolId && data.date) {
      const duplicate = await this.checkDuplicate(data.schoolId, data.date);
      if (duplicate) {
        errors.push(
          createValidationError(
            'date',
            `Attendance already exists for this date`,
            'DUPLICATE_ENTRY',
            data.date,
          ),
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }

  async validateUpdate(
    data: AttendanceData,
    existingId: string,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (data.date) {
      const existing = await this.prisma.dailyAttendance.findUnique({
        where: { id: existingId },
        select: { date: true, schoolId: true },
      });

      if (existing && existing.date !== data.date) {
        const duplicate = await this.checkDuplicate(
          existing.schoolId,
          data.date,
          existingId,
        );
        if (duplicate) {
          errors.push(
            createValidationError(
              'date',
              'Attendance already exists for this date',
              'DUPLICATE_ENTRY',
            ),
          );
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  private async checkDuplicate(
    schoolId: string,
    date: string,
    excludeId?: string,
  ): Promise<boolean> {
    const where: any = { schoolId, date };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const existing = await this.prisma.dailyAttendance.findFirst({ where });
    return !!existing;
  }

  private validateLearnersAttendance(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    const present = data.present || {};
    const absent = data.absent || {};

    const presentBoys = present.boys || 0;
    const presentGirls = present.girls || 0;
    const absentBoys = absent.boys || 0;
    const absentGirls = absent.girls || 0;

    if (!isPositiveInt(presentBoys)) {
      errors.push(
        createValidationError(
          'learners.present.boys',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }
    if (!isPositiveInt(presentGirls)) {
      errors.push(
        createValidationError(
          'learners.present.girls',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }
    if (!isPositiveInt(absentBoys)) {
      errors.push(
        createValidationError(
          'learners.absent.boys',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }
    if (!isPositiveInt(absentGirls)) {
      errors.push(
        createValidationError(
          'learners.absent.girls',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }

    return errors;
  }

  private validateTeachersAttendance(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    const present = data.present || {};

    const presentMale = present.male || 0;
    const presentFemale = present.female || 0;

    if (!isPositiveInt(presentMale)) {
      errors.push(
        createValidationError(
          'teachers.present.male',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }
    if (!isPositiveInt(presentFemale)) {
      errors.push(
        createValidationError(
          'teachers.present.female',
          'Must be a positive integer',
          'INVALID_NUMBER',
        ),
      );
    }

    return errors;
  }
}