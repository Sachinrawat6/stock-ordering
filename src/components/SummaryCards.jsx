import { Package, Layers, Ruler, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { computeSummary } from '../utils/transform'

function StatCard({ icon: Icon, label, value, sub, accent, bg }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">
            {label}
          </p>
          <p className={`text-3xl font-bold mt-1.5 ${accent} leading-none`}>
            {value}
          </p>
          {sub && (
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{sub}</p>
          )}
        </div>
        <div className={`p-3 rounded-xl ${bg} shrink-0`}>
          <Icon className={`w-5 h-5 ${accent}`} />
        </div>
      </div>
    </div>
  )
}

export default function SummaryCards({ data }) {
  const { orders, styleUsage, stockAnalysis } = data
  const { totalStyles, stylesWithAvg, totalMetres, alertCount } = computeSummary(
    styleUsage, stockAnalysis,
  )

  const metresDisplay =
    totalMetres >= 1000
      ? `${(totalMetres / 1000).toFixed(2)}k m`
      : `${totalMetres.toFixed(1)} m`

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        icon={Package}
        label="Total Pending Orders"
        value={orders.length.toLocaleString()}
        sub={`Across ${[...new Set(orders.map(o => o.channel))].length} channel(s)`}
        accent="text-blue-600"
        bg="bg-blue-50"
      />
      <StatCard
        icon={Layers}
        label="Unique Styles"
        value={totalStyles.toLocaleString()}
        sub={`${stylesWithAvg} have fabric averages`}
        accent="text-indigo-600"
        bg="bg-indigo-50"
      />
      <StatCard
        icon={Ruler}
        label="Total Fabric Demand"
        value={metresDisplay}
        sub={`${totalMetres.toFixed(2)} metres overall`}
        accent="text-violet-600"
        bg="bg-violet-50"
      />
      <StatCard
        icon={alertCount > 0 ? AlertTriangle : CheckCircle2}
        label="Stock Alerts"
        value={alertCount}
        sub={
          alertCount > 0
            ? `${alertCount} fabric(s) below 7-day supply`
            : 'All stocks sufficient'
        }
        accent={alertCount > 0 ? 'text-red-600' : 'text-emerald-600'}
        bg={alertCount > 0 ? 'bg-red-50' : 'bg-emerald-50'}
      />
    </div>
  )
}
