export const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value !== 0;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === '1' || normalized === 'true';
  }

  if (typeof value === 'bigint') {
    return value !== BigInt(0);
  }

  return Boolean(value);
};

export const toNumber = (value: unknown): number | unknown => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return value;
};

export const resolveNumber = (value: unknown, fallback = 0): number => {
  const converted = toNumber(value);
  return typeof converted === 'number' && !Number.isNaN(converted) ? converted : fallback;
};

export const parseDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return null;
};

export const normalizeDbValue = (value: unknown): unknown => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizeDbValue);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    if (typeof (value as { toNumber?: () => number }).toNumber === 'function') {
      return (value as { toNumber: () => number }).toNumber();
    }

    const normalized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      normalized[key] = normalizeDbValue(entry);
    }
    return normalized;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  return value;
};

export const formatTransaction = (transaction: Record<string, unknown> | null | undefined) => {
  if (!transaction) {
    return null;
  }

  const normalized = normalizeDbValue(transaction) as Record<string, unknown>;

  if ('amount' in normalized) {
    const converted = toNumber(normalized.amount);
    if (typeof converted === 'number') {
      normalized.amount = converted;
    }
  }

  if ('balance_after' in normalized) {
    const converted = toNumber(normalized.balance_after);
    if (typeof converted === 'number') {
      normalized.balance_after = converted;
    }
  }

  if ('reconciled' in normalized) {
    normalized.reconciled = toBoolean(normalized.reconciled);
  }

  if ('is_synced_from_bank' in normalized) {
    normalized.is_synced_from_bank = toBoolean(normalized.is_synced_from_bank);
  }

  if ('account_id' in normalized) {
    const converted = toNumber(normalized.account_id);
    if (typeof converted === 'number') {
      normalized.account_id = converted;
    }
  }

  if ('account' in normalized) {
    const account = normalized.account as Record<string, unknown> | null | undefined;
    normalized.account_name = account && 'name' in account ? (account.name as string | null) : null;
    normalized.account_type = account && 'account_type' in account ? (account.account_type as string | null) : null;
    delete normalized.account;
  }

  return normalized;
};

export const formatAccount = (account: Record<string, unknown>) => {
  const normalized = normalizeDbValue(account) as Record<string, unknown>;

  if ('id' in normalized) {
    const converted = toNumber(normalized.id);
    if (typeof converted === 'number') {
      normalized.id = converted;
    }
  }

  if ('balance' in normalized) {
    const converted = toNumber(normalized.balance);
    if (typeof converted === 'number') {
      normalized.balance = converted;
    }
  }

  if ('credit_limit' in normalized) {
    const converted = toNumber(normalized.credit_limit);
    if (typeof converted === 'number') {
      normalized.credit_limit = converted;
    }
  }

  if ('available_credit_limit' in normalized) {
    const converted = toNumber(normalized.available_credit_limit);
    if (typeof converted === 'number') {
      normalized.available_credit_limit = converted;
    }
  }

  if ('minimum_payment' in normalized) {
    const converted = toNumber(normalized.minimum_payment);
    if (typeof converted === 'number') {
      normalized.minimum_payment = converted;
    }
  }

  if ('sync_enabled' in normalized) {
    normalized.sync_enabled = toBoolean(normalized.sync_enabled);
  }

  if ('is_active' in normalized) {
    normalized.is_active = toBoolean(normalized.is_active);
  }

  if ('is_limit_flexible' in normalized) {
    normalized.is_limit_flexible = toBoolean(normalized.is_limit_flexible);
  }

  return normalized;
};

export const formatExpenseRecord = (expense: unknown): Record<string, unknown> | null => {
  if (!expense || typeof expense !== 'object') {
    return null;
  }

  const formatted = { ...(expense as Record<string, unknown>) };

  if ('id' in formatted) {
    const idValue = formatted.id;
    if (typeof idValue === 'string' || typeof idValue === 'number' || typeof idValue === 'bigint') {
      formatted.id = Number(idValue);
    }
  }

  if ('amount' in formatted) {
    const amountValue = formatted.amount;
    if (typeof amountValue === 'string' || typeof amountValue === 'number' || typeof amountValue === 'bigint') {
      formatted.amount = Number(amountValue);
    }
  }

  if ('is_synced_from_bank' in formatted) {
    const isSyncedValue = formatted.is_synced_from_bank;
    if (typeof isSyncedValue === 'number') {
      formatted.is_synced_from_bank = isSyncedValue === 1;
    } else if (typeof isSyncedValue === 'string') {
      formatted.is_synced_from_bank =
        isSyncedValue === '1' || isSyncedValue.toLowerCase() === 'true';
    } else {
      formatted.is_synced_from_bank = Boolean(isSyncedValue);
    }
  }

  return formatted;
};

export const formatBudget = (budget: unknown) => {
  const normalized = normalizeDbValue(budget as Record<string, unknown>) as Record<string, unknown>;
  if ('account' in normalized) {
    const account = normalized.account as Record<string, unknown> | null | undefined;
    normalized.account_name = account && 'name' in account ? (account.name as string | null) : null;
    delete normalized.account;
  }

  if ('id' in normalized) {
    const converted = toNumber(normalized.id);
    if (typeof converted === 'number') {
      normalized.id = converted;
    }
  }

  if ('account_id' in normalized) {
    const converted = toNumber(normalized.account_id);
    if (typeof converted === 'number') {
      normalized.account_id = converted;
    }
  }

  if ('amount' in normalized) {
    const converted = toNumber(normalized.amount);
    if (typeof converted === 'number') {
      normalized.amount = converted;
    }
  }

  if ('spent' in normalized) {
    const converted = toNumber(normalized.spent);
    if (typeof converted === 'number') {
      normalized.spent = converted;
    }
  }
  return normalized;
};

export const formatGoal = (goal: unknown) => {
  const normalized = normalizeDbValue(goal as Record<string, unknown>) as Record<string, unknown>;
  if ('account' in normalized) {
    const account = normalized.account as Record<string, unknown> | null | undefined;
    normalized.account_name = account && 'name' in account ? (account.name as string | null) : null;
    delete normalized.account;
  }

  if ('target_amount' in normalized) {
    const converted = toNumber(normalized.target_amount);
    if (typeof converted === 'number') {
      normalized.target_amount = converted;
    }
  }

  if ('current_amount' in normalized) {
    const converted = toNumber(normalized.current_amount);
    if (typeof converted === 'number') {
      normalized.current_amount = converted;
    }
  }

  if ('account_id' in normalized) {
    const converted = toNumber(normalized.account_id);
    if (typeof converted === 'number') {
      normalized.account_id = converted;
    }
  }
  return normalized;
};
