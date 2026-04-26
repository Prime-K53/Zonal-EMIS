import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, Request, Inject } from '@nestjs/common';
import { EmisService } from './emis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('emis')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('emis')
export class EmisController {
  constructor(@Inject(EmisService) private readonly emisService: EmisService) {}

  @Post(':entity')
  @ApiOperation({ summary: 'Create a new EMIS record' })
  async create(@Param('entity') entity: string, @Body() data: any) {
    return this.emisService.create(entity, data);
  }

  @Get('all-data')
  @ApiOperation({ summary: 'Get all EMIS data summary' })
  async getAllData() {
    // This could be a complex aggregation, but for now returned basic summary or unified list
    return {
      message: 'All data summary placeholder',
      timestamp: new Date().toISOString()
    };
  }

  @Get(':entity')
  @ApiOperation({ summary: 'List EMIS records' })
  async findAll(
    @Param('entity') entity: string,
    @Query() query: any
  ) {
    return this.emisService.findAll(entity, query);
  }

  @Get(':entity/:id')
  @ApiOperation({ summary: 'Get a single EMIS record' })
  async findOne(@Param('entity') entity: string, @Param('id') id: string) {
    return this.emisService.findOne(entity, id);
  }

  @Patch(':entity/:id')
  @ApiOperation({ summary: 'Update an EMIS record' })
  async update(
    @Param('entity') entity: string, 
    @Param('id') id: string, 
    @Body() data: any
  ) {
    return this.emisService.update(entity, id, data);
  }

  @Delete(':entity/:id')
  @ApiOperation({ summary: 'Delete an EMIS record' })
  async remove(@Param('entity') entity: string, @Param('id') id: string) {
    return this.emisService.remove(entity, id);
  }
}
