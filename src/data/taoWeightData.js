// Demo video data for Taomony Eating
// In production, this data comes from the taoweight_videos Supabase table.
export const TAO_WEIGHT_DEMO_VIDEOS = [
  {
    id: 1,
    tab_type: 'why',
    title: 'Why Taomony Eating',
    youtube_video_id: '9YRXKVhPQ1g',
    description:
      'Discover how Taoist wisdom transforms your relationship with food — eating as meditation, not consumption.',
    duration_seconds: 300,
    sort_order: 1,
  },
  {
    id: 2,
    tab_type: 'why',
    title: 'Food & Qi Wisdom',
    youtube_video_id: '9YRXKVhPQ1g',
    description:
      'Learn how ancient dietary principles align with modern nutritional science.',
    duration_seconds: 420,
    sort_order: 2,
  },
  {
    id: 3,
    tab_type: 'how',
    title: 'How to Start',
    youtube_video_id: 'PPvHMqibySc',
    description:
      'A practical step-by-step guide to beginning your Taomony eating journey.',
    duration_seconds: 360,
    sort_order: 1,
  },
  {
    id: 4,
    tab_type: 'how',
    title: 'Daily Practice',
    youtube_video_id: 'PPvHMqibySc',
    description:
      'Simple techniques for mindful eating that fit into your everyday routine.',
    duration_seconds: 480,
    sort_order: 2,
  },
];

export const TAB_OPTIONS = [
  { id: 'why', label: 'Why', icon: '💭' },
  { id: 'how', label: 'How', icon: '📋' },
];

// ── Challenge mock data ──────────────────────────────────────

export const CHALLENGE_HABITS = [
  { id: 1, name: 'Morning Warm Water', time: 'Mon - 5-7am', points: 0.5, icon: '💧' },
  { id: 2, name: 'Breakfast - 70% Full', time: 'Daily - 7-8am', points: 0.5, icon: '☕' },
  { id: 3, name: 'Midday Main Meal', time: 'Mon - 11am-1pm', points: 0.5, icon: '☀️' },
  { id: 4, name: 'Herbal Tea Break', time: 'Mon - 3-5pm', points: 0.5, icon: '🥤' },
  { id: 5, name: 'Taomony Evening Meal', time: 'Mon - 5-7pm', points: 2, icon: '🌿' },
];

export const DINNER_RECIPES = [
  {
    id: 1,
    title: 'Five Elements Balanced Dinner',
    subtitle: '五行平衡晚餐',
    description: 'A harmonious blend of all five elements to nourish your body and calm your mind.',
    ingredients: [
      '🌿 木 (Wood): Steamed asparagus with sesame',
      '🔥 火 (Fire): Red lentil & tomato soup',
      '🌍 土 (Earth): Roasted sweet potato wedges',
      '💫 金 (Metal): Sautéed mushrooms with ginger',
      '🌊 水 (Water): Seaweed & cucumber salad',
    ],
    steps: [
      'Warm the stomach with the soup first',
      'Awaken the palate with the cool salad',
      'Enjoy the main elements in any order',
      'Finish with sweet potato for grounding',
    ],
  },
  {
    id: 2,
    title: 'Red Date & Ginger Qi Soup',
    subtitle: '红枣姜汤',
    description: 'A warming soup that strengthens the digestive fire and nourishes the blood — perfect for evening balance.',
    ingredients: [
      '🍲 红枣 (Red dates): 8-10 pieces, pitted',
      '🧄 生姜 (Ginger): 3 slices, fresh',
      '🌾 糯米 (Sweet rice): 2 tbsp',
      '🍯 蜂蜜 (Honey): 1 tsp to finish',
      '💧 水 (Water): 3 cups',
    ],
    steps: [
      'Rinse sweet rice and soak for 20 minutes',
      'Slice ginger and pit the red dates',
      'Bring water to boil, add rice, ginger, and dates',
      'Simmer on low for 30 minutes until fragrant',
      'Remove from heat, stir in honey, serve warm',
    ],
  },
  {
    id: 3,
    title: 'Winter Melon & Barley Calming Bowl',
    subtitle: '冬瓜薏仁粥',
    description: 'Light, detoxifying, and grounding — this traditional congee helps reduce dampness and calm the mind before sleep.',
    ingredients: [
      '🥒 冬瓜 (Winter melon): 200g, cubed',
      '🌾 薏仁 (Barley): 3 tbsp, soaked',
      '🍚 粳米 (Jasmine rice): 2 tbsp',
      '🥕 胡萝卜 (Carrot): 1 small, diced',
      '🧂 盐 (Sea salt): a pinch',
    ],
    steps: [
      'Soak barley for 1 hour, drain',
      'Cut winter melon into small cubes (skin removed)',
      'Bring 4 cups of water to a boil, add rice and barley',
      'After 20 minutes, add winter melon and carrot',
      'Simmer another 15 minutes until creamy, season with salt',
    ],
  },
];

