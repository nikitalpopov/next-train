import { Injectable, computed, effect, inject, signal } from '@angular/core'
import { toSignal } from '@angular/core/rxjs-interop'
import { _Throttle, _deepEquals } from '@naturalcycles/js-lib'
import { firstValueFrom, interval, startWith } from 'rxjs'
import type { Coordinates, GroupedDepartures } from '../interfaces/location.interface'
import type { SLDeparture, SLSite } from '../interfaces/trafiklab.interface'
import { calculateDistance, toggle } from '../lib/helper.lib'
import { TrafiklabService } from './trafiklab.service'

const REFRESH_INTERVAL = 60 * 1000 // 1 minute in milliseconds
const MAX_DISTANCE = 1000 // 1km in meters

@Injectable({
  providedIn: 'root',
})
export class LocationService {
  private trafiklabService = inject(TrafiklabService)

  public departures = signal<SLDeparture[]>([])
  public favoriteStops = signal<Set<string>>(new Set(), { equal: _deepEquals })

  private sortedDepartures = computed(() => {
    const departures = this.departures()
    return departures.sort((a, b) =>
      (a.expected ?? a.scheduled).localeCompare(b.expected ?? b.scheduled),
    )
  })

  public metroStops = signal<GroupedDepartures[]>([])
  public otherStops = signal<GroupedDepartures[]>([])

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

    effect(() => {
      const sortedDepartures = this.sortedDepartures()
      const favoriteStops = this.favoriteStops()

      this.metroStops.set(
        this.groupDepartures(
          sortedDepartures.filter(d => d.line.transport_mode === 'METRO'),
          favoriteStops,
        ),
      )
      this.otherStops.set(
        this.groupDepartures(
          sortedDepartures.filter(d => d.line.transport_mode !== 'METRO'),
          favoriteStops,
        ),
      )
    })

    // Watch position and update nearby departures every minute
    this.watchPosition()
  }

  public toggleFavoriteStop(departure: SLDeparture): void {
    const key = `${departure.stop_point.name}_${departure.stop_point.designation ?? ''}`
    this.favoriteStops.update(favorites => toggle(favorites, key))
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
      if (site.lat === undefined || site.lon === undefined) return false

      const distance = calculateDistance(position.lat, position.lon, site.lat, site.lon)
      return distance <= MAX_DISTANCE
    })
  }

  private groupDepartures(
    departures: SLDeparture[],
    favoriteStops: Set<string>,
  ): GroupedDepartures[] {
    const grouped = departures.reduce(
      (acc, departure) => {
        const key = `${departure.stop_point.name}_${departure.stop_point.designation ?? ''}`

        // Define unique stop
        if (!acc[key]) {
          acc[key] = {
            stopName: departure.stop_point.name ?? '',
            direction: departure.stop_point.designation ?? '',
            departures: [],
            favorite: favoriteStops.has(key),
          }
        }

        // Add unique departure
        if (!acc[key].departures.some(d => _deepEquals(d, departure))) {
          acc[key].departures.push(departure)
        }

        return acc
      },
      {} as Record<string, GroupedDepartures>,
    )

    return Object.entries(grouped)
      .sort(([keyA, valueA], [keyB, valueB]) => {
        // Sort by favorite status first (favorites on top)
        if (valueA.favorite && !valueB.favorite) return -1
        if (!valueA.favorite && valueB.favorite) return 1

        // Then sort alphabetically by key
        return keyA.localeCompare(keyB)
      })
      .map(([_, value]) => value)
  }
}
