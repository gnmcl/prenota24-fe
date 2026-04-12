import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ClientResponse,
  ClientSummaryResponse,
  CreateClientRequest,
  UpdateClientRequest,
  ClientNoteResponse,
  CreateClientNoteRequest,
  AppointmentResponse,
  Page,
} from '../models/domain.model';

const BASE = `${environment.apiBaseUrl}/clients`;

@Injectable({ providedIn: 'root' })
export class ClientService {
  constructor(private readonly http: HttpClient) {}

  list(search?: string, page = 0, size = 20): Observable<Page<ClientSummaryResponse>> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (search?.trim()) {
      params = params.set('search', search.trim());
    }
    return this.http.get<Page<ClientSummaryResponse>>(BASE, { params });
  }

  getById(id: string): Observable<ClientResponse> {
    return this.http.get<ClientResponse>(`${BASE}/${id}`);
  }

  create(payload: CreateClientRequest): Observable<ClientResponse> {
    return this.http.post<ClientResponse>(BASE, payload);
  }

  update(id: string, payload: UpdateClientRequest): Observable<ClientResponse> {
    return this.http.put<ClientResponse>(`${BASE}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }

  getNotes(clientId: string): Observable<ClientNoteResponse[]> {
    return this.http.get<ClientNoteResponse[]>(`${BASE}/${clientId}/notes`);
  }

  addNote(clientId: string, payload: CreateClientNoteRequest): Observable<ClientNoteResponse> {
    return this.http.post<ClientNoteResponse>(`${BASE}/${clientId}/notes`, payload);
  }

  togglePin(clientId: string, noteId: string): Observable<ClientNoteResponse> {
    return this.http.patch<ClientNoteResponse>(`${BASE}/${clientId}/notes/${noteId}/pin`, {});
  }

  deleteNote(clientId: string, noteId: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${clientId}/notes/${noteId}`);
  }

  getAppointments(clientId: string): Observable<AppointmentResponse[]> {
    return this.http.get<AppointmentResponse[]>(`${BASE}/${clientId}/appointments`);
  }
}
