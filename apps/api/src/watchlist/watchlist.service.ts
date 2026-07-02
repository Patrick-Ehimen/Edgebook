import type {
  CreateWatchlistItem,
  UpdateWatchlistItem,
} from "@edgebook/shared";
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class WatchlistService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.watchlistItem.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  }

  async getById(userId: string, id: string) {
    const item = await this.prisma.watchlistItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Watchlist item not found.");
    if (item.userId !== userId) throw new ForbiddenException();
    return item;
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
        images: input.images ?? [],
      },
    });
  }

  async update(userId: string, id: string, input: UpdateWatchlistItem) {
    const item = await this.prisma.watchlistItem.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!item) throw new NotFoundException("Watchlist item not found.");
    if (item.userId !== userId) throw new ForbiddenException();
    return this.prisma.watchlistItem.update({
      where: { id },
      data: {
        ...(input.horizon !== undefined && { horizon: input.horizon }),
        ...(input.bias !== undefined && { bias: input.bias }),
        ...(input.notes !== undefined && { notes: input.notes }),
        ...(input.conviction !== undefined && { conviction: input.conviction }),
        ...(input.convictionReason !== undefined && {
          convictionReason: input.convictionReason,
        }),
        ...(input.tags !== undefined && { tags: input.tags }),
        ...(input.playbookNames !== undefined && {
          playbookNames: input.playbookNames,
        }),
        ...(input.keyLevelsJson !== undefined && {
          keyLevelsJson: input.keyLevelsJson,
        }),
        ...(input.images !== undefined && { images: input.images }),
      },
    });
  }

  async remove(userId: string, id: string) {
    const item = await this.prisma.watchlistItem.findUnique({
      where: { id },
      select: { userId: true },
    });
    if (!item) throw new NotFoundException("Watchlist item not found.");
    if (item.userId !== userId) throw new ForbiddenException();
    await this.prisma.watchlistItem.delete({ where: { id } });
    return { deleted: true };
  }
}
