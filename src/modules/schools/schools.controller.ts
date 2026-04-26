// src/modules/schools/schools.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Inject } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('schools')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schools')
export class SchoolsController {
  constructor(@Inject(SchoolsService) private readonly schoolsService: SchoolsService) {
    console.log('🏗️ SchoolsController initialized. SchoolsService:', !!this.schoolsService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new school' })
  create(@Body() createSchoolDto: CreateSchoolDto) {
    return this.schoolsService.create(createSchoolDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schools with pagination' })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string,
  ) {
    const where = search ? {
      OR: [
        { name: { contains: search } },
        { emisCode: { contains: search } },
      ],
    } : {};
    
    return this.schoolsService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      where,
    });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get school statistics' })
  getStats() {
    return this.schoolsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single school by ID' })
  findOne(@Param('id') id: string) {
    return this.schoolsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update school info' })
  update(@Param('id') id: string, @Body() updateSchoolDto: UpdateSchoolDto) {
    return this.schoolsService.update(id, updateSchoolDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a school' })
  remove(@Param('id') id: string) {
    return this.schoolsService.remove(id);
  }
}
