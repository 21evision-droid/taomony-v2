/**
 * Fragment Seeder — Validation Phase
 *
 * Generates realistic test fragments for stress testing.
 *
 * Usage:
 *   node scripts/seed-fragments.mjs 500
 *   node scripts/seed-fragments.mjs 1000
 *   node scripts/seed-fragments.mjs 5000
 *
 * Environment:
 *   SUPABASE_URL      (default: from project)
 *   SUPABASE_ANON_KEY (default: from project)
 *   SUPABASE_SERVICE_ROLE_KEY (required if skipping user creation)
 */

import { createClient } from "@supabase/supabase-js";

// ── Configuration ──
const SUPABASE_URL = "https://jiwsgaegoudcutdnqydf.supabase.co";
const ANON_KEY =
  "sb_publishable_hEDofAMzpYWUiz0Tyt8gew_3mGXypWE";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imppd3NnYWVnb3VkY3V0ZG5xeWRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODAzNzU4MiwiZXhwIjoyMDkzNjEzNTgyfQ.iz4bAmGRw5pnilex1dNqEstakhdYLdhpw7I8l6MCMIw";

const CHANNELS = [
  { id: "b0000000-0000-4000-8000-000000000001", name: "Tao Te Ching", category: "Learning", weight: 0.12 },
  { id: "b0000000-0000-4000-8000-000000000002", name: "Philosophy", category: "Learning", weight: 0.08 },
  { id: "b0000000-0000-4000-8000-000000000003", name: "Psychology", category: "Learning", weight: 0.06 },
  { id: "b0000000-0000-4000-8000-000000000004", name: "Nutrition", category: "Learning", weight: 0.05 },
  { id: "b0000000-0000-4000-8000-000000000005", name: "Daily Meditation", category: "Meditate", weight: 0.12 },
  { id: "b0000000-0000-4000-8000-000000000006", name: "Breathing", category: "Meditate", weight: 0.04 },
  { id: "b0000000-0000-4000-8000-000000000007", name: "Inner Alchemy", category: "Meditate", weight: 0.04 },
  { id: "b0000000-0000-4000-8000-000000000008", name: "Daily Weight", category: "Taomony Eating", weight: 0.06 },
  { id: "b0000000-0000-4000-8000-000000000009", name: "Meal Journal", category: "Taomony Eating", weight: 0.08 },
  { id: "b0000000-0000-4000-8000-000000000010", name: "Challenges", category: "Taomony Eating", weight: 0.05 },
  { id: "b0000000-0000-4000-8000-000000000011", name: "Gratitude", category: "Cultivation", weight: 0.10 },
  { id: "b0000000-0000-4000-8000-000000000012", name: "Generosity", category: "Cultivation", weight: 0.04 },
  { id: "b0000000-0000-4000-8000-000000000013", name: "Accountability", category: "Cultivation", weight: 0.04 },
  { id: "b0000000-0000-4000-8000-000000000014", name: "Kindness", category: "Cultivation", weight: 0.05 },
  { id: "b0000000-0000-4000-8000-000000000015", name: "Community Policy", category: "Governance", weight: 0.01 },
  { id: "b0000000-0000-4000-8000-000000000016", name: "Events", category: "Governance", weight: 0.02 },
  { id: "b0000000-0000-4000-8000-000000000017", name: "Challenge", category: "Governance", weight: 0.02 },
  { id: "b0000000-0000-4000-8000-000000000018", name: "Member Resonances", category: "Harmony Resonance", weight: 0.01 },
  { id: "b0000000-0000-4000-8000-000000000019", name: "Resonance Circle", category: "Harmony Resonance", weight: 0.01 },
];

const CATEGORIES = {
  "a0000000-0000-4000-8000-000000000001": "Learning",
  "a0000000-0000-4000-8000-000000000002": "Meditate",
  "a0000000-0000-4000-8000-000000000003": "Taomony Eating",
  "a0000000-0000-4000-8000-000000000004": "Cultivation",
  "a0000000-0000-4000-8000-000000000005": "Governance",
  "a0000000-0000-4000-8000-000000000006": "Harmony Resonance",
};

// Reverse: category name → UUID
const CATEGORY_NAME_TO_ID = {};
for (const [id, name] of Object.entries(CATEGORIES)) {
  CATEGORY_NAME_TO_ID[name] = id;
}

// ── Content Templates ──

