import { createAdapter } from '@edgebook/exchange';
import { QUEUE_RECOMPUTE, QUEUE_SYNC, type SyncJobData } from '@edgebook/shared/queues';
import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Queue, type Job } from 'bullmq';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor(QUEUE_SYNC)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @InjectQueue(QUEUE_RECOMPUTE) private readonly recomputeQueue: Queue,
  ) {
    super();
  }

  async process(job: Job<SyncJobData>): Promise<void> {
    const { accountId, userId, fullSync } = job.data;
    this.logger.log(`Syncing fills for account ${accountId}`);
    try {
      const account = await this.prisma.account.findUniqueOrThrow({
        where: { id: accountId },
        include: { apiKeys: { orderBy: { createdAt: 'desc' }, take: 1 } },
      });

      const apiKeyRow = account.apiKeys[0];
      if (!apiKeyRow) {
        this.logger.warn(`No API key for account ${accountId} — skipping sync`);
        return;
      }

      const apiKey = this.encryption.decrypt(apiKeyRow.keyEnc);
      const secret = this.encryption.decrypt(apiKeyRow.secretEnc);
      const adapter = createAdapter(account.venue as 'binance' | 'bybit', apiKey, secret);

      let since = new Date(0);
      if (!fullSync) {
        const latest = await this.prisma.fill.findFirst({
          where: { accountId },
          orderBy: { executedAt: 'desc' },
          select: { executedAt: true },
        });
        if (latest) since = latest.executedAt;
      }

      const fills = await adapter.fetchFillsSince(since);

      if (fills.length > 0) {
        await this.prisma.fill.createMany({
          data: fills.map((f) => ({
            accountId,
            venue: account.venue,
            symbol: f.symbol,
            side: f.side,
            qty: f.qty,
            price: f.price,
            fee: f.fee,
            feeCcy: f.feeCcy,
            fundingFee: null,
            exchangeTradeId: f.exchangeTradeId,
            executedAt: f.executedAt,
          })),
          skipDuplicates: true,
        });
        this.logger.log(`Upserted ${fills.length} fills for account ${accountId}`);
      }

      await this.recomputeQueue.add(
        'recompute',
        { accountId, userId },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    } catch (err) {
      this.logger.error(
        `Sync failed for account ${accountId}: ${(err as Error).message}`,
        (err as Error).stack,
      );
      throw err;
    }
  }
}
