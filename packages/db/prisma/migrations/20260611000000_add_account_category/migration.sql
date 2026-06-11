CREATE TYPE "AccountCategory" AS ENUM ('live', 'demo', 'prop');

ALTER TABLE "Account"
  ADD COLUMN IF NOT EXISTS "category" "AccountCategory" NOT NULL DEFAULT 'live';
