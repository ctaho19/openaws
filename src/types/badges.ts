export type BadgeId =
  | 'first-exam'
  | 'century'
  | 'all-domains'
  | 'passing-score'
  | 'perfect-10'
  | 'early-bird'
  | 'night-owl'
  | 'streak-7'
  | 'halfway'
  | 'coverage';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: Record<BadgeId, Badge> = {
  'first-exam': {
    id: 'first-exam',
    name: 'First Steps',
    description: 'First Full Exam Completed',
    icon: '🎓',
  },
  'century': {
    id: 'century',
    name: 'Century Club',
    description: '100 Questions Answered',
    icon: '💯',
  },
  'all-domains': {
    id: 'all-domains',
    name: 'Well Rounded',
    description: 'Practiced All 4 Domains',
    icon: '🎯',
  },
  'passing-score': {
    id: 'passing-score',
    name: 'Passing Grade',
    description: 'Scored 80%+ on an Exam',
    icon: '✅',
  },
  'perfect-10': {
    id: 'perfect-10',
    name: 'Perfect Ten',
    description: '10 Correct in a Row',
    icon: '⭐',
  },
  'early-bird': {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Studied Before 8 AM',
    icon: '🌅',
  },
  'night-owl': {
    id: 'night-owl',
    name: 'Night Owl',
    description: 'Studied After 10 PM',
    icon: '🦉',
  },
  'streak-7': {
    id: 'streak-7',
    name: 'Week Warrior',
    description: '7 Day Streak',
    icon: '🔥',
  },
  'halfway': {
    id: 'halfway',
    name: 'Halfway There',
    description: 'Seen 50% of Questions',
    icon: '🏃',
  },
  'coverage': {
    id: 'coverage',
    name: 'Completionist',
    description: 'Seen All Questions',
    icon: '🏆',
  },
};

export function getBadge(id: BadgeId): Badge {
  return BADGES[id];
}
