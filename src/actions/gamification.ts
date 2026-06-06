'use server'

import { createClient } from '@/lib/supabase/server'

// Core XP increment RPC is defined in 001_initial_schema.sql
export async function awardXP(userId: string, amount: number, reason: string, sourceType: string, sourceId?: string) {
  const supabase = await createClient() as any
  await supabase.rpc('increment_xp', {
    target_user_id: userId,
    xp_amount: amount,
    xp_reason: reason,
    xp_source_type: sourceType,
    xp_source_id: sourceId || null,
  } as any)
}

export async function fetchXPHistory(userId: string) {
  const supabase = await createClient() as any
  const { data, error } = await supabase
    .from('xp_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return { error: error.message, transactions: [] }
  return { transactions: data || [] }
}

export async function getGamificationProfile(roll_no: string) {
  const supabase = await createClient() as any
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('roll_no', roll_no)
    .single()

  if (profileError || !profile) return { error: 'Profile not found' }

  // Get Wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', profile.id)
    .single()

  // Get User Streaks
  const { data: streaks } = await supabase
    .from('user_streaks')
    .select('*')
    .eq('user_id', profile.id)

  return {
    profile,
    wallet: wallet || { balance: 0 },
    streaks: streaks || []
  }
}

export async function getWalletTransactions() {
  const supabase = await createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: transactions } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  return { transactions: transactions || [], balance: wallet?.balance || 0 }
}
