import axios from 'axios';
import { NOCODB, RAW_MATERIAL, CHANNELS, EXCLUDED_SUB_STATUSES } from '../config';
import { transformOrders, buildStyleUsage, analyseStocks } from '../utils/transform';

// ── Date helpers ──────────────────────────────────────────────
function shiftDate(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── Where clause builder ──────────────────────────────────────
// Only status + date filter sent to NocoDB.
// Channel and sub-status filters are applied in JS after fetch (post-filter)
// to avoid NocoDB query parsing errors with complex compound filters.
function buildWhere(startDate, endDate) {
  // NocoDB only supports gt/lt (not gte/lte).
  // Shift by 1 day on each side to make the range inclusive of startDate and endDate.
  const dayBefore = shiftDate(startDate, -1);
  const dayAfter  = shiftDate(endDate, 1);
  const dateFilter = `(${NOCODB.DATE_FIELD},gt,exactDate,${dayBefore})~and(${NOCODB.DATE_FIELD},lt,exactDate,${dayAfter})`;
  return `(status,eq,pending)~and(${dateFilter})`;
}

// ── Post-fetch JS filter ──────────────────────────────────────
// Filters channel and excluded sub-statuses after all pages are fetched.
function applyPostFilters(records) {
  const channelSet  = new Set(CHANNELS);
  const excludedSet = new Set(EXCLUDED_SUB_STATUSES.map((s) => s.toLowerCase()));

  return records.filter((r) => {
    // Must be one of the allowed channels
    if (!channelSet.has(r.channel)) return false;
    // Exclude records whose status value is in the excluded list
    const statusVal = (r[NOCODB.SUB_STATUS_FIELD] ?? '').toLowerCase();
    if (excludedSet.has(statusVal)) return false;
    return true;
  });
}

// ── Paginated NocoDB fetch ────────────────────────────────────
async function fetchAllOrders(startDate, endDate, onProgress) {
  const where   = buildWhere(startDate, endDate);
  const headers = { 'xc-token': NOCODB.TOKEN };
  let all    = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    onProgress(`Fetching orders… ${all.length} loaded`);
    const { data } = await axios.get(NOCODB.BASE_URL, {
      params: { limit, offset, where, viewId: NOCODB.VIEW_ID },
      headers,
    });
    const records = data.list ?? [];
    all = [...all, ...records];
    if (data.pageInfo?.isLastPage !== false || records.length === 0) break;
    offset += limit;
  }

  // Apply channel + sub-status filters in JS after all pages are fetched
  const filtered = applyPostFilters(all);
  onProgress(`${all.length} records fetched → ${filtered.length} after channel & status filter`);
  return filtered;
}

// ── Averages API ──────────────────────────────────────────────
async function fetchAverages(onProgress) {
  onProgress('Loading fabric averages…');
  const { data } = await axios.get(RAW_MATERIAL.AVERAGES_URL, { timeout: 60_000 });
  const lookup = {};
  for (const item of data.data ?? []) {
    lookup[item.style_number] = {
      fabrics: item.fabrics ?? [],
      patternNumber: item.patternNumber ?? '',
    };
  }
  return lookup;
}

// ── Stock API ─────────────────────────────────────────────────
async function fetchStocks(onProgress) {
  onProgress('Loading fabric stocks…');
  const { data } = await axios.get(RAW_MATERIAL.STOCK_URL, { timeout: 30_000 });
  return data.data ?? [];
}

// ── Main entry ────────────────────────────────────────────────
export async function runAnalysis(startDate, endDate, onProgress = () => {}) {
  const [orders, averages, stocks] = await Promise.all([
    fetchAllOrders(startDate, endDate, onProgress),
    fetchAverages(onProgress),
    fetchStocks(onProgress),
  ]);

  onProgress('Calculating fabric usage…');
  const periodDays = Math.max((new Date(endDate) - new Date(startDate)) / 86_400_000 + 1, 1);
  const transformed = transformOrders(orders);
  const styleUsage  = buildStyleUsage(transformed, averages);

  onProgress('Analysing stock levels…');
  const stockAnalysis = analyseStocks(stocks, styleUsage, periodDays);

  return { orders, styleUsage, stockAnalysis, periodDays, startDate, endDate };
}
