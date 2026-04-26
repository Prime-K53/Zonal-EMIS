// src/modules/teachers/teachers.controller.ts
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Inject } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('teachers')
export class TeachersController {
  constructor(@Inject(TeachersService) private readonly teachersService: TeachersService) {
    console.log('🏗️ TeachersController initialized. TeachersService:', !!this.teachersService);
  }

  @Get()
  findAll() {
    return this.teachersService.findAll();
  }

  @Post()
  create(@Body() data: any) {
    return this.teachersService.create(data);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teachersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.teachersService.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teachersService.remove(id);
  }
}
