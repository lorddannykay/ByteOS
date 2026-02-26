import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import { NextRequest, NextResponse } from 'next/server'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'

async function callAI(messages: { role: string; content: string }[], maxTokens = 1200) {
  const apiKey = process.env.TOGETHER_API_KEY!
  const res = await fetch(TOGETHER_API_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: MODEL, messages, max_tokens: maxTokens, temperature: 0.7 }),
  })
  if (!res.ok) throw new Error(`AI error: ${await res.text()}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.TOGETHER_API_KEY) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

  const admin = createAdminClient()
  const { title, description, difficulty = 'intermediate', num_modules = 5 } = await request.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const orgId = await getOrCreateOrg(user.id)

  // Step 1: Create the course
  const { data: course, error: courseError } = await admin
    .from('courses')
    .insert({ org_id: orgId, created_by: user.id, title, description: description ?? null, difficulty, status: 'draft' })
    .select('id')
    .single()

  if (courseError || !course) return NextResponse.json({ error: courseError?.message }, { status: 500 })

  // Step 2: Generate outline
  const outlinePrompt = `Create a course outline for:

Course: "${title}"
${description ? `Description: ${description}` : ''}
Difficulty: ${difficulty}
Modules: ${num_modules}

Return ONLY a JSON array of ${num_modules} module titles. No other text.
Example: ["Introduction", "Core Concepts", "Practical Applications", "Advanced Topics", "Summary"]`

  let moduleTitles: string[] = []
  try {
    const raw = await callAI([{ role: 'user', content: outlinePrompt }], 300)
    const match = raw.match(/\[[\s\S]*\]/)
    if (match) moduleTitles = JSON.parse(match[0])
  } catch {
    moduleTitles = Array.from({ length: num_modules }, (_, i) => `Module ${i + 1}`)
  }

  // Step 3: Generate content for each module (sequentially to avoid rate limits)
  const systemPrompt = `You are an expert instructional designer. Write clear, engaging module content.
Rules: Use ## headings, bullet lists with -, short paragraphs. No quiz. No meta-commentary. 400-600 words. Difficulty: ${difficulty}.`

  const moduleResults = []
  for (let i = 0; i < moduleTitles.length; i++) {
    const moduleTitle = moduleTitles[i]
    let body = ''
    try {
      body = await callAI([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Write the full content for module "${moduleTitle}" in course "${title}". Start directly with content.` },
      ], 1000)
    } catch {
      body = `Content for ${moduleTitle} will be written here.`
    }

    const { data: mod } = await admin
      .from('modules')
      .insert({ course_id: course.id, title: moduleTitle, content: { type: 'text', body }, order_index: i })
      .select('id')
      .single()

    moduleResults.push({ id: mod?.id, title: moduleTitle })
  }

  return NextResponse.json({ course_id: course.id, modules: moduleResults })
}
