import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextResponse } from 'next/server'
import { performanceConfigSchema } from '@/types/performance'

/**
 * GET /api/org/settings — Return current org settings (performance_config, etc.). Admin/Manager only.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const settings = (org?.settings as Record<string, unknown>) ?? {}
  const performance_config = settings.performance_config ?? null

  return NextResponse.json({
    performance_config,
    institution_type: (performance_config as Record<string, unknown>)?.institution_type ?? null,
    kpis: (performance_config as Record<string, unknown>)?.kpis ?? [],
    scale: (performance_config as Record<string, unknown>)?.scale ?? null,
    terms: (performance_config as Record<string, unknown>)?.terms ?? [],
  })
}

/**
 * PATCH /api/org/settings — Update org performance_config. Admin/Manager only.
 */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = performanceConfigSchema.safeParse(body.performance_config ?? body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid performance_config', details: parsed.error.flatten() }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: org } = await admin
    .from('organisations')
    .select('settings')
    .eq('id', orgId)
    .single()

  const currentSettings = (org?.settings as Record<string, unknown>) ?? {}
  const updatedSettings = { ...currentSettings, performance_config: parsed.data }

  const { error } = await admin
    .from('organisations')
    .update({ settings: updatedSettings })
    .eq('id', orgId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ performance_config: parsed.data })
}
