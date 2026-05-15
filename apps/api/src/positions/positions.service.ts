import { randomUUID } from 'node:crypto';
import { AccountForbiddenError, AccountNotFoundError } from '@edgebook/shared/accounts';
import { type CreateFillInput, type FillSide, computePositions } from '@edgebook/shared/positions';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Fills ──────────────────────────────────────────────────────────────────

  async createFill(userId: string, accountId: string, input: CreateFillInput) {
    const account = await this.assertOwnership(userId, accountId);

    const fill = await this.prisma.fill.create({
      data: {
        accountId,
        venue: account.venue,
        symbol: input.symbol,
        side: input.side,
        qty: input.qty,
        price: input.price,
        fee: input.fee,
        feeCcy: input.feeCcy,
        fundingFee: input.fundingFee ?? null,
        exchangeTradeId: input.exchangeTradeId ?? `manual-${randomUUID()}`,
        executedAt: new Date(input.executedAt),
      },
    });

    await this.recompute(userId, accountId);

    return this.toFillShape(fill);
  }

  async listFills(userId: string, accountId: string) {
    await this.assertOwnership(userId, accountId);

    const fills = await this.prisma.fill.findMany({
      where: { accountId },
      orderBy: { executedAt: 'desc' },
    });

    return fills.map((f) => this.toFillShape(f));
  }

  // ─── Recompute ──────────────────────────────────────────────────────────────

  async recompute(userId: string, accountId: string) {
    await this.assertOwnership(userId, accountId);

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
      const staleIds = existing.filter((p) => !newHashes.has(p.sourceHash)).map((p) => p.id);

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

    return { positionCount: computed.length };
  }

  // ─── Positions ──────────────────────────────────────────────────────────────

  async listPositions(userId: string, accountId: string) {
    await this.assertOwnership(userId, accountId);

    const positions = await this.prisma.position.findMany({
      where: { accountId },
      orderBy: { openedAt: 'desc' },
    });

    return positions.map((p) => this.toPositionShape(p));
  }

  async getPosition(userId: string, accountId: string, positionId: string) {
    await this.assertOwnership(userId, accountId);

    const position = await this.prisma.position.findUnique({
      where: { id: positionId },
      include: {
        positionFills: {
          include: { fill: true },
        },
      },
    });

    if (!position || position.accountId !== accountId) {
      throw new AccountNotFoundError();
    }

    return {
      ...this.toPositionShape(position),
      fills: position.positionFills.map((pf) => ({
        fillId: pf.fillId.toString(),
        role: pf.role,
        fill: this.toFillShape(pf.fill),
      })),
    };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  private async assertOwnership(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();
    return account;
  }

  private toFillShape(fill: {
    id: bigint;
    accountId: string;
    venue: string;
    symbol: string;
    side: string;
    qty: { toString(): string };
    price: { toString(): string };
    fee: { toString(): string };
    feeCcy: string;
    fundingFee: { toString(): string } | null;
    exchangeTradeId: string;
    executedAt: Date;
    createdAt: Date;
  }) {
    return {
      id: fill.id.toString(),
      accountId: fill.accountId,
      venue: fill.venue,
      symbol: fill.symbol,
      side: fill.side,
      qty: fill.qty.toString(),
      price: fill.price.toString(),
      fee: fill.fee.toString(),
      feeCcy: fill.feeCcy,
      fundingFee: fill.fundingFee?.toString() ?? null,
      exchangeTradeId: fill.exchangeTradeId,
      executedAt: fill.executedAt.toISOString(),
      createdAt: fill.createdAt.toISOString(),
    };
  }

  private toPositionShape(pos: {
    id: string;
    accountId: string;
    symbol: string;
    side: string;
    status: string;
    openedAt: Date;
    closedAt: Date | null;
    qtyMax: { toString(): string };
    avgEntry: { toString(): string };
    avgExit: { toString(): string } | null;
    grossPnl: { toString(): string };
    fees: { toString(): string };
    funding: { toString(): string };
    netPnl: { toString(): string };
    rPlanned: { toString(): string } | null;
    rRealized: { toString(): string } | null;
    mfe: { toString(): string } | null;
    mae: { toString(): string } | null;
    playbookId: string | null;
    sourceHash: string;
  }) {
    return {
      id: pos.id,
      accountId: pos.accountId,
      symbol: pos.symbol,
      side: pos.side,
      status: pos.status,
      openedAt: pos.openedAt.toISOString(),
      closedAt: pos.closedAt?.toISOString() ?? null,
      qtyMax: pos.qtyMax.toString(),
      avgEntry: pos.avgEntry.toString(),
      avgExit: pos.avgExit?.toString() ?? null,
      grossPnl: pos.grossPnl.toString(),
      fees: pos.fees.toString(),
      funding: pos.funding.toString(),
      netPnl: pos.netPnl.toString(),
      rPlanned: pos.rPlanned?.toString() ?? null,
      rRealized: pos.rRealized?.toString() ?? null,
      mfe: pos.mfe?.toString() ?? null,
      mae: pos.mae?.toString() ?? null,
      playbookId: pos.playbookId,
      sourceHash: pos.sourceHash,
    };
  }
}
