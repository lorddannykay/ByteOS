/**
 * Start a batch workflow (e.g. summarize text, extract key terms).
 * Runs synchronously; returns workflow_id, status, steps, and result.
 */
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let body: { type?: string; text?: string } = {}
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { type = 'summarize', text } = body
    const inputText = (text ?? '').trim().slice(0, 15000)
    if (!inputText) return NextResponse.json({ error: 'text required' }, { status: 400 })

    const workflowId = crypto.randomUUID()
    const steps: string[] = []
    let result = ''
    let summary = ''

    if (type === 'summarize') {
      steps.push('Extract content')
      steps.push('Summarize')
      const apiKey = process.env.TOGETHER_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
      const res = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.TOGETHER_MEMORY_MODEL?.trim() || 'google/gemma-3n-E4B-it',
          messages: [
            {
              role: 'user',
              content: `Summarize the following text in 2–4 short paragraphs. Keep key points and structure.\n\n${inputText}`,
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      })
      if (!res.ok) {
        return NextResponse.json({
          workflow_id: workflowId,
          status: 'error',
          steps,
          summary: 'Summarization failed',
        })
      }
      const data = await res.json()
      result = data.choices?.[0]?.message?.content?.trim() ?? ''
      summary = result.slice(0, 200) + (result.length > 200 ? '…' : '')
    } else if (type === 'extract_terms') {
      steps.push('Extract key terms')
      const apiKey = process.env.TOGETHER_API_KEY
      if (!apiKey) return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
      const res = await fetch(TOGETHER_API_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.TOGETHER_MEMORY_MODEL?.trim() || 'google/gemma-3n-E4B-it',
          messages: [
            {
              role: 'user',
              content: `List the key terms, concepts, or phrases from the following text. One per line, no numbering.\n\n${inputText}`,
            },
          ],
          max_tokens: 400,
          temperature: 0.2,
        }),
      })
      if (!res.ok) {
        return NextResponse.json({
          workflow_id: workflowId,
          status: 'error',
          steps,
          summary: 'Extraction failed',
        })
      }
      const data = await res.json()
      result = data.choices?.[0]?.message?.content?.trim() ?? ''
      summary = result.slice(0, 200) + (result.length > 200 ? '…' : '')
    } else {
      return NextResponse.json({ error: 'Unknown workflow type' }, { status: 400 })
    }

    return NextResponse.json({
      workflow_id: workflowId,
      status: 'done',
      steps,
      current_step_index: steps.length,
      summary,
      result,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
