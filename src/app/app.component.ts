import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { StationListComponent } from './components/station-list/station-list.component'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  imports: [CommonModule, StationListComponent],
})
export class AppComponent {
  title = 'nästa tåg'
}
