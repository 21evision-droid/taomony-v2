export const FAQ_ITEMS = [
  { id: 1, q: 'What is the Tao? The core idea of the Tao Te Ching' },
  { id: 2, q: 'How to begin practicing Taoist wisdom' },
  { id: 3, q: 'What exclusive content do members get?' },
  { id: 4, q: "How to apply 'wu wei' in daily life" },
  { id: 5, q: "What does 'highest good is like water' mean?" },
  { id: 6, q: 'How to join the Taomony community' },
  { id: 7, q: 'How is Taoism relevant to modern mindfulness?' },
];

const TITLE_MAP = {
  1:  { zh: '道可道，非常道', en: 'The Tao That Can Be Told' },
  2:  { zh: '天下皆知美之为美', en: 'When People See Some Things as Beautiful' },
  3:  { zh: '不尚贤，使民不争', en: 'Not Exalting the Worthy' },
  4:  { zh: '道冲而用之或不盈', en: 'The Tao Is Empty' },
  5:  { zh: '天地不仁，以万物为刍狗', en: 'Heaven and Earth Are Not Kind' },
  6:  { zh: '谷神不死，是谓玄牝', en: 'The Valley Spirit Never Dies' },
  7:  { zh: '天长地久', en: 'Heaven Is Lasting and Earth Enduring' },
  8:  { zh: '上善若水', en: 'The Highest Good Is Like Water' },
  9:  { zh: '持而盈之，不如其已', en: 'Fill Your Bowl to the Brim' },
  10: { zh: '载营魄抱一，能无离乎', en: 'Carrying Body and Soul' },
  11: { zh: '三十辐共一毂', en: 'Thirty Spokes Share One Hub' },
  12: { zh: '五色令人目盲', en: 'The Five Colors Blind the Eye' },
  13: { zh: '宠辱若惊，贵大患若身', en: 'Favor and Disgrace Cause Alarm' },
  14: { zh: '视之不见，名曰夷', en: 'Looked At but Cannot Be Seen' },
  15: { zh: '古之善为士者，微妙玄通', en: 'The Ancient Masters Were Profound' },
  16: { zh: '致虚极，守静笃', en: 'Empty the Self Completely' },
  17: { zh: '太上，下知有之', en: 'The Highest Rulers' },
  18: { zh: '大道废，有仁义', en: 'When the Great Tao Is Lost' },
  19: { zh: '绝圣弃智，民利百倍', en: 'Banish Wisdom, Discard Knowledge' },
  20: { zh: '绝学无忧', en: 'Stop Learning, End Your Troubles' },
  25: { zh: '有物混成，先天地生', en: 'Something Formed Chaotically, Born Before Heaven and Earth' },
  33: { zh: '知人者智，自知者明', en: 'Knowing Others Is Intelligence; Knowing Yourself Is True Wisdom' },
  38: { zh: '上德不德，是以有德', en: 'Superior Virtue Is Not Virtuous; Therefore It Has Virtue' },
  41: { zh: '上士闻道，勤而行之', en: 'When the Best Hear the Tao, They Practice It Diligently' },
  42: { zh: '道生一，一生二', en: 'The Tao Gives Birth to One; One Gives Birth to Two' },
  58: { zh: '其政闷闷，其民淳淳', en: 'When Government Is Relaxed, the People Are Honest' },
  60: { zh: '治大国若烹小鲜', en: 'Rule a Great Kingdom Like Cooking a Small Fish' },
  63: { zh: '为无为，事无事', en: 'Practice Non-Action; Attend to Non-Doing' },
  64: { zh: '其安易持，其未兆易谋', en: 'What Is Still Is Easy to Hold' },
  66: { zh: '江海所以能为百谷王者', en: 'The River and Sea Rule the Streams by Staying Below' },
  78: { zh: '天下莫柔弱于水', en: 'Nothing in the World Is Softer Than Water' },
  81: { zh: '信言不美，美言不信', en: 'True Words Are Not Beautiful; Beautiful Words Are Not True' },
};

const previews = [
  '道可道，非常道；名可名，非常名。无名天地之始，有名万物之母。故常无欲，以观其妙；常有欲，以观其徼。',
  '天下皆知美之为美，斯恶已；皆知善之为善，斯不善已。故有无相生，难易相成，长短相较，高下相倾，音声相和，前后相随。',
  '不尚贤，使民不争；不贵难得之货，使民不为盗；不见可欲，使民心不乱。是以圣人之治，虚其心，实其腹，弱其志，强其骨。',
  '道冲而用之或不盈，渊兮似万物之宗。挫其锐，解其纷，和其光，同其尘。湛兮似或存。吾不知谁之子，象帝之先。',
  '天地不仁，以万物为刍狗；圣人不仁，以百姓为刍狗。天地之间，其犹橐籥乎？虚而不屈，动而愈出。',
  '谷神不死，是谓玄牝。玄牝之门，是谓天地根。绵绵若存，用之不勤。',
  '天长地久。天地所以能长且久者，以其不自生，故能长生。是以圣人后其身而身先，外其身而身存。',
  '上善若水。水善利万物而不争，处众人之所恶，故几于道。居善地，心善渊，与善仁，言善信，政善治，事善能，动善时。',
  '持而盈之，不如其已；揣而锐之，不可长保。金玉满堂，莫之能守；富贵而骄，自遗其咎。功遂身退，天之道也。',
  '载营魄抱一，能无离乎？专气致柔，能如婴儿乎？涤除玄览，能无疵乎？爱民治国，能无为乎？',
];

