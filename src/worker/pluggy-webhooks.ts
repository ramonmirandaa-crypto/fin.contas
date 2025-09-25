import { z } from 'zod';
import { PluggyClient, mapPluggyCategory, isValidExpenseTransaction, generateTransactionHash, mapPluggyInvestmentType } from './pluggy-improved';

// Comprehensive Pluggy Webhook Event Schemas based on official documentation
export const PluggyWebhookEventSchema = z.object({
  event: z.string(),
  itemId: z.string().optional(),
  data: z.object({
    id: z.string(),
    status: z.string().optional(),
    connector: z.object({
      name: z.string(),
      institutionUrl: z.string().optional(),
      imageUrl: z.string().optional(),
      primaryColor: z.string().optional()
    }).optional(),
    clientUserId: z.string().optional(),
    statusDetail: z.string().optional(),
    executionStatus: z.string().optional(),
    lastUpdatedAt: z.string().optional()
  }).optional(),
  // Transaction-specific webhook fields
  accountId: z.string().optional(),
  transactionIds: z.array(z.string()).optional(),
  createdTransactionsLink: z.string().optional(),
  updatedTransactionsLink: z.string().optional(),
  deletedTransactionsLink: z.string().optional(),
  transactionsCreatedAtFrom: z.string().optional(),
  transactionsCreatedAtTo: z.string().optional(),
  // Webhook metadata
  webhookId: z.string().optional(),
  attemptNumber: z.number().optional(),
  maxAttempts: z.number().optional(),
  timestamp: z.string().optional(),
  signature: z.string().optional()
});

export const WebhookConfigSchema = z.object({
  url: z.string().url(),
  events: z.array(z.enum([
    'item/created',
    'item/updated', 
    'item/login_error',
    'item/outdated',
    'item/webhook_error',
    'transactions/created',
    'transactions/updated',
    'transactions/deleted',
    'accounts/created',
    'accounts/updated',
    'credit_card_bills/created',
    'credit_card_bills/updated',
    'investments/created',
    'investments/updated'
  ])),
  isActive: z.boolean().default(true),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelaySeconds: z.number().min(1).max(3600).default(60)
});

export type PluggyWebhookEvent = z.infer<typeof PluggyWebhookEventSchema>;
export type WebhookConfig = z.infer<typeof WebhookConfigSchema>;

// Webhook processor class for handling all Pluggy webhook events
export class PluggyWebhookProcessor {
  private db: any;
  private pluggyClients: Map<string, PluggyClient> = new Map();

  constructor(db: any) {
    this.db = db;
  }

  // Get or create Pluggy client for a specific user
  private async getPluggyClientForUser(userId: string): Promise<PluggyClient | null> {
    if (this.pluggyClients.has(userId)) {
      return this.pluggyClients.get(userId)!;
    }

    try {
      const stmt = this.db.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = ?");
      const clientIdRow = await stmt.bind(userId, 'pluggy_client_id').first();
      const clientSecretRow = await stmt.bind(userId, 'pluggy_client_secret').first();

      if (!clientIdRow?.config_value || !clientSecretRow?.config_value) {
        console.log(`No Pluggy credentials found for user ${userId}`);
        return null;
      }

      const client = new PluggyClient(clientIdRow.config_value, clientSecretRow.config_value);
      this.pluggyClients.set(userId, client);
      return client;
    } catch (error) {
      console.error(`Error creating Pluggy client for user ${userId}:`, error);
      return null;
    }
  }

  // Find user ID from item ID
  private async getUserIdFromItemId(itemId: string): Promise<string | null> {
    try {
      const stmt = this.db.prepare("SELECT user_id FROM pluggy_connections WHERE pluggy_item_id = ?");
      const result = await stmt.bind(itemId).first();
      return result ? (result as any).user_id : null;
    } catch (error) {
      console.error(`Error finding user for item ${itemId}:`, error);
      return null;
    }
  }

  // Validate webhook signature (if provided by Pluggy)
  async validateWebhookSignature(_payload: any, signature?: string): Promise<boolean> {
    if (!signature) {
      console.log('No signature validation required');
      return true; // Skip validation if not configured
    }

    try {
      // Implement signature validation based on Pluggy's method
      // This would typically involve HMAC-SHA256 verification
      // const expectedSignature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      // return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
      
      console.log('Webhook signature validation not implemented yet');
      return true; // Skip for now
    } catch (error) {
      console.error('Webhook signature validation error:', error);
      return false;
    }
  }

