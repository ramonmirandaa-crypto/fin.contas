import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Banknote, Calendar, DollarSign, Percent } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import type { Loan } from '@/shared/types';

export default function LoanManager() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAmounts, setShowAmounts] = useState(false);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        setLoading(true);
        const response = await apiFetch('/api/loans');
        const data = await response.json();
        setLoans(Array.isArray(data.loans) ? data.loans : []);
      } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        setLoans([]);
      } finally {
        setLoading(false);
      }
    };

    void loadLoans();
  }, []);

  const summary = useMemo(() => {
    if (loans.length === 0) {
      return {
        totalPrincipal: 0,
        totalRemaining: 0,
        avgRate: 0,
        nextDueDate: null as string | null,
      };
    }

    const totalPrincipal = loans.reduce((sum, loan) => sum + (loan.principal_amount ?? 0), 0);
    const totalRemaining = loans.reduce((sum, loan) => sum + (loan.remaining_balance ?? 0), 0);
    const avgRate = loans.reduce((sum, loan) => sum + (loan.interest_rate ?? 0), 0) / loans.length;

    const futureDueDates = loans
      .map(loan => loan.end_date)
      .filter((date): date is string => Boolean(date))
      .map(date => new Date(date))
      .filter(date => !Number.isNaN(date.getTime()) && date > new Date())
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      totalPrincipal,
      totalRemaining,
      avgRate,
      nextDueDate: futureDueDates[0]?.toISOString() ?? null,
    };
  }, [loans]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

  const formatDate = (date: string | null | undefined) =>
    date ? new Date(date).toLocaleDateString('pt-BR') : '—';

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
          <h2 className="text-2xl font-bold text-gray-900">Empréstimos</h2>
          <p className="text-gray-600">
            Consulte saldos, parcelas e prazos consolidados das suas dívidas atuais.
          </p>
        </div>
        {loans.length > 0 && (
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
              <p className="text-xs font-medium text-gray-500">Valor contratado</p>
              <p className="text-lg font-semibold text-gray-900">
                {showAmounts ? formatCurrency(summary.totalPrincipal) : '••••••'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Saldo devedor</p>
              <p className="text-lg font-semibold text-gray-900">
                {showAmounts ? formatCurrency(summary.totalRemaining) : '••••••'}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <Percent className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Taxa média</p>
              <p className="text-lg font-semibold text-gray-900">{summary.avgRate.toFixed(2)}%</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">Próximo vencimento</p>
              <p className="text-lg font-semibold text-gray-900">
                {summary.nextDueDate ? formatDate(summary.nextDueDate) : 'Sem prazos futuros'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loans.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
          <h3 className="text-lg font-semibold text-gray-900">Nenhum empréstimo cadastrado</h3>
          <p className="mt-2 text-sm text-gray-600">
            As sincronizações automáticas de contas e cartões importarão seus contratos aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {loans.map(loan => (
            <div
              key={loan.id}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{loan.name}</h3>
                  <p className="text-sm text-gray-500">
                    Contrato iniciado em {formatDate(loan.start_date)} · término previsto para {formatDate(loan.end_date)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Valor contratual</p>
                    <p className="text-base font-semibold text-gray-900">
                      {showAmounts ? formatCurrency(loan.principal_amount ?? 0) : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Saldo atual</p>
                    <p className="text-base font-semibold text-gray-900">
                      {showAmounts ? formatCurrency(loan.remaining_balance ?? 0) : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Parcela mensal</p>
                    <p className="text-base font-semibold text-gray-900">
                      {showAmounts ? formatCurrency(loan.monthly_payment ?? 0) : '••••••'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gray-400">Taxa de juros</p>
                    <p className="text-base font-semibold text-gray-900">{(loan.interest_rate ?? 0).toFixed(2)}% a.m.</p>
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
