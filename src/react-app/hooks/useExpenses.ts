import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/react-app/utils/api';
import type { CreateExpense, Expense } from '@/shared/types';

interface UseExpensesOptions {
  enabled: boolean;
}

interface UseExpensesMetrics {
  totalExpenses: number;
  thisMonthExpenses: number;
  avgDailySpending: number;
}

interface UseExpensesResult {
  expenses: Expense[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
  addExpense: (expense: CreateExpense) => Promise<Expense | null>;
  metrics: UseExpensesMetrics;
}

async function fetchExpensesFromApi(): Promise<Expense[]> {
  const response = await apiFetch('/api/expenses');

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  const data = (await response.json()) as { expenses?: Expense[] };

  return Array.isArray(data.expenses) ? data.expenses : [];
}

export function useExpenses({ enabled }: UseExpensesOptions): UseExpensesResult {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setExpenses([]);
      setLoading(false);
      setError(null);
      return;
    }

    let isActive = true;

    const loadExpenses = async () => {
      setLoading(true);
      setError(null);

      try {
        const fetchedExpenses = await fetchExpensesFromApi();
        if (isActive) {
          setExpenses(fetchedExpenses);
        }
      } catch (fetchError) {
        if (!isActive) {
          return;
        }

        console.error('Failed to fetch expenses:', fetchError);
        setError('Não foi possível carregar as despesas. Tente novamente mais tarde.');
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadExpenses();

    return () => {
      isActive = false;
    };
  }, [enabled]);

  const addExpense = useCallback(async (expenseData: CreateExpense): Promise<Expense | null> => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const data = (await response.json()) as { expense?: Expense };
      if (data.expense) {
        setExpenses(previous => [data.expense as Expense, ...previous]);
        return data.expense;
      }

      return null;
    } catch (submitError) {
      console.error('Failed to add expense:', submitError);
      setError('Não foi possível adicionar a despesa. Tente novamente.');
      return null;
    } finally {
      setSubmitting(false);
    }
  }, []);

  const metrics = useMemo<UseExpensesMetrics>(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    const now = new Date();
    const thisMonthExpenses = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === now.getMonth() &&
          expenseDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, expense) => sum + expense.amount, 0);

    const avgDailySpending = expenses.length > 0 ? totalExpenses / Math.max(1, expenses.length) : 0;

    return {
      totalExpenses,
      thisMonthExpenses,
      avgDailySpending,
    };
  }, [expenses]);

  return {
    expenses,
    loading,
    submitting,
    error,
    addExpense,
    metrics,
  };
}
