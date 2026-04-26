import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Inject } from '@nestjs/common';
import { SubmissionsService } from './submissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('submissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(@Inject(SubmissionsService) private readonly submissionsService: SubmissionsService) {
    console.log('🏗️ SubmissionsController initialized. SubmissionsService:', !!this.submissionsService);
  }

  @Get()
  @ApiOperation({ summary: 'Get all submissions' })
  async findAll() {
    return this.submissionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single submission by ID' })
  async findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new submission' })
  async create(@Request() req: any, @Body() data: any) {
    return this.submissionsService.create(req.user.userId, data);
  }

  @Put(':id/status')
  @ApiOperation({ summary: 'Update submission status' })
  async updateStatus(
    @Param('id') id: string,
    @Request() req: any,
    @Body('status') status: string,
    @Body('feedback') feedback?: string,
  ) {
    return this.submissionsService.updateStatus(id, req.user.userId, status, feedback);
  }

  @Put(':id/edit-by-tdc')
  @ApiOperation({ summary: 'Edit submission by TDC officer' })
  async editByTDC(
    @Param('id') id: string,
    @Request() req: any,
    @Body('updatedData') updatedData: any,
    @Body('reason') reason: string,
  ) {
    return this.submissionsService.editByTDC(id, req.user.userId, updatedData, reason);
  }

  @Get(':id/audit-logs')
  @ApiOperation({ summary: 'Get audit logs for a submission' })
  async getAuditLogs(@Param('id') id: string) {
    return this.submissionsService.getAuditLogs(id);
  }
}
