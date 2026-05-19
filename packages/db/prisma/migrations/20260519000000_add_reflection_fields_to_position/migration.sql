-- Add post-trade reflection fields to Position.
ALTER TABLE "Position" ADD COLUMN "wentRight"     TEXT;
ALTER TABLE "Position" ADD COLUMN "wentWrong"     TEXT;
ALTER TABLE "Position" ADD COLUMN "lesson"        TEXT;
ALTER TABLE "Position" ADD COLUMN "planAdherence" DECIMAL(5,2);
ALTER TABLE "Position" ADD COLUMN "processScore"  DECIMAL(4,1);
ALTER TABLE "Position" ADD COLUMN "outcomeScore"  DECIMAL(4,1);
