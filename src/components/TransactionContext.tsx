import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { db } from './services/sqlite';
import { initDB } from './services/sqlite';
import { useAuth } from './AuthContext';
import {  addSubscription as addSubscriptionDB,  
          updateSubscription as updateSubscriptionDB, 
          deleteSubscription as deleteSubscriptionDB,
          getSubscriptions } from './services/subscriptions';
import { addInvestmentDB, updateInvestmentDB, getInvestmentsDB } from './services/investments';
import { addTransactionDB, getTransactionsDB } from './services/transactions';
import { addLendRecord as addLendRecordDB, updateLendRecord as updateLendRecordDB, getLendRecordsDB,
        calculateRemainingWithInterest } from './services/lendmoney';
import { addCategoryDB, getCategoriesDB, updateCategoryDB, deleteCategoryDB } from './services/categories';
import { addPrepaymentDB, getPrepaymentsDB } from './services/prepayment';
import { addEMI as addEMIDB, updateEMI as updateEMIDB } from './services/emi';
import { importAndPersist } from './services/importHelper';
import CryptoJS from 'crypto-js';


export interface Transaction {
  id: string;
  user_id: string;
  type: 'income' | 'expense' | 'investment' | 'lend' | 'subscription';
  amount: number;
  category: string;
  description: string;
  date: string;
  time: string;
}

export interface Investment {
  id: string;
  user_id: string;
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
  user_id: string;
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
  user_id?: string;
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
  user_id: string;
  name: string;
  amount: number;
  frequency: 'monthly' | 'quarterly' | 'yearly';
  nextDueDate: string;
  category: string;
  autoPayEnabled: boolean;
}

export interface Category {
  id: string;
  user_id: string;
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
  updateEMI: (id: string, emi: Partial<EMI>) => void;
  addSubscription: (subscription: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, subscription: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, category: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  exportData: () => string;
//  importData: (data: string) => boolean;
  importData: (data: string, password?: string) => boolean; 
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
    user_id: '1',
    type: 'expense',
    amount: 1200,
    category: 'Groceries',
    description: 'Weekly grocery shopping',
    date: '2024-12-25',
    time: '10:30'
  },
  {
    id: '2',
    user_id: '1',
    type: 'income',
    amount: 50000,
    category: 'Salary',
    description: 'Monthly salary',
    date: '2024-12-24',
    time: '09:00'
  },
  {
    id: '3',
    user_id: '1',
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
    user_id: '1',
    name: 'Netflix',
    amount: 649,
    frequency: 'monthly',
    nextDueDate: '2024-12-30',
    category: 'Entertainment',
    autoPayEnabled: true
  },
  {
    id: '2',
    user_id: '2',
    name: 'Electricity Bill',
    amount: 2500,
    frequency: 'monthly',
    nextDueDate: '2025-01-05',
    category: 'Utilities',
    autoPayEnabled: false
  },
  {
    id: '3',
    user_id: '3',
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
    user_id: '1',
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
    user_id: '1',
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
    user_id: '1',
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
    user_id: '1',
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
    user_id: '1',
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
const STORAGE_KEYS = (userId: string) => ({
  TRANSACTIONS: `fintrack_transactions_${userId}`,
  INVESTMENTS: `fintrack_investments_${userId}`,
  LEND_RECORDS: `fintrack_lend_records_${userId}`,
  EMIS: `fintrack_emis_${userId}`,
  SUBSCRIPTIONS: `fintrack_subscriptions_${userId}`,
  CATEGORIES: `fintrack_categories_${userId}`,
});


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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [lendRecords, setLendRecords] = useState<LendRecord[]>([]);
  const [emis, setEMIs] = useState<EMI[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    initDB().then(() => console.log('DB initialized'));
  }, []);
  // Load data from localStorage on mount

  useEffect(() => {
  if (!user?.id) return; // wait until user is available

  const keys = STORAGE_KEYS(user.id);

  const loadedTransactions = loadFromStorage(keys.TRANSACTIONS, []);
  const loadedInvestments = loadFromStorage(keys.INVESTMENTS, []);
  const loadedLendRecords = loadFromStorage(keys.LEND_RECORDS, []);
  const loadedEMIs = loadFromStorage(keys.EMIS, []);
  const loadedSubscriptions = loadFromStorage(keys.SUBSCRIPTIONS, []);
  const loadedCategories = loadFromStorage(keys.CATEGORIES, defaultCategories);

  setTransactions(loadedTransactions);
  setInvestments(loadedInvestments);
  setLendRecords(loadedLendRecords);
  setEMIs(loadedEMIs);
  setSubscriptions(loadedSubscriptions);
  setCategories(loadedCategories);
}, [user?.id]); // re-run whenever user changes



