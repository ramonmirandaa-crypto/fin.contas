import { useState } from 'react';
import { Target, Plus, Calendar, Check, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Button } from '@/react-app/components/ui/Button';
import { Input } from '@/react-app/components/ui/Input';
import { Badge } from '@/react-app/components/ui/Badge';
import { formatCurrency, formatDate, cn } from '@/react-app/utils';

interface Goal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  category: 'savings' | 'investment' | 'expense_reduction' | 'debt_payment' | 'other';
  status: 'active' | 'completed' | 'paused';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface GoalTrackerProps {
  goals?: Goal[];
  onAddGoal?: (goal: Omit<Goal, 'id' | 'createdAt'>) => void;
  onUpdateGoal?: (goalId: string, updates: Partial<Goal>) => void;
  onDeleteGoal?: (goalId: string) => void;
}

const GOAL_CATEGORIES = [
  { value: 'savings', label: 'Poupança', color: 'bg-green-100 text-green-800' },
  { value: 'investment', label: 'Investimento', color: 'bg-blue-100 text-blue-800' },
  { value: 'expense_reduction', label: 'Redução de Gastos', color: 'bg-orange-100 text-orange-800' },
  { value: 'debt_payment', label: 'Pagamento de Dívida', color: 'bg-red-100 text-red-800' },
  { value: 'other', label: 'Outros', color: 'bg-gray-100 text-gray-800' },
];

const PRIORITY_LEVELS = [
  { value: 'low', label: 'Baixa', color: 'bg-gray-100 text-gray-800' },
  { value: 'medium', label: 'Média', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'high', label: 'Alta', color: 'bg-red-100 text-red-800' },
];

