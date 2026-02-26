import { createClient, createAdminClient } from '@/lib/supabase/server'
import { Bot, Lock, Pencil, Brain, BookOpen, AlertTriangle } from 'lucide-react'
import { MemoryEditor } from './MemoryEditor'
import { BentoCard } from '@/components/ui/BentoCard'

export default async function MemoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('learner_profiles')
    .select('ai_tutor_context, learning_pace, difficulty_comfort, cognitive_style, interaction_count')
    .eq('user_id', user!.id)
    .single()

  const memory = (profile?.ai_tutor_context as Record<string, unknown>) ?? {}
  const interactionCount = (memory.interaction_count as number) ?? 0

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-card bg-primary flex items-center justify-center shadow-sm">
          <Bot className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-card-foreground">Byte&apos;s Memory</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            What Byte knows about you — built from {interactionCount} interaction{interactionCount !== 1 ? 's' : ''}.
          </p>
        </div>
      </div>

      {/* Info banner */}
      <BentoCard padding="md" className="bg-warning/10 border-warning/30 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <div className="text-sm text-warning-foreground space-y-1">
          <p className="font-medium">How this memory works</p>
          <p className="text-xs leading-relaxed">
            Byte automatically builds a model of you from your questions and interactions.
            You can add context that helps Byte help you better — like your background or learning goals.
            AI-observed data (concepts Byte thinks you understood) is shown separately and cannot be manually inflated.
          </p>
        </div>
      </BentoCard>

      {/* AI-observed — read-only */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Observed by Byte</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">AI-written · read-only</span>
        </div>

        <BentoCard padding="none" className="divide-y divide-border overflow-hidden">
          <MemorySection
            icon={<Brain className="w-4 h-4 text-green-500" />}
            title="Concepts you've engaged with"
            items={(memory.known_concepts as string[]) ?? []}
            empty="None recorded yet — keep learning!"
            pill="bg-green-100 text-green-700"
          />
          <MemorySection
            icon={<AlertTriangle className="w-4 h-4 text-orange-500" />}
            title="Areas where you've shown uncertainty"
            items={(memory.struggles_with as string[]) ?? []}
            empty="No struggles detected — great progress!"
            pill="bg-orange-100 text-orange-700"
          />
          <div className="px-5 py-4 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-card-foreground">Learning style notes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {(memory.learning_style_notes as string) || <span className="text-muted-foreground italic">Not yet observed</span>}
            </p>
          </div>
        </BentoCard>
      </div>

      {/* User-editable */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Pencil className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold text-card-foreground">Your context</h2>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-pill">You control this</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Help Byte understand your background and goals. This gets injected into every conversation.
        </p>
        <MemoryEditor
          userId={user!.id}
          initialBackground={(memory.self_reported_background as string) ?? ''}
          initialGoals={(memory.learning_goals as string) ?? ''}
          initialPreference={(memory.preferred_explanation_style as string) ?? ''}
        />
      </div>
    </div>
  )
}

function MemorySection({ icon, title, items, empty, pill }: {
  icon: React.ReactNode
  title: string
  items: string[]
  empty: string
  pill: string
}) {
  return (
    <div className="px-5 py-4 space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-sm font-medium text-card-foreground">{title}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-muted-foreground text-xs italic">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item) => (
            <span key={item} className={`text-xs px-2.5 py-1 rounded-full font-medium ${pill}`}>
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
