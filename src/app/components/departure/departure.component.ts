import { CommonModule } from '@angular/common'
import { Component, input } from '@angular/core'
import type { SLDeparture } from '../../interfaces/trafiklab.interface'
import { TransportEmojiPipe } from '../../pipes/transport-emoji.pipe'

@Component({
  selector: 'app-departure',
  templateUrl: './departure.component.html',
  styleUrl: './departure.component.scss',
  imports: [CommonModule, TransportEmojiPipe],
})
export class DepartureComponent {
  public departure = input.required<SLDeparture>()
}
