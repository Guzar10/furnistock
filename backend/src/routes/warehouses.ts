import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authGuard, roleGuard, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authGuard)

const WarehouseSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1).max(6).toUpperCase(),
  location: z.string().optional(),
  description: z.string().optional(),
})

// GET /warehouses
router.get('/', async (_req, res: Response) => {
  const warehouses = await prisma.warehouse.findMany({
    where: { active: true },
    include: {
      stock: {
        include: { product: true },
      },
    },
    orderBy: { name: 'asc' },
  })
  res.json(warehouses)
})

// GET /warehouses/:id
router.get('/:id', async (req, res: Response) => {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: req.params.id },
    include: { stock: { include: { product: true } } },
  })
  if (!warehouse) { res.status(404).json({ error: 'Hală negăsită' }); return }
  res.json(warehouse)
})

// POST /warehouses
router.post('/', roleGuard('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const parsed = WarehouseSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  try {
    const warehouse = await prisma.warehouse.create({ data: parsed.data })
    res.status(201).json(warehouse)
  } catch {
    res.status(400).json({ error: 'Codul hălii există deja' })
  }
})

// PUT /warehouses/:id
router.put('/:id', roleGuard('ADMIN', 'MANAGER'), async (req: AuthRequest, res: Response) => {
  const parsed = WarehouseSchema.safeParse(req.body)
  if (!parsed.success) { res.status(400).json({ error: parsed.error.flatten() }); return }
  try {
    const warehouse = await prisma.warehouse.update({
      where: { id: req.params.id },
      data: parsed.data,
    })
    res.json(warehouse)
  } catch {
    res.status(400).json({ error: 'Codul hălii există deja' })
  }
})

// DELETE /warehouses/:id — soft delete, doar ADMIN
router.delete('/:id', roleGuard('ADMIN'), async (req, res: Response) => {
  await prisma.warehouse.update({
    where: { id: req.params.id },
    data: { active: false },
  })
  res.json({ success: true })
})

export default router