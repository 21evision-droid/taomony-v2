export default function HabitItem({ habit, onToggle, onRequestExpand, isExpanded }) {
  const handleClick = () => {
    if (habit.id === 5 && !habit.completed) {
      onRequestExpand(habit.id);
    } else {
      onToggle(habit.id);
    }
  };

  return (
    <div>
      <div
        className={
          'bg-white rounded-2xl p-4 mb-0 flex items-center justify-between transition-all duration-200 ' +
          (isExpanded ? 'border border-[#d97706] shadow-[0_2px_12px_rgba(217,119,6,0.12)]' : 'shadow-sm')
        }
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0 text-lg">
            {habit.icon}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-stone-800 text-sm truncate">
              {habit.name}
              {habit.id === 5 && (
                <span className="text-[11px] text-[#d97706] ml-2 font-semibold">★ Main</span>
              )}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-stone-400">{habit.time}</span>
              <span className="text-amber-600 font-semibold text-xs whitespace-nowrap">
                {habit.points} pts
              </span>
            </div>
          </div>
        </div>

        <div
          onClick={handleClick}
          className={
            'shrink-0 ml-3 w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all duration-200 ' +
            (habit.completed
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-stone-300 text-transparent hover:border-amber-400')
          }
        >
          {habit.completed ? '✓' : ''}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 flex gap-2.5 justify-end border-t border-[#f0e8d8] -mt-2 pt-3">
          <button
            className="px-5 py-2 rounded-full border-none text-[13px] font-semibold cursor-pointer transition-all bg-[#e7e2d8] text-[#5a4a3a] hover:bg-[#d6d0c4]"
            onClick={() => onToggle(habit.id)}
          >
            Skip
          </button>
          <button
            className="px-5 py-2 rounded-full border-none text-[13px] font-semibold cursor-pointer transition-all bg-[#d97706] text-white hover:bg-[#b45309]"
            onClick={() => onRequestExpand('recipe')}
          >
            View Recipe →
          </button>
        </div>
      )}
    </div>
  );
}
