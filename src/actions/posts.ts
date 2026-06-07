'use server'

import { createClient } from '@/lib/supabase/server'
import { POSTS_PER_PAGE, XP_REWARDS } from '@/lib/constants'

import { extractAndSaveHashtags } from './search'

export async function createPost(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'faculty', 'club_leader'].includes(profile.role)) {
    return { error: 'You do not have permission to post.' }
  }

  const content = formData.get('content') as string
  const category = (formData.get('category') as string) || 'general'
  const mediaUrlsStr = formData.get('mediaUrls') as string
  const media_urls = mediaUrlsStr ? JSON.parse(mediaUrlsStr) : []

  const { data, error } = await (supabase.from('posts') as any)
    .insert({ author_id: user.id, content, category, media_urls })
    .select('*, profiles(*)')
    .single()

  if (error) return { error: error.message }
  
  // Extract and save hashtags asynchronously (don't block)
  extractAndSaveHashtags(data.id, content).catch(console.error)

  // Award XP
  await supabase.rpc('increment_xp', {
    target_user_id: user.id,
    xp_amount: XP_REWARDS.CREATE_POST,
    xp_reason: 'Created a post',
    xp_source_type: 'post',
    xp_source_id: data!.id,
  } as any)

  return { data }
}

export async function fetchPosts(cursor?: string, category?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  let userRole = 'user'
  if (user) {
    const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (p) userRole = p.role
  }

  let query = supabase
    .from('posts')
    .select('*, profiles(*)')
    .order('created_at', { ascending: false })
    .limit(POSTS_PER_PAGE)

  if (category && category !== 'all') {
    query = query.eq('category', category)
  }

  if (cursor) {
    query = query.lt('created_at', cursor)
  }

  const { data: posts, error } = await query

  if (error) return { error: error.message, posts: [] }

  // Check if user has liked each post
  if (user && posts) {
    const postIds = (posts as any[]).map((p: any) => p.id)
    
    // Check likes
    const { data: likes } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)

    const likedPostIds = new Set((likes as any[] || []).map((l: any) => l.post_id))

    // Check saved
    const { data: saves } = await supabase
      .from('saved_posts')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
      
    const savedPostIds = new Set((saves as any[] || []).map((s: any) => s.post_id))

    const postsWithStatus = (posts as any[]).map((p: any) => ({
      ...p,
      user_has_liked: likedPostIds.has(p.id),
      user_has_saved: savedPostIds.has(p.id)
    }))
    return { posts: postsWithStatus, userRole }
  }

  return { posts: posts || [], userRole }
}

export async function fetchPostById(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post, error } = await supabase
    .from('posts')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (error || !post) return { error: error?.message || 'Post not found', post: null }

  let user_has_liked = false
  let user_has_saved = false

  if (user) {
    const { data: like } = await supabase.from('post_likes').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle()
    if (like) user_has_liked = true

    const { data: saved } = await supabase.from('saved_posts').select('post_id').eq('user_id', user.id).eq('post_id', id).maybeSingle()
    if (saved) user_has_saved = true
  }

  return { post: { ...post, user_has_liked, user_has_saved } }
}

export async function likePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: user.id } as any)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Already liked' }
    }
    return { error: error.message }
  }

  // Award XP to post author
  const { data: post } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (post && (post as any).author_id !== user.id) {
    await supabase.rpc('increment_xp', {
      target_user_id: (post as any).author_id,
      xp_amount: XP_REWARDS.RECEIVE_LIKE,
      xp_reason: 'Received a like',
      xp_source_type: 'like',
      xp_source_id: postId,
    } as any)
  }

  return { success: true }
}

export async function unlikePost(postId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function addComment(postId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: user.id, content } as any)
    .select('*, profiles(*)')
    .single()

  if (error) return { error: error.message }

  // Award XP for commenting
  await supabase.rpc('increment_xp', {
    target_user_id: user.id,
    xp_amount: XP_REWARDS.COMMENT,
    xp_reason: 'Commented on a post',
    xp_source_type: 'comment',
    xp_source_id: postId,
  } as any)

  return { data }
}

export async function fetchComments(postId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, profiles(*)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message, comments: [] }
  return { comments: data || [] }
}

export async function fetchCommentById(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('post_comments')
    .select('*, profiles(*)')
    .eq('id', id)
    .single()

  if (error || !data) return { error: error?.message || 'Comment not found', comment: null }
  return { comment: data }
}

export async function deletePost(postId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('post_comments').delete().eq('id', commentId)
  if (error) return { error: error.message }
  return { success: true }
}
