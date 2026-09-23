import { CheckSquare, Square } from 'lucide-react';

// ReflectionSpace — Pure reflection UI component.
// Displays closing questions and a personal reflection textarea.
//
// This component is the moment of integration — not evaluation.
// No scores, no judgments, no "correct" answers.
//
// Props:
//   closingReflection  — Reflection questions to prompt insight
//   reflectionText     — user's free-text reflection
//   onReflectionChange — (text) => void
//   shareToResonance   — whether the reflection will auto-publish on close
//   onShareToggle      — () => void, toggles shareToResonance

function ReflectionSpace({
  closingReflection,
  reflectionText,
  onReflectionChange,
  shareToResonance = true,
  onShareToggle,
}) {
  return (
    <div>
      {/* ════════════════════════════════════════════════════
          Section 1: Closing reflection questions
          ════════════════════════════════════════════════════ */}
      {closingReflection && closingReflection.length > 0 && (
        <div className="mb-6">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-3">
            Closing Questions
          </p>
          <div className="flex flex-col gap-2">
            {closingReflection.map((q, i) => (
              <div
                key={i}
                className="text-stone-600 text-sm leading-relaxed bg-white rounded-xl p-4 border border-stone-100"
              >
                {q}
              </div>
            ))}
          </div>
          <p className="text-stone-300 text-[10px] mt-3">
            These questions are for your personal reflection. There are no right
            answers.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          Section 2: Personal reflection
          ════════════════════════════════════════════════════ */}
      <div className="mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-3">
          Your Reflection
        </p>
        <textarea
          value={reflectionText}
          onChange={(e) => onReflectionChange(e.target.value)}
          placeholder="What has changed in your understanding? What did you discover? (optional)"
          rows={5}
          className="w-full bg-white rounded-xl p-4 border border-stone-200 text-sm text-stone-700 placeholder-stone-300 resize-none focus:outline-none focus:border-stone-400"
        />
        <div className="flex items-center justify-end mt-3">
          <button
            type="button"
            onClick={onShareToggle}
            aria-pressed={shareToResonance}
            className="flex items-center gap-2 text-stone-400 text-xs hover:text-stone-600 transition-colors"
          >
            {shareToResonance ? (
              <CheckSquare size={16} className="text-stone-900" />
            ) : (
              <Square size={16} />
            )}
            Share to Resonance
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReflectionSpace;
