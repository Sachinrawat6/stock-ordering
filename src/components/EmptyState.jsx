import { BarChart3, ArrowRight } from 'lucide-react'

const STEPS = [
  {
    step: '01',
    title:  'Fetch Orders',
    desc:   'Pulls pending orders from NocoDB filtered by channel and date range',
    color:  'text-blue-600',
    bg:     'bg-blue-50',
  },
  {
    step: '02',
    title:  'Calculate Usage',
    desc:   'Maps each (style, size) to fabric averages and calculates total metres',
    color:  'text-indigo-600',
    bg:     'bg-indigo-50',
  },
  {
    step: '03',
    title:  'Check Stock',
    desc:   'Compares 7-day projected demand against current available stock',
    color:  'text-violet-600',
    bg:     'bg-violet-50',
  },
]

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center text-center py-16 gap-8">

      {/* Icon */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
        <BarChart3 className="w-14 h-14 text-blue-500" />
      </div>

      {/* Text */}
      <div className="max-w-md">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          Ready to Analyse
        </h2>
        <p className="text-slate-400 mt-2.5 leading-relaxed">
          Select a date range above and click{' '}
          <span className="font-semibold text-blue-600">Run Analysis</span> to fetch
          live orders, calculate fabric demand, and flag low-stock fabrics.
        </p>
      </div>

      {/* Steps */}
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-2xl">
        {STEPS.map((s, i) => (
          <div key={s.step} className="flex items-center gap-3 flex-1 w-full sm:w-auto">
            <div className={`bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex-1 text-left hover:shadow-md transition-shadow`}>
              <div className={`text-xs font-black ${s.color} ${s.bg} inline-block px-2 py-0.5 rounded-md mb-3`}>
                STEP {s.step}
              </div>
              <h3 className="font-bold text-slate-700 text-sm">{s.title}</h3>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{s.desc}</p>
            </div>
            {i < STEPS.length - 1 && (
              <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 hidden sm:block" />
            )}
          </div>
        ))}
      </div>

      {/* Channels pill row */}
      <div className="flex flex-wrap gap-2 justify-center">
        {['Myntra', 'Ajio', 'Nykaa', 'Tatacliq', 'Shopify'].map(ch => (
          <span
            key={ch}
            className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full"
          >
            {ch}
          </span>
        ))}
        <span className="text-xs text-slate-400 self-center ml-1">channels monitored</span>
      </div>
    </div>
  )
}
