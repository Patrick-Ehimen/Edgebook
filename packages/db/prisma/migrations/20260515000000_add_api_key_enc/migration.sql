-- Add keyEnc column to store the encrypted API key string.
-- Existing rows get an empty-string placeholder; in practice no rows exist
-- in production yet so this migration is safe.
ALTER TABLE "ApiKey" ADD COLUMN "keyEnc" TEXT NOT NULL DEFAULT '';

-- Remove the default after adding (column is required going forward)
ALTER TABLE "ApiKey" ALTER COLUMN "keyEnc" DROP DEFAULT;
