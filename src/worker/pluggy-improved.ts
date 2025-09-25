import { z } from 'zod';

// Enhanced Pluggy API types and schemas based on official documentation
export const PluggyConnectTokenSchema = z.object({
  accessToken: z.string().optional(),
  connectToken: z.string().optional()
}).refine(data => data.accessToken || data.connectToken, {
  message: "Either accessToken or connectToken is required"
});

export const PluggyItemSchema = z.object({
  id: z.string(),
  connector: z.object({
    name: z.string(),
    institutionUrl: z.string().nullish(),
    imageUrl: z.string().nullish(),
    primaryColor: z.string().nullish(),
    credentialsType: z.string().nullish()
  }),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastUpdatedAt: z.string().nullish(),
  clientUserId: z.string().nullish(),
  statusDetail: z.string().nullish(),
  executionStatus: z.string().nullish()
});

export const PluggyAccountSchema = z.object({
  id: z.string(),
  type: z.string(),
  subtype: z.string(),
  name: z.string(),
  balance: z.number(),
  currencyCode: z.string(),
  itemId: z.string(),
  marketingName: z.string().nullish(),
  number: z.string().nullish(),
  owner: z.string().nullish(),
  taxNumber: z.string().nullish(),
  // Bank account specific data
  bankData: z.object({
    transferNumber: z.string().nullish(),
    closingBalance: z.number().nullish(),
    automaticallyInvestedBalance: z.number().nullish(),
    overdraftContractedLimit: z.number().nullish(),
    overdraftUsedLimit: z.number().nullish(),
    unarrangedOverdraftAmount: z.number().nullish(),
    branchCode: z.string().nullish(),
    accountDigit: z.string().nullish(),
    compeCode: z.string().nullish()
  }).nullish(),
  // Credit card specific data
  creditData: z.object({
    level: z.string().nullish(),
    brand: z.string().nullish(),
    balanceCloseDate: z.string().nullish(),
    balanceDueDate: z.string().nullish(),
    minimumPayment: z.number().nullish(),
    creditLimit: z.number().nullish(),
    availableCreditLimit: z.number().nullish(),
    isLimitFlexible: z.boolean().nullish(),
    totalInstallmentBalance: z.number().nullish(),
    interestRate: z.number().nullish(),
    fineRate: z.number().nullish(),
    annualFee: z.number().nullish(),
    cardNetwork: z.string().nullish(),
    cardType: z.string().nullish()
  }).nullish(),
  // Loan specific data
  loanData: z.object({
    contractNumber: z.string().nullish(),
    principalAmount: z.number().nullish(),
    outstandingBalance: z.number().nullish(),
    interestRate: z.number().nullish(),
    installmentAmount: z.number().nullish(),
    installmentFrequency: z.string().nullish(),
    remainingInstallments: z.number().nullish(),
    totalInstallments: z.number().nullish(),
    dueDate: z.string().nullish(),
    maturityDate: z.string().nullish(),
    originationDate: z.string().nullish()
  }).nullish(),
  // Investment specific data
  investmentData: z.object({
    productName: z.string().nullish(),
    investmentType: z.string().nullish(),
    portfolioValue: z.number().nullish(),
    netWorth: z.number().nullish(),
    grossWorth: z.number().nullish(),
    lastMovementDate: z.string().nullish(),
    rate: z.number().nullish(),
    rateType: z.string().nullish(),
    indexer: z.string().nullish(),
    maturityDate: z.string().nullish(),
    isin: z.string().nullish(),
    quantity: z.number().nullish(),
    unitPrice: z.number().nullish()
  }).nullish(),
  // Additional fields available in the API
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  lastUpdatedAt: z.string().nullish(),
  status: z.string().nullish(),
  category: z.string().nullish(),
  subCategory: z.string().nullish()
});

// Enhanced transaction schema with all available fields from API
export const PluggyTransactionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  balance: z.number().nullish(),
  currencyCode: z.string(),
  date: z.string(),
  description: z.string(),
  descriptionRaw: z.string().nullish(),
  category: z.string().nullish(),
  categoryId: z.string().nullish(),
  type: z.string(),
  amountInAccountCurrency: z.number().nullish(),
  accountCurrency: z.string().nullish(),
  // Enhanced merchant data
  merchant: z.object({
    name: z.string().nullish(),
    businessName: z.string().nullish(),
    cnpj: z.string().nullish(),
    cpf: z.string().nullish(),
    category: z.string().nullish(),
    mcc: z.string().nullish(), // Merchant Category Code
    city: z.string().nullish(),
    state: z.string().nullish(),
    country: z.string().nullish()
  }).nullish(),
  // Enhanced payment data with all PIX and transfer fields
  paymentData: z.object({
    payer: z.object({
      name: z.string().nullish(),
      branchCode: z.string().nullish(),
      accountNumber: z.string().nullish(),
      routingNumber: z.string().nullish(),
      documentNumber: z.object({
        type: z.string().nullish(),
        value: z.string().nullish()
      }).nullish(),
      bankName: z.string().nullish(),
      bankCode: z.string().nullish()
    }).nullish(),
    payee: z.object({
      name: z.string().nullish(),
      branchCode: z.string().nullish(),
      accountNumber: z.string().nullish(),
      routingNumber: z.string().nullish(),
      documentNumber: z.object({
        type: z.string().nullish(),
        value: z.string().nullish()
      }).nullish(),
      bankName: z.string().nullish(),
      bankCode: z.string().nullish()
    }).nullish(),
    paymentMethod: z.string().nullish(),
    referenceNumber: z.string().nullish(),
    reason: z.string().nullish(),
    // PIX specific fields
    pixKey: z.string().nullish(),
    pixKeyType: z.string().nullish(),
    endToEndId: z.string().nullish()
  }).nullish(),
  // Enhanced credit card metadata
  creditCardMetadata: z.object({
    totalInstallments: z.number().nullish(),
    installmentNumber: z.number().nullish(),
    payeeId: z.string().nullish(),
    purchaseId: z.string().nullish(),
    level: z.string().nullish(),
    brand: z.string().nullish(),
    foreignTransaction: z.boolean().nullish()
  }).nullish(),
  // Location data for transactions
  location: z.object({
    address: z.string().nullish(),
    city: z.string().nullish(),
    state: z.string().nullish(),
    country: z.string().nullish(),
    postalCode: z.string().nullish(),
    coordinates: z.object({
      latitude: z.number().nullish(),
      longitude: z.number().nullish()
    }).nullish()
  }).nullish(),
  // Additional metadata
  tags: z.array(z.string()).nullish(),
  notes: z.string().nullish(),
  receipt: z.object({
    url: z.string().nullish(),
    fileName: z.string().nullish()
  }).nullish(),
  // Transaction status and processing info
  status: z.string().nullish(),
  statusReason: z.string().nullish(),
  reconciled: z.boolean().nullish(),
  pending: z.boolean().nullish(),
  // Foreign exchange data
  foreignExchange: z.object({
    rate: z.number().nullish(),
    fromCurrency: z.string().nullish(),
    toCurrency: z.string().nullish(),
    originalAmount: z.number().nullish()
  }).nullish(),
  // Transaction fees
  fees: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    description: z.string().nullish()
  })).nullish(),
  // Timestamps
  createdAt: z.string().nullish(),
  updatedAt: z.string().nullish(),
  processedAt: z.string().nullish()
});

