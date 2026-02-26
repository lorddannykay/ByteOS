import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

  const { course_title, description, difficulty = 'intermediate', num_modules = 5 } = await request.json()
  if (!course_title) return NextResponse.json({ error: 'course_title required' }, { status: 400 })

  const userPrompt = `Create a course outline for:

Course title: "${course_title}"
${description ? `Description: ${description}` : ''}
Difficulty: ${difficulty}
Number of modules: ${num_modules}

Return ONLY a JSON array of module titles, nothing else. Example format:
["Introduction to the Topic", "Core Concepts", "Practical Applications", "Advanced Techniques", "Summary & Next Steps"]

Return only the JSON array:`

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 300,
        temperature: 0.6,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI provider error: ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const raw = data.choices?.[0]?.message?.content?.trim()

    // Extract JSON array from response
    const match = raw?.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ error: 'Could not parse outline', raw }, { status: 502 })

    const modules: string[] = JSON.parse(match[0])
    return NextResponse.json({ modules })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err}` }, { status: 500 })
  }
}