const defaultPreview = '道可道，非常道。上善若水。知者不言，言者不知。合抱之木，生于毫末；九层之台，起于累土；千里之行，始于足下。';

const translations = [
  'The Tao that can be spoken is not the eternal Tao. The name that can be named is not the eternal name. "Nothing" is the name of the beginning of heaven and earth. "Something" is the name of the mother of all things. Thus, in eternal non-desire, one observes the mystery; in eternal desire, one observes its manifestations.',
  'When everyone recognizes beauty as beautiful, ugliness arises. When everyone recognizes goodness as good, evil arises. Being and non-being generate each other. Difficult and easy complete each other. Long and short compare with each other. High and low depend on each other. Note and voice harmonize with each other. Before and after follow each other.',
  'Not exalting the worthy keeps people from competing. Not treasuring rare goods keeps people from stealing. Not displaying what is desirable keeps people\'s hearts from being disturbed. Thus the sage governs by emptying the heart, filling the belly, weakening ambition, and strengthening bones.',
  'The Tao is empty — yet its use is inexhaustible. Deep — it seems to be the ancestor of all things. It blunts sharpness, untangles knots, softens glare, and merges with dust. Clear — it seems to remain. I do not know whose child it is — it appears to precede the Great Ancestor.',
  'Heaven and Earth are not kind — they treat all things as straw dogs. The sage is not kind — he treats all people as straw dogs. Between Heaven and Earth is like a bellows — empty yet never exhausted; when moved, it produces more wind.',
];

const defaultTranslation = (n) => `Chapter ${n}: A modern translation of this chapter, exploring the core Taoist wisdom and how it applies to contemporary life.`;

const explanations = [
  'This opening chapter introduces the core concept of the Tao — it cannot be defined or named, yet it is the source of all existence. Lao Tzu invites us to drop our labels and concepts, and to perceive reality directly. In modern life, we are often trapped by the names and categories we create. True wisdom begins when we see beyond them.',
  'Lao Tzu presents a profound insight: opposites arise together. Good and evil, beautiful and ugly, being and non-being — each defines the other. In our polarized world, this chapter reminds us that holding both sides of any duality is the path to genuine balance and harmony.',
  'Lao Tzu does not reject excellence — he warns against the competition that comes from over-valuing it. In modern organizations, excessive KPIs and rankings create internal friction. The sage\'s way is to let each person find their natural role. A profound lesson for workplace culture and personal growth.',
  'The Tao is described as empty yet inexhaustible — like a valley or a vessel. The sage "blunts sharpness, untangles knots, softens glare, and merges with dust." This is not passivity but deep adaptability: the ability to move through the world without friction, neither flaunting nor hiding.',
  'Heaven and Earth treat all things equally — this is their "unkindness," which is actually the highest kindness. The sage does the same: impartial, fair, without favoritism. In a world of bias and partiality, true justice means seeing all beings with equal eyes.',
];

const defaultExplanation = (n) => `Chapter ${n} invites us to explore how ancient Taoist wisdom can bring clarity and calm to our fast-paced modern lives.`;

function buildChapters() {
  return Array.from({ length: 81 }, (_, i) => {
    const chNumber = i + 1;
    const title = TITLE_MAP[chNumber] || { zh: `道德经 第${chNumber}章`, en: `Daodejing Chapter ${chNumber}` };
    const preview = previews[i] || defaultPreview;
    const translation = translations[i] || defaultTranslation(chNumber);
    const explanation = explanations[i] || defaultExplanation(chNumber);

    const comments = [
      { id: 1, author: 'Tranquil Mind', avatar: 'T', text: 'Every time I read this chapter, I find something new.', time: '3h ago', color: '#d4a843' },
      { id: 2, author: 'Mountain Walker', avatar: 'M', text: 'This chapter made me rethink so many assumptions I carry in daily life.', time: 'Yesterday', color: '#5a4a3a' },
    ];

    return {
      id: chNumber,
      number: chNumber,
      titleZh: title.zh,
      titleEn: title.en,
      preview,
      translation,
      explanation,
      likes: Math.floor(Math.random() * 80) + 10,
      comments: comments.slice(0, Math.min((chNumber % 3) + 1, 2)),
      memberOnly: chNumber > 10,
    };
  });
}

