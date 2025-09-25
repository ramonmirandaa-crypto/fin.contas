import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Wallet,
  TrendingUp,
  Target,
  CreditCard,
  Banknote,
  BarChart3,
  Building2,
  Zap,
  Bell,
  Bolt,
  ShieldCheck,
  Brain,
  Sparkles,
} from 'lucide-react';
import ExpenseTracker from '@/react-app/components/blocks/ExpenseTracker';
import AIInsights from '@/react-app/components/AIInsights';
import ExpenseGraphs from '@/react-app/components/ExpenseGraphs';
import CreditCardManager from '@/react-app/components/CreditCardManager';
import InvestmentManager from '@/react-app/components/InvestmentManager';
import LoanManager from '@/react-app/components/LoanManager';
import FinancialDashboard from '@/react-app/components/FinancialDashboard';
import PluggyManager from '@/react-app/components/PluggyManager';
import AccountManager from '@/react-app/components/AccountManager';
import NotificationCenter from '@/react-app/components/blocks/NotificationCenter';
import QuickActions from '@/react-app/components/blocks/QuickActions';
import TransactionManager from '@/react-app/components/TransactionManager';
import TransactionCategoryManager from '@/react-app/components/TransactionCategoryManager';
import type { OverlayView } from '@/react-app/components/sections/FinancePreviewSection';
import type { CreateExpense, Expense } from '@/shared/types';

export interface HighlightItem {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string;
}

export const HIGHLIGHT_ITEMS: HighlightItem[] = [
  {
    icon: TrendingUp,
    title: 'Insights preditivos',
    description: 'Antecipe movimentos de fluxo de caixa com análises guiadas por IA.',
    accent: 'linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(20, 184, 166, 0.15))',
  },
  {
    icon: Brain,
    title: 'IA que entende você',
    description: 'Sugestões contextuais baseadas em hábitos e metas do seu perfil.',
    accent: 'linear-gradient(135deg, rgba(34, 211, 238, 0.25), rgba(56, 189, 248, 0.1))',
  },
  {
    icon: ShieldCheck,
    title: 'Segurança multicamada',
    description: 'Conexões Open Finance com monitoramento contínuo e proteção reforçada.',
    accent: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.1))',
  },
  {
    icon: Bolt,
    title: 'Automação em minutos',
    description: 'Ações rápidas para organizar despesas, contas e notificações.',
    accent: 'linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(249, 115, 22, 0.1))',
  },
];

interface OverlayConfigEntry {
  title: string;
  description: string;
  icon: LucideIcon;
  render: () => ReactNode;
}

export type OverlayConfig = Record<OverlayView, OverlayConfigEntry>;

interface BuildOverlayConfigOptions {
  expenses: Expense[];
  onAddExpense: (expense: CreateExpense) => void;
  submitting: boolean;
  refreshInsights: number;
}

export function buildOverlayConfig({
  expenses,
  onAddExpense,
  submitting,
  refreshInsights,
}: BuildOverlayConfigOptions): OverlayConfig {
  return {
    dashboard: {
      title: 'Painel financeiro completo',
      description: 'Visualize sua saúde financeira com KPIs, projeções e status consolidado.',
      icon: BarChart3,
      render: () => <FinancialDashboard expenses={expenses} />,
    },
    'expense-tracker': {
      title: 'Rastreamento de gastos',
      description: 'Cadastre despesas, categorize rapidamente e acompanhe tendências em tempo real.',
      icon: Wallet,
      render: () => (
        <ExpenseTracker expenses={expenses} onAddExpense={onAddExpense} loading={submitting} />
      ),
    },
    transactions: {
      title: 'Gestão de transações',
      description: 'Revise lançamentos, filtre por categorias e mantenha seu histórico organizado.',
      icon: Target,
      render: () => (
        <div className="space-y-6">
          <TransactionManager />
        </div>
      ),
    },
    categories: {
      title: 'Categorias personalizadas',
      description: 'Estruture categorias e subcategorias para uma análise precisa.',
      icon: Target,
      render: () => <TransactionCategoryManager />,
    },
    accounts: {
      title: 'Contas conectadas',
      description: 'Gerencie instituições, sincronizações e saldos dentro do Open Finance.',
      icon: Building2,
      render: () => <AccountManager />,
    },
    banking: {
      title: 'Integrações Open Finance',
      description: 'Configure conexões com bancos e cartões por meio da infraestrutura Pluggy.',
      icon: Zap,
      render: () => <PluggyManager />,
    },
    'credit-cards': {
      title: 'Gestão de cartões',
      description: 'Acompanhe limites, faturas e benefícios em um hub visual.',
      icon: CreditCard,
      render: () => <CreditCardManager />,
    },
    investments: {
      title: 'Carteira de investimentos',
      description: 'Mapeie aplicações, acompanhe rentabilidade e tendências de mercado.',
      icon: TrendingUp,
      render: () => <InvestmentManager />,
    },
    loans: {
      title: 'Gestão de empréstimos',
      description: 'Centralize parcelas, juros e prazos para planejar seus pagamentos.',
      icon: Banknote,
      render: () => <LoanManager />,
    },
    insights: {
      title: 'Insights de IA',
      description: 'Receba análises e recomendações inteligentes baseadas nos seus dados.',
      icon: Sparkles,
      render: () => <AIInsights refreshKey={refreshInsights} />,
    },
    analytics: {
      title: 'Análises e gráficos',
      description: 'Explore dashboards visualmente ricos para entender padrões de gasto.',
      icon: BarChart3,
      render: () => <ExpenseGraphs expenses={expenses} />,
    },
    notifications: {
      title: 'Central de notificações',
      description: 'Configure alertas, acompanhe lembretes e mantenha o controle em dia.',
      icon: Bell,
      render: () => <NotificationCenter />,
    },
    'quick-actions': {
      title: 'Ações rápidas',
      description: 'Acelere tarefas frequentes com atalhos inteligentes.',
      icon: Bolt,
      render: () => <QuickActions />,
    },
  };
}
