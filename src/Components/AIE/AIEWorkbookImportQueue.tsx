import { Check, X } from '@phosphor-icons/react'
import { useAIEWorkbookImports, useApproveAIEImport, useRejectAIEImport } from '../../hooks/useAIE'

interface Props { enabled: boolean }

const AIEWorkbookImportQueue = ({ enabled }: Props) => {
  const { data: imports = [], isLoading } = useAIEWorkbookImports(enabled)
  const { mutate: approve, isPending: approving } = useApproveAIEImport()
  const { mutate: reject, isPending: rejecting } = useRejectAIEImport()

  if (!enabled || (!isLoading && imports.length === 0)) return null

  return (
    <section className="bg-white rounded-xl border border-amber-200 shadow-sm p-4 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">AIE workbook imports awaiting review</h2>
          <p className="text-xs text-slate-500 mt-1">Approve or reject pending imports. Approval applies the uploaded budget and actual details.</p>
        </div>
        {imports.length > 0 && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">{imports.length} pending</span>}
      </div>
      {isLoading ? <p className="text-sm text-slate-500">Loading pending imports…</p> : (
        <div className="divide-y divide-slate-100">
          {imports.map((item) => {
            const id = String(item.id ?? '')
            const reviewContext = item.reviewContext as { proposalActualOverlaps?: Array<Record<string, unknown>> } | null
            const overlaps = reviewContext?.proposalActualOverlaps ?? []
            return <article key={id} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{String(item.originalFileName ?? 'AIE upload')}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    FY {String(item.fiscalYear)} · {String(item.action ?? '').toLowerCase()} · {Number(item.budgetRowCount ?? 0)} budgets · {Number(item.actualDetailCount ?? 0)} actual detail rows
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={approving || rejecting} onClick={() => approve(id)} className="inline-flex items-center gap-1 rounded-lg bg-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-50">
                    <Check size={13} weight="bold" /> Approve
                  </button>
                  <button type="button" disabled={approving || rejecting} onClick={() => {
                    const reason = window.prompt('Reason for rejecting this AIE import:')?.trim()
                    if (reason) reject({ importId: id, reason })
                  }} className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">
                    <X size={13} weight="bold" /> Reject
                  </button>
                </div>
              </div>
              {overlaps.length > 0 && <div className="mt-3 rounded-lg bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-900 mb-2">Approved proposal actuals this import will replace</p>
                <div className="space-y-1">
                  {overlaps.map((overlap, index) => <p key={`${String(overlap.budgetCode)}-${String(overlap.month)}-${index}`} className="text-xs text-amber-900">
                    Code {String(overlap.budgetCode)} · month {String(overlap.month)} · proposal {Number(overlap.approvedProposalAmount ?? 0).toLocaleString('en-NG')} · workbook {Number(overlap.workbookActualAmount ?? 0).toLocaleString('en-NG')}
                  </p>)}
                </div>
              </div>}
            </article>
          })}
        </div>
      )}
    </section>
  )
}

export default AIEWorkbookImportQueue
