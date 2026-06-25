import { useEffect, useState } from 'react'
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { processFragment } from '../lib/fragmentProcessor'
import FragmentComposer from '../components/harmony/FragmentComposer'
import FragmentCard from '../components/harmony/FragmentCard'

const governanceContent = {
  'Community Policy': [
    'This community thrives on mutual respect and shared intention. All members are expected to engage with kindness, refrain from personal attacks, and honor the diversity of perspectives that emerge from different life paths.',
    'Fragments shared here become part of the collective wisdom pool. By contributing, you agree to allow the Resonance Engine to analyze and incorporate your insights into distilled posts, always attributed anonymously.',
    'Commercial solicitation, spam, and content that deliberately misleads the community are not permitted. If you see something that violates this policy, flag it for review.',
  ],
  'Events': [
    'Weekly Resonance Circle — Every Sunday at 7 PM UTC. A live-guided reflection where members share fragments around a rotating theme. The Master Agent synthesizes a live resonance summary at the end.',
    'Monthly Wisdom Assembly — First Saturday of each month. Guest speakers from Taoist, Buddhist, and contemplative traditions lead discussions. Past sessions have covered "Wu Wei in Modern Work" and "The Physiology of Gratitude."',
    'Community Challenge: 21 Days of Kindness — Starts on the 1st of each month. Post one kindness fragment daily. Participants who complete the challenge receive a "Cultivator" badge on their profile.',
  ],
  'Challenge': [
    'The Governance Challenge Board is where the community co-creates improvements to the Resonance system itself. Current active challenge: "Design a better way to surface underheard voices in the fragment stream."',
    'Proposals are posted as Extended Fragments. The community resonates around them for 7 days. If a proposal reaches critical mass (50+ supporting fragments), the Master Agent generates an implementation brief for admin review.',
    'Past challenges include: "Add anonymous fragment submission" (implemented), "Weekly theme voting" (in development), and "Multi-language fragment support" (under research).',
  ],
}

function SectionCard({ title, paragraphs, expanded, onToggle, expandLabel, collapseLabel }) {
  return (
    <div>
      <h3 className="mb-3 font-serif-premium text-base tracking-wide text-stone-800">
        #{title.toLowerCase().replace(/\s+/g, '-')}
      </h3>

      <div className={`space-y-2 text-sm leading-relaxed text-stone-600 ${expanded ? '' : 'line-clamp-3'}`}>
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      <button
        onClick={onToggle}
        className="mt-3 flex items-center gap-1 text-xs font-medium text-stone-400 transition-colors hover:text-stone-600"
      >
        {expanded ? (
          <>{collapseLabel || 'Show less'} <ChevronUp size={14} strokeWidth={1.8} /></>
        ) : (
          <>{expandLabel || 'Read more'} <ChevronDown size={14} strokeWidth={1.8} /></>
        )}
      </button>
    </div>
  )
}

