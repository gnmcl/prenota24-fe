import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type { Observable } from 'rxjs';
import type {
  ConversationResponse, MessageResponse, Page, SendMessageRequest,
  MarkConversationReadRequest, UpdateConversationConsentRequest,
} from '../models/domain.model';
import { environment } from '../../environments/environment';

const BASE = `${environment.apiBaseUrl}/conversations`;

@Injectable({ providedIn: 'root' })
export class ConversationService {
  private readonly http = inject(HttpClient);

  list(page = 0): Observable<Page<ConversationResponse>> {
    const params = new HttpParams().set('page', page).set('size', 20);
    return this.http.get<Page<ConversationResponse>>(BASE, { params });
  }

  get(id: string): Observable<ConversationResponse> {
    return this.http.get<ConversationResponse>(`${BASE}/${id}`);
  }

  openForAppointment(id: string): Observable<ConversationResponse> {
    return this.http.post<ConversationResponse>(`${environment.apiBaseUrl}/appointments/${id}/conversation`, {});
  }

  messages(id: string, page = 0): Observable<Page<MessageResponse>> {
    const params = new HttpParams().set('page', page).set('size', 50);
    return this.http.get<Page<MessageResponse>>(`${BASE}/${id}/messages`, { params });
  }

  send(id: string, request: SendMessageRequest): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${BASE}/${id}/messages`, request);
  }

  markRead(id: string, messageId: string): Observable<void> {
    const request: MarkConversationReadRequest = { messageId };
    return this.http.post<void>(`${BASE}/${id}/read`, request);
  }

  setConsent(id: string, enabled: boolean): Observable<ConversationResponse> {
    const request: UpdateConversationConsentRequest = { enabled };
    return this.http.post<ConversationResponse>(`${BASE}/${id}/consent`, request);
  }
}
