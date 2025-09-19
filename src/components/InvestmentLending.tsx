import React, { useState } from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { TrendingUp, TrendingDown, DollarSign, Calendar, User, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from "sonner@2.0.3";

export function InvestmentLending() {
  const { investments, lendRecords, updateInvestment, updateLendRecord } = useTransactions();
  const [selectedInvestment, setSelectedInvestment] = useState<any>(null);
  const [selectedLendRecord, setSelectedLendRecord] = useState<any>(null);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [newCurrentValue, setNewCurrentValue] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');

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
      month: 'short',
      year: 'numeric'
    });
  };

  const getInvestmentTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      mutual_fund: '📈',
      stocks: '📊',
      ppf: '🏛️',
      fd: '🏦',
      gold: '🪙',
      crypto: '₿',
      bonds: '📋'
    };
    return icons[type] || '💰';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'partially_paid': return 'bg-yellow-100 text-yellow-700';
      case 'fully_paid': return 'bg-blue-100 text-blue-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'matured': return 'bg-purple-100 text-purple-700';
      case 'sold': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const handleUpdateInvestment = () => {
    if (!selectedInvestment || !newCurrentValue) {
      toast.error('Please enter a valid current value');
      return;
    }

    const currentValue = parseFloat(newCurrentValue);
    const returns = ((currentValue - selectedInvestment.amount) / selectedInvestment.amount) * 100;

    updateInvestment(selectedInvestment.id, {
      currentValue,
      returns
    });

    toast.success('Investment updated successfully!');
    setIsUpdateDialogOpen(false);
    setNewCurrentValue('');
    setSelectedInvestment(null);
  };

  const handleRecordPayment = () => {
    if (!selectedLendRecord || !paymentAmount) {
      toast.error('Please enter a valid payment amount');
      return;
    }

    const payment = parseFloat(paymentAmount);
    const newPaidAmount = selectedLendRecord.paidAmount + payment;
    const newRemainingAmount = selectedLendRecord.remainingAmount - payment;

    let newStatus = selectedLendRecord.status;
    if (newRemainingAmount <= 0) {
      newStatus = 'fully_paid';
    } else if (newPaidAmount > 0) {
      newStatus = 'partially_paid';
    }

    updateLendRecord(selectedLendRecord.id, {
      paidAmount: newPaidAmount,
      remainingAmount: Math.max(0, newRemainingAmount),
      status: newStatus
    });

    toast.success('Payment recorded successfully!');
    setIsPaymentDialogOpen(false);
    setPaymentAmount('');
    setSelectedLendRecord(null);
  };

  const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
  const totalInvestmentAmount = investments.reduce((sum, inv) => sum + inv.amount, 0);
  const totalInvestmentReturns = totalInvestmentValue - totalInvestmentAmount;

  const totalLentAmount = lendRecords.reduce((sum, lend) => sum + lend.remainingAmount +lend.paidAmount, 0);
  const totalReceivedAmount = lendRecords.reduce((sum, lend) => sum + lend.paidAmount, 0);
  const totalPendingAmount = lendRecords.reduce((sum, lend) => sum + lend.remainingAmount, 0);

  return (
    <div className="min-h-full bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white">
        <h1 className="text-2xl text-white mb-2">Investments & Lending</h1>
        <p className="text-indigo-100 text-sm">Track your investments and lending activities</p>
      </div>

      <div className="px-6 -mt-4 pb-6">
        <Tabs defaultValue="investments" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-1 mb-6">
            <TabsTrigger 
              value="investments" 
              className="rounded-xl py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Investments
            </TabsTrigger>
            <TabsTrigger 
              value="lending"
              className="rounded-xl py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg"
            >
              Lending
            </TabsTrigger>
          </TabsList>

          {/* Investments Tab */}
          <TabsContent value="investments" className="space-y-6">
            {/* Investment Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Invested</p>
                  <p className="text-lg text-gray-900">{formatCurrency(totalInvestmentAmount)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Current Value</p>
                  <p className="text-lg text-gray-900">{formatCurrency(totalInvestmentValue)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Returns</p>
                  <p className={`text-lg ${totalInvestmentReturns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {totalInvestmentReturns >= 0 ? '+' : ''}{formatCurrency(totalInvestmentReturns)}
                  </p>
                </div>
              </div>
            </div>

            {/* Investment List */}
            <div className="space-y-4">
              {investments.map((investment) => (
                <div key={investment.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <span className="text-xl">{getInvestmentTypeIcon(investment.type)}</span>
                        </div>
                        <div>
                          <h3 className="text-lg text-gray-900">{investment.name}</h3>
                          <p className="text-sm text-gray-500 capitalize">{investment.type.replace('_', ' ')}</p>
                        </div>
                      </div>
                      <Badge className={getStatusColor(investment.status)}>
                        {investment.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Invested Amount</p>
                        <p className="text-lg text-gray-900">{formatCurrency(investment.amount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Current Value</p>
                        <p className="text-lg text-gray-900">{formatCurrency(investment.currentValue)}</p>
                      </div>
                        <div>
                          <p className="text-sm text-gray-500">Returns</p>
                          <p className={`text-lg ${investment.returns >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {investment.returns >= 0 ? '+' : ''}{investment.returns.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Purchase Date</p>
                          <p className="text-lg text-gray-900">{formatDate(investment.purchaseDate)}</p>
                        </div>
                    </div>

                    <Button
                      onClick={() => {
                        setSelectedInvestment(investment);
                        setNewCurrentValue(investment.currentValue.toString());
                        setIsUpdateDialogOpen(true);
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      Update Current Value
                    </Button>
                  </div>
                </div>
              ))}

              {investments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <TrendingUp size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No investments yet</p>
                  <p className="text-sm">Add your first investment using the transaction entry</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Lending Tab */}
          <TabsContent value="lending" className="space-y-6">
            {/* Lending Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Total Lent</p>
                  <p className="text-lg text-gray-900">{formatCurrency(totalLentAmount)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Received</p>
                  <p className="text-lg text-green-600">{formatCurrency(totalReceivedAmount)}</p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="text-center">
                  <p className="text-sm text-gray-500 mb-1">Pending</p>
                  <p className="text-lg text-orange-600">{formatCurrency(totalPendingAmount)}</p>
                </div>
              </div>
            </div>

            {/* Lending List */}
            <div className="space-y-4">
              {lendRecords.map((lendRecord) => {
                const repaymentProgress =(totalReceivedAmount/totalLentAmount*100);
                const remainingAmount = lendRecord.remainingAmount;

                const isOverdue = new Date(lendRecord.dueDate) < new Date() && lendRecord.status === 'active';
                
                return (
                  <div key={lendRecord.id} className="bg-white rounded-2xl shadow-sm border border-gray-100">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                            <User size={20} className="text-purple-600" />
                          </div>
                          <div>
                            <h3 className="text-lg text-gray-900">{lendRecord.borrowerName}</h3>
                            <p className="text-sm text-gray-500">{lendRecord.purpose}</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(isOverdue ? 'overdue' : lendRecord.status)}>
                          {isOverdue ? 'Overdue' : lendRecord.status.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Lent Amount</p>
                          <p className="text-lg text-gray-900">{formatCurrency(totalLentAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Interest Rate</p>
                          <p className="text-lg text-gray-900">{lendRecord.interestRate}% p.a.</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Due Date</p>
                          <p className={`text-lg ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                            {formatDate(lendRecord.dueDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Remaining</p>
                          <p className="text-lg text-orange-600">{formatCurrency(lendRecord.remainingAmount)}</p>
                        </div>
                      </div>

                      {/* Repayment Progress */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">Repayment Progress</p>
                          <p className="text-sm text-gray-700">{repaymentProgress.toFixed(1)}%</p>
                        </div>
                        <Progress value={repaymentProgress} className="h-2" />
                      </div>

                      {lendRecord.status !== 'fully_paid' && (
                        <Button
                          onClick={() => {
                            setSelectedLendRecord(lendRecord);
                            setIsPaymentDialogOpen(true);
                          }}
                          className="w-full bg-purple-600 hover:bg-purple-700"
                        >
                          Record Payment
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {lendRecords.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <User size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No lending records yet</p>
                  <p className="text-sm">Add your first lending record using the transaction entry</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Investment Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Investment Value</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="currentValue">Current Value (₹)</Label>
              <Input
                id="currentValue"
                type="number"
                value={newCurrentValue}
                onChange={(e) => setNewCurrentValue(e.target.value)}
                placeholder="Enter current value"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleUpdateInvestment} className="flex-1">
                Update
              </Button>
              <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
              <Input
                id="paymentAmount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleRecordPayment} className="flex-1">
                Record Payment
              </Button>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}