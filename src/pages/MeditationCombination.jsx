// MeditationCombination — cross-dimension practice unit (design §10).
// Unlocked only when all sub-tasks are complete (single global gate).
// On cycle completion the user proceeds to the Tao Echo reflection flow (§8).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  getCombinationById,
  getActiveCombinations,
  MEDITATION_SUBTASKS,
} from '../data/meditationMock';
import {
  beginAttempt,
  recordRepetition,
  getActiveAttempt,
  isUnitComplete,
  allSubtasksComplete,
} from '../data/meditationStore';
import MeditationVideoPlayer from '../components/meditation/MeditationVideoPlayer';

export default function MeditationCombination() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playerMode, setPlayerMode] = useState(null);

  const combination = getCombinationById(id);

  if (!combination) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Combination not found.</p>
      </div>
    );
  }

  const unlocked = allSubtasksComplete(MEDITATION_SUBTASKS);
  const complete = isUnitComplete('combination', combination.id);
  const activeAttempt = getActiveAttempt('combination', combination.id);
  const completedReps = complete
    ? combination.repeatCount
    : activeAttempt?.completedReps || 0;

  const combinations = getActiveCombinations();
  const doneCombos = combinations.filter((c) =>
    isUnitComplete('combination', c.id)
  ).length;
  const totalCombos = combinations.length;
  const allCombosComplete = doneCombos === totalCombos;

  const handleStartPractice = () => {
    if (!complete && !activeAttempt) {
      beginAttempt(
        'combination',
        combination.id,
        combination.repeatCount,
        combination.windowDays
      );
    }
    setPlayerMode('practice');
  };

  // Free practice after completion: no counting, no record change.
  const handleReplay = () => setPlayerMode('free');

  const handleComplete = () => {
    if (!complete) {
      recordRepetition('combination', combination.id);
    }
    setPlayerMode(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to="/meditate/combinations"
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; Combinations
      </Link>

      <div className="mt-4 mb-5">
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {combination.title}
        </h1>
        <p className="text-stone-400 text-xs mb-1">{combination.subtitle}</p>
        <p className="text-stone-500 text-sm leading-relaxed">
          {combination.description}
        </p>
        <p className="text-stone-400 text-xs mt-3">
          {combination.repeatCount} repetitions within {combination.windowDays} days
        </p>
      </div>

      <button
        onClick={() => setPlayerMode('preview')}
        className="relative w-full pb-[56.25%] bg-stone-900 rounded-xl overflow-hidden cursor-pointer mb-4"
      >
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex items-center gap-2 text-white/80 text-sm">
            <span className="flex size-12 items-center justify-center rounded-full bg-white/20">
              ▶
            </span>
            Preview
          </span>
        </span>
      </button>

      <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Progress
        </p>
        <p className="text-stone-900 text-sm font-medium">
          {completedReps} / {combination.repeatCount} repetitions
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all"
            style={{
              width: `${Math.min(100, (completedReps / combination.repeatCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {complete ? (
        <div className="flex flex-col gap-2">
          <span className="py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
            Practice complete
          </span>
          <p className="text-stone-400 text-xs text-center leading-relaxed">
            Complete all combinations to unlock Inner Alchemy ({doneCombos}/
            {totalCombos})
          </p>
          <button
            onClick={handleReplay}
            className="py-3 rounded-xl border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Practice again
          </button>
          <button
            onClick={() =>
              navigate(
                allCombosComplete
                  ? '/meditate/harvest/combinations'
                  : '/meditate/combinations'
              )
            }
            className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {allCombosComplete
              ? 'Continue to Harvest'
              : 'Back to Combinations'}
          </button>
        </div>
      ) : unlocked ? (
        <button
          onClick={handleStartPractice}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Start Practice
        </button>
      ) : (
        <span className="py-3.5 rounded-xl bg-stone-100 text-stone-400 text-sm text-center flex items-center justify-center gap-1.5">
          <Lock size={14} />
          Complete all sub-tasks to unlock
        </span>
      )}

      {playerMode && (
        <MeditationVideoPlayer
          title={combination.title}
          videoUrl={combination.videoUrl}
          durationSeconds={combination.durationSeconds}
          mode={playerMode}
          repDisplay={`${Math.min(completedReps + 1, combination.repeatCount)}/${combination.repeatCount}`}
          onComplete={handleComplete}
          onClose={() => setPlayerMode(null)}
        />
      )}
    </div>
  );
}
