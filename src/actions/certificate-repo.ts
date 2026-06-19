'use server'

import { createClient } from '@/lib/supabase/server'

// ─── Certificate CRUD ───────────────────────────────────────────────

export async function uploadCertificate(data: {
  title: string
  issuer: string
  platform: string
  credential_url?: string
  credential_id?: string
  certificate_file_url?: string
  issue_date?: string
  expiry_date?: string
}, imageBase64?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  let verification_status = 'verified'
  let certificate_file_url = data.certificate_file_url

  if (imageBase64) {
    try {
      // Upload to Supabase Storage
      const fileName = `${user.id}/${Date.now()}.jpg`
      const buffer = Buffer.from(imageBase64, 'base64')
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('certificates')
        .upload(fileName, buffer, {
          contentType: 'image/jpeg',
          upsert: false
        })
        
      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('certificates')
          .getPublicUrl(fileName)
        certificate_file_url = publicUrlData.publicUrl
      }
    } catch (err) {
      console.error("Image upload failed:", err)
    }
  }

  const { data: cert, error } = await supabase
    .from('certificates_external')
    .insert({ 
      user_id: user.id, 
      ...data,
      certificate_file_url,
      verification_status
    })
    .select()
    .single()

  if (error) throw error
  return cert
}

export async function getMyCertificates() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: externalData, error: externalError } = await supabase
    .from('certificates_external')
    .select('*, certificate_skills(skill_name, proficiency_level)')
    .eq('user_id', user.id)

  if (externalError) throw externalError

  const { data: internalData, error: internalError } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', user.id)

  if (internalError) throw internalError

  const formattedInternal = (internalData || []).map(cert => ({
    id: cert.id,
    user_id: cert.user_id,
    title: cert.title,
    issuer: 'CampusOS Platform',
    platform: 'campusos',
    credential_url: `/verify/${cert.id}`,
    credential_id: cert.id,
    issue_date: cert.issue_date || cert.created_at || new Date().toISOString(),
    verification_status: 'verified',
    certificate_skills: []
  }))

  const combined = [...(externalData || []), ...formattedInternal]
  combined.sort((a, b) => new Date(b.issue_date || b.created_at || 0).getTime() - new Date(a.issue_date || a.created_at || 0).getTime())

  return combined
}

export async function getUserCertificates(userId: string) {
  const supabase = await createClient()

  const { data: externalData, error: externalError } = await supabase
    .from('certificates_external')
    .select('*, certificate_skills(skill_name, proficiency_level)')
    .eq('user_id', userId)
    .eq('verification_status', 'verified')

  if (externalError) throw externalError

  const { data: internalData, error: internalError } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId)

  if (internalError) throw internalError

  const formattedInternal = (internalData || []).map(cert => ({
    id: cert.id,
    user_id: cert.user_id,
    title: cert.title,
    issuer: 'CampusOS Platform',
    platform: 'campusos',
    credential_url: `/verify/${cert.id}`,
    credential_id: cert.id,
    issue_date: cert.issue_date || cert.created_at || new Date().toISOString(),
    verification_status: 'verified',
    certificate_skills: []
  }))

  const combined = [...(externalData || []), ...formattedInternal]
  combined.sort((a, b) => new Date(b.issue_date || b.created_at || 0).getTime() - new Date(a.issue_date || a.created_at || 0).getTime())

  return combined
}

export async function deleteCertificate(certId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('certificates_external')
    .delete()
    .eq('id', certId)
    .eq('user_id', user.id)

  if (error) throw error
}

// ─── Admin Verification ─────────────────────────────────────────────

export async function getPendingCertificates() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('certificates_external')
    .select('*, profiles(full_name, avatar_url, department)')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })

  if (error) throw error
  return data || []
}

export async function verifyCertificate(certId: string, approve: boolean, reason?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('certificates_external')
    .update({
      verification_status: approve ? 'verified' : 'rejected',
      verified_by: user.id,
      verified_at: new Date().toISOString(),
      rejection_reason: approve ? null : reason,
      updated_at: new Date().toISOString(),
    })
    .eq('id', certId)

  if (error) throw error
}

// ─── Skills ─────────────────────────────────────────────────────────

export async function getUserSkills(userId?: string) {
  const supabase = await createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Not authenticated')
    targetUserId = user.id
  }

  const { data, error } = await supabase
    .from('certificate_skills')
    .select('skill_name, proficiency_level')
    .eq('user_id', targetUserId)

  if (error) throw error

  // Deduplicate skills
  const skillMap = new Map<string, string>()
  data?.forEach(s => {
    const existing = skillMap.get(s.skill_name)
    const levels = ['beginner', 'intermediate', 'advanced', 'expert']
    if (!existing || levels.indexOf(s.proficiency_level) > levels.indexOf(existing)) {
      skillMap.set(s.skill_name, s.proficiency_level)
    }
  })

  return Array.from(skillMap.entries()).map(([name, level]) => ({ skill_name: name, proficiency_level: level }))
}
