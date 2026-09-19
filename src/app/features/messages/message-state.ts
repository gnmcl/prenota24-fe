import type { MessageResponse, MessageStatus } from '../../core/models/domain.model';

const DELIVERY_ORDER: Partial<Record<MessageStatus, number>> = {
  QUEUED: 0, SENDING: 1, UNKNOWN: 2, ACCEPTED: 3, FAILED: 4, DELIVERED: 5, READ: 6,
};

export function mergeMessages(current: MessageResponse[], incoming: MessageResponse[]): MessageResponse[] {
  const messages = new Map(current.map(message => [message.id, message]));
  for (const message of incoming) {
    const previous = messages.get(message.id);
    if (previous && (DELIVERY_ORDER[previous.status] ?? 0) > (DELIVERY_ORDER[message.status] ?? 0)) continue;
    messages.set(message.id, message);
  }
  return [...messages.values()].sort((a, b) => a.sequenceNo - b.sequenceNo);
}

export function latestIncomingMessage(messages: MessageResponse[]): MessageResponse | null {
  return mergeMessages([], messages).filter(message => message.direction === 'INBOUND').at(-1) ?? null;
}

export function canSendFreeText(allowed: boolean, expiresAt: string | null, now: number): boolean {
  return allowed && expiresAt !== null && Date.parse(expiresAt) > now;
}

export function messagingExplanation(reason: string): string {
  const explanations: Record<string, string> = {
    WHATSAPP_NOT_CONFIGURED: 'WhatsApp non è ancora collegato allo studio. Le conversazioni restano consultabili.',
    CLIENT_PHONE_MISSING: 'Aggiungi nella scheda cliente un numero valido con prefisso internazionale, per esempio +39.',
    CLIENT_PHONE_INVALID: 'Verifica il numero nella scheda cliente: serve il prefisso internazionale esplicito, per esempio +39.',
    CLIENT_PHONE_AMBIGUOUS: 'Questo numero è associato a più clienti. Verifica le anagrafiche prima di inviare messaggi.',
    CLIENT_PHONE_CHANGED: 'Il numero del cliente è cambiato. Verifica il destinatario e registra nuovamente il consenso.',
    WHATSAPP_OPT_IN_REQUIRED: 'Registra nelle preferenze il consenso del cliente prima di inviare messaggi WhatsApp.',
    SERVICE_WINDOW_EXPIRED: 'La finestra di risposta è scaduta. Invia il modello di ricontatto e attendi una risposta del cliente.',
  };
  return explanations[reason] ?? reason;
}

/** Keeps an uncertain HTTP retry tied to the same durable backend request. */
export class SendAttempt {
  private signature = '';
  private requestId = '';

  forPayload(conversationId: string, kind: 'TEXT' | 'TEMPLATE', text: string, appointmentId: string | null): string {
    const signature = JSON.stringify([conversationId, kind, text, appointmentId]);
    if (signature !== this.signature) {
      this.signature = signature;
      this.requestId = crypto.randomUUID();
    }
    return this.requestId;
  }

  clear(): void {
    this.signature = '';
    this.requestId = '';
  }
}
