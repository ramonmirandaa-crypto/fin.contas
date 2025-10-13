import { PluggyClient } from '../pluggy-improved';
import { getUserConfigValue } from './user-configs';

export type PluggyCredentials = {
  clientId: string;
  clientSecret: string;
};

export type PluggyConnectionUpdate = {
  connectionStatus?: string | null;
  statusDetail?: string | null;
  executionStatus?: string | null;
  lastSyncMessage?: string | null;
  lastSyncAt?: 'now' | string | null;
  connectorId?: string | null;
  connectorName?: string | null;
  connectorImageUrl?: string | null;
  connectorPrimaryColor?: string | null;
  clientUserId?: string | null;
  orgId?: string | null;
  orgName?: string | null;
  orgDomain?: string | null;
};

export const getPluggyCredentials = async (
  db: D1Database,
  userId: string,
): Promise<PluggyCredentials | null> => {
  const [clientId, clientSecret] = await Promise.all([
    getUserConfigValue(db, userId, 'pluggy_client_id'),
    getUserConfigValue(db, userId, 'pluggy_client_secret'),
  ]);

  if (!clientId || !clientSecret) {
    return null;
  }

  return {
    clientId,
    clientSecret,
  };
};

export const getPluggyClientForUser = async (db: D1Database, userId: string) => {
  const credentials = await getPluggyCredentials(db, userId);
  if (!credentials) {
    return null;
  }

  return new PluggyClient(credentials.clientId, credentials.clientSecret);
};

export const getUserPluggyConnections = async (db: D1Database, userId: string) => {
  const stmt = db.prepare('SELECT id, pluggy_item_id FROM pluggy_connections WHERE user_id = ?');
  const result = await stmt.bind(userId).all();
  const rows = (result.results as Array<{ id: number; pluggy_item_id: string }> | undefined) ?? [];
  return rows;
};

export const updatePluggyConnectionMetadata = async (
  db: D1Database,
  connectionId: number,
  updates: PluggyConnectionUpdate,
) => {
  const setClauses: string[] = [];
  const values: Array<string | null> = [];

  const addNullableUpdate = (column: string, value: string | null | undefined) => {
    if (value !== undefined) {
      setClauses.push(`${column} = ?`);
      values.push(value);
    }
  };

  addNullableUpdate('connection_status', updates.connectionStatus);
  addNullableUpdate('status_detail', updates.statusDetail);
  addNullableUpdate('execution_status', updates.executionStatus);
  addNullableUpdate('last_sync_message', updates.lastSyncMessage);
  addNullableUpdate('connector_id', updates.connectorId);
  addNullableUpdate('connector_name', updates.connectorName);
  addNullableUpdate('connector_image_url', updates.connectorImageUrl);
  addNullableUpdate('connector_primary_color', updates.connectorPrimaryColor);
  addNullableUpdate('client_user_id', updates.clientUserId);
  addNullableUpdate('org_id', updates.orgId);
  addNullableUpdate('org_name', updates.orgName);
  addNullableUpdate('org_domain', updates.orgDomain);

  if ('lastSyncAt' in updates) {
    if (updates.lastSyncAt === 'now') {
      setClauses.push("last_sync_at = datetime('now')");
    } else {
      setClauses.push('last_sync_at = ?');
      if (updates.lastSyncAt !== null) {
        values.push(updates.lastSyncAt);
      } else {
        values.push(null);
      }
    }
  }

  setClauses.push("updated_at = datetime('now')");

  const sql = `UPDATE pluggy_connections SET ${setClauses.join(', ')} WHERE id = ?`;
  await db.prepare(sql).bind(...values, connectionId).run();
};

export const fetchAllTransactionsForAccount = async (
  client: PluggyClient,
  accountId: string,
  startDate?: string,
) => {
  let page = 1;
  const pageSize = 500;
  const transactions: Array<Record<string, unknown>> = [];
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await client.getTransactions({
      accountId,
      from: startDate,
      page,
      pageSize,
    });

    const items = result.transactions as Array<Record<string, unknown>>;
    transactions.push(...items);
    hasNextPage = result.hasNextPage;
    page += 1;
  }

  return transactions;
};

export const formatDateOnly = (date: Date) => date.toISOString().split('T')[0];

export const flattenObject = (obj: Record<string, unknown>, prefix = ''): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  Object.entries(obj).forEach(([key, value]) => {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (value === null || value === undefined) {
      return;
    }

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, newKey));
    } else {
      result[newKey] = value;
    }
  });

  return result;
};

export const getPayeeName = (transaction: Record<string, unknown>) => {
  const merchant = transaction.merchant as Record<string, unknown> | undefined;
  if (merchant) {
    return (merchant.name as string) || (merchant.businessName as string) || '';
  }

  const paymentData = transaction.paymentData as Record<string, unknown> | undefined;
  const payer = paymentData?.payer as { name?: string } | undefined;
  if (payer?.name) {
    return payer.name;
  }

  const payee = paymentData?.payee as { name?: string } | undefined;
  if (payee?.name) {
    return payee.name;
  }

  return typeof transaction.description === 'string' ? transaction.description : '';
};
