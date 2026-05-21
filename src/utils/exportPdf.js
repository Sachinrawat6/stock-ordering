import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { CHANNELS } from '../config'

// ── Theme colours ─────────────────────────────────────────────
const C = {
  navy:      [30,  58,  95],
  navyLight: [68,  114, 196],
  white:     [255, 255, 255],
  slateLight:[248, 250, 252],
  slate200:  [226, 232, 240],
  slate500:  [100, 116, 139],
  slate700:  [51,  65,  85],
  red:       [220, 38,  38],
  redLight:  [254, 226, 226],
  green:     [22,  163, 74],
  greenLight:[220, 252, 231],
  amber:     [217, 119, 6],
  amberLight:[254, 243, 199],
  blue:      [37,  99,  235],
  blueLight: [219, 234, 254],
}

// ── Helpers ───────────────────────────────────────────────────
const f2 = (n) => (typeof n === 'number' ? n.toFixed(2) : '–')
const f3 = (n) => (typeof n === 'number' ? n.toFixed(3) : '–')
const num = (n) => (typeof n === 'number' ? n.toLocaleString() : '–')

function pageHeader(doc, title, subtitle, pageNum) {
  // Navy bar
  doc.setFillColor(...C.navy)
  doc.rect(0, 0, 297, 18, 'F')

  doc.setTextColor(...C.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('🧵  Fabric Analysis Dashboard', 14, 12)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(subtitle, 283, 12, { align: 'right' })

  // Section title
  doc.setTextColor(...C.navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.text(title, 14, 28)

  // Page number (bottom)
  doc.setTextColor(...C.slate500)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text(`Page ${pageNum}`, 283, 205, { align: 'right' })
}

function tableDefaults(headStyles, altFill = C.slateLight) {
  return {
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 },
      lineColor: C.slate200,
      lineWidth: 0.1,
      textColor: C.slate700,
    },
    headStyles: {
      fillColor: headStyles ?? C.navyLight,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 7.5,
    },
    alternateRowStyles: { fillColor: altFill },
    margin: { left: 14, right: 14 },
  }
}

// ── Aggregate helpers ─────────────────────────────────────────
function aggregateTop50(styleUsage, periodDays) {
  const rows = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    let totalOrders = 0, totalMetres = 0
    const ch = Object.fromEntries(CHANNELS.map((c) => [c, 0]))
    const sizeCounts = {}
    for (const [size, d] of Object.entries(sizes)) {
      totalOrders += d.totalCount
      totalMetres += d.totalMetres
      sizeCounts[size] = (sizeCounts[size] ?? 0) + d.totalCount
      for (const [c, n] of Object.entries(d.channels)) { if (ch[c] !== undefined) ch[c] += n }
    }
    const topSize    = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '–'
    const topChannel = Object.entries(ch).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '–'
    const next7Days  = (totalMetres / Math.max(periodDays, 1)) * 7
    rows.push({ styleNumber: Number(styleStr), totalOrders, totalMetres, topSize, topChannel, ch, next7Days })
  }
  return rows.sort((a, b) => b.totalOrders - a.totalOrders).slice(0, 50)
}

// ── Sheet 1: Top 50 ───────────────────────────────────────────
function addTop50Page(doc, styleUsage, periodDays, subtitle) {
  pageHeader(doc, 'Top 50 Styles — by Order Volume', subtitle, 1)
  const rows = aggregateTop50(styleUsage, periodDays)

  autoTable(doc, {
    startY: 33,
    head: [[
      '#', 'Style #', 'Total Orders', 'Fabric Used (m)',
      'Next 7-Day Need (m)', 'Top Size', 'Top Channel',
      ...CHANNELS,
    ]],
    body: rows.map((r, i) => [
      i + 1,
      r.styleNumber,
      num(r.totalOrders),
      f2(r.totalMetres),
      f2(r.next7Days),
      r.topSize,
      r.topChannel,
      ...CHANNELS.map((c) => r.ch[c] || '–'),
    ]),
    columnStyles: {
      0: { cellWidth: 8,  halign: 'center' },
      1: { cellWidth: 18, fontStyle: 'bold' },
      2: { cellWidth: 22, halign: 'right' },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 28, halign: 'right', textColor: C.amber },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 20 },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 0) {
        const rank = data.row.index + 1
        if      (rank === 1) data.cell.styles.fillColor = [254, 240, 138]
        else if (rank === 2) data.cell.styles.fillColor = [226, 232, 240]
        else if (rank === 3) data.cell.styles.fillColor = [254, 215, 170]
      }
    },
    ...tableDefaults(C.navy),
  })
}

