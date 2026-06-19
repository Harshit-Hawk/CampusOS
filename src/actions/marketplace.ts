'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Listings ───────────────────────────────────────────────────────

export async function createMarketplaceListing(data: {
  title: string; description: string; price: number;
  category: string; condition?: string; images?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: listing, error } = await supabase
    .from('marketplace_listings')
    .insert({ seller_id: user.id, ...data })
    .select()
    .single()

  if (error) throw error
  return listing
}

export async function getMarketplaceListings(filters?: {
  category?: string; search?: string; minPrice?: number; maxPrice?: number
}) {
  const supabase = await createClient()

  let query = supabase
    .from('marketplace_listings')
    .select('*, profiles(id, full_name, avatar_url)')
    .eq('is_active', true)
    .eq('is_sold', false)
    .order('created_at', { ascending: false })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
  }
  if (filters?.minPrice !== undefined) query = query.gte('price', filters.minPrice)
  if (filters?.maxPrice !== undefined) query = query.lte('price', filters.maxPrice)

  const { data, error } = await query.limit(50)
  if (error) throw error
  return data || []
}

export async function getMyListings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('marketplace_listings')
    .select('*')
    .eq('seller_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateListing(listingId: string, data: Partial<{
  title: string; description: string; price: number;
  is_sold: boolean; is_active: boolean
}>) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('marketplace_listings')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', listingId)

  if (error) throw error
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('marketplace_listings')
    .delete()
    .eq('id', listingId)

  if (error) throw error
}

// ─── Messages ───────────────────────────────────────────────────────

export async function sendMarketplaceMessage(listingId: string, receiverId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('marketplace_messages')
    .insert({
      listing_id: listingId,
      sender_id: user.id,
      receiver_id: receiverId,
      content,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMarketplaceConversations(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('marketplace_messages')
    .select('*, profiles!marketplace_messages_sender_id_fkey(full_name, avatar_url)')
    .eq('listing_id', listingId)
    .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

// ─── Seller Ratings ─────────────────────────────────────────────────

export async function getSellerRating(sellerId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('seller_ratings')
    .select('rating')
    .eq('seller_id', sellerId)

  if (error) throw error
  if (!data || data.length === 0) return { avg: 0, count: 0 }

  const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length
  return { avg: Math.round(avg * 10) / 10, count: data.length }
}

export async function rateSeller(sellerId: string, listingId: string, rating: number, review?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('seller_ratings')
    .upsert({
      seller_id: sellerId,
      buyer_id: user.id,
      listing_id: listingId,
      rating,
      review,
    })

  if (error) throw error
}
