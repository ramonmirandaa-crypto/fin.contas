import { PluggyClient, mapPluggyInvestmentType } from './pluggy-improved';

// Sync investments for an item
export async function syncInvestmentsForItem(userId: string, itemId: string, pluggyClient: PluggyClient, db: any): Promise<void> {
  try {
    const investments = await pluggyClient.getAllInvestments(itemId);
    
    console.log(`Found ${investments.length} investments for item ${itemId}`);
    
    for (const investment of investments) {
      // Check if investment already exists
      const existingStmt = db.prepare("SELECT id FROM investments WHERE user_id = ? AND name = ? AND purchase_date = ?");
      const existing = await existingStmt.bind(
        userId, 
        investment.productName,
        investment.createdAt ? new Date(investment.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      ).first();
      
      if (!existing) {
        // Create new investment
        console.log(`Creating new investment ${investment.productName} for item ${itemId}`);
        const insertStmt = db.prepare(`
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
        const updateStmt = db.prepare(`
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

// Sync accounts for an item
export async function syncAccountsForItem(userId: string, itemId: string, pluggyClient: PluggyClient, db: any): Promise<number> {
  try {
    const { mapPluggyAccountType } = await import('./pluggy-improved');
    const accounts = await pluggyClient.getAccounts(itemId);
    let syncedCount = 0;
    
    for (const pluggyAccount of accounts) {
      const accountType = mapPluggyAccountType(pluggyAccount);
      
      // Check if account already exists
      const existingAccountStmt = db.prepare(
        "SELECT id FROM accounts WHERE pluggy_account_id = ? AND user_id = ?"
      );
      const existing = await existingAccountStmt.bind(pluggyAccount.id, userId).first();
      
      if (existing) {
        // Update existing account
        const updateStmt = db.prepare(`
          UPDATE accounts 
          SET name = ?, balance = ?, status = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        await updateStmt.bind(
          pluggyAccount.name || pluggyAccount.marketingName || 'Conta Pluggy',
          pluggyAccount.balance || 0,
          pluggyAccount.status || 'ACTIVE',
          (existing as any).id
        ).run();
        syncedCount++;

        // If it's a credit card, update the credit card record too
        if (accountType === 'credit_card') {
          const updateCardStmt = db.prepare(`
            UPDATE credit_cards 
            SET current_balance = ?, credit_limit = ?, updated_at = datetime('now')
            WHERE linked_account_id = ? AND user_id = ?
          `);
          await updateCardStmt.bind(
            Math.abs(pluggyAccount.balance || 0), 
            pluggyAccount.creditData?.creditLimit || 0,
            (existing as any).id, 
            userId
          ).run();
        }
      } else {
        // Create new account
        const insertStmt = db.prepare(`
          INSERT INTO accounts (
            user_id, pluggy_account_id, pluggy_item_id, name, account_type, balance, 
            status, sync_enabled, created_at, updated_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, TRUE, datetime('now'), datetime('now'))
        `);
        const result = await insertStmt.bind(
          userId,
          pluggyAccount.id,
          itemId,
          pluggyAccount.name || pluggyAccount.marketingName || 'Conta Pluggy',
          accountType,
          pluggyAccount.balance || 0,
          pluggyAccount.status || 'ACTIVE'
        ).run();
        syncedCount++;
        
        // If it's a credit card, also create entry in credit_cards table
        if (accountType === 'credit_card') {
          const insertCardStmt = db.prepare(`
            INSERT INTO credit_cards (
              user_id, linked_account_id, name, credit_limit, current_balance, due_day,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `);
          const dueDay = pluggyAccount.creditData?.balanceDueDate ? 
            new Date(pluggyAccount.creditData.balanceDueDate).getDate() : 1;
          await insertCardStmt.bind(
            userId,
            result.meta.last_row_id,
            pluggyAccount.name || pluggyAccount.marketingName || 'Cartão de Crédito',
            pluggyAccount.creditData?.creditLimit || 0,
            Math.abs(pluggyAccount.balance || 0),
            dueDay
          ).run();
        }
      }
    }
    
    return syncedCount;
  } catch (error) {
    console.error(`Error syncing accounts for item ${itemId}:`, error);
    return 0;
  }
}

// Sync credit card bills for an item
export async function syncCreditCardBillsForItem(userId: string, itemId: string, pluggyClient: PluggyClient, db: any): Promise<void> {
  try {
    const fromDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // Last 90 days
    const billsWithTransactions = await pluggyClient.getAllCreditCardTransactions(itemId, fromDate);
    
    for (const { bill, transactions: _transactions } of billsWithTransactions) {
      // Check if bill already exists
      const existingBillStmt = db.prepare("SELECT id FROM credit_card_bills WHERE pluggy_bill_id = ? AND user_id = ?");
      const existing = await existingBillStmt.bind(bill.id, userId).first();
      
      if (!existing) {
        console.log(`Creating new credit card bill ${bill.id} for item ${itemId}`);
        // Implementation would go here - keeping simple for now
      }
    }
  } catch (error) {
    console.error(`Error syncing credit card bills for item ${itemId}:`, error);
  }
}