// Transaction search and filter parameters
export const TransactionSearchParamsSchema = z.object({
  accountId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  categoryId: z.string().optional(),
  category: z.string().optional(),
  type: z.string().optional(),
  amountGte: z.number().optional(),
  amountLte: z.number().optional(),
  description: z.string().optional(),
  pending: z.boolean().optional(),
  reconciled: z.boolean().optional(),
  paymentMethod: z.string().optional(),
  merchantName: z.string().optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().min(1).default(1),
  pageSize: z.number().min(1).max(500).default(100)
});

// Transaction update schema
export const TransactionUpdateSchema = z.object({
  category: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  reconciled: z.boolean().optional()
});

// Transaction categories schema
export const PluggyTransactionCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string().nullish(),
  parentId: z.string().nullish(),
  description: z.string().nullish(),
  keywords: z.array(z.string()).nullish(),
  rules: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.string()
  })).nullish(),
  isDefault: z.boolean().nullish(),
  createdAt: z.string(),
  updatedAt: z.string()
});

// Bulk operations schemas
export const BulkTransactionOperationSchema = z.object({
  operation: z.enum(['categorize', 'tag', 'reconcile', 'delete']),
  transactionIds: z.array(z.string()),
  params: z.object({
    categoryId: z.string().optional(),
    tags: z.array(z.string()).optional(),
    reconciled: z.boolean().optional()
  }).optional()
});

// Analytics and insights schemas
export const TransactionAnalyticsSchema = z.object({
  totalTransactions: z.number(),
  totalAmount: z.number(),
  averageAmount: z.number(),
  categoryBreakdown: z.array(z.object({
    categoryId: z.string(),
    categoryName: z.string(),
    totalAmount: z.number(),
    transactionCount: z.number(),
    percentage: z.number()
  })),
  monthlyTrends: z.array(z.object({
    month: z.string(),
    totalAmount: z.number(),
    transactionCount: z.number()
  })),
  topMerchants: z.array(z.object({
    merchantName: z.string(),
    totalAmount: z.number(),
    transactionCount: z.number()
  })),
  paymentMethodBreakdown: z.array(z.object({
    paymentMethod: z.string(),
    totalAmount: z.number(),
    transactionCount: z.number()
  }))
});

export const PluggyWebhookSchema = z.object({
  event: z.string(),
  data: z.object({
    id: z.string(),
    status: z.string().nullish(),
    connector: z.object({
      name: z.string()
    }).nullish(),
    clientUserId: z.string().nullish()
  })
});

// Credit Card Bill schemas
export const PluggyCreditCardBillSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  amount: z.number(),
  closingDate: z.string(),
  dueDate: z.string(),
  minimumPayment: z.number(),
  previousBillBalance: z.number().nullable(),
  paidAmount: z.number().nullable(),
  paymentDate: z.string().nullable(),
  status: z.string(),
  interestRate: z.number().nullable(),
  lateFee: z.number().nullable(),
  annualFee: z.number().nullable(),
  internationalFee: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Credit Card Transaction schemas (bill details)
export const PluggyCreditCardTransactionSchema = z.object({
  id: z.string(),
  billId: z.string(),
  accountId: z.string(),
  amount: z.number(),
  description: z.string(),
  category: z.string().nullable(),
  date: z.string(),
  installmentNumber: z.number().nullable(),
  totalInstallments: z.number().nullable(),
  merchant: z.object({
    name: z.string().nullable(),
    category: z.string().nullable(),
  }).nullable(),
  type: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Loan schemas following Pluggy API
export const PluggyLoanSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  contractNumber: z.string().nullable(),
  installmentIdentifier: z.string().nullable(),
  productName: z.string().nullable(),
  productType: z.string().nullable(),
  productSubType: z.string().nullable(),
  
  // Loan amounts
  contractAmount: z.number().nullable(),
  outstandingBalance: z.number(),
  principalAmount: z.number().nullable(),
  totalDue: z.number().nullable(),
  
  // Interest and rates
  interestRate: z.number().nullable(),
  interestType: z.string().nullable(),
  indexer: z.string().nullable(),
  
  // Installment information
  installmentAmount: z.number().nullable(),
  totalInstallments: z.number().nullable(),
  remainingInstallments: z.number().nullable(),
  installmentFrequency: z.string().nullable(),
  nextInstallmentDueDate: z.string().nullable(),
  
  // Dates
  contractDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  maturityDate: z.string().nullable(),
  firstPaymentDate: z.string().nullable(),
  
  // Status and metadata
  status: z.string().nullable(),
  guaranteeType: z.string().nullable(),
  guaranteeSubType: z.string().nullable(),
  currency: z.string().nullable(),
  
  // Insurance and fees
  hasInsurance: z.boolean().nullable(),
  cet: z.number().nullable(), // Custo Efetivo Total
  
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Investment schemas following Pluggy API
export const PluggyInvestmentSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  productName: z.string(),
  instrumentType: z.string(),
  grossAmount: z.number(),
  netAmount: z.number(),
  quantity: z.number().nullable(),
  unitPrice: z.number().nullable(),
  maturityDate: z.string().nullable(),
  issuer: z.string().nullable(),
  indexer: z.string().nullable(),
  rate: z.number().nullable(),
  rateType: z.string().nullable(),
  lastMovementDate: z.string().nullable(),
  dueDate: z.string().nullable(),
  profitability: z.object({
    total: z.number().nullable(),
    percentage: z.number().nullable(),
    period: z.string().nullable()
  }).nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Authentication response schemas following official Pluggy documentation
export const PluggyAuthResponseSchema = z.object({
  apiKey: z.string(), // Pluggy API returns 'apiKey' not 'accessToken'
  expiresIn: z.number().optional(), // Token expiration in seconds (7200 for 2 hours)
  tokenType: z.string().optional().default('Bearer')
});

export const PluggyConnectTokenResponseSchema = z.object({
  connectToken: z.string(),
  expiresIn: z.number().optional(), // Token expiration in seconds (1800 for 30 minutes)
  tokenType: z.string().optional().default('Bearer')
});

// Authentication request schemas
export const PluggyAuthRequestSchema = z.object({
  clientId: z.string().uuid('Client ID must be a valid UUID'),
  clientSecret: z.string().min(1, 'Client Secret is required')
});

export const PluggyConnectTokenRequestSchema = z.object({
  clientUserId: z.string().optional(),
  webhookUrl: z.string().url().optional(),
  oauthRedirectUrl: z.string().url().optional(),
  avoidDuplicates: z.boolean().optional(),
  institutionId: z.string().optional(),
  includeNonProduction: z.boolean().optional()
});

export type PluggyItem = z.infer<typeof PluggyItemSchema>;
export type PluggyAccount = z.infer<typeof PluggyAccountSchema>;
export type PluggyTransaction = z.infer<typeof PluggyTransactionSchema>;
export type PluggyWebhookEvent = z.infer<typeof PluggyWebhookSchema>;
export type PluggyCreditCardBill = z.infer<typeof PluggyCreditCardBillSchema>;
export type PluggyCreditCardTransaction = z.infer<typeof PluggyCreditCardTransactionSchema>;
export type PluggyLoan = z.infer<typeof PluggyLoanSchema>;
export type PluggyInvestment = z.infer<typeof PluggyInvestmentSchema>;
export type PluggyTransactionCategory = z.infer<typeof PluggyTransactionCategorySchema>;
export type TransactionSearchParams = z.infer<typeof TransactionSearchParamsSchema>;
export type TransactionUpdate = z.infer<typeof TransactionUpdateSchema>;
export type BulkTransactionOperation = z.infer<typeof BulkTransactionOperationSchema>;
export type TransactionAnalytics = z.infer<typeof TransactionAnalyticsSchema>;
export type PluggyAuthResponse = z.infer<typeof PluggyAuthResponseSchema>;
export type PluggyConnectTokenResponse = z.infer<typeof PluggyConnectTokenResponseSchema>;
export type PluggyAuthRequest = z.infer<typeof PluggyAuthRequestSchema>;
export type PluggyConnectTokenRequest = z.infer<typeof PluggyConnectTokenRequestSchema>;

// Sync result types
export interface SyncResult {
  success: boolean;
  newTransactions: number;
  updatedTransactions: number;
  errors: string[];
  syncedAccounts: string[];
  lastSyncDate: string;
}

export interface BatchSyncResult {
  totalNewTransactions: number;
  totalUpdatedTransactions: number;
  successfulConnections: number;
  failedConnections: number;
  errors: Array<{ connectionId: string; error: string }>;
  duration: number;
}

// Token types enum for better type safety
export enum PluggyTokenType {
  API_KEY = 'api_key',
  CONNECT_TOKEN = 'connect_token'
}

// Authentication error types
export class PluggyAuthError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorCode?: string
  ) {
    super(message);
    this.name = 'PluggyAuthError';
  }
}

