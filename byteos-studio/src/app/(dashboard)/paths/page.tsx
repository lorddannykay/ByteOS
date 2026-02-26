import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import Link from 'next/link'
import { Route, Plus, BookOpen, Lock, Zap, CheckCircle2, Award } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PathCourse { course_id: string; order_index: number; is_mandatory: boolean; title: string }

export default async function PathsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()
  const orgId = await getOrCreateOrg(user!.id)

  const { data: paths } = await admin
    .from('learning_paths')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })

  // Load enrollment counts per path
  const pathIds = (paths ?? []).map((p) => p.id)
  const { data: enrollments } = pathIds.length > 0
    ? await admin.from('enrollments').select('path_id, status').in('path_id', pathIds)
    : { data: [] }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Route className="w-6 h-6 text-indigo-400" />Learning Paths
          </h1>
          <p className="text-slate-400 text-sm mt-1">Curate sequences of courses into structured programmes</p>
        </div>
        <Link href="/paths/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg transition-colors">
          <Plus className="w-4 h-4" />New path
        </Link>
      </div>

      {(!paths || paths.length === 0) ? (
        <div className="bg-slate-900 border border-slate-800 border-dashed rounded-2xl py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <Route className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <p className="text-slate-300 font-medium">No learning paths yet</p>
            <p className="text-slate-500 text-sm mt-1">Create structured programmes that chain courses into a journey.</p>
          </div>
          <Link href="/paths/new" className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
            <Plus className="w-4 h-4" />Create your first path
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(paths ?? []).map((path) => {
            const courses = (path.courses as PathCourse[]) ?? []
            const mandatoryCount = courses.filter((c) => c.is_mandatory).length
            const pe = (enrollments ?? []).filter((e) => e.path_id === path.id)
            const completedCount = pe.filter((e) => e.status === 'completed').length

            return (
              <Link key={path.id} href={`/paths/${path.id}`}
                className="bg-slate-900 border border-slate-800 hover:border-slate-600 rounded-xl p-6 space-y-4 transition-all group">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Route className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors line-clamp-1">{path.title}</h3>
                    {path.description && <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">{path.description}</p>}
                  </div>
                  <span className={cn('text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0',
                    path.status === 'published' ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-slate-700 text-slate-400'
                  )}>{path.status}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full border border-slate-700 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />{courses.length} courses
                  </span>
                  {mandatoryCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full border border-red-500/20 flex items-center gap-1">
                      <Lock className="w-3 h-3" />{mandatoryCount} mandatory
                    </span>
                  )}
                  {path.is_adaptive && (
                    <span className="text-[11px] px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 flex items-center gap-1">
                      <Zap className="w-3 h-3" />Adaptive
                    </span>
                  )}
                  {path.is_mandatory && (
                    <span className="text-[11px] px-2 py-0.5 bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/20 flex items-center gap-1">
                      <Lock className="w-3 h-3" />Org mandatory
                    </span>
                  )}
                  {path.issues_certificate && (
                    <span className="text-[11px] px-2 py-0.5 bg-yellow-500/10 text-yellow-400 rounded-full border border-yellow-500/20 flex items-center gap-1">
                      <Award className="w-3 h-3" />Certificate
                    </span>
                  )}
                </div>

                {/* Enrollment stats */}
                {pe.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    {completedCount}/{pe.length} learners completed
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
