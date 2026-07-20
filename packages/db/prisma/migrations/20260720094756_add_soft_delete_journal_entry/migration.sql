-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "deletedAt" TIMESTAMPTZ;

-- CreateIndex
CREATE INDEX "JournalEntry_userId_deletedAt_idx" ON "JournalEntry"("userId", "deletedAt");
