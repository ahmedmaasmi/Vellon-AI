'use client';

import { useState } from 'react';

const TABS = [
  { id: 'all', label: 'ALL' },
  { id: 'school', label: 'SCHOOL' },
  { id: 'work', label: 'WORK' },
  { id: 'personal', label: 'PERSONAL' },
  { id: 'ideas', label: 'IDEAS' },
];

export function QuickAccessTabs() {
  const [activeTab, setActiveTab] = useState('all');

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 flex flex-col z-50">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              relative
              w-10 py-6 
              flex items-center justify-center
              rounded-l-xl
              border border-r-0 border-border
              shadow-sm
              transition-all duration-200
              ${isActive 
                ? 'bg-[#293d4a] text-white -translate-x-1 w-12 z-10' 
                : 'bg-[#e4ddd4] text-[#5a6a75] hover:bg-[#d4cdc4]'}
            `}
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
              marginTop: '-1px' // Prevent double borders
            }}
          >
            <span className="font-bold tracking-widest text-xs rotate-180">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
