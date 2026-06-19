import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MessageSquareOff } from 'lucide-react'

export default async function CommunitiesPage() {
  // If no communities, show empty state for desktop since pane 1 is visible.
  // On mobile, this empty state is hidden via `hidden md:flex` so the full-width CommunitiesPane takes over.
  // Removing the server redirect fixes the mobile bug where the back button immediately redirects back to the active community.
  return (
    <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 text-center bg-[hsl(var(--background)/0.5)]">
      <div className="w-16 h-16 rounded-2xl bg-[hsl(var(--muted))] flex items-center justify-center mb-4">
        <MessageSquareOff className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
      </div>
      <h3 className="text-xl font-bold text-[hsl(var(--foreground))] mb-2">Welcome to Communities</h3>
      <p className="text-[hsl(var(--muted-foreground))] max-w-sm">
        Select a community from the sidebar to start chatting, or discover new ones to join.
      </p>
    </div>
  )
}
