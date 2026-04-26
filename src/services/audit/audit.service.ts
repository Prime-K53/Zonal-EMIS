import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

export type AuditAction = 'INSERT' | 'UPDATE' | 'DELETE';

export interface AuditContext {
  userId?: string;
  schoolId?: string;
  zone?: string;
  description?: string;
}

function sanitizeForJson(value: any): any {
  if (value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object' && value !== null) {
    const cleaned: any = {};
    for (const key of Object.keys(value)) {
      if (key !== 'createdAt' && key !== 'updatedAt' && key !== 'passwordHash') {
        cleaned[key] = sanitizeForJson(value[key]);
      }
    }
    return cleaned;
  }
  return value;
}

function toJsonString(value: any): string | null {
  if (!value) return null;
  try {
    return JSON.stringify(sanitizeForJson(value));
  } catch {
    return null;
  }
}

function getChangedFields(oldValue: any, newValue: any): string[] {
  const fields: string[] = [];
  const allKeys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);
  
  for (const key of allKeys) {
    const oldVal = oldValue?.[key];
    const newVal = newValue?.[key];
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      fields.push(key);
    }
  }
  
  return fields;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async logInsert(
    entityType: string,
    entityId: string,
    newValue: any,
    context?: AuditContext,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'INSERT',
          entityType,
          entityId,
          schoolId: context?.schoolId,
          zone: context?.zone,
          userId: context?.userId,
          newValue: toJsonString(newValue),
          description: context?.description || `Created ${entityType} ${entityId}`,
        },
      });
      this.logger.debug(`Audit: INSERT ${entityType} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to log INSERT: ${error.message}`);
    }
  }

  async logUpdate(
    entityType: string,
    entityId: string,
    oldValue: any,
    newValue: any,
    context?: AuditContext,
  ): Promise<void> {
    try {
      const changedFields = getChangedFields(oldValue, newValue);
      
      await this.prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entityType,
          entityId,
          schoolId: context?.schoolId,
          zone: context?.zone,
          userId: context?.userId,
          oldValue: toJsonString(oldValue),
          newValue: toJsonString(newValue),
          changedFields: changedFields.length > 0 ? JSON.stringify(changedFields) : null,
          description: context?.description || `Updated ${entityType} ${entityId}`,
        },
      });
      this.logger.debug(`Audit: UPDATE ${entityType} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to log UPDATE: ${error.message}`);
    }
  }

  async logDelete(
    entityType: string,
    entityId: string,
    oldValue: any,
    context?: AuditContext,
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: 'DELETE',
          entityType,
          entityId,
          schoolId: context?.schoolId,
          zone: context?.zone,
          userId: context?.userId,
          oldValue: toJsonString(oldValue),
          description: context?.description || `Deleted ${entityType} ${entityId}`,
        },
      });
      this.logger.debug(`Audit: DELETE ${entityType} ${entityId}`);
    } catch (error) {
      this.logger.error(`Failed to log DELETE: ${error.message}`);
    }
  }

  async getAuditTrail(
    entityType: string,
    entityId: string,
    limit: number = 50,
  ): Promise<any[]> {
    return this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getSchoolAuditTrail(
    schoolId: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<any[]> {
    const where: any = { schoolId };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  async getZoneAuditTrail(
    zone: string,
    startDate?: Date,
    endDate?: Date,
    limit: number = 100,
  ): Promise<any[]> {
    const where: any = { zone };
    
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }
}