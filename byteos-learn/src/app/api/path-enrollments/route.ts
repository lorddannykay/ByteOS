/**
 * Path Enrollment API
 *
 * On POST: enrolls a learner in a learning path.
 * For adaptive paths, computes a personalized course sequence using the learner's
 * ai_tutor_context and stores it in enrollments.personalized_sequence.
 * Mandatory courses stay fixed; optional courses are reordered by relevance.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface PathCourse {
  course_id: string
  order_index: number
  is_mandatory: boolean
  title: string
  difficulty: string | null
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin
    .from('enrollments')
    .select('*, path:learning_paths(id, title, description, is_adaptive, issues_certificate, courses)')
    .eq('user_id', user.id)
    .not('path_id', 'is', null)
    .order('created_at', { ascending: false })

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { path_id } = await request.json()
  if (!path_id) return NextResponse.json({ error: 'path_id required' }, { status: 400 })

  // Load path
  const { data: path } = await admin
    .from('learning_paths')
    .select('id, title, status, courses, is_adaptive, issues_certificate')
    .eq('id', path_id)
    .eq('status', 'published')
    .single()

  if (!path) return NextResponse.json({ error: 'Path not found or not published' }, { status: 404 })

  // Check for existing enrollment
  const { data: existing } = await admin
    .from('enrollments')
    .select('id, status, progress_pct, personalized_sequence')
    .eq('user_id', user.id)
    .eq('path_id', path_id)
    .single()

  if (existing) return NextResponse.json(existing)

  // Compute personalized sequence for adaptive paths
  const rawCourses = (path.courses as PathCourse[]) ?? []
  let personalizedSequence = rawCourses.map((c, i) => ({ ...c, order_index: i, seq_status: 'not_started' }))

  if (path.is_adaptive && rawCourses.length > 1) {
    // Load learner memory
    const { data: lp } = await admin
      .from('learner_profiles')
      .select('ai_tutor_context')
      .eq('user_id', user.id)
      .single()

    const memory = (lp?.ai_tutor_context as Record<string, unknown>) ?? {}
    const knownConcepts = ((memory.known_concepts as string[]) ?? []).map((s) => s.toLowerCase())
    const struggles = ((memory.struggles_with as string[]) ?? []).map((s) => s.toLowerCase())

    // Separate mandatory and optional
    const mandatory = rawCourses.filter((c) => c.is_mandatory)
    const optional = rawCourses.filter((c) => !c.is_mandatory)

    // Score optional courses — surface gaps first, deprioritise already-known
    const scored = optional.map((c) => {
      const text = c.title.toLowerCase()
      let score = 50 // base
      const struggleMatch = struggles.some((s) => text.includes(s))
      const knownMatch = knownConcepts.some((k) => text.includes(k))
      if (struggleMatch) score += 30 // bring forward — learner needs this
      if (knownMatch) score -= 20  // push back — they may already know this
      return { ...c, score, skip_reason: knownMatch && !struggleMatch ? 'Concepts may already be familiar' : null }
    }).sort((a, b) => b.score - a.score)

    // Rebuild: mandatory courses stay in original positions; optional fill the rest
    const mandatoryPositions = mandatory.map((c) => c.order_index).sort((a, b) => a - b)
    const allPositions = rawCourses.map((_, i) => i)
    const optionalPositions = allPositions.filter((i) => !mandatoryPositions.includes(i))

    const sequenceMap: Record<number, PathCourse & { skip_reason?: string | null; seq_status: string }> = {}
    mandatory.forEach((c) => { sequenceMap[c.order_index] = { ...c, seq_status: 'not_started' } })
    optionalPositions.forEach((pos, i) => {
      if (scored[i]) sequenceMap[pos] = { ...scored[i], order_index: pos, seq_status: 'not_started' }
    })

    personalizedSequence = Object.values(sequenceMap).sort((a, b) => a.order_index - b.order_index)
  }

  const { data, error } = await admin
    .from('enrollments')
    .insert({
      user_id: user.id,
      path_id,
      enrolled_by: user.id,
      status: 'not_started',
      progress_pct: 0,
      personalized_sequence: personalizedSequence,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Auto-enroll in individual courses for progress tracking
  for (const c of personalizedSequence) {
    const { data: ce } = await admin
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', c.course_id)
      .single()
    if (!ce) {
      await admin.from('enrollments').insert({
        user_id: user.id,
        course_id: c.course_id,
        enrolled_by: user.id,
        status: 'not_started',
        progress_pct: 0,
      })
    }
  }

  // Log event
  await admin.from('learning_events').insert({
    user_id: user.id,
    event_type: 'path_enroll',
    payload: { path_id, path_title: path.title, course_count: personalizedSequence.length },
  })

  return NextResponse.json(data, { status: 201 })
}
