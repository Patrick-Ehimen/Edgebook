import { type FillSide, computePositions } from '@edgebook/shared/positions';
import { QUEUE_RECOMPUTE, type RecomputeJobData } from '@edgebook/shared/queues';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Processor(QUEUE_RECOMPUTE)
export class RecomputeProcessor extends WorkerHost {
  private readonly logger = new Logger(RecomputeProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<RecomputeJobData>): Promise<{ positionCount: number }> {
    const { accountId } = job.data;
    this.logger.log(`Recomputing positions for account ${accountId}`);

    const dbFills = await this.prisma.fill.findMany({
      where: { accountId },
      orderBy: { executedAt: 'asc' },
    });

    const rawFills = dbFills.map((f) => ({
      id: f.id,
      symbol: f.symbol,
      side: f.side as FillSide,
      qty: f.qty.toString(),
      price: f.price.toString(),
      fee: f.fee.toString(),
      fundingFee: f.fundingFee?.toString() ?? null,
      executedAt: f.executedAt,
    }));

    const computed = computePositions(rawFills);

    const existing = await this.prisma.position.findMany({
      where: { accountId },
      select: { id: true, sourceHash: true },
    });

    const existingByHash = new Map(existing.map((p) => [p.sourceHash, p.id]));
    const newHashes = new Set(computed.map((p) => p.sourceHash));

    await this.prisma.$transaction(async (tx) => {
      const staleIds = existing
        .filter((p) => !newHashes.has(p.sourceHash))
        .map((p) => p.id);

      if (staleIds.length > 0) {
        await tx.position.deleteMany({ where: { id: { in: staleIds } } });
      }

      for (const pos of computed) {
        if (existingByHash.has(pos.sourceHash)) continue;

        const created = await tx.position.create({
          data: {
            accountId,
            symbol: pos.symbol,
            side: pos.side,
            status: pos.status,
            openedAt: pos.openedAt,
            closedAt: pos.closedAt ?? null,
            qtyMax: pos.qtyMax,
            avgEntry: pos.avgEntry,
            avgExit: pos.avgExit ?? null,
            grossPnl: pos.grossPnl,
            fees: pos.fees,
            funding: pos.funding,
            netPnl: pos.netPnl,
            rPlanned: null,
            rRealized: null,
            mfe: null,
            mae: null,
            sourceHash: pos.sourceHash,
          },
        });

        if (pos.fills.length > 0) {
          await tx.positionFill.createMany({
            data: pos.fills.map((f) => ({
              positionId: created.id,
              fillId: f.fillId,
              role: f.role,
            })),
          });
        }
      }
    });

    this.logger.log(`Recompute done — ${computed.length} positions for account ${accountId}`);
    return { positionCount: computed.length };
  }
}