const FRAGMENT_TEMPLATES = {
  "Tao Te Ching": [
    "Reading Chapter {n} today — '{verse}' really spoke to me. It reminds me that {insight}.",
    "Been reflecting on the concept of Wu Wei in my daily life. {insight}",
    "The idea that 'the Tao that can be told is not the eternal Tao' keeps coming back to me. {reflection}",
    "Chapter {n}: '{verse}'. This applies directly to {situation}.",
    "I find myself returning to the same passage over and over: '{verse}'. Each time it means something different.",
    "Today I tried to practice non-action in a situation that normally would have stressed me out. {reflection}",
    "The soft overcomes the hard. This principle has helped me with {situation}.",
    "Water is the softest thing, yet it can wear down rock. Applied this to {situation} today.",
    "Simplicity, patience, compassion — these three are my greatest treasures. Working on {reflection}.",
    "When I let go of what I am, I become what I might be. {insight}",
    "Nature does not hurry, yet everything is accomplished. A good reminder for {situation}.",
    "The journey of a thousand miles begins with a single step. Today I took that step with {reflection}.",
    "Knowing others is intelligence; knowing yourself is true wisdom. {insight}",
    "Mastering others is strength; mastering yourself is true power. Working on {reflection}.",
    "The wise man is one who knows what he does not know. {insight} about my own limitations.",
  ],
  "Philosophy": [
    "Been thinking about what it means to live a good life. For me it comes down to {reflection}.",
    "The unexamined life is not worth living. Today I examined {situation} and realized {insight}.",
    "I wonder if free will exists or if everything is determined. {reflection}",
    "Stoicism has been helping me with {situation}. The dichotomy of control is powerful.",
    "What is the self? A collection of thoughts, memories, and experiences? Or something more? {insight}",
    "The older I get, the more I realize how much I don't know. {reflection}",
    "Happiness is not something ready made. It comes from your own actions. Working on {reflection}.",
    "Questioning everything is exhausting but necessary. Today I questioned {situation}.",
    "The map is not the territory. My mental model of {situation} was completely wrong.",
    "I think therefore I am. But what does it mean to truly think? {reflection}",
    "Virtue is its own reward. Practiced {reflection} today without expecting anything back.",
    "The only true wisdom is in knowing you know nothing. {insight}",
    "What we think, we become. Trying to be more mindful of {situation}.",
  ],
  "Psychology": [
    "Noticed a pattern today: when {situation} happens, I tend to react by {reflection}. Working on changing this.",
    "Cognitive dissonance is real. I experienced it today with {situation}.",
    "The mind is like an iceberg — most of it is hidden. Today I uncovered {insight}.",
    "Attachment styles explain so much about {situation}. I see this in {reflection}.",
    "Emotional regulation is a skill. Today I practiced it with {situation}.",
    "Trauma is not what happens to you, but what happens inside you. {reflection}",
    "The stories we tell ourselves shape our reality. Trying to rewrite the narrative around {situation}.",
    "Confirmation bias caught me today. I was looking for evidence that {reflection} and ignored everything else.",
    "Growth happens at the edge of discomfort. {situation} is uncomfortable but I'm learning.",
    "Self-compassion is not self-indulgence. {reflection}",
    "We repeat what we don't repair. Working on healing with {reflection}.",
    "The body keeps the score. Felt {situation} physically before I understood it emotionally.",
  ],
  "Nutrition": [
    "Noticed that when I eat {meal}, I feel {effect}. Trying to make better choices.",
    "Meal prep Sunday: prepared {food} for the week. Feeling good about {reflection}.",
    "Learned about the connection between gut health and {aspect}. Starting to {action}.",
    "Today I ate mindfully. Actually tasted every bite of {meal}. {reflection}",
    "Sugar cravings hit hard today. Instead of giving in, I {action}.",
    "Trying to eat more whole foods and less processed stuff. {reflection}",
    "Intermittent fasting update: {duration} hours today. Feeling {effect}.",
    "The hardest part is not the diet itself, but the social pressure to eat differently. {reflection}",
    "Meal photo: {food}. Simple, nutritious, satisfying.",
    "Learning to listen to my body's hunger cues instead of eating by the clock. {insight}",
    "Hydration goal: {amount}L today. {effect}",
    "Replaced my afternoon coffee with green tea. Noticed {effect}.",
  ],
  "Daily Meditation": [
    "Morning sit: {duration} minutes. Mind was {state}. {reflection}",
    "Evening meditation. Let go of {situation} from today. {insight}",
    "Guided meditation on {topic}. The part about {reflection} really resonated.",
    "Sat with discomfort today instead of running from it. {insight}",
    "Body scan meditation. Noticed tension in {body_part}. Breathed into it.",
    "Walking meditation in the {place}. Each step a reminder to be present.",
    "Loving-kindness meditation. Started with myself, then extended outward. {reflection}",
    "My mind was like a monkey today — jumping from thought to thought. {insight}",
    "The gap between stimulus and response. Today I paused before reacting to {situation}.",
    "Meditation is not about clearing the mind, but about not getting lost in thought. {reflection}",
    "Sat for {duration} minutes. Felt {effect} afterward.",
    "Noticed the urge to check my phone during meditation. Sat with the urge instead. {insight}",
  ],
  "Breathing": [
    "Box breathing: 4-count in, 4 hold, 4 out, 4 hold. Did {rounds} rounds. {effect}",
    "4-7-8 breathing before bed. Calmed my nervous system after {situation}.",
    "Alternate nostril breathing. Left side felt {effect}, right side felt different.",
    "Just focused on my breath for {duration} minutes. Nothing else.",
    "Wim Hof method this morning. {rounds} rounds. Feeling {effect}.",
    "Deep belly breathing helps when I feel anxious about {situation}.",
    "The breath is the bridge between mind and body. {reflection}",
    "Counting breaths: 1 to 10, then start over. Kept losing count at {number}. {insight}",
    "Long exhales activate the parasympathetic nervous system. Used this after {situation}.",
    "My breath was shallow all day without me noticing. Deep breathing reset my {state}.",
    "Pranayama practice: {duration} minutes. {reflection}",
    "Breath of fire: {rounds} rounds. Felt {effect}.",
  ],
  "Inner Alchemy": [
    "Working with the lower dantian today. Sensation of {feeling}. {reflection}",
    "Microcosmic orbit practice. Energy moving from {point_a} to {point_b}. {insight}",
    "Three treasures: Jing, Qi, Shen. Working on transforming {reflection}.",
    "Felt a blockage in {body_area}. Breathed into it and {effect}.",
    "The cauldron visualization. Heating the energy at the lower dantian. {reflection}",
    "Today I felt the energy rise up the spine naturally during meditation. {insight}",
    "Connecting heart and mind. Feeling both compassion and clarity. {reflection}",
    "The five-element practice. Water element feels {effect}, wood element feels different.",
    "Earth grounding practice. Walked barefoot for {duration} minutes. {effect}",
    "Golden light visualization. Filled my body with light from {source}. {reflection}",
  ],
  "Daily Weight": [
    "Weigh-in: {weight} kg. {trend}",
    "Morning weight: {weight} kg. Maintaining {reflection}.",
    "Down {amount} kg this week! Small consistent changes are working.",
    "Weight hasn't budged in {days} days. Trusting the process. {reflection}",
    "Measurements today: waist {inches} inches. Progress is slow but real.",
    "Non-scale victory: {achievement}. The scale doesn't tell the whole story.",
    "Up a bit today. Probably water weight from {reason}. Not worried.",
    "Trending in the right direction. {amount} kg down this month.",
    "Focusing on how I feel rather than the number. {reflection}",
    "Weigh-in day. Learning to detach emotionally from the number. {insight}",
  ],
  "Meal Journal": [
    "Breakfast: {food}. {reflection}",
    "Lunch: {food}. Homemade and satisfying.",
    "Dinner: {food}. Cooked with {ingredient}. Turned out {result}.",
    "Snack: {food}. Mindful eating practice.",
    "Today's meals: {meal1} for breakfast, {meal2} for lunch, {meal3} for dinner.",
    "Ate out today. Chose {food} instead of {alternative}. Proud of the choice.",
    "Meal prep: {food}. {amount} portions ready for the week.",
    "Tried a new recipe: {recipe}. {result}",
    "Post-workout meal: {food}. Good protein and complex carbs.",
    "Tea: {type}. {reflection} about the ritual of tea.",
    "Water check: {amount}L today. {effect}",
  ],
  Challenges: [
    "Day {day} of my {goal} challenge. {reflection}",
    "Struggling with {obstacle} today but staying committed. {insight}",
    "Challenge complete! What I learned: {reflection}",
    "Almost gave in today but {action} helped me stay on track.",
    "Week {week} update: {progress}. The momentum is building.",
    "Accountability post: I commit to {goal} for the next {days} days.",
    "Small victory: {achievement}. These add up.",
    "The middle of a challenge is the hardest part. {reflection}",
    "Rewarding myself for reaching milestone: {milestone}. {reward}",
    "Joined the {name} challenge. Starting today. Goal: {goal}.",
  ],
  Gratitude: [
    "Grateful for {thing} today. {reflection}",
    "Three things I'm thankful for: 1. {thing1} 2. {thing2} 3. {thing3}",
    "Gratitude for the small moments. Today it was {situation}.",
    "Thankful for {person}. They {action} and it meant a lot.",
    "Gratitude practice: {duration} minutes reflecting on {reflection}.",
    "I don't say it enough, but I'm grateful for {thing}.",
    "Even the hard days have gifts. Today's gift was {insight}.",
    "Grateful to my body for {function}. I take it for granted too often.",
    "Thankful for this community. {reflection}",
    "Gratitude changes everything. When I focus on {thing}, my whole perspective shifts.",
  ],
  Generosity: [
    "Today I {action} for someone without expecting anything back. {reflection}",
    "The joy of giving is real. Donated to {cause}. {insight}",
    "Small act of kindness: {action}. The person's reaction was {reaction}.",
    "Pay it forward: bought coffee for the person behind me. {reflection}",
    "Volunteered at {place} today. {experience}",
    "Giving is not about money. I gave {resource} and received {insight} in return.",
    "The more you give, the more you have. {reflection}",
    "Anonymous gift left for {person}. The secret joy of anonymous giving.",
    "Shared my {skill} knowledge with someone today. Teaching is its own reward.",
    "Generosity practice: {action}. Felt {effect}.",
  ],
  Accountability: [
    "Check-in: I committed to {goal} and I {result}. {reflection}",
    "Missed my {goal} yesterday. Getting back on track today. {insight}",
    "30-day {goal} streak! Day {day}. {reflection}",
    "Public commitment: I will {action} every day for {days} days.",
    "Weekly review: {progress} on my goals. Adjusting {reflection}.",
    "Failed at {goal} today but learned {insight}. Trying again tomorrow.",
    "Accountability partner check-in. We both {action}. {reflection}",
    "Tracking my {habit} habit. {days} days so far.",
    "The difference between who I am and who I want to be is {reflection}.",
    "Progress report: {achievement}. Still room to grow in {area}.",
  ],
  Kindness: [
    "Random act of kindness: {action}. {reaction}",
    "Today I chose kindness over being right. {reflection}",
    "A stranger {action} for me and it restored my faith in humanity.",
    "Kindness is contagious. I witnessed {situation} and paid it forward.",
    "Being kind to myself today. That's sometimes the hardest kind of kindness.",
    "Words of affirmation: told {person} that {compliment}. Their face lit up.",
    "Held the door, smiled, said thank you. Small kindnesses matter. {reflection}",
    "Practice random kindness and senseless acts of beauty. {action} today.",
    "The kindness of {person} inspired me to {action}.",
    "A gentle word, a listening ear, a helping hand. {reflection}",
  ],
  "Community Policy": [
    "I think we should have a policy about {topic}. My suggestion: {suggestion}.",
    "Feedback on the community guidelines: {reflection}.",
    "How do we handle {situation} as a community? Thoughts?",
    "Proposal: {idea}. Would love to hear what others think.",
    "The moderation approach to {topic} seems balanced. {reflection}",
    "Can we discuss {topic} at the next community meeting?",
    "I appreciate how the community handled {situation}. {reflection}",
    "Suggestion for improving {aspect}: {suggestion}.",
    "The transparency around {topic} is great. More of this please.",
    "Community values should include {value}. {reflection}",
  ],
  Events: [
    "The {event_name} event was wonderful. {reflection}",
    "Looking forward to the next {event_type} gathering. {suggestion}",
    "Attended {event_name}. The best part was {aspect}. {insight}",
    "Post-event reflection: {reflection}. Would love more events like this.",
    "Who else is going to {event_name}? Let's connect.",
    "Event suggestion: {idea}. I think the community would benefit.",
    "The timing of the last event was {feedback}. Maybe earlier next time?",
    "Virtual event tip: {suggestion}. Worked really well for our group.",
    "Highlights from {event_name}: {highlight1}, {highlight2}. {reflection}",
    "First time attending a community event. {experience}",
  ],
  "Member Resonances": [
    "Reading {person}'s post about {topic} really resonated with me. {reflection}",
    "I feel a deep connection to this community. {insight}",
    "Someone shared something vulnerable today and it made me feel less alone. {reflection}",
    "The collective wisdom in this space is remarkable. {example}",
    "Grateful for the resonance I feel when {situation}. {reflection}",
    "It's amazing how {topic} shows up in different people's lives in different ways.",
    "I see a pattern emerging in our shared experiences: {insight}.",
    "What {person} said about {topic} echoes my own experience. {reflection}",
    "The group energy today was {feeling}. I could feel it through the screen.",
    "Someone's comment about {topic} gave me a new perspective. {insight}",
  ],
  "Resonance Circle": [
    "Circle gathering today. Theme was {topic}. My takeaway: {insight}.",
    "In our circle, we explored {topic}. The group energy was {feeling}.",
    "What surfaced in today's circle: {reflection}. Processing this.",
    "Grateful for the safe space to share {topic} with the circle. {insight}",
    "The circle's input on {situation} helped me see {reflection}.",
    "Today's circle exercise: {exercise}. My experience: {experience}.",
    "I witnessed deep vulnerability in the circle today. {reflection}",
    "Circle wisdom: {insight}. This came from the collective, not any one person.",
    "The resonance in today's circle was palpable. {feeling}",
    "Carrying the circle's energy with me throughout the day. {reflection}",
  ],
};

