import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
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
  imports: [DepartureComponent],
})
export class StationListComponent {
  private locationService = inject(LocationService)

  private sortedDepartures = computed(() => {
    const departures = this.locationService.departures()
    return departures.sort((a, b) =>
      (a.expected ?? a.scheduled).localeCompare(b.expected ?? b.scheduled),
    )
  })

  protected loading = computed(() => this.locationService.departures().length === 0)

  protected metroDepartures = computed(() => {
    const sortedDepartures = this.sortedDepartures()
    return this.groupDepartures(sortedDepartures.filter(d => d.line.transport_mode === 'METRO'))
  })

  protected otherDepartures = computed(() => {
    const sortedDepartures = this.sortedDepartures()
    return this.groupDepartures(sortedDepartures.filter(d => d.line.transport_mode !== 'METRO'))
  })

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
