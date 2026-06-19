'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createCommunity(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPrivate = formData.get('is_private') === 'true'

    if (!name) {
      return { error: 'Community name is required' }
    }

    const { data, error } = await supabase
      .from('communities')
      .insert({
        name,
        description,
        is_private: isPrivate,
        owner_id: user.id
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath('/communities')
    return { success: true, community: data }
  } catch (error: any) {
    console.error('Error creating community:', error)
    return { error: error.message || 'Failed to create community' }
  }
}

export async function joinCommunity(communityId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('community_members')
      .insert({
        community_id: communityId,
        user_id: user.id,
        role: 'member'
      })

    if (error) throw error

    revalidatePath(`/communities/${communityId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error joining community:', error)
    return { error: error.message || 'Failed to join community' }
  }
}

export async function fetchUserCommunities() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { data, error } = await supabase
      .from('community_members')
      .select(`
        community_id,
        role,
        communities (
          id,
          name,
          avatar_url,
          description
        )
      `)
      .eq('user_id', user.id)

    if (error) throw error

    return { success: true, communities: data.map(d => ({ ...d.communities, role: d.role })) }
  } catch (error: any) {
    console.error('Error fetching communities:', error)
    return { error: error.message || 'Failed to fetch communities' }
  }
}

export async function fetchCommunityChannels(communityId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('community_channels')
      .select('*')
      .eq('community_id', communityId)
      .order('position', { ascending: true })

    if (error) throw error

    return { success: true, channels: data }
  } catch (error: any) {
    console.error('Error fetching channels:', error)
    return { error: error.message || 'Failed to fetch channels' }
  }
}

export async function createChannel(communityId: string, name: string, type: 'text' | 'announcement' = 'text') {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    // Role check happens via RLS

    const { data, error } = await supabase
      .from('community_channels')
      .insert({
        community_id: communityId,
        name: name.toLowerCase().replace(/\s+/g, '-'),
        channel_type: type
      })
      .select()
      .single()

    if (error) throw error

    revalidatePath(`/communities/${communityId}`)
    return { success: true, channel: data }
  } catch (error: any) {
    console.error('Error creating channel:', error)
    return { error: error.message || 'Failed to create channel' }
  }
}

export async function fetchChannelMessages(channelId: string, limit = 50) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        *,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('channel_id', channelId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, messages: data.reverse() } // Reverse to show oldest first at top
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return { error: error.message || 'Failed to fetch messages' }
  }
}

export async function sendMessage(channelId: string, content: string, attachments: string[] = []) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    if (!content.trim() && attachments.length === 0) {
      return { error: 'Message cannot be empty' }
    }

    const { data, error } = await supabase
      .from('community_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        attachments
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, message: data }
  } catch (error: any) {
    console.error('Error sending message:', error)
    return { error: error.message || 'Failed to send message' }
  }
}

export async function fetchCommunityMembers(communityId: string) {
  try {
    const supabase = await createClient()
    
    const { data, error } = await supabase
      .from('community_members')
      .select(`
        role,
        joined_at,
        profiles:user_id (
          id,
          full_name,
          avatar_url,
          role
        )
      `)
      .eq('community_id', communityId)

    if (error) throw error

    return { success: true, members: data }
  } catch (error: any) {
    console.error('Error fetching members:', error)
    return { error: error.message || 'Failed to fetch members' }
  }
}

export async function updateCommunity(communityId: string, formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const isPrivate = formData.get('is_private') === 'true'

    if (!name) {
      return { error: 'Community name is required' }
    }

    const { error } = await supabase
      .from('communities')
      .update({
        name,
        description,
        is_private: isPrivate,
      })
      .eq('id', communityId)

    if (error) throw error

    revalidatePath(`/communities/${communityId}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating community:', error)
    return { error: error.message || 'Failed to update community' }
  }
}

export async function deleteCommunity(communityId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { error: 'Not authenticated' }
    }

    const { error } = await supabase
      .from('communities')
      .delete()
      .eq('id', communityId)

    if (error) throw error

    revalidatePath('/communities')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting community:', error)
    return { error: error.message || 'Failed to delete community' }
  }
}
