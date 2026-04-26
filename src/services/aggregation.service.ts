import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../modules/prisma/prisma.service';
import { DataEventEmitter, PERIOD_EVENT, DataChangedEvent } from './data-event-emitter.service';
import { PeriodHelper, PeriodType, ModuleType, PeriodInfo } from './period-helper';

export const AGGREGATION_TRIGGERED = 'aggregation.triggered';

export interface AggregationTriggerEvent {
  schoolId: string;
  zone: string;
  date: Date;
  module: ModuleType;
}

@Injectable()
export class AggregationService {
  private readonly logger = new Logger(AggregationService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: DataEventEmitter,
  ) {}

  async onModuleInit() {
    this.logger.log('AggregationService initialized');
  }

  async triggerUpdates(schoolId: string, zone: string, action: 'create' | 'update' | 'delete') {
    if (action === 'delete') return;
    await this.onDataChanged(schoolId, zone, 'attendance', new Date(), action);
  }

  async onDataChanged(
    schoolId: string,
    zone: string,
    module: ModuleType,
    date: Date = new Date(),
    action: 'create' | 'update' | 'delete' = 'update',
  ): Promise<void> {
    this.logger.log(`onDataChanged: schoolId=${schoolId}, zone=${zone}, module=${module}, action=${action}`);
    
    if (action === 'delete') {
      return;
    }

    await this.runAggregation(schoolId, zone, date);
  }

  async runAggregation(schoolId: string, zone: string, date: Date): Promise<void> {
    this.logger.log(`Running aggregation for school=${schoolId}, zone=${zone}, date=${date.toISOString()}`);
    
    const periods = PeriodHelper.getAllPeriods(date);
    
    for (const period of periods) {
      await this.updateSchoolProfile(schoolId, period);
      await this.updateZonalAggregation(zone, period);
    }
    
    this.logger.log(`Aggregation complete for school=${schoolId}`);
  }

