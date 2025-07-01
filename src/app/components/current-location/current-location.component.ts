import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  type OnDestroy,
  effect,
  inject,
  viewChild,
} from '@angular/core'
import * as mapbox from 'mapbox-gl'
import type { Coordinates } from '../../interfaces/location.interface'
import { LocationService } from '../../services/location.service'

@Component({
  selector: 'app-current-location',
  templateUrl: './current-location.component.html',
  styleUrl: './current-location.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class CurrentLocationComponent implements OnDestroy {
  private mapElement = viewChild<ElementRef>('map')

  private locationService = inject(LocationService)

  private map?: mapbox.Map
  private marker?: mapbox.Marker

  protected readonly mapboxToken = import.meta.env.NG_APP_MAPBOX_TOKEN

  protected currentPosition = this.locationService.currentPosition

  constructor() {
    // Wait for initial position before initializing map
    const initEffect = effect(() => {
      const mapElement = this.mapElement()
      const currentPosition = this.currentPosition()

      if (!mapElement) return

      if (!this.mapboxToken) {
        console.error('Mapbox token is not set')
        return
      }

      if (!currentPosition) return

      this.initializeMap(currentPosition)
      initEffect.destroy()
    })

    // Subscribe to position updates
    effect(() => {
      const currentPosition = this.currentPosition()
      if (!currentPosition) return

      this.updatePosition(currentPosition)
    })
  }

  private initializeMap(position: Coordinates): void {
    mapbox.default.accessToken = this.mapboxToken

    this.map = new mapbox.Map({
      container: this.mapElement()?.nativeElement,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [position.lon, position.lat],
      zoom: 15,
    })

    // Add marker after map is loaded
    this.map.on('load', () => {
      if (!this.map) return

      this.marker = new mapbox.Marker({
        color: 'crimson',
        scale: 0.8,
      })
        .setLngLat([position.lon, position.lat])
        .addTo(this.map)
    })
  }

  private updatePosition(position: Coordinates): void {
    if (!this.map || !this.marker) return

    // Update marker position
    this.marker.setLngLat([position.lon, position.lat])

    // Smoothly animate to new position
    this.map.easeTo({
      center: [position.lon, position.lat],
      duration: 1000,
    })
  }

  ngOnDestroy(): void {
    this.map?.remove()
  }
}
