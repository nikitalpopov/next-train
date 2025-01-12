import { ChangeDetectionStrategy, ChangeDetectorRef, Component, type OnInit, inject } from '@angular/core'
import type { SLDeparture } from '../../interfaces/trafiklab.interface'
import { LocationService } from '../../services/location.service'

@Component({
  selector: 'app-station-list',
  templateUrl: './station-list.component.html',
  styleUrl: './station-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StationListComponent implements OnInit {
  private cdr = inject(ChangeDetectorRef)
  private locationService = inject(LocationService)

  loading = true
  error: string | null = null

  metroDepartures: SLDeparture[] = []
  otherDepartures: SLDeparture[] = []

  ngOnInit(): void {
    this.locationService.departures$.subscribe(departures => {
      const sortedDepartures = departures.sort((a, b) => (a.expected ?? a.scheduled).localeCompare((b.expected ?? b.scheduled)))
      console.warn('Fresh departures:', sortedDepartures)

      if (sortedDepartures.length > 0) this.loading = false

      this.metroDepartures = sortedDepartures.filter(d => d.line.transport_mode === 'METRO')
      this.otherDepartures = sortedDepartures.filter(d => d.line.transport_mode !== 'METRO')
      this.cdr.detectChanges()
    })
  }
}
