import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, FileText, Eye, EyeOff, RefreshCw, Info } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { CreditCardBill, CreditCardTransaction } from '@/shared/types';
import PluggyPermissionsInfo from './PluggyPermissionsInfo';

const BILL_STATUS_COLORS = {
  open: 'bg-blue-100 text-blue-800',
  closed: 'bg-gray-100 text-gray-800',
  paid: 'bg-green-100 text-green-800',
  overdue: 'bg-red-100 text-red-800',
  partial: 'bg-yellow-100 text-yellow-800',
};

const BILL_STATUS_LABELS = {
  open: 'Em Aberto',
  closed: 'Fechada',
  paid: 'Paga',
  overdue: 'Vencida',
  partial: 'Parcialmente Paga',
};

const TRANSACTION_TYPE_COLORS = {
  purchase: 'text-red-600',
  payment: 'text-green-600',
  fee: 'text-orange-600',
  interest: 'text-purple-600',
  adjustment: 'text-blue-600',
};

const TRANSACTION_TYPE_LABELS = {
  purchase: 'Compra',
  payment: 'Pagamento',
  fee: 'Taxa',
  interest: 'Juros',
  adjustment: 'Ajuste',
};

export default function CreditCardBillManager() {
  const [bills, setBills] = useState<CreditCardBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<CreditCardBill | null>(null);
  const [billTransactions, setBillTransactions] = useState<CreditCardTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showAmounts, setShowAmounts] = useState(false);
  const [showPermissionsInfo, setShowPermissionsInfo] = useState(false);

  const fetchBills = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/credit-card-bills');
      const data = await response.json();
      setBills(data.bills || []);
    } catch (error) {
      console.error('Erro ao buscar faturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBillTransactions = async (billId: number) => {
    try {
      setLoadingTransactions(true);
      const response = await apiFetch(`/api/credit-card-bills/${billId}/transactions`);
      const data = await response.json();
      setBillTransactions(data.transactions || []);
    } catch (error) {
      console.error('Erro ao buscar transações da fatura:', error);
      setBillTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const syncFromPluggy = async () => {
    try {
      setSyncing(true);
      const response = await apiFetch('/api/credit-card-bills/sync-pluggy', {
        method: 'POST',
      });
      
      if (response.ok) {
        await fetchBills();
        const data = await response.json();
        
        // Show detailed message based on results
        let message = data.message || 'Sincronização concluída com sucesso!';
        
        if (data.permissionErrors > 0) {
          message += '\n\nℹ️ Algumas contas de cartão de crédito não puderam ser acessadas devido a restrições de permissão da API do Pluggy. Isso é normal e pode requerer upgrade do plano ou autorização adicional.';
        }
        
        if (data.errors && data.errors.length > 0) {
          message += '\n\n⚠️ Alguns erros ocorreram:\n' + data.errors.join('\n');
        }
        
        alert(message);
      } else {
        const error = await response.json();
        alert(error.error || 'Erro na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      alert('Erro ao sincronizar com Pluggy');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getDaysUntilDue = (dueDateString: string) => {
    if (!dueDateString) return null;
    const dueDate = new Date(dueDateString);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBillStatusIcon = (bill: CreditCardBill) => {
    if (bill.is_fully_paid) return <CheckCircle className="w-5 h-5 text-green-600" />;
    
    const daysUntilDue = getDaysUntilDue(bill.due_date || '');
    if (daysUntilDue !== null && daysUntilDue < 0) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    if (daysUntilDue !== null && daysUntilDue <= 3) {
      return <Clock className="w-5 h-5 text-yellow-600" />;
    }
    
    return <FileText className="w-5 h-5 text-blue-600" />;
  };

  const handleBillSelect = async (bill: CreditCardBill) => {
    setSelectedBill(bill);
    await fetchBillTransactions(bill.id);
  };

  // Calculate summary statistics
  const totalOpenAmount = bills
    .filter(bill => !bill.is_fully_paid)
    .reduce((sum, bill) => sum + bill.total_amount, 0);
    
  const totalMinimumPayment = bills
    .filter(bill => !bill.is_fully_paid)
    .reduce((sum, bill) => sum + bill.minimum_payment, 0);
    
  const overduelBills = bills.filter(bill => {
    if (bill.is_fully_paid || !bill.due_date) return false;
    const daysUntilDue = getDaysUntilDue(bill.due_date);
    return daysUntilDue !== null && daysUntilDue < 0;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Total em Aberto</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-red-600">
              {showAmounts ? formatCurrency(totalOpenAmount) : '••••••'}
            </p>
            <p className="text-xs text-gray-500">{bills.filter(b => !b.is_fully_paid).length} faturas</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-2 rounded-lg">
              <DollarSign className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Pagamento Mínimo</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-yellow-600">
              {showAmounts ? formatCurrency(totalMinimumPayment) : '••••••'}
            </p>
            <p className="text-xs text-gray-500">Total mínimo</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-2 rounded-lg">
              <AlertCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Faturas Vencidas</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-red-600">{overduelBills.length}</p>
            <p className="text-xs text-gray-500">Requer atenção</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
              <FileText className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-medium text-gray-600">Total de Faturas</span>
          </div>
          <div className="space-y-1">
            <p className="text-lg font-bold text-blue-600">{bills.length}</p>
            <p className="text-xs text-gray-500">Todas as faturas</p>
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-red-500 to-red-600 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Faturas de Cartão</h2>
              <p className="text-gray-600">Gerencie suas faturas de cartão de crédito</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={() => setShowPermissionsInfo(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-100 text-amber-700 rounded-xl hover:bg-amber-200 transition-colors"
            >
              <Info className="w-5 h-5" />
              Sobre Permissões
            </button>
            <button
              onClick={() => setShowAmounts(!showAmounts)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
            >
              {showAmounts ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              {showAmounts ? 'Ocultar' : 'Mostrar'} Valores
            </button>
            <button
              onClick={syncFromPluggy}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl hover:bg-emerald-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar Pluggy
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bills List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Faturas</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {bills.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Nenhuma fatura encontrada</p>
                  <p className="text-sm text-gray-500">Sincronize com o Pluggy para importar suas faturas</p>
                </div>
              ) : (
                bills.map((bill) => {
                  const daysUntilDue = getDaysUntilDue(bill.due_date || '');
                  const isSelected = selectedBill?.id === bill.id;
                  
                  return (
                    <div
                      key={bill.id}
                      onClick={() => handleBillSelect(bill)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-blue-300 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getBillStatusIcon(bill)}
                          <span className="font-medium text-gray-900">
                            Cartão de Crédito
                          </span>
                          {bill.bill_status && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              BILL_STATUS_COLORS[bill.bill_status as keyof typeof BILL_STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                            }`}>
                              {BILL_STATUS_LABELS[bill.bill_status as keyof typeof BILL_STATUS_LABELS] || bill.bill_status}
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-bold text-gray-900">
                          {showAmounts ? formatCurrency(bill.total_amount) : '••••••'}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="text-gray-500">Vencimento:</span>
                          <p className="font-medium">{formatDate(bill.due_date || '')}</p>
                          {daysUntilDue !== null && (
                            <p className={`text-xs ${
                              daysUntilDue < 0 ? 'text-red-600' :
                              daysUntilDue <= 3 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {daysUntilDue < 0 ? `${Math.abs(daysUntilDue)} dias vencida` :
                               daysUntilDue === 0 ? 'Vence hoje' :
                               `${daysUntilDue} dias para vencer`}
                            </p>
                          )}
                        </div>
                        <div>
                          <span className="text-gray-500">Mínimo:</span>
                          <p className="font-medium">
                            {showAmounts ? formatCurrency(bill.minimum_payment) : '••••••'}
                          </p>
                          {bill.paid_amount > 0 && (
                            <p className="text-xs text-green-600">
                              Pago: {showAmounts ? formatCurrency(bill.paid_amount) : '••••••'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Bill Details and Transactions */}
          <div>
            <h3 className="text-lg font-semibold mb-4">
              {selectedBill ? 'Detalhes da Fatura' : 'Selecione uma Fatura'}
            </h3>
            
            {selectedBill ? (
              <div className="space-y-4">
                {/* Bill Summary */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Resumo da Fatura</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Fechamento:</span>
                      <p className="font-medium">{formatDate(selectedBill.closing_date || '')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Vencimento:</span>
                      <p className="font-medium">{formatDate(selectedBill.due_date || '')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Valor Total:</span>
                      <p className="font-bold text-red-600">
                        {showAmounts ? formatCurrency(selectedBill.total_amount) : '••••••'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">Pagamento Mínimo:</span>
                      <p className="font-medium">
                        {showAmounts ? formatCurrency(selectedBill.minimum_payment) : '••••••'}
                      </p>
                    </div>
                    {selectedBill.previous_bill_balance > 0 && (
                      <div>
                        <span className="text-gray-600">Saldo Anterior:</span>
                        <p className="font-medium">
                          {showAmounts ? formatCurrency(selectedBill.previous_bill_balance) : '••••••'}
                        </p>
                      </div>
                    )}
                    {selectedBill.paid_amount > 0 && (
                      <div>
                        <span className="text-gray-600">Valor Pago:</span>
                        <p className="font-medium text-green-600">
                          {showAmounts ? formatCurrency(selectedBill.paid_amount) : '••••••'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Transactions */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Transações</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {loadingTransactions ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                      </div>
                    ) : billTransactions.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p>Nenhuma transação encontrada</p>
                      </div>
                    ) : (
                      billTransactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="p-3 bg-white rounded-lg border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-gray-900">
                              {transaction.description || 'Transação'}
                            </span>
                            <span className={`font-bold ${
                              transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                            }`}>
                              {showAmounts ? formatCurrency(Math.abs(transaction.amount)) : '••••••'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-2">
                              <span>{formatDate(transaction.date || '')}</span>
                              {transaction.transaction_type && (
                                <span className={`px-2 py-1 rounded-full bg-gray-100 ${
                                  TRANSACTION_TYPE_COLORS[transaction.transaction_type as keyof typeof TRANSACTION_TYPE_COLORS] || 'text-gray-600'
                                }`}>
                                  {TRANSACTION_TYPE_LABELS[transaction.transaction_type as keyof typeof TRANSACTION_TYPE_LABELS] || transaction.transaction_type}
                                </span>
                              )}
                            </div>
                            {transaction.total_installments && transaction.total_installments > 1 && (
                              <span className="text-blue-600">
                                {transaction.installment_number || 1}/{transaction.total_installments}x
                              </span>
                            )}
                          </div>
                          
                          {transaction.merchant_name && (
                            <p className="text-xs text-gray-600 mt-1">
                              {transaction.merchant_name}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p>Selecione uma fatura para ver os detalhes</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Info Modal */}
      <PluggyPermissionsInfo 
        show={showPermissionsInfo} 
        onClose={() => setShowPermissionsInfo(false)} 
      />
    </div>
  );
}
