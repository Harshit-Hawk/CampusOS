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
  VOLUNTEER_COMPLETE: 25,
  CERTIFICATE_VERIFIED: 30,
  EVENT_REGISTER: 5,
  MENTORSHIP_COMPLETE: 40,
  MOCK_INTERVIEW: 15,
  MARKETPLACE_SALE: 10,
  ALUMNI_STORY: 20,
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

// Rank tiers based on XP
export const RANK_TIERS = [
  { name: 'Bronze', minXP: 0, color: '#CD7F32', gradient: 'from-amber-700 to-amber-500' },
  { name: 'Silver', minXP: 1000, color: '#C0C0C0', gradient: 'from-gray-400 to-gray-300' },
  { name: 'Gold', minXP: 5000, color: '#FFD700', gradient: 'from-yellow-500 to-amber-400' },
  { name: 'Platinum', minXP: 15000, color: '#E5E4E2', gradient: 'from-slate-300 to-zinc-200' },
  { name: 'Diamond', minXP: 35000, color: '#B9F2FF', gradient: 'from-cyan-300 to-blue-300' },
  { name: 'Legend', minXP: 75000, color: '#FF6B6B', gradient: 'from-rose-500 to-purple-500' },
] as const

export function getRankTier(xp: number): typeof RANK_TIERS[number] {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (xp >= RANK_TIERS[i].minXP) return RANK_TIERS[i]
  }
  return RANK_TIERS[0]
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

// Volunteer team types
export const VOLUNTEER_TEAM_TYPES = [
  { value: 'technical', label: 'Technical Team', icon: '💻' },
  { value: 'registration', label: 'Registration Team', icon: '📋' },
  { value: 'hospitality', label: 'Hospitality Team', icon: '🤝' },
  { value: 'logistics', label: 'Logistics Team', icon: '📦' },
  { value: 'photography', label: 'Photography Team', icon: '📸' },
  { value: 'media', label: 'Media Team', icon: '🎬' },
  { value: 'other', label: 'Other', icon: '⚙️' },
] as const

// Certificate platforms
export const CERTIFICATE_PLATFORMS = [
  { value: 'ibm', label: 'IBM', icon: '🔵' },
  { value: 'google', label: 'Google', icon: '🟢' },
  { value: 'microsoft', label: 'Microsoft', icon: '🟦' },
  { value: 'cisco', label: 'Cisco', icon: '🔴' },
  { value: 'aws', label: 'AWS', icon: '🟧' },
  { value: 'coursera', label: 'Coursera', icon: '📘' },
  { value: 'udemy', label: 'Udemy', icon: '🟣' },
  { value: 'nptel', label: 'NPTEL', icon: '🇮🇳' },
  { value: 'hackathon', label: 'Hackathon', icon: '🏆' },
  { value: 'workshop', label: 'Workshop', icon: '🔧' },
  { value: 'internship', label: 'Internship', icon: '💼' },
  { value: 'other', label: 'Other', icon: '📄' },
] as const

// Marketplace categories
export const MARKETPLACE_CATEGORIES = [
  { value: 'books', label: 'Books', icon: '📚' },
  { value: 'electronics', label: 'Electronics', icon: '💻' },
  { value: 'notes', label: 'Notes', icon: '📝' },
  { value: 'lab_equipment', label: 'Lab Equipment', icon: '🔬' },
  { value: 'hostel_essentials', label: 'Hostel Essentials', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const

// Marketplace item conditions
export const ITEM_CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' },
] as const

// Broadcast message types
export const BROADCAST_MESSAGE_TYPES = [
  { value: 'event_reminder', label: 'Event Reminder', icon: '⏰' },
  { value: 'venue_change', label: 'Venue Change', icon: '📍' },
  { value: 'food_announcement', label: 'Food Announcement', icon: '🍕' },
  { value: 'emergency', label: 'Emergency', icon: '🚨' },
  { value: 'deadline_update', label: 'Deadline Update', icon: '📅' },
  { value: 'mentor_announcement', label: 'Mentor Announcement', icon: '👨‍🏫' },
  { value: 'general', label: 'General', icon: '📢' },
  { value: 'custom', label: 'Custom', icon: '✉️' },
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
  { name: 'Volunteer Hero', description: 'Complete 5 volunteer duties', criteria: 'volunteer_5_events', icon: '🦸' },
  { name: 'Certified Pro', description: 'Verify 3 certificates', criteria: 'verify_3_certs', icon: '📜' },
  { name: 'Mentor Guide', description: 'Complete 3 mentorship sessions', criteria: 'mentor_3_sessions', icon: '🧭' },
  { name: 'Marketplace Star', description: 'Complete 5 sales', criteria: 'marketplace_5_sales', icon: '⭐' },
  { name: 'Interview Ready', description: 'Complete 3 mock interviews', criteria: 'mock_3_interviews', icon: '🎤' },
] as const

export const POSTS_PER_PAGE = 10
export const LEADERBOARD_PER_PAGE = 25
