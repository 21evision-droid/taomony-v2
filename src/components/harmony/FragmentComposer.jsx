import { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const PLACEHOLDERS = [
  'Today I skipped sugary drinks...',
  'Read Chapter 8 of Tao Te Ching...',
  'Felt grateful for the morning silence...',
  'Shared a kind word with a stranger...',
  'Took a walk without my phone today...',
]

function FragmentComposer({ channelId, onSubmit }) {
  const { user } = useAuth()
  const [text, setText] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [focused, setFocused] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!focused && !text) {
      intervalRef.current = setInterval(() => {
        setPlaceholderIdx((prev) => (prev + 1) % PLACEHOLDERS.length)
      }, 3000)
    }
    return () => clearInterval(intervalRef.current)
  }, [focused, text])

  async function handleSubmit() {
    const content = text.trim()
    if (!content || submitting || !user) return

    setSubmitting(true)

    const { data, error } = await supabase
      .from('raw_fragments')
      .insert({
        content,
        channel_id: channelId,
        user_id: user.id,
        status: 'pending',
      })
      .select('id')
      .single()

    if (error) {
      console.error('Submit error:', error.message)
      setSubmitting(false)
      return
    }

    setText('')
    setSubmitting(false)
    onSubmit?.(data.id)
  }

  const canSubmit = text.trim().length > 0 && !submitting && !!user

  return (
    <div
      className={`mb-5 rounded-xl border bg-white p-4 transition-colors ${
        focused ? 'border-stone-300' : 'border-stone-200'
      }`}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={PLACEHOLDERS[placeholderIdx]}
        rows={2}
        className="w-full resize-none bg-transparent text-sm leading-relaxed text-stone-700 outline-none placeholder:text-stone-300"
      />

      <div className="mt-2 flex items-center justify-between border-t border-stone-100 pt-2">
        {user ? (
          <span className="text-[11px] text-stone-300">
            {submitting ? 'Submitting...' : 'Share a small moment of awareness...'}
          </span>
        ) : (
          <span className="text-[11px] text-stone-300">
            Sign in to share a fragment
          </span>
        )}

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
            canSubmit
              ? 'bg-[#b8860b] text-white hover:bg-[#a0750a]'
              : 'bg-stone-200 text-stone-400'
          }`}
        >
          {submitting ? '...' : 'Share'}
        </button>
      </div>
    </div>
  )
}

export default FragmentComposer
