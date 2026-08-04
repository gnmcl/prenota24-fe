import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  StudioPublicResponse,
  ServiceTypeResponse,
  TimeSlotResponse,
  AppointmentResponse,
  PublicBookingRequest,
  AcceptProposalRequest,
  UUID,
} from '../models/domain.model';

const BASE = `${environment.apiBaseUrl}/public/book`;
const APPOINTMENTS_BASE = `${environment.apiBaseUrl}/public/appointments`;

@Injectable({ providedIn: 'root' })
export class PublicBookingService {
  private readonly http = inject(HttpClient);

  getStudio(slug: string): Observable<StudioPublicResponse> {
    return this.http.get<StudioPublicResponse>(`${BASE}/${slug}`);
  }

  getServices(slug: string): Observable<ServiceTypeResponse[]> {
    return this.http.get<ServiceTypeResponse[]>(`${BASE}/${slug}/services`);
  }

  getSlots(
    studioSlug: string,
    profId: UUID,
    date: string,
    serviceTypeId?: UUID,
  ): Observable<TimeSlotResponse[]> {
    const params: Record<string, string> = { date };
    if (serviceTypeId) params['serviceTypeId'] = serviceTypeId;
    return this.http.get<TimeSlotResponse[]>(
      `${BASE}/${studioSlug}/professionals/${profId}/slots`,
      { params },
    );
  }

  createAppointment(slug: string, request: PublicBookingRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${slug}/appointments`, request);
  }

  getAppointmentByToken(token: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${APPOINTMENTS_BASE}/${token}`);
  }

  acceptProposedTime(token: string, payload: AcceptProposalRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${APPOINTMENTS_BASE}/${token}/accept`, payload);
  }

  rejectProposedTime(token: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${APPOINTMENTS_BASE}/${token}/reject`, {});
  }
}
