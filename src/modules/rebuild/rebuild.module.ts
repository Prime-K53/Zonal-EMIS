import { Module } from '@nestjs/common';
import { RebuildController } from './rebuild.controller';
import { AggregationModule } from '../aggregation/aggregation.module';

@Module({
  imports: [AggregationModule],
  controllers: [RebuildController],
})
export class RebuildModule {}