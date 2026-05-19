-- Add journal/annotation fields to Fill that were missing from the init migration.
ALTER TABLE "Fill" ADD COLUMN "thesis"      TEXT;
ALTER TABLE "Fill" ADD COLUMN "invalidation" TEXT;
ALTER TABLE "Fill" ADD COLUMN "notes"       TEXT;
ALTER TABLE "Fill" ADD COLUMN "sl"          TEXT;
ALTER TABLE "Fill" ADD COLUMN "tp"          TEXT;
ALTER TABLE "Fill" ADD COLUMN "conviction"  INTEGER;
ALTER TABLE "Fill" ADD COLUMN "moods"       TEXT[] NOT NULL DEFAULT '{}';
