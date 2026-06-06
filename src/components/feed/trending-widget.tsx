'use client'

import { useEffect, useState } from 'react'
import { getTrendingHashtags } from '@/actions/search'
import { Hash, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import type { Hashtag } from '@/types/database'

export function TrendingWidget() {
  const [hashtags, setHashtags] = useState<Hashtag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getTrendingHashtags().then(res => {
      setHashtags((res.hashtags as Hashtag[]) || [])
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <div className="glass rounded-2xl p-5 animate-pulse">
        <div className="h-6 w-32 bg-[hsl(var(--muted))] rounded mb-4" />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 w-full bg-[hsl(var(--muted))] rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (hashtags.length === 0) return null

  return (
    <div className="glass rounded-2xl p-5 animate-fade-in">
      <h2 className="text-sm font-semibold flex items-center gap-2 mb-4">
        <TrendingUp className="w-4 h-4 text-blue-500" />
        Trending Topics
      </h2>
      <div className="space-y-3">
        {hashtags.map((ht, i) => (
          <Link 
            key={ht.id} 
            href={`/search?q=%23${ht.name}`}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[hsl(var(--muted-foreground))] w-4">{i + 1}</span>
              <div>
                <p className="text-sm font-medium group-hover:text-blue-500 transition-colors flex items-center">
                  <Hash className="w-3 h-3 text-[hsl(var(--muted-foreground))] group-hover:text-blue-500 mr-0.5" />
                  {ht.name}
                </p>
                <p className="text-[10px] text-[hsl(var(--muted-foreground))]">{ht.post_count} posts</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
