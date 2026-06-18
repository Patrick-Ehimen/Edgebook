import type { CreateWatchlistItem } from '@edgebook/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(userId: string, input: CreateWatchlistItem) {
    return this.prisma.watchlistItem.create({
      data: {
        userId,
        symbol: input.symbol.toUpperCase(),
        horizon: input.horizon,
        bias: input.bias,
        notes: input.notes ?? null,
        conviction: input.conviction ?? 3,
        convictionReason: input.convictionReason ?? null,
        tags: input.tags ?? [],
        playbookNames: input.playbookNames ?? [],
        keyLevelsJson: input.keyLevelsJson ?? [],
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.watchlistItem.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!item) throw new NotFoundException('Watchlist item not found.');
    if (item.userId !== userId) throw new ForbiddenException();
    await this.prisma.watchlistItem.delete({ where: { id } });
    return { deleted: true };
  }
}
