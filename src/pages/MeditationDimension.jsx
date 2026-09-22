// MeditationDimension — a dimension's sub-task list in linear order (§10).
// All videos previewable; practice gated to the current advanceable unit.
// A prominent help button ("?") opens the execution-requirements modal (§5.2).

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock, HelpCircle } from 'lucide-react';
import {
  getDimensionBySlug,
  getSubtasksForDimension,
} from '../data/meditationMock';
import { isUnitComplete } from '../data/meditationStore';
import HelpModal from '../components/meditation/HelpModal';
import TaoEchoCard from '../components/meditation/TaoEchoCard';

export default function MeditationDimension() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  const dimension = getDimensionBySlug(slug);

  if (!dimension) {
    return (
      <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
        <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
          &larr; Meditation
        </Link>
        <p className="text-stone-400 text-sm mt-4">Dimension not found.</p>
      </div>
    );
  }

  const subtasks = getSubtasksForDimension(dimension.id);
  const nextSubtask =
    subtasks.find((s) => !isUnitComplete('subtask', s.id)) || null;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link to="/meditate" className="text-stone-400 text-xs hover:text-stone-600 transition-colors">
            &larr; Meditation
          </Link>
          <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mt-2">
            {dimension.title}
          </h1>
          <p className="text-stone-500 text-sm mt-1">{dimension.description}</p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white border border-stone-200 text-stone-500 hover:text-stone-900 transition-colors"
          title="How practice works"
        >
          <HelpCircle size={18} />
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {subtasks.map((s, i) => {
          const complete = isUnitComplete('subtask', s.id);
          const isCurrent = nextSubtask?.id === s.id;
          return (
            <div
              key={s.id}
              className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <h3 className="font-['Playfair_Display'] text-base text-stone-900">
                  {i + 1}. {s.title}
                </h3>
                {complete ? (
                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full text-xs">
                    Complete
                  </span>
                ) : (
                  <span className="text-stone-300 text-xs">
                    {s.repeatCount} reps / {s.windowDays} days
                  </span>
                )}
              </div>
              <p className="text-stone-500 text-xs leading-relaxed mb-3">
                {s.description}
              </p>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/meditate/subtask/${s.id}`)}
                  className="flex-1 py-2.5 rounded-lg border border-stone-200 text-stone-600 text-sm font-medium hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Preview
                </button>
                {complete ? (
                  <span className="flex-1 py-2.5 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-medium text-center">
                    Done
                  </span>
                ) : isCurrent ? (
                  <button
                    onClick={() => navigate(`/meditate/subtask/${s.id}`)}
                    className="flex-1 py-2.5 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
                  >
                    Start Practice
                  </button>
                ) : (
                  <span className="flex-1 py-2.5 rounded-lg bg-stone-100 text-stone-400 text-xs text-center flex items-center justify-center gap-1">
                    <Lock size={12} />
                    Complete the previous micro-task to unlock
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tao Echo — platform content below this dimension's sub-task list */}
      <div className="mt-3">
        <TaoEchoCard taoEcho={dimension.taoEcho} />
      </div>

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}
    </div>
  );
}
