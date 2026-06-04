import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.libraryNote.findMany({
      where: { userId },
      include: { playbook: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, input: { folderId: string; name: string; iconId: string }) {
    return this.prisma.libraryNote.create({
      data: { userId, ...input },
    });
  }

  async move(userId: string, noteId: string, folderId: string) {
    await this.assertOwnership(userId, noteId);
    return this.prisma.libraryNote.update({
      where: { id: noteId },
      data: { folderId },
    });
  }

  async pin(userId: string, noteId: string, pinned: boolean) {
    await this.assertOwnership(userId, noteId);
    return this.prisma.libraryNote.update({
      where: { id: noteId },
      data: { pinned },
    });
  }

  async update(userId: string, noteId: string, input: { name?: string; bodyMd?: string; tags?: string[]; playbookId?: string | null }) {
    await this.assertOwnership(userId, noteId);
    return this.prisma.libraryNote.update({
      where: { id: noteId },
      data: { ...input },
      include: { playbook: { select: { id: true, name: true } } },
    });
  }

  async remove(userId: string, noteId: string) {
    await this.assertOwnership(userId, noteId);
    await this.prisma.libraryNote.delete({ where: { id: noteId } });
    return { deleted: true };
  }

  private async assertOwnership(userId: string, noteId: string) {
    const note = await this.prisma.libraryNote.findUnique({
      where: { id: noteId },
      select: { userId: true },
    });
    if (!note) throw new NotFoundException('Note not found.');
    if (note.userId !== userId) throw new ForbiddenException();
  }
}
