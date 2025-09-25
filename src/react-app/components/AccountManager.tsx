import { useState, useEffect } from 'react';
import {
  Plus,
  Building2,
  CreditCard,
  Wallet,
  TrendingUp,
  Banknote,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { Account, CreateAccount } from '@/shared/types';
import {
  bankOptionsForForm,
  getBankVisualConfig,
} from '@/react-app/components/brand/FinancialBrandAssets';

const ACCOUNT_TYPE_ICONS = {
  checking: Wallet,
  savings: Building2,
  credit_card: CreditCard,
  loan: Banknote,
  investment: TrendingUp,
};

const ACCOUNT_TYPE_LABELS = {
  checking: 'Conta Corrente',
  savings: 'Poupança',
  credit_card: 'Cartão de Crédito',
  loan: 'Empréstimo',
  investment: 'Investimento',
};

const ACCOUNT_TYPE_COLORS = {
  checking: 'from-blue-500 to-blue-600',
  savings: 'from-green-500 to-green-600',
  credit_card: 'from-red-500 to-red-600',
  loan: 'from-orange-500 to-orange-600',
  investment: 'from-purple-500 to-purple-600',
};

export default function AccountManager() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [syncingAccounts, setSyncingAccounts] = useState<Set<number>>(new Set());
  const [showBalances, setShowBalances] = useState(false);
  const [formData, setFormData] = useState<CreateAccount>({
    name: '',
    account_type: 'checking',
    account_subtype: '',
    institution_name: '',
    balance: 0,
    sync_enabled: true,
  });

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/accounts');
      const data = await response.json();
      setAccounts(data.accounts || []);
    } catch (error) {
      console.error('Erro ao buscar contas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      account_type: 'checking',
      account_subtype: '',
      institution_name: '',
      balance: 0,
      sync_enabled: true,
    });
    setEditingAccount(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAccount ? `/api/accounts/${editingAccount.id}` : '/api/accounts';
      const method = editingAccount ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchAccounts();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account: Account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      account_type: account.account_type,
      account_subtype: account.account_subtype || '',
      institution_name: account.institution_name || '',
      balance: account.balance,
      sync_enabled: account.sync_enabled,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta conta?')) return;

    try {
      const response = await apiFetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
    }
  };

  const syncPluggyAccounts = async () => {
    try {
      setSyncingAccounts(new Set([...Array(accounts.length).keys()]));
      const response = await apiFetch('/api/accounts/sync-pluggy', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchAccounts();
      }
    } catch (error) {
      console.error('Erro ao sincronizar contas:', error);
    } finally {
      setSyncingAccounts(new Set());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatLastSync = (lastSyncAt: string | null) => {
    if (!lastSyncAt) return 'Nunca sincronizada';
    
    const date = new Date(lastSyncAt);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  // Calculate totals by account type
  const accountsByType = accounts.reduce((acc, account) => {
    if (!acc[account.account_type]) {
      acc[account.account_type] = [];
    }
    acc[account.account_type].push(account);
    return acc;
  }, {} as Record<string, Account[]>);

  const totalsByType = Object.entries(accountsByType).reduce((acc, [type, typeAccounts]) => {
    acc[type] = typeAccounts.reduce((sum, account) => sum + account.balance, 0);
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.entries(ACCOUNT_TYPE_LABELS).map(([type, label]) => {
          const Icon = ACCOUNT_TYPE_ICONS[type as keyof typeof ACCOUNT_TYPE_ICONS];
          const count = accountsByType[type]?.length || 0;
          const total = totalsByType[type] || 0;
          const colorClass = ACCOUNT_TYPE_COLORS[type as keyof typeof ACCOUNT_TYPE_COLORS];
          
          return (
            <div key={type} className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`bg-gradient-to-br ${colorClass} p-2 rounded-lg`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-medium text-gray-600">{label}</span>
              </div>
              <div className="space-y-1">
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">
                  {showBalances ? formatCurrency(total) : '••••••'}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Contas Financeiras</h2>
              <p className="text-gray-600">Gerencie todas suas contas em um só lugar</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {showBalances ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {showBalances ? 'Ocultar' : 'Mostrar'} Saldos
            </button>
            <button
              onClick={syncPluggyAccounts}
              disabled={syncingAccounts.size > 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${syncingAccounts.size > 0 ? 'animate-spin' : ''}`} />
              Sincronizar Pluggy
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nova Conta
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Conta
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Conta Corrente Banco do Brasil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta
                </label>
                <select
                  value={formData.account_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_type: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instituição
                </label>
                <input
                  type="text"
                  value={formData.institution_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, institution_name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Banco do Brasil, Nubank, Itaú"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-700">Escolha uma instituição</p>
                  <span className="text-xs uppercase tracking-[0.3em] text-gray-400">Opcional</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {bankOptionsForForm.map(option => {
                    const Logo = option.logo;
                    const isSelected = option.keywords.some(keyword =>
                      formData.institution_name?.toLowerCase().includes(keyword)
                    );

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, institution_name: option.label }))}
                        className={`group relative flex flex-col items-center gap-3 rounded-2xl border px-3 py-3 transition ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-sm'
                            : 'border-gray-200 bg-white hover:border-blue-200 hover:bg-blue-50/60'
                        }`}
                      >
                        <span
                          className={`flex h-16 w-full items-center justify-center rounded-2xl bg-gradient-to-br ${option.badgeGradient} text-white shadow-inner`}
                        >
                          <Logo className="h-8 text-white" />
                        </span>
                        <span className="text-sm font-medium text-gray-700">{option.label}</span>
                        {isSelected && (
                          <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg">
                            <Check className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.sync_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, sync_enabled: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Habilitar sincronização automática</span>
                </label>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : editingAccount ? 'Atualizar' : 'Adicionar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="space-y-5">
          {accounts.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma conta cadastrada</h3>
              <p className="text-gray-600">Adicione suas contas para organizar melhor suas finanças.</p>
            </div>
          ) : (
            accounts.map((account) => {
              const Icon = ACCOUNT_TYPE_ICONS[account.account_type];
              const bankVisual = getBankVisualConfig(
                account.institution_name || account.marketing_name || account.name
              );
              const BankLogo = bankVisual.logo;
              const hasCustomBank = bankVisual.id !== 'default';
              const institutionDisplay = account.institution_name || (hasCustomBank ? bankVisual.label : null);
              return (
                <div
                  key={account.id}
                  className={`rounded-4xl border border-slate-200 bg-white/90 p-6 shadow-lg transition ${
                    account.is_active ? '' : 'opacity-60'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-center justify-center">
                          {hasCustomBank ? (
                            <span
                              className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${bankVisual.badgeGradient} text-white shadow-inner`}
                            >
                              <BankLogo className="h-9 text-white" />
                            </span>
                          ) : (
                            <span
                              className={`flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br ${ACCOUNT_TYPE_COLORS[account.account_type]} text-white shadow-inner`}
                            >
                              <Icon className="h-7 w-7 text-white" />
                            </span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{account.name}</h3>
                          {account.marketing_name && account.marketing_name !== account.name && (
                            <p className="text-sm text-blue-600">{account.marketing_name}</p>
                          )}
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                            <span>{ACCOUNT_TYPE_LABELS[account.account_type]}</span>
                            {institutionDisplay && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="font-medium text-gray-700">{institutionDisplay}</span>
                              </>
                            )}
                            {account.pluggy_account_id && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600">
                                <Check className="h-3.5 w-3.5" /> Pluggy conectado
                              </span>
                            )}
                          </div>
                          {account.number && (
                            <p className="text-xs text-gray-500">Número: {account.number}</p>
                          )}
                          {account.owner && (
                            <p className="text-xs text-gray-500">Titular: {account.owner}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            {showBalances ? formatCurrency(account.balance) : '••••••'}
                          </p>
                          {account.last_sync_at && (
                            <p className="text-xs text-gray-500">
                              Sync: {formatLastSync(account.last_sync_at)}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(account)}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Account Type Specific Details */}
                    {account.account_type === 'credit_card' && account.credit_limit && showBalances && (
                      <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                        <h4 className="font-semibold text-red-900 mb-2">Detalhes do Cartão</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          {account.credit_brand && (
                            <div>
                              <span className="text-red-600 font-medium">Bandeira:</span>
                              <p className="text-red-800">{account.credit_brand}</p>
                            </div>
                          )}
                          {account.credit_level && (
                            <div>
                              <span className="text-red-600 font-medium">Categoria:</span>
                              <p className="text-red-800">{account.credit_level}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-red-600 font-medium">Limite:</span>
                            <p className="text-red-800">{formatCurrency(account.credit_limit)}</p>
                          </div>
                          {account.available_credit_limit && (
                            <div>
                              <span className="text-red-600 font-medium">Disponível:</span>
                              <p className="text-red-800">{formatCurrency(account.available_credit_limit)}</p>
                            </div>
                          )}
                          {account.minimum_payment && (
                            <div>
                              <span className="text-red-600 font-medium">Pagamento mín.:</span>
                              <p className="text-red-800">{formatCurrency(account.minimum_payment)}</p>
                            </div>
                          )}
                          {account.balance_due_date && (
                            <div>
                              <span className="text-red-600 font-medium">Vencimento:</span>
                              <p className="text-red-800">{new Date(account.balance_due_date).toLocaleDateString('pt-BR')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {account.account_type === 'loan' && account.principal_amount && showBalances && (
                      <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                        <h4 className="font-semibold text-orange-900 mb-2">Detalhes do Empréstimo</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-orange-600 font-medium">Valor original:</span>
                            <p className="text-orange-800">{formatCurrency(account.principal_amount)}</p>
                          </div>
                          {account.outstanding_balance && (
                            <div>
                              <span className="text-orange-600 font-medium">Saldo devedor:</span>
                              <p className="text-orange-800">{formatCurrency(account.outstanding_balance)}</p>
                            </div>
                          )}
                          {account.installment_amount && (
                            <div>
                              <span className="text-orange-600 font-medium">Valor parcela:</span>
                              <p className="text-orange-800">{formatCurrency(account.installment_amount)}</p>
                            </div>
                          )}
                          {account.loan_interest_rate && (
                            <div>
                              <span className="text-orange-600 font-medium">Taxa juros:</span>
                              <p className="text-orange-800">{account.loan_interest_rate}% a.m.</p>
                            </div>
                          )}
                          {account.remaining_installments && (
                            <div>
                              <span className="text-orange-600 font-medium">Parcelas restantes:</span>
                              <p className="text-orange-800">{account.remaining_installments}/{account.total_installments || '?'}</p>
                            </div>
                          )}
                          {account.maturity_date && (
                            <div>
                              <span className="text-orange-600 font-medium">Vencimento final:</span>
                              <p className="text-orange-800">{new Date(account.maturity_date).toLocaleDateString('pt-BR')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {account.account_type === 'investment' && account.investment_type && showBalances && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                        <h4 className="font-semibold text-purple-900 mb-2">Detalhes do Investimento</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-purple-600 font-medium">Tipo:</span>
                            <p className="text-purple-800">{account.investment_type}</p>
                          </div>
                          {account.product_name && (
                            <div>
                              <span className="text-purple-600 font-medium">Produto:</span>
                              <p className="text-purple-800">{account.product_name}</p>
                            </div>
                          )}
                          {account.portfolio_value && (
                            <div>
                              <span className="text-purple-600 font-medium">Valor carteira:</span>
                              <p className="text-purple-800">{formatCurrency(account.portfolio_value)}</p>
                            </div>
                          )}
                          {account.investment_rate && (
                            <div>
                              <span className="text-purple-600 font-medium">Taxa:</span>
                              <p className="text-purple-800">{account.investment_rate}% {account.rate_type || ''}</p>
                            </div>
                          )}
                          {account.quantity && account.unit_price && (
                            <div>
                              <span className="text-purple-600 font-medium">Quantidade:</span>
                              <p className="text-purple-800">{account.quantity} @ {formatCurrency(account.unit_price)}</p>
                            </div>
                          )}
                          {account.investment_maturity_date && (
                            <div>
                              <span className="text-purple-600 font-medium">Vencimento:</span>
                              <p className="text-purple-800">{new Date(account.investment_maturity_date).toLocaleDateString('pt-BR')}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {(account.account_type === 'checking' || account.account_type === 'savings') && account.transfer_number && showBalances && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                        <h4 className="font-semibold text-blue-900 mb-2">Detalhes da Conta</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-blue-600 font-medium">Nº transferência:</span>
                            <p className="text-blue-800">{account.transfer_number}</p>
                          </div>
                          {account.closing_balance !== null && (
                            <div>
                              <span className="text-blue-600 font-medium">Saldo final:</span>
                              <p className="text-blue-800">{formatCurrency(account.closing_balance)}</p>
                            </div>
                          )}
                          {account.automatically_invested_balance && (
                            <div>
                              <span className="text-blue-600 font-medium">Aplicação automática:</span>
                              <p className="text-blue-800">{formatCurrency(account.automatically_invested_balance)}</p>
                            </div>
                          )}
                          {account.overdraft_contracted_limit && (
                            <div>
                              <span className="text-blue-600 font-medium">Limite especial:</span>
                              <p className="text-blue-800">{formatCurrency(account.overdraft_contracted_limit)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
