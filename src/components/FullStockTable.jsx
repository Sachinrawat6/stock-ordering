import { useMemo } from 'react'
import DataTable from './DataTable'

export default function FullStockTable({ data }) {
  const rows = useMemo(
    () => [...data].sort((a, b) => (a.fabricNumber ?? 0) - (b.fabricNumber ?? 0)),
    [data],
  )

  const columns = [
    {
      key: 'fabricNumber', label: 'Fabric #', width: '100px',
      render: v => <span className="font-semibold text-slate-800">{v}</span>,
    },
    {
      key: 'fabricName', label: 'Fabric Name',
      render: v => <span className="font-medium text-slate-700">{v}</span>,
    },
    {
      key: 'location', label: 'Location', width: '110px',
      render: v => <span className="text-xs text-slate-500">{v || '–'}</span>,
    },
    {
      key: 'fabricSource', label: 'Source', width: '100px',
      render: v => <span className="text-xs text-slate-500">{v || '–'}</span>,
    },
    {
      key: 'availableStock', label: 'Available (m)', width: '130px',
      className: 'text-right',
      render: v => (
        <span className="tabular-nums font-semibold text-slate-700">{v.toFixed(3)}</span>
      ),
    },
    {
      key: 'periodDemand', label: 'Period Demand (m)', width: '155px',
      className: 'text-right',
      render: v => <span className="tabular-nums text-slate-500">{v.toFixed(3)}</span>,
    },
    {
      key: 'dailyDemand', label: 'Daily (m)', width: '110px',
      className: 'text-right',
      render: v => <span className="tabular-nums text-slate-500">{v.toFixed(3)}</span>,
    },
    {
      key: 'sevenDayReq', label: '7-Day Req (m)', width: '130px',
      className: 'text-right',
      render: v => (
        <span className="tabular-nums font-semibold text-slate-600">{v.toFixed(3)}</span>
      ),
    },
    {
      key: 'isAlert', label: 'Status', width: '110px', sortable: false,
      render: v => v ? (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-red-100 text-red-700 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          LOW STOCK
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          OK
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchKeys={['fabricNumber', 'fabricName', 'location', 'fabricSource']}
      emptyMessage="No stock records found"
    />
  )
}
