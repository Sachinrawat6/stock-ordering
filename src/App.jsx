import { useState, useCallback } from 'react'
import { format, subDays } from 'date-fns'
import Header          from './components/Header'
import SummaryCards    from './components/SummaryCards'
import TabNav          from './components/TabNav'
import OrdersTable     from './components/OrdersTable'
import FabricUsageTable from './components/FabricUsageTable'
import StockAlertsTable from './components/StockAlertsTable'
import FullStockTable   from './components/FullStockTable'
import Top50Table       from './components/Top50Table'
import LoadingState    from './components/LoadingState'
import EmptyState      from './components/EmptyState'
import { runAnalysis } from './api'
import { exportToExcel } from './utils/export'
import { exportToPdf }   from './utils/exportPdf'

const TABS = [
  { id: 'top50',   label: '🏆 Top 50 Styles' },
  { id: 'orders',  label: 'Orders by Style & Channel' },
  { id: 'fabric',  label: 'Fabric Usage' },
  { id: 'alerts',  label: 'Stock Alerts', badge: true },
  { id: 'stock',   label: 'Full Stock Report' },
]

const today = new Date()

export default function App() {
  const [startDate, setStartDate] = useState(format(subDays(today, 29), 'yyyy-MM-dd'))
  const [endDate,   setEndDate]   = useState(format(today, 'yyyy-MM-dd'))
  const [loading,   setLoading]   = useState(false)
  const [progress,  setProgress]  = useState('')
  const [error,     setError]     = useState(null)
  const [data,      setData]      = useState(null)
  const [activeTab, setActiveTab] = useState('orders')

  const handleRun = useCallback(async () => {
    if (!startDate || !endDate) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await runAnalysis(startDate, endDate, setProgress)
      setData(result)
      setActiveTab('top50')
    } catch (err) {
      console.error(err)
      let msg = err?.response?.data?.msg ?? err?.message ?? 'Unknown error'
      if (err?.code === 'ERR_NETWORK' || msg.includes('proxy') || msg.includes('Network')) {
        msg = 'Network error — make sure the dev server proxy is running (npm run dev) and APIs are reachable.'
      }
      setError(msg)
    } finally {
      setLoading(false)
      setProgress('')
    }
  }, [startDate, endDate])

  const handleExport = useCallback(() => {
    if (!data) return
    exportToExcel(data)
  }, [data])

  const handleExportPdf = useCallback(() => {
    if (!data) return
    exportToPdf(data, activeTab)
  }, [data, activeTab])

  const alertCount = data?.stockAnalysis.filter(s => s.isAlert).length ?? 0

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      <Header
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onRun={handleRun}
        onExport={handleExport}
        onExportPdf={handleExportPdf}
        loading={loading}
        hasData={!!data}
        activeTab={activeTab}
      />

      <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3">
            <span className="text-red-400 text-lg mt-0.5">⚠</span>
            <div>
              <p className="font-semibold text-red-700 text-sm">Analysis Failed</p>
              <p className="text-red-600 text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && <LoadingState progress={progress} />}

        {/* Empty / welcome */}
        {!loading && !error && !data && <EmptyState />}

        {/* Results */}
        {!loading && data && (
          <>
            {/* Summary cards */}
            <SummaryCards data={data} />

            {/* Alert banner */}
            {alertCount > 0 && (
              <div
                className="bg-red-50 border border-red-200 rounded-2xl px-5 py-3.5 flex items-center gap-3 cursor-pointer hover:bg-red-100 transition-colors"
                onClick={() => setActiveTab('alerts')}
                role="button"
              >
                <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full shrink-0">
                  {alertCount} ALERT{alertCount > 1 ? 'S' : ''}
                </span>
                <p className="text-red-700 text-sm font-medium">
                  {alertCount} fabric{alertCount > 1 ? 's are' : ' is'} below 7-day stock supply — click to review.
                </p>
                <span className="ml-auto text-red-400 text-sm font-semibold">View →</span>
              </div>
            )}

            {/* Period info bar */}
            <div className="bg-white rounded-2xl border border-slate-200 px-5 py-3 flex flex-wrap items-center gap-4 text-sm shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Period:</span>
                <span className="font-semibold text-slate-700">
                  {data.startDate} → {data.endDate}
                </span>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  {data.periodDays} days
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Orders:</span>
                <span className="font-semibold text-slate-700">{data.orders.length.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Styles:</span>
                <span className="font-semibold text-slate-700">{Object.keys(data.styleUsage).length.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Stocks:</span>
                <span className="font-semibold text-slate-700">{data.stockAnalysis.length.toLocaleString()}</span>
              </div>
            </div>

            {/* Tabbed tables */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <TabNav
                tabs={TABS}
                active={activeTab}
                onChange={setActiveTab}
                alertCount={alertCount}
              />
              <div className="p-4">
                {activeTab === 'top50'  && <Top50Table       data={data.styleUsage} periodDays={data.periodDays} />}
                {activeTab === 'orders' && <OrdersTable      data={data.styleUsage} />}
                {activeTab === 'fabric' && <FabricUsageTable data={data.styleUsage} />}
                {activeTab === 'alerts' && <StockAlertsTable data={data.stockAnalysis} />}
                {activeTab === 'stock'  && <FullStockTable   data={data.stockAnalysis} />}
              </div>
            </div>
          </>
        )}

      </main>
    </div>
  )
}
