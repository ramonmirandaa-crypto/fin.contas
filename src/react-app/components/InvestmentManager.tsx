import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BarChart3, DollarSign, LineChart, PiggyBank } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import type { Investment } from '@/shared/types';

export default function InvestmentManager() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(false);

  useEffect(() => {
    const loadInvestments = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/investments');
        const data = await response.json();
        setInvestments(Array.isArray(data.investments) ? data.investments : []);
      } catch (error) {
        console.error('Erro ao buscar investimentos:', error);
        setInvestments([]);
      } finally {
        setLoading(false);
      }
    };

    void loadInvestments();
  }, []);

  const summary = useMemo(() => {
    if (investments.length === 0) {
      return {
        totalInvested: 0,
        totalCurrent: 0,
        totalReturn: 0,
        totalReturnPercent: 0,
      };
    }

    const totalInvested = investments.reduce((sum, investment) => sum + (investment.amount ?? 0), 0);
    const totalCurrent = investments.reduce((sum, investment) => sum + (investment.current_value ?? investment.amount ?? 0), 0);
    const totalReturn = totalCurrent - totalInvested;
    const totalReturnPercent = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    return { totalInvested, totalCurrent, totalReturn, totalReturnPercent };
  }, [investments]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64" />
          <div className="space-y-3">
            {[1, 2].map(item => (
              <div key={item} className="h-24 bg-gray-200 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Investimentos</h2>
          <p className="text-gray-600">Acompanhe rentabilidade e distribuição da sua carteira.</p>
        </div>
        {investments.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAmounts(previous => !previous)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            {showAmounts ? 'Ocultar valores' : 'Mostrar valores'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Aplicado</p>
              <p className="text-lg font-semibold text-gray-900">
                {showAmounts ? formatCurrency(summary.totalInvested) : '••••••'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <PiggyBank className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Valor atual</p>
              <p className="text-lg font-semibold text-gray-900">
                {showAmounts ? formatCurrency(summary.totalCurrent) : '••••••'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Retorno absoluto</p>
              <p className={`text-lg font-semibold ${summary.totalReturn >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {showAmounts ? formatCurrency(summary.totalReturn) : '••••••'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Retorno percentual</p>
              <p className={`text-lg font-semibold ${summary.totalReturnPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {summary.totalReturnPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {investments.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h3 className="text-lg font-semibold text-gray-900">Nenhum investimento cadastrado</h3>
          <p className="mt-2 text-sm text-gray-600">
            Conecte instituições via Open Finance para consolidar seus ativos automaticamente.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {investments.map(investment => (
            <div
              key={investment.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{investment.name}</h3>
                  <p className="text-sm text-gray-500">
                    {investment.type} · aplicado em {new Date(investment.purchase_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Valor aplicado</p>
                    <p className="text-base font-semibold text-gray-900">
                      {showAmounts ? formatCurrency(investment.amount ?? 0) : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Valor atual</p>
                    <p className="text-base font-semibold text-gray-900">
                      {showAmounts ? formatCurrency(investment.current_value ?? investment.amount ?? 0) : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Retorno</p>
                    <p className={`text-base font-semibold ${((investment.current_value ?? investment.amount ?? 0) - (investment.amount ?? 0)) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {showAmounts
                        ? formatCurrency((investment.current_value ?? investment.amount ?? 0) - (investment.amount ?? 0))
                        : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Participação</p>
                    <p className="text-base font-semibold text-gray-900">
                      {summary.totalCurrent > 0
                        ? (((investment.current_value ?? investment.amount ?? 0) / summary.totalCurrent) * 100).toFixed(2)
                        : '0.00'}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