// ── Helper pools ──

const VERSE_POOL = [
  "The Tao that can be told is not the eternal Tao",
  "The sage acts without doing",
  "He who knows does not speak, he who speaks does not know",
  "A good traveler has no fixed plans",
  "When you are content to be simply yourself, no one can threaten you",
  "The softest thing in the world overcomes the hardest",
  "Simplicity, patience, compassion",
  "Knowing others is intelligence; knowing yourself is true wisdom",
  "Nature does not hurry, yet everything is accomplished",
  "The journey of a thousand miles begins with a single step",
  "He who is content is rich",
  "Fill your bowl to the brim and it will spill",
  "Those who know do not speak; those who speak do not know",
  "The wise man is one who knows what he does not know",
  "Mastering others is strength; mastering yourself is true power",
];

const INSIGHT_POOL = [
  "letting go is not giving up, it's making space for what matters",
  "the answer is often found in the stillness, not the noise",
  "trying to control everything is exhausting and pointless",
  "I am not my thoughts — I am the observer of them",
  "simplicity reveals what complexity hides",
  "every ending is a new beginning in disguise",
  "the present moment is all we truly have",
  "resistance creates suffering; acceptance brings peace",
  "we suffer more in imagination than in reality",
  "what we resist persists",
  "the obstacle is the path",
  "surrender is not weakness, it's wisdom",
  "you can't pour from an empty cup",
  "healing is not linear",
  "progress, not perfection",
];

