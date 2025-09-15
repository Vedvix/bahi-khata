import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    autoPayEnabled: true
  },
  {
    id: '2',
    name: 'Electricity Bill',
    amount: 2500,
    frequency: 'monthly',
    nextDueDate: '2025-01-05',
    category: 'Utilities',
    autoPayEnabled: false
  },
  {
    id: '3',
    name: 'Mobile Recharge',
    amount: 399,
    frequency: 'monthly',
    nextDueDate: '2025-01-02',
    category: 'Utilities',
    autoPayEnabled: true
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
    remainingAmount: 50000
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
    remainingAmount: 15000
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

  // Load data from localStorage on mount
  useEffect(() => {
    const loadedTransactions = loadFromStorage(STORAGE_KEYS.TRANSACTIONS, sampleTransactions);
    const loadedInvestments = loadFromStorage(STORAGE_KEYS.INVESTMENTS, sampleInvestments);
    const loadedLendRecords = loadFromStorage(STORAGE_KEYS.LEND_RECORDS, sampleLendRecords);
    const loadedEMIs = loadFromStorage(STORAGE_KEYS.EMIS, sampleEMIs);
    const loadedSubscriptions = loadFromStorage(STORAGE_KEYS.SUBSCRIPTIONS, sampleSubscriptions);
    const loadedCategories = loadFromStorage(STORAGE_KEYS.CATEGORIES, defaultCategories);

    setTransactions(loadedTransactions);
    setInvestments(loadedInvestments);
    setLendRecords(loadedLendRecords);
    setEMIs(loadedEMIs);
    setSubscriptions(loadedSubscriptions);
    setCategories(loadedCategories);
  }, []);

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

  const addTransaction = (transaction: Omit<Transaction, 'id'>) => {
    const newTransaction = {
      ...transaction,
      id: Date.now().toString(),
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  const addInvestment = (investment: Omit<Investment, 'id'>) => {
    const newInvestment = {
      ...investment,
      id: Date.now().toString(),
    };
    setInvestments(prev => [...prev, newInvestment]);
  };

  const addLendRecord = (lendRecord: Omit<LendRecord, 'id'>) => {
    const newLendRecord = {
      ...lendRecord,
      id: Date.now().toString(),
    };
    setLendRecords(prev => [...prev, newLendRecord]);
  };

  const updateInvestment = (id: string, updatedInvestment: Partial<Investment>) => {
    setInvestments(prev =>
      prev.map(inv => (inv.id === id ? { ...inv, ...updatedInvestment } : inv))
    );
  };

  const updateLendRecord = (id: string, updatedLendRecord: Partial<LendRecord>) => {
    setLendRecords(prev =>
      prev.map(lend => (lend.id === id ? { ...lend, ...updatedLendRecord } : lend))
    );
  };

  const addEMI = (emi: Omit<EMI, 'id'>) => {
    const newEMI = {
      ...emi,
      id: Date.now().toString(),
    };
    setEMIs(prev => [...prev, newEMI]);
  };

  const addSubscription = (subscription: Omit<Subscription, 'id'>) => {
    const newSubscription = {
      ...subscription,
      id: Date.now().toString(),
    };
    setSubscriptions(prev => [...prev, newSubscription]);
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

  const updateSubscription = (id: string, updatedSubscription: Partial<Subscription>) => {
    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, ...updatedSubscription } : sub))
    );
  };

  const deleteSubscription = (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));
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