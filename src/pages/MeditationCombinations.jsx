// MeditationCombinations — combination list (design §10).
// Unlocked only when all sub-tasks are complete (single global gate).
// All videos freely previewable; practice gated by the global unlock.

import { Fragment, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, HelpCircle } from 'lucide-react';
import {
  MEDITATION_SUBTASKS,
  getActiveCombinations,
} from '../data/meditationMock';
import { allSubtasksComplete, isUnitComplete } from '../data/meditationStore';
import HelpModal from '../components/meditation/HelpModal';
import TaoEchoCard from '../components/meditation/TaoEchoCard';

export default function MeditationCombinations() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);
  const combinations = getActiveCombinations();
  const unlocked = allSubtasksComplete(MEDITATION_SUBTASKS);
  const doneCombos = combinations.filter((c) =>
    isUnitComplete('combination', c.id)
  ).length;
  const allCombosComplete = doneCombos === combinations.length;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
            &larr; Meditation
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mt-2">
            Combinations
          </h1>
          <p className="text-stone-500 text-sm mt-1">
            Cross-dimension practices — the heart of your training
          </p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          title="How practice works"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      {!unlocked && (
        <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4 text-center">
          <p className="flex items-center justify-center gap-1.5 text-stone-400 text-sm font-medium">
            <Lock size={14} />
            Complete all sub-tasks to unlock combinations
          </p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {combinations.map((c) => {
          const complete = isUnitComplete('combination', c.id);
          return (
            <Fragment key={c.id}>
              <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                    {c.title}
                  </h3>
                  {complete ? (
                    <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                      Complete
                    </span>
                  ) : (
                    <span className="text-stone-300 text-xs">
                      {c.repeatCount} reps / {c.windowDays} days
                    </span>
                  )}
                </div>
                <p className="text-stone-400 text-xs mb-1">{c.subtitle}</p>
                <p className="text-stone-500 text-xs leading-relaxed mb-3">
                  {c.description}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/meditate/combination/${c.id}`)}
                    className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                  >
                    Preview
                  </button>
                  {complete ? (
                    <span className="flex-1 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
                      Done
                    </span>
                  ) : unlocked ? (
                    <button
                      onClick={() => navigate(`/meditate/combination/${c.id}`)}
                      className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                    >
                      Start Practice
                    </button>
                  ) : (
                    <span className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-400 text-xs text-center flex items-center justify-center gap-1">
                      <Lock size={12} />
                      Locked
                    </span>
                  )}
                </div>
              </div>
              <TaoEchoCard taoEcho={c.taoEcho} />
            </Fragment>
          );
        })}
      </div>

      {/* Combination Harvest — unlocked with all combinations complete */}
      {allCombosComplete && (
        <button
          onClick={() => navigate('/meditate/harvest/combinations')}
          className="mt-3 bg-white rounded-xl p-4 text-left border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-['Playfair_Display'] text-base text-stone-900">
              Harvest
            </h3>
            <span className="text-stone-300 text-xs">What actually changed?</span>
          </div>
          <p className="text-stone-500 text-xs leading-relaxed">
            Record what changed after completing all combinations
          </p>
        </button>
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
