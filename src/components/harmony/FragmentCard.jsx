function getTimeAgo(dateStr) {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 30) return `${diffDay}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function FragmentCard({ fragment, channelName }) {
  const isPending = fragment.status === 'pending'
  const tag = `#${(channelName || 'unknown').toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div
      className={`rounded-xl border p-4 transition-opacity ${
        isPending
          ? 'border-stone-200/60 bg-stone-50/80'
          : 'border-stone-200 bg-white'
      }`}
    >
      {/* Meta row */}
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-400">
        <span>{tag}</span>
        <span aria-hidden="true">·</span>
        <span>{getTimeAgo(fragment.created_at)}</span>
        {isPending && (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-600">
              <span className="inline-block size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Processing...
            </span>
          </>
        )}
        {!isPending && fragment.fragment_type && (
          <>
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-500">
              {fragment.fragment_type === 'extended_fragment'
                ? 'Extended'
                : fragment.fragment_type.charAt(0).toUpperCase() +
                  fragment.fragment_type.slice(1)}
            </span>
          </>
        )}
      </div>

      {/* Content */}
      <p
        className={`text-sm leading-relaxed ${
          isPending ? 'text-stone-400' : 'text-stone-700'
        }`}
      >
        {fragment.content}
      </p>
    </div>
  )
}

export default FragmentCard
