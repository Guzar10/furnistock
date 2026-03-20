import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authGuard, roleGuard, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authGuard)

const ProductSchema = z.object({
  name:        z.string().min(1),
  type:        z.enum(['MATERIE_PRIMA', 'GATA_ASAMBLARE', 'ASAMBLAT']),
  unit:        z.enum(['BUC', 'MP', 'ML', 'KG', 'M3', 'L']).default('BUC'),
  description: z.string().optional(),
  minStock:    z.number().min(0).default(0),
})

router.get('/', async (_req, res: Response) => {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: {
      stock: { include: { warehouse: true } },
    },
    orderBy: { name: 'asc' },
  })
  res.json(products)
})

router.get('/:id', async (req, res: Response) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { stock: { include: { warehouse: true } } },
  })
  if (!product) { res.status(404).json({ error: 'Produs negăsit' }); return }
  res.json(product)
})

router.post('/', roleGuard('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const parsed = ProductSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  const product = await prisma.product.create({ data: parsed.data })
  res.status(201).json(product)
})

router.put('/:id', roleGuard('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const parsed = ProductSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data:  parsed.data,
  })
  res.json(product)
})

router.delete('/:id', roleGuard('ADMIN'), async (req, res: Response) => {
  await prisma.product.update({
    where: { id: req.params.id },
    data:  { active: false },
  })
  res.json({ success: true })
})

// GET /products/:id/history — toate mișcările unui produs
router.get('/:id/history', async (req, res: Response) => {
  const { id } = req.params

  const lines = await prisma.movementLine.findMany({
    where: { productId: id },
    include: {
      movement: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { movement: { date: 'desc' } },
    take: 100,
  })

  res.json(lines)
})

export default router