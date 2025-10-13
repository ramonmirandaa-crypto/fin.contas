-- Create enum types
CREATE TYPE "AccountType" AS ENUM ('checking', 'savings', 'credit_card', 'loan', 'investment');
CREATE TYPE "TransactionType" AS ENUM ('income', 'expense', 'transfer');
CREATE TYPE "GoalCategory" AS ENUM ('savings', 'investment', 'expense_reduction', 'debt_payment', 'other');
CREATE TYPE "GoalStatus" AS ENUM ('active', 'completed', 'paused');
CREATE TYPE "GoalPriority" AS ENUM ('low', 'medium', 'high');

-- CreateTable accounts
CREATE TABLE "accounts" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "pluggy_account_id" TEXT,
  "pluggy_item_id" TEXT,
  "name" TEXT NOT NULL,
  "account_type" "AccountType" NOT NULL,
  "account_subtype" TEXT,
  "institution_name" TEXT,
  "balance" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "currency_code" TEXT NOT NULL DEFAULT 'BRL',
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "sync_enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "last_sync_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "marketing_name" TEXT,
  "number" TEXT,
  "owner" TEXT,
  "tax_number" TEXT,
  "status" TEXT,
  "category" TEXT,
  "sub_category" TEXT,
  "pluggy_created_at" TIMESTAMPTZ,
  "pluggy_updated_at" TIMESTAMPTZ,
  "pluggy_last_updated_at" TIMESTAMPTZ,
  "transfer_number" TEXT,
  "closing_balance" NUMERIC(18, 2),
  "automatically_invested_balance" NUMERIC(18, 2),
  "overdraft_contracted_limit" NUMERIC(18, 2),
  "overdraft_used_limit" NUMERIC(18, 2),
  "unarranged_overdraft_amount" NUMERIC(18, 2),
  "branch_code" TEXT,
  "account_digit" TEXT,
  "compe_code" TEXT,
  "credit_level" TEXT,
  "credit_brand" TEXT,
  "balance_close_date" TIMESTAMPTZ,
  "balance_due_date" TIMESTAMPTZ,
  "minimum_payment" NUMERIC(18, 2),
  "credit_limit" NUMERIC(18, 2),
  "available_credit_limit" NUMERIC(18, 2),
  "is_limit_flexible" BOOLEAN,
  "total_installment_balance" NUMERIC(18, 2),
  "interest_rate" NUMERIC(10, 4),
  "fine_rate" NUMERIC(10, 4),
  "annual_fee" NUMERIC(18, 2),
  "card_network" TEXT,
  "card_type" TEXT,
  "contract_number" TEXT,
  "principal_amount" NUMERIC(18, 2),
  "outstanding_balance" NUMERIC(18, 2),
  "loan_interest_rate" NUMERIC(10, 4),
  "installment_amount" NUMERIC(18, 2),
  "installment_frequency" TEXT,
  "remaining_installments" INTEGER,
  "total_installments" INTEGER,
  "due_date" TIMESTAMPTZ,
  "maturity_date" TIMESTAMPTZ,
  "origination_date" TIMESTAMPTZ,
  "product_name" TEXT,
  "investment_type" TEXT,
  "portfolio_value" NUMERIC(18, 2),
  "net_worth" NUMERIC(18, 2),
  "gross_worth" NUMERIC(18, 2),
  "last_movement_date" TIMESTAMPTZ,
  "investment_rate" NUMERIC(10, 4),
  "rate_type" TEXT,
  "indexer" TEXT,
  "investment_maturity_date" TIMESTAMPTZ,
  "isin" TEXT,
  "quantity" NUMERIC(18, 6),
  "unit_price" NUMERIC(18, 6)
);

CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateTable transactions
CREATE TABLE "transactions" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "account_id" INTEGER,
  "pluggy_transaction_id" TEXT,
  "transaction_hash" TEXT,
  "amount" NUMERIC(18, 2) NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "transaction_type" "TransactionType" NOT NULL DEFAULT 'expense',
  "date" TIMESTAMPTZ NOT NULL,
  "balance_after" NUMERIC(18, 2),
  "merchant_name" TEXT,
  "merchant_category" TEXT,
  "payment_method" TEXT,
  "tags" TEXT,
  "notes" TEXT,
  "reconciled" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'completed',
  "provider_code" TEXT,
  "operation_type" TEXT,
  "pix_data" TEXT,
  "installment_data" TEXT,
  "location_data" TEXT,
  "foreign_exchange_data" TEXT,
  "fees_data" TEXT,
  "processed_at" TIMESTAMPTZ,
  "is_synced_from_bank" BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "transactions_user_id_idx" ON "transactions"("user_id");
CREATE INDEX "transactions_account_id_idx" ON "transactions"("account_id");
CREATE INDEX "transactions_user_id_date_idx" ON "transactions"("user_id", "date");

-- CreateTable budgets
CREATE TABLE "budgets" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "amount" NUMERIC(18, 2) NOT NULL,
  "spent" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "period_start" TIMESTAMPTZ NOT NULL,
  "period_end" TIMESTAMPTZ NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'active',
  "notes" TEXT,
  "account_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "budgets_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "budgets_user_id_idx" ON "budgets"("user_id");
CREATE INDEX "budgets_user_id_category_idx" ON "budgets"("user_id", "category");

-- CreateTable goals
CREATE TABLE "goals" (
  "id" TEXT PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "target_amount" NUMERIC(18, 2) NOT NULL,
  "current_amount" NUMERIC(18, 2) NOT NULL DEFAULT 0,
  "target_date" TIMESTAMPTZ NOT NULL,
  "category" "GoalCategory" NOT NULL DEFAULT 'savings',
  "status" "GoalStatus" NOT NULL DEFAULT 'active',
  "priority" "GoalPriority" NOT NULL DEFAULT 'medium',
  "account_id" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "goals_account_id_fkey" FOREIGN KEY ("account_id") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "goals_user_id_idx" ON "goals"("user_id");

-- CreateTable user_configs
CREATE TABLE "user_configs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "config_key" TEXT NOT NULL,
  "config_value" TEXT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "idx_user_configs_user_key" ON "user_configs"("user_id", "config_key");

-- CreateTable pluggy_connections
CREATE TABLE "pluggy_connections" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "pluggy_item_id" TEXT NOT NULL,
  "institution_name" TEXT,
  "connection_status" TEXT,
  "last_sync_at" TIMESTAMPTZ,
  "client_user_id" TEXT,
  "connector_id" TEXT,
  "connector_name" TEXT,
  "connector_image_url" TEXT,
  "connector_primary_color" TEXT,
  "org_id" TEXT,
  "org_name" TEXT,
  "org_domain" TEXT,
  "status_detail" TEXT,
  "execution_status" TEXT,
  "last_sync_message" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "pluggy_connections_user_id_pluggy_item_id_key" ON "pluggy_connections"("user_id", "pluggy_item_id");
CREATE INDEX "idx_pluggy_connections_user" ON "pluggy_connections"("user_id");

-- CreateTable webhook_configs
CREATE TABLE "webhook_configs" (
  "id" SERIAL PRIMARY KEY,
  "user_id" TEXT NOT NULL,
  "webhook_url" TEXT NOT NULL,
  "events" TEXT,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "webhook_configs_user_id_key" ON "webhook_configs"("user_id");

-- CreateTable webhook_logs
CREATE TABLE "webhook_logs" (
  "id" SERIAL PRIMARY KEY,
  "webhook_id" TEXT NOT NULL,
  "success" BOOLEAN NOT NULL,
  "error_message" TEXT,
  "attempt_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "idx_webhook_logs_webhook_id" ON "webhook_logs"("webhook_id");
CREATE INDEX "idx_webhook_logs_created_at" ON "webhook_logs"("created_at");
