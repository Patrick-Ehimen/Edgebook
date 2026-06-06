import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    const dateSet = new Set(entries.map((e) => e.date.toISOString().slice(0, 10)));

    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!dateSet.has(key)) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const monthStart = new Date(today);
    monthStart.setUTCDate(1);
    const entriesThisMonth = entries.filter((e) => e.date >= monthStart).length;

    const since = new Date(today);
    since.setUTCDate(since.getUTCDate() - 30);

    const result = await this.prisma.position.aggregate({
      where: {
        account: { userId },
        status: 'closed',
        closedAt: { gte: since },
        processScore: { not: null },
      },
      _avg: { processScore: true },
      _count: { processScore: true },
    });

    const disciplineAvg =
      result._count.processScore > 0 && result._avg.processScore !== null
        ? Math.round(Number(result._avg.processScore))
        : null;

    return { streak, disciplineAvg, entriesThisMonth };
  }

  async getByDate(userId: string, dateStr: string) {
    const date = new Date(dateStr);
    return this.prisma.journalEntry.findUnique({
      where: { userId_date: { userId, date } },
    });
  }

  async upsert(userId: string, dateStr: string, data: Record<string, unknown>) {
    const date = new Date(dateStr);
    const { userId: _u, date: _d, ...fields } = data as Record<string, unknown> & { userId?: unknown; date?: unknown };
    const createData = { userId, date, ...fields } as Prisma.JournalEntryUncheckedCreateInput;
    const updateData = fields as Prisma.JournalEntryUncheckedUpdateInput;
    return this.prisma.journalEntry.upsert({
      where: { userId_date: { userId, date } },
      create: createData,
      update: updateData,
    });
  }

  async listRecent(userId: string, limit = 10) {
    return this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      select: { id: true, date: true, bias: true, finalizedAt: true, lesson: true },
    });
  }
}
