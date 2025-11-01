
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
import { EMISubscriptions } from './components/EMISubscriptions';
import { GoogleOAuthProvider } from '@react-oauth/google';


function MainAppShell() {
  const [activeTab, setActiveTab] = useState<'dashboard'|'transactions'|'subscriptions'|'subscriptions'|'investments'|'analytics'|'profile'>('dashboard');
  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionEntry />;
      case 'subscriptions' :return <EMISubscriptions />;
      //case 'subscriptions': return <Subscriptions />;
      case 'investments': return <InvestmentLending />;
      case 'analytics': return <Analytics />;
      case 'profile': return <UserProfile />;
      default: return <Dashboard />;
    }
  };

  return (
    <TransactionProvider>
      <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-200">
        {/* <div className="flex-1 overflow-y-auto pb-20">{renderContent()}</div> */}
        <div
  style={{
    flex: 1,
    overflowY: 'auto',
    paddingBottom: 'calc(90px + env(safe-area-inset-bottom, 0px))',
  }}
>
  {renderContent()}
</div>


        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        <Toaster />
      </div>
    </TransactionProvider>
  );
}

export default function App() {
  const GOOGLE_CLIENT_ID ='213331984531-7mt2o3qn2pc2m3o2e91b6t4dorkhiicj.apps.googleusercontent.com';
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function AuthGate() {
  const auth = useAuth();
  console.log('[AuthGate] auth =', auth);

  if (!auth || !auth.user) return <AuthPage />;

  return <MainAppShell />;
}
