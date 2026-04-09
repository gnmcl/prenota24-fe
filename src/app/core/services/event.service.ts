import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  CreateEventRequest,
  EventResponse,
  EventSummaryResponse,
  ReservationResponse,
} from '../models/domain.model';

const EVENTS_PATH = `${environment.apiBaseUrl}/events`;

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private readonly http: HttpClient) {}

  createEvent(payload: CreateEventRequest): Observable<EventResponse> {
    return this.http.post<EventResponse>(EVENTS_PATH, payload);
  }

  getMyEvents(): Observable<EventSummaryResponse[]> {
    return this.http.get<EventSummaryResponse[]>(EVENTS_PATH);
  }

  getEventById(id: string): Observable<EventResponse> {
    return this.http.get<EventResponse>(`${EVENTS_PATH}/${id}`);
  }

  updateEventStatus(id: string, status: string): Observable<EventResponse> {
    return this.http.patch<EventResponse>(`${EVENTS_PATH}/${id}/status`, { status });
  }

  getEventReservations(eventId: string): Observable<ReservationResponse[]> {
    return this.http.get<ReservationResponse[]>(`${EVENTS_PATH}/${eventId}/reservations`);
  }

  cancelReservation(reservationId: string): Observable<ReservationResponse> {
    return this.http.patch<ReservationResponse>(
      `${EVENTS_PATH}/reservations/${reservationId}/cancel`,
      {},
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${EVENTS_PATH}/${id}`);
  }
}
