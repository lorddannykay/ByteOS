import { createClient, createAdminClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const body = await request.json()
  const updates: Record<string, unknown> = {}
  if ('title' in body) updates.title = body.title
  if ('content' in body) updates.content = body.content
  if ('order_index' in body) updates.order_index = body.order_index

  const { data, error } = await admin
    .from('modules')
    .update(updates)
    .eq('id', params.moduleId)
    .eq('course_id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _: NextRequest,
  { params }: { params: { id: string; moduleId: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { error } = await admin
    .from('modules')
    .delete()
    .eq('id', params.moduleId)
    .eq('course_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
