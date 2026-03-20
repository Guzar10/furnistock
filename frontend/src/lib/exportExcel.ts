import * as XLSX from 'xlsx'
import type { Product, StockEntry, Movement } from '../types'

const unitLabel = (u: string) => ({ BUC:'buc', MP:'m²', ML:'m.l.', KG:'kg', M3:'m³', L:'l' }[u] || u)
const typeLabel = (t: string) => ({ MATERIE_PRIMA:'Materie Primă', GATA_ASAMBLARE:'Kit Asamblare', ASAMBLAT:'Asamblat' }[t] || t)
const movLabel  = (t: string) => ({ RECEPTIE:'Recepție', PRODUCTIE:'Producție', VANZARE:'Vânzare', TRANSFER:'Transfer', DESEURI:'Deșeuri' }[t] || t)
const fmtDate   = (d: string) => new Date(d).toLocaleDateString('ro-RO')

export const exportStockExcel = (stock: StockEntry[]) => {
  const rows = stock.map(s => ({
    'Produs':       s.product.name,
    'Tip':          typeLabel(s.product.type),
    'Hală':         s.warehouse.name,
    'Cod Hală':     s.warehouse.code,
    'Cantitate':    s.quantity,
    'U.M.':         unitLabel(s.product.unit),
    'Stoc Minim':   s.product.minStock || 0,
    'Sub Minim':    s.product.minStock > 0 && s.quantity < s.product.minStock ? 'DA' : 'Nu',
  }))

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 28 }, { wch: 10 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Stoc Curent')
  XLSX.writeFile(wb, `furnistock_stoc_${today()}.xlsx`)
}

export const exportProductsExcel = (products: Product[]) => {
  const rows = products.map(p => {
    const total = (p.stock || []).reduce((s, st) => s + st.quantity, 0)
    const locs  = (p.stock || []).filter(s => s.quantity > 0).map(s => s.warehouse?.code).join(', ')
    return {
      'Produs':       p.name,
      'Tip':          typeLabel(p.type),
      'U.M.':         unitLabel(p.unit),
      'Stoc Total':   total,
      'Stoc Minim':   p.minStock || 0,
      'Sub Minim':    p.minStock > 0 && total < p.minStock ? 'DA' : 'Nu',
      'Locații':      locs || '—',
      'Descriere':    p.description || '',
    }
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 30 }, { wch: 16 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 30 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Produse')
  XLSX.writeFile(wb, `furnistock_produse_${today()}.xlsx`)
}

export const exportMovementsExcel = (movements: Movement[]) => {
  const rows = movements.flatMap(m =>
    (m.lines || []).map(l => ({
      'Data':         fmtDate(m.date),
      'Tip':          movLabel(m.type),
      'Produs':       l.product?.name || '—',
      'Cantitate':    l.quantity,
      'U.M.':         unitLabel(l.product?.unit || ''),
      'Din Hală':     l.fromWarehouseId || '—',
      'Spre Hală':    l.toWarehouseId   || '—',
      'Referință':    m.note || '',
      'Operator':     m.user?.name || '',
    }))
  )

  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{ wch: 12 }, { wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 18 }]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Mișcări')
  XLSX.writeFile(wb, `furnistock_miscari_${today()}.xlsx`)
}

const today = () => new Date().toISOString().split('T')[0]