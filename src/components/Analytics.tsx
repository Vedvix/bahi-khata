import React, { useState, useEffect } from 'react';
// 🚨 Ensure this path is correct for your project
import { useTransactions, Investment } from './TransactionContext'; 

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Target, PiggyBank, ChevronDown, ChevronUp } from 'lucide-react'; // Added Chevron icons

// --- HELPER TYPE TO AUGMENT INVESTMENT DATA ---
interface EnhancedInvestment extends Investment {
    calculatedValue: number;
    profitLoss: number;
    percentageReturns: number;
}

export function Analytics() {
    const { 
        transactions, 
        categories, 
        subscriptions, 
        investments: rawInvestments 
    } = useTransactions(); 
    
    const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
    const [spendingExpanded, setSpendingExpanded] = useState(false);
    const [incomeExpanded, setIncomeExpanded] = useState(false); // Used for toggling Income Sources visibility
    const RECENT_COUNT = 5;

    // --- Investment Calculations ---
    const enhancedInvestments: EnhancedInvestment[] = rawInvestments.map(inv => {
        const value = inv.currentValue; 
        const profitLoss = value - inv.amount;
        const percentageReturns = inv.amount > 0 ? (profitLoss / inv.amount) * 100 : 0;

        return {
            ...inv,
            calculatedValue: value,
            profitLoss: profitLoss,
            percentageReturns: percentageReturns
        };
    });

    const totalInvested = enhancedInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = enhancedInvestments.reduce((sum, inv) => sum + inv.calculatedValue, 0);
    const totalReturns = enhancedInvestments.reduce((sum, inv) => sum + inv.profitLoss, 0);
    
    const investmentsByType = enhancedInvestments.reduce((acc, inv) => {
        const type = inv.type;
        acc[type] = acc[type] || { name: type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), value: 0, color: '#000' };
        acc[type].value += inv.calculatedValue;
        return acc;
    }, {} as Record<string, { name: string, value: number, color: string }>);

    const investmentChartData = Object.values(investmentsByType).map(item => ({
        ...item,
        color: categories.find(c => c.type === 'investment' && c.name.toLowerCase().includes(item.name.toLowerCase()))?.color || '#3B82F6'
    }));
    // --- End Investment Calculations ---

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    // Filter transactions based on selected period (Logic remains the same)
    const getFilteredTransactions = (selectedType: string = 'all') => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        return transactions.filter(transaction => {
            const transactionDate = new Date(transaction.date);
            let periodMatch = false;
            switch (selectedPeriod) {
                case 'thisMonth':
                    periodMatch = transactionDate >= startOfMonth;
                    break;
                case 'lastMonth':
                    periodMatch = transactionDate >= startOfLastMonth && transactionDate <= endOfLastMonth;
                    break;
                case 'thisYear':
                    periodMatch = transactionDate >= startOfYear;
                    break;
                default:
                    periodMatch = true;
            }
            if (!periodMatch) return false;

            if (selectedType === 'all') return true;
            if (selectedType === 'expense') return transaction.type === 'expense' || transaction.type === 'subscription';
            if (selectedType === 'subscription') return transaction.type === 'subscription';
            if (selectedType === 'lent') return transaction.type === 'lend';
            if (selectedType === 'investment') return transaction.type === 'investment';

            return transaction.type === selectedType;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    // Calculate spending by category (Logic remains the same)
    const expenseTx = filteredTransactions.filter(t => t.type === 'expense' || t.type === 'subscription' || t.type === 'lend' || t.type === 'investment');

    const map: Record<string, { name: string; value: number; color: string | undefined; icon?: string }> = {};
    expenseTx.forEach(t => {
        const name = t.category || 'Other';
        if (!map[name]) map[name] = { name, value: 0, color: undefined, icon: undefined };
        map[name].value += t.amount;
    });

    Object.values(map).forEach(item => {
        const cat = categories.find(c => c.name === item.name);
        if (cat) {
            item.color = cat.color;
            item.icon = cat.icon;
        } else {
            item.color = item.color ?? '#94a3b8';
        }
    });

    const spendingByCategory = Object.values(map).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    // Calculate income by category (Logic remains the same)
    const incomeTx = filteredTransactions.filter(t => t.type === 'income');

    const incomeMap: Record<string, { name: string; value: number; color: string }> = {};
    incomeTx.forEach(t => {
        const name = t.category || 'Other';
        if (!incomeMap[name]) incomeMap[name] = { name, value: 0, color: '#94a3b8' };
        const amt = typeof t.amount === 'number' ? t.amount : Number(t.amount || 0);
        incomeMap[name].value += isNaN(amt) ? 0 : amt;
    });

    Object.values(incomeMap).forEach(item => {
        const cat = categories.find(c => c.name === item.name && c.type === 'income');
        if (cat) item.color = cat.color;
    });

    const incomeByCategory = Object.values(incomeMap).filter(i => i.value > 0).sort((a, b) => b.value - a.value);

    // Calculate totals (Logic remains the same)
    const totalIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
        .filter(t => t.type === 'expense' || t.type === 'subscription' || t.type === 'lend' || t.type === 'investment')
        .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100) : 0;

    // Monthly trend data (Logic remains the same)
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

    // Custom Tooltips (Logic remains the same)
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

    const InvestmentTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded-lg shadow-lg">
                    <p className="font-medium">{payload[0].payload.name}</p>
                    <p className="text-blue-600">
                        Current Value: {formatCurrency(payload[0].value)}
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

            <div className="px-4 -mt-4 pb-6 sm:px-6"> {/* Reduced horizontal padding slightly */}

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
                        {/* 1. 📲 SIMPLIFIED GRID: Changed to 1-column on mobile, 2-column on sm and up */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {/* Income */}
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
                            {/* Expenses */}
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
                            {/* Net Savings */}
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
                            {/* Savings Rate */}
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
                            <div className="p-4 pb-0"> {/* Reduced padding to p-4 */}
                                <h3 className="text-lg text-gray-900 mb-2">Monthly Trend</h3>
                                <p className="text-xs text-gray-500 mb-4">Income (Green), Expense (Red), Savings (Purple)</p> {/* Tooltip Hint */}
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
                                            {/* 2. 📉 Removed <Legend /> component to save vertical space */}
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
                            <div className="p-4">
                                <h3 className="text-lg text-gray-900 mb-4">Spending by Category</h3>
                                {spendingByCategory.length > 0 ? (
                                    <>
                                        {/* Pie Chart */}
                                        <div className="h-56 mb-4"> {/* Reduced bottom margin */}
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

                                        {/* 3. ✂️ CONDENSED LIST ITEM: Reduced padding and removed the small color swatch (relying on icon) */}
                                        <div className="space-y-2"> {/* Reduced vertical spacing */}
                                            {(spendingExpanded ? spendingByCategory : spendingByCategory.slice(0, RECENT_COUNT)).map((category, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"> {/* Reduced padding and border radius */}
                                                    <div className="flex items-center space-x-3"> {/* Reduced spacing */}
                                                        <span className="text-xl" style={{ color: category.color }}>{category.icon}</span> {/* Icon color hints */}
                                                        <span className="text-gray-900 font-medium">{category.name}</span>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-gray-900 font-semibold text-sm">{formatCurrency(category.value)}</p> {/* Smaller text size */}
                                                        <p className="text-xs text-gray-500">
                                                            {totalExpense > 0 ? ((category.value / totalExpense) * 100).toFixed(1) : 0}%
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}

                                            {spendingByCategory.length > RECENT_COUNT && (
                                                <div className="pt-2 flex justify-center">
                                                    <button
                                                        onClick={() => setSpendingExpanded(prev => !prev)}
                                                        aria-expanded={spendingExpanded}
                                                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm bg-gray-100 hover:bg-gray-200"
                                                    >
                                                        {spendingExpanded ? 'Show less' : `Show all (${spendingByCategory.length})`}
                                                        {spendingExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                    </>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No expense data for this period</p>
                                )}
                            </div>
                        </div>

                        {/* 4. 🗂️ Income Sources in a Toggle/Accordion */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                            <button
                                onClick={() => setIncomeExpanded(prev => !prev)}
                                className="flex justify-between items-center w-full text-lg font-semibold text-gray-800"
                            >
                                <span>Income Sources</span>
                                {incomeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </button>
                            
                            {incomeExpanded && (
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                    {incomeByCategory.length > 0 ? (
                                        incomeByCategory.map((category, index) => (
                                            <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: category.color }} /> {/* Simple dot for income */}
                                                    <span className="text-gray-900 font-medium">{category.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-green-600 font-semibold text-sm">{formatCurrency(category.value)}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {totalIncome > 0 ? ((category.value / totalIncome) * 100).toFixed(1) : 0}%
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-gray-500 text-center py-4 text-sm">No income data for this period.</p>
                                    )}
                                </div>
                            )}
                        </div>

                    </TabsContent>

                    {/* Investments Tab */}
                    <TabsContent value="investments" className="space-y-4">
                        
                        {enhancedInvestments.length === 0 ? (
                            <Card className='text-center p-8'>
                                <CardTitle className='text-xl text-gray-500'>No Active Investments</CardTitle>
                                <CardContent className='pt-4'>
                                    <p className='text-sm text-gray-500'>Start by adding your mutual funds, stocks, or FDs to see analytics here.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <>
                                {/* Investment Summary */}
                                <Card>
                                    <CardHeader className="p-4 pb-0">
                                        <CardTitle className="text-lg">Portfolio Summary</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-3">
                                        {/* 1. 📲 SIMPLIFIED GRID: 1-column on mobile, 2-column on sm+ */}
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2"> 
                                            <div className="text-center p-3 bg-blue-50 rounded-lg"> {/* Reduced padding to p-3 */}
                                                <p className="text-xs text-gray-600">Total Invested</p>
                                                <p className="text-lg font-bold text-blue-600">
                                                    {formatCurrency(totalInvested)}
                                                </p>
                                            </div>
                                            <div className={`text-center p-3 rounded-lg ${totalReturns >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                                <p className="text-xs text-gray-600">Total Returns (P/L)</p>
                                                <p className={`text-lg font-bold ${totalReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalReturns > 0 ? '+' : ''}{formatCurrency(totalReturns)}
                                                </p>
                                            </div>
                                            <div className="text-center col-span-1 sm:col-span-2 p-3 bg-indigo-50 rounded-lg">
                                                <p className="text-sm text-gray-600">Current Portfolio Value</p>
                                                <p className="text-xl font-bold text-indigo-600">
                                                    {formatCurrency(totalCurrentValue)}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>


                                {/* Investment Performance Chart */}
                                <Card>
                                    <CardHeader className="p-4 pb-0">
                                        <CardTitle className="text-lg">Portfolio Allocation by Type</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-2">
                                        <div className="h-64">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={investmentChartData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} interval={0} />
                                                    <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`} />
                                                    <Tooltip content={<InvestmentTooltip />} />
                                                    <Bar dataKey="value" name="Current Value">
                                                        {investmentChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Investment Portfolio List */}
                                <Card>
                                    <CardHeader className="p-4 pb-0">
                                        <CardTitle className="text-lg">Investment Portfolio</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-3">
                                        <div className="space-y-3"> {/* Reduced vertical spacing */}
                                            {enhancedInvestments.map((investment, index) => (
                                                /* 3. ✂️ CONDENSED LIST ITEM: Simplified layout */
                                                <div key={index} className="p-3 border rounded-lg"> 
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-bold text-base">{investment.name}</h4>
                                                        <Badge
                                                            variant="default"
                                                            className={`text-xs ${investment.percentageReturns >= 0 ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600"}`}
                                                        >
                                                            {investment.percentageReturns > 0 ? '▲' : '▼'}{investment.percentageReturns.toFixed(1)}%
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between items-end text-sm">
                                                        {/* Current Value is prominent */}
                                                        <div className='flex flex-col'>
                                                            <p className="text-xs text-gray-500">Current Value</p>
                                                            <p className="font-semibold text-gray-900">{formatCurrency(investment.calculatedValue)}</p>
                                                        </div>
                                                        {/* P/L is secondary */}
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500">P/L</p>
                                                            <p className={`font-semibold ${investment.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                                {investment.profitLoss > 0 ? '+' : ''}{formatCurrency(investment.profitLoss)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                     <div className='flex justify-between mt-1 pt-2 border-t border-gray-100'>
                                                        <p className="text-xs text-gray-500">
                                                            Invested: {formatCurrency(investment.amount)}
                                                        </p>
                                                        <Badge
                                                            className={`text-xs capitalize ${investment.status === 'active' ? 'bg-indigo-100 text-indigo-700' : investment.status === 'sold' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                                        >
                                                            {investment.status.replace('_', ' ')}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

