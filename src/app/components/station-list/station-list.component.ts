import { CommonModule } from '@angular/common'
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import type { GroupedDepartures } from '../../interfaces/location.interface'
import { LocationService } from '../../services/location.service'
import { DepartureComponent } from '../departure/departure.component'
import { AuthComponent } from '../auth/auth.component'

@Component({
  selector: 'app-station-list',
  templateUrl: './station-list.component.html',
  styleUrl: './station-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AuthComponent, DepartureComponent],
})
export class StationListComponent {
  private locationService = inject(LocationService)

  protected loading = computed(() => this.locationService.departures().length === 0)

  protected metroStops = this.locationService.metroStops
  protected otherStops = this.locationService.otherStops

  protected toggleFavoriteStop(group: GroupedDepartures): void {
    this.locationService.toggleFavoriteStop(group.departures[0])
  }
}
