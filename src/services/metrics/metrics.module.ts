import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { PrismaModule } from '../modules/prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';
import { PerformanceModule } from '../performance/performance.module';
import { LoggingModule } from '../logging/logging.module';

@Module({
  imports: [PrismaModule, CacheModule, PerformanceModule, LoggingModule],
  providers: [MetricsService],
  exports: [MetricsService],
})
export class MetricsModule {}