export class PluggyRateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'PluggyRateLimitError';
  }
}

// Enhanced Pluggy client with official authentication protocol implementation
export class PluggyClient {
  private baseUrl = 'https://api.pluggy.ai';
  private clientId: string;
  private clientSecret: string;
  private apiKey?: string;
  private apiKeyExpiresAt?: number;
  private connectToken?: string;
  private connectTokenExpiresAt?: number;
  private requestCount = 0;
  private rateLimit = {
    maxRequestsPerMinute: 60,
    requestTimes: [] as number[],
    isLimited: false,
    retryAfter: 0
  };

  constructor(clientId: string, clientSecret: string) {
    // Validate required credentials
    const authRequest = PluggyAuthRequestSchema.safeParse({
      clientId: clientId?.trim(),
      clientSecret: clientSecret?.trim()
    });

    if (!authRequest.success) {
      throw new PluggyAuthError(
        `Invalid credentials: ${authRequest.error.errors.map(e => e.message).join(', ')}`
      );
    }

    this.clientId = authRequest.data.clientId;
    this.clientSecret = authRequest.data.clientSecret;
  }

  // ===========================================
  // AUTHENTICATION METHODS (Official Protocol)
  // ===========================================

  /**
   * Authenticate with Pluggy API using CLIENT_ID and CLIENT_SECRET to obtain an API Key
   * API Key expires after 2 hours and provides full access to all endpoints
   * This should only be called from secure server environments
   */
  private async authenticateWithCredentials(): Promise<string> {
    // Check if current API key is still valid (with 5-minute buffer)
    if (this.apiKey && this.apiKeyExpiresAt && Date.now() < (this.apiKeyExpiresAt - 300000)) {
      return this.apiKey;
    }

    console.log('[Pluggy] Authenticating with credentials to obtain API Key...');
    
    try {
      await this.checkRateLimit();
      
      const authPayload: PluggyAuthRequest = {
        clientId: this.clientId,
        clientSecret: this.clientSecret
      };
      
      const response = await fetch(`${this.baseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FinanceitoApp/1.0'
        },
        body: JSON.stringify(authPayload)
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new PluggyAuthError(
          `Invalid JSON response from Pluggy auth: ${responseText}`,
          response.status
        );
      }

      if (!response.ok) {
        console.error(`[Pluggy] Authentication failed: ${response.status}`, responseData);
        throw new PluggyAuthError(
          `Authentication failed: ${responseData.message || responseData.error || 'Unknown error'}`,
          response.status,
          responseData.code
        );
      }

      // Parse and validate auth response
      const authResponse = PluggyAuthResponseSchema.safeParse(responseData);
      if (!authResponse.success) {
        console.error('[Pluggy] Invalid auth response format:', responseData);
        throw new PluggyAuthError(
          `Invalid auth response format: ${authResponse.error.errors.map(e => e.message).join(', ')}`
        );
      }

      this.apiKey = authResponse.data.apiKey;
      // API Key expires in 2 hours (7200 seconds) according to documentation
      const expiresIn = authResponse.data.expiresIn || 7200;
      this.apiKeyExpiresAt = Date.now() + (expiresIn * 1000);
      
      console.log(`[Pluggy] Successfully obtained API Key (expires in ${expiresIn} seconds)`);
      return this.apiKey;

    } catch (error) {
      if (error instanceof PluggyAuthError) {
        throw error;
      }
      console.error('[Pluggy] Authentication failed:', error);
      throw new PluggyAuthError(
        `Authentication failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Create a Connect Token using the API Key
   * Connect Token expires after 30 minutes and has limited access for client-side use
   * This is what should be used in Pluggy Connect Widget
   */
  async createConnectToken(options?: PluggyConnectTokenRequest): Promise<string> {
    try {
      console.log('[Pluggy] Creating connect token with options:', options);
      
      // Validate options if provided
      if (options) {
        const validatedOptions = PluggyConnectTokenRequestSchema.safeParse(options);
        if (!validatedOptions.success) {
          throw new PluggyAuthError(
            `Invalid connect token options: ${validatedOptions.error.errors.map(e => e.message).join(', ')}`
          );
        }
        options = validatedOptions.data;
      }

      // Ensure we have a valid API Key
      const apiKey = await this.authenticateWithCredentials();
      
      await this.checkRateLimit();
      
      const response = await fetch(`${this.baseUrl}/connect_token`, {
        method: 'POST',
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FinanceitoApp/1.0'
        },
        body: JSON.stringify(options || {})
      });

      const responseText = await response.text();
      let responseData;

      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        throw new PluggyAuthError(
          `Invalid JSON response from connect token endpoint: ${responseText}`,
          response.status
        );
      }

      if (!response.ok) {
        console.error(`[Pluggy] Connect token creation failed: ${response.status}`, responseData);
        throw new PluggyAuthError(
          `Connect token creation failed: ${responseData.message || responseData.error || 'Unknown error'}`,
          response.status,
          responseData.code
        );
      }

      // Parse and validate connect token response
      const connectTokenResponse = PluggyConnectTokenResponseSchema.safeParse(responseData);
      if (!connectTokenResponse.success) {
        console.error('[Pluggy] Invalid connect token response format:', responseData);
        throw new PluggyAuthError(
          `Invalid connect token response format: ${connectTokenResponse.error.errors.map(e => e.message).join(', ')}`
        );
      }

      this.connectToken = connectTokenResponse.data.connectToken;
      // Connect Token expires in 30 minutes (1800 seconds) according to documentation
      const expiresIn = connectTokenResponse.data.expiresIn || 1800;
      this.connectTokenExpiresAt = Date.now() + (expiresIn * 1000);
      
      console.log(`[Pluggy] Successfully created Connect Token (expires in ${expiresIn} seconds)`);
      return this.connectToken;

    } catch (error) {
      if (error instanceof PluggyAuthError) {
        throw error;
      }
      console.error('[Pluggy] Connect token creation failed:', error);
      throw new PluggyAuthError(
        `Connect token creation failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get the appropriate token for the request type
   * API Key for server-side requests, Connect Token for limited client-side access
   */
  private async getAuthToken(forceApiKey: boolean = false): Promise<{ token: string; type: PluggyTokenType }> {
    if (forceApiKey) {
      const apiKey = await this.authenticateWithCredentials();
      return { token: apiKey, type: PluggyTokenType.API_KEY };
    }

    // For backwards compatibility, default to API Key
    const apiKey = await this.authenticateWithCredentials();
    return { token: apiKey, type: PluggyTokenType.API_KEY };
  }

  // ===========================================
  // RATE LIMITING (Official Guidelines)
  // ===========================================

  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    // Clean old requests
    this.rateLimit.requestTimes = this.rateLimit.requestTimes.filter(time => time > oneMinuteAgo);
    
    // Check if we're rate limited
    if (this.rateLimit.isLimited && now < this.rateLimit.retryAfter) {
      const waitTime = this.rateLimit.retryAfter - now;
      throw new PluggyRateLimitError(
        `Rate limit exceeded. Please wait ${Math.ceil(waitTime / 1000)} seconds before retrying.`,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // Check if we've exceeded the rate limit
    if (this.rateLimit.requestTimes.length >= this.rateLimit.maxRequestsPerMinute) {
      const oldestRequest = this.rateLimit.requestTimes[0];
      const waitTime = 60000 - (now - oldestRequest);
      
      console.log(`[Pluggy] Rate limit reached (${this.rateLimit.maxRequestsPerMinute}/min), waiting ${waitTime}ms`);
      
      // Set rate limit flag
      this.rateLimit.isLimited = true;
      this.rateLimit.retryAfter = now + waitTime;
      
      throw new PluggyRateLimitError(
        `Rate limit exceeded. Maximum ${this.rateLimit.maxRequestsPerMinute} requests per minute.`,
        Math.ceil(waitTime / 1000)
      );
    }
    
    // Reset rate limit flag if we're under the limit
    this.rateLimit.isLimited = false;
    this.rateLimit.requestTimes.push(now);
  }

  // ===========================================
  // HTTP REQUEST METHODS (Enhanced Error Handling)
  // ===========================================

  private async makeRequest(endpoint: string, options: RequestInit = {}, retryCount = 0, forceApiKey = false): Promise<any> {
    try {
      const { token, type } = await this.getAuthToken(forceApiKey);
      
      await this.checkRateLimit();
      
      this.requestCount++;
      console.log(`[Pluggy] Making API request #${this.requestCount} to: ${endpoint} (attempt ${retryCount + 1}) using ${type}`);
      
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'X-API-KEY': token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'FinanceitoApp/1.0',
          ...options.headers
        }
      });

      const responseText = await response.text();
      console.log(`[Pluggy] API response status for ${endpoint}: ${response.status}`);

      // Handle rate limiting from server
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, retryCount) * 1000;
        