function GoalCard({ goal, onUpdate, onDelete }: { 
  goal: Goal; 
  onUpdate?: (updates: Partial<Goal>) => void;
  onDelete?: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(goal.currentAmount);

  const hasTargetAmount = goal.targetAmount > 0;
  const rawProgress = hasTargetAmount ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const progressPercentage = Number.isFinite(rawProgress) ? rawProgress : 0;
  const progressDisplay = Math.max(progressPercentage, 0).toFixed(1);
  const progressBarWidth = Math.min(Math.max(progressPercentage, 0), 100);
  const daysLeft = Math.ceil((new Date(goal.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;
  const isComplete = hasTargetAmount && goal.currentAmount >= goal.targetAmount;
  const isCompleted = goal.status === 'completed' || isComplete;
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const completionMessage = isComplete
    ? 'Meta concluída!'
    : `Faltam ${formatCurrency(remainingAmount)} para atingir a meta`;

  const categoryConfig = GOAL_CATEGORIES.find(c => c.value === goal.category);
  const priorityConfig = PRIORITY_LEVELS.find(p => p.value === goal.priority);

  const handleAmountUpdate = () => {
    if (onUpdate) {
      const newStatus = currentAmount >= goal.targetAmount ? 'completed' : goal.status;
      onUpdate({ currentAmount, status: newStatus });
      setIsEditing(false);
    }
  };

  return (
    <Card className={cn(
      'transition-all duration-200 hover:shadow-lg',
      isCompleted && 'border-green-200 bg-green-50/30',
      goal.status === 'paused' && 'opacity-75'
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              {isCompleted && <Check className="w-5 h-5 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600 mb-3">{goal.description}</p>
            <div className="flex flex-wrap gap-2">
              <Badge className={categoryConfig?.color}>
                {categoryConfig?.label}
              </Badge>
              <Badge className={priorityConfig?.color}>
                Prioridade {priorityConfig?.label}
              </Badge>
              {goal.status === 'paused' && (
                <Badge variant="secondary">Pausada</Badge>
              )}
            </div>
          </div>
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-gray-400 hover:text-red-600"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-gray-600">{progressDisplay}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={cn(
                'h-3 rounded-full transition-all duration-300',
                isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-emerald-500 to-teal-600'
              )}
              style={{ width: `${progressBarWidth}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-600 sm:text-sm">
            <Badge variant={isComplete ? 'success' : 'emerald'}>
              {isComplete ? 'Concluída' : 'Em progresso'}
            </Badge>
            <span className="text-right">{completionMessage}</span>
          </div>
        </div>

        {/* Amount Progress */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Atual</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  step="0.01"
                  value={currentAmount}
                  onChange={(e) => setCurrentAmount(parseFloat(e.target.value) || 0)}
                  className="w-32 h-8"
                />
                <Button
                  size="sm"
                  onClick={handleAmountUpdate}
                  variant="gradient"
                >
                  <Check className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCurrentAmount(goal.currentAmount);
                    setIsEditing(false);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-lg font-semibold hover:text-emerald-600 transition-colors"
              >
                {formatCurrency(goal.currentAmount)}
              </button>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Meta</p>
            <p className="text-lg font-semibold">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>

        {/* Time Information */}
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Calendar className="w-4 h-4" />
            <span>Meta: {formatDate(goal.targetDate)}</span>
          </div>
          <div className={cn(
            'font-medium',
            isOverdue ? 'text-red-600' : daysLeft <= 30 ? 'text-yellow-600' : 'text-gray-600'
          )}>
            {isOverdue 
              ? `${Math.abs(daysLeft)} dias atrasado`
              : daysLeft === 0 
                ? 'Vence hoje!'
                : `${daysLeft} dias restantes`
            }
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalTracker({ goals = [], onAddGoal, onUpdateGoal, onDeleteGoal }: GoalTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: 0,
    currentAmount: 0,
    targetDate: '',
    category: 'savings' as Goal['category'],
    status: 'active' as Goal['status'],
    priority: 'medium' as Goal['priority'],
  });

  // Sample goals if none provided
  const sampleGoals: Goal[] = [
    {
      id: '1',
      title: 'Reserva de Emergência',
      description: 'Criar uma reserva equivalente a 6 meses de gastos',
      targetAmount: 30000,
      currentAmount: 12000,
      targetDate: '2024-12-31',
      category: 'savings',
      status: 'active',
      priority: 'high',
      createdAt: '2024-01-01',
    },
    {
      id: '2',
      title: 'Investir em Ações',
      description: 'Investir R$ 10.000 em ações para diversificar a carteira',
      targetAmount: 10000,
      currentAmount: 3500,
      targetDate: '2024-06-30',
      category: 'investment',
      status: 'active',
      priority: 'medium',
      createdAt: '2024-02-01',
    },
    {
      id: '3',
      title: 'Reduzir Gastos com Delivery',
      description: 'Diminuir gastos mensais com delivery de R$ 800 para R$ 400',
      targetAmount: 400,
      currentAmount: 450,
      targetDate: '2024-03-31',
      category: 'expense_reduction',
      status: 'active',
      priority: 'low',
      createdAt: '2024-01-15',
    },
  ];

  const displayGoals = goals.length > 0 ? goals : sampleGoals;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGoal.title && newGoal.targetAmount > 0 && newGoal.targetDate) {
      if (onAddGoal) {
        onAddGoal(newGoal);
      }
      setNewGoal({
        title: '',
        description: '',
        targetAmount: 0,
        currentAmount: 0,
        targetDate: '',
        category: 'savings',
        status: 'active',
        priority: 'medium',
      });
      setShowForm(false);
    }
  };

  const activeGoals = displayGoals.filter(goal => goal.status === 'active');
  const completedGoals = displayGoals.filter(goal => goal.status === 'completed');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Metas Financeiras</CardTitle>
                <p className="text-sm text-gray-600">
                  {activeGoals.length} metas ativas • {completedGoals.length} concluídas
                </p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="gradient"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancelar' : 'Nova Meta'}
            </Button>
          </div>
        </CardHeader>

        {/* Add Goal Form */}
        {showForm && (
          <CardContent className="border-t bg-gray-50/50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Reserva de emergência"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <select
                    value={newGoal.category}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, category: e.target.value as Goal['category'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  >
                    {GOAL_CATEGORIES.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <Input
                  value={newGoal.description}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva sua meta..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Meta</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newGoal.targetAmount || ''}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="R$ 0,00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor Atual</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newGoal.currentAmount || ''}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, currentAmount: parseFloat(e.target.value) || 0 }))}
                    placeholder="R$ 0,00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Meta</label>
                  <Input
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal(prev => ({ ...prev, targetDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal(prev => ({ ...prev, priority: e.target.value as Goal['priority'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                >
                  {PRIORITY_LEVELS.map(priority => (
                    <option key={priority.value} value={priority.value}>
                      {priority.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient">
                  Criar Meta
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {displayGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onUpdate={(updates) => onUpdateGoal?.(goal.id, updates)}
            onDelete={() => onDeleteGoal?.(goal.id)}
          />
        ))}
      </div>

      {displayGoals.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma meta criada</h3>
            <p className="text-gray-600 mb-4">
              Crie suas primeiras metas financeiras para acompanhar seu progresso
            </p>
            <Button
              onClick={() => setShowForm(true)}
              variant="gradient"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Meta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
