'use server'

import { createClient } from '@/lib/supabase/server'
import webpush from 'web-push'

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || 'mailto:admin@campusos.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string
)

export async function savePushSubscription(subscription: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('push_subscriptions').upsert({
    user_id: user.id,
    endpoint: subscription.endpoint,
    auth: subscription.keys.auth,
    p256dh: subscription.keys.p256dh,
    updated_at: new Date().toISOString()
  }, { onConflict: 'endpoint' })

  if (error) {
    console.error('Error saving push subscription:', error)
    return { error: error.message }
  }

  return { success: true }
}

export async function broadcastNativePushNotification(title: string, body: string, url: string = '/') {
  const supabase = await createClient()
  const { data: subscriptions, error } = await supabase.from('push_subscriptions').select('endpoint, auth, p256dh')
  
  if (error || !subscriptions) {
    console.error('Failed to fetch subscriptions:', error)
    return
  }

  const payload = JSON.stringify({
    title,
    body,
    url,
    icon: '/icon-512x512.png'
  })

  const sendPromises = subscriptions.map((sub: any) => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.auth,
        p256dh: sub.p256dh
      }
    }
    return webpush.sendNotification(pushSubscription, payload).catch(async (error: any) => {
      console.error('Error sending push to endpoint:', sub.endpoint, error)
      // Delete expired subscriptions
      if (error.statusCode === 410 || error.statusCode === 404) {
        await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
      }
    })
  })

  await Promise.all(sendPromises)
}