export const MOCK_RANKINGS = [
  {
    key: '2026-05', label: 'May 2026',
    list: [
      { rank: 1, name: '张伟', avatar: '🧑‍🌾', points: 1280 },
      { rank: 2, name: '李娜', avatar: '👩‍🍳', points: 1150 },
      { rank: 3, name: '王强', avatar: '🧘‍♂️', points: 1020 },
      { rank: 4, name: 'Lisa', avatar: '🧘‍♀️', points: 980 },
      { rank: 5, name: 'Michael', avatar: '🏃‍♂️', points: 950 },
      { rank: 6, name: 'Sarah', avatar: '🧑‍🎨', points: 920 },
      { rank: 7, name: 'David', avatar: '👨‍💻', points: 890 },
      { rank: 8, name: 'Emma', avatar: '🎨', points: 860 },
      { rank: 9, name: 'James', avatar: '📚', points: 830 },
      { rank: 10, name: 'Olivia', avatar: '🧩', points: 800 },
    ],
    myRank: null,
  },
  {
    key: '2026-04', label: 'Apr 2026',
    list: [
      { rank: 1, name: '李娜', avatar: '👩‍🍳', points: 1350 },
      { rank: 2, name: '张伟', avatar: '🧑‍🌾', points: 1200 },
      { rank: 3, name: 'Sarah', avatar: '🧑‍🎨', points: 1080 },
      { rank: 4, name: '王强', avatar: '🧘‍♂️', points: 1010 },
      { rank: 5, name: 'Michael', avatar: '🏃‍♂️', points: 970 },
      { rank: 6, name: 'David', avatar: '👨‍💻', points: 940 },
      { rank: 7, name: 'Emma', avatar: '🎨', points: 910 },
      { rank: 8, name: 'James', avatar: '📚', points: 880 },
      { rank: 9, name: 'Olivia', avatar: '🧩', points: 850 },
      { rank: 10, name: 'Lucas', avatar: '🎵', points: 820 },
    ],
    myRank: { rank: 35, name: 'You', avatar: '🧑', points: 380 },
  },
  {
    key: '2026-03', label: 'Mar 2026',
    list: [
      { rank: 1, name: '张伟', avatar: '🧑‍🌾', points: 1420 },
      { rank: 2, name: 'Lisa', avatar: '🧘‍♀️', points: 1310 },
      { rank: 3, name: '李娜', avatar: '👩‍🍳', points: 1180 },
      { rank: 4, name: '王强', avatar: '🧘‍♂️', points: 1050 },
      { rank: 5, name: 'Sarah', avatar: '🧑‍🎨', points: 990 },
      { rank: 6, name: 'Michael', avatar: '🏃‍♂️', points: 960 },
      { rank: 7, name: 'Emma', avatar: '🎨', points: 930 },
      { rank: 8, name: 'David', avatar: '👨‍💻', points: 900 },
      { rank: 9, name: 'Olivia', avatar: '🧩', points: 870 },
      { rank: 10, name: 'James', avatar: '📚', points: 840 },
    ],
    myRank: { rank: 42, name: 'You', avatar: '🧑', points: 310 },
  },
  {
    key: '2026-02', label: 'Feb 2026',
    list: [
      { rank: 1, name: '王强', avatar: '🧘‍♂️', points: 1250 },
      { rank: 2, name: '张伟', avatar: '🧑‍🌾', points: 1190 },
      { rank: 3, name: 'Emma', avatar: '🎨', points: 1120 },
      { rank: 4, name: 'Lisa', avatar: '🧘‍♀️', points: 1000 },
      { rank: 5, name: '李娜', avatar: '👩‍🍳', points: 970 },
      { rank: 6, name: 'Michael', avatar: '🏃‍♂️', points: 940 },
      { rank: 7, name: 'Sarah', avatar: '🧑‍🎨', points: 910 },
      { rank: 8, name: 'David', avatar: '👨‍💻', points: 880 },
      { rank: 9, name: 'Olivia', avatar: '🧩', points: 850 },
      { rank: 10, name: 'Lucas', avatar: '🎵', points: 820 },
    ],
    myRank: null,
  },
  {
    key: '2026-01', label: 'Jan 2026',
    list: [
      { rank: 1, name: '张伟', avatar: '🧑‍🌾', points: 1380 },
      { rank: 2, name: '李娜', avatar: '👩‍🍳', points: 1260 },
      { rank: 3, name: '王强', avatar: '🧘‍♂️', points: 1150 },
      { rank: 4, name: 'Michael', avatar: '🏃‍♂️', points: 1030 },
      { rank: 5, name: 'Lisa', avatar: '🧘‍♀️', points: 1000 },
      { rank: 6, name: 'Emma', avatar: '🎨', points: 970 },
      { rank: 7, name: 'Sarah', avatar: '🧑‍🎨', points: 940 },
      { rank: 8, name: 'David', avatar: '👨‍💻', points: 910 },
      { rank: 9, name: 'James', avatar: '📚', points: 880 },
      { rank: 10, name: 'Olivia', avatar: '🧩', points: 850 },
    ],
    myRank: { rank: 31, name: 'You', avatar: '🧑', points: 450 },
  },
  {
    key: '2025-12', label: 'Dec 2025',
    list: [
      { rank: 1, name: 'Lisa', avatar: '🧘‍♀️', points: 1450 },
      { rank: 2, name: '张伟', avatar: '🧑‍🌾', points: 1320 },
      { rank: 3, name: '李娜', avatar: '👩‍🍳', points: 1210 },
      { rank: 4, name: '王强', avatar: '🧘‍♂️', points: 1080 },
      { rank: 5, name: 'Sarah', avatar: '🧑‍🎨', points: 1020 },
      { rank: 6, name: 'Michael', avatar: '🏃‍♂️', points: 990 },
      { rank: 7, name: 'Emma', avatar: '🎨', points: 960 },
      { rank: 8, name: 'David', avatar: '👨‍💻', points: 930 },
      { rank: 9, name: 'Olivia', avatar: '🧩', points: 900 },
      { rank: 10, name: 'Lucas', avatar: '🎵', points: 870 },
    ],
    myRank: null,
  },
];

