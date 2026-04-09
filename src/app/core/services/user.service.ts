import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { AppUser, CreateAppUserRequest, UUID } from '../models/domain.model';

const USERS_PATH = `${environment.apiBaseUrl}/users`;

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private readonly http: HttpClient) {}

  createAppUser(payload: CreateAppUserRequest): Observable<AppUser> {
    return this.http.post<AppUser>(USERS_PATH, payload);
  }

  getAppUser(id: UUID): Observable<AppUser> {
    return this.http.get<AppUser>(`${USERS_PATH}/${id}`);
  }
}
