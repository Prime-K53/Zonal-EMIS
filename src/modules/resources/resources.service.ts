// src/modules/resources/resources.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResourcesService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ ResourcesService initialized. Prisma:', !!this.prisma);
  }

  async findAll() {
    return this.prisma.resource.findMany({
      include: { school: true }
    });
  }

  async findBySchool(schoolId: string) {
    return this.prisma.resource.findMany({
      where: { schoolId }
    });
  }

  async getAggregatedStats() {
    return this.prisma.resource.groupBy({
      by: ['category'],
      _sum: {
        quantity: true
      }
    });
  }
}
