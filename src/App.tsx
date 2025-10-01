
import React ,{useState} from 'react';
import { TransactionProvider } from './components/TransactionContext';
import { Toaster } from './components/ui/sonner';
import { AuthProvider, useAuth } from './components/AuthContext'; 
import  AuthPage  from './components/AuthPage';
import { Dashboard } from './components/Dashboard';
import { TransactionEntry } from './components/TransactionEntry';
import { Categories } from './components/Categories';
import { Subscriptions } from './components/Subscriptions';
import { InvestmentLending } from './components/InvestmentLending';
import { Analytics } from './components/Analytics';
import { UserProfile } from './components/UserProfile';
import { BottomNavigation } from './components/BottomNavigation';



function MainAppShell() {
  const [activeTab, setActiveTab] = useState<'dashboard'|'transactions'|'subscriptions'|'investments'|'profile'>('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionEntry />;
      case 'subscriptions': return <Subscriptions />;
      case 'investments': return <InvestmentLending />;
      case 'profile': return <UserProfile />;
      default: return <Dashboard />;
    }
  };

  return (
    <TransactionProvider>
      <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-200">
        <div className="flex-1 overflow-y-auto pb-20">{renderContent()}</div>
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <Toaster />
      </div>
    </TransactionProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}

function AuthGate() {
  const auth = useAuth();
  console.log('[AuthGate] auth =', auth);

  if (!auth || !auth.user) return <AuthPage />;

  return <MainAppShell />;
}
