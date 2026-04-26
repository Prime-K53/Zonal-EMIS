// src/modules/reports/reports.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ ReportsService initialized. Prisma:', !!this.prisma);
  }

  async getNationalOverview() {
    const [schoolsCount, teachersCount, learnersCount] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.teacher.count(),
      this.prisma.learner.count(),
    ]);

    const learnersByGender = await this.prisma.learner.groupBy({
      by: ['gender'],
      _count: { id: true },
    });

    return {
      totals: { schools: schoolsCount, teachers: teachersCount, learners: learnersCount },
      learnersByGender,
    };
  }

  async getZonalReport(zone: string) {
    const schools = await this.prisma.school.findMany({
      where: { zone },
      include: {
        _count: { select: { teachers: true, learners: true } },
      },
    });

    return { zone, schools };
  }
}
