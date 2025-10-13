-- CreateTable expenses
CREATE TABLE "expenses" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "amount" NUMERIC(18, 2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "pluggy_transaction_id" TEXT,
  "is_synced_from_bank" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "expenses_user_id_pluggy_transaction_id_key" ON "expenses"("user_id", "pluggy_transaction_id");
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");
CREATE INDEX "expenses_user_id_date_idx" ON "expenses"("user_id", "date");
CREATE INDEX "expenses_user_id_category_idx" ON "expenses"("user_id", "category");
