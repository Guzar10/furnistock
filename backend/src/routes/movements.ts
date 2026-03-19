import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authGuard, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authGuard)

const LineSchema = z.object({
  productId:      z.string(),
  fromWarehouseId: z.string().optional(),
  toWarehouseId:   z.string().optional(),
  quantity:        z.number().positive(),
})

const MovementSchema = z.discriminatedUnion('type', [
  z.object({
    type:  z.literal('RECEPTIE'),
    date:  z.string().optional(),
    note:  z.string().optional(),
    lines: z.array(LineSchema.extend({ toWarehouseId: z.string() })).min(1),
  }),
  z.object({
    type:     z.literal('VANZARE'),
    date:     z.string().optional(),
    note:     z.string().optional(),
    lines:    z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
  }),
  z.object({
    type:     z.literal('DESEURI'),
    date:     z.string().optional(),
    note:     z.string().optional(),
    lines:    z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
  }),
  z.object({
    type:            z.literal('TRANSFER'),
    date:            z.string().optional(),
    note:            z.string().optional(),
    lines:           z.array(LineSchema.extend({
      fromWarehouseId: z.string(),
      toWarehouseId:   z.string(),
    })).min(1),
  }),
  z.object({
    type:     z.literal('PRODUCTIE'),
    date:     z.string().optional(),
    note:     z.string().optional(),
    consumed: z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
    produced: z.array(LineSchema.extend({ toWarehouseId: z.string() })).min(1),
  }),
])

// GET /movements
router.get('/', async (req, res: Response) => {
  const { type, limit = '50' } = req.query
  try {
    const movements = await prisma.movement.findMany({
      where: { ...(type ? { type: String(type) as any } : {}) },
      include: {
        user:  { select: { id: true, name: true } },
        lines: {
          include: {
            product: {
              select: { id: true, name: true, unit: true }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(String(limit)),
    })
    res.json(movements)
  } catch (err: any) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// POST /movements
router.post('/', async (req: AuthRequest, res: Response) => {
  const parsed = MovementSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() })
    return
  }

  const data = parsed.data
  const userId = req.user!.userId

  try {
    const movement = await prisma.$transaction(async (tx) => {
      // Construiește liniile în funcție de tip
      let lines: any[] = []

      if (data.type === 'PRODUCTIE') {
        lines = [
          ...data.consumed.map(l => ({ ...l, fromWarehouseId: l.fromWarehouseId })),
          ...data.produced.map(l => ({ ...l, toWarehouseId:   l.toWarehouseId })),
        ]
      } else {
        lines = data.lines
      }

      // Verifică și ajustează stocurile
      for (const line of lines) {
        const isOut =
          data.type === 'VANZARE'   ||
          data.type === 'DESEURI'   ||
          (data.type === 'TRANSFER'  && line.fromWarehouseId) ||
          (data.type === 'PRODUCTIE' && line.fromWarehouseId)

        const warehouseId = line.fromWarehouseId || line.toWarehouseId

        if (isOut && line.fromWarehouseId) {
          const stock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId:   line.productId,
                warehouseId: line.fromWarehouseId,
              },
            },
          })
          if (!stock || stock.quantity < line.quantity) {
            throw new Error(
              `Stoc insuficient pentru produsul ${line.productId} în hala ${line.fromWarehouseId}`
            )
          }
          await tx.stock.update({
            where: {
              productId_warehouseId: {
                productId:   line.productId,
                warehouseId: line.fromWarehouseId,
              },
            },
            data: { quantity: { decrement: line.quantity } },
          })
        }

        if (line.toWarehouseId) {
          await tx.stock.upsert({
            where: {
              productId_warehouseId: {
                productId:   line.productId,
                warehouseId: line.toWarehouseId,
              },
            },
            create: {
              productId:   line.productId,
              warehouseId: line.toWarehouseId,
              quantity:    line.quantity,
            },
            update: { quantity: { increment: line.quantity } },
          })
        }
      }

      // Creează mișcarea în DB
      return tx.movement.create({
        data: {
          type:   data.type,
          date:   data.date ? new Date(data.date) : new Date(),
          note:   data.note,
          userId,
          lines: {
            create: lines.map(l => ({
              productId:       l.productId,
              fromWarehouseId: l.fromWarehouseId ?? null,
              toWarehouseId:   l.toWarehouseId   ?? null,
              quantity:        l.quantity,
            })),
          },
        },
        include: {
          lines: true,
          user:  { select: { id: true, name: true } },
        },
      })
    })

    res.status(201).json(movement)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Eroare la înregistrarea mișcării' })
  }
})

// DELETE /movements/:id — doar ADMIN
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'ADMIN') {
    res.status(403).json({ error: 'Doar adminul poate șterge mișcări' })
    return
  }
  await prisma.movement.delete({ where: { id: req.params.id } })
  res.json({ success: true })
})

export default router