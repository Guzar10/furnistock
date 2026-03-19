import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRouter from './routes/auth'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors({ origin: 'http://localhost:5173', credentials: true }))
app.use(express.json())

app.get('/health', (_, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth', authRouter)

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ FurniStock API pornit pe http://localhost:${PORT}`)
})