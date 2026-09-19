import { Component, DestroyRef, Injector, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import type { ElementRef } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, timer } from 'rxjs';
import { ConversationService } from '../../core/services/conversation.service';
import { StudioService } from '../../core/services/studio.service';
import type { ConversationResponse, MessageResponse, MessageStatus, SendMessageRequest } from '../../core/models/domain.model';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { TextareaComponent } from '../../shared/components/textarea/textarea.component';
import { getErrorMessage } from '../../shared/utils/errors';
import { canSendFreeText, latestIncomingMessage, mergeMessages, messagingExplanation, SendAttempt } from './message-state';

@Component({
  selector: 'app-message-thread',
  standalone: true,
  imports: [FormsModule, RouterLink, CardComponent, ButtonComponent, BadgeComponent, AlertComponent, EmptyStateComponent, TextareaComponent],
  templateUrl: './message-thread.component.html',
})
export class MessageThreadComponent implements OnInit {
  private readonly service = inject(ConversationService);
  private readonly studioService = inject(StudioService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly history = viewChild<ElementRef<HTMLElement>>('history');
  private readonly attempt = new SendAttempt();
  private refreshing = false;
  private revision = 0;
  private olderPage = 0;
  private readMessageId: string | null = null;
  private markingRead = false;

  readonly initialConversation = input.required<ConversationResponse>();
  readonly appointmentId = input<string | null>(null);
  readonly changed = output<void>();
  readonly explain = messagingExplanation;
  readonly conversation = signal<ConversationResponse | null>(null);
  readonly messages = signal<MessageResponse[]>([]);
  readonly loading = signal(true);
  readonly olderLoading = signal(false);
  readonly hasOlder = signal(false);
  readonly sending = signal(false);
  readonly savingConsent = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly notice = signal('');
  readonly now = signal(Date.now());
  readonly canWrite = computed(() => {
    const conversation = this.conversation();
    return !!conversation && canSendFreeText(conversation.canSendText, conversation.serviceWindowExpiresAt, this.now());
  });
  readonly blockedReason = computed(() => {
    const conversation = this.conversation();
    if (!conversation || this.canWrite()) return '';
    return messagingExplanation(conversation.sendBlockedReason || 'SERVICE_WINDOW_EXPIRED');
  });

  draft = '';
  consentConfirmed = false;
  includeAppointment = true;

  ngOnInit(): void {
    this.conversation.set(this.initialConversation());
    timer(0, 10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.now.set(Date.now());
      if (document.visibilityState === 'visible') this.refresh();
    });
  }

