import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import {
  ValidationResult,
  ValidationError,
  createValidationError,
  isValidDate,
  isPositiveInt,
  isNonEmptyString,
  isValidGender,
} from './types';

export interface LearnerData {
  schoolId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth?: string | Date;
  standard?: string;
  admissionNumber?: string;
  status?: string;
  isAdmission?: boolean;
  isSNE?: boolean;
  sneType?: string;
  disabilityType?: string;
  guardianName?: string;
  guardianPhone?: string;
  address?: string;
}

@Injectable()
export class EnrollmentValidator {
  private readonly logger = new Logger(EnrollmentValidator.name);

  constructor(private prisma: PrismaService) {}

  async validateCreate(data: LearnerData): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (!isNonEmptyString(data.schoolId)) {
      errors.push(
        createValidationError('schoolId', 'School ID is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isNonEmptyString(data.firstName)) {
      errors.push(
        createValidationError('firstName', 'First name is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isNonEmptyString(data.lastName)) {
      errors.push(
        createValidationError('lastName', 'Last name is required', 'REQUIRED_FIELD'),
      );
    }

    if (!isValidGender(data.gender)) {
      errors.push(
        createValidationError(
          'gender',
          'Gender must be Male, Female, M, or F',
          'INVALID_GENDER',
          data.gender,
        ),
      );
    }

    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push(
          createValidationError(
            'dateOfBirth',
            'Date of birth must be a valid date',
            'INVALID_DATE',
          ),
        );
      } else {
        const today = new Date();
        const minAge = new Date();
        minAge.setFullYear(minAge.getFullYear() - 25);
        const maxAge = new Date();
        maxAge.setFullYear(maxAge.getFullYear() - 3);

        if (dob > today) {
          errors.push(
            createValidationError(
              'dateOfBirth',
              'Date of birth cannot be in the future',
              'FUTURE_DATE',
            ),
          );
        } else if (dob > maxAge) {
          errors.push(
            createValidationError(
              'dateOfBirth',
              'Learner must be at least 3 years old',
              'AGE_TOO_YOUNG',
            ),
          );
        } else if (dob < minAge) {
          errors.push(
            createValidationError(
              'dateOfBirth',
              'Learner cannot be older than 25 years',
              'AGE_TOO_OLD',
            ),
          );
        }
      }
    }

    if (!isNonEmptyString(data.standard)) {
      errors.push(
        createValidationError('standard', 'Class/Standard is required', 'REQUIRED_FIELD'),
      );
    }

    if (data.admissionNumber) {
      const existing = await this.prisma.learner.findFirst({
        where: { admissionNumber: data.admissionNumber },
      });
      if (existing) {
        errors.push(
          createValidationError(
            'admissionNumber',
            'Admission number already exists',
            'DUPLICATE_ADMISSION',
          ),
        );
      }
    }

    if (data.isSNE && !isNonEmptyString(data.sneType)) {
      errors.push(
        createValidationError(
          'sneType',
          'SNE type is required when learner has SNE',
          'REQUIRED_FIELD',
        ),
      );
    }

    if (data.disabilityType && !isNonEmptyString(data.disabilityType)) {
      errors.push(
        createValidationError(
          'disabilityType',
          'Must provide disability type if specified',
          'INVALID_VALUE',
        ),
      );
    }

    return { valid: errors.length === 0, errors };
  }

  async validateUpdate(
    data: LearnerData,
    existingId: string,
  ): Promise<ValidationResult> {
    const errors: ValidationError[] = [];

    if (data.admissionNumber) {
      const existing = await this.prisma.learner.findFirst({
        where: {
          admissionNumber: data.admissionNumber,
          NOT: { id: existingId },
        },
      });
      if (existing) {
        errors.push(
          createValidationError(
            'admissionNumber',
            'Admission number already exists',
            'DUPLICATE_ADMISSION',
          ),
        );
      }
    }

    if (data.gender && !isValidGender(data.gender)) {
      errors.push(
        createValidationError(
          'gender',
          'Gender must be Male, Female, M, or F',
          'INVALID_GENDER',
        ),
      );
    }

    if (data.dateOfBirth) {
      const dob = new Date(data.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errors.push(
          createValidationError(
            'dateOfBirth',
            'Date of birth must be a valid date',
            'INVALID_DATE',
          ),
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }
}