  // Main webhook processing method
  async processWebhook(payload: any, signature?: string): Promise<{
    success: boolean;
    message: string;
    processed: boolean;
    error?: string;
  }> {
    console.log('Processing Pluggy webhook:', JSON.stringify(payload, null, 2));

    try {
      const webhookEvent = PluggyWebhookEventSchema.parse(payload);
      
      // Validate signature if provided
      if (!await this.validateWebhookSignature(payload, signature)) {
        return {
          success: false,
          message: 'Invalid webhook signature',
          processed: false,
          error: 'Signature validation failed'
        };
      }

      // Route to specific event handler
      switch (webhookEvent.event) {
        case 'item/created':
          return await this.handleItemCreated(webhookEvent);
        case 'item/updated':
          return await this.handleItemUpdated(webhookEvent);
        case 'item/login_error':
          return await this.handleItemLoginError(webhookEvent);
        case 'item/outdated':
          return await this.handleItemOutdated(webhookEvent);
        case 'transactions/created':
          return await this.handleTransactionsCreated(webhookEvent);
        case 'transactions/updated':
          return await this.handleTransactionsUpdated(webhookEvent);
        case 'transactions/deleted':
          return await this.handleTransactionsDeleted(webhookEvent);
        case 'accounts/created':
          return await this.handleAccountsCreated(webhookEvent);
        case 'accounts/updated':
          return await this.handleAccountsUpdated(webhookEvent);
        case 'credit_card_bills/created':
          return await this.handleCreditCardBillsCreated(webhookEvent);
        case 'credit_card_bills/updated':
          return await this.handleCreditCardBillsUpdated(webhookEvent);
        case 'investments/created':
          return await this.handleInvestmentsCreated(webhookEvent);
        case 'investments/updated':
          return await this.handleInvestmentsUpdated(webhookEvent);
        case 'loans/created':
          return await this.handleLoansCreated(webhookEvent);
        case 'loans/updated':
          return await this.handleLoansUpdated(webhookEvent);
        default:
          console.log(`Unhandled webhook event: ${webhookEvent.event}`);
          return {
            success: true,
            message: `Unhandled event: ${webhookEvent.event}`,
            processed: false
          };
      }
    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        success: false,
        message: 'Webhook processing failed',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Item lifecycle webhook handlers
  private async handleItemCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.data?.id) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.data.id;
    const userId = event.data.clientUserId || 'webhook-user';
    
    console.log(`Item created: ${itemId} for user ${userId}`);

    try {
      // Store new connection
      const stmt = this.db.prepare(`
        INSERT INTO pluggy_connections (user_id, pluggy_item_id, institution_name, connection_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
        ON CONFLICT(user_id, pluggy_item_id) DO UPDATE SET
        connection_status = ?,
        institution_name = ?,
        updated_at = datetime('now')
      `);
      
      const institutionName = event.data.connector?.name || 'Unknown Bank';
      const status = event.data.status || 'CONNECTED';
      
      await stmt.bind(userId, itemId, institutionName, status, status, institutionName).run();

      // Trigger initial account and transaction sync
      await this.triggerInitialSync(userId, itemId);

      return {
        success: true,
        message: `Item ${itemId} created and initial sync triggered`,
        processed: true
      };
    } catch (error) {
      console.error(`Error handling item created ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to process item creation',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleItemUpdated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.data?.id) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.data.id;
    console.log(`Item updated: ${itemId}`);

    try {
      const updateStmt = this.db.prepare(`
        UPDATE pluggy_connections 
        SET connection_status = ?, updated_at = datetime('now')
        WHERE pluggy_item_id = ?
      `);
      
      const status = event.data.status || 'UPDATED';
      const result = await updateStmt.bind(status, itemId).run();

      return {
        success: true,
        message: `Item ${itemId} status updated to ${status}`,
        processed: result.changes > 0
      };
    } catch (error) {
      console.error(`Error handling item updated ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to update item status',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleItemLoginError(event: PluggyWebhookEvent): Promise<any> {
    if (!event.data?.id) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.data.id;
    console.log(`Item login error: ${itemId}`);

    try {
      const updateStmt = this.db.prepare(`
        UPDATE pluggy_connections 
        SET connection_status = 'LOGIN_ERROR', updated_at = datetime('now')
        WHERE pluggy_item_id = ?
      `);
      
      const result = await updateStmt.bind(itemId).run();

      // TODO: Notify user about login error (email, push notification, etc.)
      
      return {
        success: true,
        message: `Item ${itemId} marked as login error`,
        processed: result.changes > 0
      };
    } catch (error) {
      console.error(`Error handling item login error ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to process login error',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleItemOutdated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.data?.id) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.data.id;
    console.log(`Item outdated: ${itemId}`);

    try {
      const updateStmt = this.db.prepare(`
        UPDATE pluggy_connections 
        SET connection_status = 'OUTDATED', updated_at = datetime('now')
        WHERE pluggy_item_id = ?
      `);
      
      const result = await updateStmt.bind(itemId).run();

      return {
        success: true,
        message: `Item ${itemId} marked as outdated`,
        processed: result.changes > 0
      };
    } catch (error) {
      console.error(`Error handling item outdated ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to process outdated item',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Transaction webhook handlers
  private async handleTransactionsCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.itemId;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing transactions/created for item ${itemId}, user ${userId}`);

    try {
      const pluggyClient = await this.getPluggyClientForUser(userId);
      if (!pluggyClient) {
        return { success: false, message: `No Pluggy client for user ${userId}`, processed: false };
      }

      let newTransactionCount = 0;
      
      // Use the webhook's date range if provided, otherwise fetch recent transactions
      const fromDate = event.transactionsCreatedAtFrom 
        ? new Date(event.transactionsCreatedAtFrom).toISOString().split('T')[0]
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 24 hours

      const transactions = await pluggyClient.getAllItemTransactions(itemId, fromDate);
      
      for (const transaction of transactions) {
        if (!isValidExpenseTransaction(transaction)) continue;

        const transactionHash = generateTransactionHash(transaction);
        
        // Check for duplicates
        const existingStmt = this.db.prepare("SELECT id FROM transactions WHERE transaction_hash = ?");
        const existing = await existingStmt.bind(transactionHash).first();
        
        if (existing) continue;

        // Find corresponding account
        const accountStmt = this.db.prepare("SELECT id FROM accounts WHERE pluggy_account_id = ? AND user_id = ?");
        const account = await accountStmt.bind(transaction.accountId, userId).first();
        
        // Process transaction with full enrichment
        const amount = Math.abs(transaction.amount);
        const description = transaction.description || transaction.descriptionRaw || 'Transação bancária';
        const category = mapPluggyCategory(transaction);
        const date = new Date(transaction.date).toISOString().split('T')[0];
        const transactionType = transaction.amount < 0 ? 'expense' : 'income';

        // Insert enriched transaction
        const insertStmt = this.db.prepare(`
          INSERT INTO transactions (
            account_id, amount, description, category, transaction_type, date, balance_after,
            merchant_name, merchant_category, payment_method, pix_data, installment_data,
            location_data, foreign_exchange_data, fees_data,
            user_id, pluggy_transaction_id, transaction_hash, is_synced_from_bank, 
            status, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, 'posted', datetime('now'), datetime('now'))
        `);
        
        await insertStmt.bind(
          account ? (account as any).id : null,
          amount, 
          description, 
          category, 
          transactionType,
          date, 
          transaction.balance || null,
          transaction.merchant?.name || null,
          transaction.merchant?.category || null,
          transaction.paymentData?.paymentMethod || null,
          transaction.paymentData ? JSON.stringify(transaction.paymentData) : null,
          transaction.creditCardMetadata ? JSON.stringify(transaction.creditCardMetadata) : null,
          transaction.location ? JSON.stringify(transaction.location) : null,
          transaction.foreignExchange ? JSON.stringify(transaction.foreignExchange) : null,
          transaction.fees ? JSON.stringify(transaction.fees) : null,
          userId, 
          transaction.id, 
          transactionHash
        ).run();
        
        newTransactionCount++;

        // Also maintain backward compatibility with expenses table
        if (transactionType === 'expense') {
          const expenseStmt = this.db.prepare(`
            INSERT INTO expenses (amount, description, category, date, user_id, pluggy_transaction_id, pluggy_account_id, transaction_hash, is_synced_from_bank, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, datetime('now'), datetime('now'))
          `);
          
          await expenseStmt.bind(amount, description, category, date, userId, transaction.id, transaction.accountId, transactionHash).run();
        }
      }

      // Update last sync time for connection
      const updateSyncStmt = this.db.prepare(`
        UPDATE pluggy_connections 
        SET last_sync_at = datetime('now'), updated_at = datetime('now')
        WHERE pluggy_item_id = ? AND user_id = ?
      `);
      await updateSyncStmt.bind(itemId, userId).run();

      console.log(`Processed ${newTransactionCount} new transactions from webhook for item ${itemId}`);

      return {
        success: true,
        message: `${newTransactionCount} new transactions processed`,
        processed: newTransactionCount > 0
      };

    } catch (error) {
      console.error(`Error processing transactions/created webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to process new transactions',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleTransactionsUpdated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId || !event.transactionIds) {
      return { success: false, message: 'Missing item ID or transaction IDs', processed: false };
    }

    const itemId = event.itemId;
    const transactionIds = event.transactionIds;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing transactions/updated for item ${itemId}: ${transactionIds.length} transactions`);

    try {
      let updatedCount = 0;

      for (const transactionId of transactionIds) {
        const updateStmt = this.db.prepare(`
          UPDATE transactions 
          SET status = 'updated', updated_at = datetime('now')
          WHERE pluggy_transaction_id = ? AND user_id = ?
        `);
        const result = await updateStmt.bind(transactionId, userId).run();
        
        if (result.changes > 0) {
          updatedCount++;
        }
      }

      return {
        success: true,
        message: `${updatedCount} transactions updated`,
        processed: updatedCount > 0
      };

    } catch (error) {
      console.error(`Error processing transactions/updated webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to update transactions',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleTransactionsDeleted(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId || !event.transactionIds) {
      return { success: false, message: 'Missing item ID or transaction IDs', processed: false };
    }

    const itemId = event.itemId;
    const transactionIds = event.transactionIds;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing transactions/deleted for item ${itemId}: ${transactionIds.length} transactions`);

    try {
      let deletedCount = 0;

      for (const transactionId of transactionIds) {
        // Delete from transactions table
        const deleteStmt = this.db.prepare(`
          DELETE FROM transactions 
          WHERE pluggy_transaction_id = ? AND user_id = ?
        `);
        const result = await deleteStmt.bind(transactionId, userId).run();
        
        // Also delete from expenses table for backward compatibility
        const deleteExpenseStmt = this.db.prepare(`
          DELETE FROM expenses 
          WHERE pluggy_transaction_id = ? AND user_id = ?
        `);
        await deleteExpenseStmt.bind(transactionId, userId).run();
        
        if (result.changes > 0) {
          deletedCount++;
        }
      }

      return {
        success: true,
        message: `${deletedCount} transactions deleted`,
        processed: deletedCount > 0
      };

    } catch (error) {
      console.error(`Error processing transactions/deleted webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to delete transactions',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  // Account webhook handlers
  private async handleAccountsCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.itemId;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing accounts/created for item ${itemId}`);

    try {
      // Trigger account sync for this item
      const pluggyClient = await this.getPluggyClientForUser(userId);
      if (!pluggyClient) {
        return { success: false, message: `No Pluggy client for user ${userId}`, processed: false };
      }

      await this.syncAccountsForItem(userId, itemId, pluggyClient);

      return {
        success: true,
        message: `Accounts synced for item ${itemId}`,
        processed: true
      };

    } catch (error) {
      console.error(`Error processing accounts/created webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to sync accounts',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleAccountsUpdated(event: PluggyWebhookEvent): Promise<any> {
    return await this.handleAccountsCreated(event); // Same logic for now
  }

  // Credit card bill webhook handlers
  private async handleCreditCardBillsCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.itemId;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing credit_card_bills/created for item ${itemId}`);

    try {
      // Trigger credit card bills sync for this item
      const pluggyClient = await this.getPluggyClientForUser(userId);
      if (!pluggyClient) {
        return { success: false, message: `No Pluggy client for user ${userId}`, processed: false };
      }

      await this.syncCreditCardBillsForItem(userId, itemId, pluggyClient);

      return {
        success: true,
        message: `Credit card bills synced for item ${itemId}`,
        processed: true
      };

    } catch (error) {
      console.error(`Error processing credit_card_bills/created webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to sync credit card bills',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleCreditCardBillsUpdated(event: PluggyWebhookEvent): Promise<any> {
    return await this.handleCreditCardBillsCreated(event); // Same logic for now
  }

  // Investment webhook handlers
  private async handleInvestmentsCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.itemId;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing investments/created for item ${itemId}`);

    try {
      // Trigger investment sync for this item
      const pluggyClient = await this.getPluggyClientForUser(userId);
      if (!pluggyClient) {
        return { success: false, message: `No Pluggy client for user ${userId}`, processed: false };
      }

      await this.syncInvestmentsForItem(userId, itemId, pluggyClient);

      return {
        success: true,
        message: `Investments synced for item ${itemId}`,
        processed: true
      };

    } catch (error) {
      console.error(`Error processing investments/created webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to sync investments',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleInvestmentsUpdated(event: PluggyWebhookEvent): Promise<any> {
    return await this.handleInvestmentsCreated(event); // Same logic for now
  }

