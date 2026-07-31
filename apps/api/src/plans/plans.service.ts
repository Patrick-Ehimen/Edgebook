import type { CreatePlan, UpdatePlan } from '@edgebook/shared';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.plan.findMany({
      where: { userId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async get(userId: string, planId: string) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || plan.deletedAt) throw new NotFoundException('Plan not found.');
    if (plan.userId !== userId) throw new ForbiddenException();
    return plan;
  }

  async create(userId: string, input: CreatePlan) {
    return this.prisma.plan.create({
      data: {
        userId,
        name: input.name,
        owner: input.owner ?? '',
        method: input.method ?? '',
        version: input.version ?? '1.0',
        status: input.status ?? 'draft',
        effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
        valuesJson: input.valuesJson ?? {},
        rulesJson: input.rulesJson ?? {},
      },
    });
  }

  async update(userId: string, planId: string, input: UpdatePlan) {
    await this.get(userId, planId);
    return this.prisma.plan.update({
      where: { id: planId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.owner !== undefined && { owner: input.owner }),
        ...(input.method !== undefined && { method: input.method }),
        ...(input.version !== undefined && { version: input.version }),
        ...(input.status !== undefined && { status: input.status }),
        ...(input.effectiveFrom !== undefined && {
          effectiveFrom: input.effectiveFrom ? new Date(input.effectiveFrom) : null,
        }),
        ...(input.valuesJson !== undefined && { valuesJson: input.valuesJson }),
        ...(input.rulesJson !== undefined && { rulesJson: input.rulesJson }),
      },
    });
  }

  /** Soft delete — the Archive surfaces it for the retention window. */
  async remove(userId: string, planId: string) {
    await this.get(userId, planId);
    await this.prisma.plan.update({
      where: { id: planId },
      data: { deletedAt: new Date() },
    });
    return { ok: true as const };
  }
}
