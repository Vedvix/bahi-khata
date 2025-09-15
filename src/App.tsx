import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { TransactionEntry } from './components/TransactionEntry';
import { Categories } from './components/Categories';
import { Subscriptions } from './components/Subscriptions';
import { InvestmentLending } from './components/InvestmentLending';
import { Analytics } from './components/Analytics';
import { UserProfile } from './components/UserProfile';
import { BottomNavigation } from './components/BottomNavigation';
import { TransactionProvider } from './components/TransactionContext';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <TransactionEntry />;
      case 'subscriptions':
        return <Subscriptions />;
      case 'investments':
        return <InvestmentLending />;
      case 'profile':
        return <UserProfile />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <TransactionProvider>
      <div className="h-screen bg-gray-50 flex flex-col max-w-md mx-auto border-x border-gray-200">
        {/* Main Content */}
        <div className="flex-1 overflow-y-auto pb-20">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
        
        {/* Toast Notifications */}
        <Toaster />
      </div>
    </TransactionProvider>
  );
}