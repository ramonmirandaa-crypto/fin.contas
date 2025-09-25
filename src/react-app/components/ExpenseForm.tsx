import { useState } from 'react';
import { Plus, Sparkles } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { EXPENSE_CATEGORIES, CreateExpense } from '@/shared/types';

interface ExpenseFormProps {
  onSubmit: (expense: CreateExpense) => void;
  loading?: boolean;
}

export default function ExpenseForm({ onSubmit, loading }: ExpenseFormProps) {
  const [expense, setExpense] = useState<CreateExpense>({
    amount: 0,
    description: '',
    category: 'Alimentação',
    date: new Date().toISOString().split('T')[0],
  });
  const [categorizing, setCategorizing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(expense);
    setExpense({
      amount: 0,
      description: '',
      category: 'Alimentação',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const autoCategory = async () => {
    if (!expense.description.trim()) return;
    
    setCategorizing(true);
    try {
      const response = await apiFetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: expense.description }),
      });
      const data = await response.json();
      if (data.category) {
        setExpense(prev => ({ ...prev, category: data.category }));
      }
    } catch (error) {
      console.error('Auto-categorization failed:', error);
    } finally {
      setCategorizing(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl">
          <Plus className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Adicionar Gasto</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Valor
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                R$
              </span>
              <input
                type="number"
                step="0.01"
                value={expense.amount || ''}
                onChange={(e) => setExpense(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={expense.date}
              onChange={(e) => setExpense(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Descrição
          </label>
          <div className="relative">
            <input
              type="text"
              value={expense.description}
              onChange={(e) => setExpense(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              placeholder="No que você gastou?"
              required
            />
            <button
              type="button"
              onClick={autoCategory}
              disabled={categorizing || !expense.description.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-emerald-600 hover:text-emerald-700 disabled:text-gray-400 transition-colors"
              title="Categorizar automaticamente com IA"
            >
              <Sparkles className={`w-5 h-5 ${categorizing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Categoria
          </label>
          <select
            value={expense.category}
            onChange={(e) => setExpense(prev => ({ ...prev, category: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            required
          >
            {EXPENSE_CATEGORIES.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-4 px-6 rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
        >
          {loading ? 'Adicionando...' : 'Adicionar Gasto'}
        </button>
      </form>
    </div>
  );
}
