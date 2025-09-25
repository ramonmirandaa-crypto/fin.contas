import { TrendingUp, TrendingDown, DollarSign, Target, CreditCard, PiggyBank } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Badge } from '@/react-app/components/ui/Badge';
import { formatCurrency, cn } from '@/react-app/utils';

interface StatCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function StatCard({ title, value, change, changeLabel, icon, variant = 'default' }: StatCardProps) {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;
  
  const cardVariants = {
    default: 'bg-white/70',
    success: 'bg-gradient-to-br from-green-50 to-emerald-50',
    warning: 'bg-gradient-to-br from-yellow-50 to-orange-50',
    danger: 'bg-gradient-to-br from-red-50 to-pink-50',
  };

  return (
    <Card className={cn('backdrop-blur-sm border-white/50', cardVariants[variant])}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-2 mt-2">
            {isPositive && <TrendingUp className="h-4 w-4 text-green-600" />}
            {isNegative && <TrendingDown className="h-4 w-4 text-red-600" />}
            {change === 0 && <div className="h-4 w-4" />}
            <Badge
              variant={isPositive ? 'success' : isNegative ? 'destructive' : 'secondary'}
              className="text-xs"
            >
              {change > 0 ? '+' : ''}{change.toFixed(1)}%
            </Badge>
            {changeLabel && (
              <span className="text-xs text-gray-600">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface FinancialStatsGridProps {
  stats: {
    totalExpenses: number;
    monthlyExpenses: number;
    avgDailySpending: number;
    totalInvestments?: number;
    totalCreditCards?: number;
    totalLoans?: number;
    expenseChange?: number;
    investmentChange?: number;
  };
}

export default function FinancialStatsGrid({ stats }: FinancialStatsGridProps) {
  const {
    totalExpenses,
    monthlyExpenses,
    avgDailySpending,
    totalInvestments = 0,
    totalCreditCards = 0,
    totalLoans = 0,
    expenseChange = 0,
    investmentChange = 0,
  } = stats;

  const statCards = [
    {
      title: 'Total em Gastos',
      value: formatCurrency(totalExpenses),
      change: expenseChange,
      changeLabel: 'vs mês anterior',
      icon: <DollarSign className="h-4 w-4" />,
      variant: 'default' as const,
    },
    {
      title: 'Gastos deste Mês',
      value: formatCurrency(monthlyExpenses),
      change: expenseChange,
      changeLabel: 'vs mês anterior',
      icon: <TrendingUp className="h-4 w-4" />,
      variant: monthlyExpenses > totalExpenses * 0.3 ? ('warning' as const) : ('success' as const),
    },
    {
      title: 'Média por Gasto',
      value: formatCurrency(avgDailySpending),
      icon: <Target className="h-4 w-4" />,
      variant: 'default' as const,
    },
    {
      title: 'Total Investido',
      value: formatCurrency(totalInvestments),
      change: investmentChange,
      changeLabel: 'rentabilidade',
      icon: <PiggyBank className="h-4 w-4" />,
      variant: totalInvestments > 0 ? ('success' as const) : ('default' as const),
    },
    {
      title: 'Cartões de Crédito',
      value: formatCurrency(totalCreditCards),
      icon: <CreditCard className="h-4 w-4" />,
      variant: totalCreditCards > 1000 ? ('warning' as const) : ('default' as const),
    },
    {
      title: 'Empréstimos',
      value: formatCurrency(totalLoans),
      icon: <TrendingDown className="h-4 w-4" />,
      variant: totalLoans > 0 ? ('danger' as const) : ('success' as const),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
