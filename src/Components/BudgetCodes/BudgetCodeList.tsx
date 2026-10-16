import { useState } from 'react'
import { Plus, MagnifyingGlass, Tag } from '@phosphor-icons/react'
import { useBudgetCodes, useBudgetReference, useSeedBudgetCodes, useUpdateFiscalYearStatus } from '../../hooks/useBudgetCodes'
import { PageHeader } from '../Common/PageHeader'
import { StatusBadge } from '../Common/StatusBadge'
import { EmptyState } from '../Common/EmptyState'
import { PageLoader } from '../Common/LoadingSpinner'
import type { BudgetCategory } from '../../types'

const BudgetCodeList = () => {
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<'codes' | 'fiscal'>('codes')

  const { data: codesData, isLoading } = useBudgetCodes(search || undefined)
  const { data: refData } = useBudgetReference()
  const { mutate: seedAll, isPending: seeding } = useSeedBudgetCodes()
  const { mutate: updateYear } = useUpdateFiscalYearStatus()

  const categories: BudgetCategory[] = Array.isArray(codesData) ? codesData : (codesData?.categories ?? [])
  const fiscalYears = refData?.fiscalYears ?? []

  return (
    <div>
      <PageHeader
        title="Budget Codes"
        subtitle="Manage budget categories, sub-items, and fiscal years"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => seedAll()}
              disabled={seeding}
              className="px-4 py-2 text-sm font-semibold text-slate-700 border border-slate-200 bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              {seeding ? 'Seeding…' : 'Seed All'}
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 transition-colors">
              <Plus size={16} weight="bold" /> Add Code
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-slate-100 rounded-xl p-1 w-fit shadow-sm">
        {(['codes', 'fiscal'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {t === 'codes' ? 'Budget Codes' : 'Fiscal Years'}
          </button>
        ))}
      </div>

      {tab === 'codes' && (
        <>
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
              description='Click "Seed All" to load predefined NPF budget codes.'
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
        </>
      )}

      {tab === 'fiscal' && (
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          {fiscalYears.length === 0 ? (
            <EmptyState title="No fiscal years found" description="Fiscal years are loaded with budget codes." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Year', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {fiscalYears.map((fy) => (
                  <tr key={fy.year} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800">{fy.year}</td>
                    <td className="px-4 py-3"><StatusBadge status={fy.status} /></td>
                    <td className="px-4 py-3">
                      {(() => {
                        const isOpen = (fy.status ?? '').toLowerCase() === 'open'
                        return (
                          <button
                            onClick={() => updateYear({ year: fy.year, status: isOpen ? 'closed' : 'open' })}
                            className={`text-xs font-medium hover:underline ${isOpen ? 'text-red-500' : 'text-green-700'}`}
                          >
                            {isOpen ? 'Close Year' : 'Open Year'}
                          </button>
                        )
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default BudgetCodeList
