import { Component } from '@angular/core'
import { AuthComponent } from './components/auth/auth.component'
import { CurrentLocationComponent } from './components/current-location/current-location.component'
import { StationListComponent } from './components/station-list/station-list.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [AuthComponent, CurrentLocationComponent, StationListComponent],
})
export class AppComponent {
  title = '🚉 nästa tåg'

  public readonly mapboxToken = import.meta.env.NG_APP_MAPBOX_TOKEN
}
