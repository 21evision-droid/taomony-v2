// TaoEchoCard — platform-provided Tao Echo, shown below a dimension's or
// combination's micro-task list (design §2.2). Not user-filled and not shown
// on the first-level navigation.

export default function TaoEchoCard({ taoEcho }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-stone-100 shadow-sm">
      <p className="text-stone-400 text-xs uppercase tracking-wider mb-3">
        Tao Echo
      </p>
      <p className="font-['Playfair_Display'] text-sm text-stone-600 italic leading-relaxed">
        &ldquo;{taoEcho.passage}&rdquo;
      </p>
      <p className="text-stone-400 text-xs mt-1">
        Tao Te Ching · Chapter {taoEcho.chapter}
      </p>
      <p className="text-stone-500 text-xs leading-relaxed mt-2">
        {taoEcho.implication}
      </p>
    </div>
  );
}
