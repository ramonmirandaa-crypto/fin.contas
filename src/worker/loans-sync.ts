import { PluggyClient, PluggyLoan, mapPluggyLoanType } from './pluggy-improved';

export interface LoanSyncResult {
  success: boolean;
  newLoans: number;
  updatedLoans: number;
  errors: string[];
  syncedConnections: string[];
  lastSyncDate: string;
}

export class LoanSyncService {
  private db: any;

  constructor(db: any) {
    this.db = db;
  }

  async syncLoansForUser(userId: string): Promise<LoanSyncResult> {
    console.log(`Starting loan sync for user ${userId}`);
    
    const result: LoanSyncResult = {
      success: false,
      newLoans: 0,
      updatedLoans: 0,
      errors: [],
      syncedConnections: [],
      lastSyncDate: new Date().toISOString()
    };

    try {
      // Get user's Pluggy credentials
      const stmt = this.db.prepare("SELECT config_value FROM user_configs WHERE user_id = ? AND config_key = ?");
      const clientIdRow = await stmt.bind(userId, 'pluggy_client_id').first();
      const clientSecretRow = await stmt.bind(userId, 'pluggy_client_secret').first();

      if (!clientIdRow?.config_value || !clientSecretRow?.config_value) {
        console.log(`No Pluggy credentials found for user ${userId}`);
        result.errors.push('No Pluggy credentials found');
        result.success = true; // This is not an error, just no credentials set up
        return result;
      }

      let pluggyClient: PluggyClient;
      try {
        pluggyClient = new PluggyClient(clientIdRow.config_value, clientSecretRow.config_value);
      } catch (clientError) {
        console.error(`Error creating Pluggy client for user ${userId}:`, clientError);
        result.errors.push(`Invalid Pluggy credentials: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
        return result;
      }

      // Get user's active connections
      const connectionsStmt = this.db.prepare(`
        SELECT pluggy_item_id, institution_name 
        FROM pluggy_connections 
        WHERE user_id = ? AND connection_status = 'CONNECTED'
      `);
      
      const connections = await connectionsStmt.bind(userId).all();
      
      if (!connections || connections.length === 0) {
        console.log(`No active connections found for user ${userId}`);
        result.success = true;
        return result;
      }

      console.log(`Found ${connections.length} active connections for user ${userId}`);

      // Sync loans for each connection
      for (const connection of connections) {
        const itemId = (connection as any).pluggy_item_id;
        const institutionName = (connection as any).institution_name;
        
        try {
          console.log(`Syncing loans for connection ${itemId} (${institutionName})`);
          
          // Get all accounts first, then filter for loan accounts
          let accounts: any[] = [];
          try {
            accounts = await pluggyClient.getAccounts(itemId);
          } catch (accountError) {
            console.error(`Error fetching accounts for connection ${itemId}:`, accountError);
            result.errors.push(`Connection ${itemId}: Failed to fetch accounts - ${accountError instanceof Error ? accountError.message : String(accountError)}`);
            continue; // Skip this connection but continue with others
          }

          const loanAccounts = accounts.filter(account => 
            account.type?.toLowerCase().includes('loan') || 
            account.subtype?.toLowerCase().includes('loan') ||
            account.subtype?.toLowerCase().includes('financing') ||
            account.loanData // Check if account has loan-specific data
          );
          
          console.log(`Found ${loanAccounts.length} loan accounts for connection ${itemId}`);
          
          // For now, we'll create loan records based on loan account data
          for (const loanAccount of loanAccounts) {
            try {
              // Create a loan object from the account data that matches PluggyLoan interface
              const loan = {
                id: loanAccount.id,
                accountId: loanAccount.id,
                contractNumber: loanAccount.loanData?.contractNumber || null,
                installmentIdentifier: null,
                productName: loanAccount.name || loanAccount.marketingName || 'Empréstimo',
                productType: 'loan',
                productSubType: loanAccount.subtype || null,
                contractAmount: loanAccount.loanData?.principalAmount || null,
                outstandingBalance: loanAccount.loanData?.outstandingBalance || Math.abs(loanAccount.balance || 0),
                principalAmount: loanAccount.loanData?.principalAmount || null,
                totalDue: null,
                interestRate: loanAccount.loanData?.interestRate || null,
                interestType: null,
                indexer: null,
                installmentAmount: loanAccount.loanData?.installmentAmount || null,
                totalInstallments: loanAccount.loanData?.totalInstallments || null,
                remainingInstallments: loanAccount.loanData?.remainingInstallments || null,
                installmentFrequency: loanAccount.loanData?.installmentFrequency || null,
                nextInstallmentDueDate: loanAccount.loanData?.dueDate || null,
                contractDate: loanAccount.loanData?.originationDate || null,
                dueDate: loanAccount.loanData?.dueDate || null,
                maturityDate: loanAccount.loanData?.maturityDate || null,
                firstPaymentDate: null,
                status: loanAccount.status || 'ACTIVE',
                guaranteeType: null,
                guaranteeSubType: null,
                currency: loanAccount.currencyCode || 'BRL',
                hasInsurance: null,
                cet: null,
                createdAt: loanAccount.createdAt || new Date().toISOString(),
                updatedAt: loanAccount.updatedAt || new Date().toISOString()
              };
              
              const syncResult = await this.processSingleLoan(userId, loan);
              if (syncResult.isNew) {
                result.newLoans++;
              } else if (syncResult.updated) {
                result.updatedLoans++;
              }
            } catch (loanError) {
              console.error(`Error processing loan account ${loanAccount.id}:`, loanError);
              result.errors.push(`Error processing loan account ${loanAccount.id}: ${loanError instanceof Error ? loanError.message : String(loanError)}`);
            }
          }
          
          result.syncedConnections.push(itemId);
          
          // Update last sync time for connection
          const updateSyncStmt = this.db.prepare(`
            UPDATE pluggy_connections 
            SET last_sync_at = datetime('now'), updated_at = datetime('now')
            WHERE pluggy_item_id = ? AND user_id = ?
          `);
          await updateSyncStmt.bind(itemId, userId).run();
          
        } catch (connectionError) {
          console.error(`Error syncing loans for connection ${itemId}:`, connectionError);
          // Better error handling for JSON parsing errors
          let errorMessage = connectionError instanceof Error ? connectionError.message : String(connectionError);
          if (errorMessage.includes('JSON') || errorMessage.includes('SyntaxError')) {
            errorMessage = `JSON parsing error - API may have returned invalid data: ${errorMessage}`;
          }
          result.errors.push(`Connection ${itemId}: ${errorMessage}`);
        }
      }

      result.success = result.errors.length === 0 || result.syncedConnections.length > 0;
      console.log(`Loan sync completed for user ${userId}:`, result);
      
    } catch (error) {
      console.error(`Error in loan sync for user ${userId}:`, error);
      let errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('JSON') || errorMessage.includes('SyntaxError')) {
        errorMessage = `JSON parsing error in loan sync: ${errorMessage}`;
      }
      result.errors.push(errorMessage);
    }

    return result;
  }

  private async processSingleLoan(userId: string, loan: PluggyLoan): Promise<{
    isNew: boolean;
    updated: boolean;
  }> {
    // Generate loan identifier
    const loanName = loan.productName || loan.productType || `Empréstimo ${loan.contractNumber || loan.id}`;
    const principalAmount = loan.contractAmount || loan.principalAmount || loan.outstandingBalance || 0;
    const startDate = loan.contractDate ? 
      new Date(loan.contractDate).toISOString().split('T')[0] : 
      new Date().toISOString().split('T')[0];
    
    // Check if loan already exists
    const existingStmt = this.db.prepare(`
      SELECT id, remaining_balance, monthly_payment, interest_rate 
      FROM loans 
      WHERE user_id = ? AND (
        (pluggy_loan_id = ?) OR 
        (name = ? AND principal_amount = ? AND start_date = ?)
      )
    `);
    
    const existing = await existingStmt.bind(
      userId, 
      loan.id,
      loanName,
      principalAmount,
      startDate
    ).first();

    const loanType = mapPluggyLoanType(loan.productType || '', loan.productSubType === null ? undefined : loan.productSubType);
    const interestRate = loan.interestRate || 0;
    const monthlyPayment = loan.installmentAmount || 0;
    const remainingBalance = loan.outstandingBalance || principalAmount;
    const endDate = loan.maturityDate ? 
      new Date(loan.maturityDate).toISOString().split('T')[0] : 
      startDate;
    const nextDueDate = loan.nextInstallmentDueDate ? 
      new Date(loan.nextInstallmentDueDate).toISOString().split('T')[0] : 
      undefined;

    if (!existing) {
      // Create new loan
      console.log(`Creating new loan: ${loanName}`);
      
      const insertStmt = this.db.prepare(`
        INSERT INTO loans (
          user_id, name, principal_amount, interest_rate, start_date, end_date, 
          monthly_payment, remaining_balance, pluggy_loan_id, pluggy_account_id,
          contract_number, loan_type, status, total_installments, remaining_installments,
          installment_frequency, next_due_date, is_synced_from_bank, guarantee_type,
          cet_rate, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, datetime('now'), datetime('now'))
      `);
      
      await insertStmt.bind(
        userId,
        loanName,
        principalAmount,
        interestRate,
        startDate,
        endDate,
        monthlyPayment,
        remainingBalance,
        loan.id,
        loan.accountId,
        loan.contractNumber === null ? undefined : loan.contractNumber,
        loanType,
        loan.status || 'ACTIVE',
        loan.totalInstallments === null ? undefined : loan.totalInstallments,
        loan.remainingInstallments === null ? undefined : loan.remainingInstallments,
        loan.installmentFrequency === null ? undefined : loan.installmentFrequency,
        nextDueDate === null ? undefined : nextDueDate,
        loan.guaranteeType === null ? undefined : loan.guaranteeType,
        loan.cet === null ? undefined : loan.cet
      ).run();
      
      console.log(`Created loan: ${loanName} with balance ${remainingBalance}`);
      return { isNew: true, updated: false };
      
    } else {
      // Check if loan needs updating
      const existingData = existing as any;
      let needsUpdate = false;
      
      if (Math.abs(existingData.remaining_balance - remainingBalance) > 0.01 ||
          Math.abs(existingData.monthly_payment - monthlyPayment) > 0.01 ||
          Math.abs(existingData.interest_rate - interestRate) > 0.001) {
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        console.log(`Updating loan: ${loanName}`);
        
        const updateStmt = this.db.prepare(`
          UPDATE loans 
          SET remaining_balance = ?, monthly_payment = ?, interest_rate = ?, 
              status = ?, remaining_installments = ?, next_due_date = ?,
              cet_rate = ?, updated_at = datetime('now'),
              pluggy_loan_id = COALESCE(pluggy_loan_id, ?),
              pluggy_account_id = COALESCE(pluggy_account_id, ?)
          WHERE id = ?
        `);
        
        await updateStmt.bind(
          remainingBalance,
          monthlyPayment,
          interestRate,
          loan.status || 'ACTIVE',
          loan.remainingInstallments || undefined,
          nextDueDate,
          loan.cet || undefined,
          loan.id || '',
          loan.accountId || '',
          existingData.id
        ).run();
        
        console.log(`Updated loan: ${loanName} balance from ${existingData.remaining_balance} to ${remainingBalance}`);
        return { isNew: false, updated: true };
      }
      
      // Ensure Pluggy IDs are set even if no other updates needed
      const updatePluggyIdsStmt = this.db.prepare(`
        UPDATE loans 
        SET pluggy_loan_id = COALESCE(pluggy_loan_id, ?),
            pluggy_account_id = COALESCE(pluggy_account_id, ?),
            is_synced_from_bank = TRUE
        WHERE id = ? AND (pluggy_loan_id IS NULL OR pluggy_account_id IS NULL)
      `);
      
      await updatePluggyIdsStmt.bind(loan.id || '', loan.accountId || '', existingData.id).run();
      
      return { isNew: false, updated: false };
    }
  }

  async getAllUserLoans(userId: string): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM loans 
      WHERE user_id = ? 
      ORDER BY created_at DESC
    `);
    
    const loans = await stmt.bind(userId).all();
    return loans || [];
  }

  async getLoanById(userId: string, loanId: number): Promise<any | null> {
    const stmt = this.db.prepare(`
      SELECT * FROM loans 
      WHERE user_id = ? AND id = ?
    `);
    
    const loan = await stmt.bind(userId, loanId).first();
    return loan || null;
  }

  async deleteLoan(userId: string, loanId: number): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM loans 
      WHERE user_id = ? AND id = ?
    `);
    
    const result = await stmt.bind(userId, loanId).run();
    return (result.changes || 0) > 0;
  }

  async updateLoan(userId: string, loanId: number, updates: {
    name?: string;
    principal_amount?: number;
    interest_rate?: number;
    start_date?: string;
    end_date?: string;
    monthly_payment?: number;
    remaining_balance?: number;
  }): Promise<boolean> {
    const setParts: string[] = [];
    const values: any[] = [];
    
    if (updates.name !== undefined) {
      setParts.push('name = ?');
      values.push(updates.name);
    }
    if (updates.principal_amount !== undefined) {
      setParts.push('principal_amount = ?');
      values.push(updates.principal_amount);
    }
    if (updates.interest_rate !== undefined) {
      setParts.push('interest_rate = ?');
      values.push(updates.interest_rate);
    }
    if (updates.start_date !== undefined) {
      setParts.push('start_date = ?');
      values.push(updates.start_date);
    }
    if (updates.end_date !== undefined) {
      setParts.push('end_date = ?');
      values.push(updates.end_date);
    }
    if (updates.monthly_payment !== undefined) {
      setParts.push('monthly_payment = ?');
      values.push(updates.monthly_payment);
    }
    if (updates.remaining_balance !== undefined) {
      setParts.push('remaining_balance = ?');
      values.push(updates.remaining_balance);
    }
    
    if (setParts.length === 0) {
      return false; // No updates to make
    }
    
    setParts.push('updated_at = datetime("now")');
    values.push(userId, loanId);
    
    const sql = `UPDATE loans SET ${setParts.join(', ')} WHERE user_id = ? AND id = ?`;
    const stmt = this.db.prepare(sql);
    
    const result = await stmt.bind(...values).run();
    return (result.changes || 0) > 0;
  }
}
