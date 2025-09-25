import { useState, useEffect } from 'react';
import { Plus, Banknote, Edit, Trash2, Calendar, DollarSign, Percent, Zap } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { Loan, CreateLoan } from '@/shared/types';

export default function LoanManager() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [formData, setFormData] = useState<CreateLoan>({
    name: '',
    principal_amount: 0,
    interest_rate: 0,
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    monthly_payment: 0,
    remaining_balance: 0,
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/loans');
      const data = await response.json();
      setLoans(data.loans || []);
    } catch (error) {
      console.error('Erro ao buscar empréstimos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      principal_amount: 0,
      interest_rate: 0,
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      monthly_payment: 0,
      remaining_balance: 0,
    });
    setEditingLoan(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingLoan ? `/api/loans/${editingLoan.id}` : '/api/loans';
      const method = editingLoan ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchLoans();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar empréstimo:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (loan: Loan) => {
    setEditingLoan(loan);
    setFormData({
      name: loan.name,
      principal_amount: loan.principal_amount,
      interest_rate: loan.interest_rate,
      start_date: loan.start_date,
      end_date: loan.end_date,
      monthly_payment: loan.monthly_payment,
      remaining_balance: loan.remaining_balance,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este empréstimo?')) return;

    try {
      const response = await apiFetch(`/api/loans/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchLoans();
      }
    } catch (error) {
      console.error('Erro ao excluir empréstimo:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const calculateProgress = (principal: number, remaining: number) => {
    const paid = principal - remaining;
    return principal > 0 ? (paid / principal) * 100 : 0;
  };

  const calculateRemainingMonths = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffMonths = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    return Math.max(0, diffMonths);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate totals
  const totalPrincipal = loans.reduce((sum, loan) => sum + loan.principal_amount, 0);
  const totalRemaining = loans.reduce((sum, loan) => sum + loan.remaining_balance, 0);
  const totalMonthlyPayment = loans.reduce((sum, loan) => sum + loan.monthly_payment, 0);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Total Emprestado</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPrincipal)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Banknote className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-gray-600">Saldo Devedor</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRemaining)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Mensalidade Total</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalMonthlyPayment)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Já Pago</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {totalPrincipal > 0 ? (((totalPrincipal - totalRemaining) / totalPrincipal) * 100).toFixed(1) : 0}%
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 p-3 rounded-xl">
              <Banknote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Empréstimos</h2>
              <p className="text-gray-600">Gerencie seus financiamentos e empréstimos</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSyncing(true);
                apiFetch('/api/loans/sync', { method: 'POST' })
                  .then(response => response.json())
                  .then(result => {
                    if (result.success) {
                      fetchLoans();
                      if (result.newLoans > 0 || result.updatedLoans > 0) {
                        console.log(`Sync completed: ${result.newLoans} new loans, ${result.updatedLoans} updated`);
                      }
                    } else {
                      console.error('Sync failed:', result.errors);
                    }
                  })
                  .catch(error => {
                    console.error('Erro ao sincronizar empréstimos:', error);
                  })
                  .finally(() => {
                    setSyncing(false);
                  });
              }}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50"
            >
              <Zap className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar Pluggy'}
            </button>
            
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Adicionar Manual
            </button>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingLoan ? 'Editar Empréstimo' : 'Novo Empréstimo'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Empréstimo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  placeholder="Ex: Financiamento Imóvel, Empréstimo Pessoal"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Principal
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.principal_amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, principal_amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Taxa de Juros (% a.m.)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    value={formData.interest_rate || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0,00"
                    required
                  />
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor da Parcela
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.monthly_payment || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, monthly_payment: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Término
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Devedor Atual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.remaining_balance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, remaining_balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : editingLoan ? 'Atualizar' : 'Adicionar'}
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

        {/* Loans List */}
        <div className="space-y-4">
          {loans.length === 0 ? (
            <div className="text-center py-12">
              <Banknote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum empréstimo cadastrado</h3>
              <p className="text-gray-600">Adicione seus empréstimos e financiamentos para acompanhar pagamentos.</p>
            </div>
          ) : (
            loans.map((loan) => {
              const progress = calculateProgress(loan.principal_amount, loan.remaining_balance);
              const remainingMonths = calculateRemainingMonths(loan.end_date);
              return (
                <div
                  key={loan.id}
                  className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Banknote className="w-8 h-8 text-orange-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900">{loan.name}</h3>
                          {(loan as any).is_synced_from_bank && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1">
                              <Zap className="w-3 h-3" />
                              Pluggy
                            </span>
                          )}
                          {(loan as any).loan_type && (
                            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                              {(loan as any).loan_type}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Percent className="w-4 h-4" />
                            {loan.interest_rate}% a.m.
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(loan.start_date)} - {formatDate(loan.end_date)}
                          </span>
                          {(loan as any).contract_number && (
                            <span className="text-xs text-gray-500">
                              Contrato: {(loan as any).contract_number}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!(loan as any).is_synced_from_bank && (
                        <>
                          <button
                            onClick={() => handleEdit(loan)}
                            className="p-2 text-orange-600 hover:bg-orange-200 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(loan.id)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {(loan as any).is_synced_from_bank && (
                        <div className="px-3 py-1 text-xs bg-blue-50 text-blue-600 rounded-lg">
                          Sincronizado automaticamente
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Valor Original</span>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(loan.principal_amount)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Saldo Devedor</span>
                      <p className="text-lg font-bold text-red-600">
                        {formatCurrency(loan.remaining_balance)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Parcela Mensal</span>
                      <p className="text-lg font-bold text-orange-600">
                        {formatCurrency(loan.monthly_payment)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Parcelas Restantes</span>
                      <p className="text-lg font-bold text-gray-900">
                        {remainingMonths} meses
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-600">Progresso do Pagamento</span>
                      <span className="text-sm font-bold text-gray-900">
                        {progress.toFixed(1)}% pago
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full transition-all ${getProgressColor(progress)}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-600 mt-1">
                      <span>R$ 0</span>
                      <span>{formatCurrency(loan.principal_amount)}</span>
                    </div>
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
