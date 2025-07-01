import { SLDeparture } from './trafiklab.interface'

export interface Coordinates {
  lat: number
  lon: number
}

export interface GroupedDepartures {
  stopName: string
  direction: string
  departures: SLDeparture[]
  favorite: boolean
}
