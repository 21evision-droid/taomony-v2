import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function getWeekDates(offset) {
  const today = new Date();
  const ref = new Date(today);
  ref.setDate(ref.getDate() + offset * 7);

  const day = ref.getDay();
  const monDiff = ref.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(ref);
  monday.setDate(monDiff);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      name: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
      date: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

export default function DateNavigator() {
  const [weekOffset, setWeekOffset] = useState(0);
  const days = useMemo(() => getWeekDates(weekOffset), [weekOffset]);

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => setWeekOffset((o) => o - 1)}
        className="p-1 cursor-pointer shrink-0"
      >
        <ChevronLeft size={18} className="text-stone-400" />
      </button>

      {days.map((d) => (
        <div key={`${d.name}-${d.date}`} className="flex flex-col items-center gap-1 flex-1">
          <span className="text-[11px] text-stone-400 font-medium">{d.name}</span>
          <div
            className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium ${
              d.isToday
                ? 'bg-emerald-600 text-white'
                : 'text-stone-700'
            }`}
          >
            {d.date}
          </div>
        </div>
      ))}

      <button
        onClick={() => setWeekOffset((o) => o + 1)}
        className="p-1 cursor-pointer shrink-0"
      >
        <ChevronRight size={18} className="text-stone-400" />
      </button>
    </div>
  );
}
