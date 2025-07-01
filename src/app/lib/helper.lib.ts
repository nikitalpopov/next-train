/**
 * Toggles value in a set. Immutable.
 * @returns a new set with the value toggled.
 */
export function toggle<T>(set: Set<T>, value: T): Set<T> {
  const result = new Set(set)

  if (result.has(value)) {
    result.delete(value)
  } else {
    result.add(value)
  }

  return result
}

/**
 * Calculates the great-circle distance between two points on Earth using the Haversine formula
 * @param lat1 - Latitude of the first point in decimal degrees
 * @param lon1 - Longitude of the first point in decimal degrees
 * @param lat2 - Latitude of the second point in decimal degrees
 * @param lon2 - Longitude of the second point in decimal degrees
 * @returns Distance between the points in meters
 * @see https://en.wikipedia.org/wiki/Haversine_formula
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
