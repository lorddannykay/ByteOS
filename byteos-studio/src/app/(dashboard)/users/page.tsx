'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Users, Loader2, AlertCircle, UserPlus, ChevronRight, Mail, Upload } from 'lucide-react'

interface UserRow {
  id: string
  full_name: string | null
  email: string | null
  org_role: string
  status: string
}

export default function UsersPage() {
  const [list, setList] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [showBulk, setShowBulk] = useState(false)

  const fetchUsers = useCallback(async () => {
    const res = await fetch('/api/users')
    if (res.status === 403) setForbidden(true)
    if (!res.ok) return
    const data = await res.json()
    setList(Array.isArray(data) ? data : [])
  }, [])

  useEffect(() => {
    let cancelled = false
    fetchUsers().then(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [fetchUsers])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[200px]">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="p-8 max-w-xl mx-auto">
        <div className="flex items-center gap-3 rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
          <div>
            <p className="font-medium text-white">Access restricted</p>
            <p className="text-sm text-slate-400 mt-0.5">
              You need an Admin or Manager role in this organization to manage users.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Users</h1>
            <p className="text-slate-400 text-sm">
              Manage organization members, roles, and access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add user
          </button>
          <button
            type="button"
            onClick={() => setShowInvite(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm font-medium transition-colors"
          >
            <Mail className="w-4 h-4" />
            Invite
          </button>
          <button
            type="button"
            onClick={() => setShowBulk(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
          >
            <Upload className="w-4 h-4" />
            Bulk import
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        {list.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No users in this organization yet</p>
            <p className="text-sm mt-1">Add or invite users to get started.</p>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 w-10" />
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr
                  key={u.id}
                  className="border-b border-slate-800/80 hover:bg-slate-800/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium text-white">
                      {u.full_name || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{u.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-300">
                      {u.org_role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.status === 'active'
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {u.status === 'active' ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/users/${u.id}`}
                      className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                    >
                      View
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd && (
        <AddUserModal
          onClose={() => setShowAdd(false)}
          onSuccess={() => { setShowAdd(false); fetchUsers(); }}
        />
      )}
      {showInvite && (
        <InviteUserModal
          onClose={() => setShowInvite(false)}
          onSuccess={() => { setShowInvite(false); fetchUsers(); }}
        />
      )}
      {showBulk && (
        <BulkImportModal
          onClose={() => setShowBulk(false)}
          onSuccess={() => { setShowBulk(false); fetchUsers(); }}
        />
      )}
    </div>
  )
}

function AddUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('LEARNER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tempPassword, setTempPassword] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), full_name: fullName.trim() || undefined, password: password || undefined, org_role: role }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    if (data.temp_password) setTempPassword(data.temp_password)
    else onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Add user</h2>
        {tempPassword ? (
          <div className="space-y-3">
            <p className="text-slate-300 text-sm">User created. Share this one-time password securely:</p>
            <p className="font-mono text-white bg-slate-800 px-3 py-2 rounded-lg break-all">{tempPassword}</p>
            <p className="text-slate-500 text-xs">They must change it on first login.</p>
            <button type="button" onClick={onSuccess} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="user@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Full name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="Optional" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Password (optional, min 8 chars)</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="Leave empty for random OTP" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
                <option value="LEARNER">Learner</option>
                <option value="CREATOR">Creator</option>
                <option value="MANAGER">Manager</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Creating…' : 'Create'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function InviteUserModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('LEARNER')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const res = await fetch('/api/users/invite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), full_name: fullName.trim() || undefined, org_role: role }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-4">Invite by email</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" placeholder="user@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Full name (optional)</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm">
              <option value="LEARNER">Learner</option>
              <option value="CREATOR">Creator</option>
              <option value="MANAGER">Manager</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Sending…' : 'Send invite'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [csv, setCsv] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<{ email: string; ok: boolean; error?: string; temp_password?: string }[] | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const lines = csv.trim().split(/\r?\n/).filter(Boolean)
    const header = lines[0]?.toLowerCase() ?? ''
    const emailIdx = header.includes('email') ? header.split(',').map((h) => h.trim()).indexOf('email') : 0
    const nameIdx = header.includes('name') || header.includes('full_name') ? header.split(',').map((h) => h.trim()).indexOf(header.includes('full_name') ? 'full_name' : 'name') : -1
    const roleIdx = header.includes('role') ? header.split(',').map((h) => h.trim()).indexOf('role') : -1
    const users = lines.slice(1).map((line) => {
      const parts = line.split(',').map((p) => p.trim())
      return {
        email: parts[emailIdx] ?? '',
        full_name: nameIdx >= 0 ? parts[nameIdx] : undefined,
        org_role: roleIdx >= 0 ? parts[roleIdx] : undefined,
      }
    }).filter((u) => u.email)
    if (users.length === 0) {
      setError('No valid rows. CSV should have header: email, name (or full_name), role (optional).')
      return
    }
    setLoading(true)
    const res = await fetch('/api/users/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users }),
    })
    const data = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) {
      setError(data.error || res.statusText)
      return
    }
    setResults(data.results ?? [])
  }

  if (results?.length) {
    const ok = results.filter((r) => r.ok).length
    const failed = results.filter((r) => !r.ok)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
        <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-lg font-semibold text-white">Bulk import result</h2>
            <p className="text-slate-400 text-sm mt-1">{ok} created, {failed.length} failed</p>
          </div>
          <div className="p-4 overflow-y-auto flex-1 text-sm">
            {results.map((r, i) => (
              <div key={i} className={r.ok ? 'text-slate-300' : 'text-red-400'}>
                {r.email}: {r.ok ? 'OK' + (r.temp_password ? ` (password: ${r.temp_password})` : '') : r.error}
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-slate-800">
            <button type="button" onClick={onSuccess} className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium">Done</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-white mb-2">Bulk import</h2>
        <p className="text-slate-500 text-sm mb-4">CSV with header: email, name (or full_name), role (optional). Max 100 rows.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} placeholder="email, name, role&#10;user1@example.com, John, LEARNER&#10;user2@example.com, Jane, CREATOR" className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm font-mono placeholder-slate-500 resize-y" />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-600 text-slate-300 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={loading} className="flex-1 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">{loading ? 'Importing…' : 'Import'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
