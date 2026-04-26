// src/modules/resources/resources.controller.ts
import { Controller, Get, Param, UseGuards, Inject } from '@nestjs/common';
import { ResourcesService } from './resources.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('resources')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('resources')
export class ResourcesController {
  constructor(@Inject(ResourcesService) private readonly resourcesService: ResourcesService) {
    console.log('🏗️ ResourcesController initialized. ResourcesService:', !!this.resourcesService);
  }

  @Get()
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get('stats')
  getZonalStats() {
    return this.resourcesService.getAggregatedStats();
  }

  @Get('school/:schoolId')
  findBySchool(@Param('schoolId') schoolId: string) {
    return this.resourcesService.findBySchool(schoolId);
  }
}
