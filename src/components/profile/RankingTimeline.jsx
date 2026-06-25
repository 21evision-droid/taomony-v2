import { useState, useEffect } from 'react';
import { getSubmissions } from '../../data/submissionStore';

function groupByMonth(subs) {
  const groups = {};
  for (const s of subs) {
    const d = new Date(s.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (!groups[key]) groups[key] = { key, label: '', submissions: [], totalScore: 0, count: 0 };
    groups[key].submissions.push(s);
    groups[key].totalScore += s.score;
    groups[key].count += 1;
  }
  // Sort descending by key (newest first)
  const sorted = Object.values(groups).sort((a, b) => b.key.localeCompare(a.key));
  // Generate readable labels
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  for (const g of sorted) {
    const [y, m] = g.key.split('-');
    g.label = `${monthNames[parseInt(m) - 1]} ${y}`;
  }
  return sorted;
}

export default function RankingTimeline() {
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    getSubmissions().then(setSubmissions);
  }, []);

  const monthGroups = groupByMonth(submissions);

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-stone-200" />
        <span className="text-xs font-medium tracking-widest text-stone-400">MY SUBMISSIONS</span>
        <div className="h-px flex-1 bg-stone-200" />
      </div>

      {monthGroups.length === 0 ? (
        <div className="py-8 text-center text-sm text-[#5a4a3a] opacity-50">
          <div className="mb-2 text-3xl opacity-30">📝</div>
          <p>No submissions yet. Start your challenge today!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {monthGroups.map((group) => (
            <div key={group.key} className="rounded-xl border border-[#e0d5c0] p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-[#2c2416]">{group.label}</h4>
                <span className="text-xs font-medium text-[#d97706]">{group.count} days · {group.totalScore.toLocaleString()} pts</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {group.submissions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-[#5a4a3a]">
                    <span className="opacity-70">{s.date}</span>
                    <span className="font-semibold text-[#d97706]">{s.score.toFixed(1)} pts</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
