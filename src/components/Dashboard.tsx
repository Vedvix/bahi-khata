import React from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { TrendingUp, TrendingDown, Calendar, AlertCircle } from 'lucide-react';

export function Dashboard() {
  const { transactions,recentTransactions, investments, lendRecords, emis, subscriptions ,totalIncome, balance, totalExpense} = useTransactions();

  // Calculate current balance
  const currentBalance = transactions.reduce((acc, transaction) => {
    return transaction.type === 'income' ? acc + transaction.amount : acc - transaction.amount;
  }, 0);

  // Get recent transactions (last 5)
//  const recentTransactions = transactions.slice(0, 5);

  // Get upcoming due dates (next 7 days)
  const today = new Date();
  const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const upcomingEMIs = emis.filter(emi => {
    const dueDate = new Date(emi.nextDueDate);
    return dueDate >= today && dueDate <= next7Days;
  });

  const upcomingSubscriptions = subscriptions.filter(sub => {
    const dueDate = new Date(sub.nextDueDate);
    return dueDate >= today && dueDate <= next7Days;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    });
  };

  return (
    <div className="min-h-full bg-white">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 px-6 py-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl text-white">Good Morning!</h1>
            <p className="text-indigo-100 text-sm">Here's your financial overview</p>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-lg">👋</span>
          </div>
        </div>

        {/* Balance Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Total Balance</p>
              <p className="text-3xl text-white">{balance}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center text-green-300 mb-1">
                <TrendingUp size={16} className="mr-1" />
                <span className="text-sm">+5.2%</span>
              </div>
              <p className="text-xs text-white/60">This month</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 pb-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Income</p>
                <p className="text-lg text-gray-900">₹{totalIncome}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <TrendingDown className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-gray-500 text-sm">Expenses</p>
                <p className="text-lg text-gray-900">₹{totalExpense}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900">Recent Transactions</h3>
            <button className="text-indigo-600 text-sm">See All</button>
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="p-4 space-y-4">
              {recentTransactions.map((transaction, index) => (
                <div key={transaction.id} className={`flex items-center justify-between ${
                  index !== recentTransactions.length - 1 ? 'pb-4 border-b border-gray-100' : ''
                }`}>
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? 
                        <TrendingUp size={20} className="text-green-600" /> : 
                        <TrendingDown size={20} className="text-red-600" />
                      }
                    </div>
                    <div>
                      <p className="text-gray-900">{transaction.category}</p>
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-500">{formatDate(transaction.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Investment & Lending Overview */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg text-gray-900">Portfolio Overview</h3>
            <TrendingUp size={20} className="text-gray-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">📈</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Investments</p>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(investments.reduce((sum, inv) => sum + inv.currentValue, 0))}
                  </p>
                  <p className="text-xs text-green-600">
                    +{formatCurrency(investments.reduce((sum, inv) => sum + (inv.currentValue - inv.amount), 0))}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <span className="text-lg">🤝</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Lending</p>
                  <p className="text-lg text-gray-900">
                    {formatCurrency(lendRecords.reduce((sum, lend) => sum + lend.remainingAmount, 0))}
                  </p>
                  <p className="text-xs text-orange-600">
                    {lendRecords.filter(l => l.status === 'active').length} active
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        {(upcomingEMIs.length > 0 || upcomingSubscriptions.length > 0) && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-gray-900">Upcoming Payments</h3>
              <Calendar size={20} className="text-gray-500" />
            </div>
            <div className="space-y-3">
              {upcomingEMIs.map((emi) => (
                <div key={emi.id} className="bg-orange-50 rounded-2xl p-4 border border-orange-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                        <AlertCircle className="text-orange-600" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-900">{emi.name} EMI</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(emi.nextDueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-gray-900">{formatCurrency(emi.monthlyEMI)}</p>
                      <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
                        EMI
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}

              {upcomingSubscriptions.map((sub) => (
                <div key={sub.id} className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Calendar className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <p className="text-gray-900">{sub.name}</p>
                        <p className="text-sm text-gray-600">Due: {formatDate(sub.nextDueDate)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-gray-900">{formatCurrency(sub.amount)}</p>
                      <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                        {sub.frequency}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}