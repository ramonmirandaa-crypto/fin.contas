import { useState, useEffect } from 'react';
import {
  Plus,
  CreditCard,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Link,
  RefreshCw,
  Unlink,
  CheckCircle,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { CreditCard as CreditCardType, CreateCreditCard } from '@/shared/types';
import CreditCardBillManager from './CreditCardBillManager';
import {
  getCardNetworkVisual,
  getCardVisualConfig,
} from '@/react-app/components/brand/FinancialBrandAssets';

interface ExtendedCreditCard extends CreditCardType {
  linked_account_id?: number;
  linked_account_name?: string;
  linked_account_balance?: number;
  linked_credit_limit?: number;
  linked_available_credit?: number;
  linked_minimum_payment?: number;
  linked_due_date?: string;
}

interface AvailableAccount {
  id: number;
  name: string;
  institution_name?: string;
  balance: number;
  credit_limit?: number;
  available_credit_limit?: number;
}

export default function CreditCardManager() {
  const [cards, setCards] = useState<ExtendedCreditCard[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AvailableAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkingCard, setLinkingCard] = useState<ExtendedCreditCard | null>(null);
  const [editingCard, setEditingCard] = useState<ExtendedCreditCard | null>(null);
  const [syncingCard, setSyncingCard] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'cards' | 'bills'>('cards');
  const [formData, setFormData] = useState<CreateCreditCard>({
    name: '',
    credit_limit: 0,
    current_balance: 0,
    due_day: 1,
  });

  const fetchCards = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/credit-cards');
      const data = await response.json();
      setCards(data.creditCards || []);
    } catch (error) {
      console.error('Erro ao buscar cartões:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAccounts = async () => {
    try {
      const response = await apiFetch('/api/credit-cards/available-accounts');
      const data = await response.json();
      setAvailableAccounts(data.accounts || []);
    } catch (error) {
      console.error('Erro ao buscar contas disponíveis:', error);
    }
  };

  useEffect(() => {
    fetchCards();
    fetchAvailableAccounts();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      credit_limit: 0,
      current_balance: 0,
      due_day: 1,
    });
    setEditingCard(null);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCard ? `/api/credit-cards/${editingCard.id}` : '/api/credit-cards';
      const method = editingCard ? 'PUT' : 'POST';
      
      const response = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchCards();
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar cartão:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (card: CreditCardType) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      credit_limit: card.credit_limit,
      current_balance: card.current_balance,
      due_day: card.due_day,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este cartão?')) return;

    try {
      const response = await apiFetch(`/api/credit-cards/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCards();
      }
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
    }
  };

  const handleLinkCard = (card: ExtendedCreditCard) => {
    setLinkingCard(card);
    setShowLinkModal(true);
    fetchAvailableAccounts();
  };

  const handleUnlinkCard = async (cardId: number) => {
    if (!confirm('Tem certeza que deseja desvincular este cartão?')) return;

    try {
      const response = await apiFetch(`/api/credit-cards/${cardId}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: null }),
      });

      if (response.ok) {
        await fetchCards();
        await fetchAvailableAccounts();
      }
    } catch (error) {
      console.error('Erro ao desvincular cartão:', error);
    }
  };

  const handleConfirmLink = async (accountId: number) => {
    if (!linkingCard) return;

    try {
      const response = await apiFetch(`/api/credit-cards/${linkingCard.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      if (response.ok) {
        await fetchCards();
        await fetchAvailableAccounts();
        setShowLinkModal(false);
        setLinkingCard(null);
      }
    } catch (error) {
      console.error('Erro ao vincular cartão:', error);
    }
  };

  const handleSyncCard = async (cardId: number) => {
    try {
      setSyncingCard(cardId);
      const response = await apiFetch(`/api/credit-cards/${cardId}/sync`, {
        method: 'POST',
      });

      if (response.ok) {
        await fetchCards();
      }
    } catch (error) {
      console.error('Erro ao sincronizar cartão:', error);
    } finally {
      setSyncingCard(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getUtilizationPercentage = (current: number, limit: number) => {
    return limit > 0 ? (current / limit) * 100 : 0;
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-600 bg-red-100';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

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
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cartões de Crédito</h2>
              <p className="text-gray-600">Gerencie seus cartões, limites e faturas</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {activeTab === 'cards' && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
              >
                <Plus className="w-5 h-5" />
                Adicionar Cartão
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all flex-1 justify-center ${
              activeTab === 'cards'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            Cartões
          </button>
          <button
            onClick={() => setActiveTab('bills')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all flex-1 justify-center ${
              activeTab === 'bills'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            <FileText className="w-5 h-5" />
            Faturas
          </button>
        </div>

        {/* Link Modal */}
        {showLinkModal && linkingCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Vincular "{linkingCard.name}" com conta Pluggy
              </h3>
              
              <div className="space-y-4">
                {availableAccounts.length === 0 ? (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      Nenhuma conta de cartão de crédito disponível do Pluggy.
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Sincronize suas contas primeiro para ver as opções disponíveis.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600 mb-3">
                      Selecione uma conta do Pluggy para vincular:
                    </p>
                    {availableAccounts.map((account) => (
                      <div
                        key={account.id}
                        onClick={() => handleConfirmLink(account.id)}
                        className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{account.name}</h4>
                            {account.institution_name && (
                              <p className="text-sm text-gray-600">{account.institution_name}</p>
                            )}
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>Saldo: {formatCurrency(Math.abs(account.balance))}</span>
                              {account.credit_limit && (
                                <span>Limite: {formatCurrency(account.credit_limit)}</span>
                              )}
                            </div>
                          </div>
                          <Link className="w-5 h-5 text-blue-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkingCard(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'cards' ? (
          <>
            {/* Form */}
            {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">
              {editingCard ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Cartão
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Cartão Banco do Brasil"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Crédito
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.credit_limit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, credit_limit: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Saldo Atual
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.current_balance || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, current_balance: parseFloat(e.target.value) || 0 }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0,00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dia do Vencimento
                </label>
                <select
                  value={formData.due_day}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_day: parseInt(e.target.value) }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Dia {day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {submitting ? 'Salvando...' : editingCard ? 'Atualizar' : 'Adicionar'}
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

        {/* Cards List */}
        <div className="space-y-6">
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum cartão cadastrado</h3>
              <p className="text-gray-600">Adicione seus cartões para acompanhar limites e utilização.</p>
            </div>
          ) : (
            cards.map((card) => {
              const currentBalance = card.linked_account_balance
                ? Math.abs(card.linked_account_balance)
                : card.current_balance;
              const creditLimit = card.linked_credit_limit || card.credit_limit;
              const availableCredit = card.linked_available_credit
                ? card.linked_available_credit
                : creditLimit - currentBalance;
              const utilizationPercent = getUtilizationPercentage(currentBalance, creditLimit);
              const cardVisual = getCardVisualConfig(card.name || card.linked_account_name);
              const networkVisual = getCardNetworkVisual(card.name, cardVisual.defaultNetwork);
              const IssuerLogo = cardVisual.issuerLogo;
              const NetworkLogo = networkVisual.logo;
              const isDarkCard = cardVisual.accent.includes('text-white');
              const mutedText = isDarkCard ? 'text-white/70' : 'text-slate-600';
              const statusBadgeClass = card.linked_account_id
                ? isDarkCard
                  ? 'border border-emerald-200/50 bg-emerald-400/20 text-emerald-100'
                  : 'border border-emerald-200 bg-emerald-100 text-emerald-700'
                : isDarkCard
                  ? 'border border-white/30 bg-white/15 text-white/90'
                  : 'border border-slate-200 bg-slate-100 text-slate-700';
              const actionButtonClass = isDarkCard
                ? 'rounded-full bg-white/15 p-2 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80'
                : 'rounded-full bg-slate-900/10 p-2 text-slate-900 transition hover:bg-slate-900/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-600/40';
              const highlightBadgeClass = isDarkCard
                ? 'border border-white/25 bg-white/15 text-white'
                : 'border border-slate-200 bg-white/80 text-slate-900';

              return (
                <div key={card.id} className="rounded-4xl border border-slate-100 bg-white/90 p-6 shadow-xl">
                  <article
                    className={`relative overflow-hidden rounded-[28px] bg-gradient-to-br ${cardVisual.gradient} ${cardVisual.accent} p-6 shadow-2xl`}
                  >
                    <div className="absolute inset-0">
                      <div
                        className={`absolute -top-16 -right-12 h-40 w-40 rounded-full bg-gradient-to-br ${cardVisual.patternColor} opacity-70 blur-3xl`}
                        aria-hidden="true"
                      />
                      <div
                        className={`absolute -bottom-20 left-[-10%] h-48 w-48 rounded-full bg-gradient-to-br ${cardVisual.highlightGradient} opacity-60 blur-3xl`}
                        aria-hidden="true"
                      />
                    </div>

                    <div className="relative flex flex-col gap-6">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="space-y-4">
                          <IssuerLogo className={`h-7 ${isDarkCard ? 'text-white' : 'text-slate-900'}`} />
                          <div
                            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.3em] ${statusBadgeClass}`}
                          >
                            {card.linked_account_id ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                Sincronizado
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-3.5 w-3.5" />
                                Manual
                              </>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3">
                          <NetworkLogo className={`h-6 ${isDarkCard ? 'text-white' : 'text-slate-900'}`} />
                          <div className="flex items-center gap-2">
                            {card.linked_account_id ? (
                              <>
                                <button
                                  onClick={() => handleSyncCard(card.id)}
                                  disabled={syncingCard === card.id}
                                  className={`${actionButtonClass} disabled:opacity-50`}
                                  title="Sincronizar dados do Pluggy"
                                >
                                  <RefreshCw className={`h-4 w-4 ${syncingCard === card.id ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleUnlinkCard(card.id)}
                                  className={actionButtonClass}
                                  title="Desvincular conta Pluggy"
                                >
                                  <Unlink className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleLinkCard(card)}
                                className={actionButtonClass}
                                title="Vincular com conta Pluggy"
                              >
                                <Link className="h-4 w-4" />
                              </button>
                            )}
                            <button onClick={() => handleEdit(card)} className={actionButtonClass} title="Editar cartão">
                              <Edit className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDelete(card.id)} className={actionButtonClass} title="Excluir cartão">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <p className={`text-xs uppercase tracking-[0.35em] ${mutedText}`}>Fatura atual</p>
                          <p className="mt-2 text-3xl font-semibold">
                            {formatCurrency(currentBalance)}
                          </p>
                        </div>
                        <div
                          className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm font-medium ${highlightBadgeClass}`}
                        >
                          <Calendar className="h-4 w-4" />
                          Vence dia {card.due_day}
                        </div>
                      </div>

                      <div className="grid gap-4 text-sm sm:grid-cols-3">
                        <div>
                          <p className={`text-[0.7rem] uppercase tracking-[0.3em] ${mutedText}`}>Limite total</p>
                          <p className="mt-2 text-lg font-semibold">
                            {formatCurrency(card.linked_credit_limit || card.credit_limit)}
                          </p>
                        </div>
                        <div>
                          <p className={`text-[0.7rem] uppercase tracking-[0.3em] ${mutedText}`}>Saldo atual</p>
                          <p className="mt-2 text-lg font-semibold">{formatCurrency(currentBalance)}</p>
                        </div>
                        <div>
                          <p className={`text-[0.7rem] uppercase tracking-[0.3em] ${mutedText}`}>Disponível</p>
                          <p className="mt-2 text-lg font-semibold">{formatCurrency(Math.max(0, availableCredit))}</p>
                        </div>
                      </div>

                      <div>
                        <p className={`text-[0.7rem] uppercase tracking-[0.3em] ${mutedText}`}>Cartão</p>
                        <p className="mt-2 text-base font-semibold">{card.name}</p>
                        {card.linked_account_name ? (
                          <p className={`text-xs ${mutedText}`}>Integrado com {card.linked_account_name}</p>
                        ) : (
                          <p className={`text-xs ${mutedText}`}>Cadastro manual</p>
                        )}
                      </div>
                    </div>
                  </article>

                  <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        <DollarSign className="h-4 w-4 text-emerald-500" />
                        Limite total
                      </div>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatCurrency(card.linked_credit_limit || card.credit_limit)}
                      </p>
                      {card.linked_credit_limit && card.linked_credit_limit !== card.credit_limit && (
                        <p className="mt-1 text-xs text-emerald-600">
                          Sincronizado: {formatCurrency(card.linked_credit_limit)}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        <DollarSign className="h-4 w-4 text-rose-500" />
                        Saldo atual
                      </div>
                      <p className="mt-2 text-xl font-semibold text-slate-900">{formatCurrency(currentBalance)}</p>
                      {card.linked_account_balance && Math.abs(card.linked_account_balance) !== card.current_balance && (
                        <p className="mt-1 text-xs text-rose-500">
                          Sincronizado: {formatCurrency(Math.abs(card.linked_account_balance))}
                        </p>
                      )}
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white/80 p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                        <DollarSign className="h-4 w-4 text-blue-500" />
                        Disponível
                      </div>
                      <p className="mt-2 text-xl font-semibold text-slate-900">
                        {formatCurrency(Math.max(0, availableCredit))}
                      </p>
                      {card.linked_available_credit && (
                        <p className="mt-1 text-xs text-blue-600">
                          Pluggy: {formatCurrency(card.linked_available_credit)}
                        </p>
                      )}
                    </div>
                  </div>

                  {card.linked_account_id && (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-sm text-emerald-700">
                      <div className="flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4" /> Vinculado com {card.linked_account_name}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        {card.linked_minimum_payment && (
                          <span>Pagamento mín.: {formatCurrency(card.linked_minimum_payment)}</span>
                        )}
                        {card.linked_due_date && (
                          <span>Vence: {new Date(card.linked_due_date).toLocaleDateString('pt-BR')}</span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm font-medium text-slate-600">
                      <span>Utilização do limite</span>
                      <span className={`rounded-full px-3 py-1 ${getUtilizationColor(utilizationPercent)}`}>
                        {utilizationPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          utilizationPercent >= 80 ? 'bg-red-500' : utilizationPercent >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(utilizationPercent, 100)}%` }}
                      />
                    </div>
                    {card.linked_account_id && (
                      <p className="mt-2 text-xs text-slate-500">Dados sincronizados automaticamente do Pluggy</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
          </>
        ) : (
          /* Bills Tab Content */
          <CreditCardBillManager />
        )}
      </div>
    </div>
  );
}
