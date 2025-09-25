import { useState, useEffect } from 'react';
import { Search, Filter, CheckSquare, Calendar, DollarSign, CreditCard, TrendingUp, Edit2, Trash2, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';

interface Transaction {
  id: number;
  account_id?: number;
  account_name?: string;
  account_type?: string;
  amount: number;
  description: string;
  category: string;
  transaction_type: 'income' | 'expense' | 'transfer';
  date: string;
  merchant_name?: string;
  tags?: string[];
  notes?: string;
  reconciled?: boolean;
  status?: string;
  balance_after?: number;
  is_synced_from_bank?: boolean;
  created_at: string;
  updated_at: string;
}

interface TransactionFilters {
  accountId?: string;
  from?: string;
  to?: string;
  category?: string;
  type?: string;
  amountGte?: number;
  amountLte?: number;
  description?: string;
  merchantName?: string;
  reconciled?: boolean;
  tags?: string[];
}

interface BulkOperation {
  operation: 'categorize' | 'tag' | 'reconcile' | 'delete';
  transactionIds: string[];
  params?: {
    category?: string;
    tags?: string[];
    reconciled?: boolean;
  };
}

interface Analytics {
  totalTransactions: number;
  totalAmount: number;
  averageAmount: number;
  categoryBreakdown: Array<{
    category: string;
    totalAmount: number;
    transactionCount: number;
    percentage: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    totalAmount: number;
    transactionCount: number;
  }>;
  topMerchants: Array<{
    merchant_name: string;
    totalAmount: number;
    transactionCount: number;
  }>;
}

const TRANSACTION_CATEGORIES = [
  'Alimentação', 'Transporte', 'Compras', 'Entretenimento', 
  'Contas e Serviços', 'Saúde', 'Viagem', 'Educação', 
  'Cuidados Pessoais', 'Outros'
];

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [bulkOperating, setBulkOperating] = useState(false);

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      params.append('page', currentPage.toString());
      params.append('pageSize', '50');

      const response = await apiFetch(`/api/transactions?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      // Set empty state on error
      setTransactions([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics
  const fetchAnalytics = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.accountId) params.append('accountId', filters.accountId);
      if (filters.from) params.append('from', filters.from);
      if (filters.to) params.append('to', filters.to);

      const response = await apiFetch(`/api/transactions/analytics?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Erro ao buscar analytics:', error);
      // Set null analytics on error
      setAnalytics(null);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters, currentPage]);

  useEffect(() => {
    fetchAnalytics();
  }, [filters]);

  // Handle bulk operations
  const handleBulkOperation = async (operation: BulkOperation) => {
    if (selectedTransactions.size === 0) return;

    try {
      setBulkOperating(true);
      const response = await apiFetch('/api/transactions/bulk', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operation: operation.operation,
          transactionIds: Array.from(selectedTransactions),
          params: operation.params
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setSelectedTransactions(new Set());
      fetchTransactions();
      fetchAnalytics();
    } catch (error) {
      console.error('Erro na operação em lote:', error);
    } finally {
      setBulkOperating(false);
    }
  };

  // Auto-categorize transaction
  const autoCategorizeTransaction = async (transactionId: number) => {
    try {
      const response = await apiFetch(`/api/transactions/${transactionId}/categorize`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchTransactions();
      fetchAnalytics();
    } catch (error) {
      console.error('Erro na categorização automática:', error);
    }
  };

  // Update transaction
  const updateTransaction = async (id: number, updates: Partial<Transaction>) => {
    try {
      const response = await apiFetch(`/api/transactions/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setEditingTransaction(null);
      fetchTransactions();
      fetchAnalytics();
    } catch (error) {
      console.error('Erro ao atualizar transação:', error);
    }
  };

  // Delete transaction
  const deleteTransaction = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    try {
      const response = await apiFetch(`/api/transactions/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      fetchTransactions();
      fetchAnalytics();
    } catch (error) {
      console.error('Erro ao excluir transação:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Math.abs(amount));
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income': return 'text-green-600';
      case 'expense': return 'text-red-600';
      case 'transfer': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alimentação': 'bg-red-100 text-red-800',
      'Transporte': 'bg-blue-100 text-blue-800',
      'Compras': 'bg-purple-100 text-purple-800',
      'Entretenimento': 'bg-green-100 text-green-800',
      'Contas e Serviços': 'bg-yellow-100 text-yellow-800',
      'Saúde': 'bg-pink-100 text-pink-800',
      'Viagem': 'bg-indigo-100 text-indigo-800',
      'Educação': 'bg-cyan-100 text-cyan-800',
      'Cuidados Pessoais': 'bg-rose-100 text-rose-800',
      'Outros': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header with Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <CreditCard className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Transações</p>
                <p className="text-xl font-bold text-gray-900">{analytics.totalTransactions}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.totalAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg">
                <TrendingUp className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Valor Médio</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(analytics.averageAmount)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Calendar className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Meses Analisados</p>
                <p className="text-xl font-bold text-gray-900">{analytics.monthlyTrends.length}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
            </button>
            
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar transações..."
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.description || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedTransactions.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedTransactions.size} selecionadas
                </span>
                
                <select
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  onChange={(e) => {
                    const [operation, param] = e.target.value.split(':');
                    if (operation === 'categorize') {
                      handleBulkOperation({
                        operation: 'categorize',
                        transactionIds: Array.from(selectedTransactions),
                        params: { category: param }
                      });
                    } else if (operation === 'reconcile') {
                      handleBulkOperation({
                        operation: 'reconcile',
                        transactionIds: Array.from(selectedTransactions),
                        params: { reconciled: param === 'true' }
                      });
                    }
                    e.target.value = '';
                  }}
                  disabled={bulkOperating}
                >
                  <option value="">Ações em lote</option>
                  <optgroup label="Categorizar">
                    {TRANSACTION_CATEGORIES.map(cat => (
                      <option key={cat} value={`categorize:${cat}`}>{cat}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Reconciliar">
                    <option value="reconcile:true">Marcar como reconciliado</option>
                    <option value="reconcile:false">Desmarcar reconciliação</option>
                  </optgroup>
                </select>
              </div>
            )}

            <button
              onClick={fetchTransactions}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Atualizar
            </button>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.from || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.to || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.category || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Todas as categorias</option>
                {TRANSACTION_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.type || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Todos os tipos</option>
                <option value="income">Receita</option>
                <option value="expense">Despesa</option>
                <option value="transfer">Transferência</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Mínimo</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.amountGte || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountGte: parseFloat(e.target.value) || undefined }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor Máximo</label>
              <input
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={filters.amountLte || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, amountLte: parseFloat(e.target.value) || undefined }))}
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhuma transação encontrada</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTransactions.size === transactions.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTransactions(new Set(transactions.map(t => t.id.toString())));
                        } else {
                          setSelectedTransactions(new Set());
                        }
                      }}
                      className="rounded"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedTransactions.has(transaction.id.toString())}
                        onChange={(e) => {
                          const newSelected = new Set(selectedTransactions);
                          if (e.target.checked) {
                            newSelected.add(transaction.id.toString());
                          } else {
                            newSelected.delete(transaction.id.toString());
                          }
                          setSelectedTransactions(newSelected);
                        }}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {formatDate(transaction.date)}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                        {transaction.merchant_name && (
                          <p className="text-xs text-gray-500">{transaction.merchant_name}</p>
                        )}
                        {transaction.is_synced_from_bank && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Sincronizado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(transaction.category)}`}>
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-sm font-medium ${getTransactionTypeColor(transaction.transaction_type)}`}>
                        {transaction.transaction_type === 'income' ? '+' : transaction.transaction_type === 'expense' ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {transaction.account_name || 'Manual'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {transaction.reconciled && (
                          <CheckSquare className="w-4 h-4 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {transaction.status || 'completed'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => autoCategorizeTransaction(transaction.id)}
                          className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                          title="Categorizar automaticamente"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => setEditingTransaction(transaction)}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteTransaction(transaction.id)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Página {currentPage} de {totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-200 rounded disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Editar Transação</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  value={editingTransaction.description}
                  onChange={(e) => setEditingTransaction({...editingTransaction, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={editingTransaction.category}
                  onChange={(e) => setEditingTransaction({...editingTransaction, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {TRANSACTION_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comerciante</label>
                <input
                  type="text"
                  value={editingTransaction.merchant_name || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, merchant_name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                <textarea
                  value={editingTransaction.notes || ''}
                  onChange={(e) => setEditingTransaction({...editingTransaction, notes: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="reconciled"
                  checked={editingTransaction.reconciled || false}
                  onChange={(e) => setEditingTransaction({...editingTransaction, reconciled: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="reconciled" className="ml-2 text-sm text-gray-700">
                  Reconciliado
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setEditingTransaction(null)}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => updateTransaction(editingTransaction.id, {
                  description: editingTransaction.description,
                  category: editingTransaction.category,
                  merchant_name: editingTransaction.merchant_name,
                  notes: editingTransaction.notes,
                  reconciled: editingTransaction.reconciled
                })}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
