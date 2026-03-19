import { Router, Response } from 'express'
import { prisma } from '../lib/prisma'
import { authGuard } from '../middleware/auth'

const router = Router()
router.use(authGuard)

// GET /stock — stoc complet cu filtre opționale
router.get('/', async (req, res: Response) => {
  const { warehouseId, productId, type } = req.query

  const stock = await prisma.stock.findMany({
    where: {
      quantity: { gt: 0 },
      ...(warehouseId ? { warehouseId: String(warehouseId) } : {}),
      ...(productId   ? { productId:   String(productId)   } : {}),
      ...(type        ? { product: { type: String(type) as any } } : {}),
    },
    include: {
      product:   true,
      warehouse: true,
    },
    orderBy: [{ product: { type: 'asc' } }, { product: { name: 'asc' } }],
  })

  res.json(stock)
})

// GET /stock/summary — sumar per hală
router.get('/summary', async (_req, res: Response) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { active: true },
    include: {
      stock: {
        where: { quantity: { gt: 0 } },
        include: { product: true },
      },
    },
  })

  const summary = warehouses.map(w => ({
    id:           w.id,
    name:         w.name,
    code:         w.code,
    location:     w.location,
    productCount: w.stock.length,
    totalQty:     w.stock.reduce((s, st) => s + st.quantity, 0),
  }))

  res.json(summary)
})

export default router