import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ AuditLogsService initialized. Prisma:', !!this.prisma);
  }

  async findAll() {
    return this.prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async create(data: { userId: string; action: string; entityType: string; entityId?: string; details?: any }) {
    return this.prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details ? JSON.stringify(data.details) : null,
      },
    });
  }
}
