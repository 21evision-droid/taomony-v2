import { useState, useEffect } from 'react';
import { getSubmissions, getTotalScore } from '../../data/submissionStore';

function calcStreak(submissions) {
  if (submissions.length === 0) return 0;
  const dates = [...new Set(submissions.map((s) => s.date))].sort().reverse();
  let streak = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diffDays = (prev - curr) / (1000 * 60 * 60 * 24);
    if (diffDays === 1) streak++;
    else break;
  }
  return streak;
}

export default function ProfileStats() {
  const [submissions, setSubmissions] = useState([]);
  const [totalScore, setTotalScore] = useState(0);

  useEffect(() => {
    getSubmissions().then(setSubmissions);
    getTotalScore().then(setTotalScore);
  }, []);

  const daysLogged = submissions.length;
  const streak = calcStreak(submissions);
  const hasRealData = submissions.length > 0;

  const cards = [
    { emoji: '🏆', label: 'Total Score', value: hasRealData ? totalScore.toLocaleString() : '—' },
    { emoji: '📊', label: 'Days Logged', value: hasRealData ? `${daysLogged}` : '—' },
    { emoji: '🔥', label: 'Streak', value: hasRealData ? `${streak}d` : '—' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium tracking-widest text-stone-400">CHALLENGE STATS</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      <div className="flex gap-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="flex-1 rounded-xl border border-[#e0d5c0] px-2 py-3 text-center"
          >
            <div className="text-2xl mb-1">{card.emoji}</div>
            <div className="text-lg font-bold text-[#d97706]">{card.value}</div>
            <div className="text-xs text-[#5a4a3a] opacity-60 mt-0.5">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
