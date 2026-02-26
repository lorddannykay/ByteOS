'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen,
  LayoutDashboard,
  Route,
  Users,
  BarChart2,
  Shield,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

interface SidebarProps {
  user: {
    email: string
    full_name?: string | null
    avatar_url?: string | null
  }
}

const navItems = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Courses',
    href: '/courses',
    icon: BookOpen,
  },
  {
    label: 'Learning Paths',
    href: '/paths',
    icon: Route,
  },
  {
    label: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart2,
  },
  {
    label: 'Compliance',
    href: '/compliance',
    icon: Shield,
  },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const initials = user.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user.email.slice(0, 2).toUpperCase()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20 group-hover:bg-indigo-500 transition-colors">
            <BookOpen className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">ByteOS</p>
            <p className="text-indigo-400 text-xs font-medium">Studio</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                isActive
                  ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              )}
            >
              <item.icon
                className={cn(
                  'w-4 h-4 shrink-0',
                  isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <ChevronRight className="w-3 h-3 text-indigo-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Settings + User */}
      <div className="p-3 border-t border-slate-800 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
            pathname.startsWith('/settings')
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          )}
        >
          <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" strokeWidth={2} />
          Settings
        </Link>

        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-3 mt-1">
          <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
            <span className="text-indigo-300 text-xs font-semibold">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-200 text-sm font-medium truncate leading-tight">
              {user.full_name ?? 'User'}
            </p>
            <p className="text-slate-500 text-xs truncate">{user.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
