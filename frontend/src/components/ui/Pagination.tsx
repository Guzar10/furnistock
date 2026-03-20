interface Props {
  total:    number
  page:     number
  perPage:  number
  onChange: (page: number) => void
}

export default function Pagination({ total, page, perPage, onChange }: Props) {
  const totalPages = Math.ceil(total / perPage)
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3)             pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <span className="text-xs text-text-3">
        {Math.min((page - 1) * perPage + 1, total)}–{Math.min(page * perPage, total)} din <strong className="text-text-2">{total}</strong>
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(page - 1)} disabled={page === 1}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border-2 bg-bg-surface2 text-text-2 hover:text-text hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ←
        </button>
        {pages.map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-xs text-text-3">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onChange(p as number)}
              className={`px-2.5 py-1.5 text-xs rounded-md border transition-all ${
                p === page
                  ? 'bg-accent/10 border-accent/30 text-accent font-medium'
                  : 'border-border-2 bg-bg-surface2 text-text-2 hover:text-text hover:border-border'
              }`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onChange(page + 1)} disabled={page === totalPages}
          className="px-2.5 py-1.5 text-xs rounded-md border border-border-2 bg-bg-surface2 text-text-2 hover:text-text hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          →
        </button>
      </div>
    </div>
  )
}