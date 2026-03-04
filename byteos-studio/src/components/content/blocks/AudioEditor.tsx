'use client'

import { GripVertical, Trash2, Mic } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockAudio } from '@/types/content'

export function AudioBlockRow({
  block,
  onUpdate,
  onRemove,
  disabled,
  setNodeRef,
  style,
  isDragging,
  attributes,
  listeners,
}: {
  block: EditorBlockAudio
  onUpdate: (data: EditorBlockAudio['data']) => void
  onRemove: () => void
  disabled?: boolean
  setNodeRef: (el: HTMLDivElement | null) => void
  style: React.CSSProperties
  isDragging: boolean
  attributes: Record<string, unknown>
  listeners: Record<string, unknown>
}) {
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex gap-2 rounded-lg border border-slate-700 bg-slate-800/60 p-2',
        isDragging && 'opacity-80 z-50'
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none p-1 text-slate-500 hover:text-slate-400 rounded"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2">
          <Mic className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="text-xs text-slate-500">Audio</span>
        </div>
        <input
          type="url"
          value={block.data.url}
          onChange={(e) => onUpdate({ ...block.data, url: e.target.value })}
          onBlur={(e) => onUpdate({ ...block.data, url: e.target.value })}
          disabled={disabled}
          placeholder="Audio URL (MP3, WAV, etc.)"
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
        />
        <input
          type="text"
          value={block.data.title ?? ''}
          onChange={(e) => onUpdate({ ...block.data, title: e.target.value })}
          disabled={disabled}
          placeholder="Optional title"
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs focus:outline-none focus:border-indigo-500"
        />
        <textarea
          value={block.data.transcript ?? ''}
          onChange={(e) => onUpdate({ ...block.data, transcript: e.target.value })}
          disabled={disabled}
          placeholder="Optional transcript"
          rows={2}
          className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs resize-none"
        />
      </div>
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