const REFLECTION_POOL = [
  "reminds me that growth is a spiral, not a straight line",
  "I'm learning to be patient with myself",
  "this is harder than I thought it would be, but worth it",
  "small steps every day add up to big changes",
  "I used to think this was about discipline; now I see it's about awareness",
  "the more I practice, the more natural it becomes",
  "I'm not where I want to be, but I'm not where I used to be either",
  "this is a marathon, not a sprint",
  "the hardest part is showing up every single day",
  "I can feel myself changing, slowly but surely",
  "there is no destination, only the path itself",
  "I am learning to enjoy the process rather than obsess over outcomes",
  "some days are easy, some days are hard — both are part of the journey",
  "I'm learning to trust the process",
  "compassion for myself is the foundation of all growth",
];

const SITUATION_POOL = [
  "a difficult conversation with a colleague",
  "a family conflict that triggered old patterns",
  "the stress of work deadlines",
  "feeling overwhelmed by daily responsibilities",
  "a moment of unexpected joy",
  "a setback that felt like failure at first",
  "the challenge of maintaining boundaries",
  "the pressure to meet others' expectations",
  "a conflict between my values and my actions",
  "feeling disconnected from my purpose",
  "the discomfort of uncertainty",
  "a relationship that requires patience and understanding",
  "the challenge of being present",
  "a moment of clarity that changed everything",
  "the simple act of breathing and being",
];

