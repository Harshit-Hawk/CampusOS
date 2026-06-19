'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  GraduationCap, Building2, Briefcase, Search, MapPin,
  MessageCircle, Users, Star, BookOpen, ChevronRight, Filter
} from 'lucide-react'
import { getAlumniDirectory, getJobReferrals, getAlumniStories } from '@/actions/alumni'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { DEPARTMENTS } from '@/lib/constants'

export default function AlumniPage() {
  const [alumni, setAlumni] = useState<any[]>([])
  const [referrals, setReferrals] = useState<any[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'directory' | 'referrals' | 'stories'>('directory')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDept, setFilterDept] = useState('')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [alumniData, referralsData, storiesData] = await Promise.all([
        getAlumniDirectory(),
        getJobReferrals(),
        getAlumniStories(),
      ])
      setAlumni(alumniData)
      setReferrals(referralsData)
      setStories(storiesData)
    } catch (e) {
      console.error('Failed to load alumni data:', e)
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    try {
      const data = await getAlumniDirectory({
        search: searchQuery || undefined,
        department: filterDept || undefined,
      })
      setAlumni(data)
    } catch (e) {
      console.error('Search failed:', e)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(handleSearch, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, filterDept])

  const tabs = [
    { id: 'directory', label: 'Directory', icon: Users, count: alumni.length },
    { id: 'referrals', label: 'Job Referrals', icon: Briefcase, count: referrals.length },
    { id: 'stories', label: 'Success Stories', icon: Star, count: stories.length },
  ]

  const jobTypeColors: Record<string, string> = {
    'full-time': 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    'part-time': 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    'internship': 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    'contract': 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    'freelance': 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }

  return (
    <DashboardContainer title="Alumni Network" description="Connect with graduates and explore opportunities">
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
            <span className="px-1.5 py-0.5 rounded-md bg-[hsl(var(--muted))] text-[10px] font-bold">
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'directory' && (
        <>
          {/* Search */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[hsl(var(--muted-foreground))]" />
              <input
                type="text" value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, company, position..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-sm"
            >
              <option value="">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {/* Alumni Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 rounded-2xl bg-[hsl(var(--muted))] animate-pulse" />
              ))
            ) : alumni.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <GraduationCap className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                <h3 className="font-semibold mb-2">No alumni found</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">Try adjusting your search filters</p>
              </div>
            ) : (
              alumni.map((alum, i) => (
                <motion.div
                  key={alum.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-hover"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-[hsl(var(--muted))] flex items-center justify-center overflow-hidden shrink-0">
                      {alum.profiles?.avatar_url ? (
                        <img src={alum.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <GraduationCap className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm text-[hsl(var(--foreground))] truncate">
                        {alum.profiles?.full_name}
                      </h3>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {alum.profiles?.department}
                      </p>
                    </div>
                    {alum.is_mentor_available && (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium shrink-0">
                        Mentor
                      </span>
                    )}
                  </div>

                  {(alum.company || alum.position) && (
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs text-[hsl(var(--foreground))]">
                        {alum.position && <span className="font-medium">{alum.position}</span>}
                        {alum.position && alum.company && ' at '}
                        {alum.company}
                      </span>
                    </div>
                  )}

                  {alum.location && (
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">{alum.location}</span>
                    </div>
                  )}

                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-3">
                    Batch {alum.graduation_year} {alum.industry && `• ${alum.industry}`}
                  </p>

                  {alum.mentor_topics?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {alum.mentor_topics.slice(0, 3).map((topic: string, j: number) => (
                        <span key={j} className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'referrals' && (
        <div className="space-y-4">
          {referrals.length === 0 ? (
            <div className="text-center py-16">
              <Briefcase className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No referrals yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Alumni will post job referrals here</p>
            </div>
          ) : (
            referrals.map((ref, i) => (
              <motion.div
                key={ref.id}
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-hover"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-[hsl(var(--foreground))]">{ref.role_title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                      <span className="text-sm text-[hsl(var(--muted-foreground))]">{ref.company}</span>
                      {ref.location && (
                        <>
                          <span className="text-[hsl(var(--muted-foreground))]">•</span>
                          <MapPin className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                          <span className="text-sm text-[hsl(var(--muted-foreground))]">{ref.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${jobTypeColors[ref.job_type] || ''}`}>
                    {ref.job_type?.replace('-', ' ')}
                  </span>
                </div>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">{ref.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                      {ref.profiles?.avatar_url && (
                        <img src={ref.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Referred by {ref.profiles?.full_name}
                    </span>
                  </div>
                  {ref.application_url && (
                    <a href={ref.application_url} target="_blank" rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-blue-500 text-white text-xs font-medium hover:bg-blue-600 transition-colors">
                      Apply <ChevronRight className="w-3 h-3 inline" />
                    </a>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {activeTab === 'stories' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stories.length === 0 ? (
            <div className="col-span-full text-center py-16">
              <Star className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No stories yet</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Alumni success stories will appear here</p>
            </div>
          ) : (
            stories.map((story, i) => (
              <motion.div
                key={story.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.05 }}
                className="p-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] card-hover"
              >
                {story.image_url && (
                  <img src={story.image_url} alt="" className="w-full h-40 object-cover rounded-xl mb-4" />
                )}
                <h3 className="font-semibold text-[hsl(var(--foreground))] mb-2">{story.title}</h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3 mb-4">{story.content}</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[hsl(var(--muted))] overflow-hidden">
                    {story.profiles?.avatar_url && (
                      <img src={story.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-[hsl(var(--foreground))]">{story.profiles?.full_name}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}
    </DashboardContainer>
  )
}
