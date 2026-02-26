'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, GripVertical, Globe, FileText,
  ChevronDown, ChevronUp, Loader2, CheckCircle2, Sparkles, Wand2, LayoutList, Zap,
  CircleHelp, RefreshCcw
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct: number
  explanation: string
  topic: string
}

interface Module {
  id: string
  title: string
  content: { type: string; body: string }
  order_index: number
  quiz?: { questions: QuizQuestion[] } | null
}

interface Course {
  id: string
  title: string
  description: string | null
  status: string
  difficulty: string | null
  estimated_duration_mins: number | null
  is_adaptive: boolean
  modules: Module[]
}

export default function CourseEditorPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedModule, setExpandedModule] = useState<string | null>(null)

  // AI state
  const [generatingOutline, setGeneratingOutline] = useState(false)
  const [generatingModule, setGeneratingModule] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState<Record<string, string>>({})
  const [showAiPanel, setShowAiPanel] = useState<string | null>(null)
  const [generatingQuiz, setGeneratingQuiz] = useState<string | null>(null)

  const fetchCourse = useCallback(async () => {
    const res = await fetch(`/api/courses/${id}`)
    if (!res.ok) { router.push('/courses'); return }
    const data = await res.json()
    setCourse(data)
    setLoading(false)
    if (data.modules?.length > 0) setExpandedModule(data.modules[0].id)
  }, [id, router])

  useEffect(() => { fetchCourse() }, [fetchCourse])

  async function saveCourse(updates: Partial<Course>) {
    if (!course) return
    setSaving(true); setSaved(false)
    await fetch(`/api/courses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setCourse((c) => c ? { ...c, ...updates } : c)
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  async function addModule(title = 'Untitled Module') {
    const res = await fetch(`/api/courses/${id}/modules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: { type: 'text', body: '' } }),
    })
    const mod = await res.json()
    setCourse((c) => c ? { ...c, modules: [...c.modules, mod] } : c)
    setExpandedModule(mod.id)
    return mod
  }

  async function saveModule(moduleId: string, updates: Partial<Module>) {
    await fetch(`/api/courses/${id}/modules/${moduleId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    setCourse((c) => c ? {
      ...c, modules: c.modules.map((m) => m.id === moduleId ? { ...m, ...updates } : m),
    } : c)
  }

  async function deleteModule(moduleId: string) {
    await fetch(`/api/courses/${id}/modules/${moduleId}`, { method: 'DELETE' })
    setCourse((c) => c ? { ...c, modules: c.modules.filter((m) => m.id !== moduleId) } : c)
    if (expandedModule === moduleId) setExpandedModule(null)
  }

  async function togglePublish() {
    if (!course) return
    setPublishing(true); setError(null)
    const isPublished = course.status === 'published'
    const res = await fetch(`/api/courses/${id}/publish`, { method: isPublished ? 'DELETE' : 'POST' })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setPublishing(false); return }
    setCourse((c) => c ? { ...c, status: data.status } : c)
    setPublishing(false)
  }

  // ─── AI: Generate course outline ─────────────────────────────────────────
  async function generateOutline() {
    if (!course) return
    setGeneratingOutline(true); setError(null)
    const res = await fetch('/api/ai/generate-outline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        course_title: course.title,
        description: course.description,
        difficulty: course.difficulty,
        num_modules: 5,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setGeneratingOutline(false); return }

    // Create all modules from the outline
    for (const title of data.modules) {
      await addModule(title)
    }
    setGeneratingOutline(false)
  }

  // ─── AI: Generate module content ─────────────────────────────────────────
  async function generateModuleContent(moduleId: string) {
    if (!course) return
    const prompt = aiPrompt[moduleId]?.trim()
    if (!prompt) return

    setGeneratingModule(moduleId)
    const mod = course.modules.find((m) => m.id === moduleId)

    const res = await fetch('/api/ai/generate-module', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: prompt,
        course_title: course.title,
        module_title: mod?.title,
        difficulty: course.difficulty,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setGeneratingModule(null); return }

    await saveModule(moduleId, { content: { type: 'text', body: data.content } })
    setShowAiPanel(null)
    setAiPrompt((p) => ({ ...p, [moduleId]: '' }))
    setGeneratingModule(null)
  }

  // ─── AI: Generate quiz for module ─────────────────────────────────────────
  async function generateQuiz(moduleId: string) {
    if (!course) return
    const mod = course.modules.find((m) => m.id === moduleId)
    if (!mod?.content?.body?.trim()) { setError('Write module content before generating a quiz.'); return }

    setGeneratingQuiz(moduleId)
    const res = await fetch('/api/ai/generate-quiz', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        module_id: moduleId,
        course_title: course.title,
        module_title: mod.title,
        content: mod.content.body,
        difficulty: course.difficulty,
        num_questions: 4,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error ?? 'Quiz generation failed'); setGeneratingQuiz(null); return }

    setCourse((c) => c ? {
      ...c,
      modules: c.modules.map((m) => m.id === moduleId ? { ...m, quiz: data.quiz } : m),
    } : c)
    setGeneratingQuiz(null)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
    </div>
  )
  if (!course) return null

  const isPublished = course.status === 'published'

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-4">
        <Link href="/courses" className="flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors shrink-0">
          <ArrowLeft className="w-4 h-4" />Courses
        </Link>
        <div className="flex items-center gap-2">
          {saved && <span className="flex items-center gap-1.5 text-green-400 text-xs"><CheckCircle2 className="w-3.5 h-3.5" />Saved</span>}
          {saving && <Loader2 className="w-3.5 h-3.5 text-slate-500 animate-spin" />}
          <button
            onClick={togglePublish}
            disabled={publishing}
            className={cn('flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              isPublished ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-green-600 hover:bg-green-500 text-white'
            )}
          >
            {publishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : isPublished ? <FileText className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
            {isPublished ? 'Unpublish' : 'Publish'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
      )}

      {/* Course metadata */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full',
            isPublished ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-300'
          )}>
            {isPublished ? 'Published' : 'Draft'}
          </span>
        </div>
        <input
          type="text" defaultValue={course.title}
          onBlur={(e) => { if (e.target.value !== course.title) saveCourse({ title: e.target.value }) }}
          className="w-full bg-transparent text-white text-2xl font-semibold focus:outline-none placeholder-slate-600 border-b border-transparent focus:border-slate-700 pb-1 transition-colors"
          placeholder="Course title"
        />
        <textarea
          defaultValue={course.description ?? ''}
          onBlur={(e) => saveCourse({ description: e.target.value || null })}
          rows={2} placeholder="Add a description..."
          className="w-full bg-transparent text-slate-400 text-sm focus:outline-none placeholder-slate-600 resize-none border-b border-transparent focus:border-slate-700 pb-1 transition-colors"
        />
        <div className="flex items-center gap-6 pt-1">
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Difficulty</label>
            <select value={course.difficulty ?? 'intermediate'} onChange={(e) => saveCourse({ difficulty: e.target.value })}
              className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500">
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-slate-500 font-medium">Duration (mins)</label>
            <input type="number" defaultValue={course.estimated_duration_mins ?? ''}
              onBlur={(e) => saveCourse({ estimated_duration_mins: e.target.value ? Number(e.target.value) : null })}
              placeholder="e.g. 30"
              className="w-24 bg-slate-800 border border-slate-700 text-white text-sm rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Adaptive learning toggle */}
        <div className="border-t border-slate-800 pt-4 mt-2">
          <button
            type="button"
            onClick={() => saveCourse({ is_adaptive: !course.is_adaptive })}
            className={cn(
              'w-full flex items-start gap-4 p-4 rounded-xl border transition-all text-left',
              course.is_adaptive
                ? 'bg-violet-950/40 border-violet-500/30 hover:border-violet-400/50'
                : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
              course.is_adaptive ? 'bg-violet-600/20 border border-violet-500/30' : 'bg-slate-700 border border-slate-600'
            )}>
              <Zap className={cn('w-5 h-5', course.is_adaptive ? 'text-violet-400' : 'text-slate-500')} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className={cn('text-sm font-semibold', course.is_adaptive ? 'text-violet-200' : 'text-slate-300')}>
                  Adaptive Learning
                </p>
                {course.is_adaptive && (
                  <span className="text-[10px] px-2 py-0.5 bg-violet-500/20 text-violet-300 rounded-full border border-violet-500/30 font-medium">
                    ON
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {course.is_adaptive
                  ? 'Byte will generate a personalized welcome for each learner on enrollment, bridging their past knowledge to this course.'
                  : 'Enable to let Byte personalise this course for each learner — connecting their memory, prior courses, and goals to this content.'}
              </p>
            </div>
            {/* Toggle indicator */}
            <div className={cn(
              'w-10 h-6 rounded-full flex items-center transition-all shrink-0 mt-0.5 px-0.5',
              course.is_adaptive ? 'bg-violet-600 justify-end' : 'bg-slate-700 justify-start'
            )}>
              <div className="w-5 h-5 bg-white rounded-full shadow-sm" />
            </div>
          </button>
        </div>
      </div>

      {/* Modules */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            Modules <span className="text-slate-500 font-normal">({course.modules.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {course.modules.length === 0 && (
              <button
                onClick={generateOutline}
                disabled={generatingOutline}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-medium rounded-lg transition-all"
              >
                {generatingOutline ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {generatingOutline ? 'Generating outline...' : 'Generate outline with AI'}
              </button>
            )}
            <button onClick={() => addModule()} className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
              <Plus className="w-4 h-4" />Add module
            </button>
          </div>
        </div>

        {course.modules.length === 0 && (
          <div className="bg-slate-900 border border-slate-800 border-dashed rounded-xl p-10 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-violet-600/15 border border-violet-500/20 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-violet-400" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-300 text-sm font-medium">No modules yet</p>
              <p className="text-slate-500 text-xs">Generate a complete course outline with AI, or add modules manually.</p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={generateOutline}
                disabled={generatingOutline}
                className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {generatingOutline ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {generatingOutline ? 'Generating...' : 'Generate outline with AI'}
              </button>
              <button onClick={() => addModule()} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-lg transition-colors">
                <LayoutList className="w-4 h-4" />Add manually
              </button>
            </div>
          </div>
        )}

        {course.modules.map((mod, idx) => (
          <div key={mod.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            {/* Module header */}
            <div className="flex items-center gap-3 px-4 py-3">
              <GripVertical className="w-4 h-4 text-slate-600 shrink-0" />
              <span className="text-xs font-medium text-slate-600 w-5">{idx + 1}</span>
              <input
                type="text" defaultValue={mod.title}
                onBlur={(e) => { if (e.target.value !== mod.title) saveModule(mod.id, { title: e.target.value }) }}
                className="flex-1 bg-transparent text-slate-200 text-sm font-medium focus:outline-none placeholder-slate-600"
                placeholder="Module title"
              />
              <div className="flex items-center gap-1">
                <button
                  onClick={() => deleteModule(mod.id)}
                  className="p-1.5 text-slate-600 hover:text-red-400 rounded-md hover:bg-slate-800 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setExpandedModule(expandedModule === mod.id ? null : mod.id)}
                  className="p-1.5 text-slate-500 hover:text-slate-300 rounded-md hover:bg-slate-800 transition-all"
                >
                  {expandedModule === mod.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Module content editor */}
            {expandedModule === mod.id && (
              <div className="border-t border-slate-800 p-4 space-y-3">
                {/* AI panel toggle */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Content saves automatically when you click outside.</p>
                  <button
                    onClick={() => setShowAiPanel(showAiPanel === mod.id ? null : mod.id)}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                      showAiPanel === mod.id
                        ? 'bg-violet-600/20 border border-violet-500/30 text-violet-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-violet-300'
                    )}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    {mod.content?.body ? 'Regenerate with AI' : 'Generate with AI'}
                  </button>
                </div>

                {/* AI generation panel */}
                {showAiPanel === mod.id && (
                  <div className="bg-violet-950/30 border border-violet-500/20 rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-violet-400 shrink-0" />
                      <p className="text-violet-200 text-xs font-medium">What should this module cover?</p>
                    </div>
                    <textarea
                      value={aiPrompt[mod.id] ?? ''}
                      onChange={(e) => setAiPrompt((p) => ({ ...p, [mod.id]: e.target.value }))}
                      placeholder={`e.g. "Explain ${mod.title} with real-world examples and key takeaways"`}
                      rows={2}
                      className="w-full bg-slate-800/80 border border-violet-500/20 rounded-lg text-slate-200 text-xs p-3 focus:outline-none focus:border-violet-400 resize-none placeholder-slate-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => generateModuleContent(mod.id)}
                        disabled={!aiPrompt[mod.id]?.trim() || generatingModule === mod.id}
                        className="flex items-center gap-2 px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-xs font-medium rounded-lg transition-all"
                      >
                        {generatingModule === mod.id ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" />Generating...</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" />Generate content</>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setShowAiPanel(null)
                          setAiPrompt((p) => ({ ...p, [mod.id]: '' }))
                        }}
                        className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs rounded-lg hover:bg-slate-800 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Content textarea */}
                <div className="relative">
                  {generatingModule === mod.id && (
                    <div className="absolute inset-0 bg-slate-900/80 rounded-lg flex items-center justify-center z-10">
                      <div className="flex items-center gap-2 text-violet-300 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Writing module content...
                      </div>
                    </div>
                  )}
                  <textarea
                    key={`${mod.id}-${mod.content?.body?.length}`}
                    defaultValue={mod.content?.body ?? ''}
                    onBlur={(e) => saveModule(mod.id, { content: { type: 'text', body: e.target.value } })}
                    rows={12}
                    placeholder="Write your module content here, or use 'Generate with AI' above..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm p-3 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 resize-none leading-relaxed transition-all font-mono"
                  />
                </div>

                {mod.content?.body && (
                  <p className="text-xs text-slate-600 text-right">
                    {mod.content.body.split(/\s+/).filter(Boolean).length} words
                  </p>
                )}

                {/* Quiz section */}
                <div className="border-t border-slate-800 pt-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CircleHelp className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-medium text-slate-400">Module Quiz</span>
                      {mod.quiz?.questions?.length && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/15 text-green-400 border border-green-500/20 rounded-full">
                          {mod.quiz.questions.length} questions
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => generateQuiz(mod.id)}
                      disabled={generatingQuiz === mod.id || !mod.content?.body?.trim()}
                      title={!mod.content?.body?.trim() ? 'Add content before generating a quiz' : ''}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-all"
                    >
                      {generatingQuiz === mod.id
                        ? <><Loader2 className="w-3 h-3 animate-spin" />Generating...</>
                        : mod.quiz?.questions?.length
                          ? <><RefreshCcw className="w-3 h-3" />Regenerate quiz</>
                          : <><CircleHelp className="w-3 h-3" />Generate quiz</>}
                    </button>
                  </div>

                  {mod.quiz?.questions?.length ? (
                    <div className="space-y-2">
                      {mod.quiz.questions.map((q, qi) => (
                        <div key={q.id} className="bg-slate-800/60 border border-slate-700 rounded-lg p-3 space-y-2">
                          <p className="text-xs font-medium text-slate-300">
                            <span className="text-slate-600 mr-1.5">Q{qi + 1}.</span>{q.question}
                          </p>
                          <div className="grid grid-cols-2 gap-1">
                            {q.options.map((opt, oi) => (
                              <p key={oi} className={cn('text-[10px] px-2 py-1 rounded',
                                oi === q.correct ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'text-slate-500'
                              )}>
                                {String.fromCharCode(65 + oi)}. {opt}
                              </p>
                            ))}
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded font-medium shrink-0">topic</span>
                            <p className="text-[10px] text-slate-500">{q.topic}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600 italic">
                      {mod.content?.body?.trim() ? 'No quiz yet — generate one above.' : 'Add module content first.'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
