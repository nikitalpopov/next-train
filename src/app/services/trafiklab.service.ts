import { HttpClient, type HttpParams } from '@angular/common/http'
import { Injectable, inject } from '@angular/core'
import { _filterNullishValues } from '@naturalcycles/js-lib'
import type { Observable } from 'rxjs'
import type { SLLineDirectionCode, SLLineResponse, SLSiteDeparturesResponse, SLSitesResponse, SLStopPointsResponse, SLTransportAuthoritiesResponse, SLTransportMode } from '../interfaces/trafiklab.interface'

export interface SiteDeparturesRequestParams {
  transport?: SLTransportMode
  direction?: SLLineDirectionCode
  line?: number
  /**
   * Defines the window of time, in minutes, for which to fetch upcoming departures and deviations starting from now.
   * A value of 30 means departures and deviations for the next 30 minutes will be included.
   * Note that there will not be shown more than 3 departures for a line direction, even if the forecast window is larger.
   * @default 60
   */
  forecast?: number
}

@Injectable({
  providedIn: 'root',
})
export class TrafiklabService {
  private readonly apiUrl = '/trafiklabApi'

  /**
   * Documentation: https://www.trafiklab.se/api/trafiklab-apis/sl/transport/
   */
  private readonly slTransportLines = `${this.apiUrl}/lines`
  private readonly slTransportSites = `${this.apiUrl}/sites`
  private readonly slTransportStopPoints = `${this.apiUrl}/stop-points`
  private readonly slTransportAuthorities = `${this.apiUrl}/transport-authorities`

  private http = inject(HttpClient)

  /**
   * List all lines within Region Stockholm
   */
  getLines(transportAuthorityId = 1): Observable<SLLineResponse> {
    return this.http.get<SLLineResponse>(this.slTransportLines, {
      params: {
        'transport_authority_id': transportAuthorityId,
      }
    })
  }

  /**
   * List all sites within Region Stockholm
   */
  getSites(): Observable<SLSitesResponse> {
    return this.http.get<SLSitesResponse>(this.slTransportSites, { params: { expand: true } })
  }

  /**
   * Get upcoming departures and deviations starting from time of the request (a maximum of 3 departures for each line & direction)
   * @param siteId - Unique identification number for the location for which current departures should be fetched, e.g., 9192 for Slussen. Can be obtained from a search through the list of all sites, or the SL stop lookup api.
   */
  getSiteDepartures(siteId: number, input: SiteDeparturesRequestParams = {}): Observable<SLSiteDeparturesResponse> {
    const params = _filterNullishValues(input) as HttpParams
    return this.http.get<SLSiteDeparturesResponse>(`${this.slTransportSites}/${siteId}/departures`, { params })
  }

  /**
   * List all stop-points within Region Stockholm
   */
  getStopPoints(): Observable<SLStopPointsResponse> {
    return this.http.get<SLStopPointsResponse>(this.slTransportStopPoints)
  }

  /**
   * List all transport-authorities within Region Stockholm
   */
  getTransportAuthorities(): Observable<SLTransportAuthoritiesResponse> {
    return this.http.get<SLTransportAuthoritiesResponse>(this.slTransportAuthorities)
  }
}
