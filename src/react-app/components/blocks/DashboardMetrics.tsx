import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Badge } from '@/react-app/components/ui/Badge';
import { formatCurrency, formatPercentage, cn } from '@/react-app/utils';

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeType?: 'currency' | 'percentage';
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  description?: string;
  target?: number;
  targetLabel?: string;
}

function MetricCard({
  title,
  value,
  change,
  changeType = 'percentage',
  trend = 'neutral',
  icon,
  description,
  target,
  targetLabel,
}: MetricCardProps) {
  

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4" />;
      case 'down': return <ArrowDownRight className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  const getBadgeVariant = () => {
    switch (trend) {
      case 'up': return 'success';
      case 'down': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatChange = (value: number) => {
    if (changeType === 'currency') {
      return formatCurrency(value);
    }
    return formatPercentage(value);
  };

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          
          {change !== undefined && (
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant()} className="gap-1">
                {getTrendIcon()}
                {change > 0 ? '+' : ''}{formatChange(Math.abs(change))}
              </Badge>
              <span className="text-xs text-gray-600">vs período anterior</span>
            </div>
          )}

          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}

          {target && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{targetLabel || 'Meta'}</span>
                <span className="font-medium">{formatPercentage(target)}</span>
              </div>
              <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    target >= 100 ? 'bg-green-500' : target >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                  )}
                  style={{ width: `${Math.min(target, 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface DashboardMetricsProps {
  metrics: {
    totalRevenue?: number;
    monthlyExpenses: number;
    savingsRate?: number;
    investmentReturn?: number;
    budgetUsage?: number;
    emergencyFund?: number;
    debtToIncome?: number;
    netWorth?: number;
    monthlyExpenseChange?: number;
    savingsChange?: number;
    investmentChange?: number;
    emergencyFundTarget?: number;
  };
}

export default function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const {
    totalRevenue = 0,
    monthlyExpenses,
    savingsRate = 0,
    investmentReturn = 0,
    budgetUsage = 0,
    emergencyFund = 0,
    debtToIncome = 0,
    netWorth = 0,
    monthlyExpenseChange = 0,
    savingsChange = 0,
    investmentChange = 0,
    emergencyFundTarget = 0,
  } = metrics;

  const metricCards = [
    {
      title: 'Receita Total',
      value: formatCurrency(totalRevenue),
      change: 8.2,
      trend: 'up' as const,
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Receita acumulada este mês',
    },
    {
      title: 'Gastos Mensais',
      value: formatCurrency(monthlyExpenses),
      change: monthlyExpenseChange,
      trend: monthlyExpenseChange > 0 ? ('up' as const) : monthlyExpenseChange < 0 ? ('down' as const) : ('neutral' as const),
      icon: <TrendingDown className="w-4 h-4" />,
      description: 'Total de gastos neste mês',
    },
    {
      title: 'Taxa de Poupança',
      value: formatPercentage(savingsRate),
      change: savingsChange,
      trend: savingsChange > 0 ? ('up' as const) : ('down' as const),
      icon: <Target className="w-4 h-4" />,
      description: 'Percentual poupado da receita',
      target: Math.min((savingsRate / 20) * 100, 100), // Meta de 20%
      targetLabel: 'Meta: 20%',
    },
    {
      title: 'Retorno Investimentos',
      value: formatPercentage(investmentReturn),
      change: investmentChange,
      trend: investmentReturn > 0 ? ('up' as const) : ('down' as const),
      icon: <ArrowUpRight className="w-4 h-4" />,
      description: 'Rentabilidade acumulada',
    },
    {
      title: 'Uso do Orçamento',
      value: formatPercentage(budgetUsage),
      trend: budgetUsage > 90 ? ('up' as const) : budgetUsage > 70 ? ('neutral' as const) : ('down' as const),
      icon: budgetUsage > 90 ? <AlertTriangle className="w-4 h-4" /> : <Target className="w-4 h-4" />,
      description: 'Percentual do orçamento utilizado',
      target: budgetUsage,
      targetLabel: 'Limite: 100%',
    },
    {
      title: 'Fundo de Emergência',
      value: formatCurrency(emergencyFund),
      trend: emergencyFundTarget >= 100 ? ('up' as const) : emergencyFundTarget >= 50 ? ('neutral' as const) : ('down' as const),
      icon: <Target className="w-4 h-4" />,
      description: 'Reserva para emergências',
      target: emergencyFundTarget,
      targetLabel: 'Meta: 6 meses de gastos',
    },
    {
      title: 'Endividamento',
      value: formatPercentage(debtToIncome),
      trend: debtToIncome > 30 ? ('up' as const) : debtToIncome > 20 ? ('neutral' as const) : ('down' as const),
      icon: debtToIncome > 30 ? <AlertTriangle className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />,
      description: 'Dívidas vs receita mensal',
      target: Math.max(100 - (debtToIncome / 30) * 100, 0), // Melhor quando menor
      targetLabel: 'Ideal: < 30%',
    },
    {
      title: 'Patrimônio Líquido',
      value: formatCurrency(netWorth),
      change: 12.5,
      trend: netWorth > 0 ? ('up' as const) : ('down' as const),
      icon: <TrendingUp className="w-4 h-4" />,
      description: 'Ativos - passivos',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Métricas Financeiras</h2>
          <p className="text-gray-600">Acompanhe os principais indicadores da sua saúde financeira</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => (
          <MetricCard key={index} {...metric} />
        ))}
      </div>

      {/* Financial Health Summary */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Resumo da Saúde Financeira
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                savingsRate >= 15 ? 'bg-green-100 text-green-600' : 
                savingsRate >= 10 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
              )}>
                <Target className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Poupança</h3>
              <p className="text-sm text-gray-600">
                {savingsRate >= 15 ? 'Excelente!' : savingsRate >= 10 ? 'Bom progresso' : 'Precisa melhorar'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                debtToIncome <= 20 ? 'bg-green-100 text-green-600' : 
                debtToIncome <= 30 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
              )}>
                <TrendingDown className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Endividamento</h3>
              <p className="text-sm text-gray-600">
                {debtToIncome <= 20 ? 'Controlado' : debtToIncome <= 30 ? 'Atenção' : 'Alto risco'}
              </p>
            </div>
            
            <div className="text-center">
              <div className={cn(
                'w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center',
                emergencyFundTarget >= 100 ? 'bg-green-100 text-green-600' : 
                emergencyFundTarget >= 50 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
              )}>
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="font-semibold">Emergência</h3>
              <p className="text-sm text-gray-600">
                {emergencyFundTarget >= 100 ? 'Protegido' : emergencyFundTarget >= 50 ? 'Em progresso' : 'Vulnerável'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
