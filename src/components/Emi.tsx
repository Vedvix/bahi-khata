"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreditCard, Calendar } from "lucide-react";
import { useTransactions, EMI } from "./TransactionContext";
import { useAuth } from "./AuthContext";

export function Emi() {
  const { user } = useAuth();
  const { emis, addEMI, addTransaction, updateEMI } = useTransactions();

  // --- Add EMI Dialog State ---
  const [isEMIDialogOpen, setIsEMIDialogOpen] = useState(false);
  const [emiName, setEmiName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyEMI, setMonthlyEMI] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [nextEMIDue, setNextEMIDue] = useState("");

  // --- Add EMI Handler ---
  const handleAddEMI = () => {
    if (!user?.id) return;
    if (!emiName || !totalAmount || !monthlyEMI || !interestRate || !tenure || !nextEMIDue) return;

    const newEMI: EMI = {
      id: Date.now().toString(),
      name: emiName,
      totalAmount: parseFloat(totalAmount),
      monthlyEMI: parseFloat(monthlyEMI),
      interestRate: parseFloat(interestRate),
      tenure: parseInt(tenure),
      remainingMonths: parseInt(tenure),
      nextDueDate: nextEMIDue,
    };

    addEMI(newEMI);

    setEmiName("");
    setTotalAmount("");
    setMonthlyEMI("");
    setInterestRate("");
    setTenure("");
    setNextEMIDue("");
    setIsEMIDialogOpen(false);
  };

  // --- Mark EMI Paid ---
  const handleMarkPaid = (emi: EMI) => {
    if (!user?.id) return;
    const today = new Date();
    const timeString = today.toLocaleTimeString("en-IN", { hour12: false });

    addTransaction({
      type: "emi",
      amount: emi.monthlyEMI,
      category: "EMI",
      description: `Paid EMI for ${emi.name}`,
      date: today.toISOString().split("T")[0],
      time: timeString,
      user_id: user.id,
    });

    const nextDue = new Date(emi.nextDueDate);
    nextDue.setMonth(nextDue.getMonth() + 1);

    updateEMI(emi.id, {
      remainingMonths: Math.max(emi.remainingMonths - 1, 0),
      nextDueDate: nextDue.toISOString().split("T")[0],
    });
  };

  // --- Calculations ---
  const totalMonthlyEMI = emis.reduce((sum, emi) => sum + emi.monthlyEMI, 0);
  const overdueEMIs = emis.filter((emi) => new Date(emi.nextDueDate) < new Date());
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dueNextWeekEMIs = emis.filter((emi) => {
    const due = new Date(emi.nextDueDate);
    const today = new Date();
    return due >= today && due <= nextWeek;
  });

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">EMIs</h1>
          <p className="text-muted-foreground">Manage your loans and payments</p>
        </div>
        <Dialog open={isEMIDialogOpen} onOpenChange={setIsEMIDialogOpen}>
          <DialogTrigger asChild>
            <Button>Add EMI</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add EMI</DialogTitle>
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
                  placeholder="2500000"
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
                <Button variant="outline" onClick={() => setIsEMIDialogOpen(false)} className="flex-1">
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Monthly EMI</p>
            <p className="text-lg font-semibold">₹{totalMonthlyEMI.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Active EMIs</p>
            <p className="text-lg font-semibold">{emis.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue EMIs */}
      {overdueEMIs.length > 0 && (
        <Card className="border-red-300">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Calendar className="w-4 h-4" /> Overdue EMIs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueEMIs.map((emi) => (
              <div key={emi.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-red-600" />
                  <div>
                    <p>{emi.name}</p>
                    <p className="text-xs text-red-500">Due: {new Date(emi.nextDueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleMarkPaid(emi)}>
                  Mark Paid
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* EMIs Due Next Week */}
      {dueNextWeekEMIs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Due This Week
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dueNextWeekEMIs.map((emi) => (
              <div key={emi.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                  <div>
                    <p>{emi.name}</p>
                    <p className="text-xs text-muted-foreground">Due: {new Date(emi.nextDueDate).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm">₹{emi.monthlyEMI}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* All EMIs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All EMIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {emis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No EMIs added yet</p>
            </div>
          ) : (
            emis.map((emi) => (
              <div key={emi.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p>{emi.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{emi.monthlyEMI} • {emi.remainingMonths}/{emi.tenure} months left
                    </p>
                  </div>
                </div>
                {/* No Mark Paid button here */}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
