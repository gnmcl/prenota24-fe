import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { AlertComponent } from '../../shared/components/alert/alert.component';
import { AppointmentService } from '../../core/services/appointment.service';
import { ProfessionalService } from '../../core/services/professional.service';
import type { AppointmentResponse, AppointmentStatus, ProfessionalResponse, TimeSlotResponse } from '../../core/models/domain.model';
import { getErrorMessage } from '../../shared/utils/errors';

const MONTHS_IT = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
const DAYS_IT = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, PageShellComponent, CardComponent, ButtonComponent, BadgeComponent, ConfirmDialogComponent, AlertComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-3xl">
        <a routerLink="/appuntamenti" class="mb-6 inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
          Torna alla lista
        </a>

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        }

        @if (error()) {
          <app-alert variant="error" [message]="error()" class="mb-4" />
        }

        @if (apt()) {
          <!-- Header -->
          <div class="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h2 class="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">Appuntamento</h2>
                <app-badge [variant]="statusVariant(apt()!.status)">{{ statusLabel(apt()!.status) }}</app-badge>
              </div>
              <p class="mt-1 text-sm text-[var(--text-secondary)]">{{ formatFull(apt()!.startDatetime) }} — {{ formatTime(apt()!.endDatetime) }}</p>
            </div>
          </div>

          <!-- Edit form -->
          @if (editMode()) {
            <app-card extraClass="mb-6 !border-indigo-200 dark:!border-indigo-800/60 !border-2">
              <h3 class="mb-4 text-lg font-semibold text-[var(--text-primary)]">Modifica appuntamento</h3>

              <!-- Date picker (mini calendar) -->
              <div class="mb-4">
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-2">Data</label>
                <div class="rounded-xl border border-[var(--surface-card-border)] overflow-hidden max-w-sm">
                  <div class="flex items-center justify-between bg-[var(--surface-hover)] px-3 py-2">
                    <button (click)="editCalPrevMonth()" type="button" class="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-card)] transition-colors">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
                    </button>
                    <span class="text-xs font-semibold text-[var(--text-primary)]">{{ editCalMonthLabel() }}</span>
                    <button (click)="editCalNextMonth()" type="button" class="rounded-lg p-1 text-[var(--text-secondary)] hover:bg-[var(--surface-card)] transition-colors">
                      <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                    </button>
                  </div>
                  <div class="grid grid-cols-7 bg-[var(--surface-hover)] border-t border-[var(--surface-card-border)]">
                    @for (day of daysOfWeek; track day) {
                      <div class="py-1.5 text-center text-[10px] font-medium text-[var(--text-tertiary)] uppercase">{{ day }}</div>
                    }
                  </div>
                  <div class="grid grid-cols-7">
                    @for (day of editCalDaysVisible(); track $index) {
                      @if (day) {
                        <button (click)="setEditDate(day.dateStr)" type="button"
                          [disabled]="day.isPast"
                          [class]="day.dateStr === editDate
                            ? 'relative py-2 text-center text-xs bg-indigo-600 text-white font-semibold rounded-lg shadow-sm transition-all'
                            : day.isPast
                              ? 'relative py-2 text-center text-xs text-[var(--text-tertiary)] cursor-not-allowed'
                              : day.isToday
                                ? 'relative py-2 text-center text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:bg-[var(--surface-hover)] rounded-lg'
                                : 'relative py-2 text-center text-xs text-[var(--text-primary)] hover:bg-[var(--surface-hover)] rounded-lg transition-colors'">
                          {{ day.num }}
                        </button>
                      } @else {
                        <div class="py-2"></div>
                      }
                    }
                  </div>
                </div>
              </div>

              <!-- Time + Duration + end -->
              <div class="grid gap-4 sm:grid-cols-3 mb-4">
                <div>
                  <label class="block text-xs font-medium text-[var(--text-secondary)] mb-1">Ora inizio</label>
                  <input type="time" [ngModel]="editStartTime()" (ngModelChange)="editStartTime.set($event)" step="300"
                    class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--text-secondary)] mb-1">Durata (min)</label>
                  <input type="number" [ngModel]="editDuration()" (ngModelChange)="setEditDuration($event)" min="5" step="5"
                    class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2.5 text-sm text-[var(--text-primary)] shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-[var(--text-secondary)] mb-1">Fine (calcolata)</label>
                  <div class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-hover)] px-3 py-2.5 text-sm text-[var(--text-secondary)]">
                    {{ editEndTimeComputed() || '—' }}
                  </div>
                </div>
              </div>

              <!-- Availability indicator + slot chips -->
              @if (editDate && editProfessionalId()) {
                <div class="mb-4 rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-hover)] p-4">
                  @if (editStartTime()) {
                    <div class="mb-3 flex items-center gap-2">
                      @if (editResolvedSlot()) {
                        <div class="h-2.5 w-2.5 rounded-full bg-emerald-500"></div>
                        <span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">Orario disponibile</span>
                      } @else {
                        <div class="h-2.5 w-2.5 rounded-full bg-red-400"></div>
                        <span class="text-xs font-medium text-red-600 dark:text-red-400">Orario non disponibile o già occupato</span>
                      }
                    </div>
                  }
                  @if (editLoadingSlots()) {
                    <div class="flex items-center gap-2">
                      <div class="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[var(--surface-card-border)] border-t-indigo-600"></div>
                      <span class="text-xs text-[var(--text-tertiary)]">Carico orari disponibili...</span>
                    </div>
                  } @else if (editAvailableSlots().length > 0) {
                    <div class="flex flex-wrap items-center gap-2">
                      <span class="text-xs text-[var(--text-tertiary)]">Disponibili:</span>
                      @for (slot of editAvailableSlots(); track slot.start) {
                        <button (click)="editStartTime.set(formatTime(slot.start))" type="button"
                          [class]="editStartTime() === formatTime(slot.start)
                            ? 'rounded-full bg-indigo-600 px-3 py-1 text-xs font-medium text-white'
                            : 'rounded-full border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors'">
                          {{ formatTime(slot.start) }}
                        </button>
                      }
                    </div>
                  } @else {
                    <p class="text-xs text-[var(--text-tertiary)]">Nessun orario disponibile per questo giorno.</p>
                  }
                </div>
              }

              <!-- Professional selector -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-[var(--text-secondary)] mb-1">Professionista</label>
                <div class="max-h-36 overflow-y-auto space-y-1">
                  @for (pro of allProfessionals(); track pro.id) {
                    <button (click)="selectEditProfessional(pro.id)" type="button"
                      [class]="editProfessionalId() === pro.id
                        ? 'w-full rounded-lg border-2 border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-left text-sm'
                        : 'w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-left text-sm hover:bg-[var(--surface-hover)] transition-colors'">
                      <span class="font-medium text-[var(--text-primary)]">{{ pro.firstName }} {{ pro.lastName }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- Notes -->
              <div class="mb-4">
                <label class="block text-xs font-medium text-[var(--text-secondary)] mb-1">Note</label>
                <textarea [(ngModel)]="editNotes" rows="2"
                  class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none resize-none transition-colors">
                </textarea>
              </div>

              <div class="flex justify-end gap-3">
                <app-button variant="secondary" (click)="editMode.set(false)">Annulla</app-button>
                <app-button [disabled]="!editResolvedSlot()" [isLoading]="actionLoading()" (click)="saveChanges()">Salva modifiche</app-button>
              </div>
            </app-card>
          }

          <!-- Details grid -->
          @if (!editMode()) {
            <app-card extraClass="mb-6">
              <dl class="divide-y divide-[var(--surface-card-border)]">
                <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Cliente</dt>
                  <dd class="min-w-0 flex-1">
                    <a [routerLink]="['/clienti', apt()!.clientId]" class="font-medium text-[var(--color-primary)] hover:underline">
                      {{ apt()!.clientFullName }}
                    </a>
                  </dd>
                </div>
                <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Professionista</dt>
                  <dd class="min-w-0 flex-1">
                    <a [routerLink]="['/professionisti', apt()!.professionalId]" class="font-medium text-[var(--color-primary)] hover:underline">
                      {{ apt()!.professionalFullName }}
                    </a>
                  </dd>
                </div>
                @if (apt()!.serviceTypeName) {
                  <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">Servizio</dt>
                    <dd class="text-sm text-[var(--text-primary)]">{{ apt()!.serviceTypeName }}</dd>
                  </div>
                }
                @if (apt()!.notes) {
                  <div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)] mt-0.5">Note</dt>
                    <dd class="text-sm text-[var(--text-secondary)] whitespace-pre-line">{{ apt()!.notes }}</dd>
                  </div>
                }
                @if (apt()!.cancellationReason) {
                  <div class="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                    <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-red-400 mt-0.5">Cancellazione</dt>
                    <dd class="flex-1">
                      <p class="text-sm text-red-600">{{ apt()!.cancellationReason }}</p>
                      @if (apt()!.cancelledBy) {
                        <p class="mt-0.5 text-xs text-[var(--text-tertiary)]">Da: {{ cancelledByLabel(apt()!.cancelledBy!) }}</p>
                      }
                    </dd>
                  </div>
                }
                @if (apt()!.proposedStart) {
                  <div class="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <dt class="w-32 shrink-0 text-xs font-medium uppercase tracking-wider text-blue-500">Orari proposti</dt>
                    <dd class="text-sm font-medium text-blue-700 dark:text-blue-300">
                      <div>1. {{ formatFull(apt()!.proposedStart!) }} — {{ formatTime(apt()!.proposedEnd!) }}</div>
                      @if (apt()!.proposedStart2) {
                        <div>2. {{ formatFull(apt()!.proposedStart2!) }} — {{ formatTime(apt()!.proposedEnd2!) }}</div>
                      }
                      @if (apt()!.proposedStart3) {
                        <div>3. {{ formatFull(apt()!.proposedStart3!) }} — {{ formatTime(apt()!.proposedEnd3!) }}</div>
                      }
                    </dd>
                  </div>
                }
              </dl>
            </app-card>

            <!-- Actions -->
            @if (apt()!.status !== 'COMPLETED' && apt()!.status !== 'CANCELLED' && apt()!.status !== 'NO_SHOW') {
              <div class="mb-6 flex flex-wrap gap-2">
                @if (apt()!.status === 'REQUESTED') {
                  <app-button (click)="confirm()" [isLoading]="actionLoading()">Conferma</app-button>
                  <app-button variant="secondary" (click)="openProposeForm()">Proponi orario</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Rifiuta</app-button>
                }
                @if (apt()!.status === 'CONFIRMED') {
                  <app-button (click)="complete()" [isLoading]="actionLoading()">Completa</app-button>
                  <app-button variant="secondary" (click)="noShow()" [isLoading]="actionLoading()">Non presentato</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Cancella</app-button>
                }
                @if (apt()!.status === 'PROPOSED_NEW_TIME') {
                  <app-button (click)="confirm()" [isLoading]="actionLoading()">Conferma nuovo orario</app-button>
                  <app-button variant="danger" (click)="cancelDialogOpen.set(true)">Cancella</app-button>
                }
              </div>
            }

            <!-- Propose new time form -->
            @if (showProposeForm()) {
              <app-card extraClass="!border-blue-200 dark:!border-blue-900/50">
                <h4 class="mb-3 text-sm font-semibold text-[var(--text-primary)]">Proponi nuovo orario</h4>
                <p class="mb-4 text-xs text-[var(--text-secondary)]">
                  Orario attuale: <span class="font-semibold">{{ formatFull(apt()!.startDatetime) }} – {{ formatTime(apt()!.endDatetime) }}</span>
                </p>

                <!-- Proposta principale (obbligatoria) -->
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Proposta principale *</p>
                <div class="grid gap-4 lg:grid-cols-[240px_1fr]">
                  <div>
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                    <input type="date" [value]="proposalDate()" [min]="todayStr" (change)="onProposalDateChange($event)"
                      class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none" />
                  </div>
                  <div>
                    @if (proposalSlotsLoading()) {
                      <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                        <div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                        Caricamento disponibilità…
                      </div>
                    } @else if (proposalDate() && proposalSlots().length === 0) {
                      <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                        Nessuno slot disponibile per questa data.
                      </div>
                    } @else if (proposalSlots().length > 0) {
                      <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Orario *</label>
                      <select (change)="onProposalSlotSelect($event)"
                        class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none">
                        <option value="">— Seleziona orario —</option>
                        @for (slot of proposalSlots(); track slot.start) {
                          <option [value]="slot.start" [selected]="selectedProposalSlot()?.start === slot.start">{{ formatProposalSlot(slot) }}</option>
                        }
                      </select>
                    }
                  </div>
                </div>

                @if (selectedProposalSlot()) {
                  <p class="mt-2 text-xs text-green-700">✓ Proposta 1: {{ formatProposalSlot(selectedProposalSlot()!) }}</p>
                }

                <!-- Proposta alternativa 2 (opzionale) -->
                <div class="mt-5 border-t border-[var(--surface-card-border)] pt-4">
                  <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Proposta alternativa 2 (opzionale)</p>
                  <div class="grid gap-4 lg:grid-cols-[240px_1fr]">
                    <div>
                      <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                      <input type="date" [value]="proposalDate2()" [min]="todayStr" (change)="onProposalDateChange2($event)"
                        class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <div>
                      @if (proposalSlotsLoading2()) {
                        <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                          Caricamento…
                        </div>
                      } @else if (proposalDate2() && proposalSlots2().length === 0) {
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          Nessuno slot disponibile per questa data.
                        </div>
                      } @else if (proposalSlots2().length > 0) {
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Orario</label>
                        <select (change)="onProposalSlotSelect2($event)"
                          class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none">
                          <option value="">— Seleziona orario —</option>
                          @for (slot of proposalSlots2(); track slot.start) {
                            <option [value]="slot.start" [selected]="selectedProposalSlot2()?.start === slot.start">{{ formatProposalSlot(slot) }}</option>
                          }
                        </select>
                      }
                    </div>
                  </div>
                  @if (selectedProposalSlot2()) {
                    <p class="mt-2 text-xs text-green-700">✓ Proposta 2: {{ formatProposalSlot(selectedProposalSlot2()!) }}</p>
                  }
                </div>

                <!-- Proposta alternativa 3 (opzionale) -->
                <div class="mt-5 border-t border-[var(--surface-card-border)] pt-4">
                  <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Proposta alternativa 3 (opzionale)</p>
                  <div class="grid gap-4 lg:grid-cols-[240px_1fr]">
                    <div>
                      <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                      <input type="date" [value]="proposalDate3()" [min]="todayStr" (change)="onProposalDateChange3($event)"
                        class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none" />
                    </div>
                    <div>
                      @if (proposalSlotsLoading3()) {
                        <div class="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <div class="h-4 w-4 animate-spin rounded-full border-2 border-[var(--surface-card-border)] border-t-[var(--color-primary)]"></div>
                          Caricamento…
                        </div>
                      } @else if (proposalDate3() && proposalSlots3().length === 0) {
                        <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                          Nessuno slot disponibile per questa data.
                        </div>
                      } @else if (proposalSlots3().length > 0) {
                        <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Orario</label>
                        <select (change)="onProposalSlotSelect3($event)"
                          class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] focus:outline-none">
                          <option value="">— Seleziona orario —</option>
                          @for (slot of proposalSlots3(); track slot.start) {
                            <option [value]="slot.start" [selected]="selectedProposalSlot3()?.start === slot.start">{{ formatProposalSlot(slot) }}</option>
                          }
                        </select>
                      }
                    </div>
                  </div>
                  @if (selectedProposalSlot3()) {
                    <p class="mt-2 text-xs text-green-700">✓ Proposta 3: {{ formatProposalSlot(selectedProposalSlot3()!) }}</p>
                  }
                </div>

                @if (proposalError()) {
                  <div class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ proposalError() }}</div>
                }

                <div class="mt-4 flex gap-2">
                  <app-button [disabled]="!selectedProposalSlot()" [isLoading]="actionLoading()" (click)="proposeNewTime()">Proponi</app-button>
                  <app-button variant="secondary" (click)="closeProposeForm()">Annulla</app-button>
                </div>
              </app-card>
            }
          }
        }

        <!-- Cancel dialog -->
        <app-confirm-dialog
          [open]="cancelDialogOpen()"
          title="Cancella appuntamento"
          message="Sei sicuro di voler cancellare questo appuntamento?"
          confirmLabel="Cancella"
          [isLoading]="actionLoading()"
          (onConfirm)="cancelAppointment()"
          (onCancel)="cancelDialogOpen.set(false)"
        />
      </div>
    </app-page-shell>
  `,
})
export class AppointmentDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly aptService = inject(AppointmentService);
  private readonly profService = inject(ProfessionalService);

  readonly apt = signal<AppointmentResponse | null>(null);
  readonly allProfessionals = signal<ProfessionalResponse[]>([]);
  readonly isLoading = signal(true);
  readonly actionLoading = signal(false);
  readonly error = signal('');
  readonly cancelDialogOpen = signal(false);
  readonly showProposeForm = signal(false);
  readonly editMode = signal(false);
  readonly proposalDate = signal('');
  readonly proposalSlots = signal<TimeSlotResponse[]>([]);
  readonly proposalSlotsLoading = signal(false);
  readonly proposalError = signal('');
  readonly selectedProposalSlot = signal<TimeSlotResponse | null>(null);
  // Optional alternative slots 2 and 3
  readonly proposalDate2 = signal('');
  readonly proposalSlots2 = signal<TimeSlotResponse[]>([]);
  readonly proposalSlotsLoading2 = signal(false);
  readonly selectedProposalSlot2 = signal<TimeSlotResponse | null>(null);
  readonly proposalDate3 = signal('');
  readonly proposalSlots3 = signal<TimeSlotResponse[]>([]);
  readonly proposalSlotsLoading3 = signal(false);
  readonly selectedProposalSlot3 = signal<TimeSlotResponse | null>(null);
  readonly todayStr = this.toDateStr(new Date());

  // Edit form fields
  editDate = '';
  readonly editStartTime = signal('');
  readonly editDuration = signal(30);
  readonly editProfessionalId = signal('');
  readonly editAvailableSlots = signal<TimeSlotResponse[]>([]);
  readonly editLoadingSlots = signal(false);
  editNotes = '';

  private editSlotTimeout?: ReturnType<typeof setTimeout>;

  // Edit calendar
  readonly editCalMonth = signal(new Date().getMonth());
  readonly editCalYear = signal(new Date().getFullYear());
  readonly daysOfWeek = DAYS_IT;

  readonly editCalMonthLabel = computed(() => `${MONTHS_IT[this.editCalMonth()]} ${this.editCalYear()}`);

  readonly editCalDays = computed(() => {
    const year = this.editCalYear();
    const month = this.editCalMonth();
    const firstDay = new Date(year, month, 1);
    let dow = firstDay.getDay();
    if (dow === 0) dow = 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const cells: (null | { num: number; dateStr: string; isToday: boolean; isPast: boolean })[] = [];
    for (let i = 1; i < dow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayDate = new Date(year, month, d);
      cells.push({ num: d, dateStr, isToday: dateStr === todayStr, isPast: dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate()) });
    }
    return cells;
  });

  readonly editEndTimeComputed = computed(() => {
    const st = this.editStartTime();
    if (!st) return '';
    const [h, m] = st.split(':').map(Number);
    const totalMin = h * 60 + m + this.editDuration();
    return `${String(Math.floor(totalMin / 60)).padStart(2, '0')}:${String(totalMin % 60).padStart(2, '0')}`;
  });

  readonly editResolvedSlot = computed(() => {
    const time = this.editStartTime();
    if (!time) return null;
    // Allow saving the original slot without requiring it to appear in available slots
    const apt = this.apt();
    if (apt) {
      const origStart = new Date(apt.startDatetime);
      const origTime = `${String(origStart.getHours()).padStart(2, '0')}:${String(origStart.getMinutes()).padStart(2, '0')}`;
      const origDate = `${origStart.getFullYear()}-${String(origStart.getMonth() + 1).padStart(2, '0')}-${String(origStart.getDate()).padStart(2, '0')}`;
      const origDuration = Math.round((new Date(apt.endDatetime).getTime() - origStart.getTime()) / 60000);
      if (time === origTime && this.editDate === origDate && this.editProfessionalId() === apt.professionalId && this.editDuration() === origDuration) {
        return { start: apt.startDatetime, end: apt.endDatetime };
      }
    }
    return this.editAvailableSlots().find((s) => this.formatTime(s.start) === time) ?? null;
  });

  readonly isEditable = computed(() => {
    return this.apt()?.status === 'CONFIRMED';
  });

  readonly nearbyProposalSlots = computed(() => {
    const apt = this.apt();
    if (!apt) return [];
    const target = new Date(apt.startDatetime).getTime();
    return [...this.proposalSlots()]
      .sort((a, b) => Math.abs(new Date(a.start).getTime() - target) - Math.abs(new Date(b.start).getTime() - target))
      .slice(0, 6);
  });

  readonly otherProposalSlots = computed(() => {
    const suggested = new Set(this.nearbyProposalSlots().map((slot) => slot.start));
    return this.proposalSlots().filter((slot) => !suggested.has(slot.start));
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.aptService.getById(id).subscribe({
      next: (a) => {
        this.apt.set(a);
        this.isLoading.set(false);
      },
      error: () => this.router.navigate(['/appuntamenti']),
    });
    this.profService.list().subscribe({
      next: (list) => this.allProfessionals.set(list.filter((p) => p.active)),
    });
  }


  setEditDate(dateStr: string): void {
    this.editDate = dateStr;
    this.editAvailableSlots.set([]);
    this.loadEditSlots();
  }

  selectEditProfessional(id: string): void {
    this.editProfessionalId.set(id);
    this.editAvailableSlots.set([]);
    this.loadEditSlots();
  }

  setEditDuration(val: number): void {
    this.editDuration.set(val);
    this.editAvailableSlots.set([]);
    this.loadEditSlots();
  }

  /** editCalDays with isPast = only truly past, no weekend blocking */
  readonly editCalDaysVisible = computed(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.editCalDays().map(d => {
      if (!d) return d;
      const date = new Date(d.dateStr + 'T00:00:00');
      return { ...d, isPast: date < today };
    });
  });

  private loadEditSlots(): void {
    const profId = this.editProfessionalId();
    const date = this.editDate;
    const duration = this.editDuration();
    if (!profId || !date || duration < 5) return;
    clearTimeout(this.editSlotTimeout);
    this.editSlotTimeout = setTimeout(() => {
      this.editLoadingSlots.set(true);
      this.profService.getAvailableSlots(profId, date, duration).subscribe({
        next: (slots) => { this.editAvailableSlots.set(slots); this.editLoadingSlots.set(false); },
        error: () => this.editLoadingSlots.set(false),
      });
    }, 300);
  }

  editCalPrevMonth(): void {
    if (this.editCalMonth() === 0) { this.editCalMonth.set(11); this.editCalYear.update((y) => y - 1); }
    else { this.editCalMonth.update((m) => m - 1); }
  }
  editCalNextMonth(): void {
    if (this.editCalMonth() === 11) { this.editCalMonth.set(0); this.editCalYear.update((y) => y + 1); }
    else { this.editCalMonth.update((m) => m + 1); }
  }

  saveChanges(): void {
    const a = this.apt()!;
    const slot = this.editResolvedSlot();
    if (!slot) {
      this.error.set('Seleziona un orario disponibile prima di salvare.');
      return;
    }
    this.actionLoading.set(true);
    this.error.set('');

    this.aptService.update(a.id, {
      startDatetime: slot.start,
      endDatetime: slot.end,
      professionalId: this.editProfessionalId() !== a.professionalId ? this.editProfessionalId() as import('../../core/models/domain.model').UUID : undefined,
      notes: this.editNotes,
    }).subscribe({
      next: (updated) => {
        this.apt.set(updated);
        this.editMode.set(false);
        this.actionLoading.set(false);
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  confirm(): void { this.doAction(() => this.aptService.confirm(this.apt()!.id)); }
  complete(): void { this.doAction(() => this.aptService.complete(this.apt()!.id)); }
  noShow(): void { this.doAction(() => this.aptService.noShow(this.apt()!.id)); }

  cancelAppointment(): void {
    this.doAction(() => this.aptService.cancel(this.apt()!.id), () => this.cancelDialogOpen.set(false));
  }

  openProposeForm(): void {
    const apt = this.apt();
    if (!apt) return;
    this.proposalDate.set(this.toDateStr(new Date(apt.startDatetime)));
    this.proposalDate2.set('');
    this.proposalDate3.set('');
    this.proposalSlots2.set([]);
    this.proposalSlots3.set([]);
    this.proposalError.set('');
    this.selectedProposalSlot.set(null);
    this.selectedProposalSlot2.set(null);
    this.selectedProposalSlot3.set(null);
    this.showProposeForm.set(true);
    this.loadProposalSlots();
  }

  closeProposeForm(): void {
    this.showProposeForm.set(false);
    this.proposalError.set('');
    this.selectedProposalSlot.set(null);
    this.selectedProposalSlot2.set(null);
    this.selectedProposalSlot3.set(null);
    this.proposalSlots2.set([]);
    this.proposalSlots3.set([]);
    this.proposalDate2.set('');
    this.proposalDate3.set('');
  }

  onProposalDateChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDate.set(input.value);
    this.selectedProposalSlot.set(null);
    this.loadProposalSlots();
  }

  onProposalDateChange2(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDate2.set(input.value);
    this.selectedProposalSlot2.set(null);
    this.loadProposalSlots2();
  }

  onProposalDateChange3(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDate3.set(input.value);
    this.selectedProposalSlot3.set(null);
    this.loadProposalSlots3();
  }

  private loadProposalSlots2(): void {
    const apt = this.apt();
    if (!apt || !this.proposalDate2()) return;
    const durationMinutes = Math.max(5, Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000));
    this.proposalSlotsLoading2.set(true);
    this.profService.getAvailableSlots(apt.professionalId, this.proposalDate2(), durationMinutes).subscribe({
      next: slots => { this.proposalSlots2.set(slots); this.proposalSlotsLoading2.set(false); },
      error: () => { this.proposalSlots2.set([]); this.proposalSlotsLoading2.set(false); },
    });
  }

  private loadProposalSlots3(): void {
    const apt = this.apt();
    if (!apt || !this.proposalDate3()) return;
    const durationMinutes = Math.max(5, Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000));
    this.proposalSlotsLoading3.set(true);
    this.profService.getAvailableSlots(apt.professionalId, this.proposalDate3(), durationMinutes).subscribe({
      next: slots => { this.proposalSlots3.set(slots); this.proposalSlotsLoading3.set(false); },
      error: () => { this.proposalSlots3.set([]); this.proposalSlotsLoading3.set(false); },
    });
  }

  selectProposalSlot(slot: TimeSlotResponse): void {
    this.selectedProposalSlot.set(slot);
  }

  onProposalSlotSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const slot = this.proposalSlots().find((s) => s.start === val) ?? null;
    this.selectedProposalSlot.set(slot);
  }

  onProposalSlotSelect2(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const slot = this.proposalSlots2().find((s) => s.start === val) ?? null;
    this.selectedProposalSlot2.set(slot);
  }

  onProposalSlotSelect3(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const slot = this.proposalSlots3().find((s) => s.start === val) ?? null;
    this.selectedProposalSlot3.set(slot);
  }

  proposeNewTime(): void {
    const slot = this.selectedProposalSlot();
    if (!slot) return;
    const slot2 = this.selectedProposalSlot2();
    const slot3 = this.selectedProposalSlot3();
    const selectedSlots = [slot, slot2, slot3].filter(
      (candidate): candidate is TimeSlotResponse => candidate !== null,
    );
    if (new Set(selectedSlots.map(candidate => candidate.start)).size !== selectedSlots.length) {
      this.proposalError.set('Le proposte di orario devono essere distinte.');
      return;
    }
    const payload: import('../../core/models/domain.model').ProposeNewTimeRequest = {
      proposedStart: slot.start,
      proposedEnd: slot.end,
      ...(slot2 ? { proposedStart2: slot2.start, proposedEnd2: slot2.end } : {}),
      ...(slot3 ? { proposedStart3: slot3.start, proposedEnd3: slot3.end } : {}),
    };
    this.doAction(
      () => this.aptService.proposeNewTime(this.apt()!.id, payload),
      () => this.closeProposeForm(),
    );
  }

  proposalSlotClass(slot: TimeSlotResponse, suggested: boolean): string {
    const selected = this.selectedProposalSlot()?.start === slot.start;
    const base = 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors';
    if (selected) return `${base} border-indigo-600 bg-indigo-600 text-white dark:border-indigo-300 dark:bg-indigo-700 dark:text-white`;
    if (suggested) return `${base} border-blue-200 bg-white text-blue-900 hover:border-blue-400 hover:bg-blue-100 dark:border-blue-700 dark:bg-slate-900 dark:text-blue-100 dark:hover:border-blue-500 dark:hover:bg-blue-900/40`;
    return `${base} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:border-slate-500 dark:hover:bg-slate-800`;
  }

  formatProposalSlot(slot: TimeSlotResponse): string {
    return `${this.formatTime(slot.start)} - ${this.formatTime(slot.end)}`;
  }

  private doAction(action: () => import('rxjs').Observable<AppointmentResponse>, onSuccess?: () => void): void {
    this.actionLoading.set(true);
    this.error.set('');
    action().subscribe({
      next: (updated) => {
        this.apt.set(updated);
        this.actionLoading.set(false);
        onSuccess?.();
      },
      error: (err) => {
        this.actionLoading.set(false);
        this.error.set(getErrorMessage(err));
      },
    });
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta orario', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  cancelledByLabel(val: string): string {
    const map: Record<string, string> = { CLIENT: 'Cliente', PROFESSIONAL: 'Professionista', SYSTEM: 'Sistema' };
    return map[val] ?? val;
  }

  formatFull(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  private loadProposalSlots(): void {
    const apt = this.apt();
    if (!apt || !this.proposalDate()) return;

    const durationMinutes = Math.max(
      5,
      Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000),
    );

    this.proposalSlotsLoading.set(true);
    this.proposalError.set('');
    this.profService.getAvailableSlots(apt.professionalId, this.proposalDate(), durationMinutes).subscribe({
      next: (slots) => {
        this.proposalSlots.set(slots);
        this.proposalSlotsLoading.set(false);
      },
      error: (err) => {
        this.proposalSlotsLoading.set(false);
        this.proposalSlots.set([]);
        this.proposalError.set(getErrorMessage(err));
      },
    });
  }

  private toDateStr(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
