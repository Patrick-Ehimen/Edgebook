import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Fetch all entry dates for this user, newest first
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    const dateSet = new Set(entries.map((e) => e.date.toISOString().slice(0, 10)));

    // Walk backwards from today counting consecutive days with an entry
    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!dateSet.has(key)) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // Discipline avg: mean processScore from closed positions in last 30 days
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

    return { streak, disciplineAvg };
  }
}
