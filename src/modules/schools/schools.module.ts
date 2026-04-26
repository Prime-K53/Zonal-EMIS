// src/modules/schools/schools.module.ts
import { Module } from '@nestjs/common';
import { SchoolsService } from './schools.service';
import { SchoolsController } from './schools.controller';
import { AggregationModule } from '../aggregation/aggregation.module';

@Module({
  imports: [AggregationModule],
  providers: [SchoolsService],
  controllers: [SchoolsController],
})
export class SchoolsModule {}
