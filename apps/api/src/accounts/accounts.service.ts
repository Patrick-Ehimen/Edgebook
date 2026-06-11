import { createHash } from 'node:crypto';
import { probeWithdrawal } from '@edgebook/exchange/withdrawal-probe';
import {
  AccountForbiddenError,
  AccountHasFillsError,
  AccountNotFoundError,
  type AddApiKeyInput,
  type CreateAccountInput,
  KeyScopeError,
} from '@edgebook/shared/accounts';
import { QUEUE_SYNC, type SyncJobData } from '@edgebook/shared/queues';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
    @InjectQueue(QUEUE_SYNC) private readonly syncQueue: Queue<SyncJobData>,
  ) {}

  async createAccount(userId: string, input: CreateAccountInput) {
    const account = await this.prisma.account.create({
      data: {
        userId,
        venue: input.venue,
        label: input.label,
        accountType: input.accountType,
        category: input.category ?? 'live',
        baseCurrency: input.baseCurrency,
      },
    });

    return this.toAccountShape(account, 0);
  }

  async listAccounts(userId: string) {
    const accounts = await this.prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      include: { _count: { select: { apiKeys: true } } },
    });

    return accounts.map((a) => this.toAccountShape(a, a._count.apiKeys));
  }

  async deleteAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    const fillCount = await this.prisma.fill.count({ where: { accountId } });
    if (fillCount > 0) throw new AccountHasFillsError();

    await this.prisma.account.delete({ where: { id: accountId } });
    return { ok: true as const };
  }

  async addApiKey(userId: string, accountId: string, input: AddApiKeyInput) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    const probe = await probeWithdrawal({
      venue: account.venue as 'binance' | 'bybit',
      apiKey: input.apiKey,
      secret: input.secret,
    });

    if (!probe.safe) throw new KeyScopeError();

    const keyIdHash = createHash('sha256').update(input.apiKey).digest('hex');
    const keyEnc = this.encryption.encrypt(input.apiKey);
    const secretEnc = this.encryption.encrypt(input.secret);

    const apiKey = await this.prisma.apiKey.create({
      data: {
        accountId,
        keyIdHash,
        keyEnc,
        secretEnc,
        scope: ['read'],
      },
    });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        kind: 'API_KEY_ADDED',
        payloadJson: { accountId, venue: account.venue },
      },
    });

    await this.syncQueue.add(
      'sync',
      { accountId, userId, fullSync: true },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return this.toApiKeyShape(apiKey);
  }

  async revokeApiKey(userId: string, accountId: string, keyId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    const apiKey = await this.prisma.apiKey.findUnique({ where: { id: keyId } });
    if (!apiKey || apiKey.accountId !== accountId) throw new AccountNotFoundError();

    await this.prisma.apiKey.delete({ where: { id: keyId } });

    await this.prisma.auditEvent.create({
      data: {
        userId,
        kind: 'API_KEY_REMOVED',
        payloadJson: { accountId, keyId, venue: account.venue },
      },
    });

    return { ok: true as const };
  }

  async triggerSync(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    await this.syncQueue.add(
      'sync',
      { accountId, userId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return { queued: true as const };
  }

  private toAccountShape(
    account: {
      id: string;
      userId: string;
      venue: string;
      label: string;
      accountType: string;
      category?: string;
      baseCurrency: string;
      createdAt: Date;
    },
    keyCount: number,
  ) {
    return {
      id: account.id,
      userId: account.userId,
      venue: account.venue,
      label: account.label,
      accountType: account.accountType,
      category: account.category ?? 'live',
      baseCurrency: account.baseCurrency,
      createdAt: account.createdAt.toISOString(),
      keyCount,
    };
  }

  private toApiKeyShape(key: {
    id: string;
    accountId: string;
    scope: string[];
    lastUsedAt: Date | null;
    createdAt: Date;
  }) {
    return {
      id: key.id,
      accountId: key.accountId,
      scope: key.scope,
      lastUsedAt: key.lastUsedAt?.toISOString() ?? null,
      createdAt: key.createdAt.toISOString(),
    };
  }
}
