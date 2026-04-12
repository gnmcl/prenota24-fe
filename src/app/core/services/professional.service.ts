import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ProfessionalResponse,
  CreateProfessionalRequest,
  UpdateProfessionalRequest,
  AvailabilityResponse,
  AvailabilitySlotRequest,
  AvailabilityExceptionResponse,
  CreateAvailabilityExceptionRequest,
  TimeSlotResponse,
} from '../models/domain.model';

const BASE = `${environment.apiBaseUrl}/professionals`;

@Injectable({ providedIn: 'root' })
export class ProfessionalService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ProfessionalResponse[]> {
    return this.http.get<ProfessionalResponse[]>(BASE);
  }

  getById(id: string): Observable<ProfessionalResponse> {
    return this.http.get<ProfessionalResponse>(`${BASE}/${id}`);
  }

  create(payload: CreateProfessionalRequest): Observable<ProfessionalResponse> {
    return this.http.post<ProfessionalResponse>(BASE, payload);
  }

  update(id: string, payload: UpdateProfessionalRequest): Observable<ProfessionalResponse> {
    return this.http.put<ProfessionalResponse>(`${BASE}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  getAvailability(profId: string): Observable<AvailabilityResponse[]> {
    return this.http.get<AvailabilityResponse[]>(`${BASE}/${profId}/availability`);
  }

  setAvailability(profId: string, slots: AvailabilitySlotRequest[]): Observable<AvailabilityResponse[]> {
    return this.http.put<AvailabilityResponse[]>(`${BASE}/${profId}/availability`, slots);
  }

  getExceptions(profId: string): Observable<AvailabilityExceptionResponse[]> {
    return this.http.get<AvailabilityExceptionResponse[]>(`${BASE}/${profId}/exceptions`);
  }

  addException(profId: string, payload: CreateAvailabilityExceptionRequest): Observable<AvailabilityExceptionResponse> {
    return this.http.post<AvailabilityExceptionResponse>(`${BASE}/${profId}/exceptions`, payload);
  }

  removeException(profId: string, exceptionId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${profId}/exceptions/${exceptionId}`);
  }

  getAvailableSlots(profId: string, date: string, durationMinutes: number): Observable<TimeSlotResponse[]> {
    const params = new HttpParams().set('date', date).set('durationMinutes', durationMinutes);
    return this.http.get<TimeSlotResponse[]>(`${BASE}/${profId}/slots`, { params });
  }
}
