import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { PageTransition } from '@/components/ui/PageTransition'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const admin = createAdminClient()

  const [{ data: profile }, { data: learnerProfile }] = await Promise.all([
    supabase.from('profiles').select('full_name, avatar_url').eq('id', user.id).single(),
    admin.from('learner_profiles').select('ai_tutor_context').eq('user_id', user.id).single(),
  ])

  // Redirect new learners to onboarding if they haven't completed it yet.
  // Skip this redirect if they're already on the onboarding page.
  const memory = (learnerProfile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const onboardingDone = memory.onboarding_complete === 'true'

  const userProps = {
    email: user.email ?? '',
    full_name: profile?.full_name,
    avatar_url: profile?.avatar_url,
  }

  return (
    <div className="min-h-screen bg-shell py-4 px-4 md:py-6 md:px-6">
      <div className="max-w-[1600px] mx-auto rounded-shell overflow-hidden shadow-xl bg-background border border-border min-h-[calc(100vh-2rem)] flex">
        <Sidebar user={userProps} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header
            user={userProps}
            showOnboardingNudge={!onboardingDone}
          />
          <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-8">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
      </div>
    </div>
  )
}
