import { Controller, Post, Body, Get, Param, Query } from '@nestjs/common';
import { AggregationService } from '../services/aggregation.service';

class RebuildAllDto {
  schoolIds?: string[];
  startDate?: string;
  endDate?: string;
}

class RebuildSchoolDto {
  startDate?: string;
  endDate?: string;
}

@Controller('api/rebuild')
export class RebuildController {
  constructor(private aggregationService: AggregationService) {}

  @Post('all')
  async rebuildAll(@Body() dto: RebuildAllDto) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    
    const result = await this.aggregationService.rebuildAllAggregations({
      schoolIds: dto.schoolIds,
      startDate,
      endDate,
    });
    
    return {
      message: 'Full rebuild complete',
      ...result,
    };
  }

  @Post('school/:schoolId')
  async rebuildSchool(
    @Param('schoolId') schoolId: string,
    @Body() dto: RebuildSchoolDto,
  ) {
    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    
    const result = await this.aggregationService.rebuildSchoolAggregation(schoolId, {
      startDate,
      endDate,
    });
    
    return {
      message: `School ${schoolId} rebuilt`,
      ...result,
    };
  }

  @Post('zone/:zone')
  async rebuildZone(@Param('zone') zone: string) {
    const result = await this.aggregationService.rebuildZoneAggregation(zone);
    
    return {
      message: `Zone ${zone} rebuilt`,
      ...result,
    };
  }

  @Post('clear')
  async clearAll() {
    const result = await this.aggregationService.clearAllAggregations();
    
    return {
      message: 'All aggregation data cleared',
      ...result,
    };
  }

  @Get('status')
  async getStatus() {
    const [schoolSummaries, zoneSummaries] = await Promise.all([
      this.aggregationService.prisma.schoolProfileSummary.count(),
      this.aggregationService.prisma.zonalSummary.count(),
    ]);
    
    return {
      schoolProfileSummaries: schoolSummaries,
      zoneSummaries: zoneSummaries,
    };
  }
}