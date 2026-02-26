import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getOrCreateOrg } from '@/lib/org'
import Link from 'next/link'
import { Plus, BookOpen, Clock, Globe, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'

const statusConfig = {
  draft: { label: 'Draft', class: 'bg-slate-700 text-slate-300' },
  published: { label: 'Published', class: 'bg-green-500/15 text-green-400 border border-green-500/20' },
  archived: { label: 'Archived', class: 'bg-slate-800 text-slate-500' },
}

const difficultyConfig = {
  beginner: 'text-emerald-400',
  intermediate: 'text-amber-400',
  advanced: 'text-red-400',
}

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const orgId = await getOrCreateOrg(user!.id)
  const admin = createAdminClient()

  const { data: courses } = await admin
    .from('courses')
    .select('id, title, description, status, difficulty, estimated_duration_mins, updated_at')
    .eq('org_id', orgId)
    .order('updated_at', { ascending: false })

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Courses</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {courses?.length ?? 0} course{courses?.length !== 1 ? 's' : ''} in your workspace
          </p>
        </div>
        <Link
          href="/courses/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New course
        </Link>
      </div>

      {/* Course grid */}
      {!courses || courses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 text-slate-600" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-base font-medium text-white">No courses yet</h2>
            <p className="text-slate-500 text-sm">Create your first course to get started.</p>
          </div>
          <Link
            href="/courses/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const status = statusConfig[course.status as keyof typeof statusConfig] ?? statusConfig.draft
            const diffClass = difficultyConfig[course.difficulty as keyof typeof difficultyConfig] ?? 'text-slate-400'

            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:bg-slate-800/60 transition-all group space-y-4"
              >
                {/* Icon */}
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-indigo-600/15 border border-indigo-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-indigo-400" />
                  </div>
                  <span className={cn('text-xs font-medium px-2 py-1 rounded-full', status.class)}>
                    {status.label}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <h3 className="text-white font-medium text-sm leading-snug group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  )}
                </div>

                {/* Meta */}
                <div className="flex items-center gap-3 pt-1">
                  {course.difficulty && (
                    <span className={cn('text-xs font-medium capitalize', diffClass)}>
                      {course.difficulty}
                    </span>
                  )}
                  {course.estimated_duration_mins && (
                    <span className="flex items-center gap-1 text-slate-500 text-xs">
                      <Clock className="w-3 h-3" />
                      {course.estimated_duration_mins}m
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-slate-600 text-xs ml-auto">
                    {course.status === 'published' ? (
                      <Globe className="w-3 h-3" />
                    ) : (
                      <FileText className="w-3 h-3" />
                    )}
                    {new Date(course.updated_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
