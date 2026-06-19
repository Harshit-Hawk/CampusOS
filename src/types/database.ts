export interface Profile {
  id: string
  full_name: string
  email?: string
  avatar_url?: string
  bio?: string
  department?: string
  year?: number
  roll_no?: string
  username?: string
  is_verified?: boolean
  verification_type?: 'student' | 'faculty' | 'institution' | 'organization' | null
  role: 'student' | 'faculty' | 'admin' | 'alumni' | 'club_leader' | 'user'
  xp_points: number
  level: number
  rank_tier?: string
  campus_coins: number
  skills?: string[]
  portfolio_bio?: string
  portfolio_projects?: any[]
  is_portfolio_public?: boolean
  portfolio_slug?: string
  instagram_url?: string
  linkedin_url?: string
  github_url?: string
  created_at: string
  updated_at: string
}

export interface Event {
  id: string
  title: string
  description?: string
  start_date: string
  end_date?: string
  location?: string
  banner_url?: string
  event_type?: string
  organizer_id: string
  club_id?: string
  max_participants?: number
  is_featured?: boolean
  status?: string
  created_at: string
}

export interface Club {
  id: string
  name: string
  description?: string
  logo_url?: string
  banner_url?: string
  category?: string
  leader_id?: string
  is_active?: boolean
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  category?: string
  image_url?: string
  likes_count: number
  comments_count: number
  created_at: string
}
