// MeditationSubtask — single-dimension practice unit (§10).
// Preview is always available; practice is gated to the current unit.
// Full playback in practice mode = 1 repetition. On completion, "Continue"
// advances manually (design §7).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import {
  getSubtaskById,
  getDimensionBySlug,
  getSubtasksForDimension,
} from '../data/meditationMock';
import {
  beginAttempt,
  recordRepetition,
  getActiveAttempt,
  isUnitComplete,
} from '../data/meditationStore';
import MeditationVideoPlayer from '../components/meditation/MeditationVideoPlayer';

export default function MeditationSubtask() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playerMode, setPlayerMode] = useState(null); // null | 'preview' | 'practice'

  const subtask = getSubtaskById(id);

  if (!subtask) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Sub-task not found.</p>
      </div>
    );
  }

  const dimension = getDimensionBySlug(subtask.dimensionId);
  const subtasksInDim = getSubtasksForDimension(subtask.dimensionId);
  const complete = isUnitComplete('subtask', subtask.id);

  // Gating: this unit is advanceable only if every earlier unit in the
  // dimension is complete.
  const myIndex = subtasksInDim.findIndex((s) => s.id === subtask.id);
  const previousIncomplete = subtasksInDim
    .slice(0, myIndex)
    .some((s) => !isUnitComplete('subtask', s.id));
  const isCurrent = !complete && !previousIncomplete;

  const activeAttempt = getActiveAttempt('subtask', subtask.id);
  const completedReps = activeAttempt?.completedReps || 0;

  const nextInDim = subtasksInDim[myIndex + 1];

  const handleStartPractice = () => {
    if (!activeAttempt) {
      beginAttempt('subtask', subtask.id, subtask.repeatCount, subtask.windowDays);
    }
    setPlayerMode('practice');
  };

  const handleComplete = () => {
    recordRepetition('subtask', subtask.id);
    setPlayerMode(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/dimension/${subtask.dimensionId}`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; {dimension?.title || 'Dimension'}
      </Link>

      <div className="mt-4 mb-5">
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {subtask.title}
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">{subtask.description}</p>
        <p className="text-stone-400 text-xs mt-3">
          {subtask.repeatCount} repetitions within {subtask.windowDays} days
        </p>
      </div>

      {/* Video area — tap for preview */}
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

      {/* Rep progress */}
      <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-4">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Progress
        </p>
        <p className="text-stone-900 text-sm font-medium">
          {completedReps} / {subtask.repeatCount} repetitions
        </p>
        <div className="mt-2 h-1.5 rounded-full bg-stone-100 overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all"
            style={{
              width: `${Math.min(100, (completedReps / subtask.repeatCount) * 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Action */}
      {complete ? (
        <div className="flex flex-col gap-2">
          <span className="py-3 rounded-xl bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
            Practice complete
          </span>
          <button
            onClick={() =>
              navigate(
                nextInDim ? `/meditate/subtask/${nextInDim.id}` : '/meditate'
              )
            }
            className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            {nextInDim ? `Continue to ${nextInDim.title}` : 'Continue'}
          </button>
        </div>
      ) : isCurrent ? (
        <button
          onClick={handleStartPractice}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Start Practice
        </button>
      ) : (
        <span className="py-3.5 rounded-xl bg-stone-100 text-stone-400 text-sm text-center flex items-center justify-center gap-1.5">
          <Lock size={14} />
          Complete the previous micro-task to unlock
        </span>
      )}

      {playerMode && (
        <MeditationVideoPlayer
          title={subtask.title}
          videoUrl={subtask.videoUrl}
          durationSeconds={subtask.durationSeconds}
          mode={playerMode}
          repDisplay={`${Math.min(completedReps + 1, subtask.repeatCount)}/${subtask.repeatCount}`}
          onComplete={handleComplete}
          onClose={() => setPlayerMode(null)}
        />
      )}
    </div>
  );
}
