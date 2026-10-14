export interface Restaurant {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  address?: string
  locality?: string
  category?: string
  sourceUrl?: string
  notes?: string
  createdAt: string
  verified: boolean
}
