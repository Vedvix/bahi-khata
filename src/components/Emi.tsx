"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription, // Added for better UX
  DialogFooter,    // Added for better UX
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { CreditCard, Calendar, TrendingUp } from "lucide-react"; // Added TrendingUp for Prepayment icon
import { useTransactions, EMI, Transaction } from "./TransactionContext"; // Added Transaction import
import { useAuth } from "./AuthContext";

// Utility function to get the next due date
const getNextDueDate = (currentDueDate: string, monthsToAdd: number): string => {
  const date = new Date(currentDueDate);
  // Add months to the current date. JavaScript handles month overflow (e.g., adding 1 month to Jan 31st moves to March 2nd)
  date.setMonth(date.getMonth() + monthsToAdd); 
  // Get the resulting date in YYYY-MM-DD format
  return date.toISOString().split("T")[0];
};

// --- New Prepayment Dialog Component ---
const PrepaymentDialog = ({ emi, onPrepay }: { emi: EMI; onPrepay: (amount: number) => void }) => {
  const [prepayAmount, setPrepayAmount] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const monthlyEMI = emi.monthlyEMI;
  const numberOfEMIsCovered = Math.floor(parseFloat(prepayAmount) / monthlyEMI);

  const handlePrepayClick = () => {
    const amount = parseFloat(prepayAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    onPrepay(amount);
    setPrepayAmount("");
    setIsDialogOpen(false);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="secondary" className="text-xs">
          Prepay
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xs sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Prepay EMI: {emi.name}</DialogTitle>
          <DialogDescription>
            Current EMI: ₹{emi.monthlyEMI.toLocaleString()}. Enter the amount you wish to pay.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="prepayAmount">Prepayment Amount (₹)</Label>
            <Input
              id="prepayAmount"
              type="number"
              placeholder={String(monthlyEMI * 2)} // Suggest paying 2 EMIs
              value={prepayAmount}
              onChange={(e) => setPrepayAmount(e.target.value)}
            />
          </div>
          {numberOfEMIsCovered > 0 && (
            <p className="text-sm text-green-600 font-medium">
              This payment covers approximately **{numberOfEMIsCovered}** month(s) of EMI.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button onClick={handlePrepayClick} disabled={numberOfEMIsCovered < 1}>
            Confirm Prepayment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


// --- Emi Main Component ---

export function Emi() {
  const { user } = useAuth();
  const { emis, addEMI, addTransaction, updateEMI } = useTransactions();

  // ... (Add EMI Dialog State and handleAddEMI are unchanged)
  const [isEMIDialogOpen, setIsEMIDialogOpen] = useState(false);
  const [emiName, setEmiName] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [monthlyEMI, setMonthlyEMI] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenure, setTenure] = useState("");
  const [nextEMIDue, setNextEMIDue] = useState("");

  const handleAddEMI = () => {
    if (!user?.id || !emiName || !totalAmount || !monthlyEMI || !interestRate || !tenure || !nextEMIDue) return;

    const newEMI: Omit<EMI, 'id'> = { // Use Omit to match TransactionContext
      name: emiName,
      totalAmount: parseFloat(totalAmount),
      monthlyEMI: parseFloat(monthlyEMI),
      interestRate: parseFloat(interestRate),
      tenure: parseInt(tenure),
      remainingMonths: parseInt(tenure),
      nextDueDate: nextEMIDue,
      user_id: user.id, // Add user_id to satisfy interface
    };

    addEMI(newEMI);

    // Reset state
    setEmiName("");
    setTotalAmount("");
    setMonthlyEMI("");
    setInterestRate("");
    setTenure("");
    setNextEMIDue("");
    setIsEMIDialogOpen(false);
  };
  

  // --- New Handle Prepayment ---
  const handlePrepayment = (emi: EMI, prepaymentAmount: number) => {
    if (!user?.id || prepaymentAmount <= 0) return;
    
    const numberOfMonths = Math.floor(prepaymentAmount / emi.monthlyEMI);
    const newRemainingMonths = Math.max(emi.remainingMonths - numberOfMonths, 0);
    
    // Calculate the new next due date
    const newNextDueDate = getNextDueDate(emi.nextDueDate, numberOfMonths);

    // 1. Record the Transaction
    const today = new Date();
    const timeString = today.toLocaleTimeString("en-IN", { hour12: false });
    
    const newTransaction: Omit<Transaction, 'id'> = { // Use Omit
      type: "expense", // EMI payment is an expense
      amount: prepaymentAmount,
      category: "EMI",
      description: `Prepayment (${numberOfMonths} months) for ${emi.name}`,
      date: today.toISOString().split("T")[0],
      time: timeString,
      user_id: user.id,
    };
    addTransaction(newTransaction);
    
    // 2. Update the EMI record
    updateEMI(emi.id, {
      remainingMonths: newRemainingMonths,
      nextDueDate: newNextDueDate,
    });
  };


  // --- Mark EMI Paid (for single payment) ---
  const handleMarkPaid = (emi: EMI) => {
    // This is now a simple wrapper around handlePrepayment for a single EMI amount
    handlePrepayment(emi, emi.monthlyEMI);
  };

  // --- Calculations ---
  const totalMonthlyEMI = emis.reduce((sum, emi) => sum + emi.monthlyEMI, 0);
  const overdueEMIs = emis.filter((emi) => new Date(emi.nextDueDate) < new Date());
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  const dueNextWeekEMIs = emis.filter((emi) => {
    const due = new Date(emi.nextDueDate);
    const today = new Date();
    // Only show if not yet overdue, and is within the next 7 days
    return due >= today && due <= nextWeek && new Date(emi.nextDueDate).toDateString() !== today.toDateString(); 
  });
  
  // EMIs due TODAY should be prioritized or handled separately if required. 
  const dueTodayEMIs = emis.filter((emi) => {
      const due = new Date(emi.nextDueDate).toDateString();
      const today = new Date().toDateString();
      return due === today;
  });
  
  // Combine all EMIs due soon for a clean list
  const priorityEMIs = [...overdueEMIs, ...dueTodayEMIs, ...dueNextWeekEMIs.filter(e => !overdueEMIs.includes(e) && !dueTodayEMIs.includes(e))];


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
            <Button className="">
                <CreditCard className="w-4 h-4 mr-2" /> + Add EMI
            </Button>
          </DialogTrigger>
          {/* ... (DialogContent for Add EMI is unchanged) ... */}
           <DialogContent className="max-w-md mx-auto">
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

      {/* Summary Cards - Adjusted to match the image structure */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="shadow-lg border-l-4 border-gray-900"> {/* Change border-indigo-500 to border-gray-900 or border-black */}
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Total Monthly EMI</p>
            <p className="text-2xl font-bold text-gray-900">
              {/* Change text-indigo-600 to text-gray-900 */}
              ₹{totalMonthlyEMI.toLocaleString('en-IN')}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-l-4">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Active EMIs</p>
            <p className="text-2xl font-bold">{emis.length}</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Overdue EMIs Card (Combined with Due Today/Next Week for 'Action Required' focus) */}
      {priorityEMIs.length > 0 && (
        <Card className="border-red-300 shadow-md">
          <CardHeader className="bg-red-50/50 border-b p-3 rounded-t-lg">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <Calendar className="w-4 h-4" /> Action Required: Upcoming & Overdue EMIs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {priorityEMIs.map((emi) => {
                const due = new Date(emi.nextDueDate);
                const today = new Date();
                const isOverdue = due < today && due.toDateString() !== today.toDateString();
                const isDueToday = due.toDateString() === today.toDateString();
                
                return (
                  <div key={emi.id} className={`flex items-center justify-between p-3 rounded-lg ${isOverdue ? 'bg-red-50 border border-red-200' : 'border'}`}>
                    <div className="flex items-center gap-3">
                      <CreditCard className={`w-5 h-5 ${isOverdue ? 'text-red-600' : isDueToday ? 'text-yellow-600' : 'text-blue-600'}`} />
                      <div>
                        <p className="font-medium">{emi.name}</p>
                        <p className={`text-xs ${isOverdue ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                          {isOverdue ? 'OVERDUE' : isDueToday ? 'DUE TODAY' : 'Due'} on {due.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-base font-semibold">₹{emi.monthlyEMI.toLocaleString('en-IN')}</span>
                        <Button size="sm" onClick={() => handleMarkPaid(emi)}>
                            Pay Now
                        </Button>
                    </div>
                  </div>
                );
            })}
          </CardContent>
        </Card>
      )}


      {/* All EMIs - Includes the new Prepayment Button */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All EMIs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {emis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No active EMIs. Time to celebrate!</p>
            </div>
          ) : (
            emis.map((emi) => (
              <div key={emi.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="font-semibold">{emi.name}</p>
                    <p className="text-sm text-muted-foreground">
                      ₹{emi.monthlyEMI.toLocaleString('en-IN')} • {emi.remainingMonths}/{emi.tenure} months left
                    </p>
                  </div>
                </div>
                <div className="flex gap-2"> 
                    {/* NEW PREPAYMENT BUTTON */}
                    <PrepaymentDialog emi={emi} onPrepay={(amount) => handlePrepayment(emi, amount)} />
                    
                    {/* Optional: Add a quick delete button for management */}
                    {/* <Button variant="destructive" size="sm" className="h-8 w-8 p-0">🗑️</Button> */}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}