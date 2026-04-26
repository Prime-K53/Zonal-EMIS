// src/modules/schools/schools.service.ts
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AggregationService } from '../../services/aggregation.service';

@Injectable()
export class SchoolsService {
  private readonly logger = new Logger(SchoolsService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AggregationService) private aggregationService: AggregationService,
  ) {
    this.logger.log('SchoolsService initialized');
  }

  private mapNestedData(data: any) {
    const allowedKeys = [
      'emisCode', 'name', 'zone', 'type', 'ownership', 'yearEstablished', 'registrationStatus',
      'moeRegistrationNumber', 'primarySubCategory', 'juniorPrimaryRange', 'religiousAffiliation',
      'district', 'tdc', 'traditionalAuthority', 'latitude', 'longitude', 'physicalAddress',
      'classrooms', 'staffHouses', 'toiletsBoys', 'toiletsGirls', 'hasElectricity', 'waterSource', 'condition'
    ];

    const result: any = {};
    allowedKeys.forEach(key => {
      if (data[key] !== undefined) result[key] = data[key];
    });

    const { 
      location, infrastructure, administration, enrollment, staff, materials, 
      timetable, performance, finance, attendance, health, programs, 
      documents, audit
    } = data;
    
    // Map location fields if they exist and aren't already set
    if (location) {
      if (!result.district) result.district = location.district || '';
      if (!result.tdc) result.tdc = location.tdc || '';
      if (!result.traditionalAuthority) result.traditionalAuthority = location.traditionalAuthority || '';
      if (result.latitude === undefined) result.latitude = location.latitude;
      if (result.longitude === undefined) result.longitude = location.longitude;
      if (!result.physicalAddress) result.physicalAddress = location.physicalAddress || '';
    }

    // Map infrastructure fields if they exist and aren't already set
    if (infrastructure) {
      if (result.classrooms === undefined) result.classrooms = infrastructure.classrooms || 0;
      if (result.staffHouses === undefined) result.staffHouses = infrastructure.staffHouses || 0;
      if (result.toiletsBoys === undefined) result.toiletsBoys = infrastructure.toiletsBoys || 0;
      if (result.toiletsGirls === undefined) result.toiletsGirls = infrastructure.toiletsGirls || 0;
      if (result.hasElectricity === undefined) result.hasElectricity = infrastructure.hasElectricity ?? false;
      if (!result.waterSource) result.waterSource = infrastructure.waterSource || '';
      if (!result.condition) result.condition = infrastructure.condition || 'Good';
    }

    // Ensure required fields have defaults if missing
    if (!result.district) result.district = '';
    if (!result.tdc) result.tdc = '';
    if (!result.traditionalAuthority) result.traditionalAuthority = '';
    if (result.classrooms === undefined) result.classrooms = 0;
    if (result.staffHouses === undefined) result.staffHouses = 0;
    if (result.toiletsBoys === undefined) result.toiletsBoys = 0;
    if (result.toiletsGirls === undefined) result.toiletsGirls = 0;

    return {
      ...result,
      // Store original nested objects as JSON strings for SQLite compatibility
      location: location ? JSON.stringify(location) : null,
      administration: administration ? JSON.stringify(administration) : null,
      enrollment: enrollment ? JSON.stringify(enrollment) : null,
      staff: staff ? JSON.stringify(staff) : null,
      infrastructure: infrastructure ? JSON.stringify(infrastructure) : null,
      materials: materials ? JSON.stringify(materials) : null,
      timetable: timetable ? JSON.stringify(timetable) : null,
      performance: performance ? JSON.stringify(performance) : null,
      finance: finance ? JSON.stringify(finance) : null,
      profileAttendance: attendance ? JSON.stringify(attendance) : null,
      health: health ? JSON.stringify(health) : null,
      programs: programs ? JSON.stringify(programs) : null,
      profileDocuments: documents ? JSON.stringify(documents) : null,
      profileAudit: audit ? JSON.stringify(audit) : null,
    };
  }

  private parseNestedData(school: any) {
    if (!school) return school;
    const jsonFields = [
      'location', 'administration', 'enrollment', 'staff', 'infrastructure', 
      'materials', 'timetable', 'performance', 'finance', 'profileAttendance', 
      'health', 'programs', 'profileDocuments', 'profileAudit'
    ];
    jsonFields.forEach(field => {
      if (school[field] && typeof school[field] === 'string') {
        try {
          school[field] = JSON.parse(school[field]);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
    });
    return school;
  }

  async create(createSchoolDto: any) {
    const data = this.mapNestedData(createSchoolDto);
    
    const school = await this.prisma.school.create({
      data,
    });

    await this.aggregationService.triggerUpdates(school.id, school.zone, 'create');
    
    return school;
  }

  async findAll(params: {
    skip?: number;
    take?: number;
    where?: any;
    orderBy?: any;
  }) {
    const { skip, take, where, orderBy } = params;
    const [total, data] = await Promise.all([
      this.prisma.school.count({ where }),
      this.prisma.school.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          _count: {
            select: { learners: true, teachers: true },
          },
        },
      }),
    ]);
    return {
      total,
      data: data.map(school => this.parseNestedData(school))
    };
  }

  async findOne(id: string) {
    const school = await this.prisma.school.findUnique({
      where: { id },
      include: {
        teachers: true,
        resources: true,
      },
    });
    if (!school) throw new NotFoundException('School not found');
    return this.parseNestedData(school);
  }

  async update(id: string, updateSchoolDto: any) {
    const existing = await this.prisma.school.findUnique({
      where: { id },
      select: { zone: true },
    });
    if (!existing) {
      throw new NotFoundException('School not found');
    }

    const data = this.mapNestedData(updateSchoolDto);
    delete data.id;

    const school = await this.prisma.school.update({
      where: { id },
      data,
    });

    const newZone = school.zone || existing.zone;
    await this.aggregationService.triggerUpdates(school.id, newZone, 'update');
    
    return school;
  }

  async remove(id: string) {
    try {
      const school = await this.prisma.school.findUnique({
        where: { id },
        select: { zone: true },
      });

      if (!school) {
        throw new NotFoundException(`School with ID ${id} not found`);
      }

      const result = await this.prisma.school.delete({ where: { id } });

      await this.aggregationService.triggerUpdates(id, school.zone, 'delete');
      
      return result;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`School with ID ${id} not found`);
      }
      throw error;
    }
  }

  async getStats() {
    return this.prisma.school.groupBy({
      by: ['type'],
      _count: {
        id: true,
      },
    });
  }
}
