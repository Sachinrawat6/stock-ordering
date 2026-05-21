import { useState, useMemo } from 'react'
import { ChevronUp, ChevronDown, ChevronsUpDown, Search } from 'lucide-react'

/**
 * Generic, sortable, searchable, paginated table.
 *
 * columns: Array<{
 *   key:        string,            // data key
 *   label:      string,            // header label
 *   sortable?:  boolean,           // default true
 *   render?:    (val, row) => JSX, // custom cell renderer
 *   className?: string,            // td className
 *   width?:     string,            // CSS width
 * }>
 */
export default function DataTable({
  columns,
  data,
  searchKeys,
  emptyMessage = 'No data found',
  pageSize = 100,
  extraHeader,          // optional JSX rendered right of search bar
}) {
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [search,  setSearch]  = useState('')
  const [page,    setPage]    = useState(1)

  const searchableKeys = searchKeys ?? columns.map(c => c.key)

  const filtered = useMemo(() => {
    if (!search.trim()) return data
    const q = search.toLowerCase()
    return data.filter(row =>
      searchableKeys.some(k => String(row[k] ?? '').toLowerCase().includes(q)),
    )
  }, [data, search, searchableKeys])

  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    return [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? ''
      const vb = b[sortKey] ?? ''
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), undefined, { numeric: true })
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortKey, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const safePage   = Math.min(page, totalPages)
  const paginated  = sorted.slice((safePage - 1) * pageSize, safePage * pageSize)

  const handleSort = key => {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortKey(key); setSortDir('asc') }
    setPage(1)
  }

  const handleSearch = e => { setSearch(e.target.value); setPage(1) }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

      {/* Toolbar */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={handleSearch}
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 w-56 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          {extraHeader}
          <span className="text-xs text-slate-400 tabular-nums">
            {sorted.length.toLocaleString()} row{sorted.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable !== false && handleSort(col.key)}
                  style={col.width ? { width: col.width } : {}}
                  className={`px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap select-none
                    ${col.sortable !== false ? 'cursor-pointer hover:bg-slate-100 hover:text-slate-700' : ''}
                    ${col.className ?? ''}`}
                >
                  <div className="flex items-center gap-1">
                    {col.label}
                    {col.sortable !== false && (
                      <span className="text-slate-300">
                        {sortKey === col.key
                          ? sortDir === 'asc'
                            ? <ChevronUp   className="w-3 h-3 text-blue-500" />
                            : <ChevronDown className="w-3 h-3 text-blue-500" />
                          : <ChevronsUpDown className="w-3 h-3" />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {paginated.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-slate-400 text-sm"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginated.map((row, i) => (
                <tr
                  key={i}
                  className="hover:bg-slate-50/70 transition-colors"
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-slate-700 ${col.className ?? ''}`}
                    >
                      {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '–')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>
            Showing {((safePage - 1) * pageSize + 1).toLocaleString()}–
            {Math.min(safePage * pageSize, sorted.length).toLocaleString()} of{' '}
            {sorted.length.toLocaleString()}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              ←
            </button>
            <span className="px-2 font-medium">{safePage} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="px-2.5 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
