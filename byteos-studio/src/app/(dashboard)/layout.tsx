import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Ensure user always has an org (creates one on first visit)
  await getOrCreateOrg(user.id)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell
      user={{
        email: user.email ?? '',
        full_name: profile?.full_name,
        avatar_url: profile?.avatar_url,
      }}
    >
      {children}
    </DashboardShell>
  )
}
