import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { CreateStudioRequest, EditStudioRequest, Studio, UUID } from '../models/domain.model';

const STUDIOS_PATH = `${environment.apiBaseUrl}/studios`;

@Injectable({ providedIn: 'root' })
export class StudioService {
  private readonly _studio = signal<Studio | null>(null);
  readonly studio = this._studio.asReadonly();

  constructor(private readonly http: HttpClient) {}

  clear(): void {
    this._studio.set(null);
  }

  createStudio(payload: CreateStudioRequest): Observable<Studio> {
    return this.http.post<Studio>(STUDIOS_PATH, payload);
  }

  editStudio(payload: EditStudioRequest): Observable<Studio> {
    return this.http.patch<Studio>(STUDIOS_PATH, payload).pipe(
      tap(updated => this._studio.set(updated)),
    );
  }

  getMyStudio(id: UUID): Observable<Studio> {
    return this.http.get<Studio>(`${STUDIOS_PATH}/${id}`).pipe(
      tap(studio => this._studio.set(studio)),
    );
  }
}