export const COMMENT_TAGS = [
  { id: 'all', label: 'All' },
  { id: 'weight-loss', label: 'Weight Loss' },
  { id: 'blood-sugar', label: 'Blood Sugar' },
  { id: 'recipes', label: 'Recipes' },
  { id: 'wellness', label: 'Wellness' },
];

export const MOCK_COMMENTS = [
  {
    id: 1, author: '李娜', avatar: '👩‍🍳', time: '2 hours ago', tag: 'blood-sugar', module: 'challenge', subModule: 'challenge-discussion',
    text: '这个月的挑战太棒了！每天晚上坚持做养生晚餐，血糖明显稳定了很多。推荐红枣姜汤👍',
    likes: 5, liked: false,
    replies: [
      { id: 101, author: '张伟', avatar: '🧑‍🌾', time: '1 hour ago', text: '同感！我已经瘦了3斤了💪', likes: 2, liked: false },
      { id: 102, author: 'Sarah', avatar: '🧑‍🎨', time: '30 min ago', text: '红枣姜汤真的很好喝，我加了点枸杞', likes: 1, liked: false },
    ],
  },
  {
    id: 2, author: '王强', avatar: '🧘‍♂️', time: '5 hours ago', tag: 'wellness', module: 'challenge', subModule: 'challenge-discussion',
    text: '这个月不小心忘记打卡了好几次，下个月一定要坚持满勤！',
    likes: 8, liked: false,
    replies: [
      { id: 201, author: 'Lisa', avatar: '🧘‍♀️', time: '4 hours ago', text: '加油！一起坚持💪', likes: 3, liked: false },
    ],
  },
  {
    id: 3, author: 'Michael', avatar: '🏃‍♂️', time: '1 day ago', tag: 'recipes', module: 'challenge', subModule: 'challenge-discussion',
    text: '晚餐食谱很实用，特别是冬瓜薏仁粥，晚上吃完很舒服。',
    likes: 4, liked: false,
    replies: [],
  },
  {
    id: 4, author: 'Sarah', avatar: '🧘‍♀️', time: '3 days ago', tag: 'wellness', module: 'meditate', subModule: 'meditation-guide',
    text: 'The beginner meditation course changed my morning routine completely. I actually look forward to waking up now.',
    likes: 12, liked: false,
    replies: [],
  },
  {
    id: 5, author: 'David', avatar: '👨‍💻', time: '1 week ago', tag: 'wellness', module: 'sleep', subModule: 'sleep-stories',
    text: 'The sleep stories are incredibly relaxing. The bamboo forest one puts me out in under 5 minutes.',
    likes: 8, liked: false,
    replies: [
      { id: 301, author: 'Emma', avatar: '🎨', time: '5 days ago', text: 'Same here! The rain sound layer is my favorite part.', likes: 2, liked: false },
    ],
  },
  {
    id: 6, author: 'Michael', avatar: '🏃‍♂️', time: '2 weeks ago', tag: 'wellness', module: 'home', subModule: 'wisdom-library',
    text: 'The Tao Te Ching daily guidance has become my morning anchor. Reading a chapter each day before work changed my mindset.',
    likes: 15, liked: false,
    replies: [],
  },
];

