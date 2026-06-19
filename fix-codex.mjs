import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin override

if (!supabaseUrl || !supabaseServiceKey) {
  console.log('Missing env vars')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      is_verified: true, 
      verification_type: 'organization',
      role: 'club_leader'
    })
    .eq('full_name', 'CodeX Club')
    .select()

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('Updated:', data)
  }
}

main()
