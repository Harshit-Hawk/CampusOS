'use client'

import { useState, useEffect } from 'react'
import { getDashboardStats, fetchAllUsers, updateUserRole } from '@/actions/admin'
import { fetchClubs } from '@/actions/clubs'
import { fetchEvents } from '@/actions/events'
import { deleteClubAdmin, deleteEventAdmin } from '@/actions/admin'
import { getInitials, cn } from '@/lib/utils'
import { Shield, Users, CalendarDays, Newspaper, Zap, Search, ChevronDown, Trash2, Loader2, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { AssignClubLeaderModal } from '@/components/admin/assign-club-leader-modal'
import { OverviewChart } from '@/components/admin/overview-chart'
import { BannersTab } from '@/components/admin/banners-tab'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { StatCard } from '@/components/ui/stat-card'
import { EmptyState } from '@/components/ui/empty-state'
import { ListSkeleton, CardGridSkeleton } from '@/components/ui/skeleton'

const adminTabs = [
  { value: 'overview', label: 'Overview', icon: Shield },
  { value: 'users', label: 'Users', icon: Users },
  { value: 'clubs', label: 'Clubs', icon: Users },
  { value: 'events', label: 'Events', icon: CalendarDays },
  { value: 'banners', label: 'Banners', icon: ImageIcon },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({ totalUsers: 0, totalClubs: 0, totalEvents: 0, totalPosts: 0 })
  const [users, setUsers] = useState<any[]>([])
  const [clubs, setClubs] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [assigningClubLeaderToUserId, setAssigningClubLeaderToUserId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      if (activeTab === 'overview') {
        const s = await getDashboardStats()
        setStats(s)
      } else if (activeTab === 'users') {
        const r = await fetchAllUsers(search || undefined)
        setUsers(r.users || [])
      } else if (activeTab === 'clubs') {
        const r = await fetchClubs()
        setClubs(r.clubs || [])
      } else if (activeTab === 'events') {
        const r = await fetchEvents()
        setEvents(r.events || [])
      }
      setLoading(false)
    }
    const timer = setTimeout(load, 300)
    return () => clearTimeout(timer)
  }, [activeTab, search])

  async function handleRoleChange(userId: string, role: string) {
    const targetUser = users.find(u => u.id === userId)
    if (role === 'club_leader') {
      if (targetUser?.role === 'admin') {
        toast.error('Admins cannot be club leaders')
        return
      }
      setAssigningClubLeaderToUserId(userId)
      return
    }

    const result = await updateUserRole(userId, role)
    if (result.error) toast.error(result.error)
    else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      toast.success('Role updated')
    }
  }

  async function handleDeleteClub(clubId: string) {
    const result = await deleteClubAdmin(clubId)
    if (result.error) toast.error(result.error)
    else {
      setClubs(prev => prev.filter(c => c.id !== clubId))
      toast.success('Club deleted')
    }
  }

  async function handleDeleteEvent(eventId: string) {
    const result = await deleteEventAdmin(eventId)
    if (result.error) toast.error(result.error)
    else {
      setEvents(prev => prev.filter(e => e.id !== eventId))
      toast.success('Event deleted')
    }
  }

  return (
    <DashboardContainer title="Admin Dashboard" subtitle="Manage your campus platform">

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto animate-fade-in">
        {adminTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              'px-4 py-2 rounded-xl text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap',
              activeTab === tab.value
                ? 'gradient-primary text-white shadow-md shadow-[hsl(221_83%_53%/0.2)]'
                : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        activeTab === 'overview' ? <CardGridSkeleton /> : <ListSkeleton />
      ) : (
        <>
          {/* Overview */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                {[
                  { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
                  { label: 'Active Clubs', value: stats.totalClubs, icon: Users, color: 'text-sky-400' },
                  { label: 'Total Events', value: stats.totalEvents, icon: CalendarDays, color: 'text-cyan-400' },
                  { label: 'Total Posts', value: stats.totalPosts, icon: Newspaper, color: 'text-amber-400' },
                ].map((stat, i) => (
                  <StatCard 
                    key={stat.label} 
                    title={stat.label} 
                    value={stat.value} 
                    icon={stat.icon} 
                    colorClass={stat.color} 
                    delay={(i + 1) * 0.05} 
                  />
                ))}
              </div>
              
              <div className="glass rounded-2xl p-6 mt-6 animate-fade-in stagger-5" style={{ opacity: 0 }}>
                <h3 className="text-lg font-semibold mb-6">Platform Engagement Growth</h3>
                <OverviewChart />
              </div>
            </>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[hsl(var(--muted))] border border-transparent text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.5)] transition-all"
                />
              </div>

              <div className="glass rounded-2xl overflow-hidden">
                {users.map(user => (
                  <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-3 border-b border-[hsl(var(--border)/0.3)] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-sm font-semibold shrink-0">
                        {user.avatar_url ? <img src={user.avatar_url} alt="" className="w-full h-full rounded-full object-cover" /> : getInitials(user.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{user.roll_no ? `Roll No: ${user.roll_no}` : `@${user.username}`} · {user.department || 'No dept'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                      {user.role !== 'admin' && user.role !== 'faculty' ? (
                        <span className="text-xs text-blue-400 font-medium whitespace-nowrap">{user.xp_points} XP</span>
                      ) : (
                        <span className="text-xs text-[hsl(var(--muted-foreground))] font-medium whitespace-nowrap hidden sm:inline">Staff</span>
                      )}
                      <select
                        value={user.role}
                        onChange={e => handleRoleChange(user.id, e.target.value)}
                        className="px-2 py-1.5 rounded-lg bg-[hsl(var(--muted))] text-xs border border-[hsl(var(--border))] focus:outline-none cursor-pointer"
                      >
                        <option value="user">User</option>
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="faculty">Faculty</option>
                        {user.role !== 'admin' && <option value="club_leader">Club Leader</option>}
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clubs Management */}
          {activeTab === 'clubs' && (
            <div className="glass rounded-2xl overflow-hidden animate-fade-in">
              {clubs.map((club: any) => (
                <div key={club.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[hsl(var(--border)/0.3)] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-white font-bold shrink-0">
                      {club.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{club.name}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{club.member_count} members · {club.category}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClub(club.id)}
                    className="p-2 shrink-0 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {clubs.length === 0 && (
                <EmptyState 
                  icon={Users} 
                  title="No clubs found" 
                  description="There are currently no clubs registered on the platform." 
                />
              )}
            </div>
          )}

          {/* Events Management */}
          {activeTab === 'events' && (
            <div className="glass rounded-2xl overflow-hidden animate-fade-in">
              {events.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between gap-4 px-5 py-3 border-b border-[hsl(var(--border)/0.3)] last:border-0 hover:bg-[hsl(var(--muted)/0.3)] transition-colors">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl gradient-accent flex items-center justify-center text-white shrink-0">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{event.title}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">{new Date(event.start_date).toLocaleDateString()} · {event.registered_count} registered</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="p-2 shrink-0 rounded-lg hover:bg-red-500/10 text-[hsl(var(--muted-foreground))] hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {events.length === 0 && (
                <EmptyState 
                  icon={CalendarDays} 
                  title="No events found" 
                  description="There are currently no events scheduled on the platform." 
                />
              )}
            </div>
          )}

          {/* Banners Management */}
          {activeTab === 'banners' && (
            <div className="animate-fade-in">
              <BannersTab />
            </div>
          )}
        </>
      )}

      <AssignClubLeaderModal
        userId={assigningClubLeaderToUserId}
        onClose={() => setAssigningClubLeaderToUserId(null)}
        onSuccess={(userId) => {
          setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: 'club_leader' } : u))
        }}
      />
    </DashboardContainer>
  )
}
