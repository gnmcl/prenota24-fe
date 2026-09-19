# Messaging V1 Implementation Plan

**Goal:** deliver an admin inbox and appointment entry point backed by durable studio/client conversations and official WhatsApp text/template messaging.
**Architecture:** existing Spring Boot/PostgreSQL backend, Angular standalone UI. No new hosted services. Secrets stay in environment. Polling updates, durable database dispatch and signed incoming webhook. Work on codex/messaging-v1 in both existing repositories, preserving pre-existing working changes.
**Scope:** admin only; one configured pilot studio/WhatsApp number per deployment in V1, isolated by studio ID. No patient login, attachments, professional-wide access, assignment workflow or automatic clinical processing. Conversation is unique per studio/client. Unknown/ambiguous senders are not linked to patient history. No live messages during development.

## Shared HTTP contract

All endpoints except signed Meta webhook require ADMIN and derive studio/user from AuthHelper.

- GET /api/conversations?page=0&size=20: Page<ConversationResponse>, ordered last activity descending.
- GET /api/conversations/{id}: ConversationResponse.
- POST /api/appointments/{id}/conversation: ConversationResponse (get/create, concurrency safe).
- GET /api/conversations/{id}/messages?page=0&size=50: Page<MessageResponse>, newest first (UI reverses for display).
- POST /api/conversations/{id}/messages: SendMessageRequest -> MessageResponse, persists QUEUED before dispatch.
- POST /api/conversations/{id}/read: {messageId:string} -> 204; monotonic per-user read position, only up to actually displayed incoming message.
- POST /api/conversations/{id}/consent: {enabled:boolean} -> ConversationResponse, audited opt-in/opt-out.
- GET/POST /api/webhooks/whatsapp: challenge / signed payload; disabled unless configured.

ConversationResponse fields (nullable values are explicit JSON null): id:string, clientId:string, clientName:string, clientPhone:string|null, lastMessagePreview:string|null, lastMessageAt:string|null, unreadCount:number, whatsappConfigured:boolean, whatsappOptIn:boolean, canSendText:boolean, canSendTemplate:boolean, sendBlockedReason:string|null, serviceWindowExpiresAt:string|null.

MessageResponse: id:string, sequenceNo:number, conversationId:string, text:string, direction:'INBOUND'|'OUTBOUND', kind:'TEXT'|'TEMPLATE'|'UNSUPPORTED', status:'RECEIVED'|'QUEUED'|'SENDING'|'ACCEPTED'|'DELIVERED'|'READ'|'FAILED'|'UNKNOWN', createdAt:string, appointmentId:string|null, senderName:string|null, errorMessage:string|null.

SendMessageRequest: text?:string, appointmentId?:string, requestId:string(UUID), kind:'TEXT'|'TEMPLATE'. Template uses configured approved parameterless template name/language; do not interpolate arbitrary text. Idempotency same request/same payload returns original; changed payload rejects conflict. Validate related appointment same client/studio. Explicit opt-in required for outgoing. Text requires last inbound within 24h both at enqueue and dispatch.

## Tasks

- [x] Backend: Flyway schema, services/repositories/DTOs/admin APIs, outbox worker, HTTP gateway, signed webhook with deduplication and status ordering, configuration documentation. Tests cover tenancy, idempotency, window, consent, signature, duplicate webhook and uncertain dispatch. Run Java 25 Maven suite.
- [x] Frontend: central types, ConversationService, responsive inbox and detail, pagination/history, polling without races, truthful delivery states, consent and template action, appointment context and sidebar. Preserve pre-existing UI changes. Build and focused behavior tests.
- [x] Integration: check exact DTO parity and error behavior, review feature diff for cross-tenant leaks and lost/duplicate messages, run builds/tests, document configuration and remaining external activation.

## Review focus

1. Shared phone numbers cannot silently merge patient histories.
2. Request IDs and webhook delivery duplicates cannot create duplicate sends/messages.
3. Changing selected chat while polling/sending cannot show or send data in another chat.
4. Disabled WhatsApp cannot look like successful delivery; an expired service window blocks free text.
5. Timestamp/read/status updates are monotonic; a late callback cannot downgrade READ to ACCEPTED.

## Progress

Design approved in conversation; user explicitly requested implementation. No additional approval round for reversible local implementation. Backend and frontend are separate repositories with existing uncommitted work; work retained on feature branches without committing unrelated changes.

### Final verification

- Angular production build and 12 frontend behavior tests pass. Desktop and 390px mobile exercised with synthetic local fixtures, including outgoing queued state and disabled configuration. Design detector returned no findings.
- Java 25 Maven suite: 20 tests pass, including five integration tests against a dedicated PostgreSQL 17 database and real local HTTP. All 15 Flyway migrations applied; Hibernate validation passed.
- Integration coverage includes signed inbound commit, webhook deduplication, late arrival/read cursor ordering, tenant isolation, consent/window enforcement, outgoing idempotency, recipient changes, early status callbacks, invalid phone quarantine, signature rejection, role guards and exact Page response shape.
- Corrected the webhook transaction boundary and HTTP error mapping after reproducing failures in regression tests. Dispatch rechecks consent/window against the recipient phone.
- Independent frontend reviewer was unavailable due account usage limit; direct review performed. Real Meta delivery remains an activation check, not a completed test. No real WhatsApp messages were sent.
- Setup and V1 limitations are documented in `backend/docs/whatsapp-messaging-v1.md`. Feature is disabled by default. No deployment or commit performed; prior unrelated working changes preserved.
