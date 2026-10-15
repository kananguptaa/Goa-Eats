
import type { Restaurant, RestaurantInput } from '../types/restaurant'

const API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:3001/api`

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `Request failed (${response.status}).`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`)
    return response.ok
  } catch {
    return false
  }
}

export function getSharedRestaurants(): Promise<Restaurant[]> {
  return request<Restaurant[]>('/restaurants')
}

export function createSharedRestaurant(
  input: RestaurantInput,
): Promise<Restaurant> {
  return request<Restaurant>('/restaurants', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function deleteSharedRestaurant(id: string): Promise<void> {
  return request<void>(`/restaurants/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })
}
