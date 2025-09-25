import { Hono, type MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { createClerkClient, type ClerkClient } from '@clerk/backend';
import prisma from './prismaClient';
import { PluggyClient, mapPluggyCategory } from './pluggy-improved';

type TransactionType = 'income' | 'expense' | 'transfer';
type StringFilter = { contains: string; mode: 'insensitive' };
type AmountFilter = { gte?: number; lte?: number };
type DateFilter = { gte?: Date; lte?: Date };
type NumericValue = number | { toNumber: () => number };
type AnalyticsBucket = { totalAmount: number; transactionCount: number };
type AnalyticsTransaction = {
  amount: NumericValue;
  category: string | null;
  merchant_name: string | null;
  date: Date;
};
type TransactionWhere = {
  user_id: string;
  account_id?: number;
  category?: string;
  transaction_type?: TransactionType;
  description?: StringFilter;
  merchant_name?: StringFilter;
  amount?: AmountFilter;
  date?: DateFilter;
};
// Define Env interface locally for the worker
interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  CLERK_SECRET_KEY: string;
  PLUGGY_CLIENT_ID: string;
  PLUGGY_CLIENT_SECRET: string;
}

type AuthRequestState = Awaited<ReturnType<ClerkClient['authenticateRequest']>>;

const app = new Hono<{ Bindings: Env; Variables: { auth: AuthRequestState; userId: string } }>();

const clerkClientCache = new Map<string, ReturnType<typeof createClerkClient>>();

const getClerkClient = (env: Env) => {
  const secretKey = env.CLERK_SECRET_KEY;

  if (!secretKey) {
    throw new Error('Missing CLERK_SECRET_KEY environment variable');
  }

  const cachedClient = clerkClientCache.get(secretKey);
  if (cachedClient) {
    return cachedClient;
  }

  const client = createClerkClient({ secretKey });
  clerkClientCache.set(secretKey, client);
  return client;
};

// Enhanced CORS configuration
app.use('*', cors({
  origin: ['https://n5jcegoubmvau.mocha.app', 'http://localhost:5173', 'https://contas.ramonma.online'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Validation schemas
const expenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1).max(500),
  category: z.string().min(1).max(100),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

// Simple error response helper
const errorResponse = (message: string, status = 400) => {
  return Response.json({ error: message }, { status });
};

// Get authenticated user ID from request headers or auth middleware
const getUserId = (c: any): string | null => {
  try {
    const userId = c.get?.('userId') as string | undefined;
    if (userId) {
      return userId;
    }

    const authState = c.get?.('auth') as AuthRequestState | undefined;
    const auth = authState?.toAuth();
    if (auth?.userId) {
      return auth.userId;
    }
  } catch (error) {
    console.warn('Failed to resolve user from context:', error);
  }

  const legacyUserId = c.req.header('X-User-ID') || c.req.header('x-user-id');
  return legacyUserId || null;
};

const authMiddleware: MiddlewareHandler<{ Bindings: Env; Variables: { auth: AuthRequestState; userId: string } }> = async (
  c,
  next,
) => {
  try {
    const clerkClient = getClerkClient(c.env);
    const requestState = await clerkClient.authenticateRequest(c.req.raw);
    const auth = requestState.toAuth();
    const userId = auth?.userId;

    if (!requestState.isSignedIn || !userId) {
      return errorResponse('Unauthorized', 401);
    }

    c.set('auth', requestState);
    c.set('userId', userId);

    await next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    return errorResponse('Unauthorized', 401);
  }
};

const normalizePrismaValue = (value: unknown): any => {
  if (value === null || value === undefined) {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map(normalizePrismaValue);
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
      normalized[key] = normalizePrismaValue(entry);
    }
    return normalized;
  }

  if (typeof value === 'bigint') {
    return Number(value);
  }

  return value;
};

const withAccountMetadata = <T extends { account?: { name?: string | null; account_type?: string | null } | null }>(
  entity: T,
) => {
  if (!entity || !entity.account) {
    return entity;
  }

  const { account, ...rest } = entity as T & { account: { name?: string | null; account_type?: string | null } };
  return {
    ...rest,
    account_name: account?.name ?? null,
    account_type: account?.account_type ?? null,
  } as Omit<T, 'account'> & { account_name: string | null; account_type: string | null };
};

const formatTransaction = (transaction: unknown) =>
  normalizePrismaValue(withAccountMetadata(transaction as Record<string, unknown>));

const formatExpenseRecord = (expense: unknown): Record<string, unknown> | null => {
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

const formatBudget = (budget: unknown) => {
  const normalized = normalizePrismaValue(budget as Record<string, unknown>) as Record<string, unknown>;
  if ('account' in normalized) {
    const account = normalized.account as Record<string, unknown> | null | undefined;
    normalized.account_name = account && 'name' in account ? (account.name as string | null) : null;
    delete normalized.account;
  }
  return normalized;
};

const formatGoal = (goal: unknown) => {
  const normalized = normalizePrismaValue(goal as Record<string, unknown>) as Record<string, unknown>;
  if ('account' in normalized) {
    const account = normalized.account as Record<string, unknown> | null | undefined;
    normalized.account_name = account && 'name' in account ? (account.name as string | null) : null;
    delete normalized.account;
  }
  return normalized;
};

// ===========================================
// EXPENSE MANAGEMENT ROUTES
// ===========================================

app.get('/api/expenses', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC, created_at DESC");
    const expenses = await stmt.bind(userId).all();
    return Response.json({ expenses: expenses.results || [] });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return errorResponse('Failed to fetch expenses', 500);
  }
});

app.post('/api/expenses', authMiddleware, zValidator('json', expenseSchema), async (c) => {
  const userId = getUserId(c);

  try {
    const { amount, description, category, date } = c.req.valid('json');
    
    const stmt = c.env.DB.prepare(`
      INSERT INTO expenses (amount, description, category, date, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(amount, description, category, date, userId).run();

    if (!result.success) {
      return errorResponse('Failed to create expense', 500);
    }

    let expenseRecord: Record<string, unknown> | null = null;

    const insertedExpenseId = result.meta?.last_row_id;

    if (insertedExpenseId !== undefined) {
      try {
        const selectStmt = c.env.DB.prepare("SELECT * FROM expenses WHERE id = ? AND user_id = ?");
        const fetchedExpense = await selectStmt.bind(insertedExpenseId, userId).first();
        if (fetchedExpense) {
          const formattedExpense = formatExpenseRecord(fetchedExpense);
          if (formattedExpense) {
            expenseRecord = formattedExpense;
          }
        }
      } catch (fetchError) {
        console.error('Error fetching created expense:', fetchError);
      }
    }

    const defaultExpenseData: Record<string, unknown> = {
      ...(insertedExpenseId !== undefined ? { id: insertedExpenseId } : { id: null }),
      amount,
      description,
      category,
      date,
      user_id: userId,
    };

    const fallbackExpense: Record<string, unknown> =
      expenseRecord ?? formatExpenseRecord(defaultExpenseData) ?? defaultExpenseData;

    return Response.json({
      expense: fallbackExpense,
      message: 'Expense created successfully',
    });
  } catch (error) {
    console.error('Error creating expense:', error);
    return errorResponse('Failed to create expense', 500);
  }
});

app.put('/api/expenses/:id', authMiddleware, zValidator('json', expenseSchema), async (c) => {
  const userId = getUserId(c);

  try {
    const id = c.req.param('id');
    const { amount, description, category, date } = c.req.valid('json');
    
    const stmt = c.env.DB.prepare(`
      UPDATE expenses 
      SET amount = ?, description = ?, category = ?, date = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(amount, description, category, date, id, userId).run();
    
    if (!result.success) {
      return errorResponse('Expense not found', 404);
    }

    return Response.json({ message: 'Expense updated successfully' });
  } catch (error) {
    console.error('Error updating expense:', error);
    return errorResponse('Failed to update expense', 500);
  }
});

app.delete('/api/expenses/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const id = c.req.param('id');
    
    const stmt = c.env.DB.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?");
    const result = await stmt.bind(id, userId).run();
    
    if (!result.success) {
      return errorResponse('Expense not found', 404);
    }

    return Response.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return errorResponse('Failed to delete expense', 500);
  }
});

