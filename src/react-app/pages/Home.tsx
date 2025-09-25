import { useCallback, useMemo, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Brain, Briefcase, CalendarClock, CreditCard, HomeIcon, Settings, TrendingUp, Wallet2, Bell } from 'lucide-react';
import AuthButton from '@/react-app/components/AuthButton';
import ExperienceOverlay from '@/react-app/components/layout/ExperienceOverlay';
import LoginPrompt from '@/react-app/components/LoginPrompt';
import { useExpenses } from '@/react-app/hooks/useExpenses';
import { buildOverlayConfig } from './homeConfig';
import type { CreateExpense } from '@/shared/types';
import type { OverlayView } from '@/react-app/components/sections/FinancePreviewSection';
import { formatCurrency, formatDate } from '@/react-app/utils';

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [refreshInsights, setRefreshInsights] = useState(0);
  const [activeOverlay, setActiveOverlay] = useState<OverlayView | null>(null);

  const userName = useMemo(() => {
    if (!user) {
      return null;
    }

    const fullName = user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      return fullName;
    }

    return user.primaryEmailAddress?.emailAddress ?? null;
  }, [user]);

  const firstName = useMemo(() => {
    if (!userName) {
      return null;
    }

    return userName.split(' ')[0];
  }, [userName]);

  const { expenses, submitting, metrics, addExpense } = useExpenses({ enabled: Boolean(user && isSignedIn) });
  const { totalExpenses, thisMonthExpenses, avgDailySpending } = metrics;

  const handleRefreshInsights = useCallback(() => {
    setRefreshInsights(previous => previous + 1);
  }, []);

  const handleAddExpense = useCallback(
    (expenseData: CreateExpense) => {
      void addExpense(expenseData).then(newExpense => {
        if (newExpense) {
          setRefreshInsights(previous => previous + 1);
        }
      });
    },
    [addExpense]
  );

  const handleOpenOverlay = useCallback((view: OverlayView) => {
    setActiveOverlay(view);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const overlayConfig = useMemo(
    () =>
      buildOverlayConfig({
        expenses,
        onAddExpense: handleAddExpense,
        submitting,
        refreshInsights,
      }),
    [expenses, handleAddExpense, submitting, refreshInsights]
  );

  const activeOverlayConfig = activeOverlay ? overlayConfig[activeOverlay] : null;

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-32 w-32 rounded-3xl bg-white/10" />
        </div>
      </div>
    );
  }

  if (!isSignedIn || !user) {
    return <LoginPrompt />;
  }

  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const dailyAverage = Number.isFinite(avgDailySpending) ? avgDailySpending : 0;

  const summaryCards = [
    {
      id: 'expense-tracker' as const,
      label: 'Despesas do mês',
      value: formatCurrency(thisMonthExpenses),
      helper: 'Atualize seus lançamentos',
    },
    {
      id: 'analytics' as const,
      label: 'Gastos totais acompanhados',
      value: formatCurrency(totalExpenses),
      helper: 'Veja relatórios completos',
    },
    {
      id: 'insights' as const,
      label: 'Insight diário da IA',
      value: formatCurrency(dailyAverage),
      helper: 'Gasto médio diário sugerido',
    },
  ];

  const recentExpenses = sortedExpenses.slice(0, 5);
  const upcomingItems = sortedExpenses.filter(expense => new Date(expense.date) >= new Date()).slice(0, 4);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <aside className="hidden min-h-screen w-72 flex-col border-r border-slate-200/80 bg-white/70 px-6 py-10 backdrop-blur-xl lg:flex">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-lg">
            <Wallet2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">contable</p>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-500">finance hub</p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 text-sm font-medium text-slate-600">
          <button
            type="button"
            onClick={() => handleOpenOverlay('dashboard')}
            className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500/10 to-blue-600/10 px-4 py-3 text-left text-slate-900 shadow-sm shadow-sky-100 transition hover:from-sky-500/20 hover:to-blue-600/20"
          >
            <HomeIcon className="h-4 w-4 text-sky-600" />
            Visão geral
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('transactions')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-100"
          >
            <CreditCard className="h-4 w-4 text-sky-500" />
            Transações
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('accounts')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-100"
          >
            <Briefcase className="h-4 w-4 text-sky-500" />
            Contas conectadas
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('analytics')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-100"
          >
            <TrendingUp className="h-4 w-4 text-sky-500" />
            Relatórios
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('notifications')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-100"
          >
            <Bell className="h-4 w-4 text-sky-500" />
            Alertas
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('quick-actions')}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 transition hover:bg-slate-100"
          >
            <CalendarClock className="h-4 w-4 text-sky-500" />
            Ações rápidas
          </button>
        </nav>

        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50/80 p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">Assistente IA</p>
          <p className="mt-3 text-sm text-slate-600">
            Receba recomendações em tempo real ao registrar novos gastos.
          </p>
          <button
            type="button"
            onClick={() => handleOpenOverlay('insights')}
            className="mt-5 flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:shadow-xl"
          >
            <Brain className="h-4 w-4" />
            Abrir insights
          </button>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col">
        <div className="absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-br from-sky-100 via-white to-transparent" aria-hidden="true" />
        <div className="flex flex-1 flex-col gap-12 px-4 pb-16 pt-12 sm:px-8 lg:px-12">
          <header className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Plataforma contable</p>
              <h1 className="mt-3 text-3xl font-semibold text-slate-900">
                Olá{firstName ? `, ${firstName}` : ''}! Este é o seu hub financeiro.
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Acompanhe saldos, despesas, obrigações e receba a orientação inteligente da plataforma em uma única interface.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleRefreshInsights}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-600"
              >
                Atualizar painel
              </button>
              <AuthButton />
            </div>
          </header>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {summaryCards.map(card => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleOpenOverlay(card.id)}
                className="group flex flex-col items-start gap-2 rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-sky-200 hover:shadow-xl"
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">{card.label}</span>
                <span className="text-3xl font-semibold text-slate-900">{card.value}</span>
                <span className="text-xs text-slate-500">{card.helper}</span>
              </button>
            ))}
          </section>

          <section className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Fluxo de caixa</h2>
                  <p className="text-sm text-slate-500">Monitoramento semanal dos seus lançamentos mais recentes.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('analytics')}
                  className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                >
                  Ver detalhado
                </button>
              </div>
              <div className="h-56 rounded-3xl bg-gradient-to-r from-sky-500/10 via-white to-blue-600/10 p-6">
                <div className="flex h-full flex-col justify-between">
                  <div className="grid grid-cols-7 gap-2 text-xs text-slate-500">
                    {['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'].map(day => (
                      <span key={day} className="uppercase tracking-[0.3em]">
                        {day}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-1 items-end gap-3 self-end">
                    {[12, 24, 18, 32, 22, 14, 19].map((value, index) => (
                      <div key={index} className="flex h-full w-8 flex-col justify-end">
                        <div className="mx-auto w-8 rounded-full bg-gradient-to-t from-sky-500 to-blue-600" style={{ height: `${value * 3}px` }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Agenda financeira</h2>
                <p className="text-sm text-slate-500">Próximos compromissos e despesas previstas.</p>
              </div>
              <div className="space-y-4">
                {upcomingItems.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                    Cadastre despesas com data prevista para montar sua agenda.
                  </div>
                )}
                {upcomingItems.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleOpenOverlay('transactions')}
                    className="flex w-full items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{item.description}</p>
                      <p className="text-xs text-slate-500">{formatDate(item.date)}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900">{formatCurrency(item.amount)}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Movimentações recentes</h2>
                  <p className="text-sm text-slate-500">Resumo das últimas despesas registradas.</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('expense-tracker')}
                  className="rounded-2xl border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-600"
                >
                  Registrar gasto
                </button>
              </div>
              <div className="space-y-3">
                {recentExpenses.length === 0 && (
                  <div className="rounded-3xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                    Nenhuma movimentação registrada até o momento.
                  </div>
                )}
                {recentExpenses.map(expense => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-700">{expense.description}</p>
                      <p className="text-xs text-slate-500">
                        {expense.category} • {formatDate(expense.date)}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-rose-500">-{formatCurrency(expense.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6 rounded-4xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Assistente contable</h2>
                <p className="text-sm text-slate-500">
                  Insights personalizados e ações recomendadas para manter sua rotina em dia.
                </p>
              </div>
              <div className="space-y-4 text-sm text-slate-600">
                <div className="rounded-3xl bg-gradient-to-br from-sky-500/10 via-white to-blue-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-600">Sugerido agora</p>
                  <p className="mt-3 text-sm text-slate-700">
                    Revise a categoria com maior crescimento neste mês e distribua limites com o apoio do relatório inteligente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('insights')}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <span className="text-sm font-medium text-slate-700">Abrir insights da IA</span>
                  <span className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">tempo real</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('quick-actions')}
                  className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-slate-50/90 px-4 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50"
                >
                  <span className="text-sm font-medium text-slate-700">Executar ação rápida</span>
                  <Settings className="h-4 w-4 text-sky-500" />
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {activeOverlayConfig && (
        <ExperienceOverlay
          open={Boolean(activeOverlay)}
          onClose={handleCloseOverlay}
          title={activeOverlayConfig.title}
          description={activeOverlayConfig.description}
          icon={activeOverlayConfig.icon}
        >
          {activeOverlayConfig.render()}
        </ExperienceOverlay>
      )}
    </div>
  );
}
