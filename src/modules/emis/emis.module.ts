import { Module } from '@nestjs/common';
import { EmisController } from './emis.controller';
import { AttendanceController } from './attendance.controller';
import { InventoryController } from './inventory.controller';
import { EmisService } from './emis.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AggregationModule } from '../aggregation/aggregation.module';
import { ValidationModule } from '../validation/validation.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AggregationModule, ValidationModule, AuditModule],
  controllers: [EmisController, AttendanceController, InventoryController],
  providers: [EmisService],
  exports: [EmisService],
})
export class EmisModule {}
