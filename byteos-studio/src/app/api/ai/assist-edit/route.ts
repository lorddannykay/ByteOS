import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'
const MODEL = 'meta-llama/Llama-3.3-70B-Instruct-Turbo'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apiKey = process.env.TOGETHER_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'TOGETHER_API_KEY not configured' }, { status: 500 })

  const body = await request.json()
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  const instruction = typeof body?.instruction === 'string' ? body.instruction.trim() : 'improve clarity'

  if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 })

  const systemPrompt = `You are an editorial assistant. Given the user's selected text and optional instruction, return ONLY the revised text. No explanation, no preamble, no markdown. Just the revised text.`

  const userPrompt = instruction
    ? `Selected text:\n\n${text}\n\nInstruction: ${instruction}\n\nReturn only the revised text:`
    : `Selected text:\n\n${text}\n\nImprove it for clarity and concision. Return only the revised text:`

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
        max_tokens: 500,
        temperature: 0.3,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: `AI provider error: ${err}` }, { status: 502 })
    }

    const data = await response.json()
    const revised = data.choices?.[0]?.message?.content?.trim()

    if (!revised) return NextResponse.json({ error: 'No revision generated' }, { status: 502 })

    return NextResponse.json({ revised })
  } catch (err) {
    return NextResponse.json({ error: `Assist failed: ${err}` }, { status: 500 })
  }
}
