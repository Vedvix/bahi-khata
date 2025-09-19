import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

//api integration imports
// add alongside your other imports
import { fetchInvestmentsAPI, createInvestmentAPI, updateInvestmentAPI, } from '../../service/investments';
import { fetchLentAPI, createLentAPI, updateLentAPI, normalizeStatusForBackend } from '../../service/lent';
import { fetchSubscriptionsAPI, createSubscriptionAPI, updateSubscriptionAPI, deleteSubscriptionAPI } from '../../service/subscription'
import { fetchTransactionsAPI, createTransactionAPI, updateTransactionAPI, deleteTransactionAPI, fetchRecentTransactionsAPI } from '../../service/transactions';


export interface Transaction {
  id: string;
  type: 'income' | 'expense' | 'investment' | 'lend';
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'mutual_fund' | 'stocks' | 'ppf' | 'fd' | 'gold' | 'crypto' | 'bonds';
  amount: number;
  currentValue: number;
  purchaseDate: string;
  maturityDate?: string;
  interestRate?: number;
  returns: number;
  status: 'active' | 'matured' | 'sold';
}

export interface LendRecord {
  id: string;
  borrowerName: string;
  amount: number;
  lendDate: string;
  dueDate: string;
  interestRate: number;
  purpose: string;
  status: 'active' | 'partially_paid' | 'fully_paid' | 'overdue';
  paidAmount: number;
  remainingAmount: number;
  totalAmount: number; 
}

export interface EMI {
  id: string;
  name: string;
  totalAmount: number;
  monthlyEMI: number;
  interestRate: number;
  tenure: number;
  remainingMonths: number;
  nextDueDate: string;
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  category: string;
  autoPayEnabled: boolean;
  isActive: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'investment' | 'lend';
}

interface TransactionContextType {
  transactions: Transaction[];
  recentTransactions: Transaction[];
  investments: Investment[];
  lendRecords: LendRecord[];
  emis: EMI[];
  subscriptions: Subscription[];
  categories: Category[];

  addTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  addInvestment: (investment: Omit<Investment, 'id'>) => void;
  addLendRecord: (lendRecord: Omit<LendRecord, 'id'>) => void;
  updateInvestment: (id: string, investment: Partial<Investment>) => void;
  updateLendRecord: (id: string, lendRecord: Partial<LendRecord>) => void;
  addEMI: (emi: Omit<EMI, 'id'>) => void;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