// ── Sheet 2: Orders by Style & Channel ───────────────────────
function addOrdersPage(doc, styleUsage, subtitle) {
  doc.addPage()
  pageHeader(doc, 'Orders by Style & Channel', subtitle, 2)

  const body = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      body.push([
        Number(styleStr),
        size,
        d.avgField,
        ...CHANNELS.map((c) => d.channels[c] || '–'),
        d.totalCount,
      ])
    }
  }
  body.sort((a, b) => b[b.length - 1] - a[a.length - 1])

  autoTable(doc, {
    startY: 33,
    head: [['Style #', 'Size', 'Avg Field', ...CHANNELS, 'Total']],
    body,
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 30 },
      [3 + CHANNELS.length]: { fontStyle: 'bold', halign: 'right' },
    },
    ...tableDefaults(C.navyLight),
  })
}

// ── Sheet 3: Fabric Usage ─────────────────────────────────────
function addFabricUsagePage(doc, styleUsage, periodDays, subtitle) {
  doc.addPage()
  pageHeader(doc, 'Fabric Usage — Metres per Style & Size', subtitle, 3)

  const body = []
  for (const [styleStr, sizes] of Object.entries(styleUsage)) {
    for (const [size, d] of Object.entries(sizes)) {
      const next7 = (d.totalMetres / Math.max(periodDays, 1)) * 7
      body.push([
        Number(styleStr), size, d.totalCount,
        d.avgField, d.perFabric.length,
        f3(d.totalMetres), f3(next7),
        d.hasAverage ? 'YES' : 'MISSING',
      ])
    }
  }
  body.sort((a, b) => b[5] - a[5])

  autoTable(doc, {
    startY: 33,
    head: [['Style #', 'Size', 'Orders', 'Avg Field', '# Fabrics', 'Period Metres', '7-Day Need (m)', 'Has Avg?']],
    body,
    columnStyles: {
      0: { cellWidth: 18, fontStyle: 'bold' },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 16, halign: 'right' },
      3: { cellWidth: 38 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 28, halign: 'right', textColor: C.amber },
      7: { cellWidth: 18, halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 7) {
        if (data.cell.raw === 'YES')     { data.cell.styles.textColor = C.green; data.cell.styles.fontStyle = 'bold' }
        if (data.cell.raw === 'MISSING') { data.cell.styles.textColor = C.red;   data.cell.styles.fontStyle = 'bold' }
      }
    },
    ...tableDefaults(C.navyLight),
  })
}

// ── Sheet 4: Stock Alerts ─────────────────────────────────────
function addAlertsPage(doc, stockAnalysis, subtitle) {
  doc.addPage()
  pageHeader(doc, '⚠  Stock Alerts — Fabrics Below 7-Day Supply', subtitle, 4)

  const alerts = stockAnalysis
    .filter((s) => s.isAlert)
    .sort((a, b) => (b.sevenDayReq - b.availableStock) - (a.sevenDayReq - a.availableStock))

  if (alerts.length === 0) {
    doc.setTextColor(...C.green)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(11)
    doc.text('✓  No stock alerts — all fabrics have sufficient 7-day supply', 14, 40)
    return
  }

  autoTable(doc, {
    startY: 33,
    head: [['Fabric #', 'Fabric Name', 'Location', 'Available (m)', 'Period Demand (m)', 'Daily (m)', '7-Day Req (m)', 'Shortfall (m)']],
    body: alerts.map((s) => [
      s.fabricNumber, s.fabricName, s.location || '–',
      f3(s.availableStock), f3(s.periodDemand),
      f3(s.dailyDemand), f3(s.sevenDayReq),
      f3(s.sevenDayReq - s.availableStock),
    ]),
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 48 },
      2: { cellWidth: 20 },
      3: { cellWidth: 25, halign: 'right' },
      4: { cellWidth: 28, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 25, halign: 'right' },
      7: { cellWidth: 25, halign: 'right', textColor: C.red, fontStyle: 'bold' },
    },
    headStyles: { fillColor: [153, 27, 27], textColor: C.white, fontStyle: 'bold', fontSize: 7.5 },
    didParseCell(data) {
      if (data.section === 'body') {
        data.cell.styles.fillColor = [255, 240, 240]
      }
    },
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: { top: 2.5, bottom: 2.5, left: 3, right: 3 }, lineColor: C.slate200, lineWidth: 0.1, textColor: C.slate700 },
    margin: { left: 14, right: 14 },
  })
}

