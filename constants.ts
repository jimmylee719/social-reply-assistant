import { Goal, Gender, TopicCategory, Tone } from './types';

export const GENDERS: { id: Gender; label: string; icon: string }[] = [
  { id: Gender.Male, label: '我是男生', icon: '♂️' },
  { id: Gender.Female, label: '我是女生', icon: '♀️' },
];

export const GOALS: {
  id: Goal;
  label: string;
  description: string;
  icon: string;
}[] = [
  {
    id: Goal.Friendship,
    label: '純交友',
    description: '建立柏拉圖式的友誼關係',
    icon: '🤝',
  },
  {
    id: Goal.Dating,
    label: '找對象',
    description: '尋找認真、穩定的戀愛關係',
    icon: '❤️',
  },
  {
    id: Goal.Flirting,
    label: '想曖昧',
    description: '享受調情、友達以上的氛圍',
    icon: '😉',
  },
  {
    id: Goal.Casual,
    label: '純約會',
    description: '尋求輕鬆、無負擔的親密關係',
    icon: '🔥',
  },
  {
    id: Goal.Business,
    label: '純商業',
    description: '建立信任，達成商業合作目標',
    icon: '💼',
  },
];

export const TONES: { id: Tone; label: string; }[] = [
    { id: Tone.Formal, label: '正式' },
    { id: Tone.Flirty, label: '曖昧' },
    { id: Tone.Humorous, label: '幽默' },
    { id: Tone.Direct, label: '直接' },
    { id: Tone.Gentle, label: '溫和' },
];

export const TOPIC_CATEGORIES: { id: TopicCategory; label: string }[] = [
    { id: TopicCategory.Hobbies, label: '興趣嗜好' },
    { id: TopicCategory.Travel, label: '旅遊經驗' },
    { id: TopicCategory.Food, label: '美食' },
    { id: TopicCategory.Work, label: '工作與夢想' },
    { id: TopicCategory.Deep, label: '深度問題' },
    { id: TopicCategory.Funny, label: '有趣/輕鬆' },
];