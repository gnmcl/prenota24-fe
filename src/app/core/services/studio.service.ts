import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CreateStudioRequest, Studio, UUID } from '../models/domain.model';

const STUDIOS_PATH = `${environment.apiBaseUrl}/studios`;

@Injectable({ providedIn: 'root' })
export class StudioService {
  constructor(private readonly http: HttpClient) {}

  createStudio(payload: CreateStudioRequest): Observable<Studio> {
    return this.http.post<Studio>(STUDIOS_PATH, payload);
  }

  getStudio(id: UUID): Observable<Studio> {
    return this.http.get<Studio>(`${STUDIOS_PATH}/${id}`);
  }
}
