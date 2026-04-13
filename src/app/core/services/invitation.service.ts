import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { InvitationResponse, CreateInvitationRequest } from '../models/domain.model';
import type { InvitationInfo } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private readonly baseUrl = `${environment.apiBaseUrl}/invitations`;
  private readonly publicUrl = `${environment.apiBaseUrl}/public/invitations`;

  constructor(private readonly http: HttpClient) {}

  /** Create an invitation (admin only) */
  create(request: CreateInvitationRequest): Observable<InvitationResponse> {
    return this.http.post<InvitationResponse>(this.baseUrl, request);
  }

  /** List all invitations for the current studio (admin only) */
  list(): Observable<InvitationResponse[]> {
    return this.http.get<InvitationResponse[]>(this.baseUrl);
  }

  /** Revoke a pending invitation (admin only) */
  revoke(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** Get invitation info by token (public) */
  getByToken(token: string): Observable<InvitationInfo> {
    return this.http.get<InvitationInfo>(`${this.publicUrl}/${token}`);
  }
}
