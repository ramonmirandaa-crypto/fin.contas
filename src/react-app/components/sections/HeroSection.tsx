import { RefreshCw, Sparkles, Wallet } from 'lucide-react';
import AuthButton from '@/react-app/components/AuthButton';
import type { OverlayView } from './FinancePreviewSection';
import { formatCurrency } from '@/react-app/utils';

interface HeroSectionProps {
  userName?: string | null;
  onRefreshInsights: () => void;
  onOpenOverlay: (view: OverlayView) => void;
  thisMonthExpenses: number;
  totalExpenses: number;
}

export default function HeroSection({
  userName,
  onRefreshInsights,
  onOpenOverlay,
  thisMonthExpenses,
  totalExpenses,
}: HeroSectionProps) {
  const firstName = userName?.split(' ')[0];

  return (
    <section className="relative pb-24 pt-20 text-left">
      <div className="absolute inset-x-0 top-0 -z-10 flex h-[520px] justify-center overflow-hidden" aria-hidden="true">
        <div className="aurora-gradient" />
      </div>

      <nav className="relative mb-16 flex items-center justify-between gap-6 rounded-full border border-emerald-100/70 bg-white/80 px-6 py-4 shadow-xl backdrop-blur">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">Financeito</p>
            <p className="text-sm text-slate-600">Fluxo financeiro com IA generativa</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onRefreshInsights}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-100/80 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar insights
          </button>
          <AuthButton />
        </div>
      </nav>

      <div className="relative grid items-center gap-16 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-6">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-1 text-xs font-medium uppercase tracking-[0.4em] text-emerald-600">
              Nova jornada financeira
            </span>
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
              Controle financeiro com IA, agora em um fluxo contínuo
              {firstName ? `, ${firstName}` : ''}.
            </h1>
            <p className="max-w-2xl text-lg text-slate-600">
              Uma jornada hero-led que conecta seus gastos, insights automáticos e integrações Open Finance em um layout vertical envolvente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => onOpenOverlay('expense-tracker')}
              className="inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:shadow-xl"
            >
              Registrar gasto agora
              <Sparkles className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenOverlay('insights')}
              className="inline-flex items-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-emerald-200 hover:text-emerald-700"
            >
              Ver insights de IA
            </button>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
              <dt className="text-sm font-medium text-emerald-600">Monitorado neste mês</dt>
              <dd className="text-2xl font-semibold text-slate-900">{formatCurrency(thisMonthExpenses)}</dd>
              <p className="text-xs text-slate-500">Capture gastos recorrentes e receba alertas automáticos.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-white p-6 shadow-lg">
              <dt className="text-sm font-medium text-emerald-600">Total acompanhado</dt>
              <dd className="text-2xl font-semibold text-slate-900">{formatCurrency(totalExpenses)}</dd>
              <p className="text-xs text-slate-500">Centralize contas, cartões e investimentos em uma única visão.</p>
            </div>
          </dl>
        </div>

        <div className="relative hidden min-h-[420px] items-center justify-center lg:flex">
          <div className="absolute inset-0 -z-10 animate-pulse-slow rounded-full bg-emerald-200/50 blur-3xl" aria-hidden="true" />
          <div className="relative flex w-full max-w-md flex-col gap-6">
            <div className="rounded-3xl border border-emerald-100 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Resumo diário</span>
                <span className="text-xs text-slate-400">IA ativa</span>
              </div>
              <div className="mt-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Este mês</p>
                  <p className="mt-1 text-3xl font-semibold text-slate-900">{formatCurrency(thisMonthExpenses)}</p>
                </div>
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-500">Recomendação</p>
                  <p className="mt-2 text-sm text-slate-600">
                    Ajuste o orçamento da categoria com maior crescimento e abra os insights completos para sugestões personalizadas.
                  </p>
                </div>
              </div>
            </div>
            <div className="translate-x-8 rounded-3xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-xl">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <span>Contas conectadas</span>
                <button
                  type="button"
                  onClick={() => onOpenOverlay('banking')}
                  className="rounded-full border border-emerald-100 bg-white px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100"
                >
                  Abrir Open Finance
                </button>
              </div>
              <div className="mt-5 space-y-3 text-sm text-slate-600">
                <p>Carteira digital • sincronização em tempo real</p>
                <p>Cartões vinculados • monitoramento de limites</p>
                <p className="text-xs text-emerald-500">Nova integração disponível para investimentos.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
