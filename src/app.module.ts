// src/app.module.ts
import { Module } from '@nestjs/common';
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
import { SyncController } from './modules/sync/sync.controller';

@Module({
  imports: [
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
  ],
  controllers: [SyncController],
})
export class AppModule {}
