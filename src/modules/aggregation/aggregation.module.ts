import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DataEventEmitter } from '../../services/data-event-emitter.service';
import { AggregationService } from '../../services/aggregation.service';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
  ],
  providers: [DataEventEmitter, AggregationService],
  exports: [DataEventEmitter, AggregationService],
})
export class AggregationModule {}