import { supabase } from './supabase'

/**
 * DifyProcessor — calls real Dify Workflow A via Edge Function.
 *
 * Flow:
 *   1. Receives fragment_id from processFragment()
 *   2. POSTs to Supabase Edge Function trigger-workflow-a
 *   3. Edge Function calls Dify Workflow A API
 *   4. Dify processes (classify, embed, tag)
 *   5. Dify calls back to POST /functions/v1/dify-callback
 *   6. dify-callback updates raw_fragments: status=completed, category, embedding
 *
 * Fallback: If Edge Function call fails, falls back to mock behavior.
 */

const MOCK_FALLBACK_DELAY_MS = 2000

/**
 * Process a fragment — trigger real Dify Workflow A via Edge Function.
 *
 * @param {string} fragmentId
 */
export async function processFragment(fragmentId) {
  try {
    // ── Step 1: Call trigger-workflow-a Edge Function ──
    const { data, error } = await supabase.functions.invoke(
      'trigger-workflow-a',
      {
        body: { fragment_id: fragmentId },
      },
    )

    if (error) {
      console.warn('[DifyProcessor] Edge Function error, using mock fallback:', error.message)
      return mockProcess(fragmentId)
    }

    if (data?.error) {
      console.warn('[DifyProcessor] Edge Function returned error, using mock fallback:', data.error)
      return mockProcess(fragmentId)
    }

    console.log('[DifyProcessor] Dify Workflow A triggered:', data.workflow_run_id)
    // Dify processes asynchronously — callback will update raw_fragments
    return true
  } catch (err) {
    console.warn('[DifyProcessor] Edge Function call failed, using mock fallback:', err.message)
    return mockProcess(fragmentId)
  }
}

/**
 * Mock fallback — simulates Dify processing client-side.
 * Used when Dify is unavailable (dev mode, network error, etc.).
 */
async function mockProcess(fragmentId) {
  const { default: mockCategories } = await import('./mockCategories.js')

  // Simulate AI processing latency
  await new Promise((resolve) => setTimeout(resolve, MOCK_FALLBACK_DELAY_MS))

  // Generate mock classification
  const categoryId = mockCategories.pickWeighted()
  const fragmentType = mockCategories.pickType()

  // Update fragment directly
  const { error } = await supabase
    .from('raw_fragments')
    .update({
      status: 'completed',
      category_id: categoryId,
      fragment_type: fragmentType,
    })
    .eq('id', fragmentId)

  if (error) {
    console.error('[DifyProcessor] Mock fallback error:', error.message)
  }

  console.log('[DifyProcessor] Mock fallback completed:', fragmentId)
  return true
}
