import { useState } from 'react';

const TABS = [
  { id: 'tracker', label: 'Tracker' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'announcements', label: 'Announcements' },
];

export default function ChallengeTabs({ activeTab, onChange }) {
  return (
    <div className="flex gap-2 bg-stone-100 rounded-full p-1">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex-1 rounded-full py-2 px-6 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === tab.id
              ? 'bg-white text-amber-600 shadow-sm'
              : 'bg-stone-100 text-stone-500 hover:text-stone-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
