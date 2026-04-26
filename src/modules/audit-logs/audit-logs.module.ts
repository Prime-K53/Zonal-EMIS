import { Module } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service.ts';
import { AuditLogsController } from './audit-logs.controller.ts';

@Module({
  providers: [AuditLogsService],
  controllers: [AuditLogsController],
  exports: [AuditLogsService],
})
export class AuditLogsModule {}
