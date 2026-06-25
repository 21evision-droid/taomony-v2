import { useState, useEffect } from 'react';
import DateNavigator from './DateNavigator';
import HabitItem from './HabitItem';
import { CHALLENGE_HABITS, DINNER_RECIPES } from '../../data/taoWeightData';
import { hasSubmittedToday, addSubmission } from '../../data/submissionStore';

export default function TrackerView() {
  const [habits, setHabits] = useState(
    CHALLENGE_HABITS.map((h) => ({ ...h, completed: false }))
  );
  const [expandedHabitId, setExpandedHabitId] = useState(null);
  const [showRecipe, setShowRecipe] = useState(false);
  const [recipeIndex, setRecipeIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    hasSubmittedToday().then(setSubmitted);
  }, []);

  const totalScore = habits
    .filter((h) => h.completed)
    .reduce((sum, h) => sum + h.points, 0);

  const handleToggle = (id) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h))
    );
  };

  const handleRequestExpand = (id) => {
    if (id === 'recipe') {
      setShowRecipe(true);
      return;
    }
    setExpandedHabitId(expandedHabitId === id ? null : id);
  };

  const handleRecipeDone = () => {
    setHabits((prev) =>
      prev.map((h) => (h.id === 5 ? { ...h, completed: true } : h))
    );
    setShowRecipe(false);
    setExpandedHabitId(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-stone-800">
            Monthly Taomony Eating Challenge
          </h3>
          <p className="text-xs text-stone-400 mt-0.5">May 2026 · 17 days left</p>
        </div>
        <div className="bg-amber-500 text-white rounded-full px-3 py-1 text-sm font-bold shadow shrink-0">
          {totalScore.toFixed(1)}
        </div>
      </div>

      {/* Date Navigator */}
      <DateNavigator />

      {/* Habits */}
      <div className="mt-6 flex flex-col gap-3">
        {habits.map((habit) => (
          <HabitItem
            key={habit.id}
            habit={habit}
            onToggle={handleToggle}
            onRequestExpand={handleRequestExpand}
            isExpanded={expandedHabitId === habit.id}
          />
        ))}
      </div>

      {/* Submit button — once per day */}
      <div className="flex justify-end mt-4">
        {submitted ? (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-5 py-2.5 text-sm font-semibold text-emerald-700">
            <span>✓</span>
            <span>Submitted Today</span>
          </div>
        ) : (
          <button
            onClick={async () => { setSubmitted(true); await addSubmission(new Date().toDateString(), totalScore, habits); alert('Day submitted! Score: ' + totalScore.toFixed(1) + ' pts'); }}
            className="bg-[#d97706] text-white border-none rounded-full px-7 py-2.5 text-sm font-semibold cursor-pointer tracking-wide shadow-[0_2px_8px_rgba(217,119,6,0.25)] hover:bg-[#b45309] hover:-translate-y-px active:translate-y-0 transition-all"
          >
            Submit Day
          </button>
        )}
      </div>

      {/* Recipe Modal */}
      {showRecipe && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
          onClick={() => setShowRecipe(false)}
        >
          <div
            className="w-full max-w-[420px] max-h-[85vh] overflow-y-auto bg-white rounded-2xl p-7 pt-7 shadow-[0_20px_60px_rgba(0,0,0,0.2)] relative animate-[scaleIn_0.25s_ease]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              className="absolute top-4 right-4 w-8 h-8 rounded-full border-none bg-[#f0e8d8] text-[18px] cursor-pointer flex items-center justify-center text-[#5a4a3a] hover:bg-[#e0d5c0] transition-colors"
              onClick={() => setShowRecipe(false)}
            >
              ✕
            </button>

            {/* Navigation row */}
            <div className="flex items-center gap-3 mb-1">
              <button
                className="w-9 h-9 rounded-full border border-[#e0d5c0] bg-white text-[22px] cursor-pointer flex items-center justify-center text-[#5a4a3a] hover:border-[#d97706] hover:text-[#d97706] transition-all leading-none shrink-0"
                onClick={() => setRecipeIndex(i => (i - 1 + DINNER_RECIPES.length) % DINNER_RECIPES.length)}
              >
                ‹
              </button>
              <div className="flex-1 min-w-0 text-center">
                <div className="text-lg font-semibold text-[#2c2416]">
                  {DINNER_RECIPES[recipeIndex].subtitle}
                </div>
              </div>
              <button
                className="w-9 h-9 rounded-full border border-[#e0d5c0] bg-white text-[22px] cursor-pointer flex items-center justify-center text-[#5a4a3a] hover:border-[#d97706] hover:text-[#d97706] transition-all leading-none shrink-0"
                onClick={() => setRecipeIndex(i => (i + 1) % DINNER_RECIPES.length)}
              >
                ›
              </button>
            </div>

            {/* Counter */}
            <div className="text-center text-xs text-[#5a4a3a] opacity-50 mb-3 tracking-wide">
              {recipeIndex + 1} / {DINNER_RECIPES.length}
            </div>

            {/* Title & description */}
            <h3 className="text-xl font-bold text-[#2c2416] mb-0.5">{DINNER_RECIPES[recipeIndex].title}</h3>
            <p className="text-[13px] text-[#5a4a3a] leading-relaxed mb-5">
              {DINNER_RECIPES[recipeIndex].description}
            </p>

            {/* Ingredients */}
            <div className="mb-[18px]">
              <h4 className="text-xs font-semibold text-[#2c2416] tracking-wide uppercase mb-2 opacity-70">
                Ingredients & Elements
              </h4>
              <ul className="list-none p-0 m-0">
                {DINNER_RECIPES[recipeIndex].ingredients.map((item, i) => (
                  <li key={i} className="text-sm text-[#5a4a3a] py-1.5 border-b border-[#f5efe6] last:border-b-0 leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="mb-[18px]">
              <h4 className="text-xs font-semibold text-[#2c2416] tracking-wide uppercase mb-2 opacity-70">
                How to Enjoy
              </h4>
              <ul className="list-none p-0 m-0">
                {DINNER_RECIPES[recipeIndex].steps.map((step, i) => (
                  <li key={i} className="text-sm text-[#5a4a3a] py-1.5 border-b border-[#f5efe6] last:border-b-0 leading-relaxed">
                    {step}
                  </li>
                ))}
              </ul>
            </div>

            {/* Done button */}
            <button
              className="w-full py-3.5 border-none rounded-xl bg-emerald-600 text-white text-[15px] font-semibold cursor-pointer mt-2 hover:bg-emerald-700 transition-colors"
              onClick={handleRecipeDone}
            >
              ✓ Done — Mark Evening Meal Complete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
