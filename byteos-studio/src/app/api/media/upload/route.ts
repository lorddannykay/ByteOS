import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

const BUCKET = 'course-media'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file') as File | null
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const type = file.type?.toLowerCase()
  if (!type || !ALLOWED_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'File too large. Max 5MB.' }, { status: 400 })
  }

  const orgId = await getOrCreateOrg(user.id)
  const courseId = (formData.get('course_id') as string)?.trim() || 'shared'
  const ext = type.split('/')[1] || 'jpg'
  const name = `${crypto.randomUUID()}.${ext}`
  const path = `${orgId}/${courseId}/${name}`

  const admin = createAdminClient()
  const buffer = Buffer.from(await file.arrayBuffer())

  const { data, error } = await admin.storage.from(BUCKET).upload(path, buffer, {
    contentType: type,
    upsert: false,
  })

  if (error) {
    if (error.message?.includes('Bucket not found') || error.message?.includes('bucket')) {
      return NextResponse.json(
        { error: 'Storage bucket "course-media" is not configured. Create a public bucket in Supabase Dashboard.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data: urlData } = admin.storage.from(BUCKET).getPublicUrl(data.path)
  const url = urlData.publicUrl

  return NextResponse.json({ url, path: data.path })
}
