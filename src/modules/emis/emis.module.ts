import { Module } from '@nestjs/common';
import { EmisController } from './emis.controller';
import { AttendanceController } from './attendance.controller';
import { InventoryController } from './inventory.controller';
import { EmisService } from './emis.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmisController, AttendanceController, InventoryController],
  providers: [EmisService],
  exports: [EmisService],
})
export class EmisModule {}
