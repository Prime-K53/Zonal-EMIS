// src/modules/learners/learners.service.ts
import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { AggregationService } from '../../services/aggregation.service';

@Injectable()
export class LearnersService {
  private readonly logger = new Logger(LearnersService.name);

  constructor(
    @Inject(PrismaService) private prisma: PrismaService,
    @Inject(AggregationService) private aggregationService: AggregationService,
  ) {
    this.logger.log('LearnersService initialized');
  }

  async create(dto: any) {
    const data = {
      schoolId: dto.schoolId,
      firstName: dto.firstName,
      lastName: dto.lastName,
      gender: dto.gender,
      standard: dto.standard,
      admissionNumber: dto.admissionNumber,
      status: dto.status || 'Active',
      isAdmission: dto.isAdmission || false,
      isSNE: dto.isSNE || false,
      sneType: dto.sneType,
      disabilityType: dto.disabilityType,
      guardianName: dto.guardianName,
      guardianPhone: dto.guardianPhone,
      address: dto.address,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      admissionDate: dto.admissionDate ? new Date(dto.admissionDate) : undefined,
      enrollmentDate: dto.enrollmentDate ? new Date(dto.enrollmentDate) : undefined,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
    };
    
    const learner = await this.prisma.learner.create({
      data: data as any,
    });

    const school = await this.prisma.school.findUnique({
      where: { id: dto.schoolId },
      select: { zone: true },
    });
    if (school) {
      await this.aggregationService.triggerUpdates(dto.schoolId, school.zone, 'update');
    }
    
    return learner;
  }

  async promoteAdmissions() {
    console.log('🔄 Promoting all admitted learners to active registry...');
    return this.prisma.learner.updateMany({
      where: {
        isAdmission: true,
      },
      data: {
        isAdmission: false,
        status: 'Active',
      },
    });
  }

  async findAll(params: { skip?: number; take?: number; schoolId?: string; standard?: string }) {
    const { skip, take, schoolId, standard } = params;
    const where: any = {};
    if (schoolId) where.schoolId = schoolId;
    if (standard) where.standard = standard;

    const [total, data] = await Promise.all([
      this.prisma.learner.count({ where }),
      this.prisma.learner.findMany({
        skip: skip ? +skip : undefined,
        take: take ? +take : undefined,
        where,
        include: { school: true },
      }),
    ]);
    return { total, data };
  }

  async findOne(id: string) {
    const learner = await this.prisma.learner.findUnique({
      where: { id },
      include: { school: true },
    });
    if (!learner) throw new NotFoundException('Learner not found');
    return learner;
  }

  async update(id: string, dto: any) {
    const existing = await this.prisma.learner.findUnique({
      where: { id },
      select: { schoolId: true },
    });
    if (!existing) throw new NotFoundException('Learner not found');

    const data: any = {};
    const allowed = [
      'schoolId', 'firstName', 'lastName', 'gender', 'standard', 'admissionNumber', 
      'status', 'isAdmission', 'isSNE', 'sneType', 'disabilityType', 
      'guardianName', 'guardianPhone', 'address'
    ];
    
    allowed.forEach(field => {
      if (dto[field] !== undefined) data[field] = dto[field];
    });

    if (dto.dateOfBirth) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.admissionDate) data.admissionDate = new Date(dto.admissionDate);
    if (dto.enrollmentDate) data.enrollmentDate = new Date(dto.enrollmentDate);
    
    const learner = await this.prisma.learner.update({
      where: { id },
      data,
    });

    const schoolId = dto.schoolId || existing.schoolId;
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: { zone: true },
    });
    if (school) {
      await this.aggregationService.triggerUpdates(schoolId, school.zone, 'update');
    }
    
    return learner;
  }

  async remove(id: string) {
    const existing = await this.prisma.learner.findUnique({
      where: { id },
      select: { schoolId: true },
    });
    if (!existing) throw new NotFoundException('Learner not found');

    const result = await this.prisma.learner.delete({ where: { id } });

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