// ===========================================
// USER PROFILE ROUTES
// ===========================================

app.get('/api/users/me', authMiddleware, async (c) => {
  const authState = c.get('auth') as AuthRequestState | undefined;
  const userId = authState?.toAuth()?.userId ?? null;

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const clerkClient = getClerkClient(c.env);
    const user = await clerkClient.users.getUser(userId);

    return Response.json({
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      lastName: user.lastName,
      emailAddress: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl,
    });
  } catch (error) {
    console.error('Error fetching authenticated user:', error);
    return errorResponse('Failed to load user profile', 500);
  }
});

// ===========================================
// FINANCIAL DATA ROUTES
// ===========================================

// Accounts Management
app.get('/api/accounts', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const accounts = await prisma.account.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    return Response.json({ accounts: normalizePrismaValue(accounts) });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return errorResponse('Failed to fetch accounts', 500);
  }
});

app.post('/api/accounts', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await c.req.json();
    const {
      name,
      account_type,
      account_subtype,
      institution_name,
      balance = 0,
      sync_enabled = true,
      currency_code = 'BRL',
    } = body;

    if (!name || !account_type) {
      return errorResponse('Name and account type are required', 400);
    }

    const account = await prisma.account.create({
      data: {
        user_id: userId,
        name,
        account_type,
        account_subtype,
        institution_name,
        balance,
        sync_enabled,
        currency_code,
      },
    });

    return Response.json({ account: normalizePrismaValue(account) }, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return errorResponse('Failed to create account', 500);
  }
});

app.put('/api/accounts/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const accountId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(accountId)) {
    return errorResponse('Invalid account id', 400);
  }

  try {
    const updates = await c.req.json();

    const { count } = await prisma.account.updateMany({
      where: { id: accountId, user_id: userId },
      data: {
        name: updates.name,
        account_type: updates.account_type,
        account_subtype: updates.account_subtype,
        institution_name: updates.institution_name,
        balance: typeof updates.balance === 'number' ? updates.balance : undefined,
        sync_enabled: typeof updates.sync_enabled === 'boolean' ? updates.sync_enabled : undefined,
        currency_code: updates.currency_code,
        is_active: typeof updates.is_active === 'boolean' ? updates.is_active : undefined,
      },
    });

    if (count === 0) {
      return errorResponse('Account not found', 404);
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    return Response.json({ account: normalizePrismaValue(account) });
  } catch (error) {
    console.error('Error updating account:', error);
    return errorResponse('Failed to update account', 500);
  }
});

app.delete('/api/accounts/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const accountId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(accountId)) {
    return errorResponse('Invalid account id', 400);
  }

  try {
    const { count } = await prisma.account.deleteMany({
      where: { id: accountId, user_id: userId },
    });

    if (count === 0) {
      return errorResponse('Account not found', 404);
    }

    return Response.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Error deleting account:', error);
    return errorResponse('Failed to delete account', 500);
  }
});

// Credit Cards
app.get('/api/credit-cards', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare(`
      SELECT cc.*, 
             a.name as linked_account_name,
             a.balance as linked_account_balance,
             a.credit_limit as linked_credit_limit,
             a.available_credit_limit as linked_available_credit,
             a.minimum_payment as linked_minimum_payment,
             a.balance_due_date as linked_due_date
      FROM credit_cards cc
      LEFT JOIN accounts a ON cc.linked_account_id = a.id
      WHERE cc.user_id = ? 
      ORDER BY cc.created_at DESC
    `);
    const creditCards = await stmt.bind(userId).all();
    return Response.json({ creditCards: creditCards.results || [] });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    return errorResponse('Failed to fetch credit cards', 500);
  }
});

app.post('/api/credit-cards', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const { name, credit_limit, current_balance, due_day } = await c.req.json();
    
    const stmt = c.env.DB.prepare(`
      INSERT INTO credit_cards (name, credit_limit, current_balance, due_day, user_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(name, credit_limit, current_balance || 0, due_day, userId).run();
    
    if (!result.success) {
      return errorResponse('Failed to create credit card', 500);
    }

    return Response.json({ 
      id: result.meta.last_row_id,
      message: 'Credit card created successfully' 
    });
  } catch (error) {
    console.error('Error creating credit card:', error);
    return errorResponse('Failed to create credit card', 500);
  }
});

app.put('/api/credit-cards/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const cardId = c.req.param('id');

  try {
    const { name, credit_limit, current_balance, due_day } = await c.req.json();
    
    const stmt = c.env.DB.prepare(`
      UPDATE credit_cards 
      SET name = ?, credit_limit = ?, current_balance = ?, due_day = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(name, credit_limit, current_balance || 0, due_day, cardId, userId).run();
    
    if (!result.success) {
      return errorResponse('Credit card not found', 404);
    }

    return Response.json({ message: 'Credit card updated successfully' });
  } catch (error) {
    console.error('Error updating credit card:', error);
    return errorResponse('Failed to update credit card', 500);
  }
});

