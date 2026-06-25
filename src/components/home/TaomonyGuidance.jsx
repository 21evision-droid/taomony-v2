import { FAQ_ITEMS } from '../../data/homeData';

export default function TaomonyGuidance() {
  return (
    <div className="relative h-[52px] overflow-hidden border-b border-[#e0d5c0] bg-[#faf6ef]">
      {/* Edge gradients */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-[60px] bg-gradient-to-r from-[#faf6ef] to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-[60px] bg-gradient-to-l from-[#faf6ef] to-transparent" />

      {/* Scrolling bar */}
      <div className="flex h-full w-max animate-faq-scroll items-center gap-12 px-5">
        {[...FAQ_ITEMS, ...FAQ_ITEMS].map((item, idx) => (
          <span className="flex items-center gap-2.5 whitespace-nowrap text-sm text-[#5a4a3a]" key={`faq-${item.id}-${idx}`}>
            <span className="rounded-full bg-[#d4a843] px-2 py-0.5 text-[10px] font-semibold text-white">
              Q
            </span>
            <span className="font-serif text-[#2c2416] font-medium">
              {item.q}
            </span>
            <span className="ml-1 text-base text-[#b8860b]">→</span>
          </span>
        ))}
      </div>
    </div>
  );
}