        this.rateLimit.isLimited = true;
        this.rateLimit.retryAfter = Date.now() + waitTime;
        
        if (retryCount < 3) {
          console.log(`[Pluggy] Rate limited by server, retrying after ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return this.makeRequest(endpoint, options, retryCount + 1, forceApiKey);
        } else {
          throw new PluggyRateLimitError(
            'Rate limit exceeded and maximum retries reached',
            Math.ceil(waitTime / 1000)
          );
        }
      }

      // Parse response with enhanced error handling
      let responseData;
      try {
        // Trim whitespace and check for empty response
        const cleanResponseText = responseText?.trim() || '';
        
        if (!cleanResponseText) {
          console.log(`[Pluggy] Empty response for ${endpoint}, treating as empty object`);
          responseData = {};
        } else {
          // Check for obvious non-JSON responses
          if (cleanResponseText.includes('<html>') || cleanResponseText.includes('<!DOCTYPE')) {
            console.error(`[Pluggy] HTML response detected for ${endpoint}`);
            throw new PluggyAuthError(
              `Pluggy API returned HTML instead of JSON for ${endpoint}. This usually indicates a server error.`,
              response.status
            );
          }
          
          // Check for multiple JSON objects (streaming response)
          if (cleanResponseText.includes('}{')) {
            console.error(`[Pluggy] Multiple JSON objects detected in response for ${endpoint}`);
            // Try to parse the first JSON object
            const firstJsonEnd = cleanResponseText.indexOf('}{') + 1;
            const firstJson = cleanResponseText.substring(0, firstJsonEnd);
            console.log(`[Pluggy] Attempting to parse first JSON object: ${firstJson.substring(0, 200)}...`);
            responseData = JSON.parse(firstJson);
          } else {
            // Normal JSON parsing
            responseData = JSON.parse(cleanResponseText);
          }
        }
      } catch (parseError) {
        console.error(`[Pluggy] Failed to parse JSON response for ${endpoint}:`, parseError);
        console.error(`[Pluggy] Response status: ${response.status}`);
        console.error(`[Pluggy] Response headers:`, Object.fromEntries(response.headers.entries()));
        console.error(`[Pluggy] Raw response text (first 500 chars):`, responseText?.substring(0, 500));
        console.error(`[Pluggy] Raw response text (last 100 chars):`, responseText?.substring(-100));
        
        // Log character codes around position 4 if possible
        if (responseText && responseText.length > 4) {
          const around4 = responseText.substring(0, 10);
          console.error(`[Pluggy] Characters around position 4:`, around4.split('').map((c, i) => `${i}: '${c}' (${c.charCodeAt(0)})`));
        }
        
        throw new PluggyAuthError(
          `Invalid JSON response from Pluggy ${endpoint}. Parse error: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
          response.status
        );
      }

