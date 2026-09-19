import '@angular/compiler';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { Injector, runInInjectionContext } from '@angular/core';
import { Subject, of } from 'rxjs';
import { MessageThreadComponent } from '../src/app/features/messages/message-thread.component';
import { ConversationService } from '../src/app/core/services/conversation.service';
import { StudioService } from '../src/app/core/services/studio.service';
import type { ConversationResponse, MessageResponse, Page, SendMessageRequest } from '../src/app/core/models/domain.model';

const chat: ConversationResponse = {
  id: 'chat-1', clientId: 'client-1', clientName: 'Cliente test', clientPhone: '+393330000000',
  lastMessagePreview: null, lastMessageAt: null, unreadCount: 0, whatsappConfigured: true,
  whatsappOptIn: true, canSendText: true, canSendTemplate: true, sendBlockedReason: null,
  serviceWindowExpiresAt: '2099-01-01T00:00:00Z',
};

function harness() {
  const sendResult = new Subject<MessageResponse>();
  const getResult = new Subject<ConversationResponse>();
  const historyResult = new Subject<Page<MessageResponse>>();
  const requests: SendMessageRequest[] = [];
  const service = {
    send: (_id: string, request: SendMessageRequest) => { requests.push(request); return sendResult; },
    get: () => getResult,
    messages: () => historyResult,
    setConsent: (_id: string, enabled: boolean) => of({ ...chat, whatsappOptIn: enabled, canSendText: enabled }),
  };
  const injector = Injector.create({ providers: [
    { provide: ConversationService, useValue: service },
    { provide: StudioService, useValue: { studio: () => null } },
  ] });
  const component = runInInjectionContext(injector, () => new MessageThreadComponent());
  component.conversation.set(chat);
  return { component, injector, sendResult, requests, getResult, historyResult };
}

test('a double submit while HTTP is pending creates only one send request', () => {
  const h = harness();
  try {
    h.component.draft = 'Un solo messaggio';
    h.component.send('TEXT');
    h.component.send('TEXT');
    assert.equal(h.requests.length, 1);
    assert.equal(h.requests[0].text, 'Un solo messaggio');
    assert.equal(h.component.sending(), true);
  } finally { h.injector.destroy(); }
});

test('an expired window prevents an outgoing request even with stale server permission', () => {
  const h = harness();
  try {
    h.component.conversation.set({ ...chat, serviceWindowExpiresAt: '2000-01-01T00:00:00Z' });
    h.component.draft = 'Messaggio fuori finestra';
    h.component.send('TEXT');
    assert.equal(h.requests.length, 0);
    assert.equal(h.component.draft, 'Messaggio fuori finestra');
  } finally { h.injector.destroy(); }
});

test('a response from a poll started before consent revocation cannot restore consent', () => {
  const h = harness();
  try {
    h.component.refresh();
    h.component.setConsent(false);
    h.getResult.next(chat);
    h.getResult.complete();
    h.historyResult.next({ content: [], page: { size: 50, number: 0, totalElements: 0, totalPages: 0 } });
    h.historyResult.complete();
    assert.equal(h.component.conversation()?.whatsappOptIn, false);
    assert.equal(h.component.canWrite(), false);
  } finally { h.injector.destroy(); }
});

test('destroying a chat cancels late send results so they cannot mutate the old view', () => {
  const h = harness();
  h.component.draft = 'In attesa';
  h.component.send('TEXT');
  h.injector.destroy();
  h.sendResult.next({id:'message', sequenceNo:1,conversationId:chat.id,text:'In attesa',direction:'OUTBOUND',kind:'TEXT',status:'QUEUED',createdAt:'2026-09-19T10:00:00Z',appointmentId:null,senderName:'Operatore',errorMessage:null});
  assert.equal(h.component.messages().length, 0);
  assert.equal(h.component.draft, 'In attesa');
});
