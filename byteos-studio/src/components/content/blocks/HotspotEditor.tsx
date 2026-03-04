'use client'

import { GripVertical, Trash2, Plus, ImageIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EditorBlockHotspot } from '@/types/content'

function HotspotEditorInner({
  data,
  onUpdate,
  disabled,
}: {
  data: EditorBlockHotspot['data']
  onUpdate: (data: EditorBlockHotspot['data']) => void
  disabled?: boolean
}) {
  const spots = data.spots ?? []
  const updateSpot = (index: number, patch: Partial<{ x: number; y: number; label: string; content: string }>) => {
    const next = [...spots]
    next[index] = { ...next[index], x: 0, y: 0, label: '', content: '', ...next[index], ...patch }
    onUpdate({ ...data, spots: next })
  }
  const addSpot = () => onUpdate({ ...data, spots: [...spots, { x: 50, y: 50, label: '', content: '' }] })
  const removeSpot = (index: number) => {
    const next = spots.filter((_, i) => i !== index)
    onUpdate({ ...data, spots: next })
  }
  return (
    <div className="flex-1 min-w-0 space-y-2">
      <div className="flex items-center gap-2">
        <ImageIcon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <span className="text-xs text-slate-500">Image hotspot</span>
      </div>
      <input
        type="url"
        value={data.imageUrl ?? ''}
        onChange={(e) => onUpdate({ ...data, imageUrl: e.target.value })}
        disabled={disabled}
        placeholder="Image URL"
        className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
      />
      {data.imageUrl && (
        <div className="relative rounded border border-slate-700 overflow-hidden bg-slate-900 max-h-32">
          <img src={data.imageUrl} alt="Hotspot" className="w-full h-auto max-h-32 object-contain" />
        </div>
      )}
      {spots.map((spot, idx) => (
        <div key={idx} className="rounded border border-slate-700 bg-slate-900/60 p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-500">Spot {idx + 1} (x: {spot.x}%, y: {spot.y}%)</span>
            {!disabled && (
              <button type="button" onClick={() => removeSpot(idx)} className="text-xs text-slate-500 hover:text-red-400">
                Remove
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              max={100}
              value={spot.x}
              onChange={(e) => updateSpot(idx, { x: Number(e.target.value) })}
              disabled={disabled}
              placeholder="X %"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            />
            <input
              type="number"
              min={0}
              max={100}
              value={spot.y}
              onChange={(e) => updateSpot(idx, { y: Number(e.target.value) })}
              disabled={disabled}
              placeholder="Y %"
              className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
            />
          </div>
          <input
            type="text"
            value={spot.label}
            onChange={(e) => updateSpot(idx, { label: e.target.value })}
            disabled={disabled}
            placeholder="Label"
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200 text-xs"
          />
          <textarea
            value={spot.content}
            onChange={(e) => updateSpot(idx, { content: e.target.value })}
            disabled={disabled}
            placeholder="Content (shown on click)"
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-400 text-xs resize-none"
          />
        </div>
      ))}
      {!disabled && (
        <button
          type="button"
          onClick={addSpot}
          className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-dashed border-slate-700"
        >
          <Plus className="w-3 h-3" /> Add hotspot
        </button>
      )}
    </div>
  )
}

export function HotspotBlockRow({
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
  block: EditorBlockHotspot
  onUpdate: (data: EditorBlockHotspot['data']) => void
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
      <HotspotEditorInner data={block.data} onUpdate={onUpdate} disabled={disabled} />
      {!disabled && (
        <button type="button" onClick={onRemove} className="p-1 text-slate-500 hover:text-red-400 rounded">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  )
}
