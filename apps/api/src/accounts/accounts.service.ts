import { createHash } from 'node:crypto';
import { probeWithdrawal } from '@edgebook/exchange/withdrawal-probe';
import {
  AccountForbiddenError,
  AccountHasFillsError,
  AccountNotFoundError,
  type AddApiKeyInput,
  type CreateAccountInput,
  KeyScopeError,
  type UpdateAccountInput,
} from '@edgebook/shared/accounts';
import { Injectable } from '@nestjs/common';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
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
        startingBalance: input.startingBalance ?? '0',
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

  async getAccount(userId: string, accountId: string) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { _count: { select: { apiKeys: true } } },
    });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    return this.toAccountShape(account, account._count.apiKeys);
  }

  async updateAccount(userId: string, accountId: string, input: UpdateAccountInput) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
      include: { _count: { select: { apiKeys: true } } },
    });
    if (!account) throw new AccountNotFoundError();
    if (account.userId !== userId) throw new AccountForbiddenError();

    const updated = await this.prisma.account.update({
      where: { id: accountId },
      data: {
        ...(input.label !== undefined && { label: input.label }),
        ...(input.startingBalance !== undefined && { startingBalance: input.startingBalance }),
      },
      include: { _count: { select: { apiKeys: true } } },
    });

    return this.toAccountShape(updated, updated._count.apiKeys);
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

    return { queued: false as const };
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
      startingBalance?: { toString(): string };
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
      startingBalance: account.startingBalance?.toString() ?? '0',
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
