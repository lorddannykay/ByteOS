import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { PreviewCourseView } from '@/components/preview/PreviewCourseView'

export default async function CoursePreviewPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: course, error } = await admin
    .from('courses')
    .select('id, title, description, modules(id, title, content, order_index)')
    .eq('id', params.id)
    .eq('created_by', user.id)
    .order('order_index', { referencedTable: 'modules', ascending: true })
    .single()

  if (error || !course) redirect('/courses')

  const modules = (course as { modules?: unknown[] }).modules ?? []
  const courseForView = {
    id: course.id,
    title: course.title,
    description: course.description,
    modules,
  }

  return <PreviewCourseView course={courseForView} />
}
