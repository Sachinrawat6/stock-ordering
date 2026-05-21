import { SIZE_TO_AVG_FIELD, DEFAULT_AVG_FIELD } from '../config'

// Normalise a raw size string → avg field key
export function normSize(raw) {
  if (!raw) return DEFAULT_AVG_FIELD
  const key = raw.trim().toUpperCase().replace(/[\s-]/g, '')
  return SIZE_TO_AVG_FIELD[key] ?? DEFAULT_AVG_FIELD
}

// ── Step 1: Orders → { style: { size: { channel: count } } } ──
export function transformOrders(orders) {
  const result = {}
  for (const o of orders) {
    const style   = String(o.style_number)
    const size    = (o.size ?? 'UNKNOWN').trim().toUpperCase() || 'UNKNOWN'
    const channel = o.channel ?? ''
    if (!style || style === 'undefined' || !channel) continue
    if (!result[style])          result[style] = {}
    if (!result[style][size])    result[style][size] = {}
    result[style][size][channel] = (result[style][size][channel] ?? 0) + 1
  }
  return result
}

// ── Step 2: Build rich style-usage object ─────────────────────
export function buildStyleUsage(transformed, averages) {
  const usage = {}
  for (const [styleStr, sizesData] of Object.entries(transformed)) {
    const styleNum  = Number(styleStr)
    const styleInfo = averages[styleNum]
    const entry     = {}

    for (const [size, channels] of Object.entries(sizesData)) {
      const totalCount = Object.values(channels).reduce((a, b) => a + b, 0)
      const avgField   = normSize(size)
      const perFabric  = []
      let   totalMetres = 0

      if (styleInfo) {
        for (const fab of styleInfo.fabrics) {
          const avgVal = fab[avgField] ?? 0
          const metres = avgVal * totalCount
          totalMetres += metres
          perFabric.push({ avgVal, metres, fabId: fab._id })
        }
      }

      entry[size] = {
        channels,
        totalCount,
        avgField,
        perFabric,
        totalMetres,
        hasAverage: !!styleInfo,
      }
    }
    usage[styleStr] = entry
  }
  return usage
}

// ── Step 3: Stock adequacy analysis ───────────────────────────
export function analyseStocks(stocks, styleUsage, periodDays) {
  return stocks.map(stock => {
    const styleNums = stock.styleNumbers ?? []
    const available = stock.availableStock ?? 0
    let totalDemand = 0
    const detailRows = []

    for (const sn of styleNums) {
      const sizes = styleUsage[String(sn)]
      if (!sizes) continue
      for (const [size, d] of Object.entries(sizes)) {
        if (!d.hasAverage || d.perFabric.length === 0) continue
        // Approximate: mean across all fabric entries for this style
        const meanM = d.perFabric.reduce((s, f) => s + f.metres, 0) / d.perFabric.length
        totalDemand += meanM
        detailRows.push({ style: sn, size, count: d.totalCount, estMetres: meanM })
      }
    }

    const dailyDemand  = totalDemand / Math.max(periodDays, 1)
    const sevenDayReq  = dailyDemand * 7

    return {
      fabricNumber:  stock.fabricNumber,
      fabricName:    stock.fabricName    ?? '',
      location:      stock.location      ?? '',
      fabricSource:  stock.fabric_source ?? '',
      styleNumbers:  styleNums,
      availableStock: available,
      periodDemand:   totalDemand,
      dailyDemand,
      sevenDayReq,
      isAlert:        available < sevenDayReq,
      detailRows,
    }
  })
}

// ── Derived totals (used by SummaryCards) ─────────────────────
export function computeSummary(styleUsage, stockAnalysis) {
  let totalMetres = 0
  let stylesWithAvg = 0

  for (const sizes of Object.values(styleUsage)) {
    const hasAny = Object.values(sizes).some(d => d.hasAverage)
    if (hasAny) stylesWithAvg++
    for (const d of Object.values(sizes)) totalMetres += d.totalMetres
  }

  return {
    totalStyles:   Object.keys(styleUsage).length,
    stylesWithAvg,
    totalMetres,
    alertCount:    stockAnalysis.filter(s => s.isAlert).length,
  }
}
