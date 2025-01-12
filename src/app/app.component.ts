import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { CurrentLocationComponent } from './components/current-location/current-location.component'
import { StationListComponent } from './components/station-list/station-list.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, CurrentLocationComponent, StationListComponent],
})
export class AppComponent {
  title = '🚉 nästa tåg'

  public readonly mapboxToken = import.meta.env.NG_APP_MAPBOX_TOKEN
}
