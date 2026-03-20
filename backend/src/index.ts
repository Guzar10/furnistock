import express    from 'express'
import http       from 'http'
import cors       from 'cors'
import dotenv     from 'dotenv'
import authRouter       from './routes/auth'
import productsRouter   from './routes/products'
import warehousesRouter from './routes/warehouses'
import stockRouter      from './routes/stock'
import movementsRouter  from './routes/movements'
import usersRouter      from './routes/users'
import statsRouter      from './routes/stats'
import { errorHandler }                               from './middleware/errorHandler'
import { helmetMiddleware, globalLimiter, sanitizeInput } from './middleware/security'
import { requestLogger }                              from './middleware/logger'
import { initSocket }                                 from './lib/socket'

dotenv.config()

const app        = express()
const httpServer = http.createServer(app)
const PORT       = process.env.PORT || 3001

// ── Securitate ──
app.use(helmetMiddleware)
app.use(cors({
  origin:      process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods:     ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(globalLimiter)
app.use(express.json({ limit: '1mb' }))
app.use(sanitizeInput)
app.use(requestLogger)
app.set('trust proxy', 1)

// ── Socket.io ──
initSocket(httpServer)

// ── Routes ──
app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth',       authRouter)
app.use('/products',   productsRouter)
app.use('/warehouses', warehousesRouter)
app.use('/stock',      stockRouter)
app.use('/movements',  movementsRouter)
app.use('/users',      usersRouter)
app.use('/stats',      statsRouter)

app.use(errorHandler)

// ── Pornire server ──
httpServer.listen(PORT, () => {
  console.log(`✅ FurniStock API pornit pe http://localhost:${PORT}`)
  console.log(`🔒 Mod: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔌 Socket.io activ`)
})