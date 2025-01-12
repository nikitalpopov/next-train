/* Types */

export type SLStockholmTime = string

export type SLUnidentifiedDirection = 0
export type SLForwardDirection = 1
export type SLBackwardDirection = 2
export type SLLineDirectionCode = SLUnidentifiedDirection | SLForwardDirection | SLBackwardDirection

export type SLStopAreaType = 'BUSTERM' | 'METROSTN' | 'TRAMSTN' | 'RAILWSTN' | 'SHIPBER' | 'FERRYBER' | 'AIRPORT' | 'TAXITERM' | 'UNKNOWN'
export type SLStopPointType = 'PLATFORM' | 'BUSSTOP' | 'ENTRANCE' | 'EXIT' | 'GATE' | 'REFUGE' | 'PIER' | 'TRACK' | 'UNKNOWN'
export type SLDepartureState = 'NOTEXPECTED' | 'NOTCALLED' | 'EXPECTED' | 'CANCELLED' | 'INHIBITED' | 'ATSTOP' | 'BOARDING' | 'BOARDINGCLOSED' | 'DEPARTED' | 'PASSED' | 'MISSED' | 'REPLACED' | 'ASSUMEDDEPARTED'
export type SLJourneyState = 'NOTEXPECTED' | 'NOTRUN' | 'EXPECTED' | 'ASSIGNED' | 'CANCELLED' | 'SIGNEDON' | 'ATORIGIN' | 'FASTPROGRESS' | 'NORMALPROGRESS' | 'SLOWPROGRESS' | 'NOPROGRESS' | 'OFFROUTE' | 'ABORTED' | 'COMPLETED' | 'ASSUMEDCOMPLETED'
export type SLJourneyPredictState = 'NORMAL' | 'LOSTCONTACT' | 'UNRELIABLE'
export type SLJourneyPassengerLevel = 'EMPTY' | 'SEATSAVAILABLE' | 'STANDINGPASSENGERS' | 'PASSENGERSLEFTBEHIND' | 'UNKNOWN'
export type SLTransportMode = 'BUS' | 'TRAM' | 'METRO' | 'TRAIN' | 'FERRY' | 'SHIP' | 'TAXI'

/* References */

export interface SLLineReference {
  id: number
  designation?: string
  transport_mode?: SLTransportMode
  group_of_lines?: string[]
}

export interface SLStopAreaReference {
  id: number
  name: string
  sname?: string
  type?: SLStopAreaType
}

export interface SLStopPointReference {
  id: number
  name?: string
  designation?: string
}

export interface SLTransportAuthorityReference {
  id: number
  name: string
}

export interface SLContractorReference {
  id: number
  name: string
}

/* Models */

export interface SLValidityPeriod {
  from: SLStockholmTime
  to?: SLStockholmTime
}

export interface SLSite {
  id: number
  gid: number
  lat?: number
  lon?: number
  name: string
  alias?: string
  abbreviation?: string
  note?: string
  stop_areas?: number[]
  valid: SLValidityPeriod
}

export interface SLStopPoint extends SLStopPointReference {
  gid: number
  pattern_point_gid: number
  lat?: number
  lon?: number
  sname?: string
  /** Angle in degrees */
  door_orientation?: number
  has_entrance: boolean
  local_num: number
  stop_area?: SLStopAreaReference
  transport_authority: SLTransportAuthorityReference
  type: SLStopPointType
  valid: SLValidityPeriod
}

export interface SLTransportAuthority extends SLTransportAuthorityReference {
  gid: number
  formal_name?: string
  code: string
  street?: string
  postal_code?: string
  city?: string
  country?: string
  valid: SLValidityPeriod
}

export interface SLDepartureJourney {
  id: number
  state: SLJourneyState
  prediction_state?: SLJourneyPredictState
  passenger_level?: SLJourneyPassengerLevel
}

export interface SLDepartureDeviation {
  importance_level: number
  consequence: string
  message: string
}

export interface SLDeparture {
  direction: string
  direction_code: SLLineDirectionCode
  via?: string
  destination?: string
  state: SLDepartureState
  scheduled: SLStockholmTime
  expected?: SLStockholmTime
  display: string
  journey: SLDepartureJourney
  stop_area: SLStopAreaReference
  stop_point: SLStopPointReference
  line: SLLineReference
  deviations: SLDepartureDeviation[]
}

// FIXME
export interface SLDeviationScope {
  lines: unknown[]
  stop_areas: unknown[]
  stop_points: unknown[]
}

export interface SLStopDeviation {
  id: number
  importance_level?: number
  message: string
  scope: SLDeviationScope
}

export interface SLLine extends SLLineReference {
  gid: number
  name: string
  transport_authority?: SLTransportAuthorityReference
  contractor?: SLContractorReference
  valid: SLValidityPeriod
}

/* Responses */

export interface SLLineResponse {
  metro: SLLine[]
  tram: SLLine[]
  train: SLLine[]
  bus: SLLine[]
  ship: SLLine[]
  ferry: SLLine[]
  taxi: SLLine[]
}

export interface SLSiteDeparturesResponse {
  departures?: SLDeparture[]
  stop_deviations: SLStopDeviation[]
}

export type SLSitesResponse = SLSite[]

export type SLStopPointsResponse = SLStopPoint[]

export type SLTransportAuthoritiesResponse = SLTransportAuthority[]