app.delete('/api/credit-cards/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const cardId = c.req.param('id');

  try {
    const stmt = c.env.DB.prepare("DELETE FROM credit_cards WHERE id = ? AND user_id = ?");
    const result = await stmt.bind(cardId, userId).run();
    
    if (!result.success) {
      return errorResponse('Credit card not found', 404);
    }

    return Response.json({ message: 'Credit card deleted successfully' });
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return errorResponse('Failed to delete credit card', 500);
  }
});

app.get('/api/credit-cards/available-accounts', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare(`
      SELECT a.* FROM accounts a
      LEFT JOIN credit_cards cc ON a.id = cc.linked_account_id
      WHERE a.user_id = ? 
        AND (a.account_type = 'credit' OR a.account_subtype = 'creditCard')
        AND cc.linked_account_id IS NULL
      ORDER BY a.institution_name, a.name
    `);
    const accounts = await stmt.bind(userId).all();
    return Response.json({ accounts: accounts.results || [] });
  } catch (error) {
    console.error('Error fetching available accounts:', error);
    return errorResponse('Failed to fetch available accounts', 500);
  }
});

app.post('/api/credit-cards/:id/link', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const cardId = c.req.param('id');

  try {
    const { accountId } = await c.req.json();
    
    const stmt = c.env.DB.prepare(`
      UPDATE credit_cards 
      SET linked_account_id = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(accountId, cardId, userId).run();
    
    if (!result.success) {
      return errorResponse('Credit card not found', 404);
    }

    return Response.json({ message: 'Credit card linked successfully' });
  } catch (error) {
    console.error('Error linking credit card:', error);
    return errorResponse('Failed to link credit card', 500);
  }
});

app.post('/api/credit-cards/:id/sync', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const cardId = c.req.param('id');

  try {
    // Get credit card with linked account
    const cardStmt = c.env.DB.prepare(`
      SELECT cc.*, a.pluggy_account_id, a.balance, a.credit_limit, a.available_credit_limit
      FROM credit_cards cc
      LEFT JOIN accounts a ON cc.linked_account_id = a.id
      WHERE cc.id = ? AND cc.user_id = ?
    `);
    const card = await cardStmt.bind(cardId, userId).first() as any;
    
    if (!card) {
      return errorResponse('Credit card not found', 404);
    }

    if (!card.pluggy_account_id) {
      return errorResponse('Credit card is not linked to a Pluggy account', 400);
    }

    // Here you would normally sync with Pluggy API, but for now just return success
    return Response.json({ message: 'Credit card synced successfully' });
  } catch (error) {
    console.error('Error syncing credit card:', error);
    return errorResponse('Failed to sync credit card', 500);
  }
});

// Investments
app.get('/api/investments', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM investments WHERE user_id = ? ORDER BY created_at DESC");
    const investments = await stmt.bind(userId).all();
    return Response.json({ investments: investments.results || [] });
  } catch (error) {
    console.error('Error fetching investments:', error);
    return errorResponse('Failed to fetch investments', 500);
  }
});

// Loans
app.get('/api/loans', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM loans WHERE user_id = ? ORDER BY created_at DESC");
    const loans = await stmt.bind(userId).all();
    return Response.json({ loans: loans.results || [] });
  } catch (error) {
    console.error('Error fetching loans:', error);
    return errorResponse('Failed to fetch loans', 500);
  }
});

// Credit Card Bills
app.get('/api/credit-card-bills', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM credit_card_bills WHERE user_id = ? ORDER BY created_at DESC");
    const bills = await stmt.bind(userId).all();
    return Response.json({ bills: bills.results || [] });
  } catch (error) {
    console.error('Error fetching credit card bills:', error);
    return errorResponse('Failed to fetch credit card bills', 500);
  }
});

// Transactions

app.get('/api/transactions', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const page = Math.max(parseInt(c.req.query('page') ?? '1', 10), 1);
    const pageSize = Math.min(Math.max(parseInt(c.req.query('pageSize') ?? '20', 10), 1), 100);
    const skip = (page - 1) * pageSize;

    const where: TransactionWhere = { user_id: userId };

    const accountId = c.req.query('accountId');
    if (accountId) {
      const parsed = Number(accountId);
      if (!Number.isNaN(parsed)) {
        where.account_id = parsed;
      }
    }

    const category = c.req.query('category');
    if (category) {
      where.category = category;
    }

    const type = c.req.query('type');
    if (type && ['income', 'expense', 'transfer'].includes(type)) {
      where.transaction_type = type as TransactionType;
    }

    const description = c.req.query('description');
    if (description) {
      where.description = { contains: description, mode: 'insensitive' };
    }

    const merchantName = c.req.query('merchantName');
    if (merchantName) {
      where.merchant_name = { contains: merchantName, mode: 'insensitive' };
    }

    const amountFilter: AmountFilter = {};
    const amountGte = c.req.query('amountGte');
    if (amountGte) {
      const parsed = Number(amountGte);
      if (!Number.isNaN(parsed)) {
        amountFilter.gte = parsed;
      }
    }
    const amountLte = c.req.query('amountLte');
    if (amountLte) {
      const parsed = Number(amountLte);
      if (!Number.isNaN(parsed)) {
        amountFilter.lte = parsed;
      }
    }
    if (amountFilter.gte !== undefined || amountFilter.lte !== undefined) {
      where.amount = amountFilter;
    }

    const dateFilter: DateFilter = {};
    const from = c.req.query('from');
    if (from) {
      const parsed = new Date(from);
      if (!Number.isNaN(parsed.getTime())) {
        dateFilter.gte = parsed;
      }
    }
    const to = c.req.query('to');
    if (to) {
      const parsed = new Date(to);
      if (!Number.isNaN(parsed.getTime())) {
        dateFilter.lte = parsed;
      }
    }
    if (dateFilter.gte || dateFilter.lte) {
      where.date = dateFilter;
    }

    const [transactionRecords, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          account: {
            select: {
              name: true,
              account_type: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { created_at: 'desc' }],
        skip,
        take: pageSize,
      }) as Promise<Array<Record<string, unknown>>>,
      prisma.transaction.count({ where }) as Promise<number>,
    ]);

    const items = transactionRecords.map(transaction => formatTransaction(transaction));

    return Response.json({
      transactions: items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return errorResponse('Failed to fetch transactions', 500);
  }
});


app.get('/api/transactions/analytics', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const where: TransactionWhere = { user_id: userId };

    const accountId = c.req.query('accountId');
    if (accountId) {
      const parsed = Number(accountId);
      if (!Number.isNaN(parsed)) {
        where.account_id = parsed;
      }
    }

    const from = c.req.query('from');
    const to = c.req.query('to');
    const dateFilter: DateFilter = {};
    if (from) {
      const parsed = new Date(from);
      if (!Number.isNaN(parsed.getTime())) {
        dateFilter.gte = parsed;
      }
    }
    if (to) {
      const parsed = new Date(to);
      if (!Number.isNaN(parsed.getTime())) {
        dateFilter.lte = parsed;
      }
    }
    if (dateFilter.gte || dateFilter.lte) {
      where.date = dateFilter;
    }

    const transactions = (await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        category: true,
        merchant_name: true,
        date: true,
      },
    })) as AnalyticsTransaction[];

    const totals = transactions.reduce(
      (acc, transaction) => {
        const amount = typeof transaction.amount === 'number'
          ? transaction.amount
          : transaction.amount.toNumber();

        acc.totalAmount += amount;
        acc.totalTransactions += 1;

        const monthKey = transaction.date.toISOString().slice(0, 7);
        const categoryKey = transaction.category ?? 'Outros';
        const merchantKey = transaction.merchant_name ?? 'Outros';

        if (!acc.categoryBreakdown[categoryKey]) {
          acc.categoryBreakdown[categoryKey] = { totalAmount: 0, transactionCount: 0 };
        }
        acc.categoryBreakdown[categoryKey].totalAmount += amount;
        acc.categoryBreakdown[categoryKey].transactionCount += 1;

        if (!acc.monthlyTrends[monthKey]) {
          acc.monthlyTrends[monthKey] = { totalAmount: 0, transactionCount: 0 };
        }
        acc.monthlyTrends[monthKey].totalAmount += amount;
        acc.monthlyTrends[monthKey].transactionCount += 1;

        if (transaction.merchant_name) {
          if (!acc.topMerchants[merchantKey]) {
            acc.topMerchants[merchantKey] = { totalAmount: 0, transactionCount: 0 };
          }
          acc.topMerchants[merchantKey].totalAmount += amount;
          acc.topMerchants[merchantKey].transactionCount += 1;
        }

        return acc;
      },
      {
        totalTransactions: 0,
        totalAmount: 0,
        categoryBreakdown: {} as Record<string, AnalyticsBucket>,
        monthlyTrends: {} as Record<string, AnalyticsBucket>,
        topMerchants: {} as Record<string, AnalyticsBucket>,
      },
    );

    const averageAmount = totals.totalTransactions > 0 ? totals.totalAmount / totals.totalTransactions : 0;

    const categoryBreakdown = (Object.entries(totals.categoryBreakdown) as Array<[
      string,
      AnalyticsBucket,
    ]>).map(([categoryKey, data]) => ({
      category: categoryKey,
      totalAmount: data.totalAmount,
      transactionCount: data.transactionCount,
      percentage: totals.totalAmount > 0 ? (data.totalAmount * 100) / totals.totalAmount : 0,
    }));

    const monthlyTrends = (Object.entries(totals.monthlyTrends) as Array<[
      string,
      AnalyticsBucket,
    ]>)
      .map(([month, data]) => ({ month, totalAmount: data.totalAmount, transactionCount: data.transactionCount }))
      .sort((a, b) => (a.month < b.month ? 1 : -1))
      .slice(0, 12);

    const topMerchants = (Object.entries(totals.topMerchants) as Array<[
      string,
      AnalyticsBucket,
    ]>)
      .map(([merchant, data]) => ({ merchant_name: merchant, totalAmount: data.totalAmount, transactionCount: data.transactionCount }))
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 10);

    return Response.json({
      totalTransactions: totals.totalTransactions,
      totalAmount: totals.totalAmount,
      averageAmount,
      categoryBreakdown,
      monthlyTrends,
      topMerchants,
    });
  } catch (error) {
    console.error('Error fetching transaction analytics:', error);
    return errorResponse('Failed to fetch analytics', 500);
  }
});

app.post('/api/transactions/bulk', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const { operation, transactionIds, params: opParams } = await c.req.json();

    if (!operation || !transactionIds || !Array.isArray(transactionIds)) {
      return errorResponse('Invalid bulk operation parameters', 400);
    }

    const ids = transactionIds
      .map((id: unknown) => Number(id))
      .filter((id: number) => !Number.isNaN(id));

    if (ids.length === 0) {
      return errorResponse('No valid transactions selected', 400);
    }

    switch (operation) {
      case 'categorize': {
        if (!opParams?.category) {
          return errorResponse('Category is required for categorize operation', 400);
        }

        await prisma.transaction.updateMany({
          where: { id: { in: ids }, user_id: userId },
          data: { category: opParams.category },
        });
        break;
      }
      case 'reconcile': {
        await prisma.transaction.updateMany({
          where: { id: { in: ids }, user_id: userId },
          data: { reconciled: Boolean(opParams?.reconciled) },
        });
        break;
      }
      case 'delete': {
        await prisma.transaction.deleteMany({
          where: { id: { in: ids }, user_id: userId },
        });
        break;
      }
      default:
        return errorResponse('Invalid operation', 400);
    }

    return Response.json({ message: 'Bulk operation completed successfully' });
  } catch (error) {
    console.error('Error performing bulk operation:', error);
    return errorResponse('Failed to perform bulk operation', 500);
  }
});

app.put('/api/transactions/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const transactionId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(transactionId)) {
    return errorResponse('Invalid transaction id', 400);
  }

  try {
    const updates = await c.req.json();
    const allowedFields = ['description', 'category', 'merchant_name', 'notes', 'reconciled'] as const;

    const data: { [key: string]: unknown } = {};
    for (const field of allowedFields) {
      if (field in updates) {
        data[field] = updates[field];
      }
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const result = await prisma.transaction.updateMany({
      where: { id: transactionId, user_id: userId },
      data,
    });

    if (result.count === 0) {
      return errorResponse('Transaction not found', 404);
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        account: {
          select: {
            name: true,
            account_type: true,
          },
        },
      },
    });

    return Response.json({ transaction: transaction ? formatTransaction(transaction) : null });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return errorResponse('Failed to update transaction', 500);
  }
});

app.delete('/api/transactions/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const transactionId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(transactionId)) {
    return errorResponse('Invalid transaction id', 400);
  }

  try {
    const result = await prisma.transaction.deleteMany({
      where: { id: transactionId, user_id: userId },
    });

    if (result.count === 0) {
      return errorResponse('Transaction not found', 404);
    }

    return Response.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return errorResponse('Failed to delete transaction', 500);
  }
});

app.post('/api/transactions/:id/categorize', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const transactionId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(transactionId)) {
    return errorResponse('Invalid transaction id', 400);
  }

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, user_id: userId },
      select: {
        id: true,
        description: true,
        merchant_name: true,
      },
    });

    if (!transaction) {
      return errorResponse('Transaction not found', 404);
    }

    let autoCategory = 'Outros';
    const description = (transaction.description || '').toLowerCase();
    const merchant = (transaction.merchant_name || '').toLowerCase();

    const categoryRules = [
      { keywords: ['uber', 'taxi', 'transporte', 'metro', 'onibus'], category: 'Transporte' },
      { keywords: ['ifood', 'restaurante', 'lanchonete', 'comida', 'alimentacao'], category: 'Alimentação' },
      { keywords: ['shopping', 'loja', 'magazine', 'mercado'], category: 'Compras' },
      { keywords: ['cinema', 'teatro', 'entretenimento', 'lazer'], category: 'Entretenimento' },
      { keywords: ['farmacia', 'hospital', 'medico', 'saude'], category: 'Saúde' },
      { keywords: ['energia', 'agua', 'telefone', 'internet', 'conta'], category: 'Contas e Serviços' },
    ];

    for (const rule of categoryRules) {
      if (rule.keywords.some((keyword) => description.includes(keyword) || merchant.includes(keyword))) {
        autoCategory = rule.category;
        break;
      }
    }

    await prisma.transaction.updateMany({
      where: { id: transactionId, user_id: userId },
      data: { category: autoCategory },
    });

    return Response.json({
      message: 'Transaction categorized successfully',
      category: autoCategory,
    });
  } catch (error) {
    console.error('Error auto-categorizing transaction:', error);
    return errorResponse('Failed to categorize transaction', 500);
  }
});
// Transaction Categories
app.get('/api/transaction-categories', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM transaction_categories WHERE user_id = ? ORDER BY name ASC");
    const categories = await stmt.bind(userId).all();
    return Response.json({ categories: categories.results || [] });
  } catch (error) {
    console.error('Error fetching transaction categories:', error);
    return errorResponse('Failed to fetch categories', 500);
  }
});

app.post('/api/transaction-categories', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const { name, color, description, keywords, parent_id } = await c.req.json();
    
    if (!name?.trim()) {
      return errorResponse('Category name is required', 400);
    }

    const stmt = c.env.DB.prepare(`
      INSERT INTO transaction_categories (user_id, name, color, description, keywords, parent_id, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    const result = await stmt.bind(
      userId, 
      name.trim(), 
      color, 
      description, 
      keywords ? JSON.stringify(keywords) : null, 
      parent_id
    ).run();
    
    if (!result.success) {
      return errorResponse('Failed to create category', 500);
    }

    return Response.json({ 
      id: result.meta.last_row_id,
      message: 'Category created successfully' 
    });
  } catch (error) {
    console.error('Error creating transaction category:', error);
    return errorResponse('Failed to create category', 500);
  }
});

app.put('/api/transaction-categories/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const categoryId = c.req.param('id');

  try {
    const { name, color, description, keywords, parent_id } = await c.req.json();
    
    if (!name?.trim()) {
      return errorResponse('Category name is required', 400);
    }

    const stmt = c.env.DB.prepare(`
      UPDATE transaction_categories 
      SET name = ?, color = ?, description = ?, keywords = ?, parent_id = ?, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `);
    
    const result = await stmt.bind(
      name.trim(), 
      color, 
      description, 
      keywords ? JSON.stringify(keywords) : null, 
      parent_id,
      categoryId,
      userId
    ).run();
    
    if (!result.success) {
      return errorResponse('Category not found', 404);
    }

    return Response.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating transaction category:', error);
    return errorResponse('Failed to update category', 500);
  }
});

