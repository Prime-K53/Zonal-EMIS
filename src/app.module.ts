// src/app.module.ts
import { Module } from '@nestjs/common';
import { AggregationModule } from './modules/aggregation/aggregation.module';
import { MetricsModule } from './services/metrics/metrics.module';
import { CacheModule } from './services/cache/cache.module';
import { PerformanceModule } from './services/performance/performance.module';
import { LoggingModule } from './services/logging/logging.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { LearnersModule } from './modules/learners/learners.module';
import { ResourcesModule } from './modules/resources/resources.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SubmissionsModule } from './modules/submissions/submissions.module';
import { AuditLogsModule } from './modules/audit-logs/audit-logs.module';
import { EmisModule } from './modules/emis/emis.module';
import { RebuildModule } from './modules/rebuild/rebuild.module';
import { SyncController } from './modules/sync/sync.controller';
import { MetricsController } from './components/metrics.controller';

@Module({
  imports: [
    AggregationModule,
    MetricsModule,
    CacheModule,
    PerformanceModule,
    LoggingModule,
    PrismaModule,
    AuthModule,
    UsersModule,
    SchoolsModule,
    TeachersModule,
    LearnersModule,
    ResourcesModule,
    ReportsModule,
    SubmissionsModule,
    AuditLogsModule,
    EmisModule,
    RebuildModule,
  ],
  controllers: [SyncController, MetricsController],
})
export class AppModule {}
