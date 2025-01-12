import { Pipe, type PipeTransform } from '@angular/core'
import type { SLTransportMode } from '../interfaces/trafiklab.interface'

const TRANSPORT_EMOJIS: Record<SLTransportMode, string> = {
  METRO: '🚇',
  BUS: '🚌',
  TRAIN: '🚆',
  TRAM: '🚋',
  SHIP: '⛴️',
  FERRY: '🛥️',
  TAXI: '🚕',
}

@Pipe({
  name: 'transportEmoji',
})
export class TransportEmojiPipe implements PipeTransform {
  transform(mode: SLTransportMode | undefined): string {
    if (!mode) return '❓'
    return TRANSPORT_EMOJIS[mode] ?? '❓'
  }
}
