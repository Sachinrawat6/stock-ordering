import { useState, useRef, useEffect } from 'react'
import { Calendar, Play, Download, FileText, Layers, Loader2, ChevronDown } from 'lucide-react'
import { format, subDays, subMonths } from 'date-fns'

// ── Preset definitions ────────────────────────────────────────
const today = () => format(new Date(), 'yyyy-MM-dd')

const PRESETS = [
  {
    label: 'Last 7 Days',
    getRange: () => ({ start: format(subDays(new Date(), 6), 'yyyy-MM-dd'), end: today() }),
  },
  {
    label: 'Last 15 Days',
    getRange: () => ({ start: format(subDays(new Date(), 14), 'yyyy-MM-dd'), end: today() }),
  },
  {
    label: 'Last 20 Days',
    getRange: () => ({ start: format(subDays(new Date(), 19), 'yyyy-MM-dd'), end: today() }),
  },
  {
    label: 'Last 1 Month',
    getRange: () => ({ start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'), end: today() }),
  },
  { label: 'Custom', getRange: null },
]

function getActivePresetLabel(startDate, endDate) {
  for (const p of PRESETS) {
    if (!p.getRange) continue
    const { start, end } = p.getRange()
    if (start === startDate && end === endDate) return p.label
  }
  return 'Custom'
}

// ── Dropdown component ────────────────────────────────────────
function PresetDropdown({ startDate, endDate, onChange }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState(() => getActivePresetLabel(startDate, endDate))
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handlePreset = (preset) => {
    setMode(preset.label)
    if (preset.getRange) {
      const { start, end } = preset.getRange()
      onChange(start, end)
      setOpen(false)
    }
    // 'Custom' just keeps dropdown open showing date inputs
  }

  const activeLabel = mode === 'Custom' ? 'Custom' : getActivePresetLabel(startDate, endDate)

  return (
    <div className="relative" ref={ref}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-3 py-2 text-sm font-medium text-white transition-colors"
      >
        <Calendar className="w-4 h-4 text-blue-300 shrink-0" />
        <span className="hidden sm:inline text-blue-100">{activeLabel}:</span>
        <span className="text-white font-semibold tabular-nums text-xs">
          {startDate} → {endDate}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-blue-300 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-[#162D4A] border border-white/20 rounded-2xl shadow-2xl z-50 overflow-hidden">

          {/* Preset chips */}
          <div className="p-3 border-b border-white/10">
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-2 px-1">
              Quick Select
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESETS.map((p) => {
                const isActive = activeLabel === p.label
                return (
                  <button
                    key={p.label}
                    onClick={() => handlePreset(p)}
                    className={`text-sm font-medium px-3 py-2 rounded-xl transition-colors text-left ${
                      isActive
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/5 text-blue-100 hover:bg-white/15'
                    }`}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom date inputs — always visible at bottom */}
          <div className="p-3">
            <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider mb-2 px-1">
              Custom Range
            </p>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-300 w-12 shrink-0">From</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setMode('Custom')
                    onChange(e.target.value, endDate)
                  }}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400 [color-scheme:dark]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-blue-300 w-12 shrink-0">To</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setMode('Custom')
                    onChange(startDate, e.target.value)
                  }}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1.5 text-sm text-white outline-none focus:border-blue-400 [color-scheme:dark]"
                />
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-3 w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl transition-colors"
            >
              Apply
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Main Header ───────────────────────────────────────────────
export default function Header({
  startDate, endDate,
  onStartDateChange, onEndDateChange,
  onRun, onExport, onExportPdf,
  loading, hasData, activeTab,
}) {
  const handlePresetChange = (start, end) => {
    onStartDateChange(start)
    onEndDateChange(end)
  }

  return (
    <header className="bg-[#1E3A5F] text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-500/20 border border-blue-400/30 p-2 rounded-xl">
              <Layers className="w-5 h-5 text-blue-300" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-base leading-tight tracking-tight">
                Fabric Analysis
              </h1>
              <p className="text-blue-300 text-xs font-medium">
                Order Demand &amp; Stock Dashboard
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 sm:gap-3">

            {/* Date Range Preset Dropdown */}
            <PresetDropdown
              startDate={startDate}
              endDate={endDate}
              onChange={handlePresetChange}
            />

            {/* Export buttons */}
            {hasData && (
              <div className="flex items-center gap-2">
                <button
                  onClick={onExport}
                  className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm"
                  title="Export as Excel (.xlsx)"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Excel</span>
                </button>
                <button
                  onClick={onExportPdf}
                  className="flex items-center gap-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold px-3 py-2 rounded-xl transition-colors shadow-sm"
                  title={`Export current tab as PDF${activeTab ? ` (${activeTab})` : ''}`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">PDF</span>
                </button>
              </div>
            )}

            {/* Run Analysis */}
            <button
              onClick={onRun}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400/60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {loading ? 'Analysing…' : 'Run Analysis'}
            </button>

          </div>
        </div>
      </div>
    </header>
  )
}
