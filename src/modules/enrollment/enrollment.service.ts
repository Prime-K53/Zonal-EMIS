// src/modules/enrollment/enrollment.service.ts
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AggregationService } from '../../services/aggregation.service';

@Injectable()
export class EnrollmentService {
  private readonly logger = new Logger(EnrollmentService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AggregationService) private aggregationService: AggregationService,
  ) {
    this.logger.log('EnrollmentService initialized');
  }

  async getEnrollmentReference(schoolId: string, academicYear?: string) {
    const where: any = { schoolId };
    if (academicYear) where.academicYear = academicYear;

    const enrollmentStats = await this.prisma.enrollmentStat.findMany({
      where,
      orderBy: { standard: 'asc' },
    });

    const totalStudents = enrollmentStats.reduce((sum, stat) => sum + stat.boys + stat.girls, 0);
    const totalBoys = enrollmentStats.reduce((sum, stat) => sum + stat.boys, 0);
    const totalGirls = enrollmentStats.reduce((sum, stat) => sum + stat.girls, 0);
    const totalTransfersIn = enrollmentStats.reduce((sum, stat) => sum + stat.transfersIn, 0);
    const totalTransfersOut = enrollmentStats.reduce((sum, stat) => sum + stat.transfersOut, 0);
    const totalDropouts = enrollmentStats.reduce((sum, stat) => sum + stat.dropouts, 0);

    const byStandard = enrollmentStats.map(stat => ({
      standard: stat.standard,
      boys: stat.boys,
      girls: stat.girls,
      total: stat.boys + stat.girls,
      transfersIn: stat.transfersIn,
      transfersOut: stat.transfersOut,
      dropouts: stat.dropouts,
      backToSchoolBoys: stat.backToSchoolBoys,
      backToSchoolGirls: stat.backToSchoolGirls,
    }));

    return {
      schoolId,
      academicYear,
      summary: {
        totalStudents,
        totalBoys,
        totalGirls,
        totalTransfersIn,
        totalTransfersOut,
        totalDropouts,
        genderRatio: totalGirls > 0 ? (totalBoys / totalGirls).toFixed(2) : 0,
      },
      byStandard,
      generatedAt: new Date(),
    };
  }

  async createEnrollmentRecord(dto: any) {
    const existing = await this.prisma.enrollmentStat.findFirst({
      where: {
        schoolId: dto.schoolId,
        academicYear: dto.academicYear,
        standard: dto.standard,
      },
    });

    let enrollmentRecord;
    
    if (existing) {
      enrollmentRecord = await this.prisma.enrollmentStat.update({
        where: { id: existing.id },
        data: {
          boys: dto.boys,
          girls: dto.girls,
          transfersIn: dto.transfersIn,
          transfersOut: dto.transfersOut,
          dropouts: dto.dropouts,
          backToSchoolBoys: dto.backToSchoolBoys,
          backToSchoolGirls: dto.backToSchoolGirls,
        },
      });
    } else {
      enrollmentRecord = await this.prisma.enrollmentStat.create({
        data: {
          schoolId: dto.schoolId,
          academicYear: dto.academicYear,
          standard: dto.standard,
          boys: dto.boys || 0,
          girls: dto.girls || 0,
          transfersIn: dto.transfersIn || 0,
          transfersOut: dto.transfersOut || 0,
          dropouts: dto.dropouts || 0,
          backToSchoolBoys: dto.backToSchoolBoys || 0,
          backToSchoolGirls: dto.backToSchoolGirls || 0,
        },
      });
    }

    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { zone: true },
    });
    
    if (school) {
      await this.aggregationService.triggerUpdates(dto.schoolId, school.zone, 'update');
    }

    return enrollmentRecord;
  }

  async getSchoolEnrollmentHistory(schoolId: string) {
    const records = await this.prisma.enrollmentStat.findMany({
      where: { schoolId },
      orderBy: [
        { academicYear: 'desc' },
        { standard: 'asc' },
      ],
    });

    // Group by academic year
    const grouped = records.reduce((acc, record) => {
      if (!acc[record.academicYear]) {
        acc[record.academicYear] = [];
      }
      acc[record.academicYear].push(record);
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([year, stats]) => ({
      academicYear: year,
      totalStudents: stats.reduce((sum, s) => sum + s.boys + s.girls, 0),
      totalBoys: stats.reduce((sum, s) => sum + s.boys, 0),
      totalGirls: stats.reduce((sum, s) => sum + s.girls, 0),
      standards: stats,
    }));
  }

  async getEnrollmentForStandard(schoolId: string, standard: string, academicYear?: string) {
    const where: any = { schoolId, standard };
    if (academicYear) where.academicYear = academicYear;

    return this.prisma.enrollmentStat.findFirst({ where });
  }

  async deleteEnrollmentRecord(id: string) {
    const existing = await this.prisma.enrollmentStat.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Enrollment record not found');

    const result = await this.prisma.enrollmentStat.delete({ where: { id } });

    const school = await this.prisma.school.findUnique({
      where: { id: existing.schoolId },
      select: { zone: true },
    });
    
    if (school) {
      await this.aggregationService.triggerUpdates(existing.schoolId, school.zone, 'update');
    }

    return result;
  }
}