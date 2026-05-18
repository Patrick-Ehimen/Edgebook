import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { computePositions } from '@edgebook/shared/positions';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DEMO_EMAIL = 'demo@edgebook.com';
const DEMO_PASSWORD = 'demo1234';

function daysAgo(days: number, hours = 0): Date {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000);
}

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, { type: argon2.argon2id });

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      handle: 'demo',
      email: DEMO_EMAIL,
      emailVerifiedAt: new Date(),
      passwordHash,
      isOnboarded: true,
    },
  });

  let account = await prisma.account.findFirst({
    where: { userId: user.id, label: 'Binance Demo' },
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        venue: 'binance',
        label: 'Binance Demo',
        accountType: 'futures',
        baseCurrency: 'USDT',
      },
    });
  }

  // Wipe existing derived data for idempotency
  await prisma.positionFill.deleteMany({ where: { position: { accountId: account.id } } });
  await prisma.position.deleteMany({ where: { accountId: account.id } });
  await prisma.fill.deleteMany({ where: { accountId: account.id } });

  const rawFillData = [
    // BTC long — winner, closed
    { symbol: 'BTCUSDT', side: 'buy' as const,  qty: '0.1',  price: '42000', fee: '2.1',    executedAt: daysAgo(14, 8) },
    { symbol: 'BTCUSDT', side: 'sell' as const, qty: '0.1',  price: '44500', fee: '2.225',  executedAt: daysAgo(12, 4) },
    // ETH long — loser, closed
    { symbol: 'ETHUSDT', side: 'buy' as const,  qty: '2',    price: '2800',  fee: '2.8',    executedAt: daysAgo(11, 2) },
    { symbol: 'ETHUSDT', side: 'sell' as const, qty: '2',    price: '2620',  fee: '2.62',   executedAt: daysAgo(10, 6) },
    // SOL long — winner, closed
    { symbol: 'SOLUSDT', side: 'buy' as const,  qty: '20',   price: '95',    fee: '0.95',   executedAt: daysAgo(9, 10) },
    { symbol: 'SOLUSDT', side: 'sell' as const, qty: '20',   price: '112',   fee: '1.12',   executedAt: daysAgo(7,  2) },
    // BTC long — scale-in, loser, closed
    { symbol: 'BTCUSDT', side: 'buy' as const,  qty: '0.05', price: '43500', fee: '1.0875', executedAt: daysAgo(6, 10) },
    { symbol: 'BTCUSDT', side: 'buy' as const,  qty: '0.05', price: '44200', fee: '1.105',  executedAt: daysAgo(6,  8) },
    { symbol: 'BTCUSDT', side: 'sell' as const, qty: '0.1',  price: '42300', fee: '2.115',  executedAt: daysAgo(5,  6) },
    // ETH short — winner, closed
    { symbol: 'ETHUSDT', side: 'sell' as const, qty: '1',    price: '3050',  fee: '1.525',  executedAt: daysAgo(4,  3) },
    { symbol: 'ETHUSDT', side: 'buy' as const,  qty: '1',    price: '2900',  fee: '1.45',   executedAt: daysAgo(3,  1) },
    // ETH long — open position
    { symbol: 'ETHUSDT', side: 'buy' as const,  qty: '1.5',  price: '3100',  fee: '2.325',  executedAt: daysAgo(1,  4) },
  ];

  const fills = await Promise.all(
    rawFillData.map((f, i) =>
      prisma.fill.create({
        data: {
          accountId: account.id,
          venue: 'binance',
          symbol: f.symbol,
          side: f.side,
          qty: f.qty,
          price: f.price,
          fee: f.fee,
          feeCcy: 'USDT',
          fundingFee: null,
          exchangeTradeId: `demo-fill-${i + 1}`,
          executedAt: f.executedAt,
        },
      }),
    ),
  );

  const computedPositions = computePositions(
    fills.map((f) => ({
      id: f.id,
      symbol: f.symbol,
      side: f.side as 'buy' | 'sell',
      qty: f.qty.toString(),
      price: f.price.toString(),
      fee: f.fee.toString(),
      fundingFee: f.fundingFee?.toString() ?? null,
      executedAt: f.executedAt,
    })),
  );

  for (const pos of computedPositions) {
    const created = await prisma.position.create({
      data: {
        accountId: account.id,
        symbol: pos.symbol,
        side: pos.side,
        status: pos.status,
        openedAt: pos.openedAt,
        closedAt: pos.closedAt ?? null,
        qtyMax: pos.qtyMax,
        avgEntry: pos.avgEntry,
        avgExit: pos.avgExit ?? null,
        grossPnl: pos.grossPnl,
        fees: pos.fees,
        funding: pos.funding,
        netPnl: pos.netPnl,
        sourceHash: pos.sourceHash,
      },
    });

    await prisma.positionFill.createMany({
      data: pos.fills.map((pf) => ({
        positionId: created.id,
        fillId: pf.fillId,
        role: pf.role,
      })),
    });
  }

  console.log(`\nSeeded ${fills.length} fills → ${computedPositions.length} positions`);
  console.log(`\nDemo credentials:`);
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
