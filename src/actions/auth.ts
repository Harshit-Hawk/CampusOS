'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signUp(formData: FormData) {
  const supabase = await createClient() as any
  const headersList = await headers()
  const origin = headersList.get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        roll_no: formData.get('rollNo') as string,
      },
      emailRedirectTo: `${origin}/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.session) {
    // Email confirmations are turned off, user is logged in automatically
    redirect('/feed')
  }

  return { success: 'Check your email to confirm your account!' }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient() as any

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect('/feed')
}

export async function getUserRole() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role || 'student'
}

export async function signInWithGoogle() {
  const supabase = await createClient() as any
  const headersList = await headers()
  const origin = headersList.get('origin')

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/callback`,
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient() as any
  await supabase.auth.signOut()
  redirect('/login')
}