  refresh(): void {
    const conversation = this.conversation();
    if (!conversation || this.refreshing || this.olderLoading() || this.sending() || this.savingConsent()) return;
    this.refreshing = true;
    const revision = this.revision;
    forkJoin({ conversation: this.service.get(conversation.id), messages: this.service.messages(conversation.id) })
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: result => {
          this.refreshing = false;
          if (revision !== this.revision) return;
          const wasLoading = this.loading();
          const history = this.history()?.nativeElement;
          const nearBottom = !history || history.scrollHeight - history.scrollTop - history.clientHeight < 80;
          const previousLatest = this.messages().at(-1)?.id;
          this.conversation.set(result.conversation);
          this.messages.update(current => mergeMessages(current, result.messages.content));
          // A burst of new arrivals shifts offset pages; rescan overlapping pages instead of skipping history.
          if (previousLatest !== this.messages().at(-1)?.id) this.olderPage = 0;
          this.hasOlder.set(this.messages().length < result.messages.page.totalElements);
          this.loading.set(false);
          this.error.set('');
          afterNextRender(() => {
            const updatedHistory = this.history()?.nativeElement;
            if (updatedHistory && (wasLoading || nearBottom)) updatedHistory.scrollTop = updatedHistory.scrollHeight;
            this.markVisibleRead();
          }, { injector: this.injector });
        },
        error: (error: unknown) => {
          this.refreshing = false;
          if (revision !== this.revision) return;
          this.loading.set(false);
          this.error.set(getErrorMessage(error));
        },
      });
  }

  loadOlder(): void {
    const conversation = this.conversation();
    if (!conversation || this.olderLoading()) return;
    this.olderLoading.set(true);
    const nextPage = this.olderPage + 1;
    this.service.messages(conversation.id, nextPage).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: page => {
        const history = this.history()?.nativeElement;
        const previousHeight = history?.scrollHeight ?? 0;
        const previousTop = history?.scrollTop ?? 0;
        this.olderPage = nextPage;
        this.messages.update(current => mergeMessages(current, page.content));
        this.hasOlder.set(this.messages().length < page.page.totalElements && page.content.length > 0);
        this.olderLoading.set(false);
        afterNextRender(() => {
          const updatedHistory = this.history()?.nativeElement;
          if (updatedHistory) updatedHistory.scrollTop = previousTop + updatedHistory.scrollHeight - previousHeight;
        }, { injector: this.injector });
      },
      error: (error: unknown) => {
        this.error.set(getErrorMessage(error));
        this.olderLoading.set(false);
      },
    });
  }

  send(kind: 'TEXT' | 'TEMPLATE'): void {
    const conversation = this.conversation();
    const text = this.draft.trim();
    this.now.set(Date.now());
    if (!conversation || this.sending() || this.savingConsent()) return;
    if (kind === 'TEXT' && (!this.canWrite() || !text || text.length > 4000)) return;
    if (kind === 'TEMPLATE' && !conversation.canSendTemplate) return;
    const appointmentId = this.includeAppointment ? this.appointmentId() : null;
    const request: SendMessageRequest = {
      requestId: this.attempt.forPayload(conversation.id, kind, kind === 'TEXT' ? text : '', appointmentId),
      kind,
      ...(kind === 'TEXT' ? { text } : {}),
      ...(appointmentId ? { appointmentId } : {}),
    };
    this.revision++;
    this.sending.set(true);
    this.actionError.set('');
    this.notice.set('');
    this.service.send(conversation.id, request).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: message => {
        this.messages.update(current => mergeMessages(current, [message]));
        if (kind === 'TEXT' && this.draft.trim() === text) this.draft = '';
        this.attempt.clear();
        this.sending.set(false);
        this.notice.set('Messaggio registrato. Lo stato indica l’avanzamento dell’invio.');
        this.changed.emit();
        this.refresh();
      },
      error: (error: unknown) => {
        this.actionError.set(messagingExplanation(getErrorMessage(error)));
        this.sending.set(false);
        this.refresh();
      },
    });
  }

  setConsent(enabled: boolean): void {
    const conversation = this.conversation();
    if (!conversation || this.savingConsent() || this.sending() || (enabled && !this.consentConfirmed)) return;
    this.revision++;
    this.savingConsent.set(true);
    this.actionError.set('');
    this.service.setConsent(conversation.id, enabled).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: updated => {
        this.conversation.set(updated);
        this.savingConsent.set(false);
        this.consentConfirmed = false;
        this.notice.set(enabled ? 'Consenso WhatsApp registrato.' : 'Invii WhatsApp disattivati per questo cliente.');
      },
      error: (error: unknown) => {
        this.actionError.set(messagingExplanation(getErrorMessage(error)));
        this.savingConsent.set(false);
      },
    });
  }

  formatDate(value: string): string {
    return new Date(value).toLocaleString('it-IT', {
      timeZone: this.studioService.studio()?.timezone ?? 'Europe/Rome',
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  statusLabel(status: MessageStatus): string {
    const labels: Record<MessageStatus, string> = {
      RECEIVED: 'Ricevuto', QUEUED: 'In coda', SENDING: 'Invio in corso', ACCEPTED: 'Accettato da WhatsApp',
      DELIVERED: 'Consegnato', READ: 'Letto dal cliente', FAILED: 'Non inviato', UNKNOWN: 'Esito da verificare',
    };
    return labels[status];
  }

  statusVariant(status: MessageStatus): 'gray' | 'blue' | 'green' | 'amber' | 'red' {
    if (status === 'FAILED') return 'red';
    if (status === 'UNKNOWN') return 'amber';
    if (status === 'READ' || status === 'DELIVERED') return 'green';
    if (status === 'ACCEPTED') return 'blue';
    return 'gray';
  }

  markVisibleRead(): void {
    const conversation = this.conversation();
    const message = latestIncomingMessage(this.messages());
    if (!conversation || !message || this.markingRead || message.id === this.readMessageId ||
      document.visibilityState !== 'visible' || !document.hasFocus()) return;
    const element = document.getElementById(`message-${message.id}`);
    const history = this.history()?.nativeElement;
    if (!element || !history) return;
    const bounds = element.getBoundingClientRect();
    const viewport = history.getBoundingClientRect();
    if (bounds.bottom <= Math.max(0, viewport.top) || bounds.top >= Math.min(window.innerHeight, viewport.bottom)) return;
    this.markingRead = true;
    this.service.markRead(conversation.id, message.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.markingRead = false;
        this.readMessageId = message.id;
        this.changed.emit();
      },
      error: () => { this.markingRead = false; },
    });
  }
}