  // Save to localStorage whenever data changes
// Save transactions per user
useEffect(() => {
  if (!user?.id) return;
  const keys = STORAGE_KEYS(user.id);
  saveToStorage(keys.TRANSACTIONS, transactions);
}, [transactions, user?.id]);

// Save investments per user
useEffect(() => {
  if (!user?.id) return;
  const keys = STORAGE_KEYS(user.id);
  saveToStorage(keys.INVESTMENTS, investments);
}, [investments, user?.id]);

// Save lend records per user
useEffect(() => {
  if (!user?.id) return;
  const keys = STORAGE_KEYS(user.id);
  saveToStorage(keys.LEND_RECORDS, lendRecords);
}, [lendRecords, user?.id]);

// Save EMIs per user
useEffect(() => {
  if (!user?.id) return;
  const keys = STORAGE_KEYS(user.id);
  saveToStorage(keys.EMIS, emis);
}, [emis, user?.id]);

// Save subscriptions per user
useEffect(() => {
  if (!user?.id) return;
  const keys = STORAGE_KEYS(user.id);
  saveToStorage(keys.SUBSCRIPTIONS, subscriptions);
}, [subscriptions, user?.id]);

useEffect(() => {
  if (!user?.id) return;

  const loadCategories = async () => {
    // 1️⃣ Fetch categories from DB for this user
    let dbCategories: Category[] = await getCategoriesDB(user.id);

    // 2️⃣ Identify default categories that are missing in DB
    const missingDefaults = defaultCategories.filter(defCat =>
      !dbCategories.some(dbCat => dbCat.name === defCat.name && dbCat.user_id === user.id)
    ).map(cat => ({
      ...cat,
      user_id: user.id, // attach user
    }));

    // 3️⃣ Add missing defaults to DB
    for (const cat of missingDefaults) {
      await addCategoryDB(cat);
    }

    // 4️⃣ Merge DB categories with newly added defaults
    dbCategories = [...dbCategories, ...missingDefaults];

    // 5️⃣ Update state
    setCategories(dbCategories);

    // 6️⃣ Optional: cache in localStorage
    const keys = STORAGE_KEYS(user.id);
    saveToStorage(keys.CATEGORIES, dbCategories);
  };

  loadCategories();
}, [user?.id]);

  

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
  if (!user?.id) {
    console.error("No logged in user, cannot add transaction.");
    return;
  }

  const newTransaction: Transaction = {
    ...transaction,
    id: Date.now().toString(),
    user_id: user.id,
  };

  try {
    await addTransactionDB(newTransaction); // Save to SQLite
    setTransactions(prev => [newTransaction, ...prev]); // Update React state
    console.log("✅ Transaction added:", newTransaction);
  } catch (err) {
    console.error("❌ Failed to add transaction to DB:", err);
  }
};

