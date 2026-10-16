import { useState } from 'react'
import { Plus, MagnifyingGlass, Envelope, Trash, PencilSimple } from '@phosphor-icons/react'
import { useAdminUsers, useUpdateUserRole, useDeactivateUser, useRoles } from '../../hooks/useAdmin'
import { PageHeader } from '../Common/PageHeader'
import { StatusBadge } from '../Common/StatusBadge'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import { useInviteUsers } from '../../hooks/useAuth'
import { getUserDisplayName, getUserRoleName, type User } from '../../types'

const UserList = () => {
  const [search, setSearch] = useState('')
  const [inviteOpen, setInviteOpen] = useState(false)
  const [editUser, setEditUser] = useState<User | null>(null)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [inviteLines, setInviteLines] = useState('')
  const [newRole, setNewRole] = useState('')

  const { data, isLoading } = useAdminUsers()
  const { data: rolesData } = useRoles()
  const { mutate: updateRole, isPending: updatingRole } = useUpdateUserRole()
  const { mutate: deactivate, isPending: deactivating } = useDeactivateUser()
  const { mutate: invite, isPending: inviting } = useInviteUsers()

  const availableRoles = rolesData?.roles ?? []

  const users: User[] = data?.users ?? []

  const filtered = users.filter((u) => {
    if (!search) return true
    const name = getUserDisplayName(u).toLowerCase()
    return name.includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  })

  // Each line: "Full Name <email>" or just "email"
  const handleInvite = () => {
    const users = inviteLines
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const match = line.match(/^(.+?)\s*<([^>]+)>$/)
        if (match) return { fullName: match[1].trim(), email: match[2].trim() }
        return { fullName: line.split('@')[0], email: line }
      })
    invite(users, { onSuccess: () => { setInviteOpen(false); setInviteLines('') } })
  }

  const handleRoleUpdate = () => {
    if (!editUser || !newRole) return
    updateRole({ userId: editUser.id, role: newRole }, { onSuccess: () => { setEditUser(null); setNewRole('') } })
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Manage system users and their access"
        actions={
          <button
            onClick={() => setInviteOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={16} weight="bold" /> Invite Users
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No users found"
            description="Invite team members to get started."
            icon={<Envelope size={28} className="text-slate-300" />}
            action={
              <button
                onClick={() => setInviteOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"
              >
                <Plus size={15} /> Invite
              </button>
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'Email', 'Role', 'Last Login', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {getUserDisplayName(u)[0]?.toUpperCase() ?? '?'}
                      </div>
                      <span className="font-medium text-slate-800">{getUserDisplayName(u)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 capitalize">
                      {getUserRoleName(u)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {(u.lastLogin ?? u.lastLoginAt)
                      ? new Date(u.lastLogin ?? u.lastLoginAt!).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => { setEditUser(u); setNewRole(getUserRoleName(u)) }}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Edit role"
                      >
                        <PencilSimple size={15} />
                      </button>
                      {u.isActive && (
                        <button
                          onClick={() => setDeactivateId(u.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Deactivate"
                        >
                          <Trash size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Invite Modal */}
      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite Users"
        size="sm"
        footer={
          <>
            <button onClick={() => setInviteOpen(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleInvite}
              disabled={inviting || !inviteLines.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {inviting ? 'Sending…' : 'Send Invites'}
            </button>
          </>
        }
      >
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Email Addresses
          </label>
          <textarea
            rows={4}
            value={inviteLines}
            onChange={(e) => setInviteLines(e.target.value)}
            placeholder={"John Doe <john@npf.gov.ng>\njane@npf.gov.ng"}
            className={`${inputCls} resize-none font-mono text-xs`}
          />
          <p className="text-xs text-slate-400 mt-1.5">One per line. Format: <code>Full Name &lt;email&gt;</code> or just email address.</p>
        </div>
      </Modal>

      {/* Edit Role Modal */}
      <Modal
        open={Boolean(editUser)}
        onClose={() => setEditUser(null)}
        title="Change User Role"
        size="sm"
        footer={
          <>
            <button onClick={() => setEditUser(null)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
              Cancel
            </button>
            <button
              onClick={handleRoleUpdate}
              disabled={updatingRole || !newRole}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50"
            >
              {updatingRole ? 'Saving…' : 'Update Role'}
            </button>
          </>
        }
      >
        <div>
          <p className="text-sm text-slate-600 mb-3">
            Changing role for <span className="font-semibold text-slate-800">{editUser ? getUserDisplayName(editUser) : ''}</span>
          </p>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">New Role</label>
          <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className={inputCls}>
            <option value="">Select role…</option>
            {availableRoles.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deactivateId)}
        onClose={() => setDeactivateId(null)}
        onConfirm={() => { deactivate(deactivateId!); setDeactivateId(null) }}
        title="Deactivate User"
        message="This user will lose access to the system immediately."
        confirmLabel="Deactivate"
        loading={deactivating}
      />
    </div>
  )
}

export default UserList