// ── Sheet 5: Full Stock Report ────────────────────────────────
function addFullStockPage(doc, stockAnalysis, subtitle) {
  doc.addPage()
  pageHeader(doc, 'Full Stock Report', subtitle, 5)

  const rows = [...stockAnalysis].sort((a, b) => (a.fabricNumber ?? 0) - (b.fabricNumber ?? 0))

  autoTable(doc, {
    startY: 33,
    head: [['Fabric #', 'Fabric Name', 'Location', 'Source', 'Available (m)', 'Period Demand (m)', 'Daily (m)', '7-Day Req (m)', 'Status']],
    body: rows.map((s) => [
      s.fabricNumber, s.fabricName, s.location || '–', s.fabricSource || '–',
      f3(s.availableStock), f3(s.periodDemand),
      f3(s.dailyDemand), f3(s.sevenDayReq),
      s.isAlert ? 'LOW STOCK' : 'OK',
    ]),
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 44 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 25, halign: 'right' },
      5: { cellWidth: 28, halign: 'right' },
      6: { cellWidth: 20, halign: 'right' },
      7: { cellWidth: 25, halign: 'right' },
      8: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'LOW STOCK') {
          data.cell.styles.textColor    = C.red
          data.cell.styles.fillColor    = C.redLight
        } else {
          data.cell.styles.textColor    = C.green
          data.cell.styles.fillColor    = C.greenLight
        }
      }
    },
    ...tableDefaults(C.navyLight),
  })
}

// ── Tab → page builder map ────────────────────────────────────
const TAB_CONFIG = {
  top50:  { label: 'Top50_Styles',        builder: (doc, data, sub) => addTop50Page(doc, data.styleUsage, data.periodDays, sub) },
  orders: { label: 'Orders_by_Style',     builder: (doc, data, sub) => addOrdersPage(doc, data.styleUsage, sub) },
  fabric: { label: 'Fabric_Usage',        builder: (doc, data, sub) => addFabricUsagePage(doc, data.styleUsage, data.periodDays, sub) },
  alerts: { label: 'Stock_Alerts',        builder: (doc, data, sub) => addAlertsPage(doc, data.stockAnalysis, sub) },
  stock:  { label: 'Full_Stock_Report',   builder: (doc, data, sub) => addFullStockPage(doc, data.stockAnalysis, sub) },
}

// ── Main export function ──────────────────────────────────────
// activeTab: 'top50' | 'orders' | 'fabric' | 'alerts' | 'stock' | undefined (all tabs)
export function exportToPdf({ styleUsage, stockAnalysis, orders, periodDays, startDate, endDate }, activeTab) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const subtitle = `Period: ${startDate}  →  ${endDate}  (${periodDays} days)  |  Orders: ${orders.length.toLocaleString()}`
  const payload = { styleUsage, stockAnalysis, orders, periodDays, startDate, endDate }

  if (activeTab && TAB_CONFIG[activeTab]) {
    // Single-tab export — no addPage needed, first page is already open
    TAB_CONFIG[activeTab].builder(doc, payload, subtitle)
    const label = TAB_CONFIG[activeTab].label
    doc.save(`Fabric_${label}_${startDate}_to_${endDate}.pdf`)
  } else {
    // Full export — all 5 tabs
    addTop50Page(doc, styleUsage, periodDays, subtitle)
    addOrdersPage(doc, styleUsage, subtitle)
    addFabricUsagePage(doc, styleUsage, periodDays, subtitle)
    addAlertsPage(doc, stockAnalysis, subtitle)
    addFullStockPage(doc, stockAnalysis, subtitle)
    doc.save(`Fabric_Analysis_${startDate}_to_${endDate}.pdf`)
  }
}