const addInvestment = async (investment: Omit<Investment, 'id' | 'user_id'>) => {
  if (!user?.id) {
    console.error("No logged in user found, cannot add investment.");
    return;
  }

  const newInvestment: Investment = {
    ...investment,
    id: Date.now().toString(),
    user_id: user.id,
  };
  addTransaction({
    type: 'investment',          
    amount: investment.amount, 
    category: 'Investment',
    description: `Added investment: ${investment.name}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    user_id: user.id,          
  });

  try {
    await addInvestmentDB(newInvestment); 
    setInvestments(prev => [...prev, newInvestment]); 
    console.log("✅ Investment added:", newInvestment);
  } catch (err) {
    console.error("❌ Failed to add investment to DB:", err);
  }
};

const addLendRecord = async (
  lendRecord: Omit<LendRecord, 'status' | 'paidAmount' | 'remainingAmount'>,
  user_id: string
) => {
  const newLendRecord: LendRecord = {
    ...lendRecord,
    id: Date.now().toString(), // okay for now if your DB allows text IDs
    user_id: user?.id,
    paidAmount: 0,
    remainingAmount: calculateRemainingWithInterest({ ...lendRecord, paidAmount: 0 }, []),
    status: 'active',
  };

  setLendRecords(prev => [...prev, newLendRecord]);

  try {
    await addLendRecordDB(newLendRecord); // ✅ now properly awaited
    console.log('✅ Lend record added:', newLendRecord);
  } catch (err) {
    console.error('Failed to add lend record to DB:', err);
  }

  addTransaction({
    type: 'lend',
    amount: newLendRecord.amount,
    category: 'Lend',
    description: `Lent money to ${newLendRecord.borrowerName}`,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('en-IN', { hour12: false }),
    user_id: user?.id,
  });
};




const updateInvestment = async (id: string, updatedInvestment: Partial<Investment>) => {
  // Update React state immediately
  setInvestments(prev =>
    prev.map(inv => (inv.id === id ? { ...inv, ...updatedInvestment } : inv))
  );

  try {
    // Update in SQLite DB
    await updateInvestmentDB(Number(id), updatedInvestment);
    console.log("✅ Investment updated in DB:", id, updatedInvestment);
  } catch (err) {
    console.error("❌ Failed to update investment in DB:", id, err);
  }
};


const updateLendRecord = async (
  id: string,
  updates: Partial<LendRecord> & { prepaymentAmount?: number }
) => {
  setLendRecords(prev =>
    prev.map(lend => {
      if (lend.id !== id) return lend;

      let newPaidAmount = lend.paidAmount;
      let newRemainingAmount = lend.remainingAmount;
      let newStatus = lend.status;

      if (updates.prepaymentAmount && updates.prepaymentAmount > 0) {
        const prepayAmount = updates.prepaymentAmount;

        // 1️⃣ Update paid amount
        newPaidAmount += prepayAmount;

        // 2️⃣ Recalculate remaining amount (use lend.amount - newPaidAmount + interest)
        newRemainingAmount = calculateRemainingWithInterest({
          ...lend,
          paidAmount: newPaidAmount,
        });

        // 3️⃣ Update status
        newStatus = newRemainingAmount <= 0 ? 'fully_paid' : 'partially_paid';

        // 4️⃣ Add transaction for prepayment
        addTransaction({
          user_id: lend.user_id,
          type: 'income',
          amount: prepayAmount,
          category: 'Lend Repayment',
          description: `Prepayment from ${lend.borrowerName}`,
          date: new Date().toISOString().split('T')[0],
          time: new Date().toTimeString().slice(0, 5),
        }).catch(err => console.error('Failed to add transaction:', err));
      }

      // Prepare final update object for DB
      const { prepaymentAmount, ...dbUpdate } = updates;
      const finalUpdate = {
        ...dbUpdate,
        paidAmount: newPaidAmount,
        remainingAmount: newRemainingAmount,
        status: newStatus,
      };

      // Update in DB
      updateLendRecordDB(Number(id), finalUpdate).catch(err =>
        console.error('Failed to update DB:', err)
      );

      return { ...lend, ...finalUpdate };
    })
  );
};


const addEMI = async (emi: Omit<EMI, 'id' | 'user_id'>) => {
  if (!user?.id) return;

  const newEMI: EMI = { ...emi, id: Date.now().toString(), user_id: user.id };

  try {
    await addEMIDB(newEMI);
    setEMIs(prev => [...prev, newEMI]);
  } catch (err) {
    console.error('Failed to add EMI:', err);
  }
};

const updateEMI = async (id: string, updates: Partial<EMI>) => {
  setEMIs(prev => prev.map(e => (e.id === id ? { ...e, ...updates } : e)));

  try {
    await updateEMIDB(Number(id), updates);
  } catch (err) {
    console.error('Failed to update EMI in DB:', err);
  }
};




  const addSubscription = async (
    subscription: Omit<Subscription, 'id' | 'user_id'>
  ) => {
    if (!user?.id) {
      console.error("No logged in user found, cannot add subscription.");
      return;
    }
    console.log("Adding subscription for user:", user.id);
    const newSubscription: Subscription = {
      ...subscription,
      id: Date.now().toString(),
      user_id: user.id,
    };

    try {
      await addSubscriptionDB(newSubscription);
      console.log("✅ Subscription added to DB:", newSubscription);
      
      setSubscriptions(prev => [...prev, newSubscription]);
    } catch (err) {
      console.error('Failed to add subscription to DB:', err);
    }
  };


const addCategory = async (category: Omit<Category, 'id' | 'user_id'>) => {
  if (!user?.id) return;

  // 1️⃣ Check if category already exists for this user
  const exists = categories.some(cat => cat.name === category.name && cat.user_id === user.id);
  if (exists) {
    console.warn("Category already exists:", category.name);
    return;
  }

  // 2️⃣ Create new category object
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      user_id: user.id,
    };

    // 3️⃣ Save to DB
    try {
      await addCategoryDB(newCategory);
      setCategories(prev => [...prev, newCategory]);

      // Optional: update localStorage cache
      const keys = STORAGE_KEYS(user.id);
      saveToStorage(keys.CATEGORIES, [...categories, newCategory]);

      console.log("✅ Category added:", newCategory);
    } catch (err) {
      console.error("❌ Failed to add category:", err);
    }
  };


  const updateCategory = async (id: string, updatedCategory: Partial<Category>) => {
    setCategories(prev =>
      prev.map(cat => (cat.id === id ? { ...cat, ...updatedCategory } : cat))
    );

    try {
      await updateCategoryDB(id, updatedCategory); // ✅ update in SQLite
      console.log("✅ Category updated:", id, updatedCategory);
    } catch (err) {
      console.error("❌ Failed to update category:", err);
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories(prev => prev.filter(cat => cat.id !== id));

    try {
      await deleteCategoryDB(id); // ✅ remove from SQLite
      console.log("🗑️ Category deleted:", id);
    } catch (err) {
      console.error("❌ Failed to delete category:", err);
    }
  };


  const updateSubscription = async (id: string, updates: Partial<Subscription>) => {
    setSubscriptions(prev =>
      prev.map(sub => (sub.id === id ? { ...sub, ...updates } : sub))
    );

    try {
      await updateSubscriptionDB(Number(id), updates); // update SQLite
    } catch (err) {
      console.error('Failed to update subscription in DB:', err);
    }
  };

  const deleteSubscription = async (id: string) => {
    setSubscriptions(prev => prev.filter(sub => sub.id !== id));

    try {
      await deleteSubscriptionDB(Number(id)); // delete from SQLite
    } catch (err) {
      console.error('Failed to delete subscription from DB:', err);
    }
  };

  // const exportData = (): string => {
  //   const exportData = {
  //     transactions,
  //     investments,
  //     lendRecords,
  //     emis,
  //     subscriptions,
  //     categories,
  //     exportDate: new Date().toISOString(),
  //     version: '1.0'
  //   };
  //   return JSON.stringify(exportData, null, 2);
  // };
const exportData = (password?: string): string => {
  console.log("called export");
    const dataToExport = { 
      transactions,
      investments,
      lendRecords,
      emis,
      subscriptions,
      categories,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    const jsonString = JSON.stringify(dataToExport);

    if (password) {
      return CryptoJS.AES.encrypt(jsonString, password).toString();
    }

    return jsonString;
  };

// const importData = (dataString: string): boolean => {
//   try {
//     const data = JSON.parse(dataString);

//     // Validate the data structure
//     if (!data.version || !data.exportDate) {
//       throw new Error('Invalid backup file format');
//     }

//     // Import data
//     if (data.transactions) setTransactions(data.transactions);
//     if (data.investments) setInvestments(data.investments);
//     if (data.lendRecords) setLendRecords(data.lendRecords);
//     if (data.emis) setEMIs(data.emis);
//     if (data.subscriptions) setSubscriptions(data.subscriptions);
//     if (data.categories) setCategories(data.categories);

//     return true;
//   } catch (error) {
//     console.error('Failed to import data:', error);
//     return false;
//   }
// };

 const importData = (data: string, password?: string): boolean => {
    try {
      let jsonString = data;

      if (password) {
        const bytes = CryptoJS.AES.decrypt(data, password);
        jsonString = bytes.toString(CryptoJS.enc.Utf8);
      }

      const parsedData = JSON.parse(jsonString);

      if (parsedData.transactions) setTransactions(parsedData.transactions);
      if (parsedData.investments) setInvestments(parsedData.investments);
      if (parsedData.lendRecords) setLendRecords(parsedData.lendRecords);
      if (parsedData.emis) setEMIs(parsedData.emis);
      if (parsedData.subscriptions) setSubscriptions(parsedData.subscriptions);
      if (parsedData.categories) setCategories(parsedData.categories);

      return true;
    } catch (err) {
      console.error(err);
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
        updateEMI,
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