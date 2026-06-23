'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { fetchUserStats, fetchUserBadges, updateProfile, uploadAvatar } from '@/actions/profile'
import { getGamificationProfile } from '@/actions/gamification'
import { getPortfolio, updatePortfolio, getPortfolioSlug } from '@/actions/portfolio'
import { getInitials } from '@/lib/utils'
import { getXPProgress, getXPForNextLevel, getStageTitle, getRankTier, DEPARTMENTS } from '@/lib/constants'
import { XPBar } from '@/components/gamification/xp-bar'
import { LevelIndicator } from '@/components/gamification/level-indicator'
import { StreakWidget } from '@/components/gamification/streak-widget'
import {
  Users, Calendar, Medal, Newspaper, Shield, BookOpen, Activity, User, Trophy,
  Edit3, Save, Copy, Loader2, UploadCloud, Star, Mail, Phone, Building, ArrowRight,
  Code, Award, Heart, GraduationCap, Link2, CheckCircle2, Briefcase, Share2,
  ScanLine, Settings, BadgeCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'
import { CertificatesTab } from '@/components/profile/certificates-tab'
import { DigitalIDCard } from '@/components/profile/digital-id-card'
import { VerifiedBadge } from '@/components/ui/verified-badge'
interface ProfileViewProps {
  profile: Profile
  isOwnProfile: boolean
}

export function ProfileView({ profile: initialProfile, isOwnProfile }: ProfileViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [isIdModalOpen, setIsIdModalOpen] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const isAdminOrFaculty = false // profile.role === 'admin' || profile.role === 'faculty'
  const [activeTab, setActiveTab] = useState<'activity' | 'overview' | 'certificates'>('overview')
  const [stats, setStats] = useState({ postsCount: 0, clubsCount: 0, eventsCount: 0 })
  const [badges, setBadges] = useState<any[]>([])
  const [streaks, setStreaks] = useState<any[]>([])

  // Portfolio state
  const [portfolio, setPortfolio] = useState<any>(null)
  const [portfolioLoading, setPortfolioLoading] = useState(false)

  // Rank state
  const [actualRank, setActualRank] = useState<number | null>(null)
  const [totalUsers, setTotalUsers] = useState<number | null>(null)

  useEffect(() => {
    fetchUserStats(profile.id).then(setStats)
    fetchUserBadges(profile.id).then(r => setBadges(r.badges || []))
    getGamificationProfile(profile.roll_no).then(r => {
      if (!r.error) {
        setStreaks(r.streaks || [])
      }
    })

    // Setup Realtime Subscription
    const supabase = createClient()
    const channel = supabase
      .channel(`profile_changes_${profile.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${profile.id}` },
        (payload) => {
          setProfile((prev) => ({ ...prev, ...payload.new }))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id, profile.roll_no])

  // Fetch actual rank based on XP
  useEffect(() => {
    async function fetchRank() {
      const supabase = createClient()
      
      const { count: higherXPCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('role', 'in', '("admin","faculty")')
        .gt('xp_points', profile.xp_points || 0)
        
      setActualRank((higherXPCount || 0) + 1)
      
      const { count: totalCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('role', 'in', '("admin","faculty")')
        
      setTotalUsers(totalCount || 1)
    }
    fetchRank()
  }, [profile.xp_points])

  // Load portfolio data when tab is selected
  useEffect(() => {
    if (activeTab === 'overview' && !portfolio) {
      loadPortfolio()
    }
  }, [activeTab])

  async function loadPortfolio() {
    setPortfolioLoading(true)
    try {
      const [data] = await Promise.all([
        getPortfolio(isOwnProfile ? undefined : profile.id),
      ])
      setPortfolio(data)
    } catch (e) {
      console.error('Failed to load portfolio:', e)
    } finally {
      setPortfolioLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const result = await updateProfile(formData) as any
    if (result.error) {
      toast.error(result.error)
    } else if (result.data) {
      setProfile(result.data as Profile)
      setEditing(false)
      toast.success('Profile updated!')
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }

    setUploadingAvatar(true)
    
    try {
      const supabase = createClient()
      
      const fileExt = file.name.split('.').pop()
      const filePath = `${profile.id}/avatar.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true, cacheControl: '3600' })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id)

      if (updateError) throw updateError

      toast.success('Avatar updated successfully!')
      setProfile(prev => ({ ...prev, avatar_url: publicUrl }))
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload avatar')
    } finally {
      setUploadingAvatar(false)
    }
  }


  const xpPoints = profile.xp_points || 0
  const reputation = profile.reputation || 0
  const level = profile.level || 1
  
  const xpProgress = getXPProgress(xpPoints, level)
  const nextLevelXP = getXPForNextLevel(level)

  // Tabs configuration
  const tabs = isAdminOrFaculty
    ? []
    : [
        { id: 'overview', label: 'Overview' },
        { id: 'certificates', label: 'Certificates' },
        { id: 'activity', label: 'Activity' },
      ]

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row gap-6 animate-fade-in">
        {/* Left Card: Identity */}
        {/* Left Card: Identity */}
        {isAdminOrFaculty ? (
          <div className="bg-card/50 backdrop-blur-sm rounded-3xl border border-[hsl(var(--border)/0.5)] shadow-sm relative flex-1 p-8">
            <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
              <div className="relative shrink-0 group">
                <div className="w-28 h-28 rounded-full bg-[hsl(var(--background))] flex items-center justify-center text-[hsl(var(--muted-foreground))] text-3xl font-bold border-[4px] border-[hsl(var(--background))] shadow-md overflow-hidden relative">
                  <div className="absolute inset-0 ring-1 ring-inset ring-black/10 dark:ring-white/10 rounded-full z-10" style={{ pointerEvents: 'none' }}></div>
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getInitials(profile.full_name)
                  )}
                </div>
                
                {isOwnProfile && (
                  <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer z-20">
                    {uploadingAvatar ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <>
                        <UploadCloud className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-[10px] font-bold tracking-wider uppercase">Edit</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                )}
              </div>
              
              <div className="flex-1 w-full flex flex-col items-start text-left">
                <div className="flex flex-col sm:flex-row items-baseline justify-between w-full gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">{profile.full_name}</h1>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[hsl(var(--muted-foreground))] font-medium">
                      <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> {profile.role === 'admin' ? 'System Administrator' : 'Faculty Member'}</span>
                      {profile.role !== 'admin' && (
                        <>
                          <span className="text-[hsl(var(--border))]">•</span>
                          <span className="flex items-center gap-1.5">
                            Roll No. {profile.roll_no}
                            <Copy className="w-3 h-3 cursor-pointer hover:text-[hsl(var(--foreground))] transition-colors" onClick={() => { navigator.clipboard.writeText(profile.roll_no); toast.success('Copied!'); }} />
                          </span>
                        </>
                      )}
                      <span className="text-[hsl(var(--border))]">•</span>
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 opacity-70" /> {profile.email || `${profile.roll_no}@university.edu`}</span>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setIsIdModalOpen(true)} className="px-5 py-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        <ScanLine className="w-4 h-4" /> ID Card
                      </button>
                      <button onClick={() => setEditing(true)} className="px-5 py-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                        <Edit3 className="w-4 h-4" /> Edit Profile
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-6 sm:p-8 relative flex-1">
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6">
              
              {/* Avatar */}
              <div className="flex items-start mb-2 sm:mb-0">
                <div className="relative shrink-0 group">
                  <div className="w-20 h-20 sm:w-28 sm:h-28 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold border-4 border-[hsl(var(--background))] shadow-md overflow-hidden">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      getInitials(profile.full_name)
                    )}
                  </div>
                  
                  {isOwnProfile && (
                    <label className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer">
                      {uploadingAvatar ? (
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      ) : (
                        <>
                          <UploadCloud className="w-5 h-5 text-white mb-1" />
                          <span className="text-white text-[10px] font-bold">Change</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                    </label>
                  )}
                </div>
              </div>

              {/* Bio & Details Row */}
              <div className="flex flex-col text-sm text-[hsl(var(--foreground))] flex-1">
                
                {/* Username Row (Top Level) */}
                <div className="flex items-center flex-wrap gap-3 mb-2">
                  <span className="font-bold text-xl sm:text-2xl tracking-tight">
                    {profile.username || profile.roll_no}
                  </span>
                  
                  {isOwnProfile && (
                    <button onClick={() => setEditing(true)} className="p-1 hover:bg-[hsl(var(--muted))] rounded-full transition-colors text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                      <Settings className="w-5 h-5" />
                    </button>
                  )}
                  {profile.role !== 'admin' && profile.role !== 'faculty' && (
                    <span className="ml-auto sm:ml-0 px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 text-[10px] font-bold flex items-center gap-1 uppercase tracking-wider">
                      <Star className="w-3 h-3 fill-current" /> {getStageTitle(level)}
                    </span>
                  )}
                </div>
                
                {/* Full Name & Roll No Row */}
                <div className="text-[hsl(var(--foreground))] font-semibold text-[15px] mb-2 flex items-center gap-2">
                  {profile.full_name} 
                  {profile.is_verified && <VerifiedBadge type={profile.verification_type} />}
                  {profile.username && profile.role !== 'admin' && profile.role !== 'faculty' && (
                    <span className="text-[hsl(var(--muted-foreground))] font-normal text-xs sm:text-sm flex items-center gap-1">
                      · Roll No. {profile.roll_no}
                      <Copy className="w-3 h-3 cursor-pointer hover:text-[hsl(var(--foreground))]" onClick={() => { navigator.clipboard.writeText(profile.roll_no); toast.success('Copied!'); }} />
                    </span>
                  )}
                </div>

                {/* Bio Details */}
                <div className="space-y-0.5 font-medium mb-3">
                  <p>
                    {profile.role === 'faculty'
                      ? [profile.designation, profile.department, profile.college].filter(Boolean).join(' · ')
                      : profile.role === 'admin' 
                      ? (profile.department || 'Department')
                      : `${profile.course || 'Course'} · ${profile.department || 'Department'}`
                    }
                  </p>
                  {profile.role !== 'admin' && profile.role !== 'faculty' && (
                    <p className="text-[hsl(var(--muted-foreground))]">
                      {profile.semester ? `Semester ${profile.semester}` : `Year ${profile.year || '1'}`}
                    </p>
                  )}
                </div>

                {/* Bio Text */}
                {profile.bio && (
                  <div className="whitespace-pre-wrap text-[15px] text-[hsl(var(--foreground))] mb-3 leading-snug">
                    {profile.bio}
                  </div>
                )}

                {/* Social Links inside Bio */}
                {(profile.instagram_url || profile.linkedin_url || profile.github_url) && (
                  <div className="flex items-center gap-3 mb-4">
                    {profile.instagram_url && (
                      <a href={profile.instagram_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-500 hover:bg-pink-500/20 hover:scale-110 transition-all shadow-sm">
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {profile.linkedin_url && (
                      <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 hover:bg-blue-500/20 hover:scale-110 transition-all shadow-sm">
                        <Linkedin className="w-4 h-4" />
                      </a>
                    )}
                    {profile.github_url && (
                      <a href={profile.github_url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[hsl(var(--foreground))]/10 flex items-center justify-center text-[hsl(var(--foreground))] hover:bg-[hsl(var(--foreground))]/20 hover:scale-110 transition-all shadow-sm">
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                )}

                {/* Actions Row */}
                {isOwnProfile && (
                  <div className="flex items-center mt-auto pt-2">
                    <button onClick={() => setIsIdModalOpen(true)} className="flex-1 py-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] text-[hsl(var(--foreground))] text-sm font-semibold transition-colors flex justify-center items-center gap-2 shadow-sm border border-[hsl(var(--border)/0.5)]">
                      <ScanLine className="w-4 h-4" /> Digital ID Card
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        )}

        {/* Right Card: Rank */}
        {profile.role !== 'admin' && profile.role !== 'faculty' && (
          <Link href="/ranks" className="glass rounded-3xl p-6 w-full lg:w-80 shrink-0 relative group hover:border-[hsl(var(--ring)/0.5)] transition-all overflow-hidden flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
              <ArrowRight className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
            </div>
            
            <div className="flex items-center justify-between mb-auto relative z-10">
              <p className="text-sm font-bold text-[hsl(var(--muted-foreground))] group-hover:text-[hsl(var(--foreground))] transition-colors">
                {isOwnProfile ? 'Your Rank' : 'Global Rank'}
              </p>
              {isOwnProfile && actualRank && totalUsers && (actualRank / totalUsers) <= 0.5 && (
                <div className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                  Top {Math.max(1, Math.round((actualRank / totalUsers) * 100))}%
                </div>
              )}
            </div>
            
            <div className="flex flex-col items-center justify-center py-6 relative z-10">
              <div className="relative mb-5">
                <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[hsl(var(--background))] to-[hsl(var(--muted))] border-2 border-[hsl(var(--border))] group-hover:border-blue-500/30 flex items-center justify-center relative z-10 shadow-xl group-hover:scale-105 transition-all duration-500 rotate-3 group-hover:rotate-6">
                  <Star className="w-8 h-8 text-blue-500 drop-shadow-md -rotate-3 group-hover:-rotate-6 transition-transform duration-500" fill="currentColor" />
                </div>
                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-500 border-[3px] border-[hsl(var(--card))] flex items-center justify-center text-white text-xs font-black shadow-sm z-20">
                    {level}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="text-4xl font-black tracking-tight mb-1 text-[hsl(var(--foreground))]">
                  #{actualRank || '-'}
                </h3>
                {isOwnProfile && (
                  <p className="text-sm font-semibold text-blue-500">
                    {getStageTitle(level)}
                  </p>
                )}
              </div>
            </div>
            
            {isOwnProfile && (
              <div className="mt-auto pt-5 border-t border-[hsl(var(--border)/0.5)] relative z-10">
                <div className="flex items-end justify-between mb-2">
                  <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))]">
                    Next: <span className="text-[hsl(var(--foreground))]">{getStageTitle(level + 1)}</span>
                  </p>
                  <p className="text-[10px] font-bold text-blue-500">{xpPoints.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</p>
                </div>
                <div className="w-full bg-[hsl(var(--muted))] rounded-full h-1.5 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${xpProgress}%` }}></div>
                </div>
              </div>
            )}
          </Link>
        )}
      </div>

      {/* Quick Stats Row */}
      {isAdminOrFaculty && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <AdminStatBox icon={Shield} title="System Role" value={<span className="capitalize">{profile.role}</span>} />
          <AdminStatBox 
            icon={profile.role === 'admin' ? Building : BookOpen} 
            title={profile.role === 'admin' ? 'Organization' : 'Department'} 
            value={profile.role === 'admin' ? 'Gateway Education' : (profile.department || 'Administration')} 
          />
          <AdminStatBox icon={Newspaper} title="Announcements" value={stats.postsCount} />
          <AdminStatBox icon={Activity} title="Status" value={<span className="text-emerald-500">Active</span>} />
        </div>
      )}

      {/* Tabs */}
      {!isAdminOrFaculty && (
        <div className="flex overflow-x-auto gap-8 border-b border-[hsl(var(--border))] pb-0 scrollbar-none animate-fade-in stagger-2" style={{ opacity: 0 }}>
          {tabs.map(tab => {
            const tabId = tab.id as any
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "pb-4 text-sm font-bold transition-colors relative whitespace-nowrap",
                  activeTab === tabId ? "text-blue-500" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {tab.label}
                {activeTab === tabId && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Tab Content */}
      <div className="animate-fade-in stagger-3" style={{ opacity: 0 }}>
        {isAdminOrFaculty ? (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-card rounded-3xl p-8 border border-[hsl(var(--border)/0.5)] shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> About
                  </h3>
                  <p className="text-[15px] text-[hsl(var(--muted-foreground))] leading-relaxed">
                    {profile.bio || "Experienced professional focused on fostering academic excellence and driving institutional growth through effective leadership."}
                  </p>
                </div>

                <div className="bg-card rounded-3xl p-8 border border-[hsl(var(--border)/0.5)] shadow-sm">
                  <h3 className="text-lg font-bold tracking-tight text-[hsl(var(--foreground))] mb-4 flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" /> Core Competencies
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Administration', 'Strategic Planning', 'Leadership', 'Team Management', 'Academic Advising']).map((skill: string) => (
                      <span key={skill} className="px-3.5 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium border border-[hsl(var(--border)/0.5)] hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all cursor-default">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'activity' && (
              <div className="max-w-md">
                <h3 className="text-sm font-bold mb-4 ml-2">Recent Activity & Streaks</h3>
                <StreakWidget streaks={streaks} />
              </div>
            )}

            {activeTab === 'overview' && (
          <PortfolioTab
            portfolio={portfolio}
            loading={portfolioLoading}
            isOwnProfile={isOwnProfile}
            profile={profile}
            badges={badges}
          />
        )}

            {activeTab === 'certificates' && (
              <CertificatesTab userId={profile.id} isOwnProfile={isOwnProfile} />
            )}
          </>
        )}
      </div>

      {/* Edit Dialog */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile" maxWidth="max-w-md">
        <form onSubmit={handleSave} className="space-y-4">
          {profile.role !== 'admin' && profile.role !== 'faculty' ? (
            <div>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))] flex items-center justify-between">
                Roll No
                {profile.roll_no_updated && <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">Locked</span>}
              </label>
              <input 
                name="roll_no" 
                defaultValue={profile.roll_no} 
                disabled={profile.roll_no_updated || false}
                required 
                title={profile.roll_no_updated ? "You have already changed your Roll No once." : "You can only change this once!"}
                className={cn(
                  "w-full px-3 py-2 rounded-xl border border-transparent outline-none transition-all text-sm",
                  profile.roll_no_updated 
                    ? "bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] cursor-not-allowed" 
                    : "bg-[hsl(var(--muted))] focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)]"
                )} 
              />
              {!profile.roll_no_updated && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1.5 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-amber-500" /> You can only change your Roll No once.
                </p>
              )}
            </div>
          ) : (
            <input type="hidden" name="roll_no" value={profile.roll_no} />
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Full Name</label>
            <input name="full_name" defaultValue={profile.full_name} required className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Username</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-[hsl(var(--muted-foreground))] font-medium">@</span>
              <input name="username" defaultValue={profile.username || ''} required pattern="^[a-zA-Z0-9_.]{3,20}$" title="Username must be 3-20 characters long and contain only letters, numbers, underscores, and dots." className="w-full pl-8 pr-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" placeholder="your_username" />
            </div>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Must be unique, 3-20 characters (letters, numbers, _, .).</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Bio</label>
            <textarea name="bio" defaultValue={profile.bio || ''} rows={3} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm resize-none" />
          </div>
          {profile.role === 'faculty' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Designation</label>
                <input name="designation" placeholder="e.g. Assistant Professor" defaultValue={profile.designation || ''} required className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">College</label>
                <select name="college" defaultValue={profile.college || ''} required className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm appearance-none">
                  <option value="">Select College...</option>
                  <option value="Gateway Institute of Engineering & Technology (GIET)">Gateway Institute of Engineering & Technology (GIET)</option>
                  <option value="Gateway College of Architecture (GCAD)">Gateway College of Architecture (GCAD)</option>
                  <option value="Gateway College of Pharmacy (GCP)">Gateway College of Pharmacy (GCP)</option>
                </select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.role !== 'admin' && profile.role !== 'faculty' && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Course</label>
                <input name="course" placeholder="e.g. B.Tech, M.Tech" defaultValue={profile.course || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
            )}
            <div className={(profile.role === 'admin' || profile.role === 'faculty') ? "col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">{profile.role === 'admin' ? 'Organization' : 'Department'}</label>
              {profile.role === 'admin' ? (
                <input name="department" placeholder="e.g. Gateway Education" defaultValue={profile.department || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              ) : (
                <select name="department" defaultValue={profile.department || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm appearance-none">
                  <option value="">Select...</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              )}
            </div>
          </div>
          {profile.role !== 'admin' && profile.role !== 'faculty' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Year</label>
                <input name="year" type="number" min={1} max={6} defaultValue={profile.year || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Semester</label>
                <input name="semester" type="number" min={1} max={12} defaultValue={profile.semester || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))] flex items-center justify-between">
              Email Address
              <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">Locked</span>
            </label>
            <input name="email" type="email" defaultValue={profile.email || ''} disabled title="You cannot change your email address after registration." className="w-full px-3 py-2 rounded-xl border border-transparent outline-none transition-all text-sm bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))] flex items-center justify-between">
              Mobile Number
              <span className="text-xs text-amber-500 font-semibold bg-amber-500/10 px-2 py-0.5 rounded-full">Locked</span>
            </label>
            <input name="phone" defaultValue={profile.phone || ''} disabled title="You cannot change your mobile number after registration." className="w-full px-3 py-2 rounded-xl border border-transparent outline-none transition-all text-sm bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))] cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Skills (comma separated)</label>
            <input name="skills" defaultValue={profile.skills?.join(', ') || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
          </div>

          <div className="pt-4 border-t border-[hsl(var(--border))] mt-4">
            <p className="text-sm font-bold text-[hsl(var(--foreground))] mb-3">Social Links (Optional)</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Instagram URL</label>
                <input name="instagram_url" type="url" placeholder="https://instagram.com/..." defaultValue={profile.instagram_url || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">LinkedIn URL</label>
                <input name="linkedin_url" type="url" placeholder="https://linkedin.com/in/..." defaultValue={profile.linkedin_url || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">GitHub URL</label>
                <input name="github_url" type="url" placeholder="https://github.com/..." defaultValue={profile.github_url || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[hsl(var(--border))] mt-4">
            <button type="submit" className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all card-hover">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Digital ID Modal */}
      <Modal isOpen={isIdModalOpen} onClose={() => setIsIdModalOpen(false)} title="Campus Identity Card" maxWidth="max-w-sm">
        <DigitalIDCard profile={profile} />
      </Modal>

    </div>
  )
}

// ─── Portfolio Tab Component ────────────────────────────────────────

function PortfolioTab({
  portfolio, loading, isOwnProfile, profile, badges, onAddCertificate
}: any) {
  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-[hsl(var(--muted))] animate-pulse" />
        ))}
      </div>
    )
  }

  const rank = getRankTier(profile?.xp_points || 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Portfolio Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatBox icon={Award} title="XP Points" value={profile?.xp_points || 0} iconColor="text-amber-500" bg="bg-amber-500/10" />
        <StatBox icon={Medal} title="Certificates Verified" value={portfolio?.certificates?.length || 0} iconColor="text-emerald-500" bg="bg-emerald-500/10" />
        <StatBox icon={Users} title="Clubs Joined" value={portfolio?.clubs?.length || 0} iconColor="text-purple-500" bg="bg-purple-500/10" />
        <StatBox icon={Calendar} title="Events Attended" value={portfolio?.events?.length || 0} iconColor="text-blue-500" bg="bg-blue-500/10" />
        <StatBox icon={Heart} title="Hours Volunteered" value={`${portfolio?.volunteerStats?.total_hours?.toFixed(0) || 0}h`} iconColor="text-rose-500" bg="bg-rose-500/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden group flex flex-col">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors pointer-events-none"></div>
          <h3 className="font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Code className="w-5 h-5" />
            </div>
            Technical & Soft Skills
          </h3>
          <div className="flex flex-wrap gap-2.5 relative z-10">
            {portfolio?.skills?.length > 0 ? portfolio.skills.map((skill: any, i: number) => (
              <span key={i} className="px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-bold hover:bg-blue-500/10 hover:scale-105 transition-all cursor-default shadow-sm">
                {skill.name}
              </span>
            )) : (
              <div className="w-full p-8 rounded-2xl border border-dashed border-[hsl(var(--border))] text-center">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Upload certificates to auto-extract skills</p>
              </div>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden group flex flex-col">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl group-hover:bg-amber-500/20 transition-colors pointer-events-none"></div>
          <h3 className="font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Trophy className="w-5 h-5" />
            </div>
            Achievements
          </h3>
          <div className="flex flex-wrap gap-3 relative z-10">
            {badges?.length > 0 ? badges.map((badge: any, i: number) => (
              <div key={i} className="flex items-center gap-3 pr-4 pl-2 py-2 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all cursor-default">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center text-xl">
                  {badge.badges?.icon_url || '🏅'}
                </div>
                <span className="text-sm font-bold text-[hsl(var(--foreground))]">{badge.badges?.name}</span>
              </div>
            )) : (
              <div className="w-full p-8 rounded-2xl border border-dashed border-[hsl(var(--border))] text-center">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Earn badges through campus engagement</p>
              </div>
            )}
          </div>
        </div>



        {/* Clubs */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden group lg:col-span-2">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-colors pointer-events-none"></div>
          <h3 className="font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500">
              <BookOpen className="w-5 h-5" />
            </div>
            Club Memberships
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
            {portfolio?.clubs?.length > 0 ? portfolio.clubs.map((membership: any, i: number) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:border-purple-500/30 transition-colors cursor-default">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden shrink-0 border border-[hsl(var(--border)/0.5)]">
                  {membership.clubs?.logo_url ? (
                    <img src={membership.clubs.logo_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-[hsl(var(--foreground))] truncate">{membership.clubs?.name}</p>
                  <p className="text-xs font-semibold text-purple-500 mt-0.5 capitalize bg-purple-500/10 px-2 py-0.5 rounded-md inline-block">{membership.role}</p>
                </div>
              </div>
            )) : (
              <div className="col-span-1 sm:col-span-2 p-8 rounded-2xl border border-dashed border-[hsl(var(--border))] text-center">
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">Not a member of any clubs yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Volunteer Experience */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden group lg:col-span-2">
          <div className="absolute right-0 top-0 w-64 h-64 bg-rose-500/5 rounded-full blur-3xl group-hover:bg-rose-500/10 transition-colors pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          <h3 className="font-black text-[hsl(var(--foreground))] mb-6 flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Heart className="w-5 h-5" />
            </div>
            Volunteer Experience
          </h3>
          <div className="relative z-10">
            {portfolio?.volunteerHistory?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {portfolio.volunteerHistory.map((vol: any, i: number) => (
                  <div key={i} className="p-4 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] shadow-sm hover:-translate-y-1 hover:shadow-md transition-all group/vol cursor-default">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-[15px] font-bold text-[hsl(var(--foreground))] leading-tight line-clamp-2 group-hover/vol:text-rose-500 transition-colors">{vol.events?.title}</p>
                      <div className="w-8 h-8 rounded-full bg-rose-500/10 flex items-center justify-center shrink-0">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/20" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {vol.hours_logged}h logged
                      </span>
                      {vol.performance_rating && (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                          <Star className="w-3.5 h-3.5 fill-amber-500" />
                          {vol.performance_rating}/5
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full p-10 rounded-2xl border border-dashed border-[hsl(var(--border))] text-center">
                <Heart className="w-8 h-8 text-[hsl(var(--muted-foreground)/0.5)] mx-auto mb-3" />
                <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">No volunteer experience yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Helper Components ──────────────────────────────────────────────

function StatBox({ icon: Icon, title, value, iconColor, bg }: { icon: any, title: string, value: string | number, iconColor: string, bg: string }) {
  return (
    <div className="glass rounded-2xl p-3.5 flex flex-col justify-between gap-2 hover:-translate-y-1 transition-transform border border-[hsl(var(--border)/0.5)] h-full">
      <div className="flex items-start justify-between w-full gap-2">
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm", bg, iconColor)}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xl sm:text-2xl font-black mt-0.5">{value}</p>
      </div>
      <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-bold leading-tight mt-1">
        {title}
      </p>
    </div>
  )
}

function AdminStatBox({ icon: Icon, title, value }: { icon: any, title: string, value: React.ReactNode }) {
  return (
    <div className="bg-card rounded-2xl p-6 flex flex-col justify-center border border-[hsl(var(--border)/0.6)] shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
      <div className="flex items-center gap-3 mb-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Icon className="w-4 h-4" />
        </div>
        <p className="text-xs text-[hsl(var(--muted-foreground))] font-semibold">{title}</p>
      </div>
      <p className="text-2xl font-bold tracking-tight text-[hsl(var(--foreground))]">{value}</p>
    </div>
  )
}

// ─── Custom Icons ───────────────────────────────────────────────────

function Instagram(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}
