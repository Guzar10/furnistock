import { Router, Response } from 'express'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { sendNotification } from '../lib/socket'
import { authGuard, AuthRequest } from '../middleware/auth'

const router = Router()
router.use(authGuard)

const LineSchema = z.object({
  productId:       z.string(),
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
    type:  z.literal('VANZARE'),
    date:  z.string().optional(),
    note:  z.string().optional(),
    lines: z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
  }),
  z.object({
    type:  z.literal('DESEURI'),
    date:  z.string().optional(),
    note:  z.string().optional(),
    lines: z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
  }),
  z.object({
    type:  z.literal('TRANSFER'),
    date:  z.string().optional(),
    note:  z.string().optional(),
    lines: z.array(LineSchema.extend({
      fromWarehouseId: z.string(),
      toWarehouseId:   z.string(),
    })).min(1),
  }),
  z.object({
    type:     z.literal('PRODUCTIE'),
    date:     z.string().optional(),
    note:     z.string().optional(),
    consumed: z.array(LineSchema.extend({ fromWarehouseId: z.string() })).min(1),
    produced: z.array(LineSchema.extend({ toWarehouseId:   z.string() })).min(1),
  }),
  z.object({
    type:  z.literal('INVENTARIERE'),
    date:  z.string().optional(),
    note:  z.string().optional(),
    lines: z.array(z.object({
      productId:       z.string(),
      toWarehouseId:   z.string(),
      quantityActuala: z.number().min(0),
    })).min(1),
  }),
])

// GET /movements
router.get('/', async (req, res: Response) => {
  const { type, limit = '100', dateFrom, dateTo } = req.query
  try {
    const movements = await prisma.movement.findMany({
      where: {
        ...(type ? { type: String(type) as any } : {}),
        ...(dateFrom || dateTo ? {
          date: {
            ...(dateFrom ? { gte: new Date(String(dateFrom)) } : {}),
            ...(dateTo   ? { lte: new Date(new Date(String(dateTo)).setHours(23, 59, 59, 999)) } : {}),
          }
        } : {}),
      },
      include: {
        user:  { select: { id: true, name: true } },
        lines: {
          include: {
            product: { select: { id: true, name: true, unit: true } }
          }
        },
      },
      orderBy: { date: 'desc' },
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

  const data   = parsed.data
  const userId = req.user!.userId

  try {
    const movement = await prisma.$transaction(async (tx) => {
      let lines: any[] = []

      if (data.type === 'PRODUCTIE') {
        lines = [
          ...data.consumed.map(l => ({ ...l })),
          ...data.produced.map(l => ({ ...l })),
        ]
      } else if (data.type === 'INVENTARIERE') {
        const invLines = []
        for (const line of data.lines) {
          const stocCurent = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId:   line.productId,
                warehouseId: line.toWarehouseId,
              },
            },
          })
          const cantCurenta = stocCurent?.quantity || 0
          const cantActuala = line.quantityActuala
          const diferenta   = cantActuala - cantCurenta

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
              quantity:    cantActuala,
            },
            update: { quantity: cantActuala },
          })

          invLines.push({
            productId:       line.productId,
            toWarehouseId:   line.toWarehouseId,
            fromWarehouseId: null,
            quantity:        Math.abs(diferenta) || 0,
          })
        }

        return tx.movement.create({
          data: {
            type:   data.type,
            date:   data.date ? new Date(data.date) : new Date(),
            note:   data.note,
            userId,
            lines:  { create: invLines },
          },
          include: {
            lines: true,
            user:  { select: { id: true, name: true } },
          },
        })
      } else {
        lines = (data as any).lines
      }

      if (data.type !== 'INVENTARIERE') {
        for (const line of lines) {
          const isOut =
            data.type === 'VANZARE'   ||
            data.type === 'DESEURI'   ||
            (data.type === 'TRANSFER'  && line.fromWarehouseId) ||
            (data.type === 'PRODUCTIE' && line.fromWarehouseId)

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
      }
    })

    // ── Notificări ──
    const userRecord = await prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true },
    })
    const userName = userRecord?.name || 'Cineva'

    if (data.type === 'TRANSFER') {
      const transferLines = (data as any).lines || []
      for (const line of transferLines) {
        const product = await prisma.product.findUnique({ where: { id: line.productId },       select: { name: true } })
        const fromWh  = await prisma.warehouse.findUnique({ where: { id: line.fromWarehouseId }, select: { name: true } })
        const toWh    = await prisma.warehouse.findUnique({ where: { id: line.toWarehouseId },   select: { name: true } })
        sendNotification('admins_managers', {
          type:    'transfer',
          title:   '🔄 Transfer de stoc',
          message: `${userName} a transferat ${line.quantity} ${product?.name || ''} din ${fromWh?.name || '?'} spre ${toWh?.name || '?'}`,
          data:    { movementId: movement?.id },
        })
      }
    } else {
      sendNotification('admins_managers', {
        type:    'movement',
        title:   `📦 Mișcare nouă — ${data.type}`,
        message: `${userName} a înregistrat o mișcare de tip ${data.type.toLowerCase()}`,
        data:    { movementId: movement?.id },
      })
    }

    // ── Verifică stoc scăzut ──
    const allLines = data.type === 'PRODUCTIE'
      ? [...(data as any).consumed, ...(data as any).produced]
      : (data as any).lines || []

    for (const line of allLines) {
      const product = await prisma.product.findUnique({
        where:   { id: line.productId },
        include: { stock: true },
      })
      if (!product || product.minStock <= 0) continue

      const totalStock = product.stock.reduce((s, st) => s + st.quantity, 0)
      if (totalStock < product.minStock) {
        sendNotification('all', {
          type:    'low_stock',
          title:   '⚠️ Stoc scăzut',
          message: `${product.name} a scăzut sub minimul de ${product.minStock} ${product.unit.toLowerCase()} (curent: ${totalStock})`,
          data:    { productId: product.id },
        })
      }
    }

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