app.delete('/api/transaction-categories/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const categoryId = c.req.param('id');

  try {
    const stmt = c.env.DB.prepare("DELETE FROM transaction_categories WHERE id = ? AND user_id = ? AND is_default = FALSE");
    const result = await stmt.bind(categoryId, userId).run();

    if (!result.success) {
      return errorResponse('Category not found or cannot be deleted', 404);
    }

    return Response.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting transaction category:', error);
    return errorResponse('Failed to delete category', 500);
  }
});

// ===========================================
// BUDGET MANAGEMENT ROUTES
// ===========================================

app.get('/api/budgets', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const budgets = (await prisma.budget.findMany({
      where: { user_id: userId },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ period_start: 'desc' }, { created_at: 'desc' }],
    })) as Array<Record<string, unknown>>;

    return Response.json({ budgets: budgets.map(budget => formatBudget(budget)) });
  } catch (error) {
    console.error('Error fetching budgets:', error);
    return errorResponse('Failed to fetch budgets', 500);
  }
});

app.post('/api/budgets', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await c.req.json();
    const { name, category, amount, period_start, period_end } = body;

    if (!name?.trim() || !category?.trim()) {
      return errorResponse('Name and category are required', 400);
    }

    const startDate = new Date(period_start);
    const endDate = new Date(period_end);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return errorResponse('Invalid period dates', 400);
    }

    const budget = await prisma.budget.create({
      data: {
        user_id: userId,
        name: name.trim(),
        category: category.trim(),
        amount: typeof amount === 'number' ? amount : Number(amount) || 0,
        spent: typeof body.spent === 'number' ? body.spent : 0,
        period_start: startDate,
        period_end: endDate,
        status: body.status || 'active',
        notes: body.notes,
        account_id: body.account_id ? Number(body.account_id) : undefined,
      },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
    });

    return Response.json({ budget: formatBudget(budget) }, { status: 201 });
  } catch (error) {
    console.error('Error creating budget:', error);
    return errorResponse('Failed to create budget', 500);
  }
});

