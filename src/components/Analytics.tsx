import React, { useState } from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, PiggyBank, TrendingFlat } from 'lucide-react';

export function Analytics() {
  const { transactions, categories } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Filter transactions based on selected period
  const getFilteredTransactions = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      switch (selectedPeriod) {
        case 'thisMonth':
          return transactionDate >= startOfMonth;
        case 'lastMonth':
          return transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
        case 'thisYear':
          return transactionDate >= startOfYear;
        default:
          return true;
      }
    });
  };

  const filteredTransactions = getFilteredTransactions();

  // Calculate spending by category
  const spendingByCategory = categories
    .filter(cat => cat.type === 'expense')
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.type === 'expense' && t.category === category.name
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: total,
        color: category.color,
        icon: category.icon,
      };
    })
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value);

  // Calculate income by category
  const incomeByCategory = categories
    .filter(cat => cat.type === 'income')
    .map(category => {
      const categoryTransactions = filteredTransactions.filter(
        t => t.type === 'income' && t.category === category.name
      );
      const total = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
      return {
        name: category.name,
        value: total,
        color: category.color,
      };
    })
    .filter(item => item.value > 0);

  // Calculate totals
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

  // Monthly trend data
  const monthlyTrend = () => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = month.toLocaleDateString('en-IN', { month: 'short' });
      
      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate.getMonth() === month.getMonth() && tDate.getFullYear() === month.getFullYear();
      });

      const income = monthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const expense = monthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      months.push({
        month: monthName,
        income,
        expense,
        savings: income - expense,
      });
    }
    
    return months;
  };

  // Investment performance data (mock data for demonstration)
  const investmentData = [
    { name: 'Mutual Funds', value: 125000, returns: 8.5, color: '#10B981' },
    { name: 'PPF', value: 75000, returns: 7.1, color: '#3B82F6' },
    { name: 'Fixed Deposits', value: 50000, returns: 6.5, color: '#F59E0B' },
    { name: 'Gold', value: 30000, returns: 4.2, color: '#EF4444' },
    { name: 'Stocks', value: 45000, returns: 12.3, color: '#8B5CF6' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{payload[0].payload.name}</p>
          <p className="text-blue-600">
            Value: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-white mb-2">Analytics</h1>
            <p className="text-indigo-100 text-sm">Track your financial insights</p>
          </div>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thisMonth">This Month</SelectItem>
              <SelectItem value="lastMonth">Last Month</SelectItem>
              <SelectItem value="thisYear">This Year</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="px-6 -mt-4 pb-6">

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6">
            <TabsTrigger 
              value="overview" 
              className="rounded-xl py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="spending"
              className="rounded-xl py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Spending
            </TabsTrigger>
            <TabsTrigger 
              value="investments"
              className="rounded-xl py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Investments
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="text-green-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Income</p>
                    <p className="text-lg text-gray-900">{formatCurrency(totalIncome)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="text-red-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Expenses</p>
                    <p className="text-lg text-gray-900">{formatCurrency(totalExpense)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    netSavings >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <PiggyBank className={`${netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`} size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Net Savings</p>
                    <p className="text-lg text-gray-900">{formatCurrency(netSavings)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Target className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Savings Rate</p>
                    <p className="text-lg text-gray-900">{savingsRate.toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6 pb-4">
                <h3 className="text-lg text-gray-900 mb-4">Monthly Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyTrend()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis 
                        tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <Tooltip 
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e2e8f0',
                          borderRadius: '12px',
                          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} name="Income" dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }} />
                      <Line type="monotone" dataKey="expense" stroke="#EF4444" strokeWidth={3} name="Expense" dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }} />
                      <Line type="monotone" dataKey="savings" stroke="#6366F1" strokeWidth={3} name="Savings" dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Spending Tab */}
          <TabsContent value="spending" className="space-y-6">
            {/* Spending by Category */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              <div className="p-6">
                <h3 className="text-lg text-gray-900 mb-4">Spending by Category</h3>
                {spendingByCategory.length > 0 ? (
                  <>
                    <div className="h-56 mb-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={spendingByCategory}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={90}
                            dataKey="value"
                          >
                            {spendingByCategory.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {/* Category List */}
                    <div className="space-y-3">
                      {spendingByCategory.map((category, index) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center space-x-4">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <span className="text-xl">{category.icon}</span>
                            <span className="text-gray-900">{category.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-gray-900">{formatCurrency(category.value)}</p>
                            <p className="text-sm text-gray-500">
                              {((category.value / totalExpense) * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-500 text-center py-8">No expense data for this period</p>
                )}
              </div>
            </div>

            {/* Income Sources */}
            {incomeByCategory.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="p-6">
                  <h3 className="text-lg text-gray-900 mb-4">Income Sources</h3>
                  <div className="space-y-3">
                    {incomeByCategory.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center space-x-4">
                          <div 
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-gray-900">{category.name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-green-600">{formatCurrency(category.value)}</p>
                          <p className="text-sm text-gray-500">
                            {((category.value / totalIncome) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

        {/* Investments Tab */}
        <TabsContent value="investments" className="space-y-4">
          {/* Investment Portfolio */}
          <Card>
            <CardHeader>
              <CardTitle>Investment Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {investmentData.map((investment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold">{investment.name}</h4>
                      <Badge 
                        variant={investment.returns > 8 ? "default" : "secondary"}
                        className={investment.returns > 8 ? "bg-green-500" : ""}
                      >
                        {investment.returns > 0 ? '+' : ''}{investment.returns}%
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Current Value</p>
                        <p className="font-semibold">{formatCurrency(investment.value)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Returns</p>
                        <p className={`font-semibold ${investment.returns > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {investment.returns > 0 ? '+' : ''}{formatCurrency(investment.value * investment.returns / 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Investment Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={investmentData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={60} />
                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Investment Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Investment</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatCurrency(investmentData.reduce((sum, inv) => sum + inv.value, 0))}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">Total Returns</p>
                  <p className="text-xl font-bold text-green-600">
                    {formatCurrency(investmentData.reduce((sum, inv) => sum + (inv.value * inv.returns / 100), 0))}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}