export const MOCK_ANNOUNCEMENTS = [
  {
    id: 1, type: 'result', icon: '🏆', pinned: true,
    title: 'May Leaderboard Results Are In!',
    summary: 'Zhang Wei takes the top spot with 1,280 points this month. The top 3 all crossed 1,000 points — our best month yet! Check out the full rankings.',
    date: 'May 15, 2026', likes: 24, liked: false,
    action: { label: 'View Leaderboard', tab: 'leaderboard' },
  },
  {
    id: 2, type: 'challenge', icon: '🔥',
    title: 'New Challenge: 7-Day Sugar Reset',
    summary: 'Starting June 1st — eliminate added sugars for 7 days. Earn double points for signing up with a friend. Let\'s reset together!',
    date: 'May 14, 2026', likes: 18, liked: false,
    action: null,
  },
  {
    id: 3, type: 'milestone', icon: '🎉',
    title: '100 Members Completed 30-Day Challenge!',
    summary: 'Our community is growing stronger every day. A hundred members have now completed the full 30-day Taoist wellness challenge. Thank you for your dedication!',
    date: 'May 10, 2026', likes: 32, liked: false,
    action: null,
  },
  {
    id: 4, type: 'tip', icon: '💡',
    title: 'Evening Walk for Blood Sugar Control',
    summary: 'A 15-minute walk after dinner can significantly improve blood sugar levels. It\'s one of the simplest yet most effective habits you can build.',
    date: 'May 8, 2026', likes: 15, liked: false,
    action: null,
  },
  {
    id: 5, type: 'event', icon: '📢',
    title: 'Live Session: Taoist Nutrition Basics',
    summary: 'Join us this Saturday for a live Q&A on integrating Taoist eating principles into your daily life. Bring your questions!',
    date: 'May 5, 2026', likes: 9, liked: false,
    action: { label: 'Set Reminder', tab: '' },
  },
  {
    id: 6, type: 'tip', icon: '🌙',
    title: 'Sleep Better with Taoist Evening Routine',
    summary: 'A calm evening routine is essential for both weight management and blood sugar control. Try dimming lights 1 hour before bed.',
    date: 'May 3, 2026', likes: 12, liked: false,
    action: null,
  },
  {
    id: 7, type: 'milestone', icon: '⭐',
    title: 'Team Achievements: Top 3 Share Their Secrets',
    summary: 'Zhang Wei, Li Na, and Wang Qiang share their tips for staying consistent with daily wellness habits.',
    date: 'Apr 28, 2026', likes: 20, liked: false,
    action: null,
  },
  {
    id: 8, type: 'challenge', icon: '🥗',
    title: 'Recipe Highlight: Three Ingredient Dinner',
    summary: 'This week\'s community favorite — a simple Taoist dinner that takes only 15 minutes to prepare.',
    date: 'Apr 25, 2026', likes: 14, liked: false,
    action: null,
  },
];
