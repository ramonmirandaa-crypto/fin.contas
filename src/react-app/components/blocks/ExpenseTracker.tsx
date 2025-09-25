import { useState } from 'react';
import { Plus, Calendar, Tag, DollarSign, Search, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/react-app/components/ui/Card';
import { Button } from '@/react-app/components/ui/Button';
import { Input } from '@/react-app/components/ui/Input';
import { Badge } from '@/react-app/components/ui/Badge';
import { formatCurrency, formatDate } from '@/react-app/utils';
import { Expense, CreateExpense, EXPENSE_CATEGORIES } from '@/shared/types';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: CreateExpense) => void;
  loading?: boolean;
}

export default function ExpenseTracker({ expenses, onAddExpense, loading }: ExpenseTrackerProps) {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newExpense, setNewExpense] = useState<CreateExpense>({
    amount: 0,
    description: '',
    category: 'Alimentação',
    date: new Date().toISOString().split('T')[0],
  });

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || expense.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newExpense.amount > 0 && newExpense.description.trim()) {
      onAddExpense(newExpense);
      setNewExpense({
        amount: 0,
        description: '',
        category: 'Alimentação',
        date: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alimentação': 'bg-green-100 text-green-800',
      'Transporte': 'bg-blue-100 text-blue-800',
      'Compras': 'bg-purple-100 text-purple-800',
      'Entretenimento': 'bg-pink-100 text-pink-800',
      'Contas e Serviços': 'bg-orange-100 text-orange-800',
      'Saúde': 'bg-red-100 text-red-800',
      'Viagem': 'bg-indigo-100 text-indigo-800',
      'Educação': 'bg-yellow-100 text-yellow-800',
      'Cuidados Pessoais': 'bg-teal-100 text-teal-800',
      'Outros': 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors['Outros'];
  };

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle>Rastreamento de Gastos</CardTitle>
                <p className="text-sm text-gray-600">Gerencie seus gastos de forma inteligente</p>
              </div>
            </div>
            <Button
              onClick={() => setShowForm(!showForm)}
              variant="gradient"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              {showForm ? 'Cancelar' : 'Adicionar Gasto'}
            </Button>
          </div>
        </CardHeader>

        {/* Add Expense Form */}
        {showForm && (
          <CardContent className="border-t bg-gray-50/50">
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newExpense.amount || ''}
                  onChange={(e) => setNewExpense(prev => ({ 
                    ...prev, 
                    amount: parseFloat(e.target.value) || 0 
                  }))}
                  placeholder="R$ 0,00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <Input
                  value={newExpense.description}
                  onChange={(e) => setNewExpense(prev => ({ 
                    ...prev, 
                    description: e.target.value 
                  }))}
                  placeholder="No que você gastou?"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  value={newExpense.category}
                  onChange={(e) => setNewExpense(prev => ({ 
                    ...prev, 
                    category: e.target.value 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  required
                >
                  {EXPENSE_CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <Input
                  type="date"
                  value={newExpense.date}
                  onChange={(e) => setNewExpense(prev => ({ 
                    ...prev, 
                    date: e.target.value 
                  }))}
                  required
                />
              </div>
              <div className="md:col-span-4 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={loading}
                >
                  {loading ? 'Adicionando...' : 'Adicionar Gasto'}
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar gastos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="">Todas as categorias</option>
                {EXPENSE_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Gastos Recentes ({filteredExpenses.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum gasto encontrado</p>
              <p className="text-sm">Adicione um gasto para começar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-emerald-600" />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{expense.description}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getCategoryColor(expense.category)}>
                          {expense.category}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {formatDate(expense.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
