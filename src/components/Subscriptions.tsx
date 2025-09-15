import React, { useState } from 'react';
import { Plus, Calendar, ToggleLeft, ToggleRight, Edit, Trash2, CreditCard, Tv, Zap, Smartphone, Wifi, Car, Heart, ShoppingBag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { useTransactions, Subscription } from './TransactionContext';

const subscriptionCategories = [
  { name: 'Entertainment', icon: Tv, color: '#EC4899' },
  { name: 'Utilities', icon: Zap, color: '#F59E0B' },
  { name: 'Mobile', icon: Smartphone, color: '#10B981' },
  { name: 'Internet', icon: Wifi, color: '#3B82F6' },
  { name: 'Transport', icon: Car, color: '#8B5CF6' },
  { name: 'Insurance', icon: Heart, color: '#EF4444' },
  { name: 'Shopping', icon: ShoppingBag, color: '#059669' },
  { name: 'Banking', icon: CreditCard, color: '#6B7280' },
];

const popularSubscriptions = [
  { name: 'Netflix', category: 'Entertainment', defaultAmount: 649 },
  { name: 'Amazon Prime', category: 'Entertainment', defaultAmount: 329 },
  { name: 'Disney+ Hotstar', category: 'Entertainment', defaultAmount: 299 },
  { name: 'Spotify', category: 'Entertainment', defaultAmount: 119 },
  { name: 'YouTube Premium', category: 'Entertainment', defaultAmount: 129 },
  { name: 'Electricity Bill', category: 'Utilities', defaultAmount: 2500 },
  { name: 'Gas Connection', category: 'Utilities', defaultAmount: 800 },
  { name: 'Water Bill', category: 'Utilities', defaultAmount: 500 },
  { name: 'Mobile Recharge', category: 'Mobile', defaultAmount: 399 },
  { name: 'Broadband', category: 'Internet', defaultAmount: 999 },
  { name: 'Ola/Uber Pass', category: 'Transport', defaultAmount: 149 },
  { name: 'Life Insurance', category: 'Insurance', defaultAmount: 5000 },
];

export function Subscriptions() {
  const { subscriptions, addSubscription } = useTransactions();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    frequency: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    category: '',
    autoPayEnabled: false,
    nextDueDate: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.amount || !formData.category || !formData.nextDueDate) return;

    addSubscription({
      name: formData.name,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      category: formData.category,
      autoPayEnabled: formData.autoPayEnabled,
      nextDueDate: formData.nextDueDate
    });

    setFormData({
      name: '',
      amount: '',
      frequency: 'monthly',
      category: '',
      autoPayEnabled: false,
      nextDueDate: ''
    });
    setIsAddDialogOpen(false);
  };

  const selectPopularSubscription = (subscription: typeof popularSubscriptions[0]) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setFormData({
      name: subscription.name,
      amount: subscription.defaultAmount.toString(),
      frequency: 'monthly',
      category: subscription.category,
      autoPayEnabled: false,
      nextDueDate: nextMonth.toISOString().split('T')[0]
    });
  };

  const getTotalMonthlyAmount = () => {
    return subscriptions.reduce((total, sub) => {
      const multiplier = sub.frequency === 'monthly' ? 1 : 
                       sub.frequency === 'quarterly' ? 1/3 : 1/12;
      return total + (sub.amount * multiplier);
    }, 0);
  };

  const getUpcomingSubscriptions = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return subscriptions.filter(sub => {
      const dueDate = new Date(sub.nextDueDate);
      return dueDate <= nextWeek && dueDate >= today;
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = subscriptionCategories.find(c => c.name === category);
    return cat ? cat.icon : CreditCard;
  };

  const getCategoryColor = (category: string) => {
    const cat = subscriptionCategories.find(c => c.name === category);
    return cat ? cat.color : '#6B7280';
  };

  const upcomingSubscriptions = getUpcomingSubscriptions();

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1>Subscriptions</h1>
          <p className="text-muted-foreground">Manage your recurring payments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm mx-auto">
            <DialogHeader>
              <DialogTitle>Add Subscription</DialogTitle>
            </DialogHeader>
            
            {/* Popular Subscriptions */}
            <div className="space-y-3">
              <h3 className="text-sm text-muted-foreground">Popular Subscriptions</h3>
              <div className="grid grid-cols-2 gap-2">
                {popularSubscriptions.slice(0, 6).map((sub) => (
                  <Button
                    key={sub.name}
                    variant="outline"
                    size="sm"
                    className="text-xs h-auto p-2 flex flex-col items-center gap-1"
                    onClick={() => selectPopularSubscription(sub)}
                  >
                    <span>{sub.name}</span>
                    <span className="text-muted-foreground">₹{sub.defaultAmount}</span>
                  </Button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Subscription Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                  placeholder="Netflix, Electricity Bill, etc."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({...prev, amount: e.target.value}))}
                  placeholder="649"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency">Billing Frequency</Label>
                <Select value={formData.frequency} onValueChange={(value: any) => setFormData(prev => ({...prev, frequency: value}))}>
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

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({...prev, category: value}))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptionCategories.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>
                        <div className="flex items-center gap-2">
                          <cat.icon className="w-4 h-4" style={{color: cat.color}} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nextDueDate">Next Due Date</Label>
                <Input
                  id="nextDueDate"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={(e) => setFormData(prev => ({...prev, nextDueDate: e.target.value}))}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="autopay"
                  checked={formData.autoPayEnabled}
                  onCheckedChange={(checked) => setFormData(prev => ({...prev, autoPayEnabled: checked}))}
                />
                <Label htmlFor="autopay">Enable UPI AutoPay</Label>
              </div>

              <Button type="submit" className="w-full">
                Add Subscription
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Monthly Total</p>
              <p className="text-lg">₹{getTotalMonthlyAmount().toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Active Subscriptions</p>
              <p className="text-lg">{subscriptions.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Payments */}
      {upcomingSubscriptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingSubscriptions.map((subscription) => {
              const Icon = getCategoryIcon(subscription.category);
              return (
                <div key={subscription.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{backgroundColor: getCategoryColor(subscription.category) + '20'}}
                    >
                      <Icon className="w-4 h-4" style={{color: getCategoryColor(subscription.category)}} />
                    </div>
                    <div>
                      <p className="text-sm">{subscription.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(subscription.nextDueDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">₹{subscription.amount}</p>
                    {subscription.autoPayEnabled && (
                      <Badge variant="secondary" className="text-xs">AutoPay</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* All Subscriptions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {subscriptions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Tv className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No subscriptions added yet</p>
              <p className="text-sm">Add your first subscription to start tracking</p>
            </div>
          ) : (
            subscriptions.map((subscription) => {
              const Icon = getCategoryIcon(subscription.category);
              return (
                <div key={subscription.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{backgroundColor: getCategoryColor(subscription.category) + '20'}}
                    >
                      <Icon className="w-5 h-5" style={{color: getCategoryColor(subscription.category)}} />
                    </div>
                    <div>
                      <p>{subscription.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>₹{subscription.amount} • {subscription.frequency}</span>
                        {subscription.autoPayEnabled ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Next: {new Date(subscription.nextDueDate).toLocaleDateString()}
                    </p>
                    <Badge variant={subscription.autoPayEnabled ? "default" : "secondary"} className="text-xs">
                      {subscription.autoPayEnabled ? "AutoPay" : "Manual"}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}