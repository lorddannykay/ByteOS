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

  const { topic, course_title, module_title, difficulty = 'intermediate', context } = await request.json()
  if (!topic) return NextResponse.json({ error: 'topic required' }, { status: 400 })

  const systemPrompt = `You are an expert instructional designer and educator at ByteOS.
Your job is to write clear, engaging, well-structured learning module content.

Rules:
- Write in plain text with markdown-style headings (## for sections, ### for subsections)
- Use practical examples and real-world scenarios
- Keep paragraphs short and scannable (3-5 sentences max)
- Use bullet lists for key concepts, steps, and comparisons
- Difficulty level: ${difficulty}
- Do NOT include a quiz — just the learning content
- Do NOT include meta-commentary like "Here is the module..." — start directly with the content
- Target length: 400-700 words`

  const userPrompt = `Write a learning module for the following:

Course: "${course_title || 'General Course'}"
Module title: "${module_title || topic}"
Topic: ${topic}
${context ? `Additional context: ${context}` : ''}

Write the full module content now.`

  try {
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 1200,
        temperature: 0.7,
        top_p: 0.9,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI provider error: ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()

    if (!content) return NextResponse.json({ error: 'No content generated' }, { status: 502 })

    return NextResponse.json({ content })
  } catch (err) {
    return NextResponse.json({ error: `Generation failed: ${err}` }, { status: 500 })
  }
}