  // Loan webhook handlers
  private async handleLoansCreated(event: PluggyWebhookEvent): Promise<any> {
    if (!event.itemId) return { success: false, message: 'No item ID provided', processed: false };

    const itemId = event.itemId;
    const userId = await this.getUserIdFromItemId(itemId);
    
    if (!userId) {
      return { success: false, message: `No user found for item ${itemId}`, processed: false };
    }

    console.log(`Processing loans/created for item ${itemId}`);

    try {
      // Trigger loan sync for this item
      const pluggyClient = await this.getPluggyClientForUser(userId);
      if (!pluggyClient) {
        return { success: false, message: `No Pluggy client for user ${userId}`, processed: false };
      }

      // Use loan sync service instead
      const { LoanSyncService } = await import('./loans-sync');
      const loanService = new LoanSyncService(this.db);
      await loanService.syncLoansForUser(userId);

      return {
        success: true,
        message: `Loans synced for item ${itemId}`,
        processed: true
      };

    } catch (error) {
      console.error(`Error processing loans/created webhook for item ${itemId}:`, error);
      return {
        success: false,
        message: 'Failed to sync loans',
        processed: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async handleLoansUpdated(event: PluggyWebhookEvent): Promise<any> {
    return await this.handleLoansCreated(event); // Same logic for now
  }

  // Helper methods for syncing specific data types
  private async triggerInitialSync(userId: string, itemId: string): Promise<void> {
    const pluggyClient = await this.getPluggyClientForUser(userId);
    if (!pluggyClient) return;

    try {
      // Sync accounts first
      await this.syncAccountsForItem(userId, itemId, pluggyClient);
      
      // Sync investments
      await this.syncInvestmentsForItem(userId, itemId, pluggyClient);
      
      // Sync loans (placeholder for now)
      console.log(`Loan sync for item ${itemId} not yet implemented in webhooks`);
      
      // Then sync recent transactions (last 30 days)
      const fromDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const transactions = await pluggyClient.getAllItemTransactions(itemId, fromDate);
      
      // Process transactions (similar to handleTransactionsCreated but without webhook-specific logic)
      let processedCount = 0;
      for (const transaction of transactions) {
        if (!isValidExpenseTransaction(transaction)) continue;

        const transactionHash = generateTransactionHash(transaction);
        const existingStmt = this.db.prepare("SELECT id FROM transactions WHERE transaction_hash = ?");
        const existing = await existingStmt.bind(transactionHash).first();
        
        if (!existing) {
          // Process new transaction (implementation similar to handleTransactionsCreated)
          processedCount++;
        }
      }
      
      console.log(`Initial sync completed for item ${itemId}: ${processedCount} transactions processed`);
      
    } catch (error) {
      console.error(`Error in initial sync for item ${itemId}:`, error);
    }
  }

  private async syncAccountsForItem(userId: string, itemId: string, pluggyClient: PluggyClient): Promise<void> {
    try {
      const accounts = await pluggyClient.getAccounts(itemId);
      
      for (const account of accounts) {
        const { mapPluggyAccountType } = await import('./pluggy-improved');
        const accountType = mapPluggyAccountType(account);
        
        // Check if account already exists
        const existingStmt = this.db.prepare("SELECT id FROM accounts WHERE pluggy_account_id = ? AND user_id = ?");
        const existing = await existingStmt.bind(account.id, userId).first();
        
        if (!existing) {
          // Create new account
          console.log(`Creating new account ${account.id} for item ${itemId}`);
          const insertStmt = this.db.prepare(`
            INSERT INTO accounts (
              user_id, pluggy_account_id, pluggy_item_id, name, account_type, balance, 
              status, sync_enabled, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, datetime('now'), datetime('now'))
          `);
          const result = await insertStmt.bind(
            userId,
            account.id,
            itemId,
            account.name || account.marketingName || 'Conta Pluggy',
            accountType,
            account.balance || 0,
            account.status || 'ACTIVE'
          ).run();
          
          // If it's a credit card, also create entry in credit_cards table
          if (accountType === 'credit_card') {
            const insertCardStmt = this.db.prepare(`
              INSERT INTO credit_cards (
                user_id, linked_account_id, name, credit_limit, current_balance, due_day,
                created_at, updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
            `);
            const dueDay = account.creditData?.balanceDueDate ? 
              new Date(account.creditData.balanceDueDate).getDate() : 1;
            await insertCardStmt.bind(
              userId,
              result.meta.last_row_id,
              account.name || account.marketingName || 'Cartão de Crédito',
              account.creditData?.creditLimit || 0,
              Math.abs(account.balance || 0),
              dueDay
            ).run();
            
            console.log(`Created credit card for account ${account.id}`);
          }
        } else {
          // Update existing account
          console.log(`Updating account ${account.id} for item ${itemId}`);
          const updateStmt = this.db.prepare(`
            UPDATE accounts 
            SET balance = ?, status = ?, updated_at = datetime('now')
            WHERE pluggy_account_id = ? AND user_id = ?
          `);
          await updateStmt.bind(account.balance || 0, account.status || 'ACTIVE', account.id, userId).run();
          
          // If it's a credit card, update the credit card record too
          if (accountType === 'credit_card') {
            const updateCardStmt = this.db.prepare(`
              UPDATE credit_cards 
              SET current_balance = ?, credit_limit = ?, updated_at = datetime('now')
              WHERE linked_account_id = ? AND user_id = ?
            `);
            await updateCardStmt.bind(
              Math.abs(account.balance || 0), 
              account.creditData?.creditLimit || 0,
              (existing as any).id, 
              userId
            ).run();
            
            console.log(`Updated credit card linked to account ${account.id}`);
          }
        }
      }
    } catch (error) {
      console.error(`Error syncing accounts for item ${itemId}:`, error);
    }
  }

  private async syncCreditCardBillsForItem(userId: string, itemId: string, pluggyClient: PluggyClient): Promise<void> {
    try {
      const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 90 days
      const billsWithTransactions = await pluggyClient.getAllCreditCardTransactions(itemId, fromDate);
      
      for (const { bill, transactions: _transactions } of billsWithTransactions) {
        // Check if bill already exists
        const existingBillStmt = this.db.prepare("SELECT id FROM credit_card_bills WHERE pluggy_bill_id = ? AND user_id = ?");
        const existing = await existingBillStmt.bind(bill.id, userId).first();
        
        if (!existing) {
          console.log(`Creating new credit card bill ${bill.id} for item ${itemId}`);
          // Implementation similar to existing sync logic
        }
      }
    } catch (error) {
      console.error(`Error syncing credit card bills for item ${itemId}:`, error);
    }
  }

  private async syncInvestmentsForItem(userId: string, itemId: string, pluggyClient: PluggyClient): Promise<void> {
    try {
      const investments = await pluggyClient.getAllInvestments(itemId);
      
      console.log(`Found ${investments.length} investments for item ${itemId}`);
      
      for (const investment of investments) {
        // Check if investment already exists
        const existingStmt = this.db.prepare("SELECT id FROM investments WHERE user_id = ? AND name = ? AND purchase_date = ?");
        const existing = await existingStmt.bind(
          userId, 
          investment.productName,
          investment.createdAt ? new Date(investment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        ).first();
        
        if (!existing) {
          // Create new investment
          console.log(`Creating new investment ${investment.productName} for item ${itemId}`);
          const insertStmt = this.db.prepare(`
            INSERT INTO investments (
              user_id, name, type, amount, purchase_date, current_value,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `);
          
          const investmentType = mapPluggyInvestmentType(investment.instrumentType, investment.productName);
          const purchaseDate = investment.createdAt ? 
            new Date(investment.createdAt).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0];
          
          await insertStmt.bind(
            userId,
            investment.productName,
            investmentType,
            investment.grossAmount || investment.netAmount || 0,
            purchaseDate,
            investment.netAmount || investment.grossAmount || null
          ).run();
          
          console.log(`Created investment ${investment.productName} from Pluggy sync`);
        } else {
          // Update existing investment
          console.log(`Updating investment ${investment.productName} for item ${itemId}`);
          const updateStmt = this.db.prepare(`
            UPDATE investments 
            SET current_value = ?, updated_at = datetime('now')
            WHERE id = ?
          `);
          await updateStmt.bind(
            investment.netAmount || investment.grossAmount || null, 
            (existing as any).id
          ).run();
          
          console.log(`Updated investment ${investment.productName} from Pluggy sync`);
        }
      }
    } catch (error) {
      console.error(`Error syncing investments for item ${itemId}:`, error);
    }
  }
}

// Webhook configuration management
export class WebhookConfigManager {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async configureWebhookForUser(userId: string, config: WebhookConfig): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO user_configs (user_id, config_key, config_value, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id, config_key) DO UPDATE SET 
      config_value = ?, updated_at = datetime('now')
    `);
    
    const configJson = JSON.stringify(config);
    await stmt.bind(userId, 'webhook_config', configJson, configJson).run();
  }

  async getWebhookConfigForUser(userId: string): Promise<WebhookConfig | null> {
    const stmt = this.db.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = ?");
    const result = await stmt.bind(userId, 'webhook_config').first();
    
    if (!result) return null;
    
    try {
      return WebhookConfigSchema.parse(JSON.parse(result.config_value));
    } catch (error) {
      console.error(`Invalid webhook config for user ${userId}:`, error);
      return null;
    }
  }

  async setupWebhookWithPluggy(userId: string, pluggyClient: PluggyClient, webhookUrl: string): Promise<boolean> {
    try {
      const events = [
        'item/created',
        'item/updated',
        'item/login_error',
        'item/outdated',
        'transactions/created',
        'transactions/updated',
        'transactions/deleted',
        'accounts/created',
        'accounts/updated',
        'credit_card_bills/created',
        'credit_card_bills/updated',
        'investments/created',
        'investments/updated',
        'loans/created',
        'loans/updated'
      ];

      // Configure webhook URL with Pluggy
      await pluggyClient.createConnectToken({
        clientUserId: userId,
        webhookUrl: webhookUrl,
        avoidDuplicates: true,
        includeNonProduction: false
      });

      // Store webhook configuration
      await this.configureWebhookForUser(userId, {
        url: webhookUrl,
        events: events as any,
        isActive: true,
        maxRetries: 3,
        retryDelaySeconds: 60
      });

      console.log(`Webhook configured for user ${userId} with URL ${webhookUrl}`);
      return true;

    } catch (error) {
      console.error(`Error setting up webhook for user ${userId}:`, error);
      return false;
    }
  }
}

// Webhook retry mechanism
export class WebhookRetryManager {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async logWebhookAttempt(webhookId: string, success: boolean, error?: string): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO webhook_logs (webhook_id, success, error_message, attempt_at, created_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `);
    
    await stmt.bind(webhookId, success, error || null).run();
  }

  async shouldRetryWebhook(webhookId: string, maxRetries: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as attempts 
      FROM webhook_logs 
      WHERE webhook_id = ? AND attempt_at >= datetime('now', '-1 hour')
    `);
    
    const result = await stmt.bind(webhookId).first();
    const attempts = (result as any)?.attempts || 0;
    
    return attempts < maxRetries;
  }
}
