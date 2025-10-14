import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { PluggyClient, mapPluggyCategory } from './pluggy-improved';
import { ensureDatabaseSchema } from './database';
import type { AuthRequestState, AuthVariables, D1RunResult, Env } from './types';
import { authMiddleware, getClerkClient, getUserId } from './utils/auth';
import { errorResponse, preflightResponse } from './utils/response';
import {
  fetchAllTransactionsForAccount,
  flattenObject,
  formatDateOnly,
  getPayeeName,
  getPluggyClientForUser,
  getPluggyCredentials,
  getUserPluggyConnections,
  updatePluggyConnectionMetadata,
} from './utils/pluggy';
import {
  formatAccount,
  formatBudget,
  formatExpenseRecord,
  formatGoal,
  formatTransaction,
  parseDate,
  resolveNumber,
  toBoolean,
} from './utils/formatters';
import { getUserConfigValue, upsertUserConfigValue } from './utils/user-configs';

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

const app = new Hono<{ Bindings: Env; Variables: AuthVariables }>();

// Enhanced CORS configuration
app.use('*', cors({
  origin: [
    'https://0199711a-c4e4-7884-86f1-522b7cf5b5f9.n5jcegoubmvau.workers.dev',
    'http://localhost:5173',
    'https://fincontas.ramonma.online',
  ],
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

app.use('*', async (c, next) => {
  try {
    await ensureDatabaseSchema(c.env.DB);
  } catch (error) {
    console.error('Failed to ensure database schema:', error);
    return errorResponse('Database not ready', 500);
  }

  await next();
});

const pluggyTransactionsRequestSchema = z.object({
  accountId: z.string().min(1),
  startDate: z.string().optional()
});

app.options('/api/pluggy/status', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

app.post('/api/pluggy/status', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const [credentials, connections] = await Promise.all([
      getPluggyCredentials(c.env.DB, c.env, userId),
      getUserPluggyConnections(c.env.DB, userId)
    ]);

    const configured = Boolean(credentials && connections.length > 0);

    return Response.json({
      status: 'ok',
      data: {
        configured,
        hasCredentials: Boolean(credentials),
        connectionCount: connections.length
      }
    });
  } catch (error) {
    console.error('Error computing Pluggy status:', error);
    return Response.json({
      status: 'ok',
      data: {
        configured: false,
        hasCredentials: false,
        connectionCount: 0,
        error: error instanceof Error ? error.message : 'Failed to compute Pluggy status'
      }
    });
  }
});

app.options('/api/pluggy/accounts', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

app.post('/api/pluggy/accounts', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const client = await getPluggyClientForUser(c.env.DB, c.env, userId);

    if (!client) {
      return Response.json({
        status: 'ok',
        data: {
          accounts: [],
          error: 'Pluggy credentials not configured'
        }
      });
    }

    const connections = await getUserPluggyConnections(c.env.DB, userId);

    if (connections.length === 0) {
      return Response.json({
        status: 'ok',
        data: {
          accounts: [],
          error: 'Nenhuma conexão Pluggy cadastrada'
        }
      });
    }

    const accounts: any[] = [];

    for (const connection of connections) {
      try {
        const pluggyAccounts = await client.getAccounts(connection.pluggy_item_id);
        accounts.push(...pluggyAccounts);

        const orgInfo = pluggyAccounts.find(account => account.org)?.org ?? null;
        await updatePluggyConnectionMetadata(c.env.DB, connection.id, {
          orgId: orgInfo?.id ?? null,
          orgName: orgInfo?.name ?? null,
          orgDomain: orgInfo?.domain ?? null
        });
      } catch (accountError) {
        console.error(`Error fetching accounts for connection ${connection.id}:`, accountError);
      }
    }

    return Response.json({
      status: 'ok',
      data: {
        accounts
      }
    });
  } catch (error) {
    console.error('Error fetching Pluggy accounts:', error);
    return Response.json({
      status: 'ok',
      data: {
        accounts: [],
        error: error instanceof Error ? error.message : 'Erro ao buscar contas do Pluggy'
      }
    });
  }
});

app.options('/api/pluggy/transactions', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

app.post('/api/pluggy/transactions', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const payload = pluggyTransactionsRequestSchema.parse(await c.req.json());
    const client = await getPluggyClientForUser(c.env.DB, c.env, userId);

    if (!client) {
      return Response.json({
        status: 'ok',
        data: {
          error: 'Pluggy credentials not configured'
        }
      });
    }

    const account = await client.getAccount(payload.accountId);
    const sandboxAccount = account.owner === 'John Doe';

    const startDate = payload.startDate ? new Date(payload.startDate) : undefined;
    const formattedStartDate = sandboxAccount
      ? '2000-01-01'
      : startDate
        ? formatDateOnly(startDate)
        : undefined;

    const transactions = await fetchAllTransactionsForAccount(
      client,
      payload.accountId,
      formattedStartDate
    );

    let startingBalance = Math.round((account.balance || 0) * 100);
    if (account.type?.toUpperCase() === 'CREDIT') {
      startingBalance = -startingBalance;
    }

    const balances = [
      {
        balanceAmount: {
          amount: startingBalance,
          currency: account.currencyCode
        },
        balanceType: 'expected',
        referenceDate: account.updatedAt ? formatDateOnly(new Date(account.updatedAt)) : formatDateOnly(new Date())
      }
    ];

    const booked: any[] = [];
    const pending: any[] = [];
    const all: any[] = [];

    for (const rawTransaction of transactions) {
      const transaction = { ...rawTransaction } as Record<string, any>;

      const isBooked = transaction.status !== 'PENDING';
      const transactionDate = new Date(transaction.date);

      if (startDate && transactionDate < startDate && !transaction.sandbox) {
        continue;
      }

      if (account.type?.toUpperCase() === 'CREDIT') {
        if (typeof transaction.amountInAccountCurrency === 'number') {
          transaction.amountInAccountCurrency *= -1;
        }
        if (typeof transaction.amount === 'number') {
          transaction.amount *= -1;
        }
      }

      const amountInCurrency = Math.round(
        ((transaction.amountInAccountCurrency ?? transaction.amount) || 0) * 100
      ) / 100;

      const baseTransaction = {
        booked: isBooked,
        date: formatDateOnly(transactionDate),
        payeeName: getPayeeName(transaction),
        notes: transaction.descriptionRaw || transaction.description,
        transactionAmount: {
          amount: amountInCurrency,
          currency: transaction.currencyCode || account.currencyCode
        },
        transactionId: transaction.id,
        sortOrder: transactionDate.getTime()
      };

      delete transaction.amount;

      const flattened = {
        ...flattenObject(transaction),
        ...baseTransaction
      };

      if (isBooked) {
        booked.push(flattened);
      } else {
        pending.push(flattened);
      }

      all.push(flattened);
    }

    const sortByDateDesc = (a: any, b: any) => b.sortOrder - a.sortOrder;

    return Response.json({
      status: 'ok',
      data: {
        balances,
        startingBalance,
        transactions: {
          all: all.sort(sortByDateDesc),
          booked: booked.sort(sortByDateDesc),
          pending: pending.sort(sortByDateDesc)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching Pluggy transactions:', error);
    const message = error instanceof Error ? error.message : 'Erro ao buscar transações do Pluggy';

    return Response.json({
      status: 'ok',
      data: {
        error: message
      }
    });
  }
});

const buildTransactionFilters = (where: TransactionWhere) => {
  const clauses: string[] = ['t.user_id = ?'];
  const params: unknown[] = [where.user_id];

  if (where.account_id !== undefined) {
    clauses.push('t.account_id = ?');
    params.push(where.account_id);
  }

  if (where.category) {
    clauses.push('t.category = ?');
    params.push(where.category);
  }

  if (where.transaction_type) {
    clauses.push('t.transaction_type = ?');
    params.push(where.transaction_type);
  }

  if (where.description?.contains) {
    clauses.push('LOWER(t.description) LIKE ?');
    params.push(`%${where.description.contains.toLowerCase()}%`);
  }

  if (where.merchant_name?.contains) {
    clauses.push('LOWER(t.merchant_name) LIKE ?');
    params.push(`%${where.merchant_name.contains.toLowerCase()}%`);
  }

  if (where.amount?.gte !== undefined) {
    clauses.push('t.amount >= ?');
    params.push(where.amount.gte);
  }

  if (where.amount?.lte !== undefined) {
    clauses.push('t.amount <= ?');
    params.push(where.amount.lte);
  }

  if (where.date?.gte) {
    clauses.push('t.date >= ?');
    params.push(where.date.gte.toISOString());
  }

  if (where.date?.lte) {
    clauses.push('t.date <= ?');
    params.push(where.date.lte.toISOString());
  }

  return { clauses, params };
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
    const stmt = c.env.DB.prepare(`
      SELECT *
      FROM accounts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `);
    const accountsResult = await stmt.bind(userId).all();
    const accounts = (accountsResult.results || []).map((record) =>
      formatAccount(record as Record<string, unknown>)
    );

    return Response.json({ accounts });
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

    const balanceValue = Number(balance);
    if (Number.isNaN(balanceValue)) {
      return errorResponse('Invalid balance value', 400);
    }

    const insertStmt = c.env.DB.prepare(`
      INSERT INTO accounts (
        user_id,
        name,
        account_type,
        account_subtype,
        institution_name,
        balance,
        sync_enabled,
        currency_code,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = (await insertStmt
      .bind(
        userId,
        name,
        account_type,
        account_subtype ?? null,
        institution_name ?? null,
        balanceValue,
        sync_enabled ? 1 : 0,
        currency_code,
      )
      .run()) as D1RunResult;

    if (!result.success) {
      return errorResponse('Failed to create account', 500);
    }

    const accountId = result.meta?.last_row_id;
    if (accountId === undefined) {
      return errorResponse('Failed to resolve created account', 500);
    }

    const fetchStmt = c.env.DB.prepare(`
      SELECT *
      FROM accounts
      WHERE id = ? AND user_id = ?
    `);
    const account = await fetchStmt.bind(accountId, userId).first<Record<string, unknown>>();

    return Response.json(
      { account: account ? formatAccount(account) : null },
      { status: 201 },
    );
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

    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof updates.name === 'string') {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (typeof updates.account_type === 'string') {
      fields.push('account_type = ?');
      values.push(updates.account_type);
    }

    if (updates.account_subtype !== undefined) {
      fields.push('account_subtype = ?');
      values.push(updates.account_subtype ?? null);
    }

    if (updates.institution_name !== undefined) {
      fields.push('institution_name = ?');
      values.push(updates.institution_name ?? null);
    }

    if (updates.balance !== undefined) {
      const balanceValue = Number(updates.balance);
      if (Number.isNaN(balanceValue)) {
        return errorResponse('Invalid balance value', 400);
      }
      fields.push('balance = ?');
      values.push(balanceValue);
    }

    if (typeof updates.sync_enabled === 'boolean') {
      fields.push('sync_enabled = ?');
      values.push(updates.sync_enabled ? 1 : 0);
    }

    if (typeof updates.currency_code === 'string') {
      fields.push('currency_code = ?');
      values.push(updates.currency_code);
    }

    if (typeof updates.is_active === 'boolean') {
      fields.push('is_active = ?');
      values.push(updates.is_active ? 1 : 0);
    }

    if (fields.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const setClause = `${fields.join(', ')}, updated_at = datetime('now')`;
    const updateStmt = c.env.DB.prepare(
      `UPDATE accounts SET ${setClause} WHERE id = ? AND user_id = ?`,
    );
    const result = (await updateStmt
      .bind(...values, accountId, userId)
      .run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
      return errorResponse('Account not found', 404);
    }

    const fetchStmt = c.env.DB.prepare(
      'SELECT * FROM accounts WHERE id = ? AND user_id = ?',
    );
    const account = await fetchStmt.bind(accountId, userId).first<Record<string, unknown>>();

    return Response.json({ account: account ? formatAccount(account) : null });
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
    const deleteStmt = c.env.DB.prepare(
      'DELETE FROM accounts WHERE id = ? AND user_id = ?',
    );
    const result = (await deleteStmt.bind(accountId, userId).run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
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

    const { clauses, params } = buildTransactionFilters(where);
    const whereClause = clauses.join(' AND ');

    const listStmt = c.env.DB.prepare(
      `SELECT t.*, a.name AS account_name, a.account_type AS account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE ${whereClause}
       ORDER BY t.date DESC, t.created_at DESC
       LIMIT ? OFFSET ?`,
    );

    const transactionsResult = await listStmt
      .bind(...params, pageSize, skip)
      .all<Record<string, unknown>>();

    const items = (transactionsResult.results || [])
      .map((transaction) => formatTransaction(transaction as Record<string, unknown>))
      .filter((transaction): transaction is Record<string, unknown> => Boolean(transaction));

    const countStmt = c.env.DB.prepare(
      `SELECT COUNT(*) AS count FROM transactions t WHERE ${whereClause}`,
    );
    const countResult = await countStmt.bind(...params).first<{ count: unknown }>();
    const total = resolveNumber(countResult?.count ?? 0);

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

    const { clauses, params } = buildTransactionFilters(where);
    const whereClause = clauses.join(' AND ');

    const analyticsStmt = c.env.DB.prepare(
      `SELECT t.amount, t.category, t.merchant_name, t.date
       FROM transactions t
       WHERE ${whereClause}`,
    );
    const analyticsResult = await analyticsStmt
      .bind(...params)
      .all<Record<string, unknown>>();

    const transactions = (analyticsResult.results || [])
      .map((row): AnalyticsTransaction | null => {
        const record = row as Record<string, unknown>;
        const parsedDate = parseDate(record.date);
        if (!parsedDate) {
          return null;
        }

        return {
          amount: resolveNumber(record.amount ?? 0),
          category: record.category as string | null,
          merchant_name: record.merchant_name as string | null,
          date: parsedDate,
        };
      })
      .filter((entry): entry is AnalyticsTransaction => entry !== null);

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

    const placeholders = ids.map(() => '?').join(', ');
    if (!placeholders) {
      return errorResponse('No valid transactions selected', 400);
    }

    switch (operation) {
      case 'categorize': {
        if (!opParams?.category) {
          return errorResponse('Category is required for categorize operation', 400);
        }

        const categorizeStmt = c.env.DB.prepare(
          `UPDATE transactions
           SET category = ?, updated_at = datetime('now')
           WHERE user_id = ? AND id IN (${placeholders})`,
        );
        await categorizeStmt.bind(opParams.category, userId, ...ids).run();
        break;
      }
      case 'reconcile': {
        const reconcileStmt = c.env.DB.prepare(
          `UPDATE transactions
           SET reconciled = ?, updated_at = datetime('now')
           WHERE user_id = ? AND id IN (${placeholders})`,
        );
        await reconcileStmt
          .bind(opParams?.reconciled ? 1 : 0, userId, ...ids)
          .run();
        break;
      }
      case 'delete': {
        const deleteStmt = c.env.DB.prepare(
          `DELETE FROM transactions
           WHERE user_id = ? AND id IN (${placeholders})`,
        );
        await deleteStmt.bind(userId, ...ids).run();
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

    const fields = Object.keys(data);

    const assignments: string[] = [];
    const values: unknown[] = [];

    for (const field of fields) {
      assignments.push(`${field} = ?`);
      if (field === 'reconciled') {
        values.push(toBoolean(data[field]) ? 1 : 0);
      } else {
        values.push(data[field]);
      }
    }

    const updateStmt = c.env.DB.prepare(
      `UPDATE transactions
       SET ${assignments.join(', ')}, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
    );

    const result = (await updateStmt
      .bind(...values, transactionId, userId)
      .run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
      return errorResponse('Transaction not found', 404);
    }

    const fetchStmt = c.env.DB.prepare(
      `SELECT t.*, a.name AS account_name, a.account_type AS account_type
       FROM transactions t
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND t.user_id = ?
       LIMIT 1`,
    );

    const transaction = await fetchStmt
      .bind(transactionId, userId)
      .first<Record<string, unknown>>();

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
    const deleteStmt = c.env.DB.prepare(
      'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    );
    const result = (await deleteStmt.bind(transactionId, userId).run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
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
    const fetchStmt = c.env.DB.prepare(
      `SELECT id, description, merchant_name
       FROM transactions
       WHERE id = ? AND user_id = ?
       LIMIT 1`,
    );
    const transaction = await fetchStmt
      .bind(transactionId, userId)
      .first<Record<string, unknown>>();

    if (!transaction) {
      return errorResponse('Transaction not found', 404);
    }

    let autoCategory = 'Outros';
    const descriptionSource =
      typeof transaction.description === 'string' ? transaction.description : '';
    const merchantSource =
      typeof transaction.merchant_name === 'string' ? transaction.merchant_name : '';
    const description = descriptionSource.toLowerCase();
    const merchant = merchantSource.toLowerCase();

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

    const updateStmt = c.env.DB.prepare(
      `UPDATE transactions
       SET category = ?, updated_at = datetime('now')
       WHERE id = ? AND user_id = ?`,
    );
    await updateStmt.bind(autoCategory, transactionId, userId).run();

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
    const stmt = c.env.DB.prepare(`
      SELECT b.*, a.name AS account_name
      FROM budgets b
      LEFT JOIN accounts a ON b.account_id = a.id
      WHERE b.user_id = ?
      ORDER BY b.period_start DESC, b.created_at DESC
    `);
    const result = await stmt.bind(userId).all<Record<string, unknown>>();
    const budgets = (result.results || []).map((row) => formatBudget(row));

    return Response.json({ budgets });
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

    const amountValue = Number(amount);
    if (Number.isNaN(amountValue)) {
      return errorResponse('Invalid amount value', 400);
    }

    const spentValue = body.spent !== undefined ? Number(body.spent) : 0;
    if (Number.isNaN(spentValue)) {
      return errorResponse('Invalid spent value', 400);
    }

    const accountIdValue =
      body.account_id === null || body.account_id === undefined
        ? null
        : Number(body.account_id);
    if (accountIdValue !== null && Number.isNaN(accountIdValue)) {
      return errorResponse('Invalid account reference', 400);
    }

    const insertStmt = c.env.DB.prepare(`
      INSERT INTO budgets (
        user_id,
        name,
        category,
        amount,
        spent,
        period_start,
        period_end,
        status,
        notes,
        account_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = (await insertStmt
      .bind(
        userId,
        name.trim(),
        category.trim(),
        amountValue,
        spentValue,
        startDate.toISOString(),
        endDate.toISOString(),
        body.status || 'active',
        body.notes ?? null,
        accountIdValue,
      )
      .run()) as D1RunResult;

    if (!result.success) {
      return errorResponse('Failed to create budget', 500);
    }

    const budgetId = result.meta?.last_row_id;
    if (budgetId === undefined) {
      return errorResponse('Failed to resolve created budget', 500);
    }

    const fetchStmt = c.env.DB.prepare(`
      SELECT b.*, a.name AS account_name
      FROM budgets b
      LEFT JOIN accounts a ON b.account_id = a.id
      WHERE b.id = ? AND b.user_id = ?
    `);
    const budget = await fetchStmt.bind(budgetId, userId).first<Record<string, unknown>>();

    return Response.json({ budget: budget ? formatBudget(budget) : null }, { status: 201 });
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

    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof updates.name === 'string') {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }

    if (typeof updates.category === 'string') {
      fields.push('category = ?');
      values.push(updates.category.trim());
    }

    if (updates.amount !== undefined) {
      const amountValue = Number(updates.amount);
      if (Number.isNaN(amountValue)) {
        return errorResponse('Invalid amount value', 400);
      }
      fields.push('amount = ?');
      values.push(amountValue);
    }

    if (updates.spent !== undefined) {
      const spentValue = Number(updates.spent);
      if (Number.isNaN(spentValue)) {
        return errorResponse('Invalid spent value', 400);
      }
      fields.push('spent = ?');
      values.push(spentValue);
    }

    if (typeof updates.status === 'string') {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (typeof updates.notes === 'string' || updates.notes === null) {
      fields.push('notes = ?');
      values.push(updates.notes ?? null);
    }

    if (updates.period_start) {
      const startDate = new Date(updates.period_start);
      if (Number.isNaN(startDate.getTime())) {
        return errorResponse('Invalid period_start date', 400);
      }
      fields.push('period_start = ?');
      values.push(startDate.toISOString());
    }

    if (updates.period_end) {
      const endDate = new Date(updates.period_end);
      if (Number.isNaN(endDate.getTime())) {
        return errorResponse('Invalid period_end date', 400);
      }
      fields.push('period_end = ?');
      values.push(endDate.toISOString());
    }

    if (updates.account_id !== undefined) {
      const accountIdValue =
        updates.account_id === null ? null : Number(updates.account_id);
      if (accountIdValue !== null && Number.isNaN(accountIdValue)) {
        return errorResponse('Invalid account reference', 400);
      }
      fields.push('account_id = ?');
      values.push(accountIdValue);
    }

    if (fields.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const setClause = `${fields.join(', ')}, updated_at = datetime('now')`;
    const updateStmt = c.env.DB.prepare(
      `UPDATE budgets SET ${setClause} WHERE id = ? AND user_id = ?`,
    );
    const result = (await updateStmt
      .bind(...values, budgetId, userId)
      .run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
      return errorResponse('Budget not found', 404);
    }

    const fetchStmt = c.env.DB.prepare(
      `SELECT b.*, a.name AS account_name
       FROM budgets b
       LEFT JOIN accounts a ON b.account_id = a.id
       WHERE b.id = ? AND b.user_id = ?`,
    );
    const budget = await fetchStmt.bind(budgetId, userId).first<Record<string, unknown>>();

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
    const deleteStmt = c.env.DB.prepare(
      'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    );
    const result = (await deleteStmt.bind(budgetId, userId).run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
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
    const stmt = c.env.DB.prepare(`
      SELECT g.*, a.name AS account_name
      FROM goals g
      LEFT JOIN accounts a ON g.account_id = a.id
      WHERE g.user_id = ?
      ORDER BY g.target_date ASC, g.created_at DESC
    `);
    const result = await stmt.bind(userId).all<Record<string, unknown>>();
    const goals = (result.results || []).map((row) => formatGoal(row));

    return Response.json({ goals });
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

    const targetAmountValue = Number(target_amount ?? 0);
    if (Number.isNaN(targetAmountValue)) {
      return errorResponse('Invalid target amount', 400);
    }

    const currentAmountValue = body.current_amount !== undefined ? Number(body.current_amount) : 0;
    if (Number.isNaN(currentAmountValue)) {
      return errorResponse('Invalid current amount', 400);
    }

    const goalId = typeof body.id === 'string' && body.id.trim() ? body.id : crypto.randomUUID();

    const accountIdValue =
      body.account_id === null || body.account_id === undefined
        ? null
        : Number(body.account_id);
    if (accountIdValue !== null && Number.isNaN(accountIdValue)) {
      return errorResponse('Invalid account reference', 400);
    }

    const insertStmt = c.env.DB.prepare(`
      INSERT INTO goals (
        id,
        user_id,
        title,
        description,
        target_amount,
        current_amount,
        target_date,
        category,
        status,
        priority,
        account_id,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const result = (await insertStmt
      .bind(
        goalId,
        userId,
        title.trim(),
        body.description ?? null,
        targetAmountValue,
        currentAmountValue,
        targetDate.toISOString(),
        body.category || 'savings',
        body.status || 'active',
        body.priority || 'medium',
        accountIdValue,
      )
      .run()) as D1RunResult;

    if (!result.success) {
      return errorResponse('Failed to create goal', 500);
    }

    const fetchStmt = c.env.DB.prepare(`
      SELECT g.*, a.name AS account_name
      FROM goals g
      LEFT JOIN accounts a ON g.account_id = a.id
      WHERE g.id = ? AND g.user_id = ?
    `);
    const goal = await fetchStmt.bind(goalId, userId).first<Record<string, unknown>>();

    return Response.json({ goal: goal ? formatGoal(goal) : null }, { status: 201 });
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

    const fields: string[] = [];
    const values: unknown[] = [];

    if (typeof updates.title === 'string') {
      fields.push('title = ?');
      values.push(updates.title.trim());
    }

    if (typeof updates.description === 'string' || updates.description === null) {
      fields.push('description = ?');
      values.push(updates.description ?? null);
    }

    if (updates.target_amount !== undefined) {
      const targetAmountValue = Number(updates.target_amount);
      if (Number.isNaN(targetAmountValue)) {
        return errorResponse('Invalid target amount', 400);
      }
      fields.push('target_amount = ?');
      values.push(targetAmountValue);
    }

    if (updates.current_amount !== undefined) {
      const currentAmountValue = Number(updates.current_amount);
      if (Number.isNaN(currentAmountValue)) {
        return errorResponse('Invalid current amount', 400);
      }
      fields.push('current_amount = ?');
      values.push(currentAmountValue);
    }

    if (updates.target_date) {
      const targetDate = new Date(updates.target_date);
      if (Number.isNaN(targetDate.getTime())) {
        return errorResponse('Invalid target date', 400);
      }
      fields.push('target_date = ?');
      values.push(targetDate.toISOString());
    }

    if (typeof updates.category === 'string') {
      fields.push('category = ?');
      values.push(updates.category);
    }

    if (typeof updates.status === 'string') {
      fields.push('status = ?');
      values.push(updates.status);
    }

    if (typeof updates.priority === 'string') {
      fields.push('priority = ?');
      values.push(updates.priority);
    }

    if (updates.account_id !== undefined) {
      const accountIdValue =
        updates.account_id === null ? null : Number(updates.account_id);
      if (accountIdValue !== null && Number.isNaN(accountIdValue)) {
        return errorResponse('Invalid account reference', 400);
      }
      fields.push('account_id = ?');
      values.push(accountIdValue);
    }

    if (fields.length === 0) {
      return errorResponse('No valid fields to update', 400);
    }

    const setClause = `${fields.join(', ')}, updated_at = datetime('now')`;
    const updateStmt = c.env.DB.prepare(
      `UPDATE goals SET ${setClause} WHERE id = ? AND user_id = ?`,
    );
    const result = (await updateStmt
      .bind(...values, goalId, userId)
      .run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
      return errorResponse('Goal not found', 404);
    }

    const fetchStmt = c.env.DB.prepare(
      `SELECT g.*, a.name AS account_name
       FROM goals g
       LEFT JOIN accounts a ON g.account_id = a.id
       WHERE g.id = ? AND g.user_id = ?`,
    );
    const goal = await fetchStmt.bind(goalId, userId).first<Record<string, unknown>>();

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
    const deleteStmt = c.env.DB.prepare(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
    );
    const result = (await deleteStmt.bind(goalId, userId).run()) as D1RunResult;

    const changes = Number(result.meta?.changes ?? 0);
    if (changes === 0) {
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

app.options('/api/pluggy/config', (c) => preflightResponse(c.req.header('Origin'), ['GET', 'POST', 'OPTIONS']));

app.get('/api/pluggy/config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const [storedClientId, storedClientSecret] = await Promise.all([
      getUserConfigValue(c.env.DB, userId, 'pluggy_client_id'),
      getUserConfigValue(c.env.DB, userId, 'pluggy_client_secret')
    ]);

    const fallbackClientId = c.env.PLUGGY_CLIENT_ID || '';
    const fallbackClientSecret = c.env.PLUGGY_CLIENT_SECRET || '';

    return Response.json({
      clientId: storedClientId ?? fallbackClientId,
      clientSecret: storedClientSecret ?? fallbackClientSecret
    });
  } catch (error) {
    console.error('Error loading pluggy config:', error);
    return errorResponse('Failed to load config', 500);
  }
});

app.post('/api/pluggy/config', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  let payload: { clientId?: unknown; clientSecret?: unknown };

  try {
    payload = await c.req.json();
  } catch (error) {
    console.error('Invalid JSON payload while saving pluggy config:', error);
    return errorResponse('Invalid request body', 400);
  }

  const clientId = typeof payload.clientId === 'string' ? payload.clientId.trim() : '';
  const clientSecret = typeof payload.clientSecret === 'string' ? payload.clientSecret.trim() : '';

  if (!clientId || !clientSecret) {
    return errorResponse('Client ID and Client Secret are required', 400);
  }

  try {
    await Promise.all([
      upsertUserConfigValue(c.env.DB, userId, 'pluggy_client_id', clientId),
      upsertUserConfigValue(c.env.DB, userId, 'pluggy_client_secret', clientSecret)
    ]);

    return Response.json({ success: true, clientId, clientSecret });
  } catch (error) {
    console.error('Error saving pluggy config:', error);
    return errorResponse('Failed to save config', 500);
  }
});

app.options('/api/pluggy/test-connection', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

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

app.options('/api/pluggy/add-connection', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

app.post('/api/pluggy/add-connection', authMiddleware, async (c) => {
  const userId = getUserId(c);

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  try {
    const { itemId } = await c.req.json();
    
    if (!itemId?.trim()) {
      return errorResponse('Item ID is required', 400);
    }

    const client = await getPluggyClientForUser(c.env.DB, c.env, userId);

    if (!client) {
      return errorResponse('Pluggy credentials not configured', 400);
    }

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
      INSERT INTO pluggy_connections (
        user_id,
        pluggy_item_id,
        institution_name,
        connection_status,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `);

    const insertResult = await insertStmt.bind(
      userId,
      itemId.trim(),
      item.connector?.name?.trim() || item.clientUserId || 'Unknown Institution',
      item.status || 'CONNECTED'
    ).run();

    const connectionId = insertResult.meta?.last_row_id;

    if (connectionId) {
      let orgInfo: { id?: string | null; name?: string | null; domain?: string | null } | null = null;

      try {
        const accounts = await client.getAccounts(itemId.trim());
        orgInfo = accounts.find(account => account.org)?.org ?? null;
      } catch (accountError) {
        console.error(`Error fetching accounts metadata for item ${itemId}:`, accountError);
      }

      await updatePluggyConnectionMetadata(c.env.DB, connectionId, {
        connectorId: item.connector?.id ?? null,
        connectorName: item.connector?.name ?? null,
        connectorImageUrl: item.connector?.imageUrl ?? null,
        connectorPrimaryColor: item.connector?.primaryColor ?? null,
        clientUserId: item.clientUserId ?? null,
        statusDetail: item.statusDetail ?? null,
        executionStatus: item.executionStatus ?? null,
        orgId: orgInfo?.id ?? null,
        orgName: orgInfo?.name ?? null,
        orgDomain: orgInfo?.domain ?? null,
        lastSyncMessage: 'Conexão cadastrada com sucesso'
      });
    }

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

app.options('/api/pluggy/connections/:id', (c) => preflightResponse(c.req.header('Origin'), ['DELETE', 'OPTIONS']));

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

app.options('/api/pluggy/sync/:itemId?', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

app.post('/api/pluggy/sync/:itemId?', authMiddleware, async (c) => {
  const userId = getUserId(c);
  const itemId = c.req.param('itemId');

  if (!userId) {
    return errorResponse('Unauthorized', 401);
  }

  // Create a unique sync ID for logging
  const syncId = `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${syncId}] Starting sync for user ${userId}, itemId: ${itemId || 'all'}`);

    const client = await getPluggyClientForUser(c.env.DB, c.env, userId);

    if (!client) {
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

        let connectionNewTransactions = 0;

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
                  connectionNewTransactions++;
                }
              }
            }
          } catch (transactionError) {
            const errorMsg = transactionError instanceof Error ? transactionError.message : String(transactionError);
            console.error(`[${syncId}] Error processing transaction ${transaction.id}:`, errorMsg);
            errors.push(`Transaction ${transaction.id}: ${errorMsg}`);
          }
        }

        let itemDetails: any = null;
        try {
          itemDetails = await client.getItem(connection.pluggy_item_id as string);
        } catch (itemError) {
          console.error(`[${syncId}] Failed to refresh item details for ${connection.pluggy_item_id}:`, itemError);
        }

        const successMessage = `Última sincronização em ${new Date().toLocaleString('pt-BR')} (${connectionNewTransactions} novas despesas).`;

        await updatePluggyConnectionMetadata(c.env.DB, connection.id as number, {
          connectionStatus: itemDetails?.status ?? 'CONNECTED',
          statusDetail: itemDetails?.statusDetail ?? null,
          executionStatus: itemDetails?.executionStatus ?? null,
          connectorId: itemDetails?.connector?.id ?? null,
          connectorName: itemDetails?.connector?.name ?? null,
          connectorImageUrl: itemDetails?.connector?.imageUrl ?? null,
          connectorPrimaryColor: itemDetails?.connector?.primaryColor ?? null,
          clientUserId: itemDetails?.clientUserId ?? null,
          lastSyncMessage: successMessage,
          lastSyncAt: 'now'
        });

      } catch (connectionError) {
        const errorMsg = connectionError instanceof Error ? connectionError.message : String(connectionError);
        console.error(`[${syncId}] Error syncing connection ${connection.id}:`, errorMsg);
        errors.push(`Connection ${connection.id}: ${errorMsg}`);

        try {
          await updatePluggyConnectionMetadata(c.env.DB, connection.id as number, {
            connectionStatus: 'ERROR',
            statusDetail: errorMsg,
            lastSyncMessage: `Falha na sincronização: ${errorMsg}`,
            lastSyncAt: 'now'
          });
        } catch (updateError) {
          console.error(`[${syncId}] Failed to persist sync error for connection ${connection.id}:`, updateError);
        }
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

app.options('/api/pluggy/webhook-config', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

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

app.options('/api/pluggy/test-webhook', (c) => preflightResponse(c.req.header('Origin'), ['POST', 'OPTIONS']));

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
        'User-Agent': 'FinContasApp-Webhook/1.0'
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
