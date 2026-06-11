-- CreateEnum
CREATE TYPE "DrawdownKind" AS ENUM ('STATIC', 'EOD_TRAILING', 'TICK_TRAILING');

-- CreateEnum
CREATE TYPE "PropAccountStatus" AS ENUM ('EVAL', 'FUNDED', 'PASSED', 'SUSPENDED', 'CLOSED');

-- CreateEnum
CREATE TYPE "PropEventKind" AS ENUM ('DAILY_LOSS_WARNING', 'DAILY_LOSS_BREACH', 'DRAWDOWN_WARNING', 'DRAWDOWN_BREACH', 'CONSISTENCY_WARNING', 'CONSISTENCY_BREACH', 'SL_MISSING_WARNING', 'EXPOSURE_WARNING', 'PROFIT_TARGET_HIT', 'MIN_DAYS_MET', 'DAILY_RESET', 'ACCOUNT_LOCKED');

-- CreateEnum
CREATE TYPE "PropEventSeverity" AS ENUM ('INFO', 'WARNING', 'CRITICAL');

-- CreateEnum
CREATE TYPE "PropPayoutStatus" AS ENUM ('PENDING', 'PAID', 'REJECTED');

-- CreateTable
CREATE TABLE "PropFirm" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "logoInitial" TEXT NOT NULL,
    "logoColor" TEXT NOT NULL,
    "exchanges" TEXT[],
    "flags" TEXT[],
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PropFirm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropFirmRulePack" (
    "id" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "accountSize" DECIMAL(20,2) NOT NULL,
    "phase" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "profitTargetPct" DECIMAL(6,4) NOT NULL,
    "drawdownKind" "DrawdownKind" NOT NULL,
    "maxDailyLossPct" DECIMAL(6,4),
    "maxOverallLossPct" DECIMAL(6,4) NOT NULL,
    "consistencyMaxDayPct" DECIMAL(6,4),
    "minTradingDays" INTEGER,
    "timeLimitDays" INTEGER,
    "maxRiskPerTradePct" DECIMAL(6,4),
    "maxTotalExposurePct" DECIMAL(6,4),
    "slRequiredWithinSecs" INTEGER,
    "weekendHoldAllowed" BOOLEAN NOT NULL DEFAULT true,
    "overnightHoldAllowed" BOOLEAN NOT NULL DEFAULT true,
    "profitSplitPct" DECIMAL(6,4) NOT NULL,
    "verifiedAt" TIMESTAMPTZ NOT NULL,
    "notes" TEXT,

    CONSTRAINT "PropFirmRulePack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firmId" TEXT NOT NULL,
    "rulePackId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "externalId" TEXT,
    "accountSize" DECIMAL(20,2) NOT NULL,
    "phase" INTEGER NOT NULL,
    "status" "PropAccountStatus" NOT NULL DEFAULT 'EVAL',
    "startedAt" TIMESTAMPTZ NOT NULL,
    "endedAt" TIMESTAMPTZ,
    "peakBalance" DECIMAL(30,10),
    "todayStartBalance" DECIMAL(30,10),
    "currentBalance" DECIMAL(30,10),
    "tradingDaysCount" INTEGER NOT NULL DEFAULT 0,
    "exchangeAccountId" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "PropAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropComplianceEvent" (
    "id" TEXT NOT NULL,
    "propAccountId" TEXT NOT NULL,
    "kind" "PropEventKind" NOT NULL,
    "severity" "PropEventSeverity" NOT NULL,
    "message" TEXT NOT NULL,
    "metadata" JSONB,
    "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropComplianceEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropPayout" (
    "id" TEXT NOT NULL,
    "propAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "grossAmount" DECIMAL(20,4) NOT NULL,
    "splitPct" DECIMAL(6,4) NOT NULL,
    "netAmount" DECIMAL(20,4) NOT NULL,
    "status" "PropPayoutStatus" NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMPTZ NOT NULL,
    "paidAt" TIMESTAMPTZ,
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropPayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PropFirm_slug_key" ON "PropFirm"("slug");

-- CreateIndex
CREATE INDEX "PropFirmRulePack_firmId_isActive_idx" ON "PropFirmRulePack"("firmId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PropFirmRulePack_firmId_accountSize_phase_version_key" ON "PropFirmRulePack"("firmId", "accountSize", "phase", "version");

-- CreateIndex
CREATE INDEX "PropAccount_userId_idx" ON "PropAccount"("userId");

-- CreateIndex
CREATE INDEX "PropAccount_userId_status_idx" ON "PropAccount"("userId", "status");

-- CreateIndex
CREATE INDEX "PropComplianceEvent_propAccountId_occurredAt_idx" ON "PropComplianceEvent"("propAccountId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "PropComplianceEvent_propAccountId_kind_idx" ON "PropComplianceEvent"("propAccountId", "kind");

-- CreateIndex
CREATE INDEX "PropPayout_propAccountId_idx" ON "PropPayout"("propAccountId");

-- CreateIndex
CREATE INDEX "PropPayout_userId_idx" ON "PropPayout"("userId");

-- AddForeignKey
ALTER TABLE "PropFirmRulePack" ADD CONSTRAINT "PropFirmRulePack_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "PropFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropAccount" ADD CONSTRAINT "PropAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropAccount" ADD CONSTRAINT "PropAccount_firmId_fkey" FOREIGN KEY ("firmId") REFERENCES "PropFirm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropAccount" ADD CONSTRAINT "PropAccount_rulePackId_fkey" FOREIGN KEY ("rulePackId") REFERENCES "PropFirmRulePack"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropComplianceEvent" ADD CONSTRAINT "PropComplianceEvent_propAccountId_fkey" FOREIGN KEY ("propAccountId") REFERENCES "PropAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropPayout" ADD CONSTRAINT "PropPayout_propAccountId_fkey" FOREIGN KEY ("propAccountId") REFERENCES "PropAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
