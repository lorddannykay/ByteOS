import { createClient, createAdminClient } from '@/lib/supabase/server'
import { requireOrgAdmin } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

const BULK_MAX = 100

function randomPassword(length = 14): string {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%'
  let s = ''
  const bytes = randomBytes(length)
  for (let i = 0; i < length; i++) s += chars[bytes[i]! % chars.length]
  return s
}

/**
 * POST /api/users/bulk — Create multiple users (Admin/Manager only).
 * Body: { users: [{ email, full_name?, org_role? }] }. Max BULK_MAX. Each gets a random password and require_password_change.
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let orgId: string
  try {
    orgId = await requireOrgAdmin(user.id)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json() as { users: Array<{ email: string; full_name?: string; org_role?: string }> }
  const input = Array.isArray(body.users) ? body.users : []
  if (input.length === 0) return NextResponse.json({ error: 'users array required' }, { status: 400 })
  if (input.length > BULK_MAX) return NextResponse.json({ error: `Max ${BULK_MAX} users per request` }, { status: 400 })

  const admin = createAdminClient()
  const results: { email: string; ok: boolean; id?: string; error?: string; temp_password?: string }[] = []

  for (const row of input) {
    const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : ''
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      results.push({ email: row.email || '', ok: false, error: 'Invalid email' })
      continue
    }

    const password = randomPassword(14)
    const role = ['ADMIN', 'MANAGER', 'CREATOR', 'LEARNER'].includes(row.org_role ?? '') ? row.org_role : 'LEARNER'

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: row.full_name ?? null },
    })

    if (authError) {
      results.push({ email, ok: false, error: authError.message })
      continue
    }

    const userId = authUser.user.id
    await admin.from('profiles').upsert({
      id: userId,
      full_name: row.full_name ?? null,
      org_id: orgId,
      require_password_change: true,
    }, { onConflict: 'id' })

    await admin.from('org_members').insert({
      org_id: orgId,
      user_id: userId,
      role,
    })

    const { data: _lp } = await admin.from('learner_profiles').select('id').eq('user_id', userId).single()
    if (!_lp) await admin.from('learner_profiles').insert({ user_id: userId })

    results.push({ email, ok: true, id: userId, temp_password: password })
  }

  return NextResponse.json({ results })
}
