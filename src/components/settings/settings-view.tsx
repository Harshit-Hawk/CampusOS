'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { signOut } from '@/actions/auth'
import { DashboardContainer } from '@/components/ui/dashboard-container'
import { Settings, Moon, Sun, Monitor, Bell, Shield, LogOut, Check, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SettingsView({ userRole }: { userRole: string | null }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [notifications, setNotifications] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [publicProfile, setPublicProfile] = useState(true)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <DashboardContainer title="Settings" subtitle="Manage your preferences and account">
        <div className="animate-pulse space-y-6">
          <div className="glass rounded-2xl h-40"></div>
          <div className="glass rounded-2xl h-40"></div>
        </div>
      </DashboardContainer>
    )
  }

  return (
    <DashboardContainer title="Settings" subtitle="Manage your preferences and account">
      <div className="max-w-3xl space-y-6 animate-fade-in">
        
        {/* Appearance Section */}
        <div className="glass rounded-3xl overflow-hidden border-[hsl(var(--border))]">
          <div className="p-6 border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)]">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sun className="w-5 h-5 text-amber-500" />
              Appearance
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Customize how CampusOS looks on your device.</p>
          </div>
          <div className="p-6 flex flex-wrap gap-4">
            <button
              onClick={() => setTheme('light')}
              className={cn(
                "flex-1 min-w-[120px] p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3",
                theme === 'light' ? "border-blue-500 bg-blue-500/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.3)] bg-transparent"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-900 shadow-sm">
                <Sun className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm">Light</span>
              {theme === 'light' && <div className="absolute top-3 right-3 text-blue-500"><Check className="w-4 h-4" /></div>}
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={cn(
                "flex-1 min-w-[120px] p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative",
                theme === 'dark' ? "border-blue-500 bg-blue-500/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.3)] bg-transparent"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-slate-900 flex items-center justify-center text-slate-100 shadow-sm border border-slate-800">
                <Moon className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm">Dark</span>
              {theme === 'dark' && <div className="absolute top-3 right-3 text-blue-500"><Check className="w-4 h-4" /></div>}
            </button>
            <button
              onClick={() => setTheme('system')}
              className={cn(
                "flex-1 min-w-[120px] p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 relative",
                theme === 'system' ? "border-blue-500 bg-blue-500/5" : "border-[hsl(var(--border))] hover:border-[hsl(var(--muted-foreground)/0.3)] bg-transparent"
              )}
            >
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white shadow-sm">
                <Monitor className="w-6 h-6" />
              </div>
              <span className="font-semibold text-sm">System</span>
              {theme === 'system' && <div className="absolute top-3 right-3 text-blue-500"><Check className="w-4 h-4" /></div>}
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="glass rounded-3xl overflow-hidden border-[hsl(var(--border))]">
          <div className="p-6 border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)]">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              Notifications
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Control how you want to be notified.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Push Notifications</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Receive alerts for important campus events.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notifications} onChange={() => setNotifications(!notifications)} />
                <div className="w-11 h-6 bg-[hsl(var(--muted))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Email Alerts</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Get weekly digests and crucial updates via email.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={emailAlerts} onChange={() => setEmailAlerts(!emailAlerts)} />
                <div className="w-11 h-6 bg-[hsl(var(--muted))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Privacy & Account */}
        <div className="glass rounded-3xl overflow-hidden border-[hsl(var(--border))]">
          <div className="p-6 border-b border-[hsl(var(--border)/0.5)] bg-[hsl(var(--muted)/0.3)]">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              Privacy & Account
            </h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">Manage your visibility and session.</p>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Public Profile</p>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Allow other students to find you in the directory.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={publicProfile} onChange={() => setPublicProfile(!publicProfile)} />
                <div className="w-11 h-6 bg-[hsl(var(--muted))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
            
            <div className="pt-4 border-t border-[hsl(var(--border)/0.5)]">
              <button 
                onClick={() => signOut()}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-red-500/10 text-red-500 font-bold hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>

      </div>
    </DashboardContainer>
  )
}
