PRAGMA foreign_keys = ON;

DROP TRIGGER IF EXISTS accounts_updated_at;
DROP TRIGGER IF EXISTS transactions_updated_at;
DROP TRIGGER IF EXISTS budgets_updated_at;
DROP TRIGGER IF EXISTS goals_updated_at;
DROP TRIGGER IF EXISTS credit_cards_updated_at;
DROP TRIGGER IF EXISTS investments_updated_at;
DROP TRIGGER IF EXISTS loans_updated_at;
DROP TRIGGER IF EXISTS credit_card_bills_updated_at;
DROP TRIGGER IF EXISTS transaction_categories_updated_at;
DROP TRIGGER IF EXISTS expenses_updated_at;

CREATE TRIGGER accounts_updated_at
AFTER UPDATE ON accounts
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE accounts SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER transactions_updated_at
AFTER UPDATE ON transactions
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE transactions SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER budgets_updated_at
AFTER UPDATE ON budgets
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE budgets SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER goals_updated_at
AFTER UPDATE ON goals
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE goals SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER credit_cards_updated_at
AFTER UPDATE ON credit_cards
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE credit_cards SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER investments_updated_at
AFTER UPDATE ON investments
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE investments SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER loans_updated_at
AFTER UPDATE ON loans
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE loans SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER credit_card_bills_updated_at
AFTER UPDATE ON credit_card_bills
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE credit_card_bills SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER transaction_categories_updated_at
AFTER UPDATE ON transaction_categories
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE transaction_categories SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER expenses_updated_at
AFTER UPDATE ON expenses
FOR EACH ROW WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE expenses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