app.put('/api/budgets/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const budgetId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(budgetId)) {
    return errorResponse('Invalid budget id', 400);
  }

  try {
    const updates = await c.req.json();
    const data: { [key: string]: unknown } = {};

    if (typeof updates.name === 'string') {
      data.name = updates.name.trim();
    }
    if (typeof updates.category === 'string') {
      data.category = updates.category.trim();
    }
    if (updates.amount !== undefined) {
      data.amount = typeof updates.amount === 'number' ? updates.amount : Number(updates.amount) || 0;
    }
    if (updates.spent !== undefined) {
      data.spent = typeof updates.spent === 'number' ? updates.spent : Number(updates.spent) || 0;
    }
    if (typeof updates.status === 'string') {
      data.status = updates.status;
    }
    if (typeof updates.notes === 'string' || updates.notes === null) {
      data.notes = updates.notes;
    }
    if (updates.period_start) {
      const startDate = new Date(updates.period_start);
      if (Number.isNaN(startDate.getTime())) {
        return errorResponse('Invalid period_start date', 400);
      }
      data.period_start = startDate;
    }
    if (updates.period_end) {
      const endDate = new Date(updates.period_end);
      if (Number.isNaN(endDate.getTime())) {
        return errorResponse('Invalid period_end date', 400);
      }
      data.period_end = endDate;
    }
    if (updates.account_id !== undefined) {
      data.account_id = updates.account_id === null ? null : Number(updates.account_id);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const result = await prisma.budget.updateMany({
      where: { id: budgetId, user_id: userId },
      data,
    });

    if (result.count === 0) {
      return errorResponse('Budget not found', 404);
    }

    const budget = await prisma.budget.findUnique({
      where: { id: budgetId },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
    });

    return Response.json({ budget: budget ? formatBudget(budget) : null });
  } catch (error) {
    console.error('Error updating budget:', error);
    return errorResponse('Failed to update budget', 500);
  }
});

