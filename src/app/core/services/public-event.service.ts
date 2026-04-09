import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  EventResponse,
  CreateReservationRequest,
  ReservationResponse,
} from '../models/domain.model';

const PUBLIC_PATH = `${environment.apiBaseUrl}/public/events`;

@Injectable({ providedIn: 'root' })
export class PublicEventService {
  constructor(private readonly http: HttpClient) {}

  getPublicEvent(slug: string): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${PUBLIC_PATH}/${slug}`);
  }

  createReservation(slug: string, payload: CreateReservationRequest): Observable<ReservationResponse> {
    return this.http.post<ReservationResponse>(`${PUBLIC_PATH}/${slug}/reservations`, payload);
  }
}
