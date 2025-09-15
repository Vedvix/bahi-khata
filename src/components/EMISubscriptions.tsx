import React, { useState } from 'react';
import { useTransactions } from './TransactionContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Switch } from './ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Plus, Home, Car, CreditCard, Smartphone, Tv, Zap, Calendar } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

export function EMISubscriptions() {
  const { emis, subscriptions, addEMI, addSubscription } = useTransactions();
  const [isEMIDialogOpen, setIsEMIDialogOpen] = useState(false);
  const [isSubDialogOpen, setIsSubDialogOpen] = useState(false);

  // EMI form states
  const [emiName, setEmiName] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [monthlyEMI, setMonthlyEMI] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenure, setTenure] = useState('');
  const [nextEMIDue, setNextEMIDue] = useState('');

  // Subscription form states
  const [subName, setSubName] = useState('');
  const [subAmount, setSubAmount] = useState('');
  const [subFrequency, setSubFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [subCategory, setSubCategory] = useState('');
  const [nextSubDue, setNextSubDue] = useState('');
  const [autoPayEnabled, setAutoPayEnabled] = useState(false);

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

  const calculateProgress = (total: number, remaining: number) => {
    return ((total - remaining) / total) * 100;
  };

  const handleAddEMI = () => {
    if (!emiName || !totalAmount || !monthlyEMI || !interestRate || !tenure || !nextEMIDue) {
      toast.error('Please fill in all EMI fields');
      return;
    }

    const remainingMonths = Math.ceil((parseFloat(totalAmount) * (1 + parseFloat(interestRate) / 100)) / parseFloat(monthlyEMI));

    addEMI({
      name: emiName,
      totalAmount: parseFloat(totalAmount),
      monthlyEMI: parseFloat(monthlyEMI),
      interestRate: parseFloat(interestRate),
      tenure: parseInt(tenure),
      remainingMonths: Math.min(remainingMonths, parseInt(tenure)),
      nextDueDate: nextEMIDue,
    });

    // Reset form
    setEmiName('');
    setTotalAmount('');
    setMonthlyEMI('');
    setInterestRate('');
    setTenure('');
    setNextEMIDue('');
    setIsEMIDialogOpen(false);
    toast.success('EMI added successfully!');
  };

  const handleAddSubscription = () => {
    if (!subName || !subAmount || !subCategory || !nextSubDue) {
      toast.error('Please fill in all subscription fields');
      return;
    }

    addSubscription({
      name: subName,
      amount: parseFloat(subAmount),
      frequency: subFrequency,
      category: subCategory,
      nextDueDate: nextSubDue,
      autoPayEnabled,
    });

    // Reset form
    setSubName('');
    setSubAmount('');
    setSubFrequency('monthly');
    setSubCategory('');
    setNextSubDue('');
    setAutoPayEnabled(false);
    setIsSubDialogOpen(false);
    toast.success('Subscription added successfully!');
  };

  const getEMIIcon = (name: string) => {
    if (name.toLowerCase().includes('home') || name.toLowerCase().includes('house')) return <Home size={20} />;
    if (name.toLowerCase().includes('car') || name.toLowerCase().includes('vehicle')) return <Car size={20} />;
    return <CreditCard size={20} />;
  };

  const getSubscriptionIcon = (category: string) => {
    if (category === 'Entertainment') return <Tv size={20} className="text-purple-500" />;
    if (category === 'Utilities') return <Zap size={20} className="text-yellow-500" />;
    if (category === 'Mobile') return <Smartphone size={20} className="text-blue-500" />;
    return <Calendar size={20} className="text-gray-500" />;
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="emis" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="emis">EMIs</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
        </TabsList>

        {/* EMIs Tab */}
        <TabsContent value="emis" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your EMIs</h3>
            <Dialog open={isEMIDialogOpen} onOpenChange={setIsEMIDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Add EMI
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle>Add New EMI</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="emiName">EMI Name</Label>
                    <Input
                      id="emiName"
                      placeholder="e.g., Home Loan, Car Loan"
                      value={emiName}
                      onChange={(e) => setEmiName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="totalAmount">Total Loan Amount (₹)</Label>
                    <Input
                      id="totalAmount"
                      type="number"
                      placeholder="e.g., 2500000"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthlyEMI">Monthly EMI (₹)</Label>
                      <Input
                        id="monthlyEMI"
                        type="number"
                        placeholder="25000"
                        value={monthlyEMI}
                        onChange={(e) => setMonthlyEMI(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interestRate">Interest Rate (%)</Label>
                      <Input
                        id="interestRate"
                        type="number"
                        step="0.1"
                        placeholder="8.5"
                        value={interestRate}
                        onChange={(e) => setInterestRate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="tenure">Tenure (Months)</Label>
                      <Input
                        id="tenure"
                        type="number"
                        placeholder="240"
                        value={tenure}
                        onChange={(e) => setTenure(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nextEMIDue">Next Due Date</Label>
                      <Input
                        id="nextEMIDue"
                        type="date"
                        value={nextEMIDue}
                        onChange={(e) => setNextEMIDue(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsEMIDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddEMI} className="flex-1">
                      Add EMI
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {emis.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No EMIs added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {emis.map((emi) => (
                <Card key={emi.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          {getEMIIcon(emi.name)}
                        </div>
                        <div>
                          <h4 className="font-semibold">{emi.name}</h4>
                          <p className="text-sm text-gray-600">
                            Next due: {formatDate(emi.nextDueDate)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-orange-600">
                        {formatCurrency(emi.monthlyEMI)}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{emi.tenure - emi.remainingMonths}/{emi.tenure} months</span>
                      </div>
                      <Progress 
                        value={calculateProgress(emi.tenure, emi.remainingMonths)} 
                        className="h-2" 
                      />
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Amount</p>
                          <p className="font-semibold">{formatCurrency(emi.totalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Interest Rate</p>
                          <p className="font-semibold">{emi.interestRate}% p.a.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Subscriptions Tab */}
        <TabsContent value="subscriptions" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Subscriptions</h3>
            <Dialog open={isSubDialogOpen} onOpenChange={setIsSubDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Add Subscription
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm mx-auto">
                <DialogHeader>
                  <DialogTitle>Add New Subscription</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subName">Service Name</Label>
                    <Input
                      id="subName"
                      placeholder="e.g., Netflix, Electricity Bill"
                      value={subName}
                      onChange={(e) => setSubName(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subAmount">Amount (₹)</Label>
                      <Input
                        id="subAmount"
                        type="number"
                        placeholder="649"
                        value={subAmount}
                        onChange={(e) => setSubAmount(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select value={subFrequency} onValueChange={(value: 'monthly' | 'quarterly' | 'yearly') => setSubFrequency(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={subCategory} onValueChange={setSubCategory}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Entertainment">Entertainment</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Mobile">Mobile</SelectItem>
                        <SelectItem value="Insurance">Insurance</SelectItem>
                        <SelectItem value="Investment">Investment (SIP)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nextSubDue">Next Due Date</Label>
                    <Input
                      id="nextSubDue"
                      type="date"
                      value={nextSubDue}
                      onChange={(e) => setNextSubDue(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="autopay">UPI AutoPay</Label>
                    <Switch
                      id="autopay"
                      checked={autoPayEnabled}
                      onCheckedChange={setAutoPayEnabled}
                    />
                  </div>

                  <div className="flex space-x-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsSubDialogOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddSubscription} className="flex-1">
                      Add Subscription
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {subscriptions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">No subscriptions added yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((subscription) => (
                <Card key={subscription.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getSubscriptionIcon(subscription.category)}
                        <div>
                          <h4 className="font-semibold">{subscription.name}</h4>
                          <p className="text-sm text-gray-600">
                            {subscription.category} • {subscription.frequency}
                          </p>
                          <p className="text-xs text-gray-500">
                            Next due: {formatDate(subscription.nextDueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(subscription.amount)}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {subscription.autoPayEnabled && (
                            <Badge variant="secondary" className="text-xs">
                              AutoPay
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}