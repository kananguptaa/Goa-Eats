
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { extractUrl, normalizeLink } from './links.js'

const app = express()
const PORT = Number(process.env.PORT) || 3001

const currentFile = fileURLToPath(import.meta.url)
const currentDirectory = path.dirname(currentFile)
const DATA_FILE = path.resolve(currentDirectory, '../data/restaurants.json')
const LINKS_FILE = path.resolve(currentDirectory, '../data/links.json')

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Reads a JSON array file. A missing file is treated as an empty list.
async function readJsonFile(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'))
  } catch (error) {
    if (error?.code === 'ENOENT') return []
    throw error
  }
}

// Writes to a temporary file first, then renames it over the real one,
// so a crash mid-write never leaves a half-written JSON file.
async function writeJsonFile(file, data) {
  await mkdir(path.dirname(file), { recursive: true })
  const tempFile = `${file}.${randomUUID()}.tmp`
  await writeFile(tempFile, JSON.stringify(data, null, 2), 'utf8')
  await rename(tempFile, file)
}

// All read-modify-write operations run one at a time, so two requests
// arriving together cannot overwrite each other's changes.
let writeQueue = Promise.resolve()

function updateJsonFile(file, update) {
  const task = writeQueue.then(async () => {
    const updated = await update(await readJsonFile(file))
    await writeJsonFile(file, updated)
  })
  writeQueue = task.catch(() => {})
  return task
}

function readRestaurants() {
  return readJsonFile(DATA_FILE)
}

function updateRestaurants(update) {
  return updateJsonFile(DATA_FILE, update)
}

function readLinks() {
  return readJsonFile(LINKS_FILE)
}

function updateLinks(update) {
  return updateJsonFile(LINKS_FILE, update)
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

    await updateRestaurants((restaurants) => [...restaurants, restaurant])

    res.status(201).json(restaurant)
  } catch (error) {
    console.error('Could not save restaurant:', error)
    res.status(500).json({ error: 'Could not save restaurant.' })
  }
})

app.delete('/api/restaurants/:id', async (req, res) => {
  try {
    let found = false

    await updateRestaurants((restaurants) => {
      const remaining = restaurants.filter((item) => item.id !== req.params.id)
      found = remaining.length !== restaurants.length
      return remaining
    })

    if (!found) {
      return res.status(404).json({ error: 'Restaurant not found.' })
    }

    res.status(204).end()
  } catch (error) {
    console.error('Could not delete restaurant:', error)
    res.status(500).json({ error: 'Could not delete restaurant.' })
  }
})

app.get('/api/links', async (_req, res) => {
  try {
    const links = await readLinks()
    links.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    res.json(links)
  } catch (error) {
    console.error('Could not read links:', error)
    res.status(500).json({ error: 'Could not load links.' })
  }
})

app.post('/api/links', async (req, res) => {
  const input = req.body ?? {}
  const rawUrl = extractUrl(input.url)

  if (!rawUrl) {
    return res.status(400).json({ error: 'Please provide a valid http or https link.' })
  }

  const normalized = normalizeLink(rawUrl)
  if (!normalized) {
    return res.status(400).json({ error: 'Please provide a valid http or https link.' })
  }

  if (input.note !== undefined && typeof input.note !== 'string') {
    return res.status(400).json({ error: 'note must be text.' })
  }

  const note = input.note?.trim().slice(0, 1000) || undefined

  try {
    let link
    let duplicate = false

    // The duplicate check runs inside the queue so two devices sharing
    // the same link at the same moment still produce a single record.
    await updateLinks((links) => {
      const existing = links.find((item) => item.url === normalized.url)

      if (existing) {
        link = existing
        duplicate = true
        return links
      }

      link = {
        id: randomUUID(),
        url: normalized.url,
        platform: normalized.platform,
        status: 'new',
        note,
        createdAt: new Date().toISOString(),
      }
      return [...links, link]
    })

    res.status(duplicate ? 200 : 201).json({ ...link, duplicate })
  } catch (error) {
    console.error('Could not save link:', error)
    res.status(500).json({ error: 'Could not save link.' })
  }
})

app.delete('/api/links/:id', async (req, res) => {
  try {
    let found = false

    await updateLinks((links) => {
      const remaining = links.filter((item) => item.id !== req.params.id)
      found = remaining.length !== links.length
      return remaining
    })

    if (!found) {
      return res.status(404).json({ error: 'Link not found.' })
    }

    res.status(204).end()
  } catch (error) {
    console.error('Could not delete link:', error)
    res.status(500).json({ error: 'Could not delete link.' })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Goa Eats API listening on port ${PORT}`)
})
