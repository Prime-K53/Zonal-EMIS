import { Module } from '@nestjs/common';
import { SubmissionsService } from './submissions.service.ts';
import { SubmissionsController } from './submissions.controller.ts';

@Module({
  providers: [SubmissionsService],
  controllers: [SubmissionsController],
})
export class SubmissionsModule {}
