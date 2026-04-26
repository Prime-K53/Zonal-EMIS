// src/modules/learners/learners.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Inject } from '@nestjs/common';
import { LearnersService } from './learners.service';
import { CreateLearnerDto } from './dto/create-learner.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('learners')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('learners')
export class LearnersController {
  constructor(@Inject(LearnersService) private readonly learnersService: LearnersService) {
    console.log('🏗️ LearnersController initialized. LearnersService:', !!this.learnersService);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new learner' })
  create(@Body() createLearnerDto: CreateLearnerDto) {
    return this.learnersService.create(createLearnerDto);
  }

  @Post('promote-admissions')
  @ApiOperation({ summary: 'Promote all admitted learners to active registry' })
  promoteAdmissions() {
    return this.learnersService.promoteAdmissions();
  }

  @Get()
  @ApiOperation({ summary: 'Get learners with filters' })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('schoolId') schoolId?: string,
    @Query('standard') standard?: string,
  ) {
    return this.learnersService.findAll({
      skip: skip ? +skip : undefined,
      take: take ? +take : undefined,
      schoolId,
      standard,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get learner profile' })
  findOne(@Param('id') id: string) {
    return this.learnersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update learner record' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.learnersService.update(id, data);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete learner record' })
  remove(@Param('id') id: string) {
    return this.learnersService.remove(id);
  }
}
