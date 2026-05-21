import { useMemo } from 'react'
import DataTable from './DataTable'

function flattenFabricUsage(styleUsage) {
  const rows = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      rows.push({
        styleNumber:  Number(styleStr),
        size,
        totalCount:   d.totalCount,
        avgField:     d.avgField,
        fabCount:     d.perFabric.length,
        totalMetres:  d.totalMetres,
        hasAverage:   d.hasAverage,
      })
    }
  }
  return rows
}

export default function FabricUsageTable({ data }) {
  const rows = useMemo(() => flattenFabricUsage(data), [data])

  const columns = [
    {
      key: 'styleNumber', label: 'Style #', width: '90px',
      render: v => <span className="font-semibold text-slate-800">{v}</span>,
    },
    {
      key: 'size', label: 'Size', width: '70px',
      render: v => (
        <span className="inline-block bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
          {v}
        </span>
      ),
    },
    {
      key: 'totalCount', label: 'Orders', width: '80px',
      render: v => <span className="font-semibold tabular-nums">{v}</span>,
    },
    {
      key: 'avgField', label: 'Avg Field',
      render: v => (
        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
          {v}
        </span>
      ),
    },
    {
      key: 'fabCount', label: '# Fabrics', width: '90px',
      render: v => <span className="tabular-nums text-slate-500">{v}</span>,
    },
    {
      key: 'totalMetres', label: 'Total Metres', width: '130px',
      className: 'text-right',
      render: v => (
        <span className="font-semibold tabular-nums text-slate-800">
          {v.toFixed(3)}
        </span>
      ),
    },
    {
      key: 'hasAverage', label: 'Has Average?', width: '120px',
      render: v => v ? (
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          YES
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-semibold bg-red-50 text-red-600 px-2.5 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
          MISSING
        </span>
      ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchKeys={['styleNumber', 'size']}
      emptyMessage="No fabric usage data available"
    />
  )
}
