import { useState } from 'react'
import { Plus, MagnifyingGlass } from '@phosphor-icons/react'
import { useDepartments, useCreateDepartment, useUpdateDepartment, useDeactivateDepartment } from '../../hooks/useDepartments'
import { PageHeader } from '../Common/PageHeader'
import { StatusBadge } from '../Common/StatusBadge'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import { Modal } from '../Common/Modal'
import { ConfirmDialog } from '../Common/ConfirmDialog'
import type { Department } from '../../types'

const DepartmentList = () => {
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<Department | null>(null)
  const [deactivateId, setDeactivateId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', code: '', description: '' })

  const { data, isLoading } = useDepartments()
  const { mutate: create, isPending: creating } = useCreateDepartment()
  const { mutate: update, isPending: updating } = useUpdateDepartment()
  const { mutate: deactivate, isPending: deactivating } = useDeactivateDepartment()

  const departments: Department[] = Array.isArray(data) ? data : (data?.items ?? [])
  const filtered = departments.filter((d) =>
    !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.code?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreate = () => { setEditItem(null); setForm({ name: '', code: '', description: '' }); setFormOpen(true) }
  const openEdit = (d: Department) => { setEditItem(d); setForm({ name: d.name, code: d.code ?? '', description: d.description ?? '' }); setFormOpen(true) }

  const handleSubmit = () => {
    if (editItem) {
      update({ id: editItem.id, payload: form }, { onSuccess: () => setFormOpen(false) })
    } else {
      create(form, { onSuccess: () => { setFormOpen(false); setForm({ name: '', code: '', description: '' }) } })
    }
  }

  const inputCls = 'w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-600'

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="Manage NPF departments and units"
        actions={
          <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
            <Plus size={16} weight="bold" /> Add Department
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search departments…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600" />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <PageLoader />
        ) : filtered.length === 0 ? (
          <EmptyState title="No departments found" description="Create departments to organise your budget structure." action={<button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800"><Plus size={15} /> Add</button>} />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Name', 'Code', 'Description', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-800">{d.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{d.code ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-500 max-w-xs truncate">{d.description ?? '—'}</td>
                  <td className="px-4 py-3"><StatusBadge status={d.isActive ? 'active' : 'inactive'} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(d)} className="text-xs text-blue-700 hover:underline font-medium">Edit</button>
                      {d.isActive && (
                        <button onClick={() => setDeactivateId(d.id)} className="text-xs text-red-500 hover:underline font-medium">Deactivate</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editItem ? 'Edit Department' : 'New Department'} size="sm"
        footer={
          <>
            <button onClick={() => setFormOpen(false)} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
            <button onClick={handleSubmit} disabled={creating || updating}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 rounded-lg hover:bg-blue-800 disabled:opacity-50">
              {creating || updating ? 'Saving…' : editItem ? 'Update' : 'Create'}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Name *</label>
            <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Department name" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Code</label>
            <input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. CID" className={inputCls} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Description</label>
            <textarea rows={2} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Optional description" className={`${inputCls} resize-none`} />
          </div>
        </div>
      </Modal>

      <ConfirmDialog open={Boolean(deactivateId)} onClose={() => setDeactivateId(null)}
        onConfirm={() => { deactivate(deactivateId!); setDeactivateId(null) }}
        title="Deactivate Department" message="This department will be deactivated and hidden from active lists." confirmLabel="Deactivate" loading={deactivating} />
    </div>
  )
}

export default DepartmentList
