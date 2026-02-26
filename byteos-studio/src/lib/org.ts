import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * Returns the user's first org, or auto-creates a "Personal Workspace"
 * on their first Studio visit. Every course requires an org_id.
 * Uses the admin client (service role) for org/member provisioning to
 * bypass RLS policies that would otherwise block the initial insert.
 */
export async function getOrCreateOrg(userId: string): Promise<string> {
  const supabase = await createClient()
  const admin = createAdminClient()

  // Check for existing membership (anon client — reads user's own memberships)
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_id')
    .eq('user_id', userId)
    .limit(1)
    .single()

  if (membership?.org_id) return membership.org_id

  // Create a personal workspace org — use admin client to bypass RLS
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single()

  const orgName = profile?.full_name
    ? `${profile.full_name}'s Workspace`
    : 'My Workspace'

  const slug = `workspace-${userId.slice(0, 8)}`

  const { data: org, error } = await admin
    .from('organisations')
    .insert({ name: orgName, slug, plan: 'free' })
    .select('id')
    .single()

  if (error || !org) throw new Error(`Failed to create org: ${error?.message}`)

  await admin.from('org_members').insert({
    org_id: org.id,
    user_id: userId,
    role: 'ADMIN',
  })

  await admin
    .from('profiles')
    .update({ org_id: org.id })
    .eq('id', userId)

  return org.id
}
