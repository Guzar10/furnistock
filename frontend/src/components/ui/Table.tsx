import { ReactNode } from 'react'
import Pagination from './Pagination'

interface Column<T> {
  key:         string
  header:      string
  render:      (row: T) => ReactNode
  width?:      string
  mobileHide?: boolean
}

interface Props<T> {
  columns:       Column<T>[]
  data:          T[]
  empty?:        string
  keyFn:         (row: T) => string
  page?:         number
  perPage?:      number
  onPageChange?: (page: number) => void
}

export default function Table<T>({
  columns, data, empty = 'Niciun rezultat', keyFn,
  page, perPage = 20, onPageChange,
}: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-14 text-text-3">
        <div className="text-4xl mb-3 opacity-30">📦</div>
        <p className="text-sm text-text-2">{empty}</p>
      </div>
    )
  }

  const usePagination = page !== undefined && onPageChange !== undefined
  const paginated     = usePagination
    ? data.slice((page - 1) * perPage, page * perPage)
    : data

  return (
    <div>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              {columns.map(col => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-3"
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map(row => (
              <tr key={keyFn(row)} className="border-b border-border hover:bg-bg-surface2 transition-colors last:border-0">
                {columns.map(col => (
                  <td key={col.key} className="px-3 py-3 text-text align-middle">
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-border">
        {paginated.map(row => (
          <div key={keyFn(row)} className="p-4 flex flex-col gap-2">
            {columns.filter(c => !c.mobileHide).map(col => (
              <div key={col.key} className="flex items-start justify-between gap-3">
                {col.header && (
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-text-3 mt-0.5 min-w-16 shrink-0">
                    {col.header}
                  </span>
                )}
                <div className="text-sm text-right">
                  {col.render(row)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Paginare */}
      {usePagination && (
        <Pagination
          total={data.length}
          page={page}
          perPage={perPage}
          onChange={onPageChange}
        />
      )}
    </div>
  )
}