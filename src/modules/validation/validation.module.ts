import { Module } from '@nestjs/common';
import { PrismaModule } from '../../modules/prisma/prisma.module';
import { ValidationService } from '../../services/validation/validation.service';
import { AttendanceValidator } from '../../services/validation/attendance.validator';
import { EnrollmentValidator } from '../../services/validation/enrollment.validator';
import { ActivitiesValidator } from '../../services/validation/activities.validator';

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