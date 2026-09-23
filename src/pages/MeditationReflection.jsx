// MeditationReflection — closing reflection stage, mirroring Learning's
// JourneyReflection (design §8). After a tier-level Harvest, the user writes
// a personal reflection, then closes the flow — not "completes" it.
//
// Key rules (same as Learning):
//   - No "Complete"/"Failed" language, no evaluation, no scoring
//   - Reflection auto-publishes to Resonance on close unless sharing is
//     unchecked (reuses the shared reflectionStore with source: 'meditate')

import { useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { saveReflection } from '../data/reflectionStore';
import ReflectionSpace from '../components/learning/ReflectionSpace';

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

function MeditationReflection() {
  const { tier } = useParams();
  const config = TIERS[tier];

  const [reflectionText, setReflectionText] = useState('');
  const [closed, setClosed] = useState(false);
  const [shareToResonance, setShareToResonance] = useState(true);

  const handleClose = useCallback(() => {
    // Auto-publish to Resonance on close, unless the user unchecked sharing.
    const content = reflectionText.trim();
    if (shareToResonance && content) {
      saveReflection({ source: 'meditate', sourceDetail: config?.title, content });
    }
    setClosed(true);
  }, [reflectionText, shareToResonance, config]);

  // ── Not found ─────────────────────────────────────────────
  if (!config) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f5efe6] px-5">
        <p className="text-stone-400 text-sm">Reflection not found.</p>
        <Link to="/meditate" className="mt-3 text-stone-600 text-sm underline">
          Back to Meditation
        </Link>
      </div>
    );
  }

  // ── Closed screen: quiet confirmation, not "achievement" ──
  if (closed) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#f5efe6] px-5 pt-12 pb-6 text-center">
        <div className="size-16 rounded-full bg-stone-100 flex items-center justify-center mb-6">
          <span className="text-2xl">☯</span>
        </div>
        <h2 className="font-['Playfair_Display'] text-xl text-stone-900 mb-3">
          Reflection Closed
        </h2>
        <p className="text-stone-500 text-sm leading-relaxed max-w-xs mx-auto mb-8">
          You have reached the end of your {config.title} reflection. You can
          practice again anytime.
        </p>
        <Link
          to={config.backTo}
          className="text-stone-600 text-sm underline hover:text-stone-900"
        >
          Return to {config.backLabel}
        </Link>
      </div>
    );
  }

  // ── Reflection form ──────────────────────────────────────
  return (
    <div className="flex flex-col h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      {/* Back link */}
      <Link
        to={`/meditate/harvest/${tier}`}
        className="text-stone-400 text-xs mb-6 hover:text-stone-600 transition-colors"
      >
        &larr; Back to Harvest
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          Reflection Space
        </h1>
        <p className="text-stone-500 text-sm leading-relaxed">
          Take a moment to notice what changed during this practice. There are
          no right answers — only your honest experience.
        </p>
      </div>

      {/* ReflectionSpace — the shared reflection UI (no closing questions) */}
      <ReflectionSpace
        reflectionText={reflectionText}
        onReflectionChange={setReflectionText}
        shareToResonance={shareToResonance}
        onShareToggle={() => setShareToResonance((v) => !v)}
      />

      {/* Close — the user chooses when to end */}
      <button
        onClick={handleClose}
        className="w-full py-3.5 bg-stone-900 text-white rounded-xl font-medium text-sm hover:bg-stone-800 transition-colors"
      >
        Close Reflection
      </button>

      <p className="text-stone-300 text-xs text-center mt-3">
        Closing this reflection records your experience. You can practice again
        anytime.
      </p>
    </div>
  );
}

export default MeditationReflection;
