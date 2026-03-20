import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Product, StockEntry, Movement } from '../types'

const unitLabel = (u: string) => ({ BUC:'buc', MP:'m²', ML:'m.l.', KG:'kg', M3:'m³', L:'l' }[u] || u)
const typeLabel = (t: string) => ({ MATERIE_PRIMA:'Materie Prima', GATA_ASAMBLARE:'Kit Asamblare', ASAMBLAT:'Asamblat' }[t] || t)
const movLabel  = (t: string) => ({ RECEPTIE:'Receptie', PRODUCTIE:'Productie', VANZARE:'Vanzare', TRANSFER:'Transfer', DESEURI:'Deseuri' }[t] || t)
const fmtDate   = (d: string) => new Date(d).toLocaleDateString('ro-RO')
const today     = () => new Date().toLocaleDateString('ro-RO')
const fileName  = (name: string) => `furnistock_${name}_${new Date().toISOString().split('T')[0]}.pdf`

const addHeader = (doc: jsPDF, title: string) => {
  doc.setFillColor(20, 20, 18)
  doc.rect(0, 0, 210, 22, 'F')
  doc.setTextColor(200, 150, 62)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('FurniStock', 14, 14)
  doc.setTextColor(156, 152, 144)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text(title, 65, 14)
  doc.text(`Generat: ${today()}`, 160, 14)
  doc.setTextColor(40, 40, 40)
}

export const exportStockPdf = (stock: StockEntry[]) => {
  const doc = new jsPDF()
  addHeader(doc, 'Raport Stoc Curent')

  autoTable(doc, {
    startY: 28,
    head: [['Produs', 'Tip', 'Hala', 'Cantitate', 'U.M.', 'St. Min', 'Alert']],
    body: stock.map(s => [
      s.product.name,
      typeLabel(s.product.type),
      `${s.warehouse.code} — ${s.warehouse.name}`,
      s.quantity,
      unitLabel(s.product.unit),
      s.product.minStock || 0,
      s.product.minStock > 0 && s.quantity < s.product.minStock ? '⚠ Sub minim' : '',
    ]),
    styles:         { fontSize: 8, cellPadding: 3 },
    headStyles:     { fillColor: [20, 20, 18], textColor: [200, 150, 62], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 243, 240] },
    columnStyles: {
      0: { cellWidth: 55 },
      1: { cellWidth: 28 },
      2: { cellWidth: 55 },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 12, halign: 'center' },
      6: { cellWidth: 20, textColor: [200, 60, 60] },
    },
  })

  doc.save(fileName('stoc'))
}

export const exportProductsPdf = (products: Product[]) => {
  const doc = new jsPDF()
  addHeader(doc, 'Catalog Produse')

  autoTable(doc, {
    startY: 28,
    head: [['Produs', 'Tip', 'U.M.', 'Stoc Total', 'St. Min', 'Locatii']],
    body: products.map(p => {
      const total = (p.stock || []).reduce((s, st) => s + st.quantity, 0)
      const locs  = (p.stock || []).filter(s => s.quantity > 0).map(s => s.warehouse?.code).join(', ')
      return [
        p.name,
        typeLabel(p.type),
        unitLabel(p.unit),
        total,
        p.minStock || 0,
        locs || '—',
      ]
    }),
    styles:         { fontSize: 8, cellPadding: 3 },
    headStyles:     { fillColor: [20, 20, 18], textColor: [200, 150, 62], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 243, 240] },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 30 },
      2: { cellWidth: 15, halign: 'center' },
      3: { cellWidth: 20, halign: 'center' },
      4: { cellWidth: 15, halign: 'center' },
      5: { cellWidth: 35 },
    },
  })

  doc.save(fileName('produse'))
}

export const exportMovementsPdf = (movements: Movement[], dateFrom?: string, dateTo?: string) => {
  const doc = new jsPDF({ orientation: 'landscape' })
  const period = dateFrom && dateTo ? `${fmtDate(dateFrom)} — ${fmtDate(dateTo)}` : 'Toate'
  addHeader(doc, `Raport Miscari de Stoc — ${period}`)

  const rows = movements.flatMap(m =>
    (m.lines || []).map(l => [
      fmtDate(m.date),
      movLabel(m.type),
      l.product?.name || '—',
      l.quantity,
      unitLabel(l.product?.unit || ''),
      l.fromWarehouseId || '—',
      l.toWarehouseId   || '—',
      m.note || '',
      m.user?.name || '',
    ])
  )

  autoTable(doc, {
    startY: 28,
    head: [['Data', 'Tip', 'Produs', 'Cant.', 'U.M.', 'Din', 'Spre', 'Referinta', 'Operator']],
    body: rows,
    styles:         { fontSize: 7.5, cellPadding: 2.5 },
    headStyles:     { fillColor: [20, 20, 18], textColor: [200, 150, 62], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 243, 240] },
    columnStyles: {
      0: { cellWidth: 20 },
      1: { cellWidth: 22 },
      2: { cellWidth: 55 },
      3: { cellWidth: 14, halign: 'center' },
      4: { cellWidth: 12, halign: 'center' },
      5: { cellWidth: 30 },
      6: { cellWidth: 30 },
      7: { cellWidth: 45 },
      8: { cellWidth: 30 },
    },
  })

  doc.save(fileName('miscari'))
}