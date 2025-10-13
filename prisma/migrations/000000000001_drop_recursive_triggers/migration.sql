-- Drop recursive updated_at triggers to avoid redundant updates
DROP TRIGGER IF EXISTS "accounts_updated_at";
DROP TRIGGER IF EXISTS "transactions_updated_at";
DROP TRIGGER IF EXISTS "budgets_updated_at";
DROP TRIGGER IF EXISTS "goals_updated_at";