export const CHAPTERS = buildChapters();

const POPULAR_ORDER = [8, 25, 33, 64, 78, 38, 41, 42, 58, 60, 63, 66, 81];
const POPULAR_SET = new Set(POPULAR_ORDER);

export const POPULAR_CHAPTERS = [
  ...POPULAR_ORDER.map((n) => CHAPTERS[n - 1]),
  ...CHAPTERS.filter((ch) => !POPULAR_SET.has(ch.number)),
];

export const VIDEO_DATA = {}; // Populated from Supabase at runtime

// Preset key quotes from Tao Te Ching for sharing insights
export const KEY_QUOTES = [
  { id: 1, zh: '道可道，非常道', en: 'The Tao that can be told is not the eternal Tao' },
  { id: 2, zh: '上善若水', en: 'The highest good is like water' },
  { id: 3, zh: '无为而治', en: 'Govern by non-action' },
  { id: 4, zh: '道法自然', en: 'The Tao follows nature' },
  { id: 5, zh: '千里之行，始于足下', en: 'A journey of a thousand miles begins with a single step' },
  { id: 6, zh: '知足者富', en: 'He who knows contentment is rich' },
  { id: 7, zh: '知人者智，自知者明', en: 'Knowing others is wisdom, knowing yourself is enlightenment' },
  { id: 8, zh: '胜人者有力，自胜者强', en: 'Mastering others is strength, mastering yourself is true power' },
  { id: 9, zh: '大巧若拙', en: 'Great skill appears clumsy' },
  { id: 10, zh: '柔弱胜刚强', en: 'Gentleness overcomes strength' },
  { id: 11, zh: '知者不言，言者不知', en: 'Those who know do not speak, those who speak do not know' },
  { id: 12, zh: '治大国若烹小鲜', en: 'Rule a great kingdom like cooking a small fish' },
  { id: 13, zh: '反者道之动', en: 'Returning is the movement of Tao' },
  { id: 14, zh: '大方无隅', en: 'The greatest square has no corners' },
  { id: 15, zh: '大音希声，大象无形', en: 'Great sound is barely heard, the great form is shapeless' },
  { id: 16, zh: '道生一，一生二', en: 'Tao gives birth to one, one gives birth to two' },
  { id: 17, zh: '为学日益，为道日损', en: 'Learning gains daily, Tao loses daily' },
  { id: 18, zh: '夫唯不争，故天下莫能与之争', en: 'By not contending, no one can contend against you' },
];

export const JOURNEY_POSTS = [
  {
    id: 1,
    author: 'Sarah Chen',
    avatar: 'S',
    role: 'Practitioner · 2 yrs',
    keywordId: 17, // 为学日益，为道日损
    excerpt: 'The biggest lesson from three years with the Tao Te Ching isn\'t about knowing more — it\'s about letting go. Letting go of perfection, of controlling outcomes, of the anxiety of "how things should be." Wu wei isn\'t doing nothing — it\'s flowing with life instead of against it.',
    likes: 128,
    comments: 24,
    time: '2 days ago',
    color: '#b8860b',
  },
  {
    id: 2,
    author: 'Marcus Wright',
    avatar: 'M',
    role: 'Meditator · 1 yr',
    keywordId: 2, // 上善若水
    excerpt: 'As a team lead, I started practicing the wisdom of water: benefiting everything without contending. I stopped chasing credit and started creating conditions for my team to grow. The result? Stronger cohesion, better results — without the burnout.',
    likes: 96,
    comments: 18,
    time: '5 days ago',
    color: '#5a4a3a',
  },
  {
    id: 3,
    author: 'Yuki Tanaka',
    avatar: 'Y',
    role: 'Practitioner · 3 yrs',
    keywordId: 4, // 道法自然
    excerpt: 'In this age of information overload, Lao Tzu says "Empty the self completely; abide in deep stillness." I sit for 20 minutes each morning — not meditating on anything, just being still with myself. Slowly, the inner noise fades, and I meet the world with calm.',
    likes: 156,
    comments: 31,
    time: '1 week ago',
    color: '#d4a843',
  },
  {
    id: 4,
    author: 'Emma Foster',
    avatar: 'E',
    role: 'Newcomer · 6 mo',
    keywordId: 3, // 无为而治
    excerpt: 'I used to control everything — every plan, every outcome. The more I pushed, the more exhausted I became. The Tao teaches "wu wei" — not inaction, but non-forcing. When I stopped forcing, the things I had been chasing started arriving on their own.',
    likes: 87,
    comments: 15,
    time: '2 weeks ago',
    color: '#8b7355',
  },
];
