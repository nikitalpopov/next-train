import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  Component,
  type ElementRef,
  type OnDestroy,
  ViewChild,
  inject,
} from '@angular/core'
import * as mapbox from 'mapbox-gl'
import { filter, take } from 'rxjs'
import { type Coordinates, LocationService } from '../../services/location.service'

@Component({
  selector: 'app-current-location',
  templateUrl: './current-location.component.html',
  styleUrl: './current-location.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class CurrentLocationComponent implements OnDestroy {
  @ViewChild('map') mapElement?: ElementRef

  private locationService = inject(LocationService)
  private map?: mapbox.Map
  private marker?: mapbox.Marker

  public readonly mapboxToken = import.meta.env.NG_APP_MAPBOX_TOKEN

  public currentPosition$ = this.locationService.currentPosition$.pipe(filter(Boolean))

  ngAfterViewInit(): void {
    if (!this.mapElement) return
    console.log(import.meta.env)
    if (!this.mapboxToken) {
      console.error('Mapbox token is not set')
      return
    }

    mapbox.default.accessToken = this.mapboxToken

    // Wait for initial position before initializing map
    this.currentPosition$.pipe(take(1)).subscribe(position => {
      this.initializeMap(position)
    })

    // Subscribe to position updates
    this.currentPosition$.subscribe(position => {
      this.updatePosition(position)
    })
  }

  private initializeMap(position: Coordinates): void {
    if (!this.mapElement) return

    this.map = new mapbox.Map({
      container: this.mapElement.nativeElement,
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
