// src/modules/learners/learners.module.ts
import { Module } from '@nestjs/common';
import { LearnersService } from './learners.service';
import { LearnersController } from './learners.controller';
import { AggregationModule } from '../aggregation/aggregation.module';

@Module({
  imports: [AggregationModule],
  providers: [LearnersService],
  controllers: [LearnersController],
})
export class LearnersModule {}
