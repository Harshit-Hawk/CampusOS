import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LandingView } from '@/components/landing/landing-view'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/feed')
  }

  return <LandingView />
}