  exportData: () => string;
  importData: (data: string) => boolean;
  clearAllData: () => void;
  
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

// Default Indian categories
const defaultCategories: Category[] = [
  { id: '1', name: 'Groceries', icon: '🛒', color: '#10B981', type: 'expense' },
  { id: '2', name: 'Rent', icon: '🏠', color: '#3B82F6', type: 'expense' },
  { id: '3', name: 'Utilities', icon: '💡', color: '#F59E0B', type: 'expense' },
  { id: '4', name: 'Petrol/Fuel', icon: '⛽', color: '#EF4444', type: 'expense' },
  { id: '5', name: 'Medical Bills', icon: '🏥', color: '#EC4899', type: 'expense' },
  { id: '6', name: 'EMI', icon: '💳', color: '#8B5CF6', type: 'expense' },
  { id: '7', name: 'Salary', icon: '💰', color: '#059669', type: 'income' },
  { id: '8', name: 'Freelance', icon: '💻', color: '#0891B2', type: 'income' },
  { id: '9', name: 'Food & Dining', icon: '🍽️', color: '#DC2626', type: 'expense' },
  { id: '10', name: 'Transport', icon: '🚌', color: '#7C3AED', type: 'expense' },
  // Investment categories
  { id: '11', name: 'Mutual Funds', icon: '📈', color: '#059669', type: 'investment' },
  { id: '12', name: 'Stocks', icon: '📊', color: '#DC2626', type: 'investment' },
  { id: '13', name: 'PPF', icon: '🏛️', color: '#0891B2', type: 'investment' },
  { id: '14', name: 'Fixed Deposit', icon: '🏦', color: '#F59E0B', type: 'investment' },
  { id: '15', name: 'Gold', icon: '🪙', color: '#EAB308', type: 'investment' },
  { id: '16', name: 'Crypto', icon: '₿', color: '#8B5CF6', type: 'investment' },
  // Lending categories
  { id: '17', name: 'Personal Loan', icon: '🤝', color: '#10B981', type: 'lend' },
  { id: '18', name: 'Business Loan', icon: '🏢', color: '#3B82F6', type: 'lend' },
  { id: '19', name: 'Emergency Loan', icon: '🚨', color: '#EF4444', type: 'lend' },
];

// Sample data
const sampleTransactions: Transaction[] = [
  {
    id: '1',
    type: 'expense',
    amount: 1200,
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    date: '2024-12-25',
    time: '10:30'
  },
  {
    id: '2',
    type: 'income',
    amount: 50000,
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-12-24',
    time: '09:00'
  },
  {
    id: '3',
    type: 'expense',
    amount: 800,
    category: 'Petrol/Fuel',
    description: 'Petrol fill-up',
    date: '2024-12-23',
    time: '18:15'
  },
];

const sampleEMIs: EMI[] = [
  {
    id: '1',
    name: 'Home Loan',
    totalAmount: 2500000,
    monthlyEMI: 25000,
    interestRate: 8.5,
    tenure: 240,
    remainingMonths: 180,
    nextDueDate: '2024-12-30'
  },
  {
    id: '2',
    name: 'Car Loan',
    totalAmount: 800000,
    monthlyEMI: 15000,
    interestRate: 9.2,
    tenure: 60,
    remainingMonths: 36,
    nextDueDate: '2024-12-28'
  },
];

const sampleSubscriptions: Subscription[] = [
  {
    id: '1',
    name: 'Netflix',
    amount: 649,
    frequency: 'monthly',
    nextDueDate: '2024-12-30',
    category: 'Entertainment',
    autoPayEnabled: true,
    isActive:""
  },
  {
    id: '2',
    name: 'Electricity Bill',
    amount: 2500,
    frequency: 'monthly',
    nextDueDate: '2025-01-05',
    category: 'Utilities',
    autoPayEnabled: false,
    isActive:""
  },
  {
    id: '3',
    name: 'Mobile Recharge',
    amount: 399,
    frequency: 'monthly',
    nextDueDate: '2025-01-02',
    category: 'Utilities',
    autoPayEnabled: true,
    isActive:""
  },
];

const sampleInvestments: Investment[] = [
  {
    id: '1',
    name: 'SBI Bluechip Fund',
    type: 'mutual_fund',
    amount: 50000,
    currentValue: 54500,
    purchaseDate: '2024-06-15',
    returns: 9.0,
    status: 'active'
  },
  {
    id: '2',
    name: 'Reliance Industries',
    type: 'stocks',
    amount: 25000,
    currentValue: 28750,
    purchaseDate: '2024-08-20',
    returns: 15.0,
    status: 'active'
  },
  {
    id: '3',
    name: 'PPF Account',
    type: 'ppf',
    amount: 150000,
    currentValue: 162000,
    purchaseDate: '2024-04-01',
    maturityDate: '2039-04-01',
    interestRate: 8.0,
    returns: 8.0,
    status: 'active'
  },
];

const sampleLendRecords: LendRecord[] = [
  {
    id: '1',
    borrowerName: 'Rajesh Kumar',
    amount: 50000,
    lendDate: '2024-10-15',
    dueDate: '2025-01-15',
    interestRate: 12.0,
    purpose: 'Business expansion',
    status: 'active',
    paidAmount: 0,
    remainingAmount: 50000,
    totalAmount:0,
  },
  {
    id: '2',
    borrowerName: 'Priya Sharma',
    amount: 25000,
    lendDate: '2024-11-01',
    dueDate: '2025-02-01',
    interestRate: 10.0,
    purpose: 'Medical emergency',
    status: 'partially_paid',
    paidAmount: 10000,
    remainingAmount: 15000,
    totalAmount:0,
  },
];

// Local storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'fintrack_transactions',
  INVESTMENTS: 'fintrack_investments', 
  LEND_RECORDS: 'fintrack_lend_records',
  EMIS: 'fintrack_emis',
  SUBSCRIPTIONS: 'fintrack_subscriptions',
  CATEGORIES: 'fintrack_categories',
  LAST_BACKUP: 'fintrack_last_backup'
};

