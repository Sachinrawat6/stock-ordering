import { useMemo } from 'react'
import { CheckCircle2 } from 'lucide-react'
import DataTable from './DataTable'

export default function StockAlertsTable({ data }) {
  const alerts = useMemo(() =>
    data
      .filter(s => s.isAlert)
      .map(s => ({ ...s, shortfall: s.sevenDayReq - s.availableStock }))
      .sort((a, b) => b.shortfall - a.shortfall),
  [data])

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 flex flex-col items-center gap-4 text-center">
        <div className="bg-emerald-50 p-4 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-700">
            All Stocks Sufficient
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            No fabrics are below their 7-day projected demand.
          </p>
        </div>
      </div>
    )
  }

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
      render: v => <span className="text-slate-500 text-xs">{v || '–'}</span>,
    },
    {
      key: 'availableStock', label: 'Available (m)', width: '130px',
      className: 'text-right',
      render: v => (
        <span className="tabular-nums font-semibold text-slate-700">
          {v.toFixed(3)}
        </span>
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
        <span className="tabular-nums font-semibold text-amber-600">{v.toFixed(3)}</span>
      ),
    },
    {
      key: 'shortfall', label: 'Shortfall (m)', width: '130px',
      className: 'text-right',
      render: v => (
        <span className="tabular-nums font-bold text-red-600">{v.toFixed(3)}</span>
      ),
    },
  ]

  return (
    <div>
      <div className="mb-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
          {alerts.length} alert{alerts.length > 1 ? 's' : ''}
        </span>
        <p className="text-red-700 text-sm">
          These fabrics have <strong>less than 7 days</strong> of stock at the current usage rate. Sorted by worst shortfall first.
        </p>
      </div>
      <DataTable
        columns={columns}
        data={alerts}
        searchKeys={['fabricNumber', 'fabricName', 'location']}
        emptyMessage="No stock alerts"
      />
    </div>
  )
}
