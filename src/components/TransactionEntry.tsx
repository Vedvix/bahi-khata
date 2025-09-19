import React, { useState } from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Plus, Minus, Check, TrendingUp } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function TransactionEntry() {
  const { categories, addTransaction, addInvestment, addLendRecord } = useTransactions();
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'investment' | 'lend'>('expense');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  
  // Investment-specific fields
  const [investmentType, setInvestmentType] = useState<'mutual_fund' | 'stocks' | 'ppf' | 'fd' | 'gold' | 'crypto' | 'bonds'>('mutual_fund');
  const [maturityDate, setMaturityDate] = useState('');
  const [interestRate, setInterestRate] = useState('');
  
  // Lending-specific fields
  const [borrowerName, setBorrowerName] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [purpose, setPurpose] = useState('');

  const filteredCategories = categories.filter(cat => cat.type === transactionType);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !selectedCategory) {
      toast.error('Please fill in all required fields');
      return;
    }

    const categoryName = categories.find(cat => cat.id === selectedCategory)?.name || '';

    if (transactionType === 'investment') {
      if (!description) {
        toast.error('Please provide investment name');
        return;
      }
      
      addInvestment({
        name: description,
        type: investmentType,
        amount: parseFloat(amount),
        currentValue: parseFloat(amount), // Initially same as investment amount
        purchaseDate: date,
        maturityDate: maturityDate || undefined,
        interestRate: interestRate ? parseFloat(interestRate) : undefined,
        returns: 0, // Initially 0
        status: 'active'
      });
      
      toast.success('Investment added successfully!');
    } else if (transactionType === 'lend') {
      if (!borrowerName || !dueDate || !purpose) {
        toast.error('Please fill in all lending details');
        return;
      }
      
      addLendRecord({
        borrowerName,
        amount: parseFloat(amount),
        lendDate: date,
        dueDate,
        interestRate: interestRate ? parseFloat(interestRate) : 0,
        purpose,
        status: 'active',
        paidAmount: 0,
        remainingAmount: parseFloat(amount),
        totalAmount:0,
      });
      
      toast.success('Lending record added successfully!');
    } else {
      // Regular income/expense transaction
      addTransaction({
        type: transactionType as 'income' | 'expense',
        amount: parseFloat(amount),
        category: categoryName,
        description,
        date,
        time,
      });
      
      toast.success('Transaction added successfully!');
    }

    // Reset form
    setAmount('');
    setSelectedCategory('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTime(new Date().toTimeString().slice(0, 5));
    setBorrowerName('');
    setDueDate('');
    setPurpose('');
    setMaturityDate('');
    setInterestRate('');
  };

  const quickAmounts = [500, 1000, 2000, 5000, 10000];

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
        <h1 className="text-2xl text-white mb-2">Add Transaction</h1>
        <p className="text-indigo-100 text-sm">Track your income and expenses</p>
      </div>

      <div className="px-6 -mt-4 pb-6">
        {/* Transaction Type Toggle */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => setTransactionType('expense')}
              className={`flex items-center justify-center py-3 px-3 rounded-lg transition-all duration-200 ${
                transactionType === 'expense'
                  ? 'bg-red-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-red-500'
              }`}
            >
              <Minus size={16} className="mr-1" />
              <span className="text-sm">Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('income')}
              className={`flex items-center justify-center py-3 px-3 rounded-lg transition-all duration-200 ${
                transactionType === 'income'
                  ? 'bg-green-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-green-500'
              }`}
            >
              <Plus size={16} className="mr-1" />
              <span className="text-sm">Income</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('investment')}
              className={`flex items-center justify-center py-3 px-3 rounded-lg transition-all duration-200 ${
                transactionType === 'investment'
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
            >
              <TrendingUp size={16} className="mr-1" />
              <span className="text-sm">Investment</span>
            </button>
            <button
              type="button"
              onClick={() => setTransactionType('lend')}
              className={`flex items-center justify-center py-3 px-3 rounded-lg transition-all duration-200 ${
                transactionType === 'lend'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'text-gray-600 hover:text-purple-500'
              }`}
            >
              <span className="mr-1">🤝</span>
              <span className="text-sm">Lend</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Amount Input */}
            <div className="space-y-3">
              <Label htmlFor="amount" className="text-gray-700">Amount (₹)</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">₹</span>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="pl-10 h-12 text-lg bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              
              {/* Quick Amount Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                {quickAmounts.map((quickAmount) => (
                  <Button
                    key={quickAmount}
                    type="button"
                    variant="outline"
                    onClick={() => setAmount(quickAmount.toString())}
                    className="py-2 text-sm border-gray-200 hover:border-indigo-500 hover:text-indigo-600"
                  >
                    ₹{quickAmount.toLocaleString('en-IN')}
                  </Button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div className="space-y-3">
              <Label className="text-gray-700">Select Category</Label>
              
              {/* Category Grid */}
              <div className="grid grid-cols-3 gap-3">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                      selectedCategory === category.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="text-xs text-gray-600 font-medium">{category.name}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-gray-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-gray-700">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Investment Type Selection */}
            {transactionType === 'investment' && (
              <div className="space-y-2">
                <Label className="text-gray-700">Investment Type</Label>
                <Select value={investmentType} onValueChange={(value: any) => setInvestmentType(value)}>
                  <SelectTrigger className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent">
                    <SelectValue placeholder="Select investment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mutual_fund">Mutual Fund</SelectItem>
                    <SelectItem value="stocks">Stocks</SelectItem>
                    <SelectItem value="ppf">PPF</SelectItem>
                    <SelectItem value="fd">Fixed Deposit</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency</SelectItem>
                    <SelectItem value="bonds">Bonds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Lending Fields */}
            {transactionType === 'lend' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="borrowerName" className="text-gray-700">Borrower Name *</Label>
                  <Input
                    id="borrowerName"
                    placeholder="Enter borrower's name"
                    value={borrowerName}
                    onChange={(e) => setBorrowerName(e.target.value)}
                    className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-gray-700">Due Date *</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="purpose" className="text-gray-700">Purpose *</Label>
                  <Input
                    id="purpose"
                    placeholder="Reason for lending"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
              </>
            )}

            {/* Interest Rate (for investments and lending) */}
            {(transactionType === 'investment' || transactionType === 'lend') && (
              <div className="space-y-2">
                <Label htmlFor="interestRate" className="text-gray-700">
                  {transactionType === 'investment' ? 'Expected Return (%)' : 'Interest Rate (%)'}
                </Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.1"
                  placeholder="Enter rate"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Maturity Date (for investments) */}
            {transactionType === 'investment' && (
              <div className="space-y-2">
                <Label htmlFor="maturityDate" className="text-gray-700">Maturity Date (Optional)</Label>
                <Input
                  id="maturityDate"
                  type="date"
                  value={maturityDate}
                  onChange={(e) => setMaturityDate(e.target.value)}
                  className="h-12 bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700">
                {transactionType === 'investment' ? 'Investment Name *' : 
                 transactionType === 'lend' ? 'Additional Notes' : 'Description (Optional)'}
              </Label>
              <Textarea
                id="description"
                placeholder={
                  transactionType === 'investment' ? 'e.g., SBI Bluechip Fund' :
                  transactionType === 'lend' ? 'Additional notes about the loan...' :
                  'Add a note about this transaction...'
                }
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-gray-50 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                required={transactionType === 'investment'}
              />
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className={`w-full h-12 rounded-xl text-lg shadow-lg transition-all duration-200 ${
                transactionType === 'income' 
                  ? 'bg-green-500 hover:bg-green-600 text-white' 
                  : transactionType === 'investment'
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : transactionType === 'lend'
                  ? 'bg-purple-500 hover:bg-purple-600 text-white'
                  : 'bg-red-500 hover:bg-red-600 text-white'
              }`}
            >
              <Check size={20} className="mr-2" />
              Add {transactionType === 'income' ? 'Income' : 
                   transactionType === 'investment' ? 'Investment' :
                   transactionType === 'lend' ? 'Lending Record' : 'Expense'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}