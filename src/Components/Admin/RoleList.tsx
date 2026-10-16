import { useState } from 'react'
import { Plus, ShieldCheck, Trash, PencilSimple, Check } from '@phosphor-icons/react'
import { useRoles, useCreateRole, useUpdateRole, useDeleteRole } from '../../hooks/useAdmin'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import type { Role } from '../../types'

const PERMISSION_GROUPS = [
  { group: 'Fund Inflows', permissions: ['fund_inflows.view', 'fund_inflows.create', 'fund_inflows.edit', 'fund_inflows.approve', 'fund_inflows.delete'] },
  { group: 'AIE', permissions: ['aie.view', 'aie.create', 'aie.edit', 'aie.approve', 'aie.delete'] },
  { group: 'Distributions', permissions: ['distributions.view', 'distributions.create', 'distributions.edit', 'distributions.approve'] },
  { group: 'Budget Proposals', permissions: ['proposals.view', 'proposals.create', 'proposals.edit', 'proposals.approve'] },
  { group: 'Reports', permissions: ['reports.view', 'reports.export'] },
  { group: 'Administration', permissions: ['admin.users', 'admin.roles', 'admin.departments', 'audit.view'] },
]

const RoleList = () => {
  const [formOpen, setFormOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', description: '', permissions: [] as string[] })

  const { data, isLoading } = useRoles()
  const { mutate: create, isPending: creating } = useCreateRole()
  const { mutate: update, isPending: updating } = useUpdateRole()
  const { mutate: remove, isPending: deleting } = useDeleteRole()

  const roles: Role[] = data?.roles ?? []

  const openCreate = () => {
    setEditRole(null)
    setForm({ name: '', description: '', permissions: [] })
    setFormOpen(true)
  }

  const openEdit = (r: Role) => {
    setEditRole(r)
    setForm({ name: r.name, description: r.description ?? '', permissions: r.permissions ?? [] })
    setFormOpen(true)
  }

  const togglePermission = (p: string) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p],
    }))

  const handleSubmit = () => {
    if (editRole) {
      update({ id: editRole.id, payload: form }, { onSuccess: () => setFormOpen(false) })
    } else {
      create(form, { onSuccess: () => { setFormOpen(false); setForm({ name: '', description: '', permissions: [] }) } })
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'

  return (
    <div>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Define roles and control access permissions"
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
            <Plus size={16} weight="bold" /> Add Role
          </button>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : roles.length === 0 ? (
        <EmptyState
          title="No roles defined"
          description="Create roles to control what users can access."
          icon={<ShieldCheck size={28} className="text-slate-300" />}
          action={<button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"><Plus size={15} /> Add Role</button>}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <div key={role.id} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShieldCheck size={18} className="text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 capitalize">{role.name}</p>
                    <p className="text-xs text-slate-400">{(role.permissions ?? []).length} permissions</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => openEdit(role)} className="text-slate-400 hover:text-blue-600 transition-colors"><PencilSimple size={15} /></button>
                  <button onClick={() => setDeleteId(role.id)} className="text-slate-400 hover:text-red-500 transition-colors"><Trash size={15} /></button>
                </div>
              </div>
              {role.description && <p className="text-xs text-slate-500 mb-3">{role.description}</p>}
              {(role.permissions ?? []).length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(role.permissions ?? []).slice(0, 5).map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600 font-mono">{p}</span>
                  ))}
                  {(role.permissions ?? []).length > 5 && (
                    <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-400">+{(role.permissions ?? []).length - 5} more</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editRole ? 'Edit Role' : 'New Role'} size="lg"
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmit} disabled={creating || updating || !form.name}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50">
              {creating || updating ? 'Saving…' : editRole ? 'Update Role' : 'Create Role'}
            </button>
          </>
        }>
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Name *</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Budget Analyst" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="What this role can do" className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">Permissions</label>
            <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
              {PERMISSION_GROUPS.map((g) => (
                <div key={g.group}>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{g.group}</p>
                  <div className="flex flex-wrap gap-2">
                    {g.permissions.map((p) => {
                      const active = form.permissions.includes(p)
                      return (
                        <button key={p} type="button" onClick={() => togglePermission(p)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${active ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                          {active && <Check size={11} weight="bold" />}
                          {p.split('.')[1]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deleteId)} onClose={() => setDeleteId(null)}
        onConfirm={() => { remove(deleteId!); setDeleteId(null) }}
        title="Delete Role" message="This role will be permanently deleted. Users assigned this role may lose access."
        confirmLabel="Delete" loading={deleting} />
    </div>
  )
}

export default RoleList
