// src/modules/teachers/teachers.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TeachersService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ TeachersService initialized. Prisma:', !!this.prisma);
  }

  async findAll() {
    console.log('🔍 [TeachersService] Fetching all teachers...');
    try {
      const records = await this.prisma.teacher.findMany({
        include: { school: true, tpdHistory: true }
      });
      console.log(`✅ [TeachersService] Successfully fetched ${records.length} teachers.`);
      return records;
    } catch (error) {
      console.error('❌ [TeachersService] Error fetching teachers:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    return this.prisma.teacher.findUnique({
      where: { id },
      include: { 
        school: true, 
      }
    });
  }

  private mapTeacherData(data: any) {
    const allowedKeys = [
      'emisCode', 'firstName', 'lastName', 'gender', 'dateOfBirth', 'nationalId',
      'employmentNumber', 'status', 'schoolId', 'qualification', 'specialization',
      'joiningDate', 'email', 'phone', 'address', 'tradingCenter', 'traditionalAuthority',
      'district', 'registrationNumber', 'dateOfFirstAppointment', 'dateOfPresentStandard',
      'grade', 'remarks', 'teachingClass', 'professionalInfo', 'performanceHistory',
      'achievementRecords', 'documents', 'audit'
    ];

    const cleaned: any = {};
    allowedKeys.forEach(key => {
      if (data[key] !== undefined) cleaned[key] = data[key];
    });
    
    // Convert date strings to Date objects
    const dateFields = ['dateOfBirth', 'joiningDate', 'dateOfFirstAppointment', 'dateOfPresentStandard'];
    dateFields.forEach(field => {
      if (cleaned[field] && (typeof cleaned[field] === 'string' || typeof cleaned[field] === 'number')) {
        const d = new Date(cleaned[field]);
        if (!isNaN(d.getTime())) {
          cleaned[field] = d;
        }
      }
    });

    // Special handling for school relationship
    // If schoolId is provided, we map it to the school connection
    if (cleaned.schoolId) {
      const schoolId = cleaned.schoolId;
      delete cleaned.schoolId;
      cleaned.school = { connect: { id: schoolId } };
    }
    
    // Stringify JSON fields for SQLite
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
    return this.prisma.teacher.create({
      data: mappedData as any
    });
  }

  async update(id: string, data: any) {
    const mappedData = this.mapTeacherData(data);
    delete mappedData.id;
    return this.prisma.teacher.update({
      where: { id },
      data: mappedData as any
    });
  }

  async remove(id: string) {
    return this.prisma.teacher.delete({
      where: { id }
    });
  }
}
