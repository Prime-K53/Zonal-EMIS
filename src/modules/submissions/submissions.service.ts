import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubmissionsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('SubmissionsService initialized. Prisma:', !!this.prisma);
  }

  private parseSubmission<T extends { data?: string | unknown }>(submission: T) {
    if (!submission || typeof submission.data !== 'string') {
      return submission;
    }

    try {
      return {
        ...submission,
        data: JSON.parse(submission.data),
      };
    } catch {
      return submission;
    }
  }

  async findAll() {
    const submissions = await this.prisma.submission.findMany({
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

    return submissions.map(submission => this.parseSubmission(submission));
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

    if (!submission) {
      throw new NotFoundException('Submission not found');
    }

    return this.parseSubmission(submission);
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

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_STATUS',
        entityType: 'SUBMISSION',
        entityId: id,
        details: JSON.stringify({ status, feedback }),
      },
    });

    return this.parseSubmission(submission);
  }

  async editByTDC(id: string, userId: string, updatedData: any, reason: string) {
    const submission = await this.prisma.submission.update({
      where: { id },
      data: {
        data: typeof updatedData === 'object' ? JSON.stringify(updatedData) : updatedData,
        updatedAt: new Date(),
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

    return this.parseSubmission(submission);
  }

  async getAuditLogs(id: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        entityType: 'SUBMISSION',
        entityId: id,
      },
      orderBy: { timestamp: 'desc' },
    });

    return logs.map(log => {
      if (typeof log.details !== 'string') {
        return log;
      }

      try {
        return {
          ...log,
          details: JSON.parse(log.details),
        };
      } catch {
        return log;
      }
    });
  }
}
