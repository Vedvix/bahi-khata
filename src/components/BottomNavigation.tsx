// import React from 'react';
// import { Home, Plus, CreditCard, TrendingUp, User } from 'lucide-react';

// interface BottomNavigationProps {
//   activeTab: string;
//   onTabChange: (tab: string) => void;
// }

// export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
//   const tabs = [
//     { id: 'dashboard', label: 'Home', icon: Home },
//     { id: 'transactions', label: 'Add', icon: Plus },
//     { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
//     { id: 'investments', label: 'Invest', icon: TrendingUp },
//     { id: 'analytics', label: 'Analytics', icon: TrendingUp },
//     { id: 'profile', label: 'Profile', icon: User },
//   ];

//   return (
//     <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-2 py-2">
//       <div className="flex items-center justify-around">
//         {tabs.map((tab) => {
//           const Icon = tab.icon;
//           const isActive = activeTab === tab.id;
          
//           return (
//             <button
//               key={tab.id}
//               onClick={() => onTabChange(tab.id)}
//               className={`flex flex-col items-center py-2 px-3 rounded-xl transition-all duration-200 ${
//                 isActive 
//                   ? 'text-white bg-indigo-600 shadow-lg' 
//                   : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
//               }`}
//             >
//               <Icon size={20} className="mb-1" />
//               <span className="text-xs">{tab.label}</span>
//             </button>
//           );
//         })}
//       </div>
//     </div>
//   );
// }


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
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        backgroundColor: '#ffffff',
        borderTop: '1px solid #E5E7EB',
        boxShadow: '0 -2px 6px rgba(0,0,0,0.05)',
        height: 70,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          padding: '0 8px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                width: 60,
                height: 50,
                borderRadius: 10,
                backgroundColor: isActive ? '#4F46E5' : 'transparent',
                color: isActive ? '#ffffff' : '#6B7280',
                boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={18} />
              <span
                style={{
                  fontSize: 11,
                  marginTop: 2,
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BottomNavigation;