// Helper functions for localStorage
const loadFromStorage = (key: string, defaultValue: any): any => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const saveToStorage = (key: string, data: any): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [lendRecords, setLendRecords] = useState<LendRecord[]>([]);
  const [emis, setEMIs] = useState<EMI[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);



  // Load data from localStorage on mount
  // useEffect investments added other left
  useEffect(() => {
    let mounted = true;

    const loadAll = async () => {
      // Load everything from localStorage first (so UI shows quickly)
      const loadedTransactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, sampleTransactions);
      const loadedLendRecords = loadFromStorage(STORAGE_KEYS.LEND_RECORDS, sampleLendRecords);
      const loadedEMIs = loadFromStorage(STORAGE_KEYS.EMIS, sampleEMIs);
      const loadedSubscriptions = loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, sampleSubscriptions);
      const loadedCategories = loadFromStorage(STORAGE_KEYS.CATEGORIES, defaultCategories);

      if (!mounted) return;
      setTransactions(loadedTransactions);
      setEMIs(loadedEMIs);
      setCategories(loadedCategories);

      // Investments: try API, fallback to localStorage/sample
      try {
        const data = await fetchInvestmentsAPI({ page: 1, size: 100 });
        if (!mounted) return;

        const investmentsList = Array.isArray(data) ? data : (data?.investments ?? []);
        if (investmentsList && investmentsList.length > 0) {
          setInvestments(investmentsList);
        } else {
          setInvestments(loadFromStorage(STORAGE_KEYS.INVESTMENTS, sampleInvestments));
        }
      } catch (err) {
        console.warn('Failed to fetch investments from API, using local data', err);
        if (!mounted) return;
        setInvestments(loadFromStorage(STORAGE_KEYS.INVESTMENTS, sampleInvestments));
      }

      // Lent money: try API, fallback to localStorage/sample
      try {
        const data = await fetchLentAPI({ page: 1, size: 100 });
        if (!mounted) return;

        const lentList = Array.isArray(data) ? data : (data?.lent ?? []);
        if (lentList && lentList.length > 0) {
          setLendRecords(lentList);
        } else {
          setLendRecords(loadFromStorage(STORAGE_KEYS.LEND_RECORDS, sampleLendRecords));
        }
      } catch (err) {
        console.warn('Failed to fetch lent money from API, using local data', err);
        if (!mounted) return;
        setLendRecords(loadFromStorage(STORAGE_KEYS.LEND_RECORDS, sampleLendRecords));
      }

      //Subscription data fetching
            // Subscriptions: try API, fallback to localStorage/sample
      try {
        const subsResp = await fetchSubscriptionsAPI({ page: 1, size: 100 });
        if (!mounted) return;

        // fetchSubscriptionsAPI returns { total, page, size, subscriptions } (mapped to frontend shape)
        const subsList = Array.isArray(subsResp) ? subsResp : (subsResp.subscriptions ?? subsResp);
        if (subsList && subsList.length > 0) {
          setSubscriptions(subsList);
        } else {
          setSubscriptions(loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, sampleSubscriptions));
        }
      } catch (err) {
        console.warn('Failed to fetch subscriptions from API, using local data', err);
        if (!mounted) return;
        setSubscriptions(loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, sampleSubscriptions));
      }
          // Transactions: try API, fallback to localStorage/sample
      try {
      // Fetch transactions from backend
      const txResp = await fetchTransactionsAPI();
      if (!mounted) return;

      // txResp may be array of transactions from backend
            if (Array.isArray(txResp) && txResp.length > 0) {
        setTransactions(txResp);

        // compute totals from backend or local calculation
        const income = txResp
          .filter(tx => tx.type === 'income')
          .reduce((sum, tx) => sum + tx.amount, 0);
        const expense = txResp
          .filter(tx => tx.type === 'expense')
          .reduce((sum, tx) => sum + tx.amount, 0);

        setTotalIncome(income);
        setTotalExpense(expense);
        setBalance(income - expense);
      } 

    } catch (err) {
      console.warn("Failed to fetch transactions from API, using local data", err);
      setTransactions(loadFromStorage(STORAGE_KEYS.TRANSACTIONS, sampleTransactions));
    }



    
    };

    loadAll();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
  
  if (!transactions) return;
  
  const income = transactions
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);

  const expense = transactions
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);

  setTotalIncome(income);
  setTotalExpense(expense);
  setBalance(income - expense);
}, [transactions]);   // 👈 runs whenever transactions changes

useEffect(() => {
  fetchRecentTransactionsAPI().then((resp) => {
    const normalized: Transaction[] = resp.map((tx: any) => ({
      ...tx,
      id: String(tx.id),  // 👈 force id into string
    }));
    setRecentTransactions(normalized);
  });
}, [transactions]);



  // Save to localStorage whenever data changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TRANSACTIONS, transactions);
  }, [transactions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.INVESTMENTS, investments);
  }, [investments]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.LEND_RECORDS, lendRecords);
  }, [lendRecords]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.EMIS, emis);
  }, [emis]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SUBSCRIPTIONS, subscriptions);
  }, [subscriptions]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
  }, [categories]);

