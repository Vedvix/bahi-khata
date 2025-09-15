import React from 'react';
import { Home, Plus, CreditCard, TrendingUp, User } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'transactions', label: 'Add', icon: Plus },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'investments', label: 'Invest', icon: TrendingUp },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-2 py-2">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
                isActive 
                  ? 'text-white bg-indigo-600 shadow-lg' 
                  : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}