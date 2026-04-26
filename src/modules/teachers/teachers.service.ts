// src/modules/teachers/teachers.service.ts
import { Injectable, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AggregationService } from '../../services/aggregation.service';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AggregationService) private aggregationService: AggregationService,
  ) {
    this.logger.log('TeachersService initialized');
  }

  private parseTeacher(record: any) {
    if (!record) return record;

    const teacher = { ...record };
    const jsonFields = ['professionalInfo', 'performanceHistory', 'achievementRecords', 'documents', 'audit'];

    jsonFields.forEach(field => {
      if (typeof teacher[field] === 'string') {
        try {
          teacher[field] = JSON.parse(teacher[field]);
        } catch {
          teacher[field] = null;
        }
      }
    });

    return teacher;
  }

  async findAll() {
    try {
      const records = await this.prisma.teacher.findMany({
        include: { school: true, tpdHistory: true },
      });

      return records.map(record => this.parseTeacher(record));
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { id },
      include: {
        school: true,
      },
    });

    return this.parseTeacher(teacher);
  }

  private mapTeacherData(data: any) {
    const allowedKeys = [
      'emisCode', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationalId',
      'employmentNumber', 'status', 'schoolId', 'qualification', 'specialization',
      'joiningDate', 'email', 'phone', 'address', 'tradingCenter', 'traditionalAuthority',
      'district', 'registrationNumber', 'dateOfFirstAppointment', 'dateOfPresentStandard',
      'grade', 'remarks', 'teachingClass', 'professionalInfo', 'performanceHistory',
      'achievementRecords', 'documents', 'audit',
    ];

    const cleaned: any = {};
    allowedKeys.forEach(key => {
      if (data[key] !== undefined) cleaned[key] = data[key];
    });

    const dateFields = ['dateOfBirth', 'joiningDate', 'dateOfFirstAppointment', 'dateOfPresentStandard'];
    dateFields.forEach(field => {
      if (cleaned[field] && (typeof cleaned[field] === 'string' || typeof cleaned[field] === 'number')) {
        const parsedDate = new Date(cleaned[field]);
        if (!isNaN(parsedDate.getTime())) {
          cleaned[field] = parsedDate;
        }
      }
    });

    if (cleaned.schoolId) {
      const schoolId = cleaned.schoolId;
      delete cleaned.schoolId;
      cleaned.school = { connect: { id: schoolId } };
    }

    const jsonFields = ['professionalInfo', 'performanceHistory', 'achievementRecords', 'documents', 'audit'];
    jsonFields.forEach(field => {
      if (cleaned[field] && typeof cleaned[field] === 'object') {
        cleaned[field] = JSON.stringify(cleaned[field]);
      }
    });

    return cleaned;
  }

  async create(data: any) {
    const mappedData = this.mapTeacherData(data);
    const teacher = await this.prisma.teacher.create({
      data: mappedData as any,
    });

    if (data.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: data.schoolId },
        select: { zone: true },
      });
      if (school) {
        await this.aggregationService.triggerUpdates(data.schoolId, school.zone, 'update');
      }
    }

    return this.parseTeacher(teacher);
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.teacher.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    const mappedData = this.mapTeacherData(data);
    delete mappedData.id;

    const teacher = await this.prisma.teacher.update({
      where: { id },
      data: mappedData as any,
    });

    const schoolId = data.schoolId || existing?.schoolId;
    if (schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: schoolId },
        select: { zone: true },
      });
      if (school) {
        await this.aggregationService.triggerUpdates(schoolId, school.zone, 'update');
      }
    }

    return this.parseTeacher(teacher);
  }

  async remove(id: string) {
    const existing = await this.prisma.teacher.findUnique({
      where: { id },
      select: { schoolId: true },
    });

    const result = await this.prisma.teacher.delete({
      where: { id },
    });

    if (existing?.schoolId) {
      const school = await this.prisma.school.findUnique({
        where: { id: existing.schoolId },
        select: { zone: true },
      });
      if (school) {
        await this.aggregationService.triggerUpdates(existing.schoolId, school.zone, 'update');
      }
    }

    return result;
  }
}
