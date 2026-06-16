import { Module } from '@nestjs/common';
import { RecomputeProcessor } from './recompute.processor';
import { SyncProcessor } from './sync.processor';

@Module({
  providers: [SyncProcessor, RecomputeProcessor],
})
export class WorkerModule {}
