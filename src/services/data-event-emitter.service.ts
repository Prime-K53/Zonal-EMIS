import { EventEmitter2 } from '@nestjs/event-emitter';
import { Injectable } from '@nestjs/common';
import { ModuleType, PERIOD_EVENT, DataChangedEvent } from './period-helper';

export const AGGREGATION_TRIGGERED = 'aggregation.triggered';

@Injectable()
export class DataEventEmitter {
  constructor(private eventEmitter: EventEmitter2) {}

  emitDataChanged(
    schoolId: string,
    zone: string,
    module: ModuleType,
    date: Date = new Date(),
    action: 'create' | 'update' | 'delete' = 'update',
  ) {
    this.eventEmitter.emit(PERIOD_EVENT, {
      schoolId,
      zone,
      module,
      date,
      action,
    } as DataChangedEvent);
  }

  emitSchoolDataChanged(schoolId: string, zone: string, action: 'create' | 'update' | 'delete') {
    this.eventEmitter.emit('school.data.changed', {
      schoolId,
      zone,
      action,
      module: 'attendance' as ModuleType,
      date: new Date(),
    });
  }
}