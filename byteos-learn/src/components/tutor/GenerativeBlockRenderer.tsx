'use client'

import Link from 'next/link'
import type { TutorBlock, TutorAction } from '@/types/tutor'
import { TUTOR_BLOCK_TYPES } from '@/types/tutor'
import { ExternalLink, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

function renderTextContent(text: string): React.ReactNode {
  if (!text?.trim()) return null
  const lines = text.split('\n')
  return (
    <span className="whitespace-pre-wrap">
      {lines.map((line, i) => {
        const parts: React.ReactNode[] = []
        let remaining = line
        let key = 0
        while (remaining.length > 0) {
          const boldStart = remaining.indexOf('**')
          if (boldStart === -1) {
            parts.push(<span key={key++}>{remaining}</span>)
            break
          }
          if (boldStart > 0) parts.push(<span key={key++}>{remaining.slice(0, boldStart)}</span>)
          const boldEnd = remaining.indexOf('**', boldStart + 2)
          if (boldEnd === -1) {
            parts.push(<span key={key++}>{remaining.slice(boldStart)}</span>)
            break
          }
          parts.push(<strong key={key++} className="font-semibold">{remaining.slice(boldStart + 2, boldEnd)}</strong>)
          remaining = remaining.slice(boldEnd + 2)
        }
        return (
          <span key={i}>
            {i > 0 ? <br /> : null}
            {parts.length === 1 ? parts[0] : parts}
          </span>
        )
      })}
    </span>
  )
}

function TextBlock({ payload }: { payload: Record<string, unknown> }) {
  const content = (payload.content as string) ?? ''
  return <div className="text-sm">{renderTextContent(content)}</div>
}

function ActionGroupBlock({
  payload,
  onActionClick,
}: {
  payload: Record<string, unknown>
  onActionClick?: (action: TutorAction) => void
}) {
  const actions = (payload.actions as TutorAction[]) ?? []
  if (actions.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {actions.map((action, aIdx) => (
        <Link
          key={aIdx}
          href={action.href}
          onClick={() => onActionClick?.(action)}
          className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-4 py-2 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          {action.label}
        </Link>
      ))}
    </div>
  )
}

function CardBlock({ payload }: { payload: Record<string, unknown> }) {
  const title = (payload.title as string) ?? ''
  const description = (payload.description as string) ?? ''
  const imageUrl = payload.image_url as string | undefined
  const action = payload.action as TutorAction | undefined
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm mt-2">
      {imageUrl && (
        <div className="h-24 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${imageUrl})` }} />
      )}
      <div className="p-3">
        <h4 className="font-semibold text-card-foreground">{title}</h4>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        {action && (
          <Link
            href={action.href}
            className="inline-flex items-center gap-1 mt-2 text-xs font-medium text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {action.label}
          </Link>
        )}
      </div>
    </div>
  )
}

function WorkflowStatusBlock({ payload }: { payload: Record<string, unknown> }) {
  const name = (payload.name as string) ?? 'Workflow'
  const steps = (payload.steps as string[]) ?? []
  const currentStepIndex = (payload.current_step_index as number) ?? 0
  const status = (payload.status as 'running' | 'done' | 'error') ?? 'running'
  const summary = payload.summary as string | undefined
  return (
    <div className="rounded-xl border border-border bg-card p-3 mt-2 space-y-2">
      <div className="flex items-center gap-2">
        {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
        {status === 'done' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
        {status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
        <span className="font-medium text-card-foreground">{name}</span>
      </div>
      {steps.length > 0 && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {steps.map((step, i) => (
            <li key={i} className={cn(i === currentStepIndex && status === 'running' && 'text-primary font-medium')}>
              {i < currentStepIndex ? '✓ ' : ''}
              {step}
            </li>
          ))}
        </ul>
      )}
      {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
    </div>
  )
}

function ExternalActionBlock({ payload }: { payload: Record<string, unknown> }) {
  const appId = (payload.app_id as string) ?? 'app'
  const label = (payload.label as string) ?? 'Open'
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/50 px-3 py-2 mt-2 text-xs text-muted-foreground">
      Connected app: {appId} — {label}
    </div>
  )
}

const BLOCK_RENDERERS: Record<
  string,
  (props: { payload: Record<string, unknown>; onActionClick?: (action: TutorAction) => void }) => React.ReactNode
> = {
  text: ({ payload }) => <TextBlock payload={payload} />,
  action_group: (props) => <ActionGroupBlock {...props} />,
  card: ({ payload }) => <CardBlock payload={payload} />,
  workflow_status: ({ payload }) => <WorkflowStatusBlock payload={payload} />,
  external_action: ({ payload }) => <ExternalActionBlock payload={payload} />,
}

export interface GenerativeBlockRendererProps {
  blocks: TutorBlock[]
  onActionClick?: (action: TutorAction) => void
  className?: string
}

export function GenerativeBlockRenderer({ blocks, onActionClick, className }: GenerativeBlockRendererProps) {
  if (!blocks?.length) return null
  return (
    <div className={cn('space-y-2', className)}>
      {blocks.map((block) => {
        const Renderer = TUTOR_BLOCK_TYPES.includes(block.type as (typeof TUTOR_BLOCK_TYPES)[number])
          ? BLOCK_RENDERERS[block.type]
          : null
        if (!Renderer) return <div key={block.id} className="text-xs text-muted-foreground" />
        return (
          <div key={block.id}>
            <Renderer payload={block.payload} onActionClick={onActionClick} />
          </div>
        )
      })}
    </div>
  )
}
