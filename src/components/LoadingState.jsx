const STEPS = [
  { label: 'Fetching orders from NocoDB', key: 'orders' },
  { label: 'Loading fabric averages',     key: 'averages' },
  { label: 'Loading fabric stocks',       key: 'stocks' },
  { label: 'Calculating usage',           key: 'calc' },
  { label: 'Analysing stock levels',      key: 'stock' },
]

function getActiveStep(progress) {
  if (!progress) return -1
  const p = progress.toLowerCase()
  if (p.includes('order'))   return 0
  if (p.includes('average')) return 1
  if (p.includes('stock') && p.includes('load')) return 2
  if (p.includes('calculat')) return 3
  if (p.includes('analys'))  return 4
  return -1
}

export default function LoadingState({ progress }) {
  const activeIdx = getActiveStep(progress)

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-8">
      {/* Spinner */}
      <div className="relative w-20 h-20">
        <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
        <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 border-r-blue-600 border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute inset-3 rounded-full border-2 border-t-indigo-400 border-r-transparent border-b-transparent border-l-indigo-400 animate-spin-slow" />
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-700">Running Analysis…</h2>
        {progress && (
          <p className="text-slate-400 text-sm mt-1.5 max-w-xs">{progress}</p>
        )}
      </div>

      {/* Steps progress */}
      <div className="flex flex-col gap-2 w-full max-w-xs">
        {STEPS.map((step, i) => {
          const done    = i < activeIdx
          const current = i === activeIdx
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                done    ? 'bg-emerald-500 text-white' :
                current ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                          'bg-slate-200 text-slate-400'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-sm transition-colors ${
                done    ? 'text-emerald-600 font-medium' :
                current ? 'text-blue-600 font-semibold' :
                          'text-slate-400'
              }`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
