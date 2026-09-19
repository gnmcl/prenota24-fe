import { Component, DestroyRef, inject, signal } from '@angular/core';
import type { OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap, timer } from 'rxjs';
import { ConversationService } from '../../core/services/conversation.service';
import { StudioService } from '../../core/services/studio.service';
import type { ConversationResponse } from '../../core/models/domain.model';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MessageThreadComponent } from './message-thread.component';
import { getErrorMessage } from '../../shared/utils/errors';

@Component({
  selector: 'app-messages',
  standalone: true,
  imports: [RouterLink, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, AlertComponent, EmptyStateComponent, MessageThreadComponent],
  templateUrl: './messages.component.html',
})
export class MessagesComponent implements OnInit {
  private readonly service = inject(ConversationService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly studioService = inject(StudioService);
  private listRequest = 0;

  readonly conversations = signal<ConversationResponse[]>([]);
  readonly selected = signal<ConversationResponse | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly appointmentId = signal<string | null>(null);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly error = signal('');
  readonly detailError = signal('');
  readonly page = signal(0);
  readonly totalPages = signal(0);

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        this.selectedId.set(id);
        this.appointmentId.set(this.route.snapshot.queryParamMap.get('appuntamento'));
        this.selected.set(null);
        this.detailError.set('');
        this.detailLoading.set(!!id);
        if (!id) return of(null);
        return this.service.get(id).pipe(catchError((error: unknown) => {
          this.detailError.set(getErrorMessage(error));
          return of(null);
        }));
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(conversation => {
      this.selected.set(conversation);
      this.detailLoading.set(false);
    });
    timer(0, 10000).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      if (document.visibilityState === 'visible') this.loadList(false);
    });
  }

  loadList(showLoading = true): void {
    const request = ++this.listRequest;
    if (showLoading) this.loading.set(true);
    this.service.list(this.page()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: result => {
        if (request !== this.listRequest) return;
        this.conversations.set(result.content);
        this.totalPages.set(result.page.totalPages);
        this.loading.set(false);
        this.error.set('');
      },
      error: (error: unknown) => {
        if (request !== this.listRequest) return;
        this.error.set(getErrorMessage(error));
        this.loading.set(false);
      },
    });
  }

  changePage(direction: number): void {
    this.page.update(page => Math.max(0, page + direction));
    this.loadList();
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleString('it-IT', {
      timeZone: this.studioService.studio()?.timezone ?? 'Europe/Rome',
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }
}
