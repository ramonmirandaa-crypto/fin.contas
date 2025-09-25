import { Trash2, Calendar, Tag, DollarSign } from 'lucide-react';
import { Expense } from '@/shared/types';

interface ExpenseListProps {
  expenses: Expense[];
  onDelete: (id: number) => void;
  loading?: boolean;
}

export default function ExpenseList({ expenses, onDelete, loading }: ExpenseListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Alimentação': 'bg-orange-100 text-orange-800',
      'Transporte': 'bg-blue-100 text-blue-800',
      'Compras': 'bg-purple-100 text-purple-800',
      'Entretenimento': 'bg-pink-100 text-pink-800',
      'Contas e Serviços': 'bg-red-100 text-red-800',
      'Saúde': 'bg-green-100 text-green-800',
      'Viagem': 'bg-indigo-100 text-indigo-800',
      'Educação': 'bg-yellow-100 text-yellow-800',
      'Cuidados Pessoais': 'bg-teal-100 text-teal-800',
      'Outros': 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors['Outros'];
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum gasto ainda</h3>
        <p className="text-gray-600">Comece a rastrear seus gastos para ver insights e tendências.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Gastos Recentes</h2>
      
      <div className="space-y-4">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-emerald-300 hover:shadow-md transition-all duration-200"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                  <Tag className="w-3 h-3 inline mr-1" />
                  {expense.category}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(expense.date)}
                </span>
                <span className="font-semibold text-emerald-600 text-lg">
                  {formatAmount(expense.amount)}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => onDelete(expense.id)}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Excluir gasto"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
