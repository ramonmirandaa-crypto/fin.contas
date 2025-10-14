-- Align PostgreSQL schema with worker finance tables
CREATE TABLE IF NOT EXISTS "credit_cards" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "linked_account_id" INTEGER,
  "name" TEXT NOT NULL,
  "credit_limit" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "current_balance" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "due_day" INTEGER NOT NULL DEFAULT 1,
  "closing_day" INTEGER,
  "issuer" TEXT,
  "brand" TEXT,
  "is_virtual" BOOLEAN DEFAULT FALSE,
  "status" TEXT,
  "last_synced_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_cards_linked_account_id_fkey"
    FOREIGN KEY ("linked_account_id") REFERENCES "accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_credit_cards_user" ON "credit_cards"("user_id");

CREATE TABLE IF NOT EXISTS "investments" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "account_id" INTEGER,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "amount" NUMERIC(18, 2) NOT NULL,
  "purchase_date" TIMESTAMPTZ,
  "current_value" NUMERIC(18, 2),
  "expected_return_rate" NUMERIC(10, 4),
  "risk_level" TEXT,
  "institution_name" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "investments_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_investments_user" ON "investments"("user_id");

CREATE TABLE IF NOT EXISTS "loans" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "account_id" INTEGER,
  "name" TEXT NOT NULL,
  "principal_amount" NUMERIC(18, 2) NOT NULL,
  "interest_rate" NUMERIC(10, 4) NOT NULL,
  "start_date" TIMESTAMPTZ NOT NULL,
  "end_date" TIMESTAMPTZ,
  "monthly_payment" NUMERIC(18, 2) NOT NULL,
  "remaining_balance" NUMERIC(18, 2) NOT NULL,
  "lender" TEXT,
  "status" TEXT,
  "notes" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "loans_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_loans_user" ON "loans"("user_id");

CREATE TABLE IF NOT EXISTS "credit_card_bills" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "account_id" INTEGER,
  "pluggy_bill_id" TEXT,
  "closing_date" TIMESTAMPTZ,
  "due_date" TIMESTAMPTZ,
  "total_amount" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "minimum_payment" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "previous_bill_balance" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "paid_amount" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "payment_date" TIMESTAMPTZ,
  "is_fully_paid" BOOLEAN NOT NULL DEFAULT FALSE,
  "interest_rate" NUMERIC(10, 4),
  "late_fee" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "annual_fee" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "international_fee" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "bill_status" TEXT,
  "currency_code" TEXT NOT NULL DEFAULT 'BRL',
  "bill_month" INTEGER,
  "bill_year" INTEGER,
  "pluggy_created_at" TIMESTAMPTZ,
  "pluggy_updated_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_card_bills_account_id_fkey"
    FOREIGN KEY ("account_id") REFERENCES "accounts"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_credit_card_bills_user" ON "credit_card_bills"("user_id");

CREATE TABLE IF NOT EXISTS "transaction_categories" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT,
  "description" TEXT,
  "keywords" TEXT,
  "parent_id" INTEGER,
  "is_default" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transaction_categories_parent_id_fkey"
    FOREIGN KEY ("parent_id") REFERENCES "transaction_categories"("id")
    ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "idx_transaction_categories_user" ON "transaction_categories"("user_id");
