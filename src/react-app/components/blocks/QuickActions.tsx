import { useEffect, useState } from 'react';
import { 
  Plus, 
  TrendingUp, 
  CreditCard, 
  Target, 
  RefreshCw, 
  Calculator,
  PiggyBank,
  FileText,
  Download,
  Upload,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Button } from '@/react-app/components/ui/Button';
import { Badge } from '@/react-app/components/ui/Badge';
import { cn } from '@/react-app/utils';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  variant: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  onClick: () => void;
  badge?: string;
  disabled?: boolean;
  category: 'transaction' | 'investment' | 'goal' | 'report' | 'sync' | 'tool';
}

interface QuickActionsProps {
  actions?: QuickAction[];
  onActionClick?: (actionId: string) => void;
  layout?: 'grid' | 'list';
  categories?: string[];
  onLayoutChange?: (layout: 'grid' | 'list') => void;
}

const ACTION_VARIANTS = {
  primary: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700',
  secondary: 'bg-gradient-to-br from-gray-500 to-gray-600 text-white hover:from-gray-600 hover:to-gray-700',
  success: 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700',
  warning: 'bg-gradient-to-br from-yellow-500 to-orange-600 text-white hover:from-yellow-600 hover:to-orange-700',
  info: 'bg-gradient-to-br from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700',
};

