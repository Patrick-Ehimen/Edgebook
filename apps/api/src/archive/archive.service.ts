import type { ArchiveItemType, ArchivedItem } from '@edgebook/shared';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function wordCount(md: string): number {
  const trimmed = md.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

@Injectable()
export class ArchiveService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string): Promise<ArchivedItem[]> {
    const [notes, watchlistItems, playbooks, journalEntries] = await Promise.all([
      this.prisma.libraryNote.findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.watchlistItem.findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.playbook.findMany({
        where: { userId, deletedAt: { not: null } },
        include: { _count: { select: { positions: true } } },
        orderBy: { deletedAt: 'desc' },
      }),
      this.prisma.journalEntry.findMany({
        where: { userId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    const items: ArchivedItem[] = [
      ...notes.map((note) => ({
        id: note.id,
        type: 'notes' as const,
        title: note.name,
        context: `${wordCount(note.bodyMd)} words${note.tags.length ? ` · ${note.tags.slice(0, 3).join(', ')}` : ''}`,
        originLabel: `Library / ${note.folderId}`,
        // biome-ignore lint/style/noNonNullAssertion: filtered by deletedAt: { not: null }
        removedAt: note.deletedAt!.toISOString(),
      })),
      ...watchlistItems.map((item) => ({
        id: item.id,
        type: 'watchlist' as const,
        title: `${item.symbol} · ${item.horizon} watchlist`,
        context: `${item.bias} bias · conviction ${item.conviction}/5${item.convictionReason ? ` · ${item.convictionReason}` : ''}`,
        originLabel: `Watchlist / ${item.horizon}`,
        // biome-ignore lint/style/noNonNullAssertion: filtered by deletedAt: { not: null }
        removedAt: item.deletedAt!.toISOString(),
      })),
      ...playbooks.map((pb) => ({
        id: pb.id,
        type: 'playbook' as const,
        title: `Playbook · ${pb.name}`,
        context: `${pb.status} · ${pb._count.positions} trade${pb._count.positions === 1 ? '' : 's'}`,
        originLabel: 'Playbook',
        // biome-ignore lint/style/noNonNullAssertion: filtered by deletedAt: { not: null }
        removedAt: pb.deletedAt!.toISOString(),
      })),
      ...journalEntries.map((entry) => ({
        id: entry.id,
        type: 'journal' as const,
        title: `Journal · ${entry.date.toISOString().slice(0, 10)}`,
        context: `${entry.finalizedAt ? 'finalized' : 'draft'}${entry.lesson ? ` · ${entry.lesson}` : ''}`,
        originLabel: 'Daily journal',
        // biome-ignore lint/style/noNonNullAssertion: filtered by deletedAt: { not: null }
        removedAt: entry.deletedAt!.toISOString(),
      })),
    ];

    return items.sort((a, b) => new Date(b.removedAt).getTime() - new Date(a.removedAt).getTime());
  }

  async restore(userId: string, type: ArchiveItemType, id: string) {
    switch (type) {
      case 'notes':
        return this.restoreNote(userId, id);
      case 'watchlist':
        return this.restoreWatchlistItem(userId, id);
      case 'playbook':
        return this.restorePlaybook(userId, id);
      case 'journal':
        return this.restoreJournalEntry(userId, id);
      default:
        throw new BadRequestException('Unknown archive item type.');
    }
  }

  async purge(userId: string, type: ArchiveItemType, id: string) {
    switch (type) {
      case 'notes':
        return this.purgeNote(userId, id);
      case 'watchlist':
        return this.purgeWatchlistItem(userId, id);
      case 'playbook':
        return this.purgePlaybook(userId, id);
      case 'journal':
        return this.purgeJournalEntry(userId, id);
      default:
        throw new BadRequestException('Unknown archive item type.');
    }
  }

  private async restoreNote(userId: string, id: string) {
    const note = await this.assertArchived(
      this.prisma.libraryNote.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Note',
    );
    if (note.userId !== userId) throw new ForbiddenException();
    await this.prisma.libraryNote.update({ where: { id }, data: { deletedAt: null } });
    return { restored: true };
  }

  private async purgeNote(userId: string, id: string) {
    const note = await this.assertArchived(
      this.prisma.libraryNote.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Note',
    );
    if (note.userId !== userId) throw new ForbiddenException();
    await this.prisma.libraryNote.delete({ where: { id } });
    return { purged: true };
  }

  private async restoreWatchlistItem(userId: string, id: string) {
    const item = await this.assertArchived(
      this.prisma.watchlistItem.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Watchlist item',
    );
    if (item.userId !== userId) throw new ForbiddenException();
    await this.prisma.watchlistItem.update({ where: { id }, data: { deletedAt: null } });
    return { restored: true };
  }

  private async purgeWatchlistItem(userId: string, id: string) {
    const item = await this.assertArchived(
      this.prisma.watchlistItem.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Watchlist item',
    );
    if (item.userId !== userId) throw new ForbiddenException();
    await this.prisma.watchlistItem.delete({ where: { id } });
    return { purged: true };
  }

  private async restorePlaybook(userId: string, id: string) {
    const playbook = await this.assertArchived(
      this.prisma.playbook.findUnique({ where: { id }, select: { userId: true, deletedAt: true } }),
      'Playbook',
    );
    if (playbook.userId !== userId) throw new ForbiddenException();
    await this.prisma.playbook.update({ where: { id }, data: { deletedAt: null } });
    return { restored: true };
  }

  private async purgePlaybook(userId: string, id: string) {
    const playbook = await this.assertArchived(
      this.prisma.playbook.findUnique({ where: { id }, select: { userId: true, deletedAt: true } }),
      'Playbook',
    );
    if (playbook.userId !== userId) throw new ForbiddenException();
    await this.prisma.playbook.delete({ where: { id } });
    return { purged: true };
  }

  private async restoreJournalEntry(userId: string, id: string) {
    const entry = await this.assertArchived(
      this.prisma.journalEntry.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Journal entry',
    );
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.prisma.journalEntry.update({ where: { id }, data: { deletedAt: null } });
    return { restored: true };
  }

  private async purgeJournalEntry(userId: string, id: string) {
    const entry = await this.assertArchived(
      this.prisma.journalEntry.findUnique({
        where: { id },
        select: { userId: true, deletedAt: true },
      }),
      'Journal entry',
    );
    if (entry.userId !== userId) throw new ForbiddenException();
    await this.prisma.journalEntry.delete({ where: { id } });
    return { purged: true };
  }

  private async assertArchived<T extends { userId: string; deletedAt: Date | null }>(
    lookup: Promise<T | null>,
    label: string,
  ): Promise<T> {
    const record = await lookup;
    if (!record) throw new NotFoundException(`${label} not found.`);
    if (!record.deletedAt) throw new NotFoundException(`${label} is not archived.`);
    return record;
  }
}
