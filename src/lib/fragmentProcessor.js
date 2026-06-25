/**
 * FragmentProcessor abstraction.
 *
 * UI code imports from this module only.
 * Swap implementations here without touching components.
 *
 * Current: DifyProcessor (mock, Dify-contract-ready)
 * Future:  DifyProcessor (live Dify Workflow A via Edge Function)
 * Fallback: MockProcessor (client-side, no AI dependency)
 */

import { processFragment as difyProcess } from './difyProcessor'

let _useMockFallback = false

/** Toggle between DifyProcessor (default) and MockProcessor fallback */
export function useMockFallback(enabled) {
  _useMockFallback = enabled
}

/**
 * Process a fragment after submission.
 *
 * @param {string} fragmentId
 */
export async function processFragment(fragmentId) {
  if (_useMockFallback) {
    // ── Legacy MockProcessor fallback ──
    const { supabase } = await import('./supabase')
    await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1000))
    const { error } = await supabase
      .from('raw_fragments')
      .update({ status: 'completed' })
      .eq('id', fragmentId)
    if (error) console.error('[MockProcessor] Error:', error.message)
    return
  }

  return difyProcess(fragmentId)
}

