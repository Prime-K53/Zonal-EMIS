import { Controller, Get, UseGuards, Inject } from '@nestjs/common';
import { AuditLogsService } from './audit-logs.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('audit-logs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit-logs')
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogsService: AuditLogsService) {
    console.log('🏗️ AuditLogsController initialized. AuditLogsService:', !!this.auditLogsService);
  }

  @Get()
  @ApiOperation({ summary: 'Get all audit logs' })
  async findAll() {
    return this.auditLogsService.findAll();
  }
}
