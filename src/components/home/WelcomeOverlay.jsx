import { useEffect, useState } from 'react';

export default function WelcomeOverlay({ onDismiss }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    requestAnimationFrame(() => setVisible(true));
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 200);
  };

  const handleLearnMore = (topic) => {
    alert(`Navigating to: ${topic} — onboarding content would appear here.`);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-6 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ background: 'rgba(44, 36, 22, 0.65)' }}
      onClick={handleDismiss}
    >
      <div
        className={`w-full max-w-sm rounded-2xl bg-white px-7 pb-6 pt-9 text-center shadow-2xl transition-all duration-300 ${
          visible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full text-3xl font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #b8860b 0%, #d4a843 100%)' }}
        >
          道
        </div>

        <h2 className="mb-1 font-serif text-2xl font-bold text-[#2c2416]">
          Welcome to Taomony
        </h2>
        <p className="mb-7 text-sm leading-relaxed text-[#5a4a3a] opacity-70">
          Ancient Taoist wisdom, reimagined for modern life.
          <br />
          Meditation · Philosophy · Community
        </p>

        <div className="mb-5 flex flex-col gap-2.5">
          <button
            onClick={() => handleLearnMore('What is Taomony')}
            className="w-full rounded-xl bg-[#2c2416] px-4 py-3.5 text-sm font-semibold text-[#faf6ef] transition-colors hover:bg-[#b8860b]"
          >
            ✦ What&apos;s Taomony
          </button>
          <button
            onClick={() => handleLearnMore('Why Taomony is different')}
            className="w-full rounded-xl border border-[#e0d5c0] bg-[#faf6ef] px-4 py-3.5 text-sm font-semibold text-[#2c2416] transition-colors hover:border-[#d4a843] hover:bg-[#f0e8d8]"
          >
            Why Taomony is different
          </button>
        </div>

        <button
          onClick={handleDismiss}
          className="cursor-pointer text-xs text-[#5a4a3a] underline underline-offset-2 opacity-40 transition-opacity hover:opacity-70 hover:text-[#b8860b] bg-transparent border-none"
        >
          Skip — I already know
        </button>
      </div>
    </div>
  );
}