const MEAL_POOL = [
  "oatmeal with berries and nuts",
  "avocado toast with poached eggs",
  "a big green salad with grilled chicken",
  "salmon with roasted vegetables",
  "quinoa bowl with sweet potato and black beans",
  "stir-fried tofu with broccoli and brown rice",
  "simple miso soup with tofu and seaweed",
  "whole wheat pasta with pesto and cherry tomatoes",
  "chia pudding with coconut milk and mango",
  "grilled fish with asparagus and lemon",
  "lentil soup with a side of sourdough",
  "smoothie bowl with granola and banana",
  "buddha bowl with tahini dressing",
  "roasted sweet potato with chickpeas and tahini",
  "overnight oats with almond milk and chia seeds",
];

const FOOD_POOL = ["quinoa", "tofu", "salmon", "avocado", "sweet potato", "kale", "berries", "eggs", "oats", "almonds"];

const RESULT_POOL = ["delicious!", "better than expected", "needs more salt", "perfect comfort food", "a new favorite"];

const WEIGHT_VALUES = [63.5, 64.2, 65.0, 67.8, 72.1, 70.4, 68.9, 71.2, 66.7, 69.3, 62.8, 75.0, 73.1, 74.5, 61.9];

const BODY_PARTS = ["shoulders", "jaw", "lower back", "neck", "hips", "chest"];

