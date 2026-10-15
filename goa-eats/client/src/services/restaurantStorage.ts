
import type { Restaurant, RestaurantInput } from '../types/restaurant'
import { validateRestaurant } from '../utils/restaurantValidation'

const DB_NAME = 'goa-eats-db'
const DB_VERSION = 1
const STORE_NAME = 'restaurants'


function createRestaurantId(): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return crypto.randomUUID()
  }

  return `restaurant-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: 'id',
        })

        store.createIndex('name', 'name', { unique: false })
        store.createIndex('createdAt', 'createdAt', {
          unique: false,
        })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () =>
      reject(request.error ?? new Error('Could not open database.'))

    request.onblocked = () => {
      reject(new Error('Database upgrade is blocked by another open tab.'))
    }
  })
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDatabase().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode)
        const request = operation(transaction.objectStore(STORE_NAME))

        request.onsuccess = () => resolve(request.result)
        request.onerror = () =>
          reject(request.error ?? new Error('Database request failed.'))

        transaction.onabort = () => {
          db.close()
          reject(transaction.error ?? new Error('Database transaction aborted.'))
        }

        transaction.oncomplete = () => db.close()
        transaction.onerror = () => {
          db.close()
          reject(transaction.error ?? new Error('Database transaction failed.'))
        }
      }),
  )
}

export async function getAllRestaurants(): Promise<Restaurant[]> {
  const restaurants = await runTransaction<Restaurant[]>(
    'readonly',
    (store) => store.getAll(),
  )

  return restaurants.sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  )
}

export async function getRestaurantById(
  id: string,
): Promise<Restaurant | undefined> {
  return runTransaction<Restaurant | undefined>(
    'readonly',
    (store) => store.get(id),
  )
}

export async function saveRestaurant(
  input: RestaurantInput,
): Promise<Restaurant> {
  const validation = validateRestaurant(input)

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '))
  }

  const restaurant: Restaurant = {
    id: createRestaurantId(),
    name: input.name.trim(),
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    address: input.address?.trim() || undefined,
    locality: input.locality?.trim() || undefined,
    category: input.category?.trim() || undefined,
    sourceUrl: input.sourceUrl?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    createdAt: new Date().toISOString(),
    verified: false,
  }

  await runTransaction<IDBValidKey>('readwrite', (store) =>
    store.add(restaurant),
  )

  return restaurant
}

export async function updateRestaurant(
  restaurant: Restaurant,
): Promise<Restaurant> {
  const validation = validateRestaurant(restaurant)

  if (!validation.valid) {
    throw new Error(validation.errors.join(' '))
  }

  await runTransaction<IDBValidKey>('readwrite', (store) =>
    store.put(restaurant),
  )

  return restaurant
}

export async function deleteRestaurant(id: string): Promise<void> {
  await runTransaction<undefined>('readwrite', (store) =>
    store.delete(id),
  )
}

