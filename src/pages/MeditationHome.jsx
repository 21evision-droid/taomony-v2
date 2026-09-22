// MeditationHome — Micro-task sub-module entry (design §10).
// 4 navigation cards: the 3 dimensions + Combinations. Each opens that
// item's micro-task list. Combinations shows its lock state but remains
// tappable — locked items are previewable inside (design §5.1).
// Tao Echo lives on the list screens, not here (§2.2).
// When all sub-tasks are complete, a Harvest entry appears.

import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  MEDITATION_DIMENSIONS,
  MEDITATION_SUBTASKS,
} from '../data/meditationMock';
import { allSubtasksComplete, isUnitComplete } from '../data/meditationStore';

export default function MeditationHome() {
  const navigate = useNavigate();
  const combinationsUnlocked = allSubtasksComplete(MEDITATION_SUBTASKS);
  const totalSubtasks = MEDITATION_SUBTASKS.length;
  const completedSubtasks = MEDITATION_SUBTASKS.filter((s) =>
    isUnitComplete('subtask', s.id)
  ).length;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="mb-6 text-center">
        <h1 className="font-['Playfair_Display'] text-2xl text-stone-900 mb-2">
          Meditation
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Build your practice, one Taoist micro-practice at a time.
        </p>
      </div>

      {/* Dimensions */}
      <div className="flex flex-col gap-3">
        {MEDITATION_DIMENSIONS.map((dim) => {
          const subtasks = MEDITATION_SUBTASKS.filter(
            (s) => s.dimensionId === dim.id
          );
          const done = subtasks.filter((s) =>
            isUnitComplete('subtask', s.id)
          ).length;
          return (
            <button
              key={dim.id}
              onClick={() => navigate(`/meditate/dimension/${dim.slug}`)}
              className="bg-white rounded-xl p-4 text-left border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                  {dim.title}
                </h3>
                <span className="text-stone-300 text-xs">
                  {done}/{subtasks.length}
                </span>
              </div>
              <p className="text-stone-500 text-xs leading-relaxed">
                {dim.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Combinations — tappable entry, lock state shown on the right */}
      <button
        onClick={() => navigate('/meditate/combinations')}
        className="mt-3 bg-white rounded-xl p-4 text-left border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-['Playfair_Display'] text-base text-stone-900">
            Combinations
          </h3>
          {combinationsUnlocked ? (
            <span className="text-stone-300 text-xs">Unlocked</span>
          ) : (
            <span className="flex items-center gap-1 text-stone-300 text-xs">
              <Lock size={12} />
              {completedSubtasks}/{totalSubtasks}
            </span>
          )}
        </div>
        <p className="text-stone-500 text-xs leading-relaxed">
          Cross-dimension practices — the heart of your training
        </p>
      </button>

      {/* Sub-task Harvest — unlocked with all sub-tasks complete */}
      {combinationsUnlocked && (
        <button
          onClick={() => navigate('/meditate/harvest/subtasks')}
          className="mt-3 bg-white rounded-xl p-4 text-left border border-stone-100 shadow-sm hover:shadow-md hover:border-stone-200 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-['Playfair_Display'] text-base text-stone-900">
              Harvest
            </h3>
            <span className="text-stone-300 text-xs">What actually changed?</span>
          </div>
          <p className="text-stone-500 text-xs leading-relaxed">
            Record what changed after completing all sub-tasks
          </p>
        </button>
      )}
    </div>
  );
}
