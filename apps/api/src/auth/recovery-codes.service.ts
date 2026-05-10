import { createHash, randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecoveryCodesService {
  constructor(private readonly prisma: PrismaService) {}

  generate(): string[] {
    return Array.from({ length: 8 }, () => this.makeCode());
  }

  async store(userId: string, codes: string[]): Promise<void> {
    await this.prisma.recoveryCode.deleteMany({ where: { userId } });
    await this.prisma.recoveryCode.createMany({
      data: codes.map((code) => ({ userId, codeHash: this.hash(code) })),
    });
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const codeHash = this.hash(code.toUpperCase());
    const record = await this.prisma.recoveryCode.findFirst({
      where: { userId, codeHash, usedAt: null },
    });
    if (!record) return false;
    await this.prisma.recoveryCode.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return true;
  }

  private makeCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const part = () => Array.from({ length: 4 }, () => chars[randomInt(0, chars.length)]).join('');
    return `${part()}-${part()}`;
  }

  private hash(code: string): string {
    return createHash('sha256').update(code).digest('hex');
  }
}
