import * as XLSX from 'xlsx'
import { CHANNELS } from '../config'

// ── Helpers ───────────────────────────────────────────────────
const fmt3 = n => (typeof n === 'number' ? parseFloat(n.toFixed(3)) : n)

function autoWidth(ws, data) {
  const cols = {}
  data.forEach(row => {
    Object.keys(row).forEach((key, i) => {
      cols[i] = Math.max(cols[i] ?? 0, String(row[key] ?? '').length, String(key).length)
    })
  })
  ws['!cols'] = Object.values(cols).map(w => ({ wch: Math.min(w + 2, 40) }))
}

// ── Sheet builders ────────────────────────────────────────────
function buildOrdersSheet(styleUsage) {
  const rows = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      const row = {
        'Style #':   Number(styleStr),
        Size:         size,
        'Avg Field':  d.avgField,
        ...Object.fromEntries(CHANNELS.map(ch => [ch, d.channels[ch] ?? 0])),
        Total:        d.totalCount,
      }
      rows.push(row)
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  return ws
}

function buildFabricUsageSheet(styleUsage) {
  const rows = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      rows.push({
        'Style #':      Number(styleStr),
        Size:            size,
        'Total Orders':  d.totalCount,
        'Avg Field':     d.avgField,
        '# Fabrics':     d.perFabric.length,
        'Total Metres':  fmt3(d.totalMetres),
        'Has Average?':  d.hasAverage ? 'YES' : 'NO',
      })
    }
  }
  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  return ws
}

function buildAlertsSheet(stockAnalysis) {
  const alerts = stockAnalysis.filter(s => s.isAlert)
    .sort((a, b) => (b.sevenDayReq - b.availableStock) - (a.sevenDayReq - a.availableStock))

  const rows = alerts.map(s => ({
    'Fabric #':          s.fabricNumber,
    'Fabric Name':       s.fabricName,
    Location:            s.location,
    'Available (m)':     fmt3(s.availableStock),
    'Period Demand (m)': fmt3(s.periodDemand),
    'Daily Demand (m)':  fmt3(s.dailyDemand),
    '7-Day Req (m)':     fmt3(s.sevenDayReq),
    'Shortfall (m)':     fmt3(s.sevenDayReq - s.availableStock),
  }))
  const ws = XLSX.utils.json_to_sheet(rows.length ? rows : [{ Note: 'No stock alerts' }])
  autoWidth(ws, rows)
  return ws
}

function buildFullStockSheet(stockAnalysis) {
  const rows = [...stockAnalysis]
    .sort((a, b) => (a.fabricNumber ?? 0) - (b.fabricNumber ?? 0))
    .map(s => ({
      'Fabric #':          s.fabricNumber,
      'Fabric Name':       s.fabricName,
      Location:            s.location,
      Source:              s.fabricSource,
      'Available (m)':     fmt3(s.availableStock),
      'Period Demand (m)': fmt3(s.periodDemand),
      'Daily Demand (m)':  fmt3(s.dailyDemand),
      '7-Day Req (m)':     fmt3(s.sevenDayReq),
      Status:              s.isAlert ? '⚠ LOW STOCK' : '✓ OK',
    }))
  const ws = XLSX.utils.json_to_sheet(rows)
  autoWidth(ws, rows)
  return ws
}

// ── Main export ───────────────────────────────────────────────
export function exportToExcel({ styleUsage, stockAnalysis, startDate, endDate }) {
  const wb = XLSX.utils.book_new()

  XLSX.utils.book_append_sheet(wb, buildOrdersSheet(styleUsage),        'Orders by Style & Channel')
  XLSX.utils.book_append_sheet(wb, buildFabricUsageSheet(styleUsage),   'Fabric Usage')
  XLSX.utils.book_append_sheet(wb, buildAlertsSheet(stockAnalysis),     '⚠ Stock Alerts')
  XLSX.utils.book_append_sheet(wb, buildFullStockSheet(stockAnalysis),  'Full Stock Report')

  const filename = `Fabric_Analysis_${startDate}_to_${endDate}.xlsx`
  XLSX.writeFile(wb, filename)
}
