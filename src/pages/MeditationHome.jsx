// MeditationHome — Micro-task sub-module entry (design §10).
// 3 dimension cards + Combinations entry with lock state.
// This is NOT the meditation module home (the top-level screen listing the
// three sub-modules is deferred — design §1).

import { Link, useNavigate } from 'react-router-dom';
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

      {/* Combinations entry */}
      <div className="mt-6">
        {combinationsUnlocked ? (
          <Link
            to="/meditate/combinations"
            className="block bg-stone-900 text-white rounded-xl p-4 text-center hover:bg-stone-800 transition-colors"
          >
            <p className="font-medium text-sm">Combinations</p>
            <p className="text-stone-300 text-xs mt-1">
              Cross-dimension practices — the heart of your training
            </p>
          </Link>
        ) : (
          <div className="bg-white rounded-xl p-4 text-center border border-stone-100">
            <p className="flex items-center justify-center gap-1.5 text-stone-400 text-sm font-medium">
              <Lock size={14} />
              Combinations
            </p>
            <p className="text-stone-400 text-xs mt-1">
              Complete all sub-tasks to unlock ({completedSubtasks}/{totalSubtasks})
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