const PLACES = ["park", "garden", "beach", "forest trail", "backyard", "living room", "balcony"];

const FEELING_POOL = ["calm", "energized", "grounded", "peaceful", "focused", "light", "centered", "refreshed", "clear"];

// ── Utilities ──

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateContent(channelName) {
  const templates = FRAGMENT_TEMPLATES[channelName];
  if (!templates || templates.length === 0) {
    return `Reflecting on ${channelName.toLowerCase()} today. ${pick(REFLECTION_POOL)}.`;
  }

  const template = pick(templates);

  const fillers = {
    n: String(randomInt(1, 81)),
    verse: pick(VERSE_POOL),
    insight: pick(INSIGHT_POOL),
    reflection: pick(REFLECTION_POOL),
    situation: pick(SITUATION_POOL),
    meal: pick(MEAL_POOL),
    food: pick(FOOD_POOL),
    result: pick(RESULT_POOL),
    weight: String(pick(WEIGHT_VALUES)),
    trend: pick(["Slowly trending down.", "Stable.", "Slight fluctuation, normal.", "Holding steady."]),
    amount: String((Math.random() * 3 + 0.1).toFixed(1)),
    duration: String(randomInt(5, 45)),
    body_part: pick(BODY_PARTS),
    place: pick(PLACES),
    feeling: pick(FEELING_POOL),
    ingredient: pick(FOOD_POOL),
    alternative: pick(FOOD_POOL),
    recipe: pick(["lentil soup", "buddha bowl", "chia pudding", "quinoa salad", "veggie stir-fry"]),
    days: String(randomInt(3, 60)),
    goal: pick(["meditation", "daily exercise", "reading", "mindful eating", "gratitude", "sugar-free"]),
    thing: pick(["my health", "this community", "the morning sunlight", "a warm cup of tea", "my family", "a good book"]),
    thing1: pick(["my health", "good food", "a safe home"]),
    thing2: pick(["kind friends", "this community", "a beautiful sunset"]),
    thing3: pick(["the ability to learn", "a warm bed", "my sense of humor"]),
    person: pick(["a stranger", "my friend", "my partner", "my neighbor", "a colleague", "my mentor"]),
    action: pick(["listened without interrupting", "offered help", "donated", "volunteered", "shared a meal"]),
    cause: pick(["a local food bank", "mental health research", "environmental conservation", "an animal shelter"]),
    reaction: pick(["a huge smile", "tears of gratitude", "a warm hug", "a sincere thank you", "surprise and joy"]),
    place2: pick(["a local shelter", "the community garden", "a nursing home", "the library"]),
    experience: pick(["It was humbling.", "I learned so much.", "It filled my heart.", "I'll do it again soon."]),
    resource: pick(["my time", "my attention", "a listening ear", "a home-cooked meal", "a book I loved"]),
    skill: pick(["cooking", "meditation", "coding", "gardening", "writing", "painting"]),
    exercise: pick(["sharing our biggest challenge", "a silent meditation", "a gratitude round", "a reflecting on the week"]),
    event_name: pick(["Full Moon Gathering", "Weekly Circle", "Community Day", "Mindfulness Workshop", "Tao Te Ching Reading"]),
    event_type: pick(["meditation", "workshop", "social", "learning", "celebration"]),
    aspect: pick(["the organization", "the discussions", "the connections", "the content", "the atmosphere"]),
    suggestion: pick(["it could start earlier", "maybe a hybrid option", "more breakout rooms", "longer Q&A time"]),
    idea: pick(["a book club", "a peer mentoring program", "a weekend retreat", "a skill-sharing workshop"]),
    feedback: pick(["well received", "a bit rushed", "perfect timing", "room for improvement"]),
    highlight1: pick(["deep conversations", "laughter", "shared meals", "silent walks", "group meditation"]),
    highlight2: pick(["new connections", "sunset viewing", "music circle", "storytelling", "dance"]),
    topic: pick(["letting go", "gratitude", "purpose", "connection", "change", "forgiveness", "patience"]),
    example: pick(["how one person's insight becomes everyone's wisdom", "the way we hold space for each other", "how different perspectives reveal the same truth"]),
    value: pick(["respect", "inclusion", "transparency", "kindness", "growth", "authenticity"]),
    achievement: pick(["ran 5k without stopping", "meditated 30 days straight", "cooked every meal this week", "woke up at 5am for a week"]),
    milestone: pick(["first week done", "30-day streak", "first 5k run", "10kg lost", "100 days of meditation"]),
    reward: pick(["treated myself to a massage", "bought that book I wanted", "took a day off to rest"]),
    name: pick(["30-Day Meditation", "Sugar-Free January", "Morning Routine", "Gratitude Journal", "Fitness First"]),
    progress: pick(["made great progress", "hit a plateau", "exceeded my expectations", "stayed consistent"]),
    obstacle: pick(["sugar cravings", "lack of motivation", "time constraints", "negative self-talk", "fatigue"]),
    week: String(randomInt(1, 12)),
    day: String(randomInt(1, 60)),
    habit: pick(["meditation", "journaling", "exercise", "reading", "water intake", "sleep schedule"]),
    area: pick(["patience", "consistency", "self-compassion", "discipline", "presence"]),
    function: pick(["carrying me through the day", "healing itself", "showing up for my workouts", "digesting food"]),
    complaint: pick(["you are so thoughtful", "you make a difference", "I appreciate your presence", "you inspire me"]),
    point_a: pick(["tailbone", "perineum", "lower abdomen"]),
    point_b: pick(["lower back", "spine", "crown of the head"]),
    body_area: pick(["lower abdomen", "chest", "throat", "third eye", "crown"]),
    source: pick(["the sun", "the earth", "the sky", "the heart"]),
    state: pick(["everywhere", "racing", "surprisingly calm", "busy", "quiet", "planning the day"]),
    inches: String(randomInt(30, 40)),
    reason: pick(["eating out yesterday", "salt intake", "that time of month", "not enough sleep"]),
    time: pick(["morning", "afternoon", "evening"]),
    rounds: String(randomInt(3, 10)),
    number: String(randomInt(4, 8)),
    amountL: String((Math.random() * 2 + 1).toFixed(1)),
    meal1: pick(MEAL_POOL),
    meal2: pick(MEAL_POOL),
    meal3: pick(MEAL_POOL),
    type: pick(["green tea", "oolong", "chamomile", "matcha", "peppermint"]),
    compliment: pick(["you are so thoughtful", "you make a difference", "I appreciate your presence", "you inspire me"]),
    exercise2: pick(["writing exercise", "visualization", "partner sharing", "silent reflection"]),
  };

  let result = template;
  for (const [key, value] of Object.entries(fillers)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }

  return result;
}

