import { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Wallet, TrendingUp, CreditCard as CreditCardIcon, Banknote, Target, DollarSign } from 'lucide-react';
import { apiFetch } from '@/react-app/utils/api';
import { Expense, CreditCard, Investment, Loan, CreditCardBill } from '@/shared/types';

interface FinancialDashboardProps {
  expenses: Expense[];
}

interface FinancialData {
  creditCards: CreditCard[];
  investments: Investment[];
  loans: Loan[];
  creditCardBills: CreditCardBill[];
}



export default function FinancialDashboard({ expenses }: FinancialDashboardProps) {
  const [financialData, setFinancialData] = useState<FinancialData>({
    creditCards: [],
    investments: [],
    loans: [],
    creditCardBills: []
  });
  const [loading, setLoading] = useState(true);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const [cardsRes, investmentsRes, loansRes, billsRes] = await Promise.all([
        apiFetch('/api/credit-cards'),
        apiFetch('/api/investments'),
        apiFetch('/api/loans'),
        apiFetch('/api/credit-card-bills')
      ]);

      const [cardsData, investmentsData, loansData, billsData] = await Promise.all([
        cardsRes.json(),
        investmentsRes.json(),
        loansRes.json(),
        billsRes.json()
      ]);

      setFinancialData({
        creditCards: cardsData.creditCards || [],
        investments: investmentsData.investments || [],
        loans: loansData.loans || [],
        creditCardBills: billsData.bills || []
      });
    } catch (error) {
      console.error('Failed to fetch financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  // Calculate summary statistics
  const totalCreditLimit = financialData.creditCards.reduce((sum, card) => sum + card.credit_limit, 0);
  const totalCreditUsed = financialData.creditCards.reduce((sum, card) => sum + card.current_balance, 0);
  const totalInvestments = financialData.investments.reduce((sum, inv) => sum + (inv.current_value || inv.amount), 0);
  const totalLoans = financialData.loans.reduce((sum, loan) => sum + loan.remaining_balance, 0);
  
  // Credit card bills summary
  const totalBillsAmount = financialData.creditCardBills
    .filter(bill => !bill.is_fully_paid)
    .reduce((sum, bill) => sum + bill.total_amount, 0);
  
  const overdueBills = financialData.creditCardBills.filter(bill => {
    if (bill.is_fully_paid || !bill.due_date) return false;
    const dueDate = new Date(bill.due_date);
    const today = new Date();
    return dueDate < today;
  }).length;

  const netWorth = totalInvestments - totalCreditUsed - totalLoans - totalBillsAmount;

  // Prepare chart data
  const assetDistribution = [
    { name: 'Investimentos', value: totalInvestments, color: '#10B981' },
    { name: 'Crédito Disponível', value: totalCreditLimit - totalCreditUsed, color: '#06B6D4' },
  ].filter(item => item.value > 0);

  const debtDistribution = [
    { name: 'Cartão de Crédito', value: totalCreditUsed, color: '#EF4444' },
    { name: 'Faturas Pendentes', value: totalBillsAmount, color: '#DC2626' },
    { name: 'Empréstimos', value: totalLoans, color: '#F59E0B' },
  ].filter(item => item.value > 0);

  const monthlyExpensesByCategory = expenses.reduce((acc: Record<string, number>, expense) => {
    const expenseDate = new Date(expense.date);
    const currentMonth = new Date();
    
    if (expenseDate.getMonth() === currentMonth.getMonth() && 
        expenseDate.getFullYear() === currentMonth.getFullYear()) {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    }
    return acc;
  }, {});

  const expenseCategoryData = Object.entries(monthlyExpensesByCategory)
    .map(([category, amount]) => ({
      category: category.length > 12 ? category.substring(0, 12) + '...' : category,
      amount
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 6);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
          <Target className="w-6 h-6 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Resumo Financeiro</h2>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <span className="text-sm font-medium text-green-700">Patrimônio Líquido</span>
          </div>
          <p className={`text-2xl font-bold ${netWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(netWorth)}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-6 h-6 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Investimentos</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalInvestments)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCardIcon className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-red-700">Dívida de Cartão</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalCreditUsed)}</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCardIcon className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium text-red-700">Faturas Pendentes</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalBillsAmount)}</p>
          {overdueBills > 0 && (
            <p className="text-xs text-red-500 mt-1">{overdueBills} vencidas</p>
          )}
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <Banknote className="w-6 h-6 text-orange-600" />
            <span className="text-sm font-medium text-orange-700">Empréstimos</span>
          </div>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalLoans)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Assets vs Debts */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ativos vs Passivos</h3>
          <div className="grid grid-cols-2 gap-4">
            {/* Assets */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Ativos</h4>
              {assetDistribution.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {assetDistribution.map((entry, index) => (
                          <Cell key={`asset-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  Nenhum ativo registrado
                </div>
              )}
            </div>

            {/* Debts */}
            <div>
              <h4 className="text-sm font-medium text-gray-600 mb-3">Passivos</h4>
              {debtDistribution.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={debtDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={70}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {debtDistribution.map((entry, index) => (
                          <Cell key={`debt-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-500">
                  Nenhum passivo registrado
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Expenses by Category */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Gastos do Mês por Categoria</h3>
          {expenseCategoryData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseCategoryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    type="number" 
                    stroke="#666"
                    fontSize={12}
                    tickFormatter={(value) => `R$${value}`}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="category" 
                    stroke="#666"
                    fontSize={12}
                    width={80}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`R$${value.toFixed(2)}`, 'Valor']}
                  />
                  <Bar dataKey="amount" fill="#10B981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p>Nenhum gasto neste mês</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-8 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-gray-600">Cartões Cadastrados</p>
          <p className="text-lg font-semibold text-gray-900">{financialData.creditCards.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Faturas</p>
          <p className="text-lg font-semibold text-gray-900">{financialData.creditCardBills.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Investimentos</p>
          <p className="text-lg font-semibold text-gray-900">{financialData.investments.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Empréstimos</p>
          <p className="text-lg font-semibold text-gray-900">{financialData.loans.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Gastos Este Mês</p>
          <p className="text-lg font-semibold text-gray-900">{Object.keys(monthlyExpensesByCategory).length}</p>
        </div>
      </div>
    </div>
  );
}
