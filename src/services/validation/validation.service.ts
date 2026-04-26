import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';
import { AttendanceValidator, AttendanceData } from './attendance.validator';
import { EnrollmentValidator, LearnerData } from './enrollment.validator';
import { ActivitiesValidator, SMCMeetingData, InspectionData } from './activities.validator';
import { ValidationResult, ValidationException } from './types';

const ENTITY_VALIDATORS: Record<string, any> = {
  'daily-attendance': 'AttendanceValidator',
  learners: 'EnrollmentValidator',
  'smc-meetings': 'ActivitiesValidator',
  inspections: 'ActivitiesValidator',
};

@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);

  constructor(
    private prisma: PrismaService,
    private attendanceValidator: AttendanceValidator,
    private enrollmentValidator: EnrollmentValidator,
    private activitiesValidator: ActivitiesValidator,
  ) {}

  async validate(
    entity: string,
    data: any,
    existingId?: string,
  ): Promise<ValidationResult> {
    this.logger.debug(`Validating ${entity}`);

    switch (entity) {
      case 'daily-attendance':
        return await this.validateAttendance(data, existingId);

      case 'learners':
        return await this.validateLearner(data, existingId);

      case 'smc-meetings':
        return await this.validateSMCMeeting(data, existingId);

      case 'inspections':
        return await this.validateInspection(data, existingId);

      default:
        return { valid: true, errors: [] };
    }
  }

  private async validateAttendance(
    data: AttendanceData,
    existingId?: string,
  ): Promise<ValidationResult> {
    if (existingId) {
      return this.attendanceValidator.validateUpdate(data, existingId);
    }
    return this.attendanceValidator.validateCreate(data);
  }

  private async validateLearner(
    data: LearnerData,
    existingId?: string,
  ): Promise<ValidationResult> {
    if (existingId) {
      return this.enrollmentValidator.validateUpdate(data, existingId);
    }
    return this.enrollmentValidator.validateCreate(data);
  }

  private async validateSMCMeeting(
    data: SMCMeetingData,
    existingId?: string,
  ): Promise<ValidationResult> {
    if (existingId) {
      return this.activitiesValidator.validateSMCMeetingUpdate(data, existingId);
    }
    return this.activitiesValidator.validateSMCMeetingCreate(data);
  }

  private async validateInspection(
    data: InspectionData,
    existingId?: string,
  ): Promise<ValidationResult> {
    if (existingId) {
      return this.activitiesValidator.validateInspectionUpdate(data, existingId);
    }
    return this.activitiesValidator.validateInspectionCreate(data);
  }

  throwIfInvalid(result: ValidationResult, entity?: string) {
    if (!result.valid) {
      throw new ValidationException(result.errors, entity);
    }
  }
}