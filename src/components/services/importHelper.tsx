import {
  addTransactionDB,
  getTransactionsDB,
} from './transactions';
import {
  addInvestmentDB,
  getInvestmentsDB,
} from './investments';
import {
  addCategoryDB,
  getCategoriesDB,
} from './categories';
import { addSubscription, getSubscriptions } from './subscriptions';

export const importAndPersist = async (parsedData: any, userId: string) => {
  const result: {
    transactions?: any[];
    investments?: any[];
    categories?: any[];
    subscriptions?: any[];
    lendRecords?: any[];
    emis?: any[];
  } = {};

  // ------------------ Transactions ------------------
  if (Array.isArray(parsedData.transactions)) {
    const insertedTxIds = await Promise.all(
      parsedData.transactions.map((tx: any) =>
        addTransactionDB({ ...tx, user_id: userId })
      )
    );
    const allTxs = await getTransactionsDB(userId);
    result.transactions = allTxs.filter(tx => insertedTxIds.includes(tx.id));
  }

  // ------------------ Investments ------------------
  if (Array.isArray(parsedData.investments)) {
    const insertedInvIds = await Promise.all(
      parsedData.investments.map((inv: any) =>
        addInvestmentDB({ ...inv, user_id: userId })
      )
    );
    const allInvs = await getInvestmentsDB(userId);
    result.investments = allInvs.filter(inv => insertedInvIds.includes(inv.id));
  }

  // ------------------ Categories ------------------
  if (Array.isArray(parsedData.categories)) {
    const insertedCatIds = await Promise.all(
      parsedData.categories.map((cat: any) =>
        addCategoryDB({ ...cat, user_id: userId })
      )
    );
    const allCats = await getCategoriesDB(userId);
    result.categories = allCats.filter(cat => insertedCatIds.includes(cat.id));
  }

  // ------------------ Subscriptions ------------------
  if (Array.isArray(parsedData.subscriptions)) {
    const insertedSubIds = await Promise.all(
      parsedData.subscriptions.map((sub: any) =>
        addSubscription({ ...sub, user_id: userId })
      )
    );
    const allSubs = await getSubscriptions(userId);
    result.subscriptions = allSubs.filter(sub => insertedSubIds.includes(sub.id));
  }

  // ------------------ Lend Records & EMIs ------------------
  if (Array.isArray(parsedData.lendRecords)) {
    result.lendRecords = parsedData.lendRecords.map((lr: any) => ({
      ...lr,
      user_id: userId,
    }));
  }

  if (Array.isArray(parsedData.emis)) {
    result.emis = parsedData.emis.map((emi: any) => ({
      ...emi,
      user_id: userId,
    }));
  }

  return result;
};


// const importData = async (dataString: string): Promise<boolean> => {
//   if (!user?.id) {
//     console.error('importData: no logged in user');
//     return false;
//   }

//   try {
//     const parsed = JSON.parse(dataString);

//     if (!parsed || !parsed.version || !parsed.exportDate) {
//       console.warn('importData: invalid backup format');
//       return false;
//     }

//     const result = await importAndPersist(parsed, user.id);
    
//     try {
//       const canonicalTransactions = typeof getTransactionsDB === 'function'
//         ? await Promise.resolve(getTransactionsDB(user.id))
//         : result.transactions;
//       const canonicalInvestments = typeof getInvestmentsDB === 'function'
//         ? await Promise.resolve(getInvestmentsDB(user.id))
//         : result.investments;
//       const canonicalCategories = typeof getCategoriesDB === 'function'
//         ? await Promise.resolve(getCategoriesDB(user.id))
//         : result.categories;
//       const canonicalSubscriptions = typeof getSubscriptions === 'function'
//         ? await Promise.resolve(getSubscriptions(user.id))
//         : result.subscriptions;

//       if (canonicalTransactions) setTransactions(canonicalTransactions as any[]);
//       if (canonicalInvestments) setInvestments(canonicalInvestments as any[]);
//       if (canonicalCategories) setCategories(canonicalCategories as any[]);
//       if (canonicalSubscriptions) setSubscriptions(canonicalSubscriptions as any[]);
//       if (result.lendRecords) setLendRecords(result.lendRecords);
//       if (result.emis) setEMIs(result.emis);

//       toast?.success?.('Data imported successfully');
//     } catch (e) {
//       if (result.transactions) setTransactions(result.transactions);
//       if (result.investments) setInvestments(result.investments);
//       if (result.categories) setCategories(result.categories);
//       if (result.subscriptions) setSubscriptions(result.subscriptions);
//       if (result.lendRecords) setLendRecords(result.lendRecords);
//       if (result.emis) setEMIs(result.emis);
//       console.warn('importData: failed to fetch canonical DB lists, used import results', e);
//     }

//     return true;
//   } catch (err) {
//     console.error('importData: failed to import', err);
//     return false;
//   }
// };

// const handleExportData = () => {
//   const password = prompt('Enter a password to encrypt your backup:');
//   if (!password) {
//     toast.error('Password is required for encryption');
//     return;
//   }

//   try {
//     const dataToExport = exportData(); // no arguments
//     const encryptedData = CryptoJS.AES.encrypt(dataToExport, password).toString();

//     const blob = new Blob([encryptedData], { type: 'application/json' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `fintrack-backup-${new Date().toISOString().split('T')[0]}.json`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);

//     toast.success('Data exported and encrypted successfully');
//   } catch (error) {
//     console.error('Export error:', error);
//     toast.error('Failed to export data');
//   }
// };