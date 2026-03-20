import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter      from './routes/auth'
import productsRouter  from './routes/products'
import warehousesRouter from './routes/warehouses'
import stockRouter     from './routes/stock'
import movementsRouter from './routes/movements'
import usersRouter     from './routes/users'
import { errorHandler } from './middleware/errorHandler'
import statsRouter from './routes/stats'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth',       authRouter)
app.use('/products',   productsRouter)
app.use('/warehouses', warehousesRouter)
app.use('/stock',      stockRouter)
app.use('/movements',  movementsRouter)
app.use('/users',      usersRouter)
app.use('/stats', statsRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ FurniStock API pornit pe http://localhost:${PORT}`)
})