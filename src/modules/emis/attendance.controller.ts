import { Controller, Get, Post, Body, Query, UseGuards, Request, Inject } from '@nestjs/common';
import { EmisService } from '../emis/emis.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(@Inject(EmisService) private readonly emisService: EmisService) {}

  @Post()
  @ApiOperation({ summary: 'Submit daily attendance' })
  async create(@Body() data: any, @Request() req: any) {
    // Inject userId if needed
    return this.emisService.create('daily-attendance', {
      ...data,
      submittedBy: req.user.email,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get attendance records' })
  async findAll(@Query() query: any) {
    return this.emisService.findAll('daily-attendance', query);
  }
}
