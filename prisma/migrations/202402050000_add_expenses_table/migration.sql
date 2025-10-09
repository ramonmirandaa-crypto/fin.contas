-- CreateTable expenses
CREATE TABLE "expenses" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "user_id" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "pluggy_transaction_id" TEXT,
  "is_synced_from_bank" BOOLEAN NOT NULL DEFAULT 0,
  "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "expenses_user_id_pluggy_transaction_id_key" ON "expenses"("user_id", "pluggy_transaction_id");
CREATE INDEX "expenses_user_id_idx" ON "expenses"("user_id");
CREATE INDEX "expenses_user_id_date_idx" ON "expenses"("user_id", "date");
CREATE INDEX "expenses_user_id_category_idx" ON "expenses"("user_id", "category");

CREATE TRIGGER IF NOT EXISTS "expenses_updated_at"
AFTER UPDATE ON "expenses"
FOR EACH ROW
BEGIN
  UPDATE "expenses" SET "updated_at" = CURRENT_TIMESTAMP WHERE "id" = NEW."id";
END;
