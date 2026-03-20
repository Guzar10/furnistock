import { Request, Response, NextFunction } from 'express'
import { prisma } from '../lib/prisma'
import { AuthRequest } from './auth'

// Jurnal acțiuni critice în consolă + DB
export const auditLog = (action: string) =>
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res)
    res.json = (body: any) => {
      if (res.statusCode < 400) {
        const msg = `[AUDIT] ${new Date().toISOString()} | ${action} | user:${req.user?.userId || 'anon'} | IP:${req.ip} | ${req.method} ${req.path}`
        console.log(msg)
      }
      return originalJson(body)
    }
    next()
  }

// Log erori detaliat
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    if (res.statusCode >= 400) {
      console.warn(`[${res.statusCode}] ${req.method} ${req.path} — ${duration}ms | IP: ${req.ip}`)
    }
  })
  next()
}