import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  AppointmentResponse,
  CreateAppointmentRequest,
  UpdateAppointmentRequest,
  ProposeNewTimeRequest,
  CancelAppointmentRequest,
  Page,
} from '../models/domain.model';

const BASE = `${environment.apiBaseUrl}/appointments`;

@Injectable({ providedIn: 'root' })
export class AppointmentService {
  constructor(private readonly http: HttpClient) {}

  list(page = 0, size = 20, status?: string, professionalId?: string, startDate?: string, endDate?: string): Observable<Page<AppointmentResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    if (professionalId) params = params.set('professionalId', professionalId);
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);
    return this.http.get<Page<AppointmentResponse>>(BASE, { params });
  }

  getById(id: string): Observable<AppointmentResponse> {
    return this.http.get<AppointmentResponse>(`${BASE}/${id}`);
  }

  create(payload: CreateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(BASE, payload);
  }

  update(id: string, payload: UpdateAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.put<AppointmentResponse>(`${BASE}/${id}`, payload);
  }

  confirm(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/confirm`, {});
  }

  cancel(id: string, payload?: CancelAppointmentRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/cancel`, payload ?? {});
  }

  complete(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/complete`, {});
  }

  noShow(id: string): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/no-show`, {});
  }

  proposeNewTime(id: string, payload: ProposeNewTimeRequest): Observable<AppointmentResponse> {
    return this.http.post<AppointmentResponse>(`${BASE}/${id}/propose-new-time`, payload);
  }
}