app.delete('/api/budgets/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const budgetId = Number(c.req.param('id'));

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  if (Number.isNaN(budgetId)) {
    return errorResponse('Invalid budget id', 400);
  }

  try {
    const result = await prisma.budget.deleteMany({
      where: { id: budgetId, user_id: userId },
    });

    if (result.count === 0) {
      return errorResponse('Budget not found', 404);
    }

    return Response.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Error deleting budget:', error);
    return errorResponse('Failed to delete budget', 500);
  }
});

// ===========================================
// GOAL MANAGEMENT ROUTES
// ===========================================

app.get('/api/goals', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const goals = (await prisma.goal.findMany({
      where: { user_id: userId },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ target_date: 'asc' }, { created_at: 'desc' }],
    })) as Array<Record<string, unknown>>;

    return Response.json({ goals: goals.map(goal => formatGoal(goal)) });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return errorResponse('Failed to fetch goals', 500);
  }
});

app.post('/api/goals', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const body = await c.req.json();
    const { title, target_amount, target_date } = body;

    if (!title?.trim()) {
      return errorResponse('Title is required', 400);
    }

    const targetDate = new Date(target_date);
    if (Number.isNaN(targetDate.getTime())) {
      return errorResponse('Invalid target date', 400);
    }

    const goal = await prisma.goal.create({
      data: {
        user_id: userId,
        title: title.trim(),
        description: body.description,
        target_amount: typeof target_amount === 'number' ? target_amount : Number(target_amount) || 0,
        current_amount: typeof body.current_amount === 'number' ? body.current_amount : 0,
        target_date: targetDate,
        category: body.category || 'savings',
        status: body.status || 'active',
        priority: body.priority || 'medium',
        account_id: body.account_id ? Number(body.account_id) : undefined,
      },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
    });

    return Response.json({ goal: formatGoal(goal) }, { status: 201 });
  } catch (error) {
    console.error('Error creating goal:', error);
    return errorResponse('Failed to create goal', 500);
  }
});

app.put('/api/goals/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const goalId = c.req.param('id');

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const updates = await c.req.json();
    const data: { [key: string]: unknown } = {};

    if (typeof updates.title === 'string') {
      data.title = updates.title.trim();
    }
    if (typeof updates.description === 'string' || updates.description === null) {
      data.description = updates.description;
    }
    if (updates.target_amount !== undefined) {
      data.target_amount = typeof updates.target_amount === 'number' ? updates.target_amount : Number(updates.target_amount) || 0;
    }
    if (updates.current_amount !== undefined) {
      data.current_amount = typeof updates.current_amount === 'number' ? updates.current_amount : Number(updates.current_amount) || 0;
    }
    if (updates.target_date) {
      const targetDate = new Date(updates.target_date);
      if (Number.isNaN(targetDate.getTime())) {
        return errorResponse('Invalid target date', 400);
      }
      data.target_date = targetDate;
    }
    if (typeof updates.category === 'string') {
      data.category = updates.category;
    }
    if (typeof updates.status === 'string') {
      data.status = updates.status;
    }
    if (typeof updates.priority === 'string') {
      data.priority = updates.priority;
    }
    if (updates.account_id !== undefined) {
      data.account_id = updates.account_id === null ? null : Number(updates.account_id);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const result = await prisma.goal.updateMany({
      where: { id: goalId, user_id: userId },
      data,
    });

    if (result.count === 0) {
      return errorResponse('Goal not found', 404);
    }

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: {
            name: true,
          },
        },
      },
    });

    return Response.json({ goal: goal ? formatGoal(goal) : null });
  } catch (error) {
    console.error('Error updating goal:', error);
    return errorResponse('Failed to update goal', 500);
  }
});

app.delete('/api/goals/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const goalId = c.req.param('id');

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const result = await prisma.goal.deleteMany({
      where: { id: goalId, user_id: userId },
    });

    if (result.count === 0) {
      return errorResponse('Goal not found', 404);
    }

    return Response.json({ message: 'Goal deleted successfully' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    return errorResponse('Failed to delete goal', 500);
  }
});

// ===========================================
// HEALTH CHECK
// ===========================================

// ===========================================
// PLUGGY INTEGRATION ROUTES
// ===========================================

app.get('/api/pluggy/connections', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM pluggy_connections WHERE user_id = ? ORDER BY created_at DESC");
    const connections = await stmt.bind(userId).all();
    return Response.json({ connections: connections.results || [] });
  } catch (error) {
    console.error('Error fetching pluggy connections:', error);
    return errorResponse('Failed to fetch connections', 500);
  }
});

app.get('/api/pluggy/config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_id'");
    const clientIdResult = await stmt.bind(userId).first() as any;
    
    const stmt2 = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_secret'");
    const clientSecretResult = await stmt2.bind(userId).first() as any;
    
    return Response.json({
      clientId: (clientIdResult?.config_value as string) || '',
      clientSecret: (clientSecretResult?.config_value as string) || ''
    });
  } catch (error) {
    console.error('Error loading pluggy config:', error);
    return errorResponse('Failed to load config', 500);
  }
});

