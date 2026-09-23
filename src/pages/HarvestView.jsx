// HarvestView — tier-level Harvest stage (design §8).
// "What actually changed?" — structured, preset options. One Harvest per
// completed tier: 'subtasks' (all sub-tasks done) or 'combinations'
// (all combinations done). Content is curated later by the content team
// (design §13); this view renders the framework (prompt + options) and
// shows a "being curated" placeholder when no options exist yet.
//
// Harvest is not a dead-end: the user continues into the Reflection space
// (mirroring Learning's reflection architecture).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Wheat } from 'lucide-react';
import { getHarvest, toggleHarvestOption } from '../data/meditationHarvestStore';

const TIERS = {
  subtasks: {
    title: 'Sub-task Practice',
    backTo: '/meditate',
    backLabel: 'Meditation',
  },
  combinations: {
    title: 'Combination Practice',
    backTo: '/meditate/combinations',
    backLabel: 'Combinations',
  },
};

export default function HarvestView() {
  const { tier } = useParams();
  const navigate = useNavigate();
  const config = TIERS[tier];

  // Harvest options are supplied later (design §13). The framework stores
  // selections keyed by tier; until options exist, none are rendered.
  const options = [];

  const [selected, setSelected] = useState(getHarvest(tier));

  if (!config) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Harvest not found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={config.backTo}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; {config.backLabel}
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Harvest
        </p>
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          What actually changed?
        </h1>
        <p className="text-stone-500 text-sm">{config.title}</p>
      </div>

      {options.length === 0 ? (
        <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm mb-6">
          <p className="flex items-center gap-1.5 text-stone-400 text-xs uppercase tracking-wider mb-3">
            <Wheat className="size-4" />
            Harvest
          </p>
          <p className="text-stone-400 text-sm leading-relaxed">
            Harvest options for this practice are being curated.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 mb-6 overflow-hidden">
          {options.map((opt) => {
            const isSelected = selected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className="flex items-start gap-3 px-4 py-3 border-b border-stone-100 last:border-b-0 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() =>
                    setSelected(toggleHarvestOption(tier, opt.id))
                  }
                  className="mt-0.5 size-4 accent-stone-900"
                />
                <span className="text-sm text-stone-700 leading-relaxed">
                  {opt.text}
                </span>
              </label>
            );
          })}
        </div>
      )}

      <button
        onClick={() => navigate(`/meditate/harvest/${tier}/reflection`)}
        className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
      >
        Continue to Reflection
      </button>
    </div>
  );
}
