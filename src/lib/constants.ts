// XP rewards for various actions
export const XP_REWARDS = {
  CREATE_POST: 10,
  RECEIVE_LIKE: 2,
  COMMENT: 5,
  RECEIVE_COMMENT: 3,
  JOIN_CLUB: 20,
  ATTEND_EVENT: 30,
  CREATE_EVENT: 25,
  FIRST_POST: 50,
  PROFILE_COMPLETE: 40,
} as const

// Level thresholds - XP needed to reach each level
export const LEVEL_THRESHOLDS = [
  0, 150, 300, 500, 750, 1050, 1450, 1900, 2450, 3100, 3800, 4600, 5500, 6550, 7700, 8950, 10350, 11850, 13500, 15300, 17250, 19350, 21600, 24000, 26550, 29250, 32150, 35200, 38450, 41850, 45450, 49200, 53150, 57300, 61650, 66200, 70950, 75900, 81100, 86500, 92100, 97950, 104000, 110300, 116800, 123550, 130550, 137800, 145250, 152950
] as const

export const MAX_LEVEL = LEVEL_THRESHOLDS.length

export function getLevelFromXP(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXPForNextLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return LEVEL_THRESHOLDS[MAX_LEVEL - 1]
  return LEVEL_THRESHOLDS[currentLevel] // next level index is currentLevel (0-indexed)
}

export function getXPProgress(xp: number, level: number): number {
  const currentThreshold = LEVEL_THRESHOLDS[level - 1] || 0
  const nextThreshold = LEVEL_THRESHOLDS[level] || LEVEL_THRESHOLDS[MAX_LEVEL - 1]
  const progress = ((xp - currentThreshold) / (nextThreshold - currentThreshold)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

const STAGES = [
  'Explorer',
  'Contributor',
  'Achiever',
  'Leader',
  'Champion',
  'Ambassador',
  'Visionary',
  'Elite',
  'Legend',
  'Sovereign'
]

const NUMERALS = ['I', 'II', 'III', 'IV', 'V']

// Returns the formatted stage and roman numeral for a given level
export function getStageTitle(level: number): string {
  const safeLevel = Math.max(1, Math.min(50, level))
  const stageIndex = Math.floor((safeLevel - 1) / 5)
  const subLevelIndex = (safeLevel - 1) % 5
  return `${STAGES[stageIndex]} ${NUMERALS[subLevelIndex]}`
}

// Post categories
export const POST_CATEGORIES = [
  { value: 'general', label: 'General', color: 'bg-slate-500' },
  { value: 'academic', label: 'Academic', color: 'bg-blue-500' },
  { value: 'social', label: 'Social', color: 'bg-sky-500' },
  { value: 'events', label: 'Events', color: 'bg-emerald-500' },
  { value: 'announcements', label: 'Announcements', color: 'bg-amber-500' },
  { value: 'achievements', label: 'Achievements', color: 'bg-rose-500' },
] as const

// Club categories
export const CLUB_CATEGORIES = [
  'Technology',
  'Arts',
  'Sports',
  'Music',
  'Science',
  'Literature',
  'Social Service',
  'Business',
  'Gaming',
  'Other',
] as const

// Departments
export const DEPARTMENTS = [
  'Computer Science',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electronics',
  'Information Technology',
  'Biotechnology',
  'Chemical Engineering',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Business Administration',
  'Other',
] as const

// Badge definitions
export const BADGE_DEFINITIONS = [
  { name: 'First Steps', description: 'Create your first post', criteria: 'first_post', icon: '🚀' },
  { name: 'Social Butterfly', description: 'Join 3 clubs', criteria: 'join_3_clubs', icon: '🦋' },
  { name: 'Event Explorer', description: 'Attend 5 events', criteria: 'attend_5_events', icon: '🎪' },
  { name: 'Rising Star', description: 'Reach Level 5', criteria: 'reach_level_5', icon: '⭐' },
  { name: 'Influencer', description: 'Get 50 likes on posts', criteria: 'receive_50_likes', icon: '💫' },
  { name: 'Commentator', description: 'Write 20 comments', criteria: 'write_20_comments', icon: '💬' },
  { name: 'Club Champion', description: 'Lead a club', criteria: 'lead_club', icon: '🏆' },
  { name: 'Campus Legend', description: 'Reach Level 10', criteria: 'reach_level_10', icon: '👑' },
  { name: 'Event Master', description: 'Organize 3 events', criteria: 'organize_3_events', icon: '🎯' },
  { name: 'Profile Pro', description: 'Complete your profile', criteria: 'complete_profile', icon: '✨' },
] as const

export const POSTS_PER_PAGE = 10
export const LEADERBOARD_PER_PAGE = 25
