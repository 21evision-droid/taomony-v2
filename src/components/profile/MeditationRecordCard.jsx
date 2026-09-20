// MeditationRecordCard — a completed micro-task record in the Profile's
// Meditation section (design §10.1). Mirrors Learning's Tao Archive card.

import { Link } from 'react-router-dom';
import {
  MEDITATION_DIMENSIONS,
  MEDITATION_SUBTASKS,
  MEDITATION_COMBINATIONS,
} from '../../data/meditationMock';
import { getHarvest } from '../../data/meditationHarvestStore';

function MeditationRecordCard({ kind, unitId, record }) {
  const subtask =
    kind === 'subtask'
      ? MEDITATION_SUBTASKS.find((s) => s.id === unitId)
      : null;
  const combination =
    kind === 'combination'
      ? MEDITATION_COMBINATIONS.find((c) => c.id === unitId)
      : null;
  const unit = subtask || combination;
  const dimension = subtask
    ? MEDITATION_DIMENSIONS.find((d) => d.id === subtask.dimensionId)
    : null;
  const harvest = combination
    ? Boolean(getHarvest(unitId, record.attemptNumber))
    : false;

  const fmt = (iso) =>
    new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  return (
    <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
      <h3 className="font-['Playfair_Display'] text-sm text-stone-900 mb-1">
        {unit?.title || 'Unknown practice'}
      </h3>
      <p className="text-stone-400 text-xs mb-2">
        {subtask ? `Sub-task · ${dimension?.title || ''}` : 'Combination'}
      </p>
      <div className="flex items-center gap-2 text-xs">
        <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
          Complete
        </span>
        <span className="text-stone-300">{fmt(record.closedAt)}</span>
        {harvest && (
          <Link
            to={`/meditate/combination/${unitId}/harvest`}
            className="ml-auto text-stone-500 underline hover:text-stone-900 transition-colors"
          >
            View Harvest
          </Link>
        )}
      </div>
    </div>
  );
}

export default MeditationRecordCard;