function pickSourceType() {
  const r = Math.random();
  if (r < 0.6) return "fragment";
  if (r < 0.85) return "short_article";
  return "long_article";
}

function maybeAddLength(content, sourceType) {
  if (sourceType === "short_article") {
    // Add a few more sentences
    return content + "\n\n" + pick([
      "This has been on my mind for a while.",
      "Curious if others have similar experiences.",
      "Would love to hear your thoughts on this.",
      "This is something I'm still figuring out.",
    ]);
  }
  if (sourceType === "long_article") {
    return (
      content +
      "\n\nWhat I've realized through this process is that change doesn't happen overnight. It's the accumulation of small, consistent choices that eventually creates transformation. " +
      "Every day we have the opportunity to choose differently, to respond rather than react, to act rather than procrastinate. " +
      "And over time, these small choices compound into something remarkable.\n\n" +
      pick([
        "The key is to start where you are, use what you have, and do what you can.",
        "There is no final destination — only the ongoing practice of becoming.",
        "And that is the beauty of the path: it never ends.",
      ])
    );
  }
  return content;
}

// ── Main Seeder ──

async function seedFragments(targetCount) {
  console.log(`\n=== Fragment Seeder: ${targetCount} fragments ===\n`);

  // ── Create admin client (bypasses RLS for inserts) ──
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Create or reuse test users ──
  console.log("Setting up test users...");

  // List existing users to find already-created seed users
  const { data: existingList } = await admin.auth.admin.listUsers();
  const testUsers = [];

  for (let i = 0; i < 5; i++) {
    const email = `seeduser_${i}@taomony-test.com`;
    const existing = existingList?.users?.find((u) => u.email === email);
    if (existing) {
      testUsers.push(existing.id);
      console.log(`  User ${i}: reused ${existing.id}`);
      continue;
    }

    // Create new user
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: "test123456!",
      email_confirm: true,
      user_metadata: { display_name: `Test User ${i}` },
    });
    if (error) {
      console.log(`  User ${i}: ${error.message}`);
      continue;
    }
    if (data?.user) {
      testUsers.push(data.user.id);
      console.log(`  User ${i}: ${data.user.id}`);
    }
  }

  if (testUsers.length === 0) {
    console.error("FATAL: Need at least one test user to seed fragments.");
    return;
  }

  console.log(`\nUsing ${testUsers.length} test user(s).`);

  // ── Generate and insert fragments ──
  console.log(`\nGenerating ${targetCount} fragments...`);
  const batchSize = 50;
  let inserted = 0;
  let batch = [];

  // Create varying timestamps over the past 90 days
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < targetCount; i++) {
    const channel = weightedPick(CHANNELS);
    const sourceType = pickSourceType();
    let content = generateContent(channel.name);
    content = maybeAddLength(content, sourceType);

    const user = pick(testUsers);
    const createdAt = new Date(now - Math.random() * ninetyDaysMs).toISOString();
    const updatedAt = createdAt;

    // 90% completed, 5% pending, 3% processing, 2% failed
    const statusRand = Math.random();
    const status =
      statusRand < 0.9 ? "completed" : statusRand < 0.95 ? "pending" : statusRand < 0.98 ? "processing" : "failed";

    const categoryId = CATEGORY_NAME_TO_ID[channel.category] || null;

    batch.push({
      user_id: user,
      content,
      channel_id: channel.id,
      category_id: categoryId,
      source_type: sourceType,
      status,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    if (batch.length >= batchSize) {
      const { error } = await admin.from("raw_fragments").insert(batch);
      if (error) {
        console.error(`  Batch insert failed at ${inserted}: ${error.message}`);
      } else {
        inserted += batch.length;
        process.stdout.write(`\r  Inserted ${inserted}/${targetCount} fragments...`);
      }
      batch = [];
    }
  }

  // Final batch
  if (batch.length > 0) {
    const { error } = await admin.from("raw_fragments").insert(batch);
    if (error) {
      console.error(`  Final batch insert failed: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`\n\nDone. Inserted ${inserted} fragments.\n`);

  // ── Summary ──
  console.log("=== Summary ===");
  const { count, error } = await admin
    .from("raw_fragments")
    .select("*", { count: "exact", head: true });

  if (!error) {
    console.log(`Total fragments in DB: ${count}`);
  }

  // Status breakdown
  for (const s of ["completed", "pending", "processing", "failed"]) {
    const { count: c } = await admin
      .from("raw_fragments")
      .select("*", { count: "exact", head: true })
      .eq("status", s);
    console.log(`  ${s}: ${c || 0}`);
  }
}

// ── CLI ──
const targetCount = parseInt(process.argv[2] || "500", 10);
seedFragments(targetCount).catch((err) => {
  console.error("Seeder failed:", err);
  process.exit(1);
});
