
import type {
  RestaurantInput,
  RestaurantValidationResult,
} from '../types/restaurant'

export function validateRestaurant(
  input: RestaurantInput,
): RestaurantValidationResult {
  const errors: string[] = []

  // Restaurant name
  if (typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('Restaurant name is required.')
  }

  // Coordinates must be supplied together.
  const latitude = input.latitude
  const longitude = input.longitude

  if ((latitude == null) !== (longitude == null)) {
    errors.push(
      'Latitude and longitude must both be provided or both be empty.',
    )
  }

  if (latitude != null) {
    if (
      typeof latitude !== 'number' ||
      !Number.isFinite(latitude) ||
      latitude < -90 ||
      latitude > 90
    ) {
      errors.push('Latitude must be a number between -90 and 90.')
    }
  }

  if (longitude != null) {
    if (
      typeof longitude !== 'number' ||
      !Number.isFinite(longitude) ||
      longitude < -180 ||
      longitude > 180
    ) {
      errors.push('Longitude must be a number between -180 and 180.')
    }
  }

  // Optional text fields
  const optionalTextFields = [
    ['address', input.address],
    ['locality', input.locality],
    ['category', input.category],
    ['notes', input.notes],
  ] as const

  for (const [field, value] of optionalTextFields) {
    if (value !== undefined && typeof value !== 'string') {
      errors.push(`${field} must be text.`)
    }
  }

  // Optional source URL
  if (input.sourceUrl !== undefined && input.sourceUrl.trim()) {
    try {
      const url = new URL(input.sourceUrl)

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        errors.push('Source URL must use HTTP or HTTPS.')
      }
    } catch {
      errors.push('Source URL must be a valid URL.')
    }
  }

  return errors.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors }
}