app.post('/api/pluggy/config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const { clientId, clientSecret } = await c.req.json();
    
    if (!clientId?.trim() || !clientSecret?.trim()) {
      return errorResponse('Client ID and Client Secret are required', 400);
    }

    // Upsert client ID
    await c.env.DB.prepare(`
      INSERT INTO user_configs (user_id, config_key, config_value, created_at, updated_at)
      VALUES (?, 'pluggy_client_id', ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, config_key) DO UPDATE SET
        config_value = excluded.config_value,
        updated_at = excluded.updated_at
    `).bind(userId, clientId.trim()).run();

    // Upsert client secret
    await c.env.DB.prepare(`
      INSERT INTO user_configs (user_id, config_key, config_value, created_at, updated_at)
      VALUES (?, 'pluggy_client_secret', ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, config_key) DO UPDATE SET
        config_value = excluded.config_value,
        updated_at = excluded.updated_at
    `).bind(userId, clientSecret.trim()).run();

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error saving pluggy config:', error);
    return errorResponse('Failed to save config', 500);
  }
});

app.post('/api/pluggy/test-connection', authMiddleware, async (c) => {
  try {
    const { clientId, clientSecret } = await c.req.json();
    
    if (!clientId?.trim() || !clientSecret?.trim()) {
      return errorResponse('Client ID and Client Secret are required', 400);
    }

    const client = new PluggyClient(clientId.trim(), clientSecret.trim());
    
    // Test the connection by trying to authenticate
    await client.healthCheck();
    
    return Response.json({ 
      success: true, 
      message: 'Connection with Pluggy API successful' 
    });
  } catch (error) {
    console.error('Error testing pluggy connection:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Connection test failed' 
    }, { status: 400 });
  }
});

