
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const DATA_FILE = path.resolve(currentDirectory, '../data/restaurants.json')

app.use(cors())
app.use(express.json({ limit: '1mb' }))

async function readRestaurants() {
  const contents = await readFile(DATA_FILE, 'utf8')
  return JSON.parse(contents)
}

async function writeRestaurants(restaurants) {
  await writeFile(DATA_FILE, JSON.stringify(restaurants, null, 2), 'utf8')
}

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Goa Eats',
    message: 'Backend is running.',
  })
})

app.get('/api/restaurants', async (_req, res) => {
  try {
    res.json(await readRestaurants())
  
  } catch (error) {
    console.error('Could not read restaurants:', error)
    res.status(500).json({
      error: 'Could not load restaurants.',
      details: error instanceof Error ? error.message : String(error),
    })
  }

})

app.post('/api/restaurants', async (req, res) => {
  const input = req.body

  if (!input || typeof input.name !== 'string' || !input.name.trim()) {
    return res.status(400).json({ error: 'Restaurant name is required.' })
  }

  const latitude = input.latitude ?? null
  const longitude = input.longitude ?? null

  if ((latitude === null) !== (longitude === null)) {
    return res.status(400).json({
      error: 'Latitude and longitude must both be provided or both be empty.',
    })
  }

  if (
    (latitude !== null &&
      (typeof latitude !== 'number' ||
        !Number.isFinite(latitude) ||
        latitude < -90 ||
        latitude > 90)) ||
    (longitude !== null &&
      (typeof longitude !== 'number' ||
        !Number.isFinite(longitude) ||
        longitude < -180 ||
        longitude > 180))
  ) {
    return res.status(400).json({ error: 'Invalid coordinates.' })
  }

  const textFields = ['address', 'locality', 'category', 'sourceUrl', 'notes']
  for (const field of textFields) {
    if (input[field] !== undefined && typeof input[field] !== 'string') {
      return res.status(400).json({ error: `${field} must be text.` })
    }
  }

  if (input.sourceUrl?.trim()) {
    try {
      const url = new URL(input.sourceUrl)
      if (!['http:', 'https:'].includes(url.protocol)) {
        return res.status(400).json({ error: 'Source URL must use HTTP or HTTPS.' })
      }
    } catch {
      return res.status(400).json({ error: 'Source URL must be a valid URL.' })
    }
  }

  try {
    const restaurants = await readRestaurants()

    const restaurant = {
      id: randomUUID(),
      name: input.name.trim(),
      latitude,
      longitude,
      address: input.address?.trim() || undefined,
      locality: input.locality?.trim() || undefined,
      category: input.category?.trim() || undefined,
      sourceUrl: input.sourceUrl?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      createdAt: new Date().toISOString(),
      verified: false,
    }

    restaurants.push(restaurant)
    await writeRestaurants(restaurants)

    res.status(201).json(restaurant)
  } catch (error) {
    console.error('Could not save restaurant:', error)
    res.status(500).json({ error: 'Could not save restaurant.' })
  }
})

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    const restaurants = await readRestaurants()
    const remaining = restaurants.filter((item) => item.id !== req.params.id)

    if (remaining.length === restaurants.length) {
      return res.status(404).json({ error: 'Restaurant not found.' })
    }

    await writeRestaurants(remaining)
    res.status(204).end()
  } catch (error) {
    console.error('Could not delete restaurant:', error)
    res.status(500).json({ error: 'Could not delete restaurant.' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Goa Eats API listening on port ${PORT}`)
})
