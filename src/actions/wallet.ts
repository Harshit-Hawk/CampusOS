'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// --- Admin Store Management ---

export async function createReward(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const cost = parseInt(formData.get('cost') as string)
  const image = formData.get('image') as File | null
  const stock = formData.get('stock') ? parseInt(formData.get('stock') as string) : -1

  if (!title || !description || isNaN(cost) || cost <= 0) {
    return { error: 'Invalid fields' }
  }

  let image_url = undefined

  if (image && image.size > 0) {
    const fileExt = image.name.split('.').pop()
    const fileName = `reward-${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('club-assets').upload(fileName, image)
    if (!uploadError) {
      image_url = supabase.storage.from('club-assets').getPublicUrl(fileName).data.publicUrl
    } else {
      return { error: 'Image upload failed' }
    }
  }

  const { error } = await supabase.from('rewards').insert({
    title, description, cost, stock, image_url
  } as any)

  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteReward(rewardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  // Set is_active to false instead of hard deleting so redemptions still have a reference
  const { error } = await supabase.from('rewards').update({ is_active: false }).eq('id', rewardId)
  
  if (error) return { error: error.message }
  return { success: true }
}

// --- Admin Redemptions Management ---

export async function fetchAdminRedemptions() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated', redemptions: [] }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized', redemptions: [] }

  const { data, error } = await supabase
    .from('reward_redemptions')
    .select('*, rewards(*), profiles(full_name, roll_no, avatar_url)')
    .order('created_at', { ascending: false })

  if (error) return { error: error.message, redemptions: [] }
  return { redemptions: data || [] }
}

export async function updateRedemptionStatus(redemptionId: string, status: 'fulfilled' | 'rejected') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return { error: 'Unauthorized' }

  const { data: redemption, error: redErr } = await supabase
    .from('reward_redemptions')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', redemptionId)
    .select('*, rewards(title)')
    .single()

  if (redErr || !redemption) return { error: 'Failed to update status' }

  // If rejected, refund the user
  if (status === 'rejected') {
    await supabase.rpc('increment_cc', {
      target_user_id: redemption.user_id,
      cc_amount: redemption.cost_at_redemption,
      cc_reason: `Refund for rejected reward: ${(redemption as any).rewards?.title}`
    } as any)
  }

  // Notify user
  await (supabase.from('notifications') as any).insert({
    user_id: redemption.user_id,
    type: 'announcement',
    title: status === 'fulfilled' ? 'Reward Fulfilled! 🎉' : 'Reward Refunded',
    message: status === 'fulfilled' 
      ? `Your reward "${(redemption as any).rewards?.title}" has been successfully fulfilled by the admin.`
      : `Your reward redemption was cancelled and you have been refunded ${redemption.cost_at_redemption} CC.`,
    link: `/wallet`
  })

  return { success: true }
}

// --- Student Store ---

export async function fetchActiveRewards() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('rewards')
    .select('*')
    .eq('is_active', true)
    .order('cost', { ascending: true })

  if (error) return { error: error.message, rewards: [] }
  return { rewards: data || [] }
}

export async function redeemReward(rewardId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // 1. Fetch reward details
  const { data: reward } = await supabase
    .from('rewards')
    .select('*')
    .eq('id', rewardId)
    .single()

  if (!reward || !reward.is_active) return { error: 'Reward not available' }
  if (reward.stock === 0) return { error: 'Reward is out of stock' }

  // 2. Fetch user wallet
  const { data: wallet } = await supabase
    .from('wallets')
    .select('balance')
    .eq('user_id', user.id)
    .single()

  if (!wallet || wallet.balance < reward.cost) return { error: 'Insufficient Campus Coins' }

  // 3. Deduct CC via RPC (passing negative amount to increment_cc)
  const { error: rpcErr } = await supabase.rpc('increment_cc', {
    target_user_id: user.id,
    cc_amount: -reward.cost,
    cc_reason: `Redeemed reward: ${reward.title}`
  } as any)

  if (rpcErr) return { error: 'Failed to process transaction' }

  // 4. Create Redemption Record
  const { error: redErr } = await supabase.from('reward_redemptions').insert({
    reward_id: reward.id,
    user_id: user.id,
    cost_at_redemption: reward.cost,
    status: 'pending'
  } as any)

  if (redErr) {
    // Attempt refund if redemption record failed
    await supabase.rpc('increment_cc', {
      target_user_id: user.id,
      cc_amount: reward.cost,
      cc_reason: `System Refund: Failed to process redemption`
    } as any)
    return { error: 'Failed to complete redemption. CC has been refunded.' }
  }

  // 5. Decrement Stock if finite
  if (reward.stock > 0) {
    await supabase.from('rewards')
      .update({ stock: reward.stock - 1 })
      .eq('id', reward.id)
  }

  return { success: true }
}
