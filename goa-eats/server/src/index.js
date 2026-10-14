import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Goa Eats',
    message: 'Backend is running.',
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Goa Eats API listening on port ${PORT}`)
})