//Helper to update income balance and expense
  const recalcTotals = (txns: Transaction[]) => {
  const income = txns
    .filter((tx) => tx.type === "income")
    .reduce((sum, tx) => sum + tx.amount, 0);
  const expense = txns
    .filter((tx) => tx.type === "expense")
    .reduce((sum, tx) => sum + tx.amount, 0);
  setTotalIncome(income);
  setTotalExpense(expense);
  setBalance(income - expense);
};


const addTransaction = async (transaction: Omit<Transaction, "id">) => {
  const temp: Transaction = { ...transaction, id: Date.now().toString() };

  // optimistic update
  setTransactions((prev) => {
    const updated = [temp, ...prev];
    recalcTotals(updated);   // 🔥 recompute totals
    return updated;
  });

  try {
    const created = await createTransactionAPI(transaction);

    // replace temp with created from backend
    setTransactions((prev) => {
      const updated = prev.map((tx) =>
        tx.id === temp.id ? created : tx
      );
      recalcTotals(updated);   // 🔥 recompute totals
      return updated;
    });

    return created;
  } catch (err) {
    console.warn("Transaction API failed, keeping local", err);
    return temp;
  }
};

  //add investment(api integration)
// Add investment -> POST /investments (optimistic local create, then reconcile with server)
  const addInvestment = async (investment: Omit<Investment, 'id'>) => {
    // optimistic local create so UI isn't blocked
    const temp: Investment = { ...investment, id: Date.now().toString() };
    setInvestments(prev => [...prev, temp]);

    try {
      // map frontend fields to backend expected payload (purchaseDate -> startDate)
      const payload = {
        name: investment.name,
        type: investment.type,
        amount: investment.amount,
        currentValue: investment.currentValue ?? 0,
        startDate: investment.purchaseDate, 
        maturityDate: investment.maturityDate ?? null,
        returns: investment.returns ?? 0,
      };
      const created = await createInvestmentAPI(payload);
      // Replace the optimistic item with server result
      setInvestments(prev => prev.map(i => (i.id === temp.id ? created : i)));
      return created;
    } catch (err) {
      console.warn('addInvestment: API failed, kept local version', err);
      // keep optimistic item (already added) and return it
      const local = investments.find(i => i.id === temp.id) ?? temp;
      return local;
    }
  };

// Api integration(lent money add function)
// Add lend record -> POST /lent (optimistic local create)
  const addLendRecord = async (lendRecord: Omit<LendRecord, 'id'>) => {
    const temp: LendRecord = {
      ...lendRecord,
      id: Date.now().toString(),
    };
    // optimistic local add
    setLendRecords(prev => [...prev, temp]);

    try {
      // map frontend -> backend payload
      const payload = {
        borrowerName: lendRecord.borrowerName,
        principalAmount: lendRecord.amount,
        interestRate: lendRecord.interestRate ?? null,
        lentDate: lendRecord.lendDate ?? null,
        dueDate: lendRecord.dueDate,
        //totalAmount: (lendRecord.remainingAmount ?? lendRecord.amount) + (lendRecord.paidAmount ?? 0),
        status: (normalizeStatusForBackend(lendRecord.status) ?? 'active'),
      };
      const created = await createLentAPI(payload);
      // map server row back to frontend shape
      const mapped = {
        id: created.id?.toString(),
        borrowerName: created.borrowerName ?? '',
        amount: created.principalAmount ?? 0,
        lendDate: created.lentDate ?? null,
        dueDate: created.dueDate ?? null,
        interestRate: created.interestRate ?? 0,
        purpose: created.purpose ?? '',
        status: (created.status ?? 'Active').toLowerCase(),
        paidAmount: created.paidAmount ?? 0,
        remainingAmount:
          (typeof created.totalAmount === 'number' ? created.totalAmount : (created.principalAmount ?? 0)) - (created.paidAmount ?? 0),
        totalAmount: created.totalAmount ?? (created.principalAmount ?? 0) + (created.paidAmount ?? 0),

      };
      // replace temp item with server result
      setLendRecords(prev => prev.map(l => (l.id === temp.id ? mapped : l)));
      return mapped;
    } catch (err) {
      console.warn('addLendRecord: API failed, kept local version', err);
      // keep optimistic local item
      const local = lendRecords.find(l => l.id === temp.id) ?? temp;
      return local;
    }
  };

//update investment(api integration)
  const updateInvestment = async (id: string, updatedInvestment: Partial<Investment>) => {
    // optimistic local update
    setInvestments(prev => prev.map(inv => (inv.id === id ? { ...inv, ...updatedInvestment } : inv)));

    try {
      // Map frontend fields to backend expected (purchaseDate -> startDate)
      const payload: any = {};
      if (updatedInvestment.name !== undefined) payload.name = updatedInvestment.name;
      if (updatedInvestment.type !== undefined) payload.type = updatedInvestment.type;
      if (updatedInvestment.amount !== undefined) payload.amount = updatedInvestment.amount;
      if (updatedInvestment.currentValue !== undefined) payload.currentValue = updatedInvestment.currentValue;
      if (updatedInvestment.purchaseDate !== undefined) payload.startDate = updatedInvestment.purchaseDate;
      if (updatedInvestment.maturityDate !== undefined) payload.maturityDate = updatedInvestment.maturityDate;
      if (updatedInvestment.returns !== undefined) payload.returns = updatedInvestment.returns;

      const updated = await updateInvestmentAPI(id, payload);
      // replace with server-canonical row
      setInvestments(prev => prev.map(inv => (inv.id === id ? updated : inv)));
      return updated;
    } catch (err) {
      console.warn('updateInvestment: API failed; kept optimistic local update', err);
      // return local item after optimistic update
      const local = investments.find(i => i.id === id) ?? null;
      return local;
    }
  };



const updateLendRecord = async (
  id: string,
  changes: Partial<LendRecord>
): Promise<LendRecord | null> => {
  try {
    // Find existing record in state
    const existing = lendRecords.find(l => l.id === id);
    if (!existing) throw new Error('Local record not found');

    // Build backend payload (only send fields that actually changed)
    const payload: any = {};

    if (changes.borrowerName !== undefined)
      payload.borrowerName = changes.borrowerName;

    if (changes.amount !== undefined)
      payload.principalAmount = changes.amount;

    if (changes.interestRate !== undefined)
      payload.interestRate = changes.interestRate;

    if (changes.lendDate !== undefined)
      payload.lentDate = changes.lendDate;

    if (changes.dueDate !== undefined)
      payload.dueDate = changes.dueDate;

    if (changes.paidAmount !== undefined)
      payload.paidAmount = changes.paidAmount;

    // Normalize status → backend expects "Active" | "Paid" | "Overdue"
    if (changes.status !== undefined) {
      const normalized = normalizeStatusForBackend(changes.status);
      if (normalized) payload.status = normalized;
    }

    // Call backend
    const updated = await updateLentAPI(id, payload);

    // Map backend → frontend shape
    const mapped: LendRecord = {
      id: updated.id?.toString(),
      borrowerName: updated.borrowerName ?? '',
      amount: updated.principalAmount ?? 0,
      lendDate: updated.lentDate ?? null,
      dueDate: updated.dueDate ?? null,
      interestRate: updated.interestRate ?? 0,
      status: (updated.status ?? 'Active').toLowerCase(),
      paidAmount: updated.paidAmount ?? 0,
      remainingAmount: updated.remainingAmount ?? Math.max(
        (updated.totalAmount ?? 0) - (updated.paidAmount ?? 0),
        0
      ),
      totalAmount: updated.totalAmount ?? (updated.principalAmount ?? 0) + (updated.paidAmount ?? 0),
      purpose: updated.purpose ?? ''
    };

    // Update state with fresh canonical backend row
    setLendRecords(prev =>
      prev.map(l => (l.id === id ? mapped : l))
    );

    return mapped;
  } catch (err) {
    console.error('updateLendRecord failed', err);
    return null;
  }
};




    const addEMI = (emi: Omit<EMI, 'id'>) => {
      const newEMI = {
        ...emi,
        id: Date.now().toString(),
      };
      setEMIs(prev => [...prev, newEMI]);
    };

const addSubscription = async (subscription: Omit<Subscription, 'id'>) => {
  const temp: Subscription = { ...subscription, id: Date.now().toString() };
  // optimistic add
  setSubscriptions(prev => [...prev, temp]);

  try {
    // normalize booleans at caller level too
    const frontPayload = {
      name: subscription.name,
      amount: subscription.amount,
      frequency: subscription.frequency,
      nextDueDate: subscription.nextDueDate ?? null,
      category: subscription.category ?? null,
      autoPayEnabled: Boolean(subscription.autoPayEnabled),
      isActive: subscription.isActive !== undefined ? Boolean(subscription.isActive) : true,
    };

    const created = await createSubscriptionAPI(frontPayload);

    if (!created || !created.id) {
      // if server returned nothing, revert optimistic item and throw
      setSubscriptions(prev => prev.filter(s => s.id !== temp.id));
      throw new Error('Server did not return created subscription');
    }

    // replace temp with server result
    setSubscriptions(prev => prev.map(s => (s.id === temp.id ? created : s)));
    return created;
  } catch (err) {
    console.warn('addSubscription: API failed; reverting optimistic add or keeping local copy', err);
    // try to revert optimistic add if create failed
    setSubscriptions(prev => prev.filter(s => s.id !== temp.id));
    // optionally keep the optimistic item instead of reverting:
    // setSubscriptions(prev => [...prev, temp]);
    return null;
  }
};


  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = {
      ...category,
      id: Date.now().toString(),
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, updatedCategory: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updatedCategory } : cat))
    );
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));
  };

  const updateSubscription = async (id: string, updatedSubscription: Partial<Subscription>) => {
    // optimistic local update
    setSubscriptions(prev => prev.map(s => (s.id === id ? { ...s, ...updatedSubscription } : s)));

    try {
      // prepare payload in frontend shape; service will map to server keys
      const payload: any = {};
      if (updatedSubscription.name !== undefined) payload.name = updatedSubscription.name;
      if (updatedSubscription.amount !== undefined) payload.amount = updatedSubscription.amount;
      if (updatedSubscription.frequency !== undefined) payload.frequency = updatedSubscription.frequency;
      if (updatedSubscription.nextDueDate !== undefined) payload.nextDueDate = updatedSubscription.nextDueDate;
      if (updatedSubscription.category !== undefined) payload.category = updatedSubscription.category;
      if (updatedSubscription.autoPayEnabled !== undefined) payload.autoPayEnabled = updatedSubscription.autoPayEnabled;
      if (updatedSubscription.isActive !== undefined) payload.isActive = updatedSubscription.isActive;

      const updated = await updateSubscriptionAPI(id, payload);
      // replace with server-canonical mapped row
      setSubscriptions(prev => prev.map(s => (s.id === id ? updated : s)));
      return updated;
    } catch (err) {
      console.warn('updateSubscription: API failed; kept optimistic update', err);
      // return local after optimistic update
      return subscriptions.find(s => s.id === id) ?? null;
    }
  };

const deleteSubscription = async (id: string) => {
  const prev = subscriptions;
  // optimistic remove
  setSubscriptions(prevList => prevList.filter(s => s.id !== id));
  try {
    await deleteSubscriptionAPI(id);
    return true;
  } catch (err) {
    console.warn('deleteSubscription API failed; restoring local copy', err);
    // restore previous state
    setSubscriptions(prev);
    return false;
  }
};

  const exportData = (): string => {
    const exportData = {
      transactions,
      investments,
      lendRecords,
      emis,
      subscriptions,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return JSON.stringify(exportData, null, 2);
  };

  const importData = (dataString: string): boolean => {
    try {
      const data = JSON.parse(dataString);
      
      // Validate the data structure
      if (!data.version || !data.exportDate) {
        throw new Error('Invalid backup file format');
      }

      // Import data
      if (data.transactions) setTransactions(data.transactions);
      if (data.investments) setInvestments(data.investments);
      if (data.lendRecords) setLendRecords(data.lendRecords);
      if (data.emis) setEMIs(data.emis);
      if (data.subscriptions) setSubscriptions(data.subscriptions);
      if (data.categories) setCategories(data.categories);

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  const clearAllData = () => {
    setTransactions([]);
    setInvestments([]);
    setLendRecords([]);
    setEMIs([]);
    setSubscriptions([]);
    setCategories(defaultCategories);
    
    // Clear localStorage
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  };

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        recentTransactions,
        investments,
        lendRecords,
        emis,
        subscriptions,
        categories,
        addTransaction,
        addInvestment,
        addLendRecord,
        updateInvestment,
        updateLendRecord,
        addEMI,
        addSubscription,
        updateSubscription,
        deleteSubscription,
        addCategory,
        updateCategory,
        deleteCategory,
        exportData,
        importData,
        clearAllData,
        totalIncome,
        totalExpense,
        balance,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions must be used within a TransactionProvider');
  }
  return context;
}