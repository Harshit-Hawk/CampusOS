'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Briefcase, FileText, GraduationCap, Mic, TrendingUp,
  Building2, MapPin, Clock, ChevronRight, Search, BarChart3,
  BookOpen, Plus
} from 'lucide-react'
import { getInternshipListings, getMyApplications, getPlacementStats, getMyMockInterviews } from '@/actions/placement'
import { DashboardContainer } from '@/components/ui/dashboard-container'

export default function PlacementPage() {
  const [activeTab, setActiveTab] = useState<'internships' | 'applications' | 'stats' | 'interviews'>('internships')
  const [internships, setInternships] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [interviews, setInterviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [internData, appData, statsData, interviewData] = await Promise.all([
        getInternshipListings(),
        getMyApplications(),
        getPlacementStats(),
        getMyMockInterviews(),
      ])
      setInternships(internData)
      setApplications(appData)
      setStats(statsData)
      setInterviews(interviewData)
    } catch (e) {
      console.error('Failed to load placement data:', e)
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { id: 'internships', label: 'Internships', icon: Briefcase, count: internships.length },
    { id: 'applications', label: 'My Applications', icon: FileText, count: applications.length },
    { id: 'stats', label: 'Placement Stats', icon: BarChart3 },
    { id: 'interviews', label: 'Mock Interviews', icon: Mic, count: interviews.length },
  ]

  const statusColors: Record<string, string> = {
    applied: 'bg-blue-500/10 text-blue-600',
    under_review: 'bg-amber-500/10 text-amber-600',
    shortlisted: 'bg-purple-500/10 text-purple-600',
    interview: 'bg-cyan-500/10 text-cyan-600',
    offered: 'bg-emerald-500/10 text-emerald-600',
    rejected: 'bg-red-500/10 text-red-600',
    withdrawn: 'bg-gray-500/10 text-gray-600',
  }

  const workTypeColors: Record<string, string> = {
    onsite: 'bg-blue-500/10 text-blue-600',
    remote: 'bg-emerald-500/10 text-emerald-600',
    hybrid: 'bg-purple-500/10 text-purple-600',
  }

  const filteredInternships = internships.filter(i =>
    i.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.role_title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <DashboardContainer title="Placement Hub" description="Career development, internships, and interview preparation">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
          className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Briefcase className="w-5 h-5 text-blue-500 mb-2" />
          <p className="text-2xl font-bold">{internships.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Active Listings</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.05 }}
          className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <FileText className="w-5 h-5 text-emerald-500 mb-2" />
          <p className="text-2xl font-bold">{applications.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">My Applications</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}
          className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <TrendingUp className="w-5 h-5 text-purple-500 mb-2" />
          <p className="text-2xl font-bold">{stats?.totalPlaced || 0}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Students Placed</p>
        </motion.div>
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 }}
          className="p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <Mic className="w-5 h-5 text-amber-500 mb-2" />
          <p className="text-2xl font-bold">{interviews.length}</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Mock Interviews</p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))]'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'internships' && (
        <>
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
            <input
              type="text" value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search internships..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          <div className="space-y-4">
            {filteredInternships.map((listing, i) => (
              <motion.div
                key={listing.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{listing.role_title}</h3>
                    <div className="flex items-center gap-3 mt-1 text-sm text-[hsl(var(--muted-foreground))]">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />{listing.company}
                      </span>
                      {listing.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />{listing.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${workTypeColors[listing.work_type] || ''}`}>
                    {listing.work_type}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">{listing.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                    {listing.stipend && <span>💰 {listing.stipend}</span>}
                    {listing.duration && <span>⏱️ {listing.duration}</span>}
                  </div>
                  <button className="px-4 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
            {filteredInternships.length === 0 && (
              <div className="text-center py-16">
                <Briefcase className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No internships found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Check back later for new listings</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'applications' && (
        <div className="space-y-3">
          {applications.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No applications yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Apply to internships to track them here</p>
            </div>
          ) : (
            applications.map((app, i) => (
              <motion.div
                key={app.id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">
                    {app.internship_listings?.role_title}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {app.internship_listings?.company} • Applied {new Date(app.applied_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${statusColors[app.status] || ''}`}>
                  {app.status.replace('_', ' ')}
                </span>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats?.totalPlaced || 0}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Total Placed</p>
            </div>
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">₹{stats?.avgPackage?.toFixed(1) || 0}L</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Avg Package</p>
            </div>
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center">
              <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{stats?.topCompanies?.length || 0}</p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Companies</p>
            </div>
          </div>

          {stats?.topCompanies?.length > 0 && (
            <div className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
              <h3 className="font-semibold mb-4">Top Recruiting Companies</h3>
              <div className="flex flex-wrap gap-2">
                {stats.topCompanies.map((company: string, i: number) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                    {company}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'interviews' && (
        <div className="space-y-4">
          <div className="flex justify-end mb-4">
            <a href="/placement/mock-interview"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" />
              Start Mock Interview
            </a>
          </div>
          {interviews.length === 0 ? (
            <div className="text-center py-16">
              <Mic className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No mock interviews yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Start a mock interview to practice</p>
            </div>
          ) : (
            interviews.map((interview, i) => (
              <motion.div
                key={interview.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center gap-4 p-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Mic className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[hsl(var(--foreground))] capitalize">
                    {interview.interview_type} Interview
                    {interview.domain && ` — ${interview.domain}`}
                  </p>
                  <p className="text-xs text-[hsl(var(--muted-foreground))]">
                    {new Date(interview.created_at).toLocaleDateString()}
                  </p>
                </div>
                {interview.total_score !== null && (
                  <div className="text-right">
                    <p className="text-lg font-bold text-[hsl(var(--foreground))]">{interview.total_score}/100</p>
                    <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Score</p>
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      )}
    </DashboardContainer>
  )
}
