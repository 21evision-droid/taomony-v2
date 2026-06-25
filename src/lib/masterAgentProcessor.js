import { supabase } from './supabase'

// ─────────────────────────────────────────────────────────────
// Master Agent Processor
//
// Public contract:
//   generateDistilledPost()
//     → { title, content, summary, source_fragment_ids, contributor_count }
//     → null  (if threshold not reached)
//
// Current implementation: DifyWorkflowBProcessor (via Edge Function)
//   - Calls trigger-workflow-b Edge Function which invokes Dify Workflow B
//   - Threshold: 50 undistilled completed fragments
//   - Falls back to mock if Dify is unavailable
//
// Legacy: MockMasterAgentProcessor
//   - Deterministic aggregation, no AI, no Dify calls
//   - Kept as fallback for development
// ─────────────────────────────────────────────────────────────

const DISTILLATION_THRESHOLD = 50
const MAX_BATCH_SIZE = 50

// ── Implementation toggle ──
let _useWorkflowB = true
let _useMockFallback = false

export function useWorkflowB(enabled) {
  _useWorkflowB = enabled
}

export function useMockFallback(enabled) {
  _useMockFallback = enabled
}

// ═════════════════════════════════════════════════════════════
// DifyWorkflowBProcessor
// ═════════════════════════════════════════════════════════════

/**
 * Call Dify Workflow B via the trigger-workflow-b Edge Function.
 * This replaces the mock distillation pipeline.
 */
async function difyWorkflowBDistill() {
  console.log('[MasterAgent] Calling Dify Workflow B...')

  const { data, error } = await supabase.functions.invoke(
    'trigger-workflow-b',
    {
      body: { threshold: DISTILLATION_THRESHOLD },
    },
  )

  if (error) {
    console.error('[MasterAgent] Edge Function call failed:', error.message)
    return null
  }

  if (!data.success) {
    console.log('[MasterAgent] Distillation not ready:', data.message)
    return null
  }

  console.log('[MasterAgent] Dify Workflow B completed:', data.distilled_post_id)
  return {
    title: data.title,
    distilled_post_id: data.distilled_post_id,
    fragment_count: data.fragment_count,
  }
}

// ═════════════════════════════════════════════════════════════
// MockMasterAgentProcessor (legacy fallback)
// ═════════════════════════════════════════════════════════════

async function fetchUndistilledBatch() {
  const { data, error } = await supabase
    .from('raw_fragments')
    .select('id, user_id, content, category_id, created_at')
    .eq('status', 'completed')
    .eq('is_distilled', false)
    .order('created_at', { ascending: true })
    .limit(MAX_BATCH_SIZE)

  if (error) {
    console.error('[MasterAgent] Query error:', error.message)
    return null
  }

  if (!data || data.length < DISTILLATION_THRESHOLD) {
    return null
  }

  return data.slice(0, DISTILLATION_THRESHOLD)
}

function findDominantCategory(batch) {
  const counts = {}
  for (const f of batch) {
    if (f.category_id) {
      counts[f.category_id] = (counts[f.category_id] || 0) + 1
    }
  }

  let dominantId = null
  let maxCount = 0
  for (const [id, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count
      dominantId = id
    }
  }

  return { dominantId, categoryCount: Object.keys(counts).length }
}

async function fetchCategoryName(categoryId) {
  if (!categoryId) return 'General'
  const { data } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .single()
  return data?.name || 'General'
}

function generateDistilledContent(batch, categoryName, categoryCount) {
  const uniqueUsers = new Set(batch.map((f) => f.user_id))
  const contributorCount = uniqueUsers.size

  const title = `Reflections on ${categoryName}`
  const summary =
    `A distillation of ${batch.length} fragments across ${categoryCount} categories, ` +
    `with a focus on ${categoryName}.`

  const excerpts = batch
    .slice(0, 10)
    .map((f, i) => {
      const trimmed =
        f.content.length > 120 ? f.content.slice(0, 120) + '…' : f.content
      return `${i + 1}. "${trimmed}"`
    })
    .join('\n\n')

  const content =
    `## ${title}\n\n` +
    `${summary}\n\n` +
    `### Key Fragments\n\n${excerpts}\n\n` +
    `---\n` +
    `*Distilled from ${batch.length} community fragments by ${contributorCount} contributors.*`

  return { title, content, summary, contributorCount }
}

async function mockDistill() {
  const batch = await fetchUndistilledBatch()
  if (!batch) return null

  const { dominantId, categoryCount } = findDominantCategory(batch)
  const categoryName = await fetchCategoryName(dominantId)
  const { title, content, summary, contributorCount } =
    generateDistilledContent(batch, categoryName, categoryCount)

  return {
    title,
    content,
    summary,
    source_fragment_ids: batch.map((f) => f.id),
    contributor_count: contributorCount,
  }
}

// ═════════════════════════════════════════════════════════════
// Public API
// ═════════════════════════════════════════════════════════════

/**
 * Generate a distilled post from undistilled completed fragments.
 *
 * Uses Dify Workflow B (via Edge Function) by default.
 * Falls back to mock processor if Dify is unavailable.
 *
 * Threshold: 50 fragments required.
 * Returns null if threshold not reached.
 *
 * @returns {Promise<{
 *   title: string,
 *   content?: string,
 *   summary?: string,
 *   source_fragment_ids?: string[],
 *   contributor_count?: number,
 *   distilled_post_id?: string,
 * }|null>}
 */
export async function generateDistilledPost() {
  if (_useWorkflowB && !_useMockFallback) {
    // Primary path: Dify Workflow B via Edge Function
    const result = await difyWorkflowBDistill()
    if (result) return result
    // Dify not ready — fall through to mock if allowed
    if (!_useMockFallback) return null
  }

  // Fallback path: mock distillation
  return mockDistill()
}

/**
 * Check whether enough undistilled completed fragments exist
 * to reach the distillation threshold.
 *
 * @returns {Promise<boolean>}
 */
export async function isDistillationReady() {
  const { count, error } = await supabase
    .from('raw_fragments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .eq('is_distilled', false)

  if (error) {
    console.error('[MasterAgent] Count error:', error.message)
    return false
  }

  return count >= DISTILLATION_THRESHOLD
}
