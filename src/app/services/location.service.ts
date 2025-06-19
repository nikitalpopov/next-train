import { Injectable, effect, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { _Throttle, _deepEquals } from '@naturalcycles/js-lib'
import { firstValueFrom, interval, startWith } from 'rxjs'
import type { SLDeparture, SLSite } from '../interfaces/trafiklab.interface'
import { TrafiklabService } from './trafiklab.service'

export interface Coordinates {
  lat: number
  lon: number
}

const REFRESH_INTERVAL = 60 * 1000 // 1 minute in milliseconds
const MAX_DISTANCE = 1000 // 1km in meters

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private trafiklabService = inject(TrafiklabService)

  public departures = signal<SLDeparture[]>([])
  public currentPosition = signal<Coordinates | null>(null, { equal: _deepEquals })
  private sites = signal<SLSite[]>([])

  private interval = toSignal(interval(REFRESH_INTERVAL).pipe(startWith(-1)))

  constructor() {
    // Setup departures polling
    effect(() => {
      const sites = this.sites()
      const currentPosition = this.currentPosition()
      this.interval()

      if (!sites.length) return
      if (!currentPosition?.lat || !currentPosition?.lon) return

      this.fetchNearbyDepartures(currentPosition)
    })

    effect(() => {
      const sites = this.trafiklabService.sites.value()
      if (!sites) return
      this.sites.set(sites)
    })

    // Watch position and update nearby departures every minute
    this.watchPosition()
  }

  private watchPosition(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.watchPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords

        this.currentPosition.set({ lat, lon })
      },
      error => {
        console.error('Error getting location:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    )
  }

  @_Throttle(REFRESH_INTERVAL)
  private async fetchNearbyDepartures(position: Coordinates): Promise<void> {
    const nearbySites = this.findNearbySites(position)

    const departures = await Promise.all(
      nearbySites.map(site =>
        firstValueFrom(this.trafiklabService.getSiteDepartures(site.id, { forecast: 30 })),
      ),
    )

    this.departures.set(departures.flatMap(d => d.departures || []))
  }

  private findNearbySites(position: Coordinates): SLSite[] {
    return this.sites().filter(site => {
      if (site.lat === undefined || site.lon === undefined) {
        return false
      }
      const distance = this.calculateDistance(position.lat, position.lon, site.lat, site.lon)
      return distance <= MAX_DISTANCE
    })
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
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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
}
