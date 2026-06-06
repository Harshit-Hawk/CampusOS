'use client'

import Link from 'next/link'
import { getInitials, cn } from '@/lib/utils'
import { Users, ArrowRight } from 'lucide-react'
import type { ClubWithLeader } from '@/types/database'

interface ClubCardProps {
  club: ClubWithLeader
  index: number
}

export function ClubCard({ club, index }: ClubCardProps) {
  return (
    <Link
      href={`/clubs/${club.id}`}
      className={`glass rounded-2xl p-5 card-hover animate-fade-in block group`}
      style={{ opacity: 0, animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl gradient-primary flex items-center justify-center text-white text-lg font-bold flex-shrink-0 shadow-lg shadow-[hsl(221_83%_53%/0.2)]">
          {club.logo_url ? (
            <img src={club.logo_url} alt="" className="w-full h-full rounded-xl object-cover" />
          ) : (
            club.name.charAt(0)
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm group-hover:text-blue-400 transition-colors truncate">
            {club.name}
          </h3>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2 leading-relaxed">
            {club.description}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--border)/0.5)]">
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {club.member_count} members
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--muted))] text-[10px] font-medium">
            {club.category}
          </span>
        </div>
        <ArrowRight className="w-4 h-4 text-[hsl(var(--muted-foreground))] group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
      </div>
    </Link>
  )
}