app.post('/api/pluggy/add-connection', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const { itemId } = await c.req.json();
    
    if (!itemId?.trim()) {
      return errorResponse('Item ID is required', 400);
    }

    // Get user's Pluggy config
    const clientIdStmt = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_id'");
    const clientIdResult = await clientIdStmt.bind(userId).first() as any;
    
    const clientSecretStmt = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_secret'");
    const clientSecretResult = await clientSecretStmt.bind(userId).first() as any;
    
    if (!clientIdResult?.config_value || !clientSecretResult?.config_value) {
      return errorResponse('Pluggy credentials not configured', 400);
    }

    const client = new PluggyClient(clientIdResult.config_value as string, clientSecretResult.config_value as string);
    
    // Get item details from Pluggy
    const item = await client.getItem(itemId.trim());
    
    // Check if connection already exists
    const existingStmt = c.env.DB.prepare("SELECT id FROM pluggy_connections WHERE user_id = ? AND pluggy_item_id = ?");
    const existing = await existingStmt.bind(userId, itemId.trim()).first();
    
    if (existing) {
      return errorResponse('Connection already exists', 400);
    }
    
    // Add connection to database
    const insertStmt = c.env.DB.prepare(`
      INSERT INTO pluggy_connections (user_id, pluggy_item_id, institution_name, connection_status, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    await insertStmt.bind(
      userId, 
      itemId.trim(), 
      item.connector.name || 'Unknown Institution', 
      item.status || 'CONNECTED'
    ).run();

    return Response.json({ 
      success: true, 
      message: 'Connection added successfully' 
    });
  } catch (error) {
    console.error('Error adding pluggy connection:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Failed to add connection' 
    }, { status: 400 });
  }
});

app.delete('/api/pluggy/connections/:id', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const connectionId = c.req.param('id');

  try {
    const stmt = c.env.DB.prepare("DELETE FROM pluggy_connections WHERE id = ? AND user_id = ?");
    const result = await stmt.bind(connectionId, userId).run();
    
    if (!result.success) {
      return errorResponse('Connection not found', 404);
    }

    return Response.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Error removing pluggy connection:', error);
    return errorResponse('Failed to remove connection', 500);
  }
});

app.post('/api/pluggy/sync/:itemId?', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const itemId = c.req.param('itemId');

  // Create a unique sync ID for logging
  const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${syncId}] Starting sync for user ${userId}, itemId: ${itemId || 'all'}`);

    // Get user's Pluggy config
    const clientIdStmt = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_id'");
    const clientIdResult = await clientIdStmt.bind(userId).first() as any;
    
    const clientSecretStmt = c.env.DB.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = 'pluggy_client_secret'");
    const clientSecretResult = await clientSecretStmt.bind(userId).first() as any;
    
    if (!clientIdResult?.config_value || !clientSecretResult?.config_value) {
      console.log(`[${syncId}] Pluggy credentials not configured`);
      return Response.json({ 
        success: false,
        error: 'Pluggy credentials not configured',
        newTransactions: 0,
        message: 'Pluggy credentials not configured'
      }, { status: 400 });
    }

    // Create Pluggy client
    console.log(`[${syncId}] Creating Pluggy client`);
    const client = new PluggyClient(clientIdResult.config_value as string, clientSecretResult.config_value as string);
    
    let connectionsToSync;
    
    if (itemId) {
      // Sync specific connection
      console.log(`[${syncId}] Fetching specific connection for itemId: ${itemId}`);
      const stmt = c.env.DB.prepare("SELECT * FROM pluggy_connections WHERE user_id = ? AND pluggy_item_id = ?");
      const connection = await stmt.bind(userId, itemId).first() as any;
      
      if (!connection) {
        console.log(`[${syncId}] Connection not found for itemId: ${itemId}`);
        return Response.json({ 
          success: false,
          error: 'Connection not found',
          newTransactions: 0,
          message: 'Connection not found'
        }, { status: 404 });
      }
      
      connectionsToSync = [connection];
    } else {
      // Sync all connections
      console.log(`[${syncId}] Fetching all connections for user`);
      const stmt = c.env.DB.prepare("SELECT * FROM pluggy_connections WHERE user_id = ?");
      const result = await stmt.bind(userId).all();
      connectionsToSync = (result.results as any[]) || [];
    }

    console.log(`[${syncId}] Found ${connectionsToSync.length} connections to sync`);

    let totalNewTransactions = 0;
    let errors: string[] = [];
    
    for (const connection of connectionsToSync) {
      try {
        console.log(`[${syncId}] Processing connection ${connection.id} (${connection.institution_name})`);
        
        // Get transactions from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const transactions = await client.getAllItemTransactions(
          connection.pluggy_item_id as string, 
          thirtyDaysAgo.toISOString().split('T')[0]
        );
        
        console.log(`[${syncId}] Found ${transactions.length} transactions for connection ${connection.id}`);
        
        // Import transactions as expenses (simplified for now)
        for (const transaction of transactions) {
          try {
            if (transaction.amount < 0) { // Only import expenses
              const category = mapPluggyCategory(transaction);
              
              // Check if transaction already exists
              const existingStmt = c.env.DB.prepare("SELECT id FROM expenses WHERE user_id = ? AND pluggy_transaction_id = ?");
              const existing = await existingStmt.bind(userId, transaction.id).first();
              
              if (!existing) {
                // Add new transaction
                const insertStmt = c.env.DB.prepare(`
                  INSERT INTO expenses (
                    amount, description, category, date, user_id, 
                    pluggy_transaction_id, is_synced_from_bank, 
                    created_at, updated_at
                  )
                  VALUES (?, ?, ?, ?, ?, ?, true, datetime('now'), datetime('now'))
                `);
                
                const result = await insertStmt.bind(
                  Math.abs(transaction.amount),
                  transaction.description || 'Transação',
                  category,
                  transaction.date.split('T')[0],
                  userId,
                  transaction.id
                ).run();
                
                if (result.success) {
                  totalNewTransactions++;
                }
              }
            }
          } catch (transactionError) {
            const errorMsg = transactionError instanceof Error ? transactionError.message : String(transactionError);
            console.error(`[${syncId}] Error processing transaction ${transaction.id}:`, errorMsg);
            errors.push(`Transaction ${transaction.id}: ${errorMsg}`);
          }
        }
        
        // Update last sync time
        const updateStmt = c.env.DB.prepare(`
          UPDATE pluggy_connections 
          SET last_sync_at = datetime('now'), updated_at = datetime('now')
          WHERE id = ?
        `);
        await updateStmt.bind(connection.id as number).run();
        
      } catch (connectionError) {
        const errorMsg = connectionError instanceof Error ? connectionError.message : String(connectionError);
        console.error(`[${syncId}] Error syncing connection ${connection.id}:`, errorMsg);
        errors.push(`Connection ${connection.id}: ${errorMsg}`);
      }
    }

    const finalResult = { 
      success: true, 
      newTransactions: totalNewTransactions,
      errors: errors,
      message: errors.length > 0 
        ? `Sync completed with ${errors.length} errors. ${totalNewTransactions} new transactions imported.`
        : `Sync completed successfully. ${totalNewTransactions} new transactions imported.`
    };

    console.log(`[${syncId}] Sync completed. New transactions: ${totalNewTransactions}, Errors: ${errors.length}`);
    
    // Ensure we return valid JSON with proper headers
    return new Response(JSON.stringify(finalResult), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${syncId}] Critical error during sync:`, errorMessage);
    
    const errorResult = { 
      success: false,
      error: errorMessage,
      newTransactions: 0,
      message: 'Sync failed due to unexpected error'
    };
    
    return new Response(JSON.stringify(errorResult), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });
  }
});

// Webhook configuration routes
app.get('/api/pluggy/webhook-config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM webhook_configs WHERE user_id = ?");
    const config = await stmt.bind(userId).first() as any;
    
    if (!config) {
      return Response.json({
        webhookUrl: '',
        events: [],
        isActive: true
      });
    }
    
    return Response.json({
      webhookUrl: config.webhook_url as string,
      events: config.events ? JSON.parse(config.events as string) : [],
      isActive: config.is_active as boolean
    });
  } catch (error) {
    console.error('Error loading webhook config:', error);
    return errorResponse('Failed to load webhook config', 500);
  }
});

app.post('/api/pluggy/webhook-config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const { webhookUrl, events, isActive } = await c.req.json();
    
    if (!webhookUrl?.trim()) {
      return errorResponse('Webhook URL is required', 400);
    }

    // Upsert webhook config
    const stmt = c.env.DB.prepare(`
      INSERT INTO webhook_configs (user_id, webhook_url, events, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        webhook_url = excluded.webhook_url,
        events = excluded.events,
        is_active = excluded.is_active,
        updated_at = excluded.updated_at
    `);
    
    await stmt.bind(
      userId, 
      webhookUrl.trim(), 
      JSON.stringify(events || []), 
      isActive !== false
    ).run();

    return Response.json({ 
      success: true,
      message: 'Webhook configuration saved successfully'
    });
  } catch (error) {
    console.error('Error saving webhook config:', error);
    return errorResponse('Failed to save webhook config', 500);
  }
});

app.post('/api/pluggy/test-webhook', authMiddleware, async (c) => {
  const userId = getUserId(c);

  try {
    const stmt = c.env.DB.prepare("SELECT * FROM webhook_configs WHERE user_id = ?");
    const config = await stmt.bind(userId).first() as any;
    
    if (!config || !config.webhook_url) {
      return errorResponse('Webhook not configured', 400);
    }

    // Test webhook by sending a ping
    const testPayload = {
      event: 'test',
      timestamp: new Date().toISOString(),
      userId: userId
    };

    const response = await fetch(config.webhook_url as string, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FinanceitoApp-Webhook/1.0'
      },
      body: JSON.stringify(testPayload)
    });

    // Log the webhook attempt
    const logStmt = c.env.DB.prepare(`
      INSERT INTO webhook_logs (webhook_id, success, error_message, attempt_at)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    const webhookId = `test-${Date.now()}`;
    const success = response.ok;
    const errorMessage = success ? null : `HTTP ${response.status}: ${await response.text()}`;
    
    await logStmt.bind(webhookId, success, errorMessage).run();

    if (success) {
      return Response.json({ 
        success: true,
        status: response.status,
        message: 'Webhook test successful'
      });
    } else {
      return Response.json({ 
        success: false,
        error: errorMessage,
        details: `Failed to reach webhook endpoint`
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error testing webhook:', error);
    
    // Log the failed attempt
    const logStmt = c.env.DB.prepare(`
      INSERT INTO webhook_logs (webhook_id, success, error_message, attempt_at)
      VALUES (?, false, ?, datetime('now'))
    `);
    
    await logStmt.bind(`test-${Date.now()}`, error instanceof Error ? error.message : String(error)).run();
    
    return Response.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Webhook test failed' 
    }, { status: 400 });
  }
});

app.get('/api/pluggy/webhook-logs', authMiddleware, async (c) => {
  try {
    // For now, we return all logs, but in future we could filter by user
    const limit = parseInt(c.req.query('limit') || '20');
    const stmt = c.env.DB.prepare("SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT ?");
    const result = await stmt.bind(limit).all();
    
    return Response.json({ logs: result.results || [] });
  } catch (error) {
    console.error('Error loading webhook logs:', error);
    return errorResponse('Failed to load webhook logs', 500);
  }
});

// ===========================================
// HEALTH CHECK
// ===========================================

app.get('/api/health', async (c) => {
  try {
    // Test database connection
    const result = await c.env.DB.prepare("SELECT 1").first();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: result ? 'connected' : 'disconnected'
    });
  } catch (error) {
    return Response.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// Export the worker
export default {
  fetch: app.fetch,
};
