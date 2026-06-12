import { Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JournalService {
  constructor(private readonly prisma: PrismaService) {}

  // ── helpers ──────────────────────────────────────────────────────────────────

  private todayUTC() {
    const d = new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  // ── Discipline helpers ──────────────────────────────────────────────────────

  private num(v: unknown): number {
    if (v == null) return 0;
    return typeof v === 'number' ? v : Number(v);
  }

  private computeDisciplineComponents(
    recentEntries: { planAdherence: unknown | null; finalizedAt: Date | null; intentMd: string | null; eodMd: string | null }[],
    recentPositions: { planAdherence: unknown | null; processScore: unknown | null; rPlanned: unknown | null; playbookId: string | null; checklistState: Prisma.JsonValue | null }[],
    streak: number,
    entriesThisMonth: number,
  ) {
    // No data at all → return zeros so new accounts score 0, not 68
    if (recentEntries.length === 0 && recentPositions.length === 0) {
      return { planAdherence: 0, ruleViolations: 0, journalCompletion: 0, riskDiscipline: 0 };
    }

    // 1. Plan adherence (0–100) — both entry & position use percentage scale
    const planValues: number[] = [];
    for (const e of recentEntries) {
      const v = this.num(e.planAdherence);
      if (e.planAdherence != null) planValues.push(v);
    }
    for (const p of recentPositions) {
      const v = this.num(p.planAdherence);
      if (p.planAdherence != null) planValues.push(v);
    }
    const planAdherence = planValues.length > 0
      ? Math.round(planValues.reduce((a, b) => a + b, 0) / planValues.length)
      : 0;

    // 2. Rule violations (0–100, inverted — fewer violations = higher score)
    let ruleViolations = 100;
    if (recentPositions.length > 0) {
      const violations = recentPositions.filter(p =>
        (p.processScore != null && this.num(p.processScore) < 5) ||
        (p.checklistState != null && Object.values(p.checklistState as Record<string, string>).some(v => v === 'miss'))
      ).length;
      ruleViolations = Math.round((1 - violations / recentPositions.length) * 100);
    }

    // 3. Journal completion (0–100)
    const entryCount = recentEntries.length;
    const filledCount = recentEntries.filter(e =>
      e.intentMd && e.intentMd.length > 0 && e.eodMd && e.eodMd.length > 0
    ).length;
    const streakScore = Math.min(streak / 30 * 100, 100);
    const monthScore = Math.min(entriesThisMonth / 22 * 100, 100);
    const qualityScore = entryCount > 0 ? (filledCount / entryCount) * 100 : 0;
    const journalCompletion = Math.round(streakScore * 0.3 + monthScore * 0.3 + qualityScore * 0.4);

    // 4. Risk discipline (0–100)
    let riskDiscipline = 100;
    if (recentPositions.length > 0) {
      const planUsed = recentPositions.filter(p => p.rPlanned != null).length;
      const playbookUsed = recentPositions.filter(p => p.playbookId != null).length;
      riskDiscipline = Math.round(
        (planUsed / recentPositions.length) * 40 +
        (playbookUsed / recentPositions.length) * 60
      );
    }

    return { planAdherence, ruleViolations, journalCompletion, riskDiscipline };
  }

  async getStats(userId: string, dateStr?: string, accountId?: string) {
    // Use provided date (for detail page context) or today (for global browser stats)
    const anchor = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : this.todayUTC();
    const anchorEnd = new Date(anchor.getTime() + 86_400_000); // inclusive end of day
    const since30d = new Date(anchor);
    since30d.setUTCDate(since30d.getUTCDate() - 30);
    const since60d = new Date(anchor);
    since60d.setUTCDate(since60d.getUTCDate() - 60);

    // ── All entry dates (for streak + month count — always global / today) ──
    const today = this.todayUTC();
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    const entryDates = new Set(entries.map(e => e.date.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!entryDates.has(key)) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    // Longest streak from all dates (current streak is always a candidate)
    const allDates = [...entryDates].sort();
    let longestStreak = streak;
    let run = 0;
    let prevTs: number | null = null;
    for (const ds of allDates) {
      const ts = new Date(`${ds}T00:00:00.000Z`).getTime();
      if (prevTs !== null && ts - prevTs === 86_400_000) {
        run++;
      } else {
        run = 1;
      }
      if (run > longestStreak) longestStreak = run;
      prevTs = ts;
    }

    const currentMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const entriesThisMonth = entries.filter(e => e.date >= currentMonthStart).length;

    // ── Entries (date-only field, fine with anchor) ──
    const recentEntries = await this.prisma.journalEntry.findMany({
      where: { userId, date: { gte: since30d, lte: anchor } },
      select: { planAdherence: true, finalizedAt: true, intentMd: true, eodMd: true },
    });

    const oldEntries = await this.prisma.journalEntry.findMany({
      where: { userId, date: { gte: since60d, lt: since30d } },
      select: { planAdherence: true, finalizedAt: true, intentMd: true, eodMd: true },
    });

    // ── Positions (timestamptz — use anchorEnd to cover full day) ──
    const posAccFilter = accountId ? { userId, id: accountId } : { userId };
    const recentPositions = await this.prisma.position.findMany({
      where: { account: posAccFilter, closedAt: { gte: since30d, lt: anchorEnd } },
      select: { planAdherence: true, processScore: true, rPlanned: true, playbookId: true, checklistState: true },
    });

    const oldPositions = await this.prisma.position.findMany({
      where: { account: posAccFilter, closedAt: { gte: since60d, lt: since30d } },
      select: { planAdherence: true, processScore: true, rPlanned: true, playbookId: true, checklistState: true },
    });

    const current = this.computeDisciplineComponents(recentEntries, recentPositions, streak, entriesThisMonth);
    const previous = this.computeDisciplineComponents(oldEntries, oldPositions, streak, entriesThisMonth);

    const overall = Math.round(
      current.planAdherence * 0.25 +
      current.ruleViolations * 0.25 +
      current.journalCompletion * 0.25 +
      current.riskDiscipline * 0.25
    );

    const prevOverall = Math.round(
      previous.planAdherence * 0.25 +
      previous.ruleViolations * 0.25 +
      previous.journalCompletion * 0.25 +
      previous.riskDiscipline * 0.25
    );

    const delta = overall - prevOverall;

    return {
      streak,
      longestStreak,
      disciplineAvg: overall,
      entriesThisMonth,
      discipline: {
        score: overall,
        delta,
        planAdherence: { score: current.planAdherence, delta: current.planAdherence - previous.planAdherence },
        ruleViolations: { score: current.ruleViolations, delta: current.ruleViolations - previous.ruleViolations },
        journalCompletion: { score: current.journalCompletion, delta: current.journalCompletion - previous.journalCompletion },
        riskDiscipline: { score: current.riskDiscipline, delta: current.riskDiscipline - previous.riskDiscipline },
      },
    };
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

  async delete(userId: string, dateStr: string) {
    const date = new Date(dateStr);
    const entry = await this.prisma.journalEntry.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return this.prisma.journalEntry.delete({
      where: { userId_date: { userId, date } },
    });
  }

  async listRecent(userId: string, limit = 10, accountId?: string) {
    const entries = await this.prisma.journalEntry.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
      select: { id: true, date: true, bias: true, finalizedAt: true, lesson: true, moodTagsJson: true, conviction: true, sleepHours: true, intentMd: true },
    });

    if (entries.length === 0) return [];

    // ── All entry dates (for streak + month count) ──
    const today = this.todayUTC();
    const allEntryDates = await this.prisma.journalEntry.findMany({
      where: { userId },
      select: { date: true },
      orderBy: { date: 'desc' },
    });

    const entryDateSet = new Set(allEntryDates.map(d => d.date.toISOString().slice(0, 10)));

    let streak = 0;
    const cursor = new Date(today);
    while (true) {
      const key = cursor.toISOString().slice(0, 10);
      if (!entryDateSet.has(key)) break;
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }

    const currentMonthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const entriesThisMonth = allEntryDates.filter(d => d.date >= currentMonthStart).length;

    // ── Batch-fetch entries & positions for the 60-day window ──
    const entryDates = entries.map(e => e.date);
    const minDate = new Date(Math.min(...entryDates.map(d => d.getTime())));
    const rangeStart = new Date(minDate);
    rangeStart.setUTCDate(rangeStart.getUTCDate() - 60);

    const listAccFilter = accountId ? { userId, id: accountId } : { userId };
    const [windowEntries, windowPositions] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where: { userId, date: { gte: rangeStart } },
        select: { date: true, planAdherence: true, finalizedAt: true, intentMd: true, eodMd: true },
      }),
      this.prisma.position.findMany({
        where: { account: listAccFilter, openedAt: { gte: rangeStart } },
        select: { openedAt: true, planAdherence: true, processScore: true, rPlanned: true, playbookId: true, checklistState: true },
      }),
    ]);

    // Group positions by date for trade count
    const positionsByDate = new Map<string, typeof windowPositions>();
    for (const p of windowPositions) {
      const ds = p.openedAt.toISOString().slice(0, 10);
      const arr = positionsByDate.get(ds) ?? [];
      arr.push(p);
      positionsByDate.set(ds, arr);
    }

    return entries.map(e => {
      const ds = e.date.toISOString().slice(0, 10);
      const anchorDate = new Date(`${ds}T00:00:00.000Z`);
      const anchorEnd = new Date(anchorDate.getTime() + 86_400_000);
      const since30d = new Date(anchorDate);
      since30d.setUTCDate(since30d.getUTCDate() - 30);

      const wEntries = windowEntries.filter(en =>
        en.date >= since30d && en.date <= anchorDate
      );
      const wPositions = windowPositions.filter(p =>
        p.openedAt >= since30d && p.openedAt < anchorEnd
      );

      const components = this.computeDisciplineComponents(wEntries, wPositions, streak, entriesThisMonth);
      const overall = Math.round(
        components.planAdherence * 0.25 +
        components.ruleViolations * 0.25 +
        components.journalCompletion * 0.25 +
        components.riskDiscipline * 0.25
      );

      const dayPositions = positionsByDate.get(ds) ?? [];

      return {
        id: e.id,
        date: e.date,
        bias: e.bias,
        finalizedAt: e.finalizedAt,
        lesson: e.lesson,
        moodTagsJson: e.moodTagsJson,
        conviction: e.conviction,
        sleepHours: e.sleepHours,
        intentMd: e.intentMd,
        tradeCount: dayPositions.length,
        discipline: overall,
      };
    });
  }
}
