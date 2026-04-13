import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  AppointmentResponse,
  AvailabilityResponse,
  AvailabilitySlotRequest,
  AvailabilityExceptionResponse,
  CreateAvailabilityExceptionRequest,
  ClientSummaryResponse,
  CreateClientRequest,
  CreateAppointmentRequest,
  CancelAppointmentRequest,
  ProfessionalDashboardResponse,
  ServiceTypeResponse,
  Page,
  Studio,
} from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class ProfessionalPortalService {
  private readonly baseUrl = `${environment.apiBaseUrl}/portal`;

  constructor(private readonly http: HttpClient) {}

  // ── Dashboard ──────────────────────────

  getDashboard(): Observable<ProfessionalDashboardResponse> {
    return this.http.get<ProfessionalDashboardResponse>(`${this.baseUrl}/dashboard`);
  }

  getStudio(): Observable<Studio> {
    return this.http.get<Studio>(`${this.baseUrl}/studio`);
  }

  // ── Appointments ──────────────────────────

  listAppointments(page = 0, size = 20, status?: string): Observable<Page<AppointmentResponse>> {
    let params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sort', 'startDatetime,desc');
    if (status) params = params.set('status', status);
    return this.http.get<Page<AppointmentResponse>>(`${this.baseUrl}/appointments`, { params });
  }

  getAppointment(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${this.baseUrl}/appointments/${id}`);
  }

  createAppointment(request: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments`, request);
  }

  confirmAppointment(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments/${id}/confirm`, {});
  }

  cancelAppointment(id: string, request?: CancelAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments/${id}/cancel`, request ?? {});
  }

  completeAppointment(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments/${id}/complete`, {});
  }

  noShowAppointment(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${this.baseUrl}/appointments/${id}/no-show`, {});
  }

  // ── Clients ──────────────────────────

  listClients(): Observable<ClientSummaryResponse[]> {
    return this.http.get<ClientSummaryResponse[]>(`${this.baseUrl}/clients`);
  }

  createClient(request: CreateClientRequest): Observable<ClientSummaryResponse> {
    return this.http.post<ClientSummaryResponse>(`${this.baseUrl}/clients`, request);
  }

  // ── Service Types ──────────────────────────

  listServiceTypes(): Observable<ServiceTypeResponse[]> {
    return this.http.get<ServiceTypeResponse[]>(`${this.baseUrl}/service-types`);
  }

  // ── Availability ──────────────────────────

  getAvailability(): Observable<AvailabilityResponse[]> {
    return this.http.get<AvailabilityResponse[]>(`${this.baseUrl}/availability`);
  }

  setAvailability(slots: AvailabilitySlotRequest[]): Observable<AvailabilityResponse[]> {
    return this.http.put<AvailabilityResponse[]>(`${this.baseUrl}/availability`, slots);
  }

  getExceptions(): Observable<AvailabilityExceptionResponse[]> {
    return this.http.get<AvailabilityExceptionResponse[]>(`${this.baseUrl}/exceptions`);
  }

  addException(request: CreateAvailabilityExceptionRequest): Observable<AvailabilityExceptionResponse> {
    return this.http.post<AvailabilityExceptionResponse>(`${this.baseUrl}/exceptions`, request);
  }

  removeException(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/exceptions/${id}`);
  }
}
