// HarvestView — Harvest reflection stage (design §8).
// "What actually changed?" — structured, preset options. Content is curated
// later by the content team (design §13); this view renders the framework
// (prompt + options + optional Resonance share) and shows a "being curated"
// placeholder when no options exist yet.

import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Wheat } from 'lucide-react';
import { getCombinationById } from '../data/meditationMock';
import { getCompletedAttempt } from '../data/meditationStore';
import {
  getHarvest,
  toggleHarvestOption,
  submitHarvest,
} from '../data/meditationHarvestStore';

export default function HarvestView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const combination = getCombinationById(id);

  // Harvest options are supplied later (design §13). The framework stores
  // selections keyed by attempt; until options exist, none are rendered.
  const options = combination?.harvestOptions || [];
  const attempt = getCompletedAttempt('combination', id);

  const [selected, setSelected] = useState(
    attempt ? getHarvest(id, attempt.attemptNumber)?.answers || [] : []
  );
  const [shared, setShared] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const handleSubmit = () => {
    if (attempt) {
      submitHarvest(id, attempt.attemptNumber, shared);
    }
    setSubmitted(true);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/combination/${combination.id}/tao-echo`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; Tao Echo
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Harvest
        </p>
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          What actually changed?
        </h1>
      </div>

      {options.length === 0 ? (
        <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm mb-6">
          <p className="flex items-center gap-1.5 text-stone-400 text-xs uppercase tracking-wider mb-3">
            <Wheat className="size-4" />
            Harvest
          </p>
          <p className="text-stone-400 text-sm leading-relaxed">
            Harvest options for this combination are being curated.
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
                    attempt &&
                    setSelected(
                      toggleHarvestOption(id, attempt.attemptNumber, opt.id)
                    )
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

      {/* Optional share to Resonance */}
      <label className="flex items-center gap-3 bg-white rounded-xl p-4 border border-stone-100 shadow-sm mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={shared}
          onChange={(e) => setShared(e.target.checked)}
          className="size-4 accent-stone-900"
        />
        <span className="text-sm text-stone-700">
          Share this practice to Resonance
        </span>
      </label>

      {submitted ? (
        <div className="text-center">
          <p className="text-emerald-600 text-sm font-medium mb-4">
            Harvest recorded.
          </p>
          <button
            onClick={() => navigate('/meditate/combinations')}
            className="py-3.5 w-full rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
          >
            Back to Combinations
          </button>
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
        >
          Complete Harvest
        </button>
      )}
    </div>
  );
}
