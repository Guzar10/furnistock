import rateLimit from 'express-rate-limit'
import helmet    from 'helmet'
import { Request, Response, NextFunction } from 'express'

// Helmet — header-e HTTP de securitate
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
})

// Rate limit global — 200 req/15min per IP
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe cereri. Încearcă din nou în 15 minute.' },
})

// Rate limit strict pentru login — 10 încercări/15min per IP
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Prea multe încercări de autentificare. Încearcă din nou în 15 minute.' },
  skipSuccessfulRequests: true,
})

// Sanitizare input — elimină caractere periculoase
export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  const sanitize = (value: any): any => {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim()
    }
    if (typeof value === 'object' && value !== null) {
      for (const key of Object.keys(value)) {
        value[key] = sanitize(value[key])
      }
    }
    return value
  }

  // Body — poate fi înlocuit direct
  if (req.body) req.body = sanitize(req.body)

  // Params — poate fi înlocuit direct
  if (req.params) {
    for (const key of Object.keys(req.params)) {
      req.params[key] = sanitize(req.params[key])
    }
  }

  // Query — read-only, sanitizăm valorile individual
  if (req.query) {
    for (const key of Object.keys(req.query)) {
      const val = req.query[key]
      if (typeof val === 'string') {
        (req.query as any)[key] = sanitize(val)
      }
    }
  }

  next()
}