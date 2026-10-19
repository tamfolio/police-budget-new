import { useState } from 'react'
import { Plus, MagnifyingGlass, Tag } from '@phosphor-icons/react'
import { useBudgetCodes } from '../../hooks/useBudgetCodes'
import { PageHeader } from '../Common/PageHeader'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import AddBudgetCodeModal from './AddBudgetCodeModal'
import type { BudgetCategory } from '../../types'

const BudgetCodeList = () => {
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const { data: codesData, isLoading } = useBudgetCodes(search || undefined)

  const categories: BudgetCategory[] = Array.isArray(codesData)
    ? (codesData as BudgetCategory[])
    : (((codesData as Record<string, unknown>)?.categories as BudgetCategory[]) ?? [])

  return (
    <div>
      <PageHeader
        title="Budget Codes"
        subtitle="Manage budget categories and sub-items"
        actions={
          <button
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={16} weight="bold" /> Add Code
          </button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 mb-5">
        <div className="relative">
          <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by code or name…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {isLoading ? (
        <PageLoader />
      ) : categories.length === 0 ? (
        <EmptyState
          title="No budget codes found"
          description='Click "Add Code" to create your first budget code.'
          icon={<Tag size={28} className="text-slate-300" />}
        />
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-mono font-semibold">
                    {cat.code}
                  </span>
                  <span className="font-semibold text-slate-800 text-sm">{cat.name}</span>
                </div>
                <span className="text-xs text-slate-400">{cat.subItems?.length ?? 0} sub-items</span>
              </div>
              {cat.subItems?.length > 0 && (
                <div className="divide-y divide-slate-50">
                  {cat.subItems.map((sub) => (
                    <div key={sub.id} className="flex items-center gap-3 px-5 py-2.5 hover:bg-slate-50 transition-colors">
                      <span className="text-xs font-mono text-slate-400 w-24">{sub.code}</span>
                      <span className="text-sm text-slate-600">{sub.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <AddBudgetCodeModal open={addOpen} onClose={() => setAddOpen(false)} categories={categories} />
    </div>
  )
}

export default BudgetCodeList
