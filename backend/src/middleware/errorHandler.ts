import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log complet doar în server, nu în răspuns
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message)

  // Erori Prisma — nu expune structura DB
  if (err.message.includes('prisma') || err.message.includes('Unique constraint')) {
    res.status(400).json({ error: 'Operațiune invalidă — verifică datele introduse' })
    return
  }

  // Nu expune stack trace în producție
  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Eroare internă de server',
  })
}