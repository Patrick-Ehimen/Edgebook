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
          moods: [],
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

  // ── Default playbooks ──────────────────────────────────────────────────────

  await prisma.playbook.deleteMany({ where: { userId: user.id } });

  const defaultPlaybooks = [
    {
      name: 'Liquidity sweep',
      thesis: 'Sweep of session high/low into HTF level → reclaim → opposing liquidity. Strongest during EU + US overlap, weak in low-volatility tape.',
      criteriaJson: {
        entry: '• HTF trend aligned (4H)\n• Liquidity sweep + reclaim of HTF level\n• Inside EU or US session\n• Min R:R = 1 : 2',
        exit: '• 50% partial at +1R (TP1)\n• Trail stop to BE on remainder\n• Full exit at opposing session liquidity',
        invalidation: 'Stop loss = below sweep wick. If price re-tests level twice without continuation, invalidate manually.',
        sessions: ['EU', 'US'],
        timeframes: ['5m', '15m'],
        minRR: '1:2',
        riskPct: '0.5',
      },
      checklistItems: [
        { id: 'ls-1', label: 'HTF trend aligned (4H)', type: 'checkbox', required: true },
        { id: 'ls-2', label: 'At pre-defined level', type: 'checkbox', required: true },
        { id: 'ls-3', label: 'Confluence: liquidity sweep', type: 'checkbox', required: true },
        { id: 'ls-4', label: 'Risk ≤ 0.5% account', type: 'checkbox', required: true },
        { id: 'ls-5', label: 'Within EU or US session window', type: 'checkbox', required: true },
        { id: 'ls-6', label: 'No high-impact news ±30 min', type: 'checkbox', required: false },
      ],
    },
    {
      name: 'Breakout retest',
      thesis: 'Break of HTF level → wait for the retest → enter on confirmation. Conservative but reliable when trend is clean.',
      criteriaJson: {
        entry: '• Clean breakout of HTF level with expansion candle\n• Price returns to level (retest)\n• Confirmation candle shows rejection',
        exit: '• 50% partial at prior swing high/low\n• Full exit at 2R target',
        invalidation: 'Price closes back below/above the broken level on the retest.',
        sessions: ['EU', 'US'],
        timeframes: ['15m', '1h'],
        minRR: '1:2',
        riskPct: '0.5',
      },
      checklistItems: [
        { id: 'br-1', label: 'HTF level clearly defined', type: 'checkbox', required: true },
        { id: 'br-2', label: 'Clean breakout with expansion', type: 'checkbox', required: true },
        { id: 'br-3', label: 'Price returned to level', type: 'checkbox', required: true },
        { id: 'br-4', label: 'Rejection candle on retest', type: 'checkbox', required: true },
        { id: 'br-5', label: 'R:R ≥ 2', type: 'checkbox', required: true },
      ],
    },
    {
      name: 'Range fade',
      thesis: 'Fade the extremes of well-defined intraday ranges. Best in low-volatility, sideways tape — typically Asia session.',
      criteriaJson: {
        entry: '• Range defined with ≥4 touches of each extreme\n• Price at range boundary\n• Low volatility confirmed (ATR below 20-period avg)',
        exit: '• Target mid-range or opposite extreme\n• Close immediately on breakout candle',
        invalidation: 'Any candle that closes outside the range invalidates the setup.',
        sessions: ['Asia'],
        timeframes: ['5m'],
        minRR: '1:1.5',
        riskPct: '0.4',
      },
      checklistItems: [
        { id: 'rf-1', label: 'Range clearly defined (≥4 touches)', type: 'checkbox', required: true },
        { id: 'rf-2', label: 'Asia session / low volatility', type: 'checkbox', required: false },
        { id: 'rf-3', label: 'No major news in session', type: 'checkbox', required: true },
        { id: 'rf-4', label: 'Entry at range extreme', type: 'checkbox', required: true },
      ],
    },
    {
      name: 'Trend pullback',
      thesis: 'Buy or sell pullbacks to the 20-EMA in trending tape. Simple, robust, works across timeframes.',
      criteriaJson: {
        entry: '• Clear HTF trend (higher highs/lows or lower highs/lows)\n• Pullback to 20-EMA without breaking structure\n• Entry candle shows rejection or engulfing',
        exit: '• Target prior swing high/low\n• Trail stop using 20-EMA as dynamic stop',
        invalidation: 'Price closes on the wrong side of the 20-EMA or breaks the most recent structure.',
        sessions: ['EU', 'US'],
        timeframes: ['15m', '1h'],
        minRR: '1:2',
        riskPct: '0.5',
      },
      checklistItems: [
        { id: 'tp-1', label: 'Clear trend on HTF', type: 'checkbox', required: true },
        { id: 'tp-2', label: 'Pullback to 20-EMA', type: 'checkbox', required: true },
        { id: 'tp-3', label: 'Structure intact (no BOS)', type: 'checkbox', required: true },
        { id: 'tp-4', label: 'Entry candle shows rejection', type: 'checkbox', required: true },
        { id: 'tp-5', label: 'R:R ≥ 2', type: 'checkbox', required: true },
      ],
    },
    {
      name: 'News reversal',
      thesis: 'Fade the overreaction to scheduled high-impact news within 30 minutes. Smaller size, tighter stops.',
      criteriaJson: {
        entry: '• Scheduled high-impact event (CPI, FOMC, NFP)\n• Initial spike of ≥0.5% in first 30 seconds\n• Reversal candle forms on 1m chart',
        exit: '• Target 50% retrace of the spike\n• Hard time exit at 30 minutes after news',
        invalidation: 'If price continues in spike direction 5 minutes after entry.',
        sessions: ['EU', 'US'],
        timeframes: ['1m', '5m'],
        minRR: '1:1.5',
        riskPct: '0.3',
      },
      checklistItems: [
        { id: 'nr-1', label: 'High-impact event confirmed', type: 'checkbox', required: true },
        { id: 'nr-2', label: 'Initial spike complete (≥30s)', type: 'checkbox', required: true },
        { id: 'nr-3', label: 'Reversal candle on 1m', type: 'checkbox', required: true },
        { id: 'nr-4', label: 'Risk ≤ 0.3% of account', type: 'checkbox', required: true },
        { id: 'nr-5', label: 'Entry within 30 min of news', type: 'checkbox', required: true },
      ],
    },
  ];

  for (const pb of defaultPlaybooks) {
    await prisma.playbook.create({
      data: {
        userId: user.id,
        name: pb.name,
        thesis: pb.thesis,
        criteriaJson: pb.criteriaJson,
        checklists: { create: { itemsJson: pb.checklistItems } },
      },
    });
  }

  console.log(`\nSeeded ${fills.length} fills → ${computedPositions.length} positions`);
  console.log(`Seeded ${defaultPlaybooks.length} default playbooks`);

  // ── Prop firm reference data ───────────────────────────────────────────────

  const VERIFIED_AT = new Date('2026-06-01T00:00:00Z');
  const PACK_VERSION = '2026.06';

  // HyroTrader — true crypto perps on Bybit / Binance / OKX
  // Rules: https://www.hyrotrader.com/evaluations/
  const hyro = await prisma.propFirm.upsert({
    where: { slug: 'hyrotrader' },
    update: {},
    create: {
      slug: 'hyrotrader',
      name: 'HyroTrader',
      website: 'https://www.hyrotrader.com',
      logoInitial: 'H',
      logoColor: 'linear-gradient(135deg,#3b82f6,#06b6d4)',
      exchanges: ['bybit', 'binance', 'okx'],
      flags: [],
    },
  });

  // SizeProp — true crypto perps on Hyperliquid / Bybit
  // Rules: https://www.sizeprop.com/
  const sizeprop = await prisma.propFirm.upsert({
    where: { slug: 'sizeprop' },
    update: {},
    create: {
      slug: 'sizeprop',
      name: 'SizeProp',
      website: 'https://www.sizeprop.com',
      logoInitial: 'S',
      logoColor: 'linear-gradient(135deg,#8b5cf6,#a855f7)',
      exchanges: ['hyperliquid', 'bybit'],
      flags: [],
    },
  });

  // Velotrade — true crypto perps
  // Rules: https://velotrade.com/challenges
  const velotrade = await prisma.propFirm.upsert({
    where: { slug: 'velotrade' },
    update: {},
    create: {
      slug: 'velotrade',
      name: 'Velotrade',
      website: 'https://velotrade.com',
      logoInitial: 'V',
      logoColor: 'linear-gradient(135deg,#10b981,#06b6d4)',
      exchanges: ['bybit'],
      flags: [],
    },
  });

  // ── HyroTrader rule packs ──────────────────────────────────────────────────
  //
  // 1-Step: Phase 1 only.  10% target · 4% daily · 6% tick-trailing DD
  //         40% consistency · mandatory SL ≤5 min · 10 min trading days
  //         Funded: 3% max risk/trade · 25% max total exposure
  //
  // 2-Step: Phase 1 — 10% target · 5% daily · 10% tick-trailing · 10 min days
  //         Phase 2 — 5% target  · 5% daily · 10% tick-trailing ·  5 min days
  //         Same SL + consistency rules apply to eval phases.

  const hyroSizes = [5_000, 10_000, 25_000, 50_000, 100_000, 200_000];

  for (const size of hyroSizes) {
    // 1-Step · Phase 1 (eval)
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: hyro.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-1step`,
        },
      },
      update: {},
      create: {
        firmId: hyro.id,
        version: `${PACK_VERSION}-1step`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'TICK_TRAILING',
        maxDailyLossPct: 0.04,
        maxOverallLossPct: 0.06,
        consistencyMaxDayPct: 0.40,
        minTradingDays: 10,
        timeLimitDays: null,
        maxRiskPerTradePct: 0.03,
        maxTotalExposurePct: 0.25,
        slRequiredWithinSecs: 300,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.70,
        verifiedAt: VERIFIED_AT,
        notes: 'Profit split scales to 90% after 16 months (+5% every 4 months). Swing Upgrade add-on converts DD to static for a fee.',
      },
    });

    // 2-Step · Phase 1 (eval)
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: hyro.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-2step`,
        },
      },
      update: {},
      create: {
        firmId: hyro.id,
        version: `${PACK_VERSION}-2step`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'TICK_TRAILING',
        maxDailyLossPct: 0.05,
        maxOverallLossPct: 0.10,
        consistencyMaxDayPct: 0.40,
        minTradingDays: 10,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: 300,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.70,
        verifiedAt: VERIFIED_AT,
        notes: '2-Step Phase 1. Phase 2 requires 5% target with 5 min trading days.',
      },
    });

    // 2-Step · Phase 2 (eval)
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: hyro.id,
          accountSize: size,
          phase: 2,
          version: `${PACK_VERSION}-2step`,
        },
      },
      update: {},
      create: {
        firmId: hyro.id,
        version: `${PACK_VERSION}-2step`,
        accountSize: size,
        phase: 2,
        isActive: true,
        profitTargetPct: 0.05,
        drawdownKind: 'TICK_TRAILING',
        maxDailyLossPct: 0.05,
        maxOverallLossPct: 0.10,
        consistencyMaxDayPct: 0.40,
        minTradingDays: 5,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: 300,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.70,
        verifiedAt: VERIFIED_AT,
        notes: '2-Step Phase 2. Consistency + SL rules still apply.',
      },
    });
  }

  // ── SizeProp rule packs ────────────────────────────────────────────────────
  //
  // 1-Step: 10% target · 3% daily · 5% STATIC DD · no consistency · no min days
  //         No SL requirement · 5× BTC leverage · 2× alts
  //
  // Degen ($33): lighter version — 2% daily · 3% overall · same no-restriction spirit

  const sizepropSizes = [5_000, 10_000, 25_000, 50_000, 100_000];

  for (const size of sizepropSizes) {
    // Standard 1-Step
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: sizeprop.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-1step`,
        },
      },
      update: {},
      create: {
        firmId: sizeprop.id,
        version: `${PACK_VERSION}-1step`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'STATIC',
        maxDailyLossPct: 0.03,
        maxOverallLossPct: 0.05,
        consistencyMaxDayPct: null,
        minTradingDays: null,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.80,
        verifiedAt: VERIFIED_AT,
        notes: 'Profit split 80–95% (scales with account growth). Max 5× leverage on BTC, 2× on alts. Grid + martingale allowed. USDT payouts within 24 h.',
      },
    });

    // Degen challenge — same sizes, much tighter DD, lower entry fee
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: sizeprop.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-degen`,
        },
      },
      update: {},
      create: {
        firmId: sizeprop.id,
        version: `${PACK_VERSION}-degen`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'STATIC',
        maxDailyLossPct: 0.02,
        maxOverallLossPct: 0.03,
        consistencyMaxDayPct: null,
        minTradingDays: null,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.80,
        verifiedAt: VERIFIED_AT,
        notes: '$33 Degen challenge — lower entry fee, tighter 3% overall DD and 2% daily loss. Same no-restriction rules otherwise.',
      },
    });
  }

  // ── Velotrade rule packs ───────────────────────────────────────────────────
  //
  // 1-Step Classic: 10% target · 3% daily · 5% EOD-trailing DD · 4 min days
  // 1-Step Pro:     10% target · 3% daily · 5% STATIC DD       · 4 min days
  // 2-Step P1:      10% target · 5% daily · 10% EOD-trailing   · 4 min days
  // 2-Step P2:       5% target · 5% daily · 10% EOD-trailing   · 4 min days
  //
  // No consistency, no SL requirement, no exposure cap.
  // Weekend + overnight holding allowed. Up to 90% profit split.

  const veloSizes = [5_000, 25_000, 50_000, 100_000, 200_000];

  for (const size of veloSizes) {
    // 1-Step Classic
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: velotrade.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-1step-classic`,
        },
      },
      update: {},
      create: {
        firmId: velotrade.id,
        version: `${PACK_VERSION}-1step-classic`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'EOD_TRAILING',
        maxDailyLossPct: 0.03,
        maxOverallLossPct: 0.05,
        consistencyMaxDayPct: null,
        minTradingDays: 4,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.90,
        verifiedAt: VERIFIED_AT,
        notes: 'EOD trailing DD — floor only moves at day close, not intraday. No news restrictions. 24-hour payout processing.',
      },
    });

    // 1-Step Pro (static DD variant)
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: velotrade.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-1step-pro`,
        },
      },
      update: {},
      create: {
        firmId: velotrade.id,
        version: `${PACK_VERSION}-1step-pro`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'STATIC',
        maxDailyLossPct: 0.03,
        maxOverallLossPct: 0.05,
        consistencyMaxDayPct: null,
        minTradingDays: 4,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.90,
        verifiedAt: VERIFIED_AT,
        notes: '1-Step Pro — static (fixed floor) drawdown instead of EOD trailing. Easier to manage during volatile sessions.',
      },
    });

    // 2-Step · Phase 1
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: velotrade.id,
          accountSize: size,
          phase: 1,
          version: `${PACK_VERSION}-2step`,
        },
      },
      update: {},
      create: {
        firmId: velotrade.id,
        version: `${PACK_VERSION}-2step`,
        accountSize: size,
        phase: 1,
        isActive: true,
        profitTargetPct: 0.10,
        drawdownKind: 'EOD_TRAILING',
        maxDailyLossPct: 0.05,
        maxOverallLossPct: 0.10,
        consistencyMaxDayPct: null,
        minTradingDays: 4,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.90,
        verifiedAt: VERIFIED_AT,
        notes: '2-Step Phase 1. More lenient DD than Classic — 10% EOD trailing.',
      },
    });

    // 2-Step · Phase 2
    await prisma.propFirmRulePack.upsert({
      where: {
        firmId_accountSize_phase_version: {
          firmId: velotrade.id,
          accountSize: size,
          phase: 2,
          version: `${PACK_VERSION}-2step`,
        },
      },
      update: {},
      create: {
        firmId: velotrade.id,
        version: `${PACK_VERSION}-2step`,
        accountSize: size,
        phase: 2,
        isActive: true,
        profitTargetPct: 0.05,
        drawdownKind: 'EOD_TRAILING',
        maxDailyLossPct: 0.05,
        maxOverallLossPct: 0.10,
        consistencyMaxDayPct: null,
        minTradingDays: 4,
        timeLimitDays: null,
        maxRiskPerTradePct: null,
        maxTotalExposurePct: null,
        slRequiredWithinSecs: null,
        weekendHoldAllowed: true,
        overnightHoldAllowed: true,
        profitSplitPct: 0.90,
        verifiedAt: VERIFIED_AT,
        notes: '2-Step Phase 2 — halved profit target (5%). Same DD and day rules as Phase 1.',
      },
    });
  }

  const firmCount = 3;
  const packCount =
    hyroSizes.length * 3 +   // 1-step P1, 2-step P1, 2-step P2
    sizepropSizes.length * 2 + // 1-step, degen
    veloSizes.length * 4;      // classic, pro, 2step-P1, 2step-P2

  console.log(`\nSeeded ${fills.length} fills → ${computedPositions.length} positions`);
  console.log(`Seeded ${defaultPlaybooks.length} default playbooks`);
  console.log(`Seeded ${firmCount} prop firms · ${packCount} rule packs`);
  console.log('\nDemo credentials:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}\n`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
