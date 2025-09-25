import { useState, useEffect } from 'react';
import { Plus, TrendingUp, Edit, Trash2, Calendar, DollarSign, Percent } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { Investment, CreateInvestment, INVESTMENT_TYPES } from '@/shared/types';

export default function InvestmentManager() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState<CreateInvestment>({
    name: '',
    type: 'Ações',
    amount: 0,
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: null,
  });

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/investments');
      const data = await response.json();
      setInvestments(data.investments || []);
    } catch (error) {
      console.error('Erro ao buscar investimentos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Ações',
      amount: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      current_value: null,
    });
    setEditingInvestment(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingInvestment ? `/api/investments/${editingInvestment.id}` : '/api/investments';
      const method = editingInvestment ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchInvestments();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar investimento:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      name: investment.name,
      type: investment.type,
      amount: investment.amount,
      purchase_date: investment.purchase_date,
      current_value: investment.current_value,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este investimento?')) return;

    try {
      const response = await apiFetch(`/api/investments/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchInvestments();
      }
    } catch (error) {
      console.error('Erro ao excluir investimento:', error);
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

  const calculateReturn = (initial: number, current: number | null) => {
    if (!current) return null;
    const returnValue = current - initial;
    const returnPercent = ((current - initial) / initial) * 100;
    return { value: returnValue, percent: returnPercent };
  };

  const getReturnColor = (returnPercent: number) => {
    if (returnPercent > 0) return 'text-green-600 bg-green-100';
    if (returnPercent < 0) return 'text-red-600 bg-red-100';
    return 'text-gray-600 bg-gray-100';
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'Ações': 'bg-blue-100 text-blue-800',
      'Fundos Imobiliários': 'bg-green-100 text-green-800',
      'Tesouro Direto': 'bg-purple-100 text-purple-800',
      'CDB': 'bg-yellow-100 text-yellow-800',
      'LCI/LCA': 'bg-indigo-100 text-indigo-800',
      'Poupança': 'bg-gray-100 text-gray-800',
      'Fundos de Investimento': 'bg-pink-100 text-pink-800',
      'Criptomoedas': 'bg-orange-100 text-orange-800',
      'Outros': 'bg-teal-100 text-teal-800'
    };
    return colors[type] || colors['Outros'];
  };

  // Calculate totals
  const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCurrentValue = investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
  const totalReturn = totalCurrentValue - totalInvested;
  const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

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
            <span className="text-sm font-medium text-gray-600">Investido</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalInvested)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Valor Atual</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCurrentValue)}</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Retorno</span>
          </div>
          <p className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(totalReturn)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Percent className="w-6 h-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-600">Retorno %</span>
          </div>
          <p className={`text-2xl font-bold ${totalReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalReturnPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Main Panel */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Investimentos</h2>
              <p className="text-gray-600">Acompanhe sua carteira de investimentos</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Adicionar Investimento
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingInvestment ? 'Editar Investimento' : 'Novo Investimento'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Investimento
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: PETR4, Tesouro Selic 2027"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Investimento
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  {INVESTMENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Investido
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data da Compra
                </label>
                <input
                  type="date"
                  value={formData.purchase_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Atual (Opcional)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_value || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_value: parseFloat(e.target.value) || null }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0,00 (deixe vazio se não souber)"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : editingInvestment ? 'Atualizar' : 'Adicionar'}
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

        {/* Investments List */}
        <div className="space-y-4">
          {investments.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum investimento cadastrado</h3>
              <p className="text-gray-600 mb-4">Comece a acompanhar seus investimentos para construir seu patrimônio.</p>
              <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">💡 Dica:</span> Se você conectou uma conta de investimentos através do Open Finance,
                  seus investimentos aparecerão aqui automaticamente após a sincronização.
                </p>
              </div>
            </div>
          ) : (
            investments.map((investment) => {
              const returnData = calculateReturn(investment.amount, investment.current_value);
              return (
                <div
                  key={investment.id}
                  className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6 border border-green-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-900">{investment.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(investment.type)}`}>
                            {investment.type}
                          </span>
                          <Calendar className="w-4 h-4" />
                          <span>Compra: {formatDate(investment.purchase_date)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(investment)}
                        className="p-2 text-green-600 hover:bg-green-200 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(investment.id)}
                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Valor Investido</span>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(investment.amount)}
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <span className="text-sm font-medium text-gray-600">Valor Atual</span>
                      <p className="text-lg font-bold text-gray-900">
                        {formatCurrency(investment.current_value || investment.amount)}
                      </p>
                    </div>

                    {returnData && (
                      <>
                        <div className="bg-white rounded-lg p-4">
                          <span className="text-sm font-medium text-gray-600">Retorno (R$)</span>
                          <p className={`text-lg font-bold ${returnData.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(returnData.value)}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4">
                          <span className="text-sm font-medium text-gray-600">Retorno (%)</span>
                          <div className="flex items-center gap-2">
                            <p className={`text-lg font-bold ${returnData.percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {returnData.percent.toFixed(2)}%
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full ${getReturnColor(returnData.percent)}`}>
                              {returnData.percent >= 0 ? '↗' : '↘'}
                            </span>
                          </div>
                        </div>
                      </>
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
