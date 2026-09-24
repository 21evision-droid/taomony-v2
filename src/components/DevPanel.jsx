// DevPanel — floating test-fixture panel, rendered ONLY in dev builds
// (mounted behind `import.meta.env.DEV` in Layout.jsx). Gives a human or AI
// tester one-click control over the Meditation module's time gates and the
// silent-video timer stand-in.
//
// Never rendered in production: the `import.meta.env.DEV &&` mount in Layout
// is compiled to `false` at build time.

import { useState } from 'react';
import { Wrench, X } from 'lucide-react';
import { MEDITATION_SUBTASKS, MEDITATION_COMBINATIONS } from '../data/meditationMock';
import { isUnitComplete } from '../data/meditationStore';
import {
  unlockMeditationAll,
  unlockMeditationSubtasks,
  resetMeditation,
  isFastForward,
  setFastForward,
} from '../data/devFixtures';

function readStatus() {
  const subs = MEDITATION_SUBTASKS.filter((s) =>
    isUnitComplete('subtask', s.id)
  ).length;
  const combos = MEDITATION_COMBINATIONS.filter((c) =>
    isUnitComplete('combination', c.id)
  ).length;
  return { subs, combos };
}

export default function DevPanel() {
  const [open, setOpen] = useState(false);
  const [ff, setFf] = useState(isFastForward());
  const [status, setStatus] = useState(readStatus());

  const refresh = () => setStatus(readStatus());

  const act = (fn) => () => {
    fn();
    refresh();
  };

  const toggleFf = () => {
    const next = !ff;
    setFf(next);
    setFastForward(next);
  };

  return (
    <>
      {open && (
        <div className="fixed bottom-36 right-3 z-[60] w-64 rounded-xl bg-[#2c2416] p-4 text-[#faf6ef] shadow-2xl border border-white/10">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Dev Test Fixtures</span>
            <button
              onClick={() => setOpen(false)}
              className="flex size-6 cursor-pointer items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/30"
              aria-label="Close"
            >
              <X size={13} />
            </button>
          </div>

          <button
            onClick={toggleFf}
            className={`mb-2 w-full rounded-lg px-3 py-2 text-left text-xs font-medium transition-colors ${
              ff
                ? 'bg-emerald-500/20 text-emerald-200'
                : 'bg-white/10 text-[#cbbf9e]'
            }`}
          >
            Fast-forward video: {ff ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={act(unlockMeditationAll)}
            className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-left text-xs text-[#faf6ef] transition-colors hover:bg-white/20"
          >
            Unlock all micro-tasks
          </button>
          <button
            onClick={act(unlockMeditationSubtasks)}
            className="mb-2 w-full rounded-lg bg-white/10 px-3 py-2 text-left text-xs text-[#faf6ef] transition-colors hover:bg-white/20"
          >
            Unlock sub-tasks only
          </button>
          <button
            onClick={act(resetMeditation)}
            className="w-full rounded-lg bg-red-500/15 px-3 py-2 text-left text-xs text-red-200 transition-colors hover:bg-red-500/25"
          >
            Reset (re-lock all)
          </button>

          <p className="mt-3 text-xs text-[#cbbf9e]">
            Sub-tasks {status.subs}/{MEDITATION_SUBTASKS.length} · Combinations{' '}
            {status.combos}/{MEDITATION_COMBINATIONS.length}
          </p>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-20 right-3 z-[60] flex size-10 cursor-pointer items-center justify-center rounded-full bg-[#2c2416] text-[#faf6ef] shadow-xl border border-white/15 transition-colors hover:bg-[#3d3220]"
        aria-label="Dev test fixtures"
        title="Dev test fixtures"
      >
        <Wrench size={16} />
      </button>
    </>
  );
}
