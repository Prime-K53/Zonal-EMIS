import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ SubmissionsService initialized. Prisma:', !!this.prisma);
  }

  async findAll() {
    return this.prisma.submission.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const submission = await this.prisma.submission.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    if (!submission) throw new NotFoundException('Submission not found');
    return submission;
  }

  async create(userId: string, data: any) {
    return this.prisma.submission.create({
      data: {
        userId,
        type: data.type,
        data: typeof data.data === 'object' ? JSON.stringify(data.data) : data.data,
        status: data.status || 'PENDING',
      },
    });
  }

  async updateStatus(id: string, userId: string, status: string, feedback?: string) {
    const submission = await this.prisma.submission.update({
      where: { id },
      data: { status, updatedAt: new Date() },
    });

    // Create audit log for status change
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_STATUS',
        entityType: 'SUBMISSION',
        entityId: id,
        details: JSON.stringify({ status, feedback }),
      },
    });

    return submission;
  }

  async editByTDC(id: string, userId: string, updatedData: any, reason: string) {
    const submission = await this.prisma.submission.update({
      where: { id },
      data: { 
        data: typeof updatedData === 'object' ? JSON.stringify(updatedData) : updatedData, 
        updatedAt: new Date() 
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'EDIT_BY_TDC',
        entityType: 'SUBMISSION',
        entityId: id,
        details: JSON.stringify({ reason }),
      },
    });

    return submission;
  }

  async getAuditLogs(id: string) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType: 'SUBMISSION',
        entityId: id,
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
