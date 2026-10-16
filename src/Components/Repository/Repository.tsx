import { useState } from 'react'
import { Database, DownloadSimple, ArrowsClockwise, Table, HardDrive } from '@phosphor-icons/react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { repositoryService } from '../../api/services/repositoryService'
import { PageHeader } from '../Common/PageHeader'
import { PageLoader } from '../Common/LoadingSpinner'
import toast from 'react-hot-toast'

const Repository = () => {
  const [exporting, setExporting] = useState<string | null>(null)

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['repository', 'stats'],
    queryFn: () => repositoryService.getStats(),
    select: (r) => r.data.data,
  })

  const { data: tables, isLoading: tablesLoading } = useQuery({
    queryKey: ['repository', 'tables'],
    queryFn: () => repositoryService.getTables(),
    // API returns { data: [{ table: string, rows: number }] }
    select: (r) => r.data?.data as { table: string; rows: number }[] | undefined,
  })

  const { mutate: backup, isPending: backingUp } = useMutation({
    mutationFn: () => repositoryService.backup(),
    onSuccess: () => toast.success('Backup initiated successfully'),
    onError: () => toast.error('Backup failed'),
  })

  const { mutate: sync, isPending: syncing } = useMutation({
    mutationFn: () => repositoryService.sync(),
    onSuccess: () => toast.success('Sync completed'),
    onError: () => toast.error('Sync failed'),
  })

  const handleExport = async (table: string) => {
    setExporting(table)
    try {
      const res = await repositoryService.exportTable(table)
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}-export.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success(`${table} exported`)
    } catch {
      toast.error('Export failed')
    } finally {
      setExporting(null)
    }
  }

  const isLoading = statsLoading || tablesLoading
  const tableList: { table: string; rows: number }[] = Array.isArray(tables) ? tables : []

  const totalRows = tableList.reduce((acc, t) => acc + (t.rows ?? 0), 0)

  const statCards = [
    { label: 'Total Records', value: (stats?.totalRecords ?? totalRows).toLocaleString(), icon: Database, color: 'text-blue-600 bg-blue-50' },
    { label: 'Database Size', value: stats?.databaseSize ?? '—', icon: HardDrive, color: 'text-purple-600 bg-purple-50' },
    { label: 'Total Tables', value: String(stats?.totalTables ?? tableList.length), icon: Table, color: 'text-green-600 bg-green-50' },
    { label: 'Last Backup', value: stats?.lastBackup ? new Date(stats.lastBackup).toLocaleDateString() : 'Never', icon: ArrowsClockwise, color: 'text-amber-600 bg-amber-50' },
  ]

  return (
    <div>
      <PageHeader
        title="Repository"
        subtitle="Database tables, exports, and system data management"
        actions={
          <div className="flex gap-2">
            <button onClick={() => sync()} disabled={syncing}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
              <ArrowsClockwise size={15} className={syncing ? 'animate-spin' : ''} />
              {syncing ? 'Syncing…' : 'Sync'}
            </button>
            <button onClick={() => backup()} disabled={backingUp}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-semibold rounded-lg hover:bg-blue-800 disabled:opacity-50 transition-colors">
              <HardDrive size={15} />
              {backingUp ? 'Creating Backup…' : 'Create Backup'}
            </button>
          </div>
        }
      />

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
                  <card.icon size={20} />
                </div>
                <p className="text-2xl font-bold text-slate-800">{card.value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">Database Tables</p>
                <p className="text-xs text-slate-400 mt-0.5">{tableList.length} tables · {totalRows.toLocaleString()} total rows</p>
              </div>
            </div>
            {tableList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">No tables found.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Table Name</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rows</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Export</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {tableList.map((t) => (
                    <tr key={t.table} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <Table size={14} className="text-slate-400 flex-shrink-0" />
                          <span className="font-mono text-sm text-slate-700">{t.table}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right font-mono text-sm text-slate-500 tabular-nums">
                        {t.rows.toLocaleString()}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => handleExport(t.table)}
                          disabled={exporting === t.table}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 transition-colors"
                        >
                          <DownloadSimple size={13} />
                          {exporting === t.table ? 'Exporting…' : 'Export CSV'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default Repository
