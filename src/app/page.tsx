import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Zap, Users, CalendarDays, Trophy, ArrowRight, Sparkles } from 'lucide-react'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 gradient-mesh" />
      <div className="fixed top-20 left-20 w-[600px] h-[600px] rounded-full bg-[hsl(221_83%_53%/0.06)] blur-[120px] animate-float" />
      <div className="fixed bottom-20 right-20 w-[500px] h-[500px] rounded-full bg-[hsl(263_70%_50%/0.06)] blur-[120px] animate-float" style={{ animationDelay: '2s' }} />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between p-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-[hsl(221_83%_53%/0.25)]">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold">
            Campus<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">OS</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium hover:text-blue-400 transition-colors">
            Sign In
          </Link>
          <Link href="/signup" className="px-5 py-2.5 text-sm font-semibold rounded-xl gradient-primary text-white shadow-lg shadow-[hsl(221_83%_53%/0.25)] hover:opacity-90 transition-opacity">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8 text-sm">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-[hsl(var(--muted-foreground))]">The future of campus engagement</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight max-w-4xl mx-auto">
            Your Campus,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-sky-500 to-cyan-500">
              Supercharged
            </span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto leading-relaxed">
            Connect with peers, join clubs, attend events, and level up your campus experience with
            gamified achievements. CampusOS is where your campus life comes alive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10">
            <Link
              href="/signup"
              className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-lg shadow-xl shadow-[hsl(221_83%_53%/0.3)] hover:opacity-90 transition-all duration-200 flex items-center gap-2 animate-pulse-glow"
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 rounded-xl glass text-[hsl(var(--foreground))] font-semibold text-lg hover:bg-[hsl(var(--muted))] transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pb-32">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Users,
              title: 'Vibrant Clubs',
              description: 'Discover and join clubs that match your interests. From tech to arts, find your tribe.',
              color: 'from-blue-500 to-blue-500',
            },
            {
              icon: CalendarDays,
              title: 'Exciting Events',
              description: 'Never miss a campus event. Register, attend, and earn rewards for participation.',
              color: 'from-sky-500 to-pink-500',
            },
            {
              icon: Trophy,
              title: 'Leaderboard',
              description: 'Compete with peers, climb rankings, and showcase your campus engagement.',
              color: 'from-amber-500 to-orange-500',
            },
            {
              icon: Sparkles,
              title: 'Gamification',
              description: 'Earn XP, unlock badges, and level up. Make your campus journey rewarding.',
              color: 'from-cyan-500 to-emerald-500',
            },
          ].map((feature, i) => (
            <div
              key={feature.title}
              className={`glass rounded-2xl p-6 card-hover animate-fade-in stagger-${i + 1}`}
              style={{ opacity: 0 }}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 shadow-lg`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[hsl(var(--border))] py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        <p>© 2025 CampusOS. Built for students, by students.</p>
      </footer>
    </div>
  )
}
