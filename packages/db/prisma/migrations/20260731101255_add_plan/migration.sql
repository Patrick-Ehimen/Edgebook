-- CreateEnum
CREATE TYPE "PlanStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "owner" TEXT NOT NULL DEFAULT '',
    "method" TEXT NOT NULL DEFAULT '',
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" "PlanStatus" NOT NULL DEFAULT 'draft',
    "effectiveFrom" TIMESTAMPTZ,
    "valuesJson" JSONB NOT NULL DEFAULT '{}',
    "rulesJson" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "deletedAt" TIMESTAMPTZ,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Plan_userId_idx" ON "Plan"("userId");

-- CreateIndex
CREATE INDEX "Plan_userId_deletedAt_idx" ON "Plan"("userId", "deletedAt");

-- AddForeignKey
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
