/**
 * Mock category data for DifyProcessor fallback mode.
 * Mirrors the real category distribution used by Dify Workflow A.
 */

const CATEGORY_POOL = [
  { id: 'a0000000-0000-4000-8000-000000000001', weight: 0.25 }, // Learning
  { id: 'a0000000-0000-4000-8000-000000000002', weight: 0.15 }, // Meditate
  { id: 'a0000000-0000-4000-8000-000000000003', weight: 0.10 }, // Taomony Eating
  { id: 'a0000000-0000-4000-8000-000000000004', weight: 0.35 }, // Cultivation
  { id: 'a0000000-0000-4000-8000-000000000006', weight: 0.15 }, // Harmony Resonance
]

const FRAGMENT_TYPE_POOL = ['fragment', 'reflection']

function pickWeighted(items) {
  const total = items.reduce((sum, i) => sum + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item.id
  }
  return items[items.length - 1].id
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default {
  pickWeighted: () => pickWeighted(CATEGORY_POOL),
  pickType: () => pickRandom(FRAGMENT_TYPE_POOL),
  CATEGORY_POOL,
  FRAGMENT_TYPE_POOL,
}
