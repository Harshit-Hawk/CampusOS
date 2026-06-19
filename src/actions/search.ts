'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function globalSearch(query: string) {
  const supabase = await createClient()

  // Search posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*, profiles!posts_author_id_fkey(*), clubs(*)')
    .ilike('content', `%${query}%`)
    .order('created_at', { ascending: false })
    .limit(5)

  // Search users
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .or(`full_name.ilike.%${query}%,roll_no.ilike.%${query}%,username.ilike.%${query}%`)
    .limit(5)

  // Search clubs
  const { data: clubs } = await supabase
    .from('clubs')
    .select('*')
    .ilike('name', `%${query}%`)
    .limit(5)

  return {
    posts: posts || [],
    users: users || [],
    clubs: clubs || []
  }
}

export async function getTrendingHashtags() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .order('post_count', { ascending: false })
    .limit(10)

  if (error) return { hashtags: [] }
  return { hashtags: data }
}

export async function toggleSavePost(postId: string, currentSaved: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  if (currentSaved) {
    const { error } = await supabase.from('saved_posts').delete().eq('post_id', postId).eq('user_id', user.id)
    if (error) return { error: error.message }
  } else {
    const { error } = await supabase.from('saved_posts').insert({ post_id: postId, user_id: user.id } as any)
    if (error) return { error: error.message }
  }

  revalidatePath('/feed')
  return { success: true }
}

export async function extractAndSaveHashtags(postId: string, content: string) {
  const supabase = await createClient()
  
  // Extract hashtags
  const hashtags = content.match(/#[a-z0-9_]+/gi)
  if (!hashtags) return

  for (const ht of hashtags) {
    const name = ht.substring(1).toLowerCase()
    
    // Upsert hashtag
    const { data: existing } = await supabase.from('hashtags').select('id, post_count').eq('name', name).single()
    let hashtagId = ''
    
    if (existing) {
      await (supabase.from('hashtags') as any).update({ post_count: (existing.post_count || 0) + 1 }).eq('id', existing.id)
      hashtagId = existing.id
    } else {
      const { data: newHt } = await (supabase.from('hashtags') as any).insert({ name }).select().single()
      if (newHt) hashtagId = newHt.id
    }

    // Link to post
    if (hashtagId) {
      await (supabase.from('post_hashtags') as any).insert({ post_id: postId, hashtag_id: hashtagId })
    }
  }
}
