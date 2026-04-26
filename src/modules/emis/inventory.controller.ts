import { Controller, Get, Post, Body, Query, UseGuards, Param, Delete, Patch, Inject } from '@nestjs/common';
import { EmisService } from '../emis/emis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('inventory')
export class InventoryController {
  constructor(@Inject(EmisService) private readonly emisService: EmisService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add an item to inventory' })
  async create(@Body() data: any) {
    return this.emisService.create('resources', data);
  }

  @Get('items')
  @ApiOperation({ summary: 'List inventory items' })
  async findAll(@Query() query: any) {
    return this.emisService.findAll('resources', query);
  }

  @Get('items/:id')
  @ApiOperation({ summary: 'Get a single inventory item' })
  async findOne(@Param('id') id: string) {
    return this.emisService.findOne('resources', id);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: 'Update an inventory item' })
  async update(@Param('id') id: string, @Body() data: any) {
    return this.emisService.update('resources', id, data);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: 'Delete an inventory item' })
  async remove(@Param('id') id: string) {
    return this.emisService.remove('resources', id);
  }
}
