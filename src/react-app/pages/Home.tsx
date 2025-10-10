import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUser } from '@clerk/clerk-react';
import {
  Bell,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  HomeIcon,
  LineChart,
  ListTodo,
  Mail,
  PieChart,
  Plus,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  UserCircle,
  Wallet,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import AuthButton from '@/react-app/components/AuthButton';
import ExperienceOverlay from '@/react-app/components/layout/ExperienceOverlay';
import LoginPrompt from '@/react-app/components/LoginPrompt';
import { useExpenses } from '@/react-app/hooks/useExpenses';
import { buildOverlayConfig } from './homeConfig';
import type { Account, CreateExpense, CreditCard as CreditCardType } from '@/shared/types';
import type { OverlayView } from '@/react-app/components/sections/FinancePreviewSection';
import { formatCurrency, formatDate } from '@/react-app/utils';
import { apiFetch } from '@/react-app/utils/api';
import { useNetworkStatus } from '@/react-app/hooks/useNetworkStatus';

interface OpenFinanceSummary {
  totalAccounts: number;
  pluggyConnections: number;
  institutions: string[];
  lastSyncAt: string | null;
  autoSyncEnabled: number;
  totalBalance: number;
}

interface CreditCardPreview {
  id: number;
  name: string;
  limit: number;
  balance: number;
  dueDay: number;
  utilization: number;
}

interface CreditCardSummary {
  totalCards: number;
  totalLimit: number;
  usedLimit: number;
  availableCredit: number;
  nextDueDate: string | null;
  cards: CreditCardPreview[];
}

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isOnline } = useNetworkStatus();
  const [activeOverlay, setActiveOverlay] = useState<OverlayView | null>(null);
  const [financeSummaryRefreshKey, setFinanceSummaryRefreshKey] = useState(0);
  const [financeSummaryLoading, setFinanceSummaryLoading] = useState(true);
  const [openFinanceSummary, setOpenFinanceSummary] = useState<OpenFinanceSummary | null>(null);
  const [creditCardSummary, setCreditCardSummary] = useState<CreditCardSummary | null>(null);
  const [activePrimaryView, setActivePrimaryView] = useState<'home' | 'reports'>('home');
  const [reportMonthOffset, setReportMonthOffset] = useState(0);
  const [reportTab, setReportTab] = useState<'general' | 'card' | 'account' | 'category'>('general');

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

  const { expenses, submitting, addExpense } = useExpenses({
    enabled: Boolean(user && isSignedIn && isOnline),
  });

  useEffect(() => {
    if (!isSignedIn || !isOnline) {
      setOpenFinanceSummary(null);
      setCreditCardSummary(null);
      setFinanceSummaryLoading(false);
      return;
    }

    let isCancelled = false;

    const loadFinanceSummaries = async () => {
      setFinanceSummaryLoading(true);

      try {
        const [accountsResponse, creditCardsResponse] = await Promise.all([
          apiFetch('/api/accounts'),
          apiFetch('/api/credit-cards'),
        ]);

        if (isCancelled) {
          return;
        }

        const accountsPayload = accountsResponse.ok ? await accountsResponse.json() : {};
        const creditCardsPayload = creditCardsResponse.ok ? await creditCardsResponse.json() : {};

        if (isCancelled) {
          return;
        }

        const accountsList: Account[] = Array.isArray(accountsPayload.accounts)
          ? accountsPayload.accounts
          : [];
        const creditCardList: CreditCardType[] = Array.isArray(creditCardsPayload.creditCards)
          ? creditCardsPayload.creditCards
          : [];

        const uniqueInstitutions = new Set<string>();
        const pluggyItems = new Set<string>();
        let totalBalance = 0;
        let syncEnabledCount = 0;
        let latestSync: string | null = null;

        accountsList.forEach(account => {
          totalBalance += account.balance ?? 0;
          if (account.sync_enabled) {
            syncEnabledCount += 1;
          }
          if (account.pluggy_item_id) {
            pluggyItems.add(account.pluggy_item_id);
          }

          const institutionLabel = account.institution_name || account.marketing_name || account.name;
          if (institutionLabel) {
            uniqueInstitutions.add(institutionLabel);
          }

          if (account.last_sync_at) {
            if (!latestSync || new Date(account.last_sync_at) > new Date(latestSync)) {
              latestSync = account.last_sync_at;
            }
          }
        });

        setOpenFinanceSummary({
          totalAccounts: accountsList.length,
          pluggyConnections: pluggyItems.size,
          institutions: Array.from(uniqueInstitutions),
          lastSyncAt: latestSync,
          autoSyncEnabled: syncEnabledCount,
          totalBalance,
        });

        const totalLimit = creditCardList.reduce((sum, card) => sum + (card.credit_limit ?? 0), 0);
        const usedLimit = creditCardList.reduce((sum, card) => sum + (card.current_balance ?? 0), 0);

        const today = new Date();
        let nextDueDateTimestamp: number | null = null;

        creditCardList.forEach(card => {
          const dueDay = card.due_day ?? 1;
          const candidate = new Date(today.getFullYear(), today.getMonth(), dueDay);
          if (candidate < today) {
            candidate.setMonth(candidate.getMonth() + 1);
          }
          const candidateTimestamp = candidate.getTime();
          if (nextDueDateTimestamp === null || candidateTimestamp < nextDueDateTimestamp) {
            nextDueDateTimestamp = candidateTimestamp;
          }
        });

        const nextDueDateIso =
          nextDueDateTimestamp !== null ? new Date(nextDueDateTimestamp).toISOString() : null;

        setCreditCardSummary({
          totalCards: creditCardList.length,
          totalLimit,
          usedLimit,
          availableCredit: totalLimit - usedLimit,
          nextDueDate: nextDueDateIso,
          cards: creditCardList.map(card => ({
            id: card.id,
            name: card.name,
            limit: card.credit_limit ?? 0,
            balance: card.current_balance ?? 0,
            dueDay: card.due_day ?? 1,
            utilization:
              card.credit_limit && card.credit_limit > 0
                ? Math.min((card.current_balance / card.credit_limit) * 100, 999)
                : 0,
          })),
        });
      } catch (error) {
        if (!isCancelled) {
          console.error('Erro ao carregar resumos financeiros:', error);
          setOpenFinanceSummary(null);
          setCreditCardSummary(null);
        }
      } finally {
        if (!isCancelled) {
          setFinanceSummaryLoading(false);
        }
      }
    };

    void loadFinanceSummaries();

    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, isOnline, financeSummaryRefreshKey]);

  const handleAddExpense = useCallback(
    (expenseData: CreateExpense) => {
      void addExpense(expenseData);
    },
    [addExpense]
  );

  const handleOpenOverlay = useCallback((view: OverlayView) => {
    setActiveOverlay(view);
  }, []);

  const handleCloseOverlay = useCallback(() => {
    setActiveOverlay(null);
  }, []);

  const handleRefreshFinanceSummary = useCallback(() => {
    if (!isOnline) {
      return;
    }

    setFinanceSummaryRefreshKey(previous => previous + 1);
  }, [isOnline]);

  const overlayConfig = useMemo(
    () =>
      buildOverlayConfig({
        expenses,
        onAddExpense: handleAddExpense,
        submitting,
      }),
    [expenses, handleAddExpense, submitting]
  );

  const activeOverlayConfig = activeOverlay ? overlayConfig[activeOverlay] : null;

  const openFinanceLastSyncLabel = useMemo(() => {
    if (!openFinanceSummary?.lastSyncAt) {
      return 'Sincronize suas contas para trazer saldos atualizados.';
    }

    const date = new Date(openFinanceSummary.lastSyncAt);
    return `Última sincronização em ${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  }, [openFinanceSummary?.lastSyncAt]);

  const creditCardsPreview: CreditCardPreview[] = useMemo(() => {
    if (!creditCardSummary) {
      return [];
    }

    return creditCardSummary.cards.slice(0, 3);
  }, [creditCardSummary]);

  const nextDueDateLabel = useMemo(() => {
    if (!creditCardSummary?.nextDueDate) {
      return null;
    }

    const date = new Date(creditCardSummary.nextDueDate);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
    });
  }, [creditCardSummary?.nextDueDate]);

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

  const today = new Date();
  const upcomingExpenses = sortedExpenses.filter(
    expense => new Date(expense.date).getTime() >= today.getTime()
  );
  const paidExpenses = sortedExpenses.filter(
    expense => new Date(expense.date).getTime() < today.getTime()
  );

  const totalUpcoming = upcomingExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const paidExpensesTotal = paidExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const openFinanceBalance = openFinanceSummary?.totalBalance ?? 0;
  const estimatedRevenue = Math.max(openFinanceBalance + paidExpensesTotal, 0);

  const recentExpenses = sortedExpenses.slice(0, 5);

  const homeSummaryCards = [
    {
      id: 'to-pay' as const,
      label: 'A pagar',
      value: formatCurrency(totalUpcoming),
      helper:
        upcomingExpenses.length > 0
          ? `${upcomingExpenses.length} compromissos`
          : 'Sem compromissos para este mês',
      action: () => {
        setActivePrimaryView('reports');
        setReportTab('general');
      },
    },
    {
      id: 'income' as const,
      label: 'Receita',
      value: formatCurrency(estimatedRevenue),
      helper: openFinanceSummary
        ? `${openFinanceSummary.totalAccounts} contas conectadas`
        : 'Conecte contas para projeções',
      action: () => handleOpenOverlay('banking'),
    },
    {
      id: 'paid' as const,
      label: 'Despesas pagas',
      value: formatCurrency(paidExpensesTotal),
      helper:
        sortedExpenses.length > 0
          ? `${sortedExpenses.length} lançamentos`
          : 'Nenhum lançamento registrado',
      action: () => handleOpenOverlay('transactions'),
    },
    {
      id: 'balance' as const,
      label: 'Saldo atual',
      value: formatCurrency(openFinanceBalance),
      helper: openFinanceSummary
        ? `${openFinanceSummary.institutions.length} instituições vinculadas`
        : 'Sincronize pelo Open Finance',
      action: () => handleOpenOverlay('accounts'),
    },
  ];

  const reportMonthDate = new Date(
    today.getFullYear(),
    today.getMonth() + reportMonthOffset,
    1
  );
  const reportMonthExpenses = sortedExpenses.filter(expense => {
    const expenseDate = new Date(expense.date);
    return (
      expenseDate.getFullYear() === reportMonthDate.getFullYear() &&
      expenseDate.getMonth() === reportMonthDate.getMonth()
    );
  });
  const reportMonthTotal = reportMonthExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  const categoryMap = new Map<string, number>();
  for (const expense of reportMonthExpenses) {
    categoryMap.set(expense.category, (categoryMap.get(expense.category) ?? 0) + expense.amount);
  }

  const categorySummary = Array.from(categoryMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: reportMonthTotal > 0 ? (value / reportMonthTotal) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);

  const monthLabelRaw = reportMonthDate
    .toLocaleString('pt-BR', { month: 'short' })
    .replace('.', '');
  const reportMonthLabel = `${monthLabelRaw.charAt(0).toUpperCase()}${monthLabelRaw.slice(1)} ${reportMonthDate.getFullYear()}`;

  const monthSegmentOptions = [-1, 0, 1].map(delta => {
    const date = new Date(
      reportMonthDate.getFullYear(),
      reportMonthDate.getMonth() + delta,
      1
    );
    const labelRaw = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    return {
      offset: reportMonthOffset + delta,
      label: `${labelRaw.charAt(0).toUpperCase()}${labelRaw.slice(1)}`,
    };
  });

  const reportTabsConfig = [
    { id: 'general' as const, label: 'Geral', icon: ListTodo },
    { id: 'card' as const, label: 'Cartão', icon: CreditCard },
    { id: 'account' as const, label: 'Conta', icon: Wallet },
    { id: 'category' as const, label: 'Categoria', icon: PieChart },
  ] as const;

  let reportContent: ReactNode;

  if (reportTab === 'general') {
    if (reportMonthExpenses.length === 0) {
      reportContent = (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm text-emerald-700">
          <p className="text-base font-semibold">Ainda sem lançamento?</p>
          <p className="mt-2 text-emerald-600">
            Cadastre um novo lançamento clicando em adicionar logo abaixo no menu.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenOverlay('expense-tracker')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Adicionar manualmente
            </button>
            <button
              type="button"
              onClick={() => handleOpenOverlay('banking')}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              <Zap className="h-4 w-4" />
              Conectar Open Finance
            </button>
          </div>
        </div>
      );
    } else {
      reportContent = (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            <span>Total do mês</span>
            <span>{formatCurrency(reportMonthTotal)}</span>
          </div>
          {reportMonthExpenses.slice(0, 6).map(expense => (
            <div
              key={expense.id}
              className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
            >
              <div>
                <p className="text-sm font-semibold text-slate-900">{expense.description}</p>
                <p className="text-xs text-slate-500">
                  {formatDate(expense.date)} · {expense.category}
                </p>
              </div>
              <p className="text-sm font-semibold text-emerald-600">
                {formatCurrency(expense.amount)}
              </p>
            </div>
          ))}
          {reportMonthExpenses.length > 6 && (
            <p className="text-xs text-slate-500">
              +{reportMonthExpenses.length - 6} lançamentos adicionais neste mês
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleOpenOverlay('transactions')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
            >
              Ver histórico completo
            </button>
            <button
              type="button"
              onClick={() => handleOpenOverlay('expense-tracker')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
            >
              Registrar novo lançamento
            </button>
          </div>
        </div>
      );
    }
  } else if (reportTab === 'card') {
    if (creditCardSummary && creditCardSummary.totalCards > 0) {
      reportContent = (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-4 text-xs text-indigo-700">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
                Limite disponível
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatCurrency(creditCardSummary.availableCredit)}
              </p>
              <p className="text-xs text-indigo-600">
                Total cadastrado {formatCurrency(creditCardSummary.totalLimit)}
              </p>
            </div>
            <div className="rounded-3xl border border-indigo-100 bg-white p-4 text-xs text-slate-600">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-indigo-500">
                Uso atual
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatCurrency(creditCardSummary.usedLimit)}
              </p>
              <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-violet-500 via-sky-500 to-indigo-600"
                  style={{
                    width: `${creditCardSummary.totalLimit > 0
                      ? Math.min(
                          (creditCardSummary.usedLimit / creditCardSummary.totalLimit) * 100,
                          100
                        )
                      : 0}%`,
                  }}
                />
              </div>
              {nextDueDateLabel && (
                <p className="mt-2 text-xs text-slate-500">
                  Próxima fatura prevista para {nextDueDateLabel}
                </p>
              )}
            </div>
          </div>
          <div className="space-y-3">
            {creditCardsPreview.map(card => (
              <div key={card.id} className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                    <p className="text-xs text-slate-500">Fatura no dia {card.dueDay}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(card.balance)}
                    </p>
                    <p className="text-xs text-slate-500">de {formatCurrency(card.limit)}</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                    style={{ width: `${Math.min(card.utilization, 100)}%` }}
                  />
                </div>
              </div>
            ))}
            {creditCardSummary.totalCards > creditCardsPreview.length && (
              <p className="text-xs text-slate-500">
                +{creditCardSummary.totalCards - creditCardsPreview.length} cartões adicionais cadastrados
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleOpenOverlay('credit-cards')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
          >
            Gerenciar cartões
          </button>
        </div>
      );
    } else {
      reportContent = (
        <div className="rounded-3xl border border-dashed border-indigo-200 bg-indigo-50/50 p-6 text-center text-sm text-indigo-600">
          <p className="text-base font-semibold">Nenhum cartão cadastrado.</p>
          <p className="mt-2">
            Adicione seus cartões para acompanhar limites e faturas automaticamente.
          </p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => handleOpenOverlay('credit-cards')}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-violet-600 hover:to-indigo-700"
            >
              <CreditCard className="h-4 w-4" />
              Adicionar cartão
            </button>
          </div>
        </div>
      );
    }
  } else if (reportTab === 'account') {
    if (openFinanceSummary) {
      reportContent = (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4 text-xs text-emerald-700">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
                Saldo consolidado
              </p>
              <p className="mt-2 text-xl font-semibold text-slate-900">
                {formatCurrency(openFinanceSummary.totalBalance)}
              </p>
              <p className="text-xs text-emerald-600">
                {openFinanceSummary.totalAccounts} contas conectadas
              </p>
            </div>
            <div className="rounded-3xl border border-emerald-100 bg-white p-4 text-sm text-slate-600">
              <p>
                Sincronizações automáticas:{' '}
                <span className="font-semibold text-slate-900">
                  {openFinanceSummary.autoSyncEnabled}
                </span>
              </p>
              <p className="mt-1">
                Conexões Open Finance:{' '}
                <span className="font-semibold text-slate-900">
                  {openFinanceSummary.pluggyConnections}
                </span>
              </p>
              <p className="mt-2 text-xs text-slate-500">{openFinanceLastSyncLabel}</p>
            </div>
          </div>
          {openFinanceSummary.institutions.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              {openFinanceSummary.institutions.slice(0, 6).map(institution => (
                <span
                  key={institution}
                  className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                  {institution}
                </span>
              ))}
              {openFinanceSummary.institutions.length > 6 && (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1">
                  +{openFinanceSummary.institutions.length - 6}
                </span>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleOpenOverlay('accounts')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
            >
              Gerenciar contas
            </button>
            <button
              type="button"
              onClick={() => handleOpenOverlay('banking')}
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
            >
              Sincronizar Open Finance
            </button>
          </div>
        </div>
      );
    } else {
      reportContent = (
        <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center text-sm text-emerald-600">
          <p className="text-base font-semibold">Nenhuma conta conectada.</p>
          <p className="mt-2">
            Conecte suas instituições financeiras pelo Open Finance para acompanhar saldos automaticamente.
          </p>
          <div className="mt-4 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenOverlay('banking')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-600"
            >
              <Zap className="h-4 w-4" />
              Iniciar conexão
            </button>
            <button
              type="button"
              onClick={() => handleOpenOverlay('accounts')}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 px-4 py-2 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-50"
            >
              Cadastro manual
            </button>
          </div>
        </div>
      );
    }
  } else {
    if (categorySummary.length > 0) {
      reportContent = (
        <div className="space-y-4">
          {categorySummary.map(item => (
            <div key={item.category} className="rounded-3xl border border-slate-100 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">{item.category}</p>
                <p className="text-sm font-semibold text-slate-900">
                  {formatCurrency(item.value)}
                </p>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"
                  style={{ width: `${Math.min(item.percentage, 100)}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {item.percentage.toFixed(1)}% dos lançamentos do mês
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={() => handleOpenOverlay('analytics')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Explorar gráficos completos
          </button>
        </div>
      );
    } else {
      reportContent = (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-600">
          <p className="text-base font-semibold">Ainda sem categorias ativas.</p>
          <p className="mt-2">Adicione lançamentos para visualizar a distribuição por categoria.</p>
          <div className="mt-4 flex justify-center">
            <button
              type="button"
              onClick={() => handleOpenOverlay('expense-tracker')}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-600"
            >
              <Plus className="h-4 w-4" />
              Adicionar lançamento
            </button>
          </div>
        </div>
      );
    }
  }

  const homeView = (
    <>
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-emerald-600">
            {firstName ? `Olá, ${firstName}!` : 'Bem-vindo!'}
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Controle total do seu financeiro.
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Cadastre lançamentos, acompanhe cartões e conecte suas contas em minutos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefreshFinanceSummary}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setActivePrimaryView('reports')}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-100 bg-white text-emerald-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <Bell className="h-4 w-4" />
          </button>
          <AuthButton />
        </div>
      </header>

      <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Seu próximo passo
            </p>
            <h2 className="mt-2 text-2xl font-semibold">Centralize suas contas em poucos cliques</h2>
            <p className="mt-2 max-w-sm text-sm text-white/80">
              Vincule seus bancos, organize lançamentos e receba alertas personalizados.
            </p>
          </div>
          <TrendingUp className="hidden h-16 w-16 text-white/60 sm:block" />
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => handleOpenOverlay('accounts')}
            className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-emerald-600 shadow transition hover:bg-emerald-50"
          >
            <Mail className="h-4 w-4" />
            Vincular e-mail à conta
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('banking')}
            className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Zap className="h-4 w-4" />
            Conectar Open Finance
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {homeSummaryCards.map(card => (
          <button
            key={card.id}
            type="button"
            onClick={card.action}
            className="group flex flex-col gap-2 rounded-3xl bg-white p-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
              {card.label}
            </span>
            <span className="text-2xl font-semibold text-slate-900">{card.value}</span>
            <span className="text-xs text-slate-500">{card.helper}</span>
          </button>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
              Administre Pro
            </p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">
              Assine o Premium por R$ 29,90/mensal
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Desbloqueie dashboards avançados, previsões e relatórios automáticos para o seu negócio.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Painéis dinâmicos</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Alertas inteligentes</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">Exportação de dados</span>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenOverlay('analytics')}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
        >
          Conhecer planos
        </button>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Meus cartões</h2>
            <p className="text-sm text-slate-500">
              Controle limites, faturas e vínculos em tempo real.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenOverlay('credit-cards')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Gerenciar
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {financeSummaryLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(item => (
                <div key={item} className="h-16 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          ) : creditCardSummary && creditCardSummary.totalCards > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-indigo-100 bg-indigo-50/70 p-4 text-xs text-indigo-700">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em]">
                    Limite disponível
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCurrency(creditCardSummary.availableCredit)}
                  </p>
                  <p className="text-xs text-indigo-600">
                    Total cadastrado {formatCurrency(creditCardSummary.totalLimit)}
                  </p>
                </div>
                <div className="rounded-3xl border border-indigo-100 bg-white p-4 text-xs text-slate-600">
                  <p className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-indigo-500">
                    Uso atual
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCurrency(creditCardSummary.usedLimit)}
                  </p>
                  <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-violet-500 via-sky-500 to-indigo-600"
                      style={{
                        width: `${creditCardSummary.totalLimit > 0
                          ? Math.min(
                              (creditCardSummary.usedLimit / creditCardSummary.totalLimit) * 100,
                              100
                            )
                          : 0}%`,
                      }}
                    />
                  </div>
                  {nextDueDateLabel && (
                    <p className="mt-2 text-xs text-slate-500">
                      Próxima fatura prevista para {nextDueDateLabel}
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                {creditCardsPreview.map(card => (
                  <div key={card.id} className="rounded-3xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{card.name}</p>
                        <p className="text-xs text-slate-500">Fatura no dia {card.dueDay}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">
                          {formatCurrency(card.balance)}
                        </p>
                        <p className="text-xs text-slate-500">de {formatCurrency(card.limit)}</p>
                      </div>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600"
                        style={{ width: `${Math.min(card.utilization, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
                {creditCardSummary.totalCards > creditCardsPreview.length && (
                  <p className="text-xs text-slate-500">
                    +{creditCardSummary.totalCards - creditCardsPreview.length} cartões cadastrados
                  </p>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Você ainda não tem nenhum cartão cadastrado.
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('credit-cards')}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow transition hover:from-violet-600 hover:to-indigo-700"
                >
                  <CreditCard className="h-4 w-4" />
                  Adicionar cartão
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Minhas contas</h2>
            <p className="text-sm text-slate-500">
              Saldos consolidados e sincronizações do Open Finance.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRefreshFinanceSummary}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Atualizar
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm text-slate-600">
          {openFinanceSummary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                    Saldo total
                  </p>
                  <p className="mt-2 text-xl font-semibold text-slate-900">
                    {formatCurrency(openFinanceSummary.totalBalance)}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {openFinanceSummary.totalAccounts} contas conectadas automaticamente
                  </p>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-white p-4 text-xs text-slate-500">
                  <p className="text-sm text-slate-600">
                    Sincronizações automáticas ativadas:{' '}
                    <span className="font-semibold text-slate-900">
                      {openFinanceSummary.autoSyncEnabled}
                    </span>
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Conexões Pluggy:{' '}
                    <span className="font-semibold text-slate-900">
                      {openFinanceSummary.pluggyConnections}
                    </span>
                  </p>
                  <p className="mt-2">{openFinanceLastSyncLabel}</p>
                </div>
              </div>
              {openFinanceSummary.institutions.length > 0 && (
                <div className="flex flex-wrap gap-2 text-xs">
                  {openFinanceSummary.institutions.slice(0, 6).map(institution => (
                    <span
                      key={institution}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                      {institution}
                    </span>
                  ))}
                  {openFinanceSummary.institutions.length > 6 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                      +{openFinanceSummary.institutions.length - 6} instituições
                    </span>
                  )}
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('accounts')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  Gerenciar contas
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('banking')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  Sincronizar Open Finance
                </button>
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Conecte suas contas bancárias para acompanhar saldos automaticamente.
              <div className="mt-4 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('banking')}
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-xs font-semibold text-white shadow transition hover:bg-emerald-600"
                >
                  <Zap className="h-4 w-4" />
                  Iniciar conexão
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenOverlay('accounts')}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
                >
                  Cadastro manual
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="mb-4 rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Transações recentes</h2>
            <p className="text-sm text-slate-500">
              Cadastre manualmente ou importe via Open Finance.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleOpenOverlay('transactions')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Ver todas
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          {recentExpenses.length > 0 ? (
            recentExpenses.map(expense => (
              <div
                key={expense.id}
                className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white px-4 py-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">{expense.description}</p>
                  <p className="text-xs text-slate-500">
                    {formatDate(expense.date)} · {expense.category}
                  </p>
                </div>
                <span className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              Ainda sem lançamento? Cadastre um novo lançamento clicando em adicionar logo abaixo no menu.
            </div>
          )}
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleOpenOverlay('expense-tracker')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-emerald-600"
          >
            <Plus className="h-4 w-4" />
            Adicionar manualmente
          </button>
          <button
            type="button"
            onClick={() => handleOpenOverlay('banking')}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            <Zap className="h-4 w-4" />
            Importar pelo Open Finance
          </button>
        </div>
      </section>
    </>
  );

  const reportsView = (
    <section className="mb-4 rounded-3xl bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">Relatório</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Relatório detalhado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe seus lançamentos por mês e visualize insights personalizados.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            {reportMonthLabel}
          </span>
          <button
            type="button"
            onClick={() => handleOpenOverlay('analytics')}
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:border-emerald-200 hover:text-emerald-600"
          >
            Ver gráficos
          </button>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setReportMonthOffset(previous => previous - 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex gap-2">
          {monthSegmentOptions.map(option => (
            <button
              key={option.offset}
              type="button"
              onClick={() => setReportMonthOffset(option.offset)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                option.offset === reportMonthOffset
                  ? 'bg-emerald-500 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setReportMonthOffset(previous => previous + 1)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 transition hover:border-emerald-200 hover:text-emerald-600"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl bg-slate-100 p-1 text-sm font-semibold text-slate-600">
        {reportTabsConfig.map(tab => {
          const Icon = tab.icon;
          const isActive = reportTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setReportTab(tab.id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2 transition ${
                isActive ? 'bg-white text-emerald-600 shadow-sm' : 'hover:text-emerald-600'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6 space-y-4">{reportContent}</div>
    </section>
  );

  type BottomNavItem = {
    id: string;
    label: string;
    icon: LucideIcon;
    onClick: () => void;
    active?: boolean;
    accent?: boolean;
  };

  const bottomNavItems: BottomNavItem[] = [
    {
      id: 'home',
      label: 'Início',
      icon: HomeIcon,
      onClick: () => setActivePrimaryView('home'),
      active: activePrimaryView === 'home',
    },
    {
      id: 'reports',
      label: 'Relatórios',
      icon: LineChart,
      onClick: () => {
        setActivePrimaryView('reports');
        setReportTab('general');
      },
      active: activePrimaryView === 'reports',
    },
    {
      id: 'add',
      label: 'Adicionar',
      icon: Plus,
      onClick: () => handleOpenOverlay('expense-tracker'),
      accent: true,
    },
    {
      id: 'cards',
      label: 'Cartões',
      icon: CreditCard,
      onClick: () => handleOpenOverlay('credit-cards'),
    },
    {
      id: 'accounts',
      label: 'Contas',
      icon: UserCircle,
      onClick: () => handleOpenOverlay('accounts'),
    },
  ] as const;

  return (
    <div className="relative min-h-screen bg-slate-50 pb-24 text-slate-900">
      <main className="mx-auto flex min-h-screen max-w-md flex-col gap-6 px-4 pb-32 pt-12 sm:max-w-2xl sm:px-6">
        {activePrimaryView === 'home' ? homeView : reportsView}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-between gap-2 sm:max-w-2xl">
          {bottomNavItems.map(item => {
            const Icon = item.icon;
            if (item.accent) {
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="relative -translate-y-6 rounded-full bg-emerald-500 p-4 text-white shadow-lg transition hover:bg-emerald-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                  aria-label={item.label}
                >
                  <Icon className="h-6 w-6" />
                </button>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs font-semibold transition ${
                  item.active ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'
                }`}
              >
                <Icon className={`h-5 w-5 ${item.active ? 'text-emerald-600' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>

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
