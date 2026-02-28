-- AlterTable: add username and password_hash, make phone/birth_date/gender etc nullable
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "username"       TEXT,
  ADD COLUMN IF NOT EXISTS "password_hash"  TEXT;

-- Make previously NOT NULL columns nullable
ALTER TABLE "users"
  ALTER COLUMN "phone"               DROP NOT NULL,
  ALTER COLUMN "birth_date"          DROP NOT NULL,
  ALTER COLUMN "gender"              DROP NOT NULL,
  ALTER COLUMN "relationship_status" DROP NOT NULL,
  ALTER COLUMN "facebook_url"        DROP NOT NULL,
  ALTER COLUMN "about_text"          DROP NOT NULL,
  ALTER COLUMN "looking_for_text"    DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "users_username_key" ON "users"("username") WHERE "username" IS NOT NULL;

-- Drop old unique index on phone and replace with partial (allows NULL)
DROP INDEX IF EXISTS "users_phone_key";
CREATE UNIQUE INDEX IF NOT EXISTS "users_phone_key" ON "users"("phone") WHERE "phone" IS NOT NULL;
