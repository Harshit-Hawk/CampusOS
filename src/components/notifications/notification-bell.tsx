'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, Info, AlertCircle, Heart, MessageSquare } from 'lucide-react'
import { fetchNotifications, markAsRead, markAllAsRead } from '@/actions/notifications'
import { createClient } from '@/lib/supabase/client'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import type { Notification } from '@/types/database'
import { toast } from 'sonner'

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
      
      const res = await fetchNotifications()
      if (res.notifications) {
        setNotifications(res.notifications as Notification[])
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!userId) return

    // Subscribe to realtime notifications
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        const newNotif = payload.new as Notification
        setNotifications(prev => [newNotif, ...prev])
        toast(newNotif.title, { description: newNotif.message })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const unreadCount = notifications.filter(n => !n.is_read).length

  async function handleMarkRead(id: string) {
    await markAsRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  async function handleMarkAllRead() {
    await markAllAsRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-pink-500" />
      case 'comment': return <MessageSquare className="w-4 h-4 text-blue-500" />
      case 'announcement': return <AlertCircle className="w-4 h-4 text-amber-500" />
      default: return <Info className="w-4 h-4 text-blue-500" />
    }
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-xl bg-[hsl(var(--muted))] hover:bg-[hsl(var(--muted)/0.8)] transition-colors relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[hsl(var(--background))] animate-pulse" />
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 glass-strong rounded-2xl shadow-xl border border-[hsl(var(--border))] z-50 overflow-hidden animate-scale-in">
            <div className="p-4 border-b border-[hsl(var(--border)/0.5)] flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                Notifications
                {unreadCount > 0 && (
                  <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead}
                  className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors flex items-center gap-1"
                >
                  <Check className="w-3 h-3" /> Mark all read
                </button>
              )}
            </div>
            
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map(n => (
                  <div 
                    key={n.id} 
                    className={`p-4 border-b border-[hsl(var(--border)/0.3)] last:border-0 hover:bg-[hsl(var(--muted)/0.5)] transition-colors ${!n.is_read ? 'bg-[hsl(var(--muted)/0.3)]' : ''}`}
                    onClick={() => { if (!n.is_read) handleMarkRead(n.id) }}
                  >
                    <div className="flex gap-3">
                      <div className="mt-1">{getIcon(n.type)}</div>
                      <div className="flex-1">
                        {n.link ? (
                          <Link href={n.link} className="block group">
                            <p className="text-sm font-medium group-hover:underline">{n.title}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">{n.message}</p>
                          </Link>
                        ) : (
                          <>
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 leading-relaxed">{n.message}</p>
                          </>
                        )}
                        <p className="text-[10px] text-[hsl(var(--muted-foreground)/0.7)] mt-2">
                          {formatRelativeTime(n.created_at || new Date().toISOString())}
                        </p>
                      </div>
                      {!n.is_read && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