  private async updateSchoolProfile(schoolId: string, period: PeriodInfo): Promise<void> {
    const { type, value, startDate, endDate } = period;
    
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        zone: true,
        classrooms: true,
        toiletsBoys: true,
        toiletsGirls: true,
        hasElectricity: true,
        waterSource: true,
      },
    });

    if (!school) return;

    const metrics = await this.computeSchoolMetrics(schoolId, startDate, endDate);
    const hasWaterSource = !!school.waterSource && school.waterSource.length > 0;

    await this.prisma.schoolProfileSummary.upsert({
      where: {
        schoolId_periodType_periodValue: {
          schoolId,
          periodType: type,
          periodValue: value,
        },
      },
      update: {
        attendancePresent: metrics.attendancePresent,
        attendanceAbsent: metrics.attendanceAbsent,
        attendanceRate: metrics.attendanceRate,
        attendanceMaleRate: metrics.attendanceMaleRate,
        attendanceFemaleRate: metrics.attendanceFemaleRate,
        totalStudents: metrics.totalStudents,
        totalBoys: metrics.totalBoys,
        totalGirls: metrics.totalGirls,
        newAdmissions: metrics.newAdmissions,
        totalTeachers: metrics.totalTeachers,
        qualifiedTeachers: metrics.qualifiedTeachers,
        activitiesConducted: metrics.activitiesConducted,
        smcMeetingsHeld: metrics.smcMeetingsHeld,
        inspectionsConducted: metrics.inspectionsConducted,
        hasElectricity: school.hasElectricity,
        hasWaterSource,
        totalClassrooms: school.classrooms,
        totalToilets: school.toiletsBoys + school.toiletsGirls,
        updatedAt: new Date(),
      },
      create: {
        schoolId,
        periodType: type,
        periodValue: value,
        attendancePresent: metrics.attendancePresent,
        attendanceAbsent: metrics.attendanceAbsent,
        attendanceRate: metrics.attendanceRate,
        attendanceMaleRate: metrics.attendanceMaleRate,
        attendanceFemaleRate: metrics.attendanceFemaleRate,
        totalStudents: metrics.totalStudents,
        totalBoys: metrics.totalBoys,
        totalGirls: metrics.totalGirls,
        newAdmissions: metrics.newAdmissions,
        totalTeachers: metrics.totalTeachers,
        qualifiedTeachers: metrics.qualifiedTeachers,
        activitiesConducted: metrics.activitiesConducted,
        smcMeetingsHeld: metrics.smcMeetingsHeld,
        inspectionsConducted: metrics.inspectionsConducted,
        hasElectricity: school.hasElectricity,
        hasWaterSource,
        totalClassrooms: school.classrooms,
        totalToilets: school.toiletsBoys + school.toiletsGirls,
      },
    });

    this.logger.debug(`School profile updated: ${schoolId} for ${type}=${value}`);
  }

  private async computeSchoolMetrics(
    schoolId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    attendancePresent: number;
    attendanceAbsent: number;
    attendanceRate: number;
    attendanceMaleRate: number;
    attendanceFemaleRate: number;
    totalStudents: number;
    totalBoys: number;
    totalGirls: number;
    newAdmissions: number;
    totalTeachers: number;
    qualifiedTeachers: number;
    activitiesConducted: number;
    smcMeetingsHeld: number;
    inspectionsConducted: number;
  }> {
    const dateStr = startDate.toISOString().split('T')[0];
    
    const [learners, teachers, attendanceRecords, smcMeetings, inspections] = await Promise.all([
      this.prisma.learner.findMany({
        where: { schoolId },
        select: { gender: true, createdAt: true },
      }),
      this.prisma.teacher.findMany({
        where: { schoolId },
        select: { qualification: true },
      }),
      this.prisma.dailyAttendance.findMany({
        where: {
          schoolId,
          date: dateStr,
        },
        select: { learners: true },
      }),
      this.prisma.sMCMeeting.count({
        where: {
          schoolId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
      this.prisma.inspection.count({
        where: {
          schoolId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      }),
    ]);

    const totalBoys = learners.filter(l => l.gender === 'Male').length;
    const totalGirls = learners.filter(l => l.gender === 'Female').length;
    const totalStudents = totalBoys + totalGirls;

    const newAdmissions = learners.filter(l => {
      const created = new Date(l.createdAt);
      return created >= startDate && created <= endDate;
    }).length;

    const totalTeachers = teachers.length;
    const qualifiedTeachers = teachers.filter(t => 
      t.qualification && t.qualification !== 'Unqualified'
    ).length;

    let attendancePresent = 0;
    let attendanceAbsent = 0;
    let attendanceMaleRate = 0;
    let attendanceFemaleRate = 0;

    for (const record of attendanceRecords) {
      if (record.learners) {
        try {
          const data = JSON.parse(record.learners);
          attendancePresent += (data.present?.boys || 0) + (data.present?.girls || 0);
          attendanceAbsent += (data.absent?.boys || 0) + (data.absent?.girls || 0);
          
          const boysTotal = (data.present?.boys || 0) + (data.absent?.boys || 0);
          const girlsTotal = (data.present?.girls || 0) + (data.absent?.girls || 0);
          if (boysTotal > 0) attendanceMaleRate = (data.present?.boys / boysTotal) * 100;
          if (girlsTotal > 0) attendanceFemaleRate = (data.present?.girls / girlsTotal) * 100;
        } catch (e) {}
      }
    }

    const totalEnrolled = attendancePresent + attendanceAbsent;
    const attendanceRate = totalEnrolled > 0 ? (attendancePresent / totalEnrolled) * 100 : 0;

    return {
      attendancePresent,
      attendanceAbsent,
      attendanceRate,
      attendanceMaleRate,
      attendanceFemaleRate,
      totalStudents,
      totalBoys,
      totalGirls,
      newAdmissions,
      totalTeachers,
      qualifiedTeachers,
      activitiesConducted: inspections.length,
      smcMeetingsHeld: smcMeetings,
      inspectionsConducted: inspections.length,
    };
  }

  private async updateZonalAggregation(zone: string, period: PeriodInfo): Promise<void> {
    const { type, value, startDate, endDate } = period;

    const profiles = await this.prisma.schoolProfileSummary.findMany({
      where: {
        school: { zone },
        periodType: type,
        periodValue: value,
      },
    });

    if (profiles.length === 0) {
      this.logger.debug(`No profiles found for zone=${zone}, period=${type}=${value}`);
      return;
    }

    const totals = profiles.reduce(
      (acc, p) => ({
        totalSchools: acc.totalSchools + 1,
        totalStudents: acc.totalStudents + p.totalStudents,
        totalBoys: acc.totalBoys + p.totalBoys,
        totalGirls: acc.totalGirls + p.totalGirls,
        attendancePresent: acc.attendancePresent + p.attendancePresent,
        attendanceAbsent: acc.attendanceAbsent + p.attendanceAbsent,
        totalTeachers: acc.totalTeachers + p.totalTeachers,
        qualifiedTeachers: acc.qualifiedTeachers + p.qualifiedTeachers,
        schoolsWithElectricity: acc.schoolsWithElectricity + (p.hasElectricity ? 1 : 0),
        schoolsWithWater: acc.schoolsWithWater + (p.hasWaterSource ? 1 : 0),
        schoolsWithToilets: acc.schoolsWithToilets + (p.totalToilets > 0 ? 1 : 0),
        totalClassrooms: acc.totalClassrooms + p.totalClassrooms,
        activitiesConducted: acc.activitiesConducted + p.activitiesConducted,
        smcMeetingsHeld: acc.smcMeetingsHeld + p.smcMeetingsHeld,
      }),
      {
        totalSchools: 0,
        totalStudents: 0,
        totalBoys: 0,
        totalGirls: 0,
        attendancePresent: 0,
        attendanceAbsent: 0,
        totalTeachers: 0,
        qualifiedTeachers: 0,
        schoolsWithElectricity: 0,
        schoolsWithWater: 0,
        schoolsWithToilets: 0,
        totalClassrooms: 0,
        activitiesConducted: 0,
        smcMeetingsHeld: 0,
      },
    );

    const allAttendance = totals.attendancePresent + totals.attendanceAbsent;
    const averageAttendance = allAttendance > 0 
      ? (totals.attendancePresent / allAttendance) * 100 
      : 0;

    const avgStudentTeacherRatio = totals.totalTeachers > 0
      ? totals.totalStudents / totals.totalTeachers
      : 0;

    await this.prisma.zonalSummary.upsert({
      where: {
        zone_periodType_periodValue: {
          zone,
          periodType: type,
          periodValue: value,
        },
      },
      update: {
        totalSchools: totals.totalSchools,
        totalStudents: totals.totalStudents,
        totalBoys: totals.totalBoys,
        totalGirls: totals.totalGirls,
        averageAttendance,
        totalTeachers: totals.totalTeachers,
        qualifiedTeachers: totals.qualifiedTeachers,
        averageStudentTeacherRatio: avgStudentTeacherRatio,
        schoolsWithElectricity: totals.schoolsWithElectricity,
        schoolsWithWater: totals.schoolsWithWater,
        schoolsWithToilets: totals.schoolsWithToilets,
        totalClassrooms: totals.totalClassrooms,
        activitiesConducted: totals.activitiesConducted,
        smcMeetingsHeld: totals.smcMeetingsHeld,
        updatedAt: new Date(),
      },
      create: {
        zone,
        periodType: type,
        periodValue: value,
        totalSchools: totals.totalSchools,
        totalStudents: totals.totalStudents,
        totalBoys: totals.totalBoys,
        totalGirls: totals.totalGirls,
        averageAttendance,
        totalTeachers: totals.totalTeachers,
        qualifiedTeachers: totals.qualifiedTeachers,
        averageStudentTeacherRatio: avgStudentTeacherRatio,
        schoolsWithElectricity: totals.schoolsWithElectricity,
        schoolsWithWater: totals.schoolsWithWater,
        schoolsWithToilets: totals.schoolsWithToilets,
        totalClassrooms: totals.totalClassrooms,
        activitiesConducted: totals.activitiesConducted,
        smcMeetingsHeld: totals.smcMeetingsHeld,
      },
    });

    this.logger.debug(`Zonal aggregation updated: zone=${zone} for ${type}=${value}`);
  }

  async triggerAggregation(
    schoolId: string,
    zone: string,
    date: Date = new Date(),
    module: ModuleType = 'attendance',
  ) {
    this.eventEmitter.emitDataChanged(schoolId, zone, module, date, 'update');
  }

  async rebuildAllAggregations(options?: {
    schoolIds?: string[];
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    schoolsProcessed: number;
    periodsProcessed: number;
    errors: string[];
  }> {
    this.logger.log('Starting full aggregation rebuild...');
    
    const errors: string[] = [];
    let schoolsProcessed = 0;
    let periodsProcessed = 0;
    
    const whereCondition: any = {};
    if (options?.schoolIds && options.schoolIds.length > 0) {
      whereCondition.id = { in: options.schoolIds };
    }
    
    const schools = await this.prisma.school.findMany({
      where: whereCondition,
      select: { id: true, zone: true },
    });
    
    this.logger.log(`Found ${schools.length} schools to process`);
    
    for (const school of schools) {
      try {
        const periods = this.getAggregationPeriods(options?.startDate, options?.endDate);
        
        for (const period of periods) {
          try {
            await this.updateSchoolProfile(school.id, period);
            await this.updateZonalAggregation(school.zone, period);
            periodsProcessed++;
          } catch (periodError) {
            errors.push(
              `Period ${period.type}/${period.value} for school ${school.id}: ${periodError.message}`,
            );
          }
        }
        
        schoolsProcessed++;
      } catch (schoolError) {
        errors.push(`School ${school.id}: ${schoolError.message}`);
      }
    }
    
    this.logger.log(
      `Rebuild complete: ${schoolsProcessed} schools, ${periodsProcessed} periods, ${errors.length} errors`,
    );
    
    return { schoolsProcessed, periodsProcessed, errors };
  }

  private getAggregationPeriods(startDate?: Date, endDate?: Date): PeriodInfo[] {
    const periods: PeriodInfo[] = [];
    const start = startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();
    
    const current = new Date(start);
    while (current <= end) {
      periods.push(...PeriodHelper.getAllPeriods(new Date(current)));
      current.setDate(current.getDate() + 1);
    }
    
    const uniquePeriods = new Map<string, PeriodInfo>();
    for (const p of periods) {
      const key = `${p.type}:${p.value}`;
      if (!uniquePeriods.has(key)) {
        uniquePeriods.set(key, p);
      }
    }
    
    return Array.from(uniquePeriods.values());
  }

  async rebuildSchoolAggregation(
    schoolId: string,
    options?: { startDate?: Date; endDate?: Date },
  ): Promise<{ periodsRecalculated: number; errors: string[] }> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { id: true, zone: true },
    });
    
    if (!school) {
      throw new Error(`School ${schoolId} not found`);
    }
    
    const errors: string[] = [];
    const periods = this.getAggregationPeriods(options?.startDate, options?.endDate);
    let periodsRecalculated = 0;
    
    for (const period of periods) {
      try {
        await this.updateSchoolProfile(schoolId, period);
        await this.updateZonalAggregation(school.zone, period);
        periodsRecalculated++;
      } catch (e) {
        errors.push(`${period.type}/${period.value}: ${e.message}`);
      }
    }
    
    this.logger.log(`Rebuilt ${periodsRecalculated} periods for school ${schoolId}`);
    return { periodsRecalculated, errors };
  }

  async rebuildZoneAggregation(zone: string): Promise<{ periodsRecalculated: number }> {
    const schools = await this.prisma.school.findMany({
      where: { zone },
      select: { id: true },
    });
    
    let periodsRecalculated = 0;
    const periods = this.getAggregationPeriods();
    
    for (const period of periods) {
      for (const school of schools) {
        await this.updateSchoolProfile(school.id, period);
      }
      await this.updateZonalAggregation(zone, period);
      periodsRecalculated++;
    }
    
    this.logger.log(`Rebuilt ${periodsRecalculated} periods for zone ${zone}`);
    return { periodsRecalculated };
  }

  async clearAllAggregations(): Promise<{ deleted: number }> {
    const [schoolDeleted, zoneDeleted] = await Promise.all([
      this.prisma.schoolProfileSummary.deleteMany(),
      this.prisma.zonalSummary.deleteMany(),
    ]);
    
    const total = (schoolDeleted.count || 0) + (zoneDeleted.count || 0);
    this.logger.log(`Cleared ${total} aggregation records`);
    return { deleted: total };
  }
}