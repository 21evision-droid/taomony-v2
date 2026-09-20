// HelpModal — execution requirements for first-time users (design §5.2).
// Seven rules in simple language. Opened from the "?" button on the dimension
// sub-task list and the combination list screens.

import { X } from 'lucide-react';

const RULES = [
  {
    title: 'Preview vs Practice',
    text: 'Tapping a video only watches it (no counting). "Start Practice" is the real exercise.',
  },
  {
    title: 'Completion',
    text: 'A practice video counts 1 repetition only when it plays to the end.',
  },
  {
    title: 'Cycle',
    text: 'Each task requires a set number of repetitions within a set number of days.',
  },
  {
    title: 'Early finish',
    text: 'Completing all repetitions ends the task early.',
  },
  {
    title: 'Timeout',
    text: 'If the window passes unfinished, the task is gently marked. Simply start again — the old record is kept.',
  },
  {
    title: 'Order',
    text: 'Tasks are completed one by one. The next unlocks only after the current one is done.',
  },
  {
    title: 'No rewards',
    text: 'Practice is self-discipline training. There are no points or streaks.',
  },
];

export default function HelpModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] max-h-[80vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
          <h3 className="font-['Playfair_Display'] text-lg text-stone-900">
            How practice works
          </h3>
          <button
            onClick={onClose}
            className="flex size-8 cursor-pointer items-center justify-center rounded-full text-stone-400 hover:bg-stone-100 transition-colors border-none"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 flex flex-col gap-4">
          {RULES.map((rule) => (
            <div key={rule.title}>
              <p className="text-stone-900 text-sm font-semibold mb-0.5">
                {rule.title}
              </p>
              <p className="text-stone-500 text-sm leading-relaxed">{rule.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
