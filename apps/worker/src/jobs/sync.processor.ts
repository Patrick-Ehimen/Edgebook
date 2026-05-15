import { QUEUE_RECOMPUTE, QUEUE_SYNC, type SyncJobData } from '@edgebook/shared/queues';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue, type Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor(QUEUE_SYNC)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_RECOMPUTE) private readonly recomputeQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const { accountId } = job.data;
    this.logger.log(`Syncing fills for account ${accountId}`);

    // Exchange adapter integration goes here once ccxt.pro adapters are built.
    // Pattern:
    //   1. Load ApiKey for accountId (decrypt secret via EncryptionService)
    //   2. Init ccxt exchange client with key + secret
    //   3. Fetch trades since lastSyncedAt (or full history if fullSync)
    //   4. Upsert fills via prisma.fill.createMany({ skipDuplicates: true })
    //   5. Update account lastSyncedAt
    //   6. Enqueue recompute job

    // Once fills are upserted, trigger recompute
    await this.recomputeQueue.add(
      'recompute',
      { accountId, userId: job.data.userId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
}
