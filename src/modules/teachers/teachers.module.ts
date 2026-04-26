// src/modules/teachers/teachers.module.ts
import { Module } from '@nestjs/common';
import { TeachersService } from './teachers.service';
import { TeachersController } from './teachers.controller';
import { AggregationModule } from '../aggregation/aggregation.module';

@Module({
  imports: [AggregationModule],
  providers: [TeachersService],
  controllers: [TeachersController],
})
export class TeachersModule {}
