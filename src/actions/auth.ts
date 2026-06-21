'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const headersList = await headers()
  const origin = headersList.get('origin')

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string
  const fullName = formData.get('fullName') as string
  const mobileNumber = formData.get('mobileNumber') as string
  const rollNo = formData.get('rollNo') as string
  const department = formData.get('department') as string

  // Validate mobile number to be exactly 10 digits
  if (!/^\d{10}$/.test(mobileNumber)) {
    return { error: 'Mobile number must be exactly 10 digits.' }
  }

  const { data: existingRollNo } = await supabase
    .from('profiles')
    .select('id')
    .eq('roll_no', rollNo)
    .single()

  if (existingRollNo) {
    return { error: 'This Roll Number is already registered with another account.' }
  }

  const { data: existingUsername } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single()

  if (existingUsername) {
    return { error: 'This username is already taken. Please choose another one.' }
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username: username,
        full_name: fullName,
        roll_no: rollNo,
        mobile_number: mobileNumber,
        department: department,
      },
      emailRedirectTo: `${origin}/callback`,
    },
  })

  if (error) {
    if (error.message.includes('User already registered') || error.message.includes('already exists')) {
      return { error: 'This email is already registered. Please sign in instead.' }
    }
    return { error: error.message }
  }

  if (data.session) {
    // Email confirmations are turned off, user is logged in automatically
    redirect('/feed')
  }

  return { success: 'Check your email to confirm your account!' }
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()

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
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role || 'student'
}

export async function signInWithGoogle() {
  const supabase = await createClient()
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
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
