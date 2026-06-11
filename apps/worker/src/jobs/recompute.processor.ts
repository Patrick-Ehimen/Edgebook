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

    const staleRows = existing.filter((p) => !newHashes.has(p.sourceHash));
    const staleIds = staleRows.map((p) => p.id);

    const staleMeta = staleIds.length > 0
      ? await this.prisma.position.findMany({
          where: { id: { in: staleIds } },
          include: { tags: true, notes: { select: { images: true } } },
        })
      : [];

    await this.prisma.$transaction(async (tx) => {
      if (staleIds.length > 0) {
        await tx.position.deleteMany({ where: { id: { in: staleIds } } });
      }

      for (const pos of computed) {
        if (existingByHash.has(pos.sourceHash)) continue;

        const newFillIds = new Set(pos.fills.map((f) => f.fillId.toString()));
        const predecessor = staleMeta.find((s) =>
          s.sourceHash.split(',').every((id) => newFillIds.has(id)),
        ) ?? null;

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
            playbookId: predecessor?.playbookId ?? null,
            rPlanned: predecessor?.rPlanned ?? null,
            rRealized: predecessor?.rRealized ?? null,
            mfe: predecessor?.mfe ?? null,
            mae: predecessor?.mae ?? null,
            wentRight: predecessor?.wentRight ?? null,
            wentWrong: predecessor?.wentWrong ?? null,
            lesson: predecessor?.lesson ?? null,
            planAdherence: predecessor?.planAdherence ?? null,
            processScore: predecessor?.processScore ?? null,
            outcomeScore: predecessor?.outcomeScore ?? null,
            checklistState: predecessor?.checklistState ?? null,
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

        if (predecessor?.tags.length) {
          await tx.positionTag.createMany({
            data: predecessor.tags.map((t) => ({ positionId: created.id, tag: t.tag })),
            skipDuplicates: true,
          });
        }

        if (predecessor?.notes?.images?.length) {
          await tx.positionNote.create({
            data: { positionId: created.id, bodyMd: '', images: predecessor.notes.images },
          });
        }
      }
    });

    this.logger.log(`Recompute done — ${computed.length} positions for account ${accountId}`);
    return { positionCount: computed.length };
  }
}
