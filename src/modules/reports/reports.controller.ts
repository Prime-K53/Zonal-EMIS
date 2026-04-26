// src/modules/reports/reports.controller.ts
import { Controller, Get, Query, UseGuards, Inject } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(@Inject(ReportsService) private readonly reportsService: ReportsService) {
    console.log('🏗️ ReportsController initialized. ReportsService:', !!this.reportsService);
  }

  @Get('overview')
  @ApiOperation({ summary: 'Get national level EMIS overview' })
  getOverview() {
    return this.reportsService.getNationalOverview();
  }

  @Get('zonal')
  @ApiOperation({ summary: 'Get report for a specific zone' })
  getZonal(@Query('zone') zone: string) {
    return this.reportsService.getZonalReport(zone);
  }
}
