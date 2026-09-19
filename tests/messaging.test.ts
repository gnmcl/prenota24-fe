import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeMessages, latestIncomingMessage, canSendFreeText, SendAttempt } from '../src/app/features/messages/message-state.ts';
import type { MessageResponse } from '../src/app/core/models/domain.model.ts';

function message(id: string, createdAt: string, status: MessageResponse['status'] = 'RECEIVED'): MessageResponse {
  return { id, sequenceNo: Date.parse(createdAt), createdAt, status, conversationId: 'chat', text: id, direction: 'INBOUND', kind: 'TEXT', appointmentId: null, senderName: null, errorMessage: null };
}

test('overlapping history pages keep each message once and update delivery status', () => {
  const old = message('first', '2026-09-19T08:00:00Z', 'ACCEPTED');
  const next = message('second', '2026-09-19T09:00:00Z');
  const result = mergeMessages([old, next], [{ ...old, status: 'READ' }]);
  assert.deepEqual(result.map(item => [item.id, item.status]), [['first', 'READ'], ['second', 'RECEIVED']]);
});

test('a delayed page cannot downgrade an already read outgoing message', () => {
  const item = { ...message('one', '2026-09-19T08:00:00Z', 'READ'), direction: 'OUTBOUND' as const };
  assert.equal(mergeMessages([item], [{ ...item, status: 'ACCEPTED' }])[0].status, 'READ');
});

test('read cursor uses newest incoming message, ignoring a later outgoing message', () => {
  const incoming = message('incoming', '2026-09-19T08:00:00Z');
  const outgoing = { ...message('outgoing', '2026-09-19T09:00:00Z'), direction: 'OUTBOUND' as const };
  assert.equal(latestIncomingMessage([outgoing, incoming])?.id, 'incoming');
  assert.equal(latestIncomingMessage([outgoing]), null);
});

test('a provider failure after acceptance is visible and stale acceptance cannot hide it', () => {
  const accepted = { ...message('one', '2026-09-19T08:00:00Z', 'ACCEPTED'), direction: 'OUTBOUND' as const };
  const failed = { ...accepted, status: 'FAILED' as const, errorMessage: 'Recipient unavailable' };
  assert.equal(mergeMessages([accepted], [failed])[0].status, 'FAILED');
  assert.equal(mergeMessages([failed], [accepted])[0].status, 'FAILED');
  assert.equal(mergeMessages([{ ...accepted, status: 'DELIVERED' }], [failed])[0].status, 'DELIVERED');
});

test('timestamps with optional fractional seconds remain in chronological order', () => {
  const first = message('first', '2026-09-19T08:00:00Z');
  const second = message('second', '2026-09-19T08:00:00.123Z');
  assert.deepEqual(mergeMessages([], [second, first]).map(item => item.id), ['first', 'second']);
});

test('a late webhook is ordered by server sequence and advances the read cursor', () => {
  const prior = { ...message('prior', '2026-09-19T10:00:00Z'), sequenceNo: 20 };
  const late = { ...message('late', '2026-09-19T09:00:00Z'), sequenceNo: 21 };
  assert.deepEqual(mergeMessages([prior], [late]).map(item => item.id), ['prior', 'late']);
  assert.equal(latestIncomingMessage([late, prior])?.id, 'late');
});

test('free text is disabled at expiry even before the next server refresh', () => {
  assert.equal(canSendFreeText(true, '2026-09-19T09:00:00Z', Date.parse('2026-09-19T09:00:00Z')), false);
  assert.equal(canSendFreeText(true, '2026-09-19T09:00:00Z', Date.parse('2026-09-19T08:59:59Z')), true);
  assert.equal(canSendFreeText(false, '2026-09-19T09:00:00Z', 0), false);
  assert.equal(canSendFreeText(true, null, 0), false);
});

test('uncertain send retry reuses request ID but editing content starts a different request', () => {
  const attempt = new SendAttempt();
  const first = attempt.forPayload('chat', 'TEXT', 'Buongiorno', 'appointment');
  assert.equal(attempt.forPayload('chat', 'TEXT', 'Buongiorno', 'appointment'), first);
  assert.notEqual(attempt.forPayload('other-chat', 'TEXT', 'Buongiorno', 'appointment'), first);
  const second = attempt.forPayload('chat', 'TEXT', 'Buongiorno!', 'appointment');
  assert.notEqual(second, first);
  attempt.clear();
  assert.notEqual(attempt.forPayload('chat', 'TEXT', 'Buongiorno!', 'appointment'), second);
});
