import { Module } from '@nestjs/common';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { ValidationService } from './validation.service';
import { AttendanceValidator } from './attendance.validator';
import { EnrollmentValidator } from './enrollment.validator';
import { ActivitiesValidator } from './activities.validator';

@Module({
  imports: [PrismaModule],
  providers: [
    ValidationService,
    AttendanceValidator,
    EnrollmentValidator,
    ActivitiesValidator,
  ],
  exports: [ValidationService, AttendanceValidator, EnrollmentValidator, ActivitiesValidator],
})
export class ValidationModule {}