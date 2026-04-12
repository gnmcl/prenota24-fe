import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type {
  ServiceTypeResponse,
  CreateServiceTypeRequest,
} from '../models/domain.model';

const BASE = `${environment.apiBaseUrl}/service-types`;

@Injectable({ providedIn: 'root' })
export class ServiceTypeService {
  constructor(private readonly http: HttpClient) {}

  list(): Observable<ServiceTypeResponse[]> {
    return this.http.get<ServiceTypeResponse[]>(BASE);
  }

  getById(id: string): Observable<ServiceTypeResponse> {
    return this.http.get<ServiceTypeResponse>(`${BASE}/${id}`);
  }

  create(payload: CreateServiceTypeRequest): Observable<ServiceTypeResponse> {
    return this.http.post<ServiceTypeResponse>(BASE, payload);
  }

  update(id: string, payload: Partial<CreateServiceTypeRequest>): Observable<ServiceTypeResponse> {
    return this.http.put<ServiceTypeResponse>(`${BASE}/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${BASE}/${id}`);
  }
}
