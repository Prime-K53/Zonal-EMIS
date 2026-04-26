// src/modules/enrollment/enrollment.controller.ts
import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Logger } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { AuthGuard } from '../../common/guards/auth.guard';

@Controller('enrollment')
@UseGuards(AuthGuard)
export class EnrollmentController {
  private readonly logger = new Logger(EnrollmentController.name);

  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get('reference/:schoolId')
  async getEnrollmentReference(
    @Param('schoolId') schoolId: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.enrollmentService.getEnrollmentReference(schoolId, academicYear);
  }

  @Post()
  async createEnrollmentRecord(@Body() dto: any) {
    return this.enrollmentService.createEnrollmentRecord(dto);
  }

  @Get('history/:schoolId')
  async getSchoolEnrollmentHistory(@Param('schoolId') schoolId: string) {
    return this.enrollmentService.getSchoolEnrollmentHistory(schoolId);
  }

  @Get('standard/:schoolId/:standard')
  async getEnrollmentForStandard(
    @Param('schoolId') schoolId: string,
    @Param('standard') standard: string,
    @Query('academicYear') academicYear?: string,
  ) {
    return this.enrollmentService.getEnrollmentForStandard(schoolId, standard, academicYear);
  }

  @Delete(':id')
  async deleteEnrollmentRecord(@Param('id') id: string) {
    return this.enrollmentService.deleteEnrollmentRecord(id);
  }
}