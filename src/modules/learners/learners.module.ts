// src/modules/learners/learners.module.ts
import { Module } from '@nestjs/common';
import { LearnersService } from './learners.service';
import { LearnersController } from './learners.controller';

@Module({
  providers: [LearnersService],
  controllers: [LearnersController],
})
export class LearnersModule {}
