import type { CreatePlaybook, UpdateChecklist, UpdatePlaybook } from '@edgebook/shared';
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlaybooksService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.playbook.findMany({
      where: { userId },
      include: {
        checklists: { select: { id: true, playbookId: true, itemsJson: true } },
        _count: { select: { positions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(userId: string, playbookId: string) {
    const playbook = await this.prisma.playbook.findUnique({
      where: { id: playbookId },
      include: {
        checklists: true,
        _count: { select: { positions: true } },
      },
    });
    if (!playbook) throw new NotFoundException('Playbook not found.');
    if (playbook.userId !== userId) throw new ForbiddenException();
    return playbook;
  }

  async create(userId: string, input: CreatePlaybook) {
    return this.prisma.playbook.create({
      data: {
        userId,
        name: input.name,
        thesis: input.thesis,
        status: input.status ?? 'experimental',
        criteriaJson: input.criteriaJson ?? {},
        sampleChartUrl: input.sampleChartUrl ?? null,
        checklists:
          input.checklistItems && input.checklistItems.length > 0
            ? { create: { itemsJson: input.checklistItems } }
            : undefined,
      },
      include: {
        checklists: true,
        _count: { select: { positions: true } },
      },
    });
  }

  async update(userId: string, playbookId: string, input: UpdatePlaybook) {
    await this.assertOwnership(userId, playbookId);
    return this.prisma.playbook.update({
      where: { id: playbookId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.thesis !== undefined && { thesis: input.thesis }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.criteriaJson !== undefined && { criteriaJson: input.criteriaJson }),
        ...(input.sampleChartUrl !== undefined && { sampleChartUrl: input.sampleChartUrl }),
      },
      include: {
        checklists: true,
        _count: { select: { positions: true } },
      },
    });
  }

  async remove(userId: string, playbookId: string) {
    await this.assertOwnership(userId, playbookId);
    await this.prisma.playbook.delete({ where: { id: playbookId } });
    return { deleted: true };
  }

  async updateChecklist(
    userId: string,
    playbookId: string,
    checklistId: string,
    input: UpdateChecklist,
  ) {
    await this.assertOwnership(userId, playbookId);
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
    });
    if (!checklist || checklist.playbookId !== playbookId) {
      throw new NotFoundException('Checklist not found.');
    }
    return this.prisma.checklist.update({
      where: { id: checklistId },
      data: { itemsJson: input.items },
    });
  }

  async createChecklist(userId: string, playbookId: string, input: UpdateChecklist) {
    await this.assertOwnership(userId, playbookId);
    return this.prisma.checklist.create({
      data: { playbookId, itemsJson: input.items },
    });
  }

  private async assertOwnership(userId: string, playbookId: string) {
    const playbook = await this.prisma.playbook.findUnique({
      where: { id: playbookId },
      select: { userId: true },
    });
    if (!playbook) throw new NotFoundException('Playbook not found.');
    if (playbook.userId !== userId) throw new ForbiddenException();
    return playbook;
  }
}
