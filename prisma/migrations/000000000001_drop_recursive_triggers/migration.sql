DO $$
BEGIN
  PERFORM 1 FROM pg_trigger WHERE tgname = 'accounts_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "accounts_updated_at" ON "accounts"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'transactions_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "transactions_updated_at" ON "transactions"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'budgets_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "budgets_updated_at" ON "budgets"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'goals_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "goals_updated_at" ON "goals"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'credit_cards_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "credit_cards_updated_at" ON "credit_cards"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'investments_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "investments_updated_at" ON "investments"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'loans_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "loans_updated_at" ON "loans"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'credit_card_bills_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "credit_card_bills_updated_at" ON "credit_card_bills"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'transaction_categories_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "transaction_categories_updated_at" ON "transaction_categories"';
  END IF;

  PERFORM 1 FROM pg_trigger WHERE tgname = 'expenses_updated_at';
  IF FOUND THEN
    EXECUTE 'DROP TRIGGER IF EXISTS "expenses_updated_at" ON "expenses"';
  END IF;
END $$;
