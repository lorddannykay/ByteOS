import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { course_id } = await request.json()
  if (!course_id) return NextResponse.json({ error: 'course_id required' }, { status: 400 })

  // Verify course is published + get adaptive flag
  const { data: course } = await admin
    .from('courses')
    .select('id, title, is_adaptive')
    .eq('id', course_id)
    .eq('status', 'published')
    .single()

  if (!course) return NextResponse.json({ error: 'Course not found or not published' }, { status: 404 })

  // Check if already enrolled — return existing
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, personalized_welcome')
    .eq('user_id', user.id)
    .eq('course_id', course_id)
    .single()

  if (existing) return NextResponse.json(existing)

  // Create enrollment
  const { data, error } = await admin
    .from('enrollments')
    .insert({
      user_id: user.id,
      course_id,
      status: 'not_started',
      progress_pct: 0,
      enrolled_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await admin.from('learning_events').insert({
    user_id: user.id,
    course_id,
    event_type: 'course_enroll',
    payload: { course_title: course.title },
  })

  // Ensure learner_profile exists
  const { data: existingProfile } = await admin
    .from('learner_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existingProfile) {
    await admin.from('learner_profiles').insert({ user_id: user.id })
  }

  // Trigger enrollment bridge generation async (fire-and-forget)
  // Works for all courses — adaptive or not — but only shows if content is generated
  if (data?.id) {
    const baseUrl = request.nextUrl.origin
    fetch(`${baseUrl}/api/ai/enroll-bridge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify({ enrollment_id: data.id, course_id }),
    }).catch(() => {}) // non-blocking
  }

  return NextResponse.json(data, { status: 201 })
}
