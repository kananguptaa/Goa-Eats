
export interface Restaurant {
  id: string
  name: string

  // Coordinates are null until the location is identified.
  latitude: number | null
  longitude: number | null

  address?: string
  locality?: string
  category?: string

  // Original social media recommendation.
  sourceUrl?: string
  notes?: string

  // ISO 8601 timestamp.
  createdAt: string

  // True only when the place's identity and location
  // have been checked.
  verified: boolean
}

export interface RestaurantInput {
  name: string
  latitude?: number | null
  longitude?: number | null
  address?: string
  locality?: string
  category?: string
  sourceUrl?: string
  notes?: string
}

export type RestaurantValidationResult =
  | { valid: true; errors: [] }
  | { valid: false; errors: string[] }
