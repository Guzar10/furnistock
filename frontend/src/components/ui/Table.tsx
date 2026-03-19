import { ReactNode } from 'react'

interface Column<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  width?: string
}

interface Props<T> {
  columns: Column<T>[]
  data: T[]
  empty?: string
  keyFn: (row: T) => string
}

export default function Table<T>({ columns, data, empty = 'Niciun rezultat', keyFn }: Props<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-14 text-text-3">
        <div className="text-4xl mb-3 opacity-30">📦</div>
        <p className="text-sm text-text-2">{empty}</p>
      </div>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border">
            {columns.map(col => (
              <th key={col.key} style={{ width: col.width }} className="text-left px-3 py-2.5 text-[10px] font-semibold uppercase tracking-widest text-text-3">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map(row => (
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
  )
}