// TaoEchoView — Tao Echo reflection stage (design §8).
// One combination → one Tao Echo: passage + chapter reference + implication.

import { Link, useNavigate, useParams } from 'react-router-dom';
import { getCombinationById } from '../data/meditationMock';

export default function TaoEchoView() {
  const { id } = useParams();
  const navigate = useNavigate();
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

  const { taoEcho } = combination;

  return (
    <div className="flex flex-col min-h-full bg-[#f5efe6] px-5 pt-12 pb-6">
      <Link
        to={`/meditate/combination/${combination.id}`}
        className="text-stone-400 text-xs hover:text-stone-600 transition-colors"
      >
        &larr; {combination.title}
      </Link>

      <div className="mt-4 mb-6">
        <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
          Tao Echo
        </p>
        <h1 className="font-['Playfair_Display'] text-xl text-stone-900 mb-2">
          {combination.title}
        </h1>
      </div>

      <div className="bg-white rounded-xl p-5 border border-stone-100 shadow-sm mb-6">
        <p className="font-['Playfair_Display'] text-lg text-stone-800 leading-relaxed mb-3">
          &ldquo;{taoEcho.passage}&rdquo;
        </p>
        <p className="text-stone-400 text-xs mb-4">
          Tao Te Ching · Chapter {taoEcho.chapter}
        </p>
        <div className="border-t border-stone-100 pt-4">
          <p className="text-stone-400 text-xs uppercase tracking-wider mb-2">
            Implication
          </p>
          <p className="text-stone-600 text-sm leading-relaxed">
            {taoEcho.implication}
          </p>
        </div>
      </div>

      <button
        onClick={() => navigate(`/meditate/combination/${combination.id}/harvest`)}
        className="py-3.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors cursor-pointer"
      >
        Continue to Harvest
      </button>
    </div>
  );
}
