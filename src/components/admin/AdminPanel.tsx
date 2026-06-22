import { useState } from 'react'
import { useAdmin } from '../../hooks/useAdmin'
import type { Profile } from '../../types'

interface Props {
  onClose: () => void
  currentUserId: string
}

const ROLE_LABELS = { admin: 'Admin', member: 'Member', viewer: 'Viewer' }
const ROLE_COLORS = {
  admin: 'bg-red-100 text-red-700',
  member: 'bg-blue-100 text-blue-700',
  viewer: 'bg-slate-100 text-slate-600',
}

function UserRow({
  user,
  groups,
  isSelf,
  onGroupChange,
  onRoleChange,
}: {
  user: Profile
  groups: { id: string; name: string; color: string }[]
  isSelf: boolean
  onGroupChange: (userId: string, groupId: string | null) => Promise<void>
  onRoleChange: (userId: string, role: 'admin' | 'member' | 'viewer') => Promise<void>
}) {
  const [saving, setSaving] = useState(false)

  async function handleGroupChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true)
    try {
      await onGroupChange(user.id, e.target.value || null)
    } finally {
      setSaving(false)
    }
  }

  async function handleRoleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true)
    try {
      await onRoleChange(user.id, e.target.value as 'admin' | 'member' | 'viewer')
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className={`border-t border-slate-100 ${saving ? 'opacity-50' : ''}`}>
      <td className="py-3 pr-4">
        <div className="text-sm font-medium text-slate-800">{user.full_name ?? '—'}</div>
        <div className="text-xs text-slate-400">{user.id.slice(0, 8)}…</div>
      </td>
      <td className="py-3 pr-4">
        <select
          value={user.group_id ?? ''}
          onChange={handleGroupChange}
          disabled={saving}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="">No group</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </td>
      <td className="py-3">
        <select
          value={user.role}
          onChange={handleRoleChange}
          disabled={saving || isSelf}
          className="text-sm border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
        >
          {Object.entries(ROLE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isSelf && <span className="ml-2 text-xs text-slate-400">you</span>}
      </td>
      <td className="py-3 pl-4">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[user.role]}`}>
          {ROLE_LABELS[user.role]}
        </span>
      </td>
    </tr>
  )
}

export function AdminPanel({ onClose, currentUserId }: Props) {
  const { users, groups, loading, updateUserGroup, updateUserRole } = useAdmin()

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-800">Admin panel</h2>
            <p className="text-xs text-slate-500 mt-0.5">Manage user groups and roles</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <p className="text-sm text-slate-400 text-center py-8">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No users found.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs font-medium text-slate-500 uppercase tracking-wide">
                  <th className="pb-2 pr-4">User</th>
                  <th className="pb-2 pr-4">Group</th>
                  <th className="pb-2">Role</th>
                  <th className="pb-2 pl-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    groups={groups}
                    isSelf={user.id === currentUserId}
                    onGroupChange={updateUserGroup}
                    onRoleChange={updateUserRole}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
          Changes save automatically. You cannot change your own role.
        </div>
      </div>
    </div>
  )
}
