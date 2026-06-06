'use client'

import { useState, useEffect } from 'react'
import { fetchUserStats, fetchUserBadges, updateProfile, uploadAvatar } from '@/actions/profile'
import { getGamificationProfile } from '@/actions/gamification'
import { getInitials } from '@/lib/utils'
import { getXPProgress, getXPForNextLevel, getStageTitle, DEPARTMENTS } from '@/lib/constants'
import { XPBar } from '@/components/gamification/xp-bar'
import { LevelIndicator } from '@/components/gamification/level-indicator'
import { StreakWidget } from '@/components/gamification/streak-widget'
import { Users, Calendar, Medal, Newspaper, Shield, BookOpen, Activity, User, Trophy, Edit3, Save, Copy, Loader2, UploadCloud, Star, Mail, Phone, Building } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { Profile } from '@/types/database'
import { Modal } from '@/components/ui/modal'
import { createClient } from '@/lib/supabase/client'

interface ProfileViewProps {
  profile: Profile
  isOwnProfile: boolean
}

export function ProfileView({ profile: initialProfile, isOwnProfile }: ProfileViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [editing, setEditing] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const isAdminOrFaculty = profile.role === 'admin' || profile.role === 'faculty'
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'badges'>('overview')
  const [stats, setStats] = useState({ postsCount: 0, clubsCount: 0, eventsCount: 0 })
  const [badges, setBadges] = useState<any[]>([])
  const [streaks, setStreaks] = useState<any[]>([])

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
      .channel('profile_changes')
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

  async function handleSave(formData: FormData) {
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
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 opacity-70" /> {profile.roll_no}@university.edu</span>
                    </div>
                  </div>
                  {isOwnProfile && (
                    <button onClick={() => setEditing(true)} className="px-5 py-2.5 rounded-xl bg-[hsl(var(--card))] border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))] text-sm font-semibold transition-colors flex items-center gap-2 shadow-sm">
                      <Edit3 className="w-4 h-4" /> Edit Profile
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="glass rounded-3xl p-6 relative flex-1">
            {isOwnProfile && (
              <div className="absolute top-6 right-6">
                <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] text-sm font-medium transition-colors flex items-center gap-2">
                  <Edit3 className="w-4 h-4" /> <span className="hidden sm:inline">Edit Profile</span>
                </button>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
              <div className="relative shrink-0 mt-2 sm:mt-0 group">
                <div className="w-32 h-32 rounded-full gradient-primary flex items-center justify-center text-white text-3xl font-bold border-[6px] border-[hsl(var(--background))] shadow-xl overflow-hidden">
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
                        <UploadCloud className="w-6 h-6 text-white mb-1" />
                        <span className="text-white text-[10px] font-bold">Change</span>
                      </>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
                  </label>
                )}
              </div>
              
              <div className="flex-1 mt-2 flex flex-col items-center sm:items-start text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-1">
                  <h1 className="text-2xl font-bold">{profile.full_name}</h1>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-current" /> {getStageTitle(level)}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] flex items-center justify-center sm:justify-start gap-2 mb-6">
                  Roll No. {profile.roll_no} <Copy className="w-3 h-3 cursor-pointer hover:text-[hsl(var(--foreground))]" onClick={() => { navigator.clipboard.writeText(profile.roll_no); toast.success('Copied!'); }} />
                </p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm text-[hsl(var(--muted-foreground))]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 opacity-70" />
                    {profile.course || 'Course'} · {profile.department || 'Not specified'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 opacity-70" />
                    {profile.semester ? `Semester ${profile.semester}` : `Year ${profile.year || '1'}`}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 opacity-70" />
                    {profile.roll_no}@university.edu
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 opacity-70" />
                    {profile.phone || 'Not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Card: Rank */}
        {profile.role !== 'admin' && profile.role !== 'faculty' && (
          <div className="glass rounded-3xl p-6 w-full lg:w-80 shrink-0 flex flex-col justify-center">
            <p className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-4">Your Rank</p>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                <Star className="w-7 h-7 fill-current" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{Math.max(1, 100 - level * 2)}</span>
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">/128</span>
                </div>
                <p className="text-xs font-medium text-[hsl(var(--muted-foreground))]">Level {level} · {getStageTitle(level)}</p>
              </div>
            </div>
            
            <div className="mt-2">
              <p className="text-xs font-semibold text-[hsl(var(--muted-foreground))] mb-2">Progress to {getStageTitle(level + 1)}</p>
              <div className="w-full bg-[hsl(var(--muted))] rounded-full h-2 mb-2 overflow-hidden flex">
                <div className="h-2 rounded-full bg-blue-500" style={{ width: `${xpProgress}%` }}></div>
              </div>
              <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-medium text-right">{xpPoints.toLocaleString()} / {nextLevelXP.toLocaleString()} XP</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats Row */}
      {!isAdminOrFaculty ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <StatBox icon={Calendar} title="Events Joined" value={stats.eventsCount} iconColor="text-blue-500" bg="bg-blue-500/10" />
          <StatBox icon={Users} title="Clubs Joined" value={stats.clubsCount} iconColor="text-emerald-500" bg="bg-emerald-500/10" />
          <StatBox icon={Medal} title="Badges Earned" value={badges.length} iconColor="text-amber-500" bg="bg-amber-500/10" />
          <StatBox icon={Newspaper} title="Posts Created" value={stats.postsCount} iconColor="text-sky-500" bg="bg-sky-500/10" />
          <StatBox icon={Shield} title="Virtual Rep" value={reputation} iconColor="text-purple-500" bg="bg-purple-500/10" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 animate-fade-in stagger-1" style={{ opacity: 0 }}>
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
          {['Overview', 'Activity', 'Badges'].map(tab => {
            const tabId = tab.toLowerCase() as any
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tabId)}
                className={cn(
                  "pb-4 text-sm font-bold transition-colors relative whitespace-nowrap",
                  activeTab === tabId ? "text-blue-500" : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                )}
              >
                {tab}
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
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-6">
              {isAdminOrFaculty ? (
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
                      {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Administration', 'Strategic Planning', 'Leadership', 'Team Management', 'Academic Advising']).map(skill => (
                        <span key={skill} className="px-3.5 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-sm font-medium border border-[hsl(var(--border)/0.5)] hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all cursor-default">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="glass rounded-3xl p-6">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <User className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> About Me
                    </h3>
                    <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                      {profile.bio || "Enthusiastic student passionate about learning and solving real-world problems through technology. Always eager to collaborate and build impactful projects."}
                    </p>
                  </div>

                  <div className="glass rounded-3xl p-6">
                    <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
                      <Activity className="w-4 h-4 text-[hsl(var(--muted-foreground))]" /> Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {(profile.skills && profile.skills.length > 0 ? profile.skills : ['Web Development', 'JavaScript', 'React.js', 'Node.js', 'Python', 'UI/UX Design']).map(skill => (
                        <span key={skill} className="px-4 py-1.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] text-xs font-semibold border border-[hsl(var(--border))]">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'badges' && (
          <div className="glass rounded-3xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Unlocked Badges
            </h3>
            {badges.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {badges.map((ub: any) => (
                  <div key={ub.id} className="text-center p-4 rounded-2xl bg-[hsl(var(--muted))] card-hover flex flex-col items-center justify-center border border-[hsl(var(--border)/0.5)]">
                    <span className="text-4xl mb-2">{ub.badges?.icon_url || '🏅'}</span>
                    <p className="text-xs font-bold mt-1">{ub.badges?.name}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[hsl(var(--muted-foreground))] text-center py-8">
                No badges earned yet. Start engaging to unlock achievements! ✨
              </p>
            )}
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="max-w-md">
            <h3 className="text-sm font-bold mb-4 ml-2">Recent Activity & Streaks</h3>
            <StreakWidget streaks={streaks} />
          </div>
        )}


      </div>

      {/* Edit Dialog */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Profile" maxWidth="max-w-md">
        <form action={handleSave} className="space-y-4">
          {profile.role !== 'admin' ? (
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
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Bio</label>
            <textarea name="bio" defaultValue={profile.bio || ''} rows={3} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {profile.role !== 'admin' && (
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Course</label>
                <input name="course" placeholder="e.g. B.Tech, M.Tech" defaultValue={profile.course || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
              </div>
            )}
            <div className={profile.role === 'admin' ? "col-span-2" : ""}>
              <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">{profile.role === 'admin' ? 'Organization' : 'Department'}</label>
              <select name="department" defaultValue={profile.department || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm appearance-none">
                <option value="">Select...</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          {profile.role !== 'admin' && (
            <div className="grid grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Mobile Number</label>
            <input name="phone" placeholder="+91 9876543210" defaultValue={profile.phone || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Skills (comma separated)</label>
            <input name="skills" defaultValue={profile.skills?.join(', ') || ''} className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-transparent focus:border-[hsl(var(--ring)/0.5)] focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] outline-none transition-all text-sm" />
          </div>

          <div className="pt-4 border-t border-[hsl(var(--border))] mt-4">
            <button type="submit" className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all card-hover">
              <Save className="w-4 h-4" />
              Save Changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function StatBox({ icon: Icon, title, value, iconColor, bg }: { icon: any, title: string, value: string | number, iconColor: string, bg: string }) {
  const parts = title.split(' ')
  return (
    <div className="glass rounded-3xl p-4 flex items-center gap-3 hover:-translate-y-1 transition-transform border border-[hsl(var(--border)/0.5)]">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", bg, iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-bold leading-tight">{parts[0]}<br/>{parts.slice(1).join(' ') || ' '}</p>
        <p className="text-xl font-black mt-0.5">{value}</p>
      </div>
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