function QuickActionCard({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer group">
      <CardContent className="p-6">
        <div 
          className="flex flex-col items-center text-center space-y-4"
          onClick={onClick}
        >
          <div className={cn(
            'p-4 rounded-2xl transition-all duration-200 group-hover:scale-110',
            ACTION_VARIANTS[action.variant],
            action.disabled && 'opacity-50 cursor-not-allowed'
          )}>
            {action.icon}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 justify-center">
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              {action.badge && (
                <Badge variant="emerald" className="text-xs">
                  {action.badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{action.description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActionList({ action, onClick }: { action: QuickAction; onClick: () => void }) {
  return (
    <Card className="transition-all duration-200 hover:shadow-md cursor-pointer group">
      <CardContent className="p-4">
        <div 
          className="flex items-center gap-4"
          onClick={onClick}
        >
          <div className={cn(
            'p-3 rounded-xl transition-all duration-200 group-hover:scale-105',
            ACTION_VARIANTS[action.variant],
            action.disabled && 'opacity-50 cursor-not-allowed'
          )}>
            {action.icon}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900">{action.title}</h3>
              {action.badge && (
                <Badge variant="emerald" className="text-xs">
                  {action.badge}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{action.description}</p>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            disabled={action.disabled}
          >
            Executar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QuickActions({
  actions = [],
  onActionClick,
  layout = 'grid',
  onLayoutChange
}: QuickActionsProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState(layout);

  useEffect(() => {
    setViewMode(layout);
  }, [layout]);

  const handleViewModeChange = (mode: 'grid' | 'list') => {
    setViewMode(mode);
    onLayoutChange?.(mode);
  };

  // Default quick actions
  const defaultActions: QuickAction[] = [
    {
      id: 'add-expense',
      title: 'Adicionar Gasto',
      description: 'Registre um novo gasto rapidamente',
      icon: <Plus className="w-6 h-6" />,
      variant: 'primary',
      category: 'transaction',
      onClick: () => console.log('Add expense'),
    },
    {
      id: 'add-investment',
      title: 'Novo Investimento',
      description: 'Registre um investimento realizado',
      icon: <TrendingUp className="w-6 h-6" />,
      variant: 'success',
      category: 'investment',
      onClick: () => console.log('Add investment'),
    },
    {
      id: 'pay-credit-card',
      title: 'Pagar Cartão',
      description: 'Registre o pagamento da fatura',
      icon: <CreditCard className="w-6 h-6" />,
      variant: 'warning',
      category: 'transaction',
      badge: '3 pendentes',
      onClick: () => console.log('Pay credit card'),
    },
    {
      id: 'create-goal',
      title: 'Nova Meta',
      description: 'Defina uma meta financeira',
      icon: <Target className="w-6 h-6" />,
      variant: 'info',
      category: 'goal',
      onClick: () => console.log('Create goal'),
    },
    {
      id: 'sync-bank',
      title: 'Sincronizar Banco',
      description: 'Importe transações bancárias',
      icon: <RefreshCw className="w-6 h-6" />,
      variant: 'secondary',
      category: 'sync',
      onClick: () => console.log('Sync bank'),
    },
    {
      id: 'budget-calculator',
      title: 'Calculadora',
      description: 'Ferramentas de cálculo financeiro',
      icon: <Calculator className="w-6 h-6" />,
      variant: 'info',
      category: 'tool',
      onClick: () => console.log('Calculator'),
    },
    {
      id: 'emergency-fund',
      title: 'Reserva de Emergência',
      description: 'Calcule sua reserva ideal',
      icon: <PiggyBank className="w-6 h-6" />,
      variant: 'success',
      category: 'tool',
      onClick: () => console.log('Emergency fund'),
    },
    {
      id: 'monthly-report',
      title: 'Relatório Mensal',
      description: 'Gere relatório do mês atual',
      icon: <FileText className="w-6 h-6" />,
      variant: 'secondary',
      category: 'report',
      onClick: () => console.log('Monthly report'),
    },
    {
      id: 'export-data',
      title: 'Exportar Dados',
      description: 'Baixe seus dados em Excel/CSV',
      icon: <Download className="w-6 h-6" />,
      variant: 'info',
      category: 'report',
      onClick: () => console.log('Export data'),
    },
    {
      id: 'import-data',
      title: 'Importar Dados',
      description: 'Importe dados de planilhas',
      icon: <Upload className="w-6 h-6" />,
      variant: 'secondary',
      category: 'sync',
      onClick: () => console.log('Import data'),
    },
    {
      id: 'quick-transfer',
      title: 'Transferência Rápida',
      description: 'Entre contas ou investimentos',
      icon: <Zap className="w-6 h-6" />,
      variant: 'warning',
      category: 'transaction',
      badge: 'Novo',
      onClick: () => console.log('Quick transfer'),
    },
  ];

  const displayActions = actions.length > 0 ? actions : defaultActions;

  // Filter by category
  const filteredActions = selectedCategory === 'all' 
    ? displayActions 
    : displayActions.filter(action => action.category === selectedCategory);

  // Available categories
  const availableCategories = [
    { id: 'all', label: 'Todas', count: displayActions.length },
    { id: 'transaction', label: 'Transações', count: displayActions.filter(a => a.category === 'transaction').length },
    { id: 'investment', label: 'Investimentos', count: displayActions.filter(a => a.category === 'investment').length },
    { id: 'goal', label: 'Metas', count: displayActions.filter(a => a.category === 'goal').length },
    { id: 'report', label: 'Relatórios', count: displayActions.filter(a => a.category === 'report').length },
    { id: 'sync', label: 'Sincronização', count: displayActions.filter(a => a.category === 'sync').length },
    { id: 'tool', label: 'Ferramentas', count: displayActions.filter(a => a.category === 'tool').length },
  ].filter(cat => cat.count > 0);

  const handleActionClick = (action: QuickAction) => {
    if (action.disabled) return;
    
    if (onActionClick) {
      onActionClick(action.id);
    } else {
      action.onClick();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Ações Rápidas</CardTitle>
                <p className="text-sm text-gray-600">
                  Acesse as funcionalidades mais usadas com um clique
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Category Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {availableCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="gap-2"
              >
                {category.label}
                <Badge variant="secondary" className="text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions Grid/List */}
      <div className={cn(
        viewMode === 'grid'
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
          : 'space-y-3'
      )}>
        {filteredActions.map((action) => (
          viewMode === 'grid' ? (
            <QuickActionCard
              key={action.id}
              action={action}
              onClick={() => handleActionClick(action)}
            />
          ) : (
            <QuickActionList
              key={action.id}
              action={action}
              onClick={() => handleActionClick(action)}
            />
          )
        ))}
      </div>

      {filteredActions.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Zap className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma ação na categoria selecionada
            </h3>
            <p className="text-gray-600">
              Selecione uma categoria diferente para ver as ações disponíveis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
