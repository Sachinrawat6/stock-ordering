import { useMemo, useState } from 'react'
import { TrendingUp, Layers, Ruler } from 'lucide-react'
import { CHANNELS } from '../config'

// ── Aggregate styleUsage → one row per style ──────────────────
function aggregateByStyle(styleUsage) {
  const map = {}

  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    const styleNum = Number(styleStr)
    let totalOrders  = 0
    let totalMetres  = 0
    const channelTotals = Object.fromEntries(CHANNELS.map((c) => [c, 0]))
    const sizeBreakdown = {}

    for (const [size, d] of Object.entries(sizes)) {
      totalOrders += d.totalCount
      totalMetres += d.totalMetres

      // Channel breakdown
      for (const [ch, cnt] of Object.entries(d.channels)) {
        if (channelTotals[ch] !== undefined) channelTotals[ch] += cnt
      }

      // Size breakdown
      sizeBreakdown[size] = (sizeBreakdown[size] ?? 0) + d.totalCount
    }

    // Top size for this style
    const topSize = Object.entries(sizeBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '–'

    // Top channel for this style
    const topChannel = Object.entries(channelTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '–'

    map[styleNum] = {
      styleNumber: styleNum,
      totalOrders,
      totalMetres,
      topSize,
      topChannel,
      channelTotals,
    }
  }

  return Object.values(map)
}

// ── Channel colour pills ──────────────────────────────────────
const CH_STYLE = {
  Myntra:   'bg-pink-100   text-pink-700',
  Ajio:     'bg-orange-100 text-orange-700',
  Nykaa:    'bg-rose-100   text-rose-700',
  Tatacliq: 'bg-blue-100   text-blue-700',
  Shopify:  'bg-green-100  text-green-700',
}

// ── Rank badge colour ─────────────────────────────────────────
function rankBg(rank) {
  if (rank === 1) return 'bg-yellow-400 text-yellow-900'
  if (rank === 2) return 'bg-slate-300  text-slate-700'
  if (rank === 3) return 'bg-amber-600  text-white'
  return 'bg-slate-100 text-slate-500'
}

export default function Top50Table({ data, periodDays = 1 }) {
  const [sortBy, setSortBy] = useState('orders') // 'orders' | 'metres'

  const rows = useMemo(() => {
    const all = aggregateByStyle(data).map((r) => ({
      ...r,
      next7Days: (r.totalMetres / Math.max(periodDays, 1)) * 7,
    }))
    return all
      .sort((a, b) =>
        sortBy === 'orders'
          ? b.totalOrders - a.totalOrders
          : b.totalMetres - a.totalMetres,
      )
      .slice(0, 50)
  }, [data, sortBy, periodDays])

  const maxOrders = rows[0]?.totalOrders ?? 1
  const maxMetres = rows[0]?.totalMetres ?? 1

  return (
    <div className="space-y-4">

      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="bg-amber-50 p-2 rounded-xl">
            <TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 text-base leading-tight">Top 50 Styles</h2>
            <p className="text-slate-400 text-xs">Sabse jada use hone wale styles is period mein</p>
          </div>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
          <button
            onClick={() => setSortBy('orders')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            By Orders
          </button>
          <button
            onClick={() => setSortBy('metres')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              sortBy === 'metres'
                ? 'bg-white text-violet-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            By Metres
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {[
                  { label: 'Rank',              w: '60px'  },
                  { label: 'Style #',           w: '90px'  },
                  { label: 'Total Orders',      w: '120px' },
                  { label: 'Period Fabric (m)', w: '150px' },
                  { label: 'Next 7-Day Need (m)', w: '155px' },
                  { label: 'Order Volume',      w: '180px' },
                  { label: 'Top Size',          w: '90px'  },
                  { label: 'Top Channel',       w: '120px' },
                  ...CHANNELS.map((c) => ({ label: c, w: '80px' })),
                ].map((col) => (
                  <th
                    key={col.label}
                    style={{ width: col.w, minWidth: col.w }}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map((row, i) => {
                const rank = i + 1
                // Progress bar width based on sort metric
                const barPct =
                  sortBy === 'orders'
                    ? (row.totalOrders / maxOrders) * 100
                    : (row.totalMetres / maxMetres) * 100

                return (
                  <tr
                    key={row.styleNumber}
                    className={`hover:bg-slate-50/80 transition-colors ${rank <= 3 ? 'bg-amber-50/30' : ''}`}
                  >
                    {/* Rank */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rankBg(rank)}`}>
                        {rank}
                      </span>
                    </td>

                    {/* Style # */}
                    <td className="px-4 py-3 font-bold text-slate-800 tabular-nums">
                      {row.styleNumber}
                    </td>

                    {/* Total Orders */}
                    <td className="px-4 py-3">
                      <span className={`font-bold tabular-nums text-base ${sortBy === 'orders' ? 'text-blue-600' : 'text-slate-700'}`}>
                        {row.totalOrders.toLocaleString()}
                      </span>
                    </td>

                    {/* Period Fabric */}
                    <td className="px-4 py-3">
                      <span className={`font-semibold tabular-nums ${sortBy === 'metres' ? 'text-violet-600' : 'text-slate-600'}`}>
                        {row.totalMetres > 0 ? row.totalMetres.toFixed(2) : '–'}
                      </span>
                    </td>

                    {/* Next 7-Day Need */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold tabular-nums text-amber-600">
                          {row.next7Days > 0 ? row.next7Days.toFixed(2) : '–'}
                        </span>
                        <span className="text-xs text-slate-400">m</span>
                      </div>
                    </td>

                    {/* Progress bar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 min-w-[80px]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              sortBy === 'orders' ? 'bg-blue-500' : 'bg-violet-500'
                            }`}
                            style={{ width: `${barPct.toFixed(1)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums w-8 text-right">
                          {barPct.toFixed(0)}%
                        </span>
                      </div>
                    </td>

                    {/* Top Size */}
                    <td className="px-4 py-3">
                      <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-md">
                        {row.topSize}
                      </span>
                    </td>

                    {/* Top Channel */}
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${CH_STYLE[row.topChannel] ?? 'bg-slate-100 text-slate-600'}`}>
                        {row.topChannel}
                      </span>
                    </td>

                    {/* Per-channel counts */}
                    {CHANNELS.map((ch) => (
                      <td key={ch} className="px-4 py-3 text-center tabular-nums">
                        {row.channelTotals[ch] > 0 ? (
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${CH_STYLE[ch]}`}>
                            {row.channelTotals[ch]}
                          </span>
                        ) : (
                          <span className="text-slate-200 text-sm">–</span>
                        )}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Footer summary */}
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 text-xs text-slate-500">
          <span>
            Total Orders (Top 50):{' '}
            <strong className="text-slate-700">
              {rows.reduce((s, r) => s + r.totalOrders, 0).toLocaleString()}
            </strong>
          </span>
          <span>
            Total Fabric Demand:{' '}
            <strong className="text-slate-700">
              {rows.reduce((s, r) => s + r.totalMetres, 0).toFixed(2)} m
            </strong>
          </span>
          <span>
            Styles shown: <strong className="text-slate-700">{rows.length}</strong>
          </span>
        </div>
      </div>
    </div>
  )
}
