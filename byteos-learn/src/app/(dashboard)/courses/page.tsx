import { createClient, createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, Clock, ChevronRight, GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BentoCard } from '@/components/ui/BentoCard'

const difficultyConfig = {
  beginner: { label: 'Beginner', class: 'text-success bg-success/10 border-success/30' },
  intermediate: { label: 'Intermediate', class: 'text-warning bg-warning/10 border-warning/30' },
  advanced: { label: 'Advanced', class: 'text-destructive bg-destructive/10 border-destructive/30' },
}

export default async function CourseCatalogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createAdminClient()

  // All published courses
  const { data: courses } = await admin
    .from('courses')
    .select('id, title, description, difficulty, estimated_duration_mins, published_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })

  // User's enrollments to show progress
  const { data: enrollments } = await admin
    .from('enrollments')
    .select('course_id, status, progress_pct')
    .eq('user_id', user!.id)

  const enrollmentMap = new Map(enrollments?.map((e) => [e.course_id, e]) ?? [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-card-foreground">Course Catalog</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {courses?.length ?? 0} published course{(courses?.length ?? 0) !== 1 ? 's' : ''} available
        </p>
      </div>

      {!courses || courses.length === 0 ? (
        <BentoCard padding="lg" variant="elevated" className="rounded-card-xl text-center space-y-4">
          <div className="w-14 h-14 rounded-card-xl bg-muted flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-card-foreground">No courses available yet</h2>
            <p className="text-muted-foreground text-sm">Check back soon — new courses will appear here when published.</p>
          </div>
        </BentoCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => {
            const enrollment = enrollmentMap.get(course.id)
            const diff = difficultyConfig[course.difficulty as keyof typeof difficultyConfig]

            return (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <BentoCard padding="none" className="overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group">
                  {/* Thumbnail placeholder */}
                  <div className="h-28 bg-primary/5 flex items-center justify-center relative overflow-hidden">
                    <div className="w-12 h-12 rounded-card bg-card border border-border flex items-center justify-center shadow-sm">
                      <BookOpen className="w-6 h-6 text-primary" />
                    </div>
                    {enrollment && (
                      <div className="absolute top-3 right-3 bg-card/90 backdrop-blur rounded-pill px-2.5 py-1 flex items-center gap-1.5 border border-border">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="text-xs font-medium text-card-foreground">
                          {enrollment.status === 'completed' ? 'Completed' : `${Math.round(enrollment.progress_pct)}%`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div>
                      <h3 className="font-semibold text-card-foreground text-sm leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-muted-foreground text-xs mt-1.5 line-clamp-2 leading-relaxed">
                          {course.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {diff && (
                        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-pill border', diff.class)}>
                          {diff.label}
                        </span>
                      )}
                      {course.estimated_duration_mins && (
                        <span className="flex items-center gap-1 text-muted-foreground text-xs">
                          <Clock className="w-3 h-3" />
                          {course.estimated_duration_mins}m
                        </span>
                      )}
                      <span className="ml-auto text-primary group-hover:opacity-90 transition-colors">
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </div>

                    {enrollment && enrollment.status !== 'completed' && (
                      <div className="pt-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Progress</span>
                          <span className="text-xs font-medium text-primary">{Math.round(enrollment.progress_pct)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${enrollment.progress_pct}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </BentoCard>
              </Link>
            )
          })}
        </div>
      )}

      {/* My enrollments section */}
      {enrollments && enrollments.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-card-foreground">My enrollments</h2>
            <span className="text-xs text-muted-foreground">({enrollments.length})</span>
          </div>
        </div>
      )}
    </div>
  )
}
