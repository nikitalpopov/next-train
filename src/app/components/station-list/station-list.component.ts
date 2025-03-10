import { CommonModule } from '@angular/common'
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  type OnInit,
  inject,
} from '@angular/core'
import { _deepEquals } from '@naturalcycles/js-lib'
import type { SLDeparture } from '../../interfaces/trafiklab.interface'
import { LocationService } from '../../services/location.service'
import { DepartureComponent } from '../departure/departure.component'

interface GroupedDepartures {
  stopName: string
  direction: string
  departures: SLDeparture[]
}

@Component({
  selector: 'app-station-list',
  templateUrl: './station-list.component.html',
  styleUrl: './station-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, DepartureComponent],
})
export class StationListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef)
  private locationService = inject(LocationService)

  loading = true
  error: string | null = null

  metroDepartures: GroupedDepartures[] = []
  otherDepartures: GroupedDepartures[] = []

  ngOnInit(): void {
    this.locationService.departures$.subscribe(departures => {
      const sortedDepartures = departures.sort((a, b) =>
        (a.expected ?? a.scheduled).localeCompare(b.expected ?? b.scheduled),
      )

      if (sortedDepartures.length > 0) this.loading = false

      this.metroDepartures = this.groupDepartures(
        sortedDepartures.filter(d => d.line.transport_mode === 'METRO'),
      )
      this.otherDepartures = this.groupDepartures(
        sortedDepartures.filter(d => d.line.transport_mode !== 'METRO'),
      )

      this.cdr.detectChanges()
    })
  }

  private groupDepartures(departures: SLDeparture[]): GroupedDepartures[] {
    const grouped = departures.reduce(
      (acc, departure) => {
        const key = `${departure.stop_point.name}_${departure.stop_point.designation ?? ''}`
        if (!acc[key]) {
          acc[key] = {
            stopName: departure.stop_point.name ?? '',
            direction: departure.stop_point.designation ?? '',
            departures: [],
          }
        }
        if (!acc[key].departures.some(d => _deepEquals(d, departure))) {
          acc[key].departures.push(departure)
        }
        return acc
      },
      {} as Record<string, GroupedDepartures>,
    )

    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([_, value]) => value)
  }
}
