import { Injectable, inject } from '@angular/core'
import { BehaviorSubject, Subject, combineLatestWith, distinctUntilChanged, filter, firstValueFrom, interval, startWith, switchMap, takeUntil, throttleTime } from 'rxjs'
import type { SLDeparture, SLSite } from '../interfaces/trafiklab.interface'
import { TrafiklabService } from './trafiklab.service'

interface Coordinates {
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

  public departures$ = new BehaviorSubject<SLDeparture[]>([])
  private sites$ = new BehaviorSubject<SLSite[]>([])
  private sitesLoaded$ = new Subject<void>()
  private currentPosition$ = new Subject<Coordinates>()

  private interval$ = interval(REFRESH_INTERVAL).pipe(startWith(0))

  constructor() {
    // Cache all sites
    this.interval$.pipe(
      switchMap(() => this.trafiklabService.getSites()),
      takeUntil(this.sitesLoaded$.asObservable()),
    ).subscribe({
      next: (sites) => {
        if (!sites.length) return

        this.sites$.next(sites)
        this.sitesLoaded$.next()
      },
      error: (error) => {
        console.error('Failed to fetch sites:', error)
      },
    })

    // Watch position and update nearby departures every minute
    this.watchPosition()
    this.setupDeparturesPolling()
  }

  private watchPosition(): void {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.watchPosition(
      ({ coords }) => {
        const { latitude: lat, longitude: lon } = coords
        this.currentPosition$.next({ lat, lon })
      },
      (error) => {
        console.error('Error getting location:', error)
      },
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      },
    )
  }

  private async setupDeparturesPolling(): Promise<void> {
    this.sites$.pipe(
      combineLatestWith(
        this.currentPosition$.pipe(distinctUntilChanged((a, b) => a.lat === b.lat && a.lon === b.lon)),
        this.interval$
      ),
      filter(([sites, position, _interval]) => sites.length > 0 && !!position.lat && !!position.lon),
      throttleTime(REFRESH_INTERVAL),
    ).subscribe(([_sites, position, _interval]) => {
      this.fetchNearbyDepartures(position)
    })
  }

  private async fetchNearbyDepartures(position: Coordinates): Promise<void> {
    const nearbySites = this.findNearbySites(position)

    const departures = await Promise.all(nearbySites.map(site => firstValueFrom(this.trafiklabService.getSiteDepartures(site.id, { forecast: 30 }))))
    this.departures$.next(departures.flatMap(d => d.departures || []))
  }

  private findNearbySites(position: Coordinates): SLSite[] {
    return this.sites$.value.filter((site) => {
      if (site.lat === undefined || site.lon === undefined) {
        return false
      }
      const distance = this.calculateDistance(
        position.lat,
        position.lon,
        site.lat,
        site.lon,
      )
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
