'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchClub, joinClub, leaveClub, applyToClub, fetchClubApplications, processApplication } from '@/actions/clubs'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { Users, Calendar, UserPlus, UserMinus, ArrowLeft, Loader2, Check, X, ClipboardList, BarChart3, MessageSquare, Briefcase, Shield } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ClubDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [club, setClub] = useState<any>(null)
  const [isMember, setIsMember] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null)
  const [members, setMembers] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const [positions, setPositions] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])

  const [activeTab, setActiveTab] = useState<'feed' | 'members'>('feed')
  const [loadingApps, setLoadingApps] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [applyMessage, setApplyMessage] = useState('')

  useEffect(() => {
    async function load() {
      const [result, role] = await Promise.all([
        fetchClub(clubId),
        import('@/actions/auth').then(m => m.getUserRole())
      ])
      if (result.error) {
        router.push('/clubs')
        return
      }
      setClub(result.club)
      setIsMember(result.isMember || false)
      setApplicationStatus(result.applicationStatus || null)
      setMembers(result.members || [])
      setEvents(result.events || [])
      setPositions(result.positions || [])
      setAnnouncements(result.announcements || [])
      setUserId(result.userId || null)
      setUserRole(role)
      setLoading(false)
    }
    load()
  }, [clubId, router])

  const [analytics, setAnalytics] = useState<any>(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)

  useEffect(() => {
    // Keep for potential future use or remove if not needed
  }, [activeTab, club, clubId, userId, userRole])

  async function handleJoin() {
    // If it's a restricted category, maybe require applying. For now, let's say anyone can Apply, or Join.
    // Let's assume the user has to Apply if they are not the leader.
    setShowApplyModal(true)
  }

  async function handleDirectJoin() {
    setSelectedPosition(null)
    setShowApplyModal(true)
  }

  function handleApplyForPosition(pos: any) {
    setSelectedPosition(pos)
    setShowApplyModal(true)
  }

  async function submitApplication(e: React.FormEvent) {
    e.preventDefault()
    if (!applyMessage.trim()) return
    setActionLoading(true)
    const result = await applyToClub(clubId, applyMessage, selectedPosition?.id)
    if (result.error) {
      toast.error(result.error)
    } else {
      setApplicationStatus('pending')
      setShowApplyModal(false)
      toast.success('Application submitted!')
    }
    setActionLoading(false)
  }

  async function handleLeave() {
    setActionLoading(true)
    const result = await leaveClub(clubId)
    if (result.error) {
      toast.error(result.error)
    } else {
      setIsMember(false)
      setClub((c: any) => c ? { ...c, member_count: c.member_count - 1 } : c)
      toast.success('Left club')
    }
    setActionLoading(false)
  }

  // Removed handleApprove and handleReject as they belong to manage page

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="glass rounded-2xl h-48 animate-pulse" />
        <div className="glass rounded-2xl p-6 animate-pulse">
          <div className="w-48 h-6 rounded bg-[hsl(var(--muted))]" />
        </div>
      </div>
    )
  }

  if (!club) return null

  const isLeader = userId === club.leader_id
  const canManage = isLeader || userRole === 'admin'

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Column (Main Content) */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Club Header */}
          <div className="glass rounded-3xl overflow-hidden animate-fade-in">
            <div className="h-32 gradient-primary relative">
          {club.banner_url && <img src={club.banner_url} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="p-6 -mt-8 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-20 h-20 rounded-xl gradient-primary flex items-center justify-center text-white text-2xl font-bold border-4 border-[hsl(var(--card))] shadow-xl z-10">
              {club.logo_url ? (
                <img src={club.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                club.name.charAt(0)
              )}
            </div>
            <div className="flex-1 mt-2 md:mt-0">
              <h1 className="text-xl font-bold">{club.name}</h1>
              <div className="flex items-center gap-3 text-sm text-[hsl(var(--muted-foreground))]">
                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{club.member_count} members</span>
                <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-xs font-medium">{club.category}</span>
              </div>
            </div>
            
            {/* Action Buttons */}
            {!isLeader && userRole !== 'admin' && (
              <div className="mt-4 md:mt-0">
                {isMember ? (
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 bg-[hsl(var(--muted))] hover:bg-red-500/10 hover:text-red-400"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserMinus className="w-4 h-4" />Leave</>}
                  </button>
                ) : applicationStatus === 'pending' ? (
                  <button disabled className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]">
                    <Loader2 className="w-4 h-4 animate-spin" /> Pending Approval
                  </button>
                ) : (
                  <button
                    onClick={() => setShowApplyModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 gradient-primary text-white shadow-md shadow-[hsl(221_83%_53%/0.2)]"
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4" />Apply to Join</>}
                  </button>
                )}
              </div>
            )}
            
            {canManage && (
              <div className="mt-4 md:mt-0">
                <Link
                  href={`/clubs/${clubId}/manage`}
                  className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] text-[hsl(var(--foreground))]"
                >
                  <Shield className="w-4 h-4" />
                  Manage Settings
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 glass rounded-xl animate-fade-in stagger-1 overflow-x-auto" style={{ opacity: 0 }}>
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'feed' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          <div className="flex items-center justify-center gap-2">
            <MessageSquare className="w-4 h-4" /> Feed
          </div>
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'members' ? 'bg-[hsl(var(--background))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
        >
          Members ({club.member_count})
        </button>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in stagger-2" style={{ opacity: 0 }}>

        {activeTab === 'members' && (
          <div className="glass rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {members.map((m: any) => (
                <Link key={m.id} href={`/profile/${m.profiles?.roll_no}`} className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] hover:bg-[hsl(var(--muted))] transition-colors border border-[hsl(var(--border)/0.3)]">
                  <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                    {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(m.profiles?.full_name || 'U')}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{m.profiles?.full_name}</p>
                    <p className={`text-[10px] capitalize font-semibold ${m.role === 'president' || m.role === 'leader' ? 'text-amber-500' : m.role === 'member' ? 'text-[hsl(var(--muted-foreground))]' : 'text-blue-400'}`}>
                      {m.role.replace('_', ' ')}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'feed' && (
          <div className="space-y-4">
            {announcements.length > 0 ? (
              announcements.map((ann: any) => (
                <div key={ann.id} className="glass rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center text-xs font-semibold overflow-hidden">
                      {ann.profiles?.avatar_url ? <img src={ann.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : getInitials(ann.profiles?.full_name || 'A')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{ann.title}</p>
                      <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{formatRelativeTime(ann.created_at)}</p>
                    </div>
                  </div>
                  <p className="text-sm text-[hsl(var(--foreground)/0.9)] whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))
            ) : (
              <div className="glass rounded-2xl p-12 text-center">
                <p className="text-4xl mb-4">📢</p>
                <p className="text-lg font-medium">No announcements yet</p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Check back later for updates from the club leaders.</p>
              </div>
            )}
          </div>
        )}

          </div>
        </div> {/* End Left Column */}

        {/* Right Column (Sidebar) */}
        <div className="w-full lg:w-80 shrink-0 space-y-6 animate-fade-in stagger-1" style={{ opacity: 0 }}>
          <div className="glass rounded-3xl p-6">
            <h2 className="text-lg font-semibold mb-3">About</h2>
            <p className="text-sm leading-relaxed text-[hsl(var(--foreground)/0.9)] whitespace-pre-wrap">{club.description}</p>
          </div>

          <div className="glass rounded-3xl p-6">
            <h2 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] mb-4">Club Details</h2>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-400" />
                <span>{club.member_count} members</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>{club.category}</span>
              </div>
            </div>
          </div>

          {events.length > 0 && (
            <div className="glass rounded-3xl p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Calendar className="w-5 h-5 text-blue-400" /> Upcoming Events</h2>
              <div className="space-y-3">
                {events.map((event: any) => (
                  <Link key={event.id} href={`/events/${event.id}`} className="block p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)] hover:bg-[hsl(var(--muted))] transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-medium leading-tight truncate">{event.title}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[hsl(var(--background))] capitalize shadow-sm border border-[hsl(var(--border)/0.5)] shrink-0 ml-2">{event.status}</span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">{new Date(event.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

        {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md glass-strong rounded-2xl p-6 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Apply to {club.name} {selectedPosition ? `- ${selectedPosition.title}` : ''}</h2>
              <button onClick={() => setShowApplyModal(false)} className="p-1 rounded-lg hover:bg-[hsl(var(--muted))]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submitApplication} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Why do you want to join?</label>
                <textarea
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Tell the club leaders a bit about yourself..."
                  className="w-full px-3 py-2 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={!applyMessage.trim() || actionLoading}
                className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
