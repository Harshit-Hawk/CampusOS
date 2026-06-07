'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function fetchSubjectResources(subjectId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('subject_resources')
    .select(`
      *,
      profiles:faculty_id (
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('subject_id', subjectId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching subject resources:', error)
    return []
  }

  return data || []
}

export async function createSubjectResource(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const subjectId = formData.get('subjectId') as string
  const title = formData.get('title') as string
  const description = formData.get('description') as string
  const resourceType = formData.get('resourceType') as string
  const file = formData.get('file') as File | null
  const externalLink = formData.get('externalLink') as string | null

  if (!subjectId || !title || !resourceType) {
    return { success: false, error: 'Missing required fields' }
  }

  let fileUrl = null

  if ((resourceType === 'pdf' || resourceType === 'docx') && file && file.size > 0) {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Date.now()}.${fileExt}`
    const filePath = `resources/${subjectId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('academic-resources')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Error uploading file:', uploadError)
      return { success: false, error: 'Failed to upload file' }
    }

    const { data: publicUrlData } = supabase.storage
      .from('academic-resources')
      .getPublicUrl(filePath)
      
    fileUrl = publicUrlData.publicUrl
  }

  const { error } = await supabase
    .from('subject_resources')
    .insert({
      subject_id: subjectId,
      faculty_id: user.id,
      title,
      description,
      resource_type: resourceType,
      file_url: fileUrl,
      external_link: externalLink || null
    })

  if (error) {
    console.error('Error inserting resource:', error)
    return { success: false, error: 'Failed to save resource' }
  }

  revalidatePath('/academic/faculty')
  revalidatePath('/academic/student')
  return { success: true }
}

export async function deleteSubjectResource(id: string, fileUrl?: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  // Check if owner or admin
  const { data: resource } = await supabase
    .from('subject_resources')
    .select('faculty_id')
    .eq('id', id)
    .single()
    
  if (!resource) return { success: false, error: 'Not found' }
  
  if (resource.faculty_id !== user.id) {
    // Check if admin
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') {
      return { success: false, error: 'Unauthorized' }
    }
  }

  // If there's a file, try to delete it from storage
  if (fileUrl) {
    try {
      const urlObj = new URL(fileUrl)
      const pathParts = urlObj.pathname.split('/academic-resources/')
      if (pathParts.length > 1) {
        const filePath = pathParts[1]
        await supabase.storage.from('academic-resources').remove([filePath])
      }
    } catch (e) {
      console.error('Error parsing file URL for deletion:', e)
    }
  }

  const { error } = await supabase
    .from('subject_resources')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting resource:', error)
    return { success: false, error: 'Failed to delete resource' }
  }

  revalidatePath('/academic/faculty')
  revalidatePath('/academic/student')
  return { success: true }
}
