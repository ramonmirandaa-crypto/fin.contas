import { useState, useEffect } from 'react';
import { Brain, TrendingUp, TrendingDown, Minus, Lightbulb, Loader2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { apiFetch } from '@/react-app/utils/api';
import { AIInsight } from '@/shared/types';

interface AIInsightsProps {
  refreshKey: number;
}

const COLORS = [
  '#10B981', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444',
  '#6366F1', '#EC4899', '#84CC16', '#F97316', '#6B7280'
];

export default function AIInsights({ refreshKey }: AIInsightsProps) {
  const [insight, setInsight] = useState<AIInsight | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/insights');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInsight(data.insight);
    } catch (error: any) {
      console.error('Failed to fetch insights:', error);
      
      // Provide fallback insight when API fails
      setInsight({
        summary: "Não foi possível gerar insights automáticos no momento. Os dados estão sendo processados e estarão disponíveis em breve.",
        tips: [
          "Continue registrando seus gastos para melhor análise",
          "Use a sincronização bancária para importar transações automaticamente",
          "Revise suas categorias de gastos regularmente",
          "Estabeleça metas de economia mensais"
        ],
        categoryBreakdown: {},
        spendingTrend: "stable"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [refreshKey]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-green-500" />;
      default:
        return <Minus className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'Gastos estão aumentando';
      case 'decreasing':
        return 'Gastos estão diminuindo';
      default:
        return 'Gastos estão estáveis';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'text-red-600 bg-red-50';
      case 'decreasing':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const chartData = insight ? Object.entries(insight.categoryBreakdown).map(([category, amount]) => ({
    name: category,
    value: amount,
  })) : [];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-4" />
            <p className="text-gray-600">Gerando insights com IA...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="text-center">
          <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum insight disponível</h3>
          <p className="text-gray-600">Adicione alguns gastos para obter insights da IA.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl">
          <Brain className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Insights da IA</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Summary and Trend */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Resumo dos Gastos</h3>
            <p className="text-gray-700 leading-relaxed">{insight.summary}</p>
          </div>

          <div>
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${getTrendColor(insight.spendingTrend)}`}>
              {getTrendIcon(insight.spendingTrend)}
              <span className="font-medium">{getTrendText(insight.spendingTrend)}</span>
            </div>
          </div>

          {/* Tips */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Dicas para Economizar
            </h3>
            <ul className="space-y-2">
              {insight.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-gray-700">{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhamento por Categoria</h3>
          {chartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`R$${value.toFixed(2)}`, 'Valor']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              Nenhum dado de categoria disponível
            </div>
          )}
          
          {/* Legend */}
          <div className="grid grid-cols-1 gap-2 mt-4">
            {chartData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                <span className="text-sm font-semibold text-gray-900">
                  R${item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
