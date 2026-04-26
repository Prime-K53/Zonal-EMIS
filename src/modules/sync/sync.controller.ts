// src/modules/sync/sync.controller.ts
import { Controller, Post, Body, UseGuards, Get, Query, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sync')
export class SyncController {
  constructor(@Inject(PrismaService) private prisma: PrismaService) {
    console.log('🏗️ SyncController initialized. Prisma:', !!this.prisma);
  }

  @Get('pull')
  @ApiOperation({ summary: 'Pull updates since last timestamp' })
  async pull(@Query('lastSync') lastSync: string) {
    const timestamp = new Date(lastSync);
    
    // Fetch all changed entities since timestamp
    const [schools, teachers, learners] = await Promise.all([
      this.prisma.school.findMany({ where: { updatedAt: { gt: timestamp } } }),
      this.prisma.teacher.findMany({ where: { updatedAt: { gt: timestamp } } }),
      this.prisma.learner.findMany({ where: { updatedAt: { gt: timestamp } } }),
    ]);

    return {
      timestamp: new Date().toISOString(),
      updates: { schools, teachers, learners }
    };
  }

  @Post('push')
  @ApiOperation({ summary: 'Push local changes to server' })
  async push(@Body() changes: any) {
    // Basic Last-Write-Wins implementation for the migration task
    const { schools = [], teachers = [] } = changes;

    const results = [];

    // Process schools
    for (const school of schools) {
      const res = await this.prisma.school.upsert({
        where: { id: school.id },
        update: { ...school, updatedAt: new Date() },
        create: { ...school },
      });
      results.push({ type: 'school', id: school.id, status: 'synced' });
    }

    return { results, timestamp: new Date().toISOString() };
  }
}