      // Handle 401 errors by clearing token cache and retrying once
      if (response.status === 401 && retryCount === 0) {
        console.log('[Pluggy] Received 401 error, clearing token cache and retrying...');
        this.apiKey = undefined;
        this.apiKeyExpiresAt = undefined;
        this.connectToken = undefined;
        this.connectTokenExpiresAt = undefined;
        return this.makeRequest(endpoint, options, retryCount + 1, forceApiKey);
      }

      // Handle 403 errors (forbidden)
      if (response.status === 403) {
        throw new PluggyAuthError(
          `Access forbidden to ${endpoint}. This may require additional permissions or API scope.`,
          response.status,
          responseData.code
        );
      }

      if (!response.ok) {
        console.error(`[Pluggy] API error for ${endpoint}:`, responseData);
        throw new PluggyAuthError(
          `Pluggy API error: ${responseData.message || responseData.error || 'Unknown error'}`,
          response.status,
          responseData.code
        );
      }

      return responseData;

    } catch (error) {
      if (error instanceof PluggyAuthError || error instanceof PluggyRateLimitError) {
        throw error;
      }
      console.error(`[Pluggy] Request failed for ${endpoint}:`, error);
      throw new PluggyAuthError(
        `Request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ===========================================
  // ITEM MANAGEMENT METHODS
  // ===========================================

  async getItems(): Promise<PluggyItem[]> {
    console.log('[Pluggy] Fetching items from API');
    const data = await this.makeRequest('/items', {}, 0, true); // Force API Key for full access
    const items = z.array(PluggyItemSchema).parse(data.results || []);
    console.log(`[Pluggy] Successfully fetched ${items.length} items`);
    return items;
  }

  async getItem(itemId: string): Promise<PluggyItem> {
    const data = await this.makeRequest(`/items/${itemId}`, {}, 0, true);
    return PluggyItemSchema.parse(data);
  }

  // ===========================================
  // ACCOUNT METHODS
  // ===========================================

  async getAccounts(itemId?: string): Promise<PluggyAccount[]> {
    const endpoint = itemId ? `/accounts?itemId=${itemId}` : '/accounts';
    try {
      const data = await this.makeRequest(endpoint, {}, 0, true);
      const accounts = z.array(PluggyAccountSchema).parse(data.results || []);
      return accounts;
    } catch (error) {
      console.error(`[Pluggy] Error fetching accounts for item ${itemId}:`, error);
      
      // If it's a parsing error, return empty array instead of throwing
      if (error instanceof Error && (error.message.includes('JSON') || error.message.includes('parse'))) {
        console.log(`[Pluggy] JSON parsing error for accounts, returning empty array`);
        return [];
      }
      
      throw error;
    }
  }

  async getAccount(accountId: string): Promise<PluggyAccount> {
    const data = await this.makeRequest(`/accounts/${accountId}`, {}, 0, true);
    return PluggyAccountSchema.parse(data);
  }

  // ===========================================
  // TRANSACTION METHODS
  // ===========================================

  async getTransactions(params: Partial<TransactionSearchParams> & { accountId: string }): Promise<{
    transactions: PluggyTransaction[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  }> {
    const searchParams = new URLSearchParams();
    
    if (params.accountId) searchParams.append('accountId', params.accountId);
    if (params.from) searchParams.append('from', params.from);
    if (params.to) searchParams.append('to', params.to);
    if (params.categoryId) searchParams.append('categoryId', params.categoryId);
    if (params.category) searchParams.append('category', params.category);
    if (params.type) searchParams.append('type', params.type);
    if (params.amountGte !== undefined) searchParams.append('amountGte', params.amountGte.toString());
    if (params.amountLte !== undefined) searchParams.append('amountLte', params.amountLte.toString());
    if (params.description) searchParams.append('description', params.description);
    if (params.pending !== undefined) searchParams.append('pending', params.pending.toString());
    if (params.reconciled !== undefined) searchParams.append('reconciled', params.reconciled.toString());
    if (params.paymentMethod) searchParams.append('paymentMethod', params.paymentMethod);
    if (params.merchantName) searchParams.append('merchantName', params.merchantName);
    if (params.tags) params.tags.forEach(tag => searchParams.append('tags', tag));
    
    searchParams.append('page', (params.page || 1).toString());
    searchParams.append('pageSize', (params.pageSize || 100).toString());

    const data = await this.makeRequest(`/transactions?${searchParams.toString()}`, {}, 0, true);
    const transactions = z.array(PluggyTransactionSchema).parse(data.results || []);
    
    return {
      transactions,
      totalCount: data.totalCount || data.total || transactions.length,
      page: data.page || params.page || 1,
      pageSize: data.pageSize || params.pageSize || 100,
      hasNextPage: data.hasNextPage || false
    };
  }

  async getAllItemTransactions(itemId: string, from?: string, to?: string): Promise<PluggyTransaction[]> {
    console.log(`[Pluggy] Fetching all transactions for item ${itemId} from ${from || 'beginning'} to ${to || 'now'}`);
    
    const accounts = await this.getAccounts(itemId);
    const allTransactions: PluggyTransaction[] = [];
    
    console.log(`[Pluggy] Found ${accounts.length} accounts for item ${itemId}`);
    
    for (const account of accounts) {
      try {
        console.log(`[Pluggy] Fetching transactions for account ${account.id} (${account.name})`);
        const result = await this.getTransactions({
          accountId: account.id,
          from,
          to,
          pageSize: 500
        });
        console.log(`[Pluggy] Found ${result.transactions.length} transactions for account ${account.id}`);
        allTransactions.push(...result.transactions);
      } catch (error) {
        console.error(`[Pluggy] Failed to fetch transactions for account ${account.id}:`, error);
        // Continue with other accounts even if one fails
      }
    }
    
    console.log(`[Pluggy] Total transactions fetched for item ${itemId}: ${allTransactions.length}`);
    return allTransactions;
  }

  // ===========================================
  // CREDIT CARD METHODS
  // ===========================================

  async getCreditCardBills(accountId: string, from?: string, to?: string): Promise<PluggyCreditCardBill[]> {
    let endpoint = `/credit_card_bills?accountId=${accountId}`;
    if (from) endpoint += `&from=${from}`;
    if (to) endpoint += `&to=${to}`;
    
    try {
      const data = await this.makeRequest(endpoint, {}, 0, true);
      return z.array(PluggyCreditCardBillSchema).parse(data.results || []);
    } catch (error: any) {
      if (error instanceof PluggyAuthError && error.statusCode === 403) {
        console.log(`[Pluggy] Credit card bills access denied for account ${accountId}. This may require additional permissions.`);
        return [];
      }
      throw error;
    }
  }

  async getAllCreditCardBills(itemId: string, from?: string, to?: string): Promise<PluggyCreditCardBill[]> {
    console.log(`[Pluggy] Fetching all credit card bills for item ${itemId} from ${from || 'beginning'} to ${to || 'now'}`);
    
    const accounts = await this.getAccounts(itemId);
    const allBills: PluggyCreditCardBill[] = [];
    
    // Filter only credit card accounts
    const creditCardAccounts = accounts.filter(account => 
      account.type.toLowerCase().includes('credit') || 
      account.subtype.toLowerCase().includes('credit')
    );
    
    console.log(`[Pluggy] Found ${creditCardAccounts.length} credit card accounts for item ${itemId}`);
    
    for (const account of creditCardAccounts) {
      try {
        console.log(`[Pluggy] Fetching bills for credit card account ${account.id} (${account.name})`);
        const bills = await this.getCreditCardBills(account.id, from, to);
        console.log(`[Pluggy] Found ${bills.length} bills for account ${account.id}`);
        allBills.push(...bills);
      } catch (error: any) {
        console.error(`[Pluggy] Failed to fetch bills for account ${account.id}:`, error);
        if (error instanceof PluggyAuthError && error.statusCode === 403) {
          console.log(`[Pluggy] Access to credit card bills denied for account ${account.id} (${account.name}). This feature may require additional API permissions.`);
        }
      }
    }
    
    console.log(`[Pluggy] Total credit card bills fetched for item ${itemId}: ${allBills.length}`);
    return allBills;
  }

  async getCreditCardBillTransactions(billId: string): Promise<PluggyCreditCardTransaction[]> {
    const endpoint = `/credit_card_bills/${billId}/transactions`;
    try {
      const data = await this.makeRequest(endpoint, {}, 0, true);
      return z.array(PluggyCreditCardTransactionSchema).parse(data.results || []);
    } catch (error: any) {
      if (error instanceof PluggyAuthError && error.statusCode === 403) {
        console.log(`[Pluggy] Credit card bill transactions access denied for bill ${billId}. This may require additional permissions.`);
        return [];
      }
      throw error;
    }
  }

  async getAllCreditCardTransactions(itemId: string, from?: string, to?: string): Promise<{ bill: PluggyCreditCardBill; transactions: PluggyCreditCardTransaction[] }[]> {
    console.log(`[Pluggy] Fetching all credit card transactions for item ${itemId}`);
    
    const bills = await this.getAllCreditCardBills(itemId, from, to);
    const billsWithTransactions: { bill: PluggyCreditCardBill; transactions: PluggyCreditCardTransaction[] }[] = [];
    
    for (const bill of bills) {
      try {
        console.log(`[Pluggy] Fetching transactions for bill ${bill.id}`);
        const transactions = await this.getCreditCardBillTransactions(bill.id);
        console.log(`[Pluggy] Found ${transactions.length} transactions for bill ${bill.id}`);
        billsWithTransactions.push({ bill, transactions });
      } catch (error: any) {
        console.error(`[Pluggy] Failed to fetch transactions for bill ${bill.id}:`, error);
        if (error instanceof PluggyAuthError && error.statusCode === 403) {
          console.log(`[Pluggy] Access to credit card bill transactions denied for bill ${bill.id}. This feature may require additional API permissions.`);
        }
        billsWithTransactions.push({ bill, transactions: [] });
      }
    }
    
    return billsWithTransactions;
  }

  // ===========================================
  // INVESTMENT METHODS
  // ===========================================

  async getInvestments(accountId: string): Promise<PluggyInvestment[]> {
    const endpoint = `/investments?accountId=${accountId}`;
    try {
      const data = await this.makeRequest(endpoint, {}, 0, true);
      return z.array(PluggyInvestmentSchema).parse(data.results || []);
    } catch (error: any) {
      if (error instanceof PluggyAuthError && error.statusCode === 403) {
        console.log(`[Pluggy] Investments access denied for account ${accountId}. This may require additional permissions.`);
        return [];
      }
      throw error;
    }
  }

  async getAllInvestments(itemId: string): Promise<PluggyInvestment[]> {
    console.log(`[Pluggy] Fetching all investments for item ${itemId}`);
    
    const accounts = await this.getAccounts(itemId);
    const allInvestments: PluggyInvestment[] = [];
    
    // Filter only investment accounts
    const investmentAccounts = accounts.filter(account => 
      account.type.toLowerCase().includes('investment') || 
      account.subtype.toLowerCase().includes('investment') ||
      account.investmentData
    );
    
    console.log(`[Pluggy] Found ${investmentAccounts.length} investment accounts for item ${itemId}`);
    
    for (const account of investmentAccounts) {
      try {
        console.log(`[Pluggy] Fetching investments for account ${account.id} (${account.name})`);
        const investments = await this.getInvestments(account.id);
        console.log(`[Pluggy] Found ${investments.length} investments for account ${account.id}`);
        allInvestments.push(...investments);
      } catch (error: any) {
        console.error(`[Pluggy] Failed to fetch investments for account ${account.id}:`, error);
        if (error instanceof PluggyAuthError && error.statusCode === 403) {
          console.log(`[Pluggy] Access to investments denied for account ${account.id} (${account.name}). This feature may require additional API permissions.`);
        }
      }
    }
    
    console.log(`[Pluggy] Total investments fetched for item ${itemId}: ${allInvestments.length}`);
    return allInvestments;
  }

  // ===========================================
  // UTILITY METHODS
  // ===========================================

  // Health check method
  async healthCheck(): Promise<{ status: string; latency: number; authStatus: string }> {
    const startTime = Date.now();
    try {
      // Check if we can authenticate
      await this.authenticateWithCredentials();
      
      // Make a simple API call
      await this.makeRequest('/health', {}, 0, true);
      
      return {
        status: 'healthy',
        latency: Date.now() - startTime,
        authStatus: 'authenticated'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: Date.now() - startTime,
        authStatus: error instanceof PluggyAuthError ? 'authentication_failed' : 'unknown'
      };
    }
  }

  // Get current authentication status
  getAuthStatus(): { 
    hasApiKey: boolean; 
    hasConnectToken: boolean; 
    apiKeyExpiry?: Date; 
    connectTokenExpiry?: Date 
  } {
    return {
      hasApiKey: !!this.apiKey,
      hasConnectToken: !!this.connectToken,
      apiKeyExpiry: this.apiKeyExpiresAt ? new Date(this.apiKeyExpiresAt) : undefined,
      connectTokenExpiry: this.connectTokenExpiresAt ? new Date(this.connectTokenExpiresAt) : undefined
    };
  }

  // Clear all cached tokens (useful for testing or manual refresh)
  clearTokens(): void {
    console.log('[Pluggy] Clearing all cached tokens');
    this.apiKey = undefined;
    this.apiKeyExpiresAt = undefined;
    this.connectToken = undefined;
    this.connectTokenExpiresAt = undefined;
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

// Enhanced category mapping and account type detection
export function mapPluggyAccountType(account: PluggyAccount): 'checking' | 'savings' | 'credit_card' | 'loan' | 'investment' {
  const type = account.type.toLowerCase();
  const subtype = account.subtype.toLowerCase();
  
  if (type.includes('credit') || subtype.includes('credit')) {
    return 'credit_card';
  }
  
  if (type.includes('loan') || subtype.includes('financing') || subtype.includes('loan')) {
    return 'loan';
  }
  
  if (type.includes('investment') || subtype.includes('investment') || subtype.includes('fund') || account.investmentData) {
    return 'investment';
  }
  
  if (type.includes('savings') || subtype.includes('savings')) {
    return 'savings';
  }
  
  // Default to checking account
  return 'checking';
}

// Map Pluggy loan types to our loan types
export function mapPluggyLoanType(loanType: string, productSubType?: string): string {
  const type = loanType.toLowerCase();
  const subType = productSubType?.toLowerCase() || '';
  
  // Map common loan types from Pluggy
  if (type.includes('home') || type.includes('mortgage') || type.includes('real_estate') || 
      type.includes('imobiliario') || type.includes('casa') || type.includes('imovel')) {
    return 'Financiamento Imobiliário';
  }
  
  if (type.includes('car') || type.includes('vehicle') || type.includes('auto') || 
      type.includes('veiculo') || type.includes('carro') || type.includes('moto')) {
    return 'Financiamento de Veículo';
  }
  
  if (type.includes('personal') || type.includes('pessoal') || type.includes('crediario')) {
    return 'Empréstimo Pessoal';
  }
  
  if (type.includes('consignment') || type.includes('consignado') || type.includes('payroll')) {
    return 'Empréstimo Consignado';
  }
  
  if (type.includes('credit_card') || type.includes('cartao') || type.includes('card')) {
    return 'Cartão de Crédito';
  }
  
  if (type.includes('overdraft') || type.includes('cheque_especial') || type.includes('especial')) {
    return 'Cheque Especial';
  }
  
  if (type.includes('student') || type.includes('education') || type.includes('estudantil') || 
      type.includes('fies') || type.includes('educacao')) {
    return 'Financiamento Estudantil';
  }
  
  // Check sub-type for more specific mapping
  if (subType.includes('sfi') || subType.includes('sbpe')) {
    return 'Financiamento Imobiliário';
  }
  
  // Default fallback
  return 'Outros Empréstimos';
}

// Map Pluggy investment types to our investment types
export function mapPluggyInvestmentType(investmentType: string, instrumentType?: string): string {
  const type = investmentType.toLowerCase();
  const instrument = instrumentType?.toLowerCase() || '';
  
  // Map common investment types from Pluggy to our types
  if (type.includes('stock') || type.includes('equity') || instrument.includes('stock')) {
    return 'Ações';
  }
  
  if (type.includes('real_estate') || type.includes('rei') || instrument.includes('fund')) {
    return 'Fundos Imobiliários';
  }
  
  if (type.includes('treasury') || type.includes('government_bond') || type.includes('tesouro')) {
    return 'Tesouro Direto';
  }
  
  if (type.includes('cdb') || type.includes('certificate_of_deposit')) {
    return 'CDB';
  }
  
  if (type.includes('lci') || type.includes('lca') || type.includes('real_estate_certificate')) {
    return 'LCI/LCA';
  }
  
  if (type.includes('savings') || type.includes('poupanca')) {
    return 'Poupança';
  }
  
  if (type.includes('fund') || type.includes('mutual_fund') || instrument.includes('fund')) {
    return 'Fundos de Investimento';
  }
  
  if (type.includes('crypto') || type.includes('bitcoin') || type.includes('cryptocurrency')) {
    return 'Criptomoedas';
  }
  
  // Default fallback
  return 'Outros';
}

// Enhanced category mapping with AI-like intelligence
export function mapPluggyCategory(transaction: PluggyTransaction): string {
  const category = transaction.category?.toLowerCase() || '';
  const description = (transaction.description || '').toLowerCase();
  const merchant = transaction.merchant?.name?.toLowerCase() || '';
  const amount = Math.abs(transaction.amount);
  const mcc = transaction.merchant?.mcc || '';

  // Merchant Category Code (MCC) based categorization
  if (mcc) {
    const mccMapping: Record<string, string> = {
      // Food and dining
      '5411': 'Alimentação', // Grocery stores
      '5812': 'Alimentação', // Eating places
      '5814': 'Alimentação', // Fast food
      '5499': 'Alimentação', // Miscellaneous food stores
      // Transportation
      '5541': 'Transporte', // Service stations
      '5542': 'Transporte', // Automated fuel dispensers
      '4121': 'Transporte', // Taxicabs and limousines
      '4131': 'Transporte', // Bus lines
      // Shopping
      '5311': 'Compras', // Department stores
      '5331': 'Compras', // Variety stores
      '5651': 'Compras', // Family clothing stores
      '5732': 'Compras', // Electronics stores
      // Entertainment
      '5813': 'Entretenimento', // Drinking places
      '7832': 'Entretenimento', // Motion picture theaters
      '7999': 'Entretenimento', // Recreation services
      // Utilities and services
      '4814': 'Contas e Serviços', // Telecommunication services
      '4900': 'Contas e Serviços', // Utilities
      '6300': 'Contas e Serviços', // Insurance
      // Healthcare
      '8011': 'Saúde', // Doctors
      '8021': 'Saúde', // Dentists
      '5912': 'Saúde', // Drug stores
      // Travel
      '3000-3299': 'Viagem', // Airlines
      '7011': 'Viagem', // Hotels and motels
      // Education
      '8220': 'Educação', // Colleges and universities
      '8299': 'Educação', // Schools and educational services
    };
    
    if (mccMapping[mcc]) {
      return mccMapping[mcc];
    }
  }

  // Enhanced merchant name recognition
  const merchantPatterns = {
    'Alimentação': [
      'mcdonalds', 'burger king', 'kfc', 'subway', 'pizza hut', 'dominos', 'starbucks',
      'restaurante', 'lanchonete', 'padaria', 'mercado', 'supermercado', 'açougue',
      'hortifruti', 'ifood', 'uber eats', 'rappi', 'deliveroo'
    ],
    'Compras': [
      'amazon', 'mercado livre', 'magazine luiza', 'casas bahia', 'extra', 'carrefour',
      'americanas', 'submarino', 'shoptime', 'zara', 'hm', 'centauro', 'netshoes',
      'shopping', 'loja', 'farmacia', 'drogaria'
    ],
    'Transporte': [
      'uber', '99', 'taxi', '99pay', 'shell', 'petrobras', 'ipiranga', 'ale',
      'posto', 'combustivel', 'metro', 'cptm', 'onibus', 'bilhete unico',
      'sem parar', 'autopass', 'conectcar'
    ],
    'Entretenimento': [
      'netflix', 'spotify', 'amazon prime', 'disney', 'globoplay', 'youtube',
      'cinema', 'teatro', 'show', 'ingresso', 'bar', 'balada', 'festa'
    ],
    'Contas e Serviços': [
      'claro', 'vivo', 'tim', 'oi', 'internet', 'telefone', 'energia',
      'sabesp', 'agua', 'luz', 'gas', 'condominio', 'iptu', 'ipva',
      'seguro', 'bradesco seguros', 'porto seguro'
    ]
  };

  // Check merchant patterns
  for (const [categoryName, patterns] of Object.entries(merchantPatterns)) {
    if (patterns.some(pattern => merchant.includes(pattern) || description.includes(pattern))) {
      return categoryName;
    }
  }

  // PIX and transfer detection
  if (description.includes('pix') || description.includes('ted') || description.includes('transferencia') ||
      transaction.paymentData?.paymentMethod?.toLowerCase().includes('pix')) {
    
    // Check if it's a payment to a business (likely an expense)
    if (transaction.paymentData?.payee?.name && !transaction.paymentData.payee.name.toLowerCase().includes('pessoa fisica')) {
      return 'Compras'; // Business payments are likely purchases
    }
    
    // Large transfers are likely not categorizable expenses
    if (amount > 1000) {
      return 'Outros';
    }
    
    return 'Outros';
  }

  // Category-based mapping with enhanced keywords
  const categoryMappings = {
    'Alimentação': [
      'food', 'dining', 'restaurant', 'grocery', 'supermarket', 'market',
      'alimentacao', 'restaurante', 'lanchonete', 'mercado', 'supermercado',
      'padaria', 'acougue', 'hortifruti', 'delivery'
    ],
    'Transporte': [
      'transportation', 'gas', 'fuel', 'parking', 'toll', 'automotive',
      'transporte', 'combustivel', 'gasolina', 'etanol', 'diesel',
      'estacionamento', 'pedagio', 'manutencao', 'oficina'
    ],
    'Compras': [
      'shopping', 'retail', 'store', 'purchase', 'clothing', 'electronics',
      'compras', 'loja', 'varejo', 'roupas', 'calcados', 'eletronicos',
      'casa', 'decoracao', 'moveis'
    ],
    'Entretenimento': [
      'entertainment', 'recreation', 'movie', 'music', 'gaming', 'streaming',
      'entretenimento', 'diversao', 'cinema', 'musica', 'jogo', 'lazer',
      'festa', 'balada', 'show'
    ],
    'Contas e Serviços': [
      'bills', 'utilities', 'services', 'insurance', 'subscription', 'fee',
      'contas', 'servicos', 'utilidades', 'seguro', 'assinatura', 'taxa',
      'tarifa', 'anuidade', 'manutencao'
    ],
    'Saúde': [
      'health', 'medical', 'pharmacy', 'doctor', 'hospital', 'dental',
      'saude', 'medico', 'farmacia', 'clinica', 'hospital', 'laboratorio',
      'consulta', 'exame', 'medicamento'
    ],
    'Viagem': [
      'travel', 'hotel', 'flight', 'airline', 'accommodation', 'tourism',
      'viagem', 'hotel', 'pousada', 'voo', 'passagem', 'turismo',
      'hospedagem', 'booking', 'decolar'
    ],
    'Educação': [
      'education', 'school', 'university', 'course', 'training', 'learning',
      'educacao', 'escola', 'universidade', 'faculdade', 'curso',
      'treinamento', 'aula', 'material'
    ],
    'Cuidados Pessoais': [
      'personal', 'beauty', 'salon', 'cosmetics', 'hygiene', 'grooming',
      'beleza', 'salao', 'barbearia', 'estetica', 'cosmeticos',
      'perfumaria', 'higiene', 'cuidados'
    ]
  };

  // Check category mappings
  for (const [categoryName, keywords] of Object.entries(categoryMappings)) {
    if (keywords.some(keyword => 
      category.includes(keyword) || 
      description.includes(keyword) || 
      merchant.includes(keyword)
    )) {
      return categoryName;
    }
  }

  // Amount-based heuristics
  if (amount > 5000) {
    // Very large amounts are likely transfers or major purchases
    return 'Outros';
  }

  if (amount < 5) {
    // Very small amounts might be fees or tips
    return 'Contas e Serviços';
  }

  // Default fallback
  return 'Outros';
}

// Enhanced transaction deduplication
export function generateTransactionHash(transaction: PluggyTransaction): string {
  // Create a more comprehensive hash for better duplicate detection
  const hashComponents = [
    transaction.accountId,
    Math.round(transaction.amount * 100), // Round to avoid floating point issues
    transaction.date.split('T')[0], // Use only date part
    (transaction.description || '').substring(0, 50), // First 50 chars of description
    transaction.merchant?.name || '',
    transaction.paymentData?.endToEndId || '', // PIX end-to-end ID
    transaction.creditCardMetadata?.purchaseId || ''
  ];
  
  const hashInput = hashComponents.join('|');
  return btoa(hashInput).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
}

// Enhanced transaction validation
export function isValidExpenseTransaction(transaction: PluggyTransaction): boolean {
  // Only import debit transactions (expenses) unless specifically income
  if (transaction.amount >= 0 && transaction.type !== 'income') return false;
  
  // Skip very old transactions (older than 2 years)
  const transactionDate = new Date(transaction.date);
  const twoYearsAgo = new Date();
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
  if (transactionDate < twoYearsAgo) return false;
  
  // Skip future transactions (likely to be scheduled/pending)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (transactionDate > tomorrow) return false;
  
  // Skip transactions without proper description
  if (!transaction.description || transaction.description.trim().length < 3) return false;
  
  // Skip internal transfers between own accounts (if detectable)
  if (transaction.type === 'transfer' && 
      transaction.paymentData?.payer?.name === transaction.paymentData?.payee?.name) {
    return false;
  }
  
  // Skip pending transactions if specified
  if (transaction.pending === true) return false;
  
  return true;
}

// Transaction enrichment helper
export function enrichTransaction(transaction: PluggyTransaction): PluggyTransaction & {
  enrichedCategory: string;
  isRecurring: boolean;
  tags: string[];
  risk: 'low' | 'medium' | 'high';
} {
  const enrichedCategory = mapPluggyCategory(transaction);
  
  // Detect recurring transactions
  const isRecurring = !!(
    transaction.creditCardMetadata?.totalInstallments && 
    transaction.creditCardMetadata.totalInstallments > 1
  );
  
  // Auto-generate tags
  const tags: string[] = [];
  if (transaction.merchant?.name) tags.push('merchant');
  if (transaction.paymentData?.paymentMethod?.includes('pix')) tags.push('pix');
  if (transaction.creditCardMetadata) tags.push('credit-card');
  if (transaction.location) tags.push('location');
  if (Math.abs(transaction.amount) > 1000) tags.push('large-amount');
  if (isRecurring) tags.push('recurring');
  
  // Risk assessment
  let risk: 'low' | 'medium' | 'high' = 'low';
  if (Math.abs(transaction.amount) > 5000) risk = 'high';
  else if (Math.abs(transaction.amount) > 1000) risk = 'medium';
  if (transaction.merchant?.name?.toLowerCase().includes('unknown')) risk = 'high';
  
  return {
    ...transaction,
    enrichedCategory,
    isRecurring,
    tags,
    risk
  };
}
