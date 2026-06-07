'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { fetchClub, fetchClubApplications, processApplication, fetchClubAnnouncements, postClubAnnouncement, fetchClubPositions, createClubPosition, promoteClubMember, fetchClubAnalytics, removeClubMember } from '@/actions/clubs'
import { getInitials, formatRelativeTime } from '@/lib/utils'
import { ArrowLeft, Loader2, Users, ClipboardList, MessageSquare, Shield, Check, X, Briefcase, BarChart3, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function ManageClubPage() {
  const params = useParams()
  const router = useRouter()
  const clubId = params.id as string

  const [club, setClub] = useState<any>(null)
  const [members, setMembers] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [positions, setPositions] = useState<any[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'members' | 'applications' | 'positions' | 'announcements' | 'analytics'>('applications')

  // Form states
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const result = await fetchClub(clubId)
      if (result.error || !result.club) {
        router.push('/clubs')
        return
      }
      
      // Ensure only leader can access
      if (result.club.leader_id !== result.userId) {
        toast.error("Unauthorized")
        router.push(`/clubs/${clubId}`)
        return
      }

      setClub(result.club)
      setMembers(result.members || [])
      setUserId(result.userId || null)
      
      // Fetch everything else
      const [apps, anns, pos, stats] = await Promise.all([
        fetchClubApplications(clubId),
        fetchClubAnnouncements(clubId),
        fetchClubPositions(clubId),
        fetchClubAnalytics(clubId)
      ])

      setApplications(apps.applications || [])
      setAnnouncements(anns.announcements || [])
      setPositions(pos.positions || [])
      setAnalytics(stats.analytics || null)
      
      setLoading(false)
    }
    load()
  }, [clubId, router])

  async function handleApprove(appId: string) {
    const res = await processApplication(appId, 'approved')
    if (res.error) toast.error(res.error)
    else {
      setApplications(prev => prev.filter(a => a.id !== appId))
      toast.success('Application approved')
    }
  }

  async function handleReject(appId: string) {
    const res = await processApplication(appId, 'rejected')
    if (res.error) toast.error(res.error)
    else {
      setApplications(prev => prev.filter(a => a.id !== appId))
      toast.success('Application rejected')
    }
  }

  async function handlePostAnnouncement(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content) return
    setActionLoading(true)
    const res = await postClubAnnouncement(clubId, title, content)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Announcement posted!')
      setTitle('')
      setContent('')
      const anns = await fetchClubAnnouncements(clubId)
      setAnnouncements(anns.announcements || [])
    }
    setActionLoading(false)
  }

  async function handleCreatePosition(e: React.FormEvent) {
    e.preventDefault()
    if (!title || !content) return
    setActionLoading(true)
    const res = await createClubPosition(clubId, title, content) // reusing title/content state for simplicity
    if (res.error) toast.error(res.error)
    else {
      toast.success('Position created!')
      setTitle('')
      setContent('')
      const pos = await fetchClubPositions(clubId)
      setPositions(pos.positions || [])
    }
    setActionLoading(false)
  }

  async function handlePromote(targetUserId: string, newRole: string) {
    const res = await promoteClubMember(clubId, targetUserId, newRole)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Role updated!')
      setMembers(prev => prev.map(m => m.user_id === targetUserId ? { ...m, role: newRole } : m))
    }
  }

  async function handleRemove(targetUserId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return
    const res = await removeClubMember(clubId, targetUserId)
    if (res.error) toast.error(res.error)
    else {
      toast.success('Member removed')
      setMembers(prev => prev.filter(m => m.user_id !== targetUserId))
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto"><div className="glass rounded-2xl h-64 animate-pulse" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push(`/clubs/${clubId}`)} className="p-2 rounded-xl hover:bg-[hsl(var(--muted))] transition-colors">
            <ArrowLeft className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
          </button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Manage {club.name}</h1>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">Recruitment, Feed, and Leadership</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 space-y-2">
          <button onClick={() => setActiveTab('applications')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'applications' ? 'gradient-primary text-white shadow-md' : 'glass hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]'}`}>
            <ClipboardList className="w-4 h-4" /> Applications {applications.length > 0 && <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs">{applications.length}</span>}
          </button>
          <button onClick={() => setActiveTab('positions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'positions' ? 'gradient-primary text-white shadow-md' : 'glass hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]'}`}>
            <Briefcase className="w-4 h-4" /> Open Positions
          </button>
          <button onClick={() => setActiveTab('announcements')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'announcements' ? 'gradient-primary text-white shadow-md' : 'glass hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]'}`}>
            <MessageSquare className="w-4 h-4" /> Announcements
          </button>
          <button onClick={() => setActiveTab('members')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'members' ? 'gradient-primary text-white shadow-md' : 'glass hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]'}`}>
            <Shield className="w-4 h-4" /> Leadership & Roles
          </button>
          <button onClick={() => setActiveTab('analytics')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${activeTab === 'analytics' ? 'gradient-primary text-white shadow-md' : 'glass hover:bg-[hsl(var(--muted)/0.5)] text-[hsl(var(--muted-foreground))]'}`}>
            <BarChart3 className="w-4 h-4" /> Analytics
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 space-y-6 animate-fade-in">
          
          {activeTab === 'applications' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-6">Pending Applications</h2>
              {applications.length > 0 ? (
                <div className="space-y-4">
                  {applications.map((app: any) => (
                    <div key={app.id} className="p-5 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                            {app.profiles?.avatar_url ? <img src={app.profiles.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(app.profiles?.full_name || 'U')}
                          </div>
                          <div>
                            <Link href={`/profile/${app.profiles?.roll_no}`} className="font-medium hover:underline text-blue-400">{app.profiles?.full_name}</Link>
                            <p className="text-xs text-[hsl(var(--muted-foreground))]">{formatRelativeTime(app.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleApprove(app.id)} className="px-3 py-1.5 bg-green-500/10 text-green-500 hover:bg-green-500/20 rounded-lg text-sm font-medium transition-colors">Approve</button>
                          <button onClick={() => handleReject(app.id)} className="px-3 py-1.5 bg-red-500/10 text-red-500 hover:bg-red-500/20 rounded-lg text-sm font-medium transition-colors">Reject</button>
                        </div>
                      </div>
                      {app.position_id && (
                        <p className="mt-3 text-sm font-medium text-amber-500">Applied for Position ID: {app.position_id}</p>
                      )}
                      {app.message && (
                        <div className="mt-3 p-3 bg-[hsl(var(--background))] rounded-lg border border-[hsl(var(--border)/0.5)]">
                          <p className="text-sm">"{app.message}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[hsl(var(--muted-foreground))]">No pending applications right now.</p>
              )}
            </div>
          )}

          {activeTab === 'positions' && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Create Open Position</h2>
                <form onSubmit={handleCreatePosition} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Position Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Treasurer, Marketing Lead" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Description & Requirements</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} required rows={3} placeholder="What are the responsibilities?" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none" />
                  </div>
                  <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                    {actionLoading ? 'Creating...' : 'Post Position'}
                  </button>
                </form>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Active Positions</h2>
                <div className="space-y-3">
                  {positions.map(p => (
                    <div key={p.id} className="p-4 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.5)] flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{p.title}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))]">{p.description}</p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 font-medium">Open</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'announcements' && (
            <div className="space-y-6">
              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Post Announcement</h2>
                <form onSubmit={handlePostAnnouncement} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Title</label>
                    <input value={title} onChange={e => setTitle(e.target.value)} required placeholder="Important Update" className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-[hsl(var(--muted-foreground))]">Message Content</label>
                    <textarea value={content} onChange={e => setContent(e.target.value)} required rows={4} className="w-full px-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-[hsl(var(--border))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] resize-none" />
                  </div>
                  <button type="submit" disabled={actionLoading} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-sm font-medium transition-colors">
                    {actionLoading ? 'Posting...' : 'Post to Feed'}
                  </button>
                </form>
              </div>

              <div className="glass rounded-2xl p-6">
                <h2 className="text-lg font-semibold mb-4">Recent Announcements</h2>
                <div className="space-y-4">
                  {announcements.map(a => (
                    <div key={a.id} className="p-4 rounded-xl bg-[hsl(var(--background))] border border-[hsl(var(--border)/0.5)]">
                      <p className="font-semibold text-sm">{a.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] mb-2">{formatRelativeTime(a.created_at)}</p>
                      <p className="text-sm text-[hsl(var(--foreground)/0.9)]">{a.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="glass rounded-2xl p-6">
              <h2 className="text-lg font-semibold mb-4">Manage Roles</h2>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">Promote members to leadership positions. This will give them access to manage club features based on their tier.</p>
              
              <div className="space-y-3">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-[hsl(var(--muted)/0.5)] border border-[hsl(var(--border)/0.5)]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                        {getInitials(m.profiles?.full_name || 'U')}
                      </div>
                      <p className="text-sm font-medium">{m.profiles?.full_name}</p>
                    </div>
                    {m.user_id !== userId && (
                      <div className="flex items-center gap-2">
                        <select
                          value={m.role}
                          onChange={(e) => handlePromote(m.user_id, e.target.value)}
                          className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-xs py-1.5 px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                        >
                          <option value="member">Member</option>
                          <option value="core_team">Core Team</option>
                          <option value="treasurer">Treasurer</option>
                          <option value="secretary">Secretary</option>
                          <option value="vice_president">Vice President</option>
                          <option value="president">President</option>
                        </select>
                        <button onClick={() => handleRemove(m.user_id)} className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors" title="Remove Member">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {m.user_id === userId && (
                      <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-500 font-medium capitalize">{m.role.replace('_', ' ')} (You)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-2xl p-6">
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1 font-medium tracking-wide uppercase">Total Members</p>
                  <p className="text-4xl font-black text-blue-500">{analytics.member_count}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Currently active in club</p>
                </div>
                <div className="glass rounded-2xl p-6">
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1 font-medium tracking-wide uppercase">Engagement</p>
                  <p className="text-4xl font-black text-emerald-500">{analytics.engagement_score || 0}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Interaction score</p>
                </div>
                <div className="glass rounded-2xl p-6">
                  <p className="text-sm text-[hsl(var(--muted-foreground))] mb-1 font-medium tracking-wide uppercase">Activity</p>
                  <p className="text-4xl font-black text-amber-500">{analytics.activity_score || 0}</p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">Event & Resource score</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Application Funnel</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Total Applications</span>
                      <span className="font-bold">{analytics.applications.total}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Approved</span>
                      <span className="font-bold text-green-500">{analytics.applications.approved}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Pending</span>
                      <span className="font-bold text-amber-500">{analytics.applications.pending}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">Rejected</span>
                      <span className="font-bold text-red-500">{analytics.applications.rejected}</span>
                    </div>
                  </div>
                </div>
                <div className="glass rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-4">Role Distribution</h3>
                  <div className="space-y-4">
                    {Object.entries(analytics.roles).map(([role, count]: any) => (
                      <div key={role} className="flex items-center justify-between">
                        <span className="text-sm capitalize text-[hsl(var(--muted-foreground))]">{role.replace('_', ' ')}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
