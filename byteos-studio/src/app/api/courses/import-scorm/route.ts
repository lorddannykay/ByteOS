import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import { XMLParser } from 'fast-xml-parser'

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function collectItems(item: { item?: unknown[] | unknown; title?: string; identifierref?: string }, out: { title: string; identifierref?: string }[] = []): { title: string; identifierref?: string }[] {
  const single = Array.isArray(item.item) ? undefined : item.item
  const list = Array.isArray(item.item) ? item.item : single ? [single] : []
  const title = (typeof item.title === 'string' ? item.title : undefined) || 'Untitled'
  const identifierref = item.identifierref ? String(item.identifierref) : undefined
  if (list.length === 0) {
    out.push({ title, identifierref })
  } else {
    for (const child of list) {
      collectItems(child as { item?: unknown[] | unknown; title?: string; identifierref?: string }, out)
    }
  }
  return out
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user.id)

  const contentType = request.headers.get('content-type') ?? ''
  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: 'Upload a SCORM 1.2 ZIP file (multipart/form-data)' }, { status: 400 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'file required' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  let zip: AdmZip
  try {
    zip = new AdmZip(buffer)
  } catch {
    return NextResponse.json({ error: 'Invalid ZIP file' }, { status: 400 })
  }

  const entries = zip.getEntries()
  let manifestXml: string | null = null
  let manifestDir = ''

  for (const entry of entries) {
    const name = entry.entryName.replace(/\\/g, '/')
    if (name.toLowerCase().endsWith('imsmanifest.xml')) {
      manifestXml = entry.getData().toString('utf8')
      manifestDir = name.replace(/\/?imsmanifest\.xml$/i, '')
      if (manifestDir) manifestDir += '/'
      break
    }
  }

  if (!manifestXml) return NextResponse.json({ error: 'imsmanifest.xml not found in the package' }, { status: 400 })

  const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true })
  let manifest: Record<string, unknown>
  try {
    manifest = parser.parse(manifestXml) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid manifest XML' }, { status: 400 })
  }

  const orgs = manifest.organizations as { organization?: unknown[] | { default?: string; item?: unknown; title?: string }; default?: string } | undefined
  const defaultId = (orgs as { default?: string })?.default
  const orgList = Array.isArray(orgs?.organization) ? orgs.organization : orgs?.organization ? [orgs.organization] : []
  const defaultOrg = defaultId
    ? orgList.find((o: { identifier?: string }) => (o as { identifier?: string }).identifier === defaultId) ?? orgList[0]
    : orgList[0]

  if (!defaultOrg) return NextResponse.json({ error: 'No organization in manifest' }, { status: 400 })

  const orgObj = defaultOrg as { title?: string; item?: unknown[] | unknown }
  const courseTitle = typeof orgObj.title === 'string' ? orgObj.title : 'Imported SCORM course'
  const items = collectItems(orgObj as { item?: unknown[] | unknown; title?: string; identifierref?: string })

  const resources = manifest.resources as { resource?: unknown[] | { identifier?: string; href?: string; '@_href'?: string } } | undefined
  const resourceList = Array.isArray(resources?.resource) ? resources.resource : resources?.resource ? [resources.resource] : []
  const resourceMap = new Map<string, { href: string }>()
  for (const res of resourceList) {
    const r = res as { identifier?: string; href?: string; '@_href'?: string }
    const id = r.identifier ?? ''
    const href = r.href ?? r['@_href'] ?? ''
    if (id) resourceMap.set(id, { href })
  }

  const now = new Date().toISOString()
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({
      org_id: orgId,
      created_by: user.id,
      title: courseTitle,
      description: 'Imported from SCORM package. You can edit this course like any other.',
      difficulty: 'intermediate',
      status: 'draft',
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  for (let i = 0; i < items.length; i++) {
    const it = items[i]
    let body = ''
    if (it.identifierref) {
      const res = resourceMap.get(it.identifierref)
      if (res?.href) {
        const path = (manifestDir + res.href).replace(/\/+/g, '/')
        const entry = entries.find((e) => e.entryName.replace(/\\/g, '/') === path || e.entryName.replace(/\\/g, '/').endsWith(res.href))
        if (entry) {
          const raw = entry.getData().toString('utf8')
          body = raw.includes('<') ? stripHtml(raw) : raw
          if (!body.trim()) body = raw.slice(0, 2000)
        }
      }
    }
    if (!body.trim()) body = `Content for: ${it.title}`

    await admin
      .from('modules')
      .insert({
        course_id: course.id,
        title: it.title,
        content: { type: 'text', body: body.slice(0, 50000) },
        order_index: i,
      })
  }

  return NextResponse.json({ course_id: course.id })
}