function HarmonyResonance() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  // 'overview' = Governance overview, 'all' = All Resonance, or a channel UUID
  const [selectedView, setSelectedView] = useState('overview')
  const [expandedSections, setExpandedSections] = useState({})
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [fragments, setFragments] = useState([])
  const [fragmentsLoading, setFragmentsLoading] = useState(false)

  // Build channel_id → channel_name lookup
  const channelNameById = {}
  categories.forEach((cat) => {
    cat.channels.forEach((ch) => {
      channelNameById[ch.id] = ch.name
    })
  })

  useEffect(() => {
    async function fetchData() {
      const { data: cats } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('sort_order')

      const { data: chans } = await supabase
        .from('channels')
        .select('id, category_id, name')
        .order('sort_order')

      if (cats && chans) {
        const grouped = cats.map((cat) => ({
          ...cat,
          channels: chans.filter((ch) => ch.category_id === cat.id),
        }))
        setCategories(grouped)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  // Fetch fragments — used by both the view-change effect and submit handler
  async function fetchFragments() {
    if (selectedView === 'overview') {
      setFragments([])
      return
    }
    setFragmentsLoading(true)
    let query = supabase
      .from('raw_fragments')
      .select('id, content, channel_id, created_at, fragment_type, status')
      .in('status', ['pending', 'completed'])
      .order('created_at', { ascending: false })
      .limit(50)

    if (selectedView !== 'all') {
      query = query.eq('channel_id', selectedView)
    }

    const { data } = await query
    setFragments(data || [])
    setFragmentsLoading(false)
  }

  useEffect(() => {
    fetchFragments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedView])

  async function handleFragmentSubmit(fragmentId) {
    // Re-fetch to show the new pending fragment
    await fetchFragments()
    // Process asynchronously (MockProcessor waits, then marks completed)
    processFragment(fragmentId).then(() => {
      fetchFragments()
    })
  }

  const handleViewClick = (view) => {
    setSelectedView(view)
    setSidebarOpen(false)
  }

  const toggleSection = (title) => {
    setExpandedSections((prev) => ({ ...prev, [title]: !prev[title] }))
  }

  const isGovernanceOverview = selectedView === 'overview'
  const isAllResonance = selectedView === 'all'
  const selectedChannelName = channelNameById[selectedView]

  return (
    <div className="relative flex h-full flex-col">
      {/* ── Hero ── */}
      <div className="relative bg-gradient-to-b from-[#faf6ef] to-[#f0e8d8] px-5 pb-4 pt-6 text-center">
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute left-3 top-[50px] rounded-lg p-1.5 text-stone-500 transition-colors hover:bg-stone-200/60"
          aria-label="Open channels"
        >
          <Menu size={22} strokeWidth={1.8} />
        </button>
        <h2 className="mb-1 flex items-center justify-center gap-1.5 font-cn text-[15px] font-semibold tracking-[3px] text-[#2c2416]">
          <span className="inline-block text-[#b8860b]">✦</span> Harmony Resonance
        </h2>
        <h3 className="mb-2 font-sans text-[22px] font-bold tracking-tight text-[#b8860b]">
          Collective Intelligence
        </h3>
        <p className="mx-auto max-w-[320px] text-[13px] leading-relaxed text-[#5a4a3a] opacity-70">
          Fragments, shared daily — woven into wisdom by AI.
        </p>
      </div>

      {/* ── Backdrop ── */}
      {sidebarOpen && (
        <div
          className="absolute inset-0 z-30 bg-black/40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar Drawer ── */}
      <aside
        className={`absolute inset-0 z-40 overflow-y-auto bg-white shadow-xl shadow-black/10 transition-transform duration-300 scrollbar-hide ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
          <span className="font-serif-premium text-base tracking-wide text-stone-800">
            Channels
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
            aria-label="Close channels"
          >
            <X size={20} strokeWidth={1.8} />
          </button>
        </div>

        {/* "All Resonance" entry */}
        <button
          onClick={() => handleViewClick('all')}
          className={`flex w-full items-center px-4 py-2.5 text-left text-sm transition-colors ${
            selectedView === 'all'
              ? 'bg-stone-100 font-medium text-stone-900'
              : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
          }`}
        >
          <span className="mr-3 text-base">🌐</span>
          All Resonance
        </button>

        {/* Category List */}
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="px-4 pb-0.5 pt-4 text-[11px] font-semibold uppercase tracking-widest text-stone-400">
              {cat.name}
            </div>
            {cat.channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => handleViewClick(ch.id)}
                className={`flex w-full items-center px-4 py-2 text-left text-sm transition-colors ${
                  selectedView === ch.id
                    ? 'bg-stone-100 font-medium text-stone-900'
                    : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                }`}
              >
                <span className="mr-3 text-stone-300">#</span>
                {ch.name}
              </button>
            ))}
          </div>
        ))}
      </aside>

      {/* ── Main Feed ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-6 pt-5 scrollbar-hide">
        {isGovernanceOverview ? (
          <div className="space-y-5">
            <p className="text-sm text-stone-400">
              How we shape the space together — transparency, events, and shared challenges.
            </p>

            {Object.entries(governanceContent).map(([title, paragraphs], idx, arr) => (
              <div key={title} className={idx < arr.length - 1 ? 'pb-5 border-b border-dashed border-stone-300 mb-5' : ''}>
                <SectionCard
                  title={title}
                  paragraphs={paragraphs}
                  expanded={!!expandedSections[title]}
                  onToggle={() => toggleSection(title)}
                  expandLabel={{
                    'Community Policy': 'Read full policy',
                    'Events': 'View all events',
                    'Challenge': 'See active challenges',
                  }[title]}
                  collapseLabel="Show less"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {/* Fragment Composer — shown in channel views, not All Resonance */}
            {!isAllResonance && (
              <FragmentComposer
                channelId={selectedView}
                onSubmit={handleFragmentSubmit}
              />
            )}

            {/* All Resonance header */}
            {isAllResonance && (
              <div>
                <p className="text-sm text-stone-400">All Resonance</p>
              </div>
            )}

            {/* Featured Resonance placeholder — All Resonance only */}
            {isAllResonance && (
              <div className="rounded-xl border border-stone-200 bg-gradient-to-br from-amber-50 to-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <h3 className="font-serif-premium text-sm font-semibold tracking-wide text-stone-800">
                    Featured Resonance
                  </h3>
                </div>
                <div className="rounded-lg border border-dashed border-stone-300 bg-stone-50/50 px-4 py-6 text-center">
                  <p className="text-sm text-stone-400">
                    The first Distilled Post will appear here once the community
                    reaches 100 fragments.
                  </p>
                </div>
              </div>
            )}

            {/* Channel label for non-All-Resonance views */}
            {!isAllResonance && selectedChannelName && (
              <p className="-mb-3 text-sm text-stone-400">{selectedChannelName}</p>
            )}

            {/* Fragment feed */}
            <div className="space-y-3">
              {fragmentsLoading ? (
                <p className="py-8 text-center text-sm text-stone-300">
                  Loading fragments...
                </p>
              ) : fragments.length === 0 ? (
                <p className="py-8 text-center text-sm text-stone-300">
                  {isAllResonance
                    ? 'No wisdom yet. Be the first to share a fragment.'
                    : 'No fragments in this channel yet.'}
                </p>
              ) : (
                fragments.map((f) => (
                  <FragmentCard
                    key={f.id}
                    fragment={f}
                    channelName={channelNameById[f.channel_id]}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default HarmonyResonance
