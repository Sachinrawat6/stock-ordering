import { useMemo } from 'react'
import DataTable from './DataTable'
import { CHANNELS } from '../config'

function flattenStyleUsage(styleUsage) {
  const rows = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      rows.push({
        styleNumber: Number(styleStr),
        size,
        avgField: d.avgField,
        ...Object.fromEntries(CHANNELS.map(ch => [ch, d.channels[ch] ?? 0])),
        total: d.totalCount,
      })
    }
  }
  return rows
}

const CHANNEL_COLORS = {
  Myntra:   'bg-pink-50  text-pink-700',
  Ajio:     'bg-orange-50 text-orange-700',
  Nykaa:    'bg-rose-50  text-rose-700',
  Tatacliq: 'bg-blue-50  text-blue-700',
  Shopify:  'bg-green-50 text-green-700',
}

export default function OrdersTable({ data }) {
  const rows = useMemo(() => flattenStyleUsage(data), [data])

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
      key: 'avgField', label: 'Avg Field',
      render: v => (
        <span className="font-mono text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md">
          {v}
        </span>
      ),
    },
    ...CHANNELS.map(ch => ({
      key: ch, label: ch, width: '90px',
      render: v => v > 0 ? (
        <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${CHANNEL_COLORS[ch]}`}>
          {v}
        </span>
      ) : (
        <span className="text-slate-300 text-sm">–</span>
      ),
    })),
    {
      key: 'total', label: 'Total', width: '70px',
      render: v => <span className="font-bold text-slate-900 tabular-nums">{v}</span>,
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={rows}
      searchKeys={['styleNumber', 'size']}
      emptyMessage="No orders found for the selected date range"
    />
  )
}
