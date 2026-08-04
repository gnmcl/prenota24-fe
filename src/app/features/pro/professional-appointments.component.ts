import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProfessionalPortalService } from '../../core/services/professional-portal.service';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import type { AppointmentResponse, AppointmentStatus, ClientSummaryResponse, CreateAppointmentRequest, CreateClientRequest, ProposeNewTimeRequest, ServiceTypeResponse, TimeSlotResponse, UUID } from '../../core/models/domain.model';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

const HOUR_START = 7;
const HOUR_END = 21;
const SLOT_HEIGHT = 60;

@Component({
  selector: 'app-professional-appointments',
  standalone: true,
  imports: [PageShellComponent, CardComponent, BadgeComponent, ButtonComponent, EmptyStateComponent, FormsModule],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-5xl">
        <!-- Header -->
        <div class="mb-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-[var(--text-primary)]">Appuntamenti</h2>
            <p class="text-sm text-[var(--text-secondary)]">Gestisci i tuoi appuntamenti</p>
          </div>
          <div class="flex items-center gap-3">
            <app-button (click)="openNewAppointment()">+ Nuovo</app-button>
            <!-- View toggle -->
            <div class="flex gap-1 rounded-lg border border-[var(--surface-card-border)] p-0.5">
              <button (click)="viewMode.set('list')"
                [class]="viewMode() === 'list'
                  ? 'rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors'">
                Lista
              </button>
              <button (click)="viewMode.set('calendar')"
                [class]="viewMode() === 'calendar'
                  ? 'rounded-md bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors'">
                Calendario
              </button>
            </div>
          </div>
        </div>

        <!-- Day nav (calendar mode) -->
        @if (viewMode() === 'calendar') {
          <div class="mb-4 flex items-center gap-4">
            <app-button variant="secondary" (click)="prevDay()">←</app-button>
            <div class="text-center flex-1">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ dateLabel() }}</h3>
              @if (isToday()) {
                <span class="text-xs text-indigo-600 font-medium">Oggi</span>
              }
            </div>
            <app-button variant="secondary" (click)="nextDay()">→</app-button>
          </div>
          <!-- Week quick-nav -->
          <div class="mb-6 grid grid-cols-7 gap-1">
            @for (d of weekDays(); track d.date) {
              <button (click)="goToDate(d.date)"
                [class]="d.date === currentDate()
                  ? 'rounded-lg bg-[var(--color-primary)] px-2 py-2 text-center text-white'
                  : 'rounded-lg border border-[var(--surface-card-border)] px-2 py-2 text-center text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors'">
                <div class="text-xs">{{ d.dayLabel }}</div>
                <div class="text-sm font-semibold">{{ d.dayNum }}</div>
              </button>
            }
          </div>
        }

        <!-- Status filter (list mode) -->
        @if (viewMode() === 'list') {
          <div class="mb-4 flex flex-wrap items-center gap-3">
            @for (f of statusFilters; track f.value) {
              <button (click)="onFilterChange(f.value)"
                [class]="statusFilter() === f.value
                  ? 'rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-medium text-white'
                  : 'rounded-full border border-[var(--surface-card-border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] transition-colors'">
                {{ f.label }}
              </button>
            }
          </div>
        }

        @if (isLoading()) {
          <div class="flex justify-center py-12">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
          </div>
        } @else {

          <!-- ── CALENDAR VIEW ── -->
          @if (viewMode() === 'calendar') {
            @if (dayAppointments().length === 0) {
              <app-empty-state
                icon="📅"
                title="Nessun appuntamento"
                description="Nessun appuntamento per questa giornata."
              />
            } @else {
              <div class="rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-card)] overflow-hidden">
                <!-- calendar body: time labels + single column -->
                <div class="relative grid" style="grid-template-columns: 56px 1fr;" [style.height.px]="calendarHeight">
                  <!-- Hour labels -->
                  <div class="border-r border-[var(--surface-card-border)]">
                    @for (h of hours; track h) {
                      <div class="absolute pr-2 text-right text-[10px] text-[var(--text-tertiary)] w-[56px]"
                           [style.top.px]="(h - hourStart) * slotHeight"
                           style="line-height: 0; transform: translateY(-6px);">
                        {{ h }}:00
                      </div>
                    }
                  </div>
                  <!-- Appointments column -->
                  <div class="relative">
                    @for (h of hours; track h) {
                      <div class="absolute inset-x-0 border-t border-[var(--surface-card-border)]" [style.top.px]="(h - hourStart) * slotHeight"></div>
                    }
                    @for (apt of dayAppointments(); track apt.id) {
                      <div class="absolute inset-x-1 rounded-lg px-2 py-1 text-xs overflow-hidden border-l-4 cursor-pointer hover:opacity-90 transition-opacity"
                           [style.top.px]="calendarTop(apt)"
                           [style.height.px]="calendarBlockHeight(apt)"
                           [style.min-height.px]="28"
                           [style.background-color]="aptBg(apt)"
                           [style.border-left-color]="aptBorder(apt)">
                        <div class="font-semibold truncate text-gray-900 dark:text-gray-100">
                          {{ formatTime(apt.startDatetime) }} — {{ apt.clientFullName }}
                        </div>
                        @if (calendarBlockHeight(apt) > 32 && apt.serviceTypeName) {
                          <div class="truncate text-gray-600 dark:text-gray-300 text-[10px]">{{ apt.serviceTypeName }}</div>
                        }
                        @if (calendarBlockHeight(apt) > 52) {
                          <div class="mt-1 flex items-center gap-2">
                            @if (apt.status === 'REQUESTED') {
                              <button (click)="doAction(apt.id, 'confirm'); $event.stopPropagation()"
                                class="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700 hover:bg-green-200 transition-colors">
                                Conferma
                              </button>
                              <button (click)="openProposePanel(apt); $event.stopPropagation()"
                                class="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200 transition-colors">
                                Proponi orario
                              </button>
                              <button (click)="doAction(apt.id, 'cancel'); $event.stopPropagation()"
                                class="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 hover:bg-red-200 transition-colors">
                                Cancella
                              </button>
                            } @else if (apt.status === 'CONFIRMED') {
                              <button (click)="doAction(apt.id, 'complete'); $event.stopPropagation()"
                                class="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700 hover:bg-gray-200 transition-colors">
                                Completa
                              </button>
                              <button (click)="openProposePanel(apt); $event.stopPropagation()"
                                class="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 hover:bg-blue-200 transition-colors">
                                Modifica
                              </button>
                              <button (click)="doAction(apt.id, 'no-show'); $event.stopPropagation()"
                                class="rounded bg-purple-100 px-1.5 py-0.5 text-[10px] font-medium text-purple-700 hover:bg-purple-200 transition-colors">
                                No-show
                              </button>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>
            }
          }

          <!-- ── LIST VIEW ── -->
          @if (viewMode() === 'list') {
            @if (appointments().length === 0) {
              <app-empty-state
                icon="📅"
                title="Nessun appuntamento"
                [description]="statusFilter() ? 'Nessun appuntamento con questo stato.' : 'Crea il primo appuntamento cliccando + Nuovo.'"
              />
            } @else {
              <app-card extraClass="!p-0 overflow-hidden">
                <div class="divide-y divide-[var(--surface-card-border)]">
                  @for (apt of appointments(); track apt.id) {
                    <div class="flex items-center gap-4 px-5 py-4 hover:bg-[var(--surface-hover)] transition-colors overflow-hidden min-w-0">
                      <!-- Date badge -->
                      <div class="hidden sm:flex flex-col items-center justify-center rounded-lg bg-[var(--status-accent-bg)] px-3 py-2 text-center shrink-0">
                        <span class="text-xs font-medium text-[var(--status-accent-text)]">{{ monthShort(apt.startDatetime) }}</span>
                        <span class="text-lg font-bold text-[var(--status-accent-text)]">{{ dayNum(apt.startDatetime) }}</span>
                      </div>
                      <!-- Info -->
                      <div class="min-w-0 flex-1">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="font-medium text-[var(--text-primary)] truncate min-w-0">{{ apt.clientFullName }}</span>
                          <span class="shrink-0"><app-badge [variant]="statusVariant(apt.status)">{{ statusLabel(apt.status) }}</app-badge></span>
                        </div>
                        <div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-[var(--text-secondary)]">
                          <span>{{ formatTime(apt.startDatetime) }} – {{ formatTime(apt.endDatetime) }}</span>
                          @if (apt.serviceTypeName) {
                            <span class="text-[var(--text-tertiary)]">·</span>
                            <span>{{ apt.serviceTypeName }}</span>
                          }
                        </div>
                      </div>
                      <!-- Actions -->
                      <div class="shrink-0 flex items-center gap-2">
                        @if (apt.status === 'REQUESTED') {
                          <button (click)="doAction(apt.id, 'confirm')" class="text-green-600 hover:text-green-800 font-medium text-sm transition-colors">Conferma</button>
                          <button (click)="openProposePanel(apt)" class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">Proponi</button>
                          <button (click)="doAction(apt.id, 'cancel')" class="text-red-600 hover:text-red-800 font-medium text-sm transition-colors">Cancella</button>
                        } @else if (apt.status === 'CONFIRMED') {
                          <button (click)="doAction(apt.id, 'complete')" class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium text-sm transition-colors">Completa</button>
                          <button (click)="openProposePanel(apt)" class="text-blue-600 hover:text-blue-800 font-medium text-sm transition-colors">Modifica</button>
                          <button (click)="doAction(apt.id, 'no-show')" class="text-purple-600 hover:text-purple-800 font-medium text-sm transition-colors">No-show</button>
                        } @else {
                          <span class="text-[var(--text-tertiary)] text-sm">—</span>
                        }
                      </div>
                    </div>
                  }
                </div>
              </app-card>
            }
          }
        }
      </div>

      <!-- ── NEW APPOINTMENT SLIDE-OVER ── -->
      @if (showNewPanel()) {
        <div class="fixed inset-0 z-50 flex justify-end">
          <div class="absolute inset-0 bg-black/30" (click)="closeNewAppointment()"></div>
          <div class="relative w-full max-w-md bg-[var(--surface-card)] shadow-xl overflow-y-auto">
            <div class="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--surface-card-border)] bg-[var(--surface-card)] px-6 py-4">
              <h3 class="text-lg font-semibold text-[var(--text-primary)]">Nuovo appuntamento</h3>
              <button (click)="closeNewAppointment()" class="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="p-6 space-y-5">
              <!-- Client selector -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Cliente</label>
                @if (!showQuickClient()) {
                  <select [(ngModel)]="newApt.clientId" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                    <option value="">Seleziona cliente...</option>
                    @for (c of clients(); track c.id) {
                      <option [value]="c.id">{{ c.firstName }} {{ c.lastName }}{{ c.email ? ' — ' + c.email : '' }}</option>
                    }
                  </select>
                  <button (click)="showQuickClient.set(true)" class="mt-2 text-sm text-[var(--color-primary)] hover:opacity-80 font-medium transition-opacity">
                    + Crea nuovo cliente
                  </button>
                } @else {
                  <!-- Quick create client inline -->
                  <div class="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-900/20 p-4 space-y-3">
                    <p class="text-xs font-semibold uppercase tracking-wider text-indigo-500">Nuovo cliente</p>
                    <div class="grid grid-cols-2 gap-3">
                      <div>
                        <label class="block text-xs text-[var(--text-secondary)] mb-1">Nome *</label>
                        <input type="text" [(ngModel)]="quickClient.firstName" class="w-full rounded-md border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                      <div>
                        <label class="block text-xs text-[var(--text-secondary)] mb-1">Cognome *</label>
                        <input type="text" [(ngModel)]="quickClient.lastName" class="w-full rounded-md border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                      </div>
                    </div>
                    <div>
                      <label class="block text-xs text-[var(--text-secondary)] mb-1">Email</label>
                      <input type="email" [(ngModel)]="quickClient.email" class="w-full rounded-md border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-xs text-[var(--text-secondary)] mb-1">Telefono</label>
                      <input type="tel" [(ngModel)]="quickClient.phone" class="w-full rounded-md border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-2.5 py-1.5 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                    </div>
                    <div class="flex items-center gap-2">
                      <app-button size="sm" [isLoading]="creatingClient()" [disabled]="!quickClient.firstName || !quickClient.lastName" (click)="createQuickClient()">Crea e seleziona</app-button>
                      <button (click)="cancelQuickClient()" class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Annulla</button>
                    </div>
                  </div>
                }
              </div>

              <!-- Service type -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Tipo di servizio</label>
                <select [(ngModel)]="newApt.serviceTypeId" (ngModelChange)="onServiceTypeChange()" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none">
                  <option value="">Nessuno (generico)</option>
                  @for (st of serviceTypes(); track st.id) {
                    <option [value]="st.id">{{ st.name }} ({{ st.durationMinutes }} min)</option>
                  }
                </select>
              </div>

              <!-- Date -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Data</label>
                <input type="date" [(ngModel)]="newApt.date" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
              </div>

              <!-- Time -->
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ora inizio</label>
                  <input type="time" [(ngModel)]="newApt.startTime" (ngModelChange)="autoCalcEnd()" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
                <div>
                  <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Ora fine</label>
                  <input type="time" [(ngModel)]="newApt.endTime" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" />
                </div>
              </div>

              <!-- Notes -->
              <div>
                <label class="block text-sm font-medium text-[var(--text-secondary)] mb-1">Note</label>
                <textarea [(ngModel)]="newApt.notes" rows="2" class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none" placeholder="Note opzionali..."></textarea>
              </div>

              <!-- Confirm immediately -->
              <label class="flex items-center gap-2 text-sm text-[var(--text-primary)]">
                <input type="checkbox" [(ngModel)]="newApt.confirmImmediately" class="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                Conferma immediatamente
              </label>

              @if (createError()) {
                <div class="rounded-lg bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-300">{{ createError() }}</div>
              }

              <!-- Actions -->
              <div class="flex items-center gap-3 pt-2">
                <app-button [isLoading]="creatingApt()" [disabled]="!canCreateAppointment()" (click)="createAppointment()">Crea appuntamento</app-button>
                <button (click)="closeNewAppointment()" class="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-medium transition-colors">Annulla</button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- ── PROPOSE NEW TIME PANEL ── -->
      @if (showProposePanel()) {
        <div class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
          <div class="relative w-full max-w-3xl rounded-t-2xl bg-[var(--surface-card)] shadow-2xl sm:rounded-2xl">
            <div class="flex items-start justify-between border-b border-[var(--surface-card-border)] px-4 py-4 sm:px-6">
              <div>
                <h3 class="text-base font-semibold text-[var(--text-primary)] sm:text-lg">Proponi nuovo orario</h3>
                <p class="mt-1 text-xs text-[var(--text-secondary)] sm:text-sm">
                  Cliente: <span class="font-medium text-[var(--text-primary)]">{{ selectedAppointmentForProposal()?.clientFullName }}</span>
                </p>
                <p class="text-xs text-[var(--text-secondary)] sm:text-sm">
                  Orario richiesto: <span class="font-medium text-[var(--text-primary)]">{{ formatProposalOriginalSlot() }}</span>
                </p>
              </div>
              <button (click)="closeProposePanel()" class="rounded-lg p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] transition-colors" aria-label="Chiudi pannello proposta">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="max-h-[75vh] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
              <!-- Proposta principale (obbligatoria) -->
              <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Proposta principale *</p>
              <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
                <div class="rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-hover)] p-4">
                  <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                  <input
                    type="date"
                    [value]="proposalDay()"
                    [min]="todayStr"
                    (change)="onProposalDateChange($event)"
                    class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div class="rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/60 dark:bg-blue-950/20 p-4">
                  @if (slotsLoading()) {
                    <div class="flex items-center gap-2 text-sm text-blue-700">
                      <div class="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"></div>
                      Caricamento disponibilità...
                    </div>
                  } @else if (availableProposalSlots().length === 0) {
                    <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                      Nessuno slot disponibile per questa data.
                    </div>
                  } @else {
                    <div>
                      <p class="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-100">Suggeriti vicini all'orario richiesto</p>
                      <div class="grid gap-2 sm:grid-cols-2">
                        @for (slot of nearbySuggestedSlots(); track slot.start) {
                          <button
                            (click)="selectProposalSlot(slot)"
                            [class]="proposalSlotButtonClass(slot, true)">
                            {{ formatProposalSlot(slot) }}
                          </button>
                        }
                      </div>
                    </div>

                    @if (otherProposalSlots().length > 0) {
                      <div class="mt-4 border-t border-blue-100 pt-3">
                      <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-300">Altri slot disponibili</p>
                        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                          @for (slot of otherProposalSlots(); track slot.start) {
                            <button
                              (click)="selectProposalSlot(slot)"
                              [class]="proposalSlotButtonClass(slot, false)">
                              {{ formatProposalSlot(slot) }}
                            </button>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              </div>
              @if (selectedProposalSlot()) {
                <p class="mt-2 text-xs text-green-700">✓ Proposta 1: {{ formatProposalSlot(selectedProposalSlot()!) }}</p>
              }

              <!-- Proposta alternativa 2 (opzionale) -->
              <div class="mt-5 border-t border-[var(--surface-card-border)] pt-4">
                <p class="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Proposta alternativa 2 (opzionale)</p>
                <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
                  <div class="rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-hover)] p-4">
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                    <input type="date" [value]="proposalDay2()" [min]="todayStr" (change)="onProposalDateChange2($event)"
                      class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div class="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    @if (slotsLoading2()) {
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600"></div>
                        Caricamento...
                      </div>
                    } @else if (proposalDay2() && availableProposalSlots2().length === 0) {
                      <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Nessuno slot disponibile.</div>
                    } @else if (availableProposalSlots2().length > 0) {
                      <div class="grid gap-2 sm:grid-cols-2">
                        @for (slot of availableProposalSlots2(); track slot.start) {
                          <button (click)="selectedProposalSlot2.set(slot)"
                            [class]="selectedProposalSlot2()?.start === slot.start
                              ? 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium border-indigo-600 bg-indigo-600 text-white'
                              : 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'">
                            {{ formatProposalSlot(slot) }}
                          </button>
                        }
                      </div>
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
                <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
                  <div class="rounded-xl border border-[var(--surface-card-border)] bg-[var(--surface-hover)] p-4">
                    <label class="mb-1 block text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Data</label>
                    <input type="date" [value]="proposalDay3()" [min]="todayStr" (change)="onProposalDateChange3($event)"
                      class="w-full rounded-lg border border-[var(--surface-card-border)] bg-[var(--surface-card)] text-[var(--text-primary)] px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div class="rounded-xl border border-gray-100 bg-gray-50 p-4">
                    @if (slotsLoading3()) {
                      <div class="flex items-center gap-2 text-sm text-gray-600">
                        <div class="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600"></div>
                        Caricamento...
                      </div>
                    } @else if (proposalDay3() && availableProposalSlots3().length === 0) {
                      <div class="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">Nessuno slot disponibile.</div>
                    } @else if (availableProposalSlots3().length > 0) {
                      <div class="grid gap-2 sm:grid-cols-2">
                        @for (slot of availableProposalSlots3(); track slot.start) {
                          <button (click)="selectedProposalSlot3.set(slot)"
                            [class]="selectedProposalSlot3()?.start === slot.start
                              ? 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium border-indigo-600 bg-indigo-600 text-white'
                              : 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'">
                            {{ formatProposalSlot(slot) }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
                @if (selectedProposalSlot3()) {
                  <p class="mt-2 text-xs text-green-700">✓ Proposta 3: {{ formatProposalSlot(selectedProposalSlot3()!) }}</p>
                }
              </div>

              @if (proposeError()) {
                <div class="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{{ proposeError() }}</div>
              }
            </div>

            <div class="flex flex-col-reverse gap-2 border-t border-[var(--surface-card-border)] px-4 py-3 sm:flex-row sm:justify-end sm:px-6">
              <app-button variant="secondary" (click)="closeProposePanel()">Annulla</app-button>
              <app-button [disabled]="!selectedProposalSlot()" [isLoading]="proposing()" (click)="submitProposedTime()">Invia proposta</app-button>
            </div>
          </div>
        </div>
      }
    </app-page-shell>
  `,
})
export class ProfessionalAppointmentsComponent implements OnInit {
  private readonly portalService = inject(ProfessionalPortalService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly viewMode = signal<'list' | 'calendar'>('calendar');
  readonly isLoading = signal(true);
  private readonly _all = signal<AppointmentResponse[]>([]);
  readonly statusFilter = signal<string>('');
  readonly currentDate = signal(this.toDateStr(new Date()));

  readonly hourStart = HOUR_START;
  readonly slotHeight = SLOT_HEIGHT;
  readonly hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  readonly calendarHeight = (HOUR_END - HOUR_START) * SLOT_HEIGHT;
  readonly todayStr = this.toDateStr(new Date());

  // ── New appointment panel state ──
  readonly showNewPanel = signal(false);
  readonly showQuickClient = signal(false);
  readonly creatingClient = signal(false);
  readonly creatingApt = signal(false);
  readonly createError = signal('');
  readonly clients = signal<ClientSummaryResponse[]>([]);
  readonly serviceTypes = signal<ServiceTypeResponse[]>([]);

  // ── Propose new time panel state ──
  readonly showProposePanel = signal(false);
  readonly slotsLoading = signal(false);
  readonly proposing = signal(false);
  readonly proposeError = signal('');
  readonly selectedAppointmentForProposal = signal<AppointmentResponse | null>(null);
  readonly availableProposalSlots = signal<TimeSlotResponse[]>([]);
  readonly selectedProposalSlot = signal<TimeSlotResponse | null>(null);
  readonly proposalDay = signal('');
  // Optional alternative slots 2 and 3
  readonly proposalDay2 = signal('');
  readonly availableProposalSlots2 = signal<TimeSlotResponse[]>([]);
  readonly slotsLoading2 = signal(false);
  readonly selectedProposalSlot2 = signal<TimeSlotResponse | null>(null);
  readonly proposalDay3 = signal('');
  readonly availableProposalSlots3 = signal<TimeSlotResponse[]>([]);
  readonly slotsLoading3 = signal(false);
  readonly selectedProposalSlot3 = signal<TimeSlotResponse | null>(null);

  newApt = this.freshAppointment();
  quickClient = { firstName: '', lastName: '', email: '', phone: '' };

  readonly canCreateAppointment = computed(() =>
    !!this.newApt.clientId && !!this.newApt.date && !!this.newApt.startTime && !!this.newApt.endTime
  );

  readonly statusFilters = [
    { value: '', label: 'Tutti' },
    { value: 'REQUESTED', label: 'Da confermare' },
    { value: 'CONFIRMED', label: 'Confermati' },
    { value: 'COMPLETED', label: 'Completati' },
    { value: 'CANCELLED', label: 'Cancellati' },
  ];

  readonly appointments = computed(() => {
    const f = this.statusFilter();
    return f ? this._all().filter((a) => a.status === f) : this._all();
  });

  readonly dayAppointments = computed(() => {
    const d = this.currentDate();
    return this._all()
      .filter((a) => a.startDatetime.startsWith(d))
      .sort((a, b) => a.startDatetime.localeCompare(b.startDatetime));
  });

  readonly dateLabel = computed(() => {
    const d = new Date(this.currentDate() + 'T00:00:00');
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
  });

  readonly isToday = computed(() => this.currentDate() === this.toDateStr(new Date()));

  readonly weekDays = computed(() => {
    const cur = new Date(this.currentDate() + 'T00:00:00');
    const dow = cur.getDay() || 7;
    const monday = new Date(cur);
    monday.setDate(cur.getDate() - dow + 1);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return { date: this.toDateStr(d), dayLabel: d.toLocaleDateString('it-IT', { weekday: 'short' }), dayNum: d.getDate() };
    });
  });

  readonly nearbySuggestedSlots = computed(() => {
    const apt = this.selectedAppointmentForProposal();
    const slots = this.availableProposalSlots();
    if (!apt || slots.length === 0) return [];
    const target = new Date(apt.startDatetime).getTime();
    return [...slots]
      .sort((a, b) => Math.abs(new Date(a.start).getTime() - target) - Math.abs(new Date(b.start).getTime() - target))
      .slice(0, 6);
  });

  readonly otherProposalSlots = computed(() => {
    const suggested = new Set(this.nearbySuggestedSlots().map((s) => s.start));
    return this.availableProposalSlots().filter((s) => !suggested.has(s.start)).slice(0, 18);
  });

  ngOnInit(): void {
    this.statusFilter.set(this.route.snapshot.queryParamMap.get('status') || '');
    this.loadData();
  }

  onFilterChange(v: string): void {
    this.statusFilter.set(v);
  }

  prevDay(): void { this.shiftDate(-1); }
  nextDay(): void { this.shiftDate(1); }

  goToDate(date: string): void { this.currentDate.set(date); }

  loadData(): void {
    this.isLoading.set(true);
    this.portalService.listAppointments(0, 200).subscribe({
      next: (page) => { this._all.set(page.content); this.isLoading.set(false); },
      error: () => this.isLoading.set(false),
    });
  }

  doAction(id: string, type: 'confirm' | 'cancel' | 'complete' | 'no-show'): void {
    const req =
      type === 'confirm' ? this.portalService.confirmAppointment(id) :
      type === 'cancel'  ? this.portalService.cancelAppointment(id) :
      type === 'complete' ? this.portalService.completeAppointment(id) :
      this.portalService.noShowAppointment(id);

    req.subscribe({ next: (updated) => this._all.update((list) => list.map((a) => a.id === updated.id ? updated : a)) });
  }

  calendarTop(apt: AppointmentResponse): number {
    const d = new Date(apt.startDatetime);
    return ((d.getHours() - HOUR_START) * 60 + d.getMinutes()) / 60 * SLOT_HEIGHT;
  }

  calendarBlockHeight(apt: AppointmentResponse): number {
    const mins = (new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000;
    return (mins / 60) * SLOT_HEIGHT;
  }

  aptBg(apt: AppointmentResponse): string {
    return apt.serviceTypeColor ? apt.serviceTypeColor + '22' : '#F3F4F6';
  }

  aptBorder(apt: AppointmentResponse): string {
    return apt.serviceTypeColor || '#9CA3AF';
  }

  statusLabel(status: AppointmentStatus): string {
    const map: Record<string, string> = { REQUESTED: 'Da confermare', CONFIRMED: 'Confermato', PROPOSED_NEW_TIME: 'Proposta', CANCELLED: 'Cancellato', COMPLETED: 'Completato', NO_SHOW: 'Non presentato' };
    return map[status] ?? status;
  }

  statusVariant(status: AppointmentStatus): 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple' {
    const map: Record<string, 'amber' | 'green' | 'blue' | 'red' | 'gray' | 'purple'> = { REQUESTED: 'amber', CONFIRMED: 'green', PROPOSED_NEW_TIME: 'blue', CANCELLED: 'red', COMPLETED: 'gray', NO_SHOW: 'purple' };
    return map[status] ?? 'gray';
  }

  monthShort(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { month: 'short' }).toUpperCase();
  }

  dayNum(iso: string): string {
    return new Date(iso).getDate().toString();
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('it-IT', { weekday: 'short', day: '2-digit', month: 'short' });
  }

  formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  // ── New Appointment Panel ──

  openNewAppointment(): void {
    this.showNewPanel.set(true);
    this.createError.set('');
    this.newApt = this.freshAppointment();
    this.portalService.listClients().subscribe({ next: (c) => this.clients.set(c) });
    this.portalService.listServiceTypes().subscribe({ next: (s) => this.serviceTypes.set(s) });
  }

  closeNewAppointment(): void {
    this.showNewPanel.set(false);
    this.showQuickClient.set(false);
  }

  createQuickClient(): void {
    this.creatingClient.set(true);
    const req: CreateClientRequest = {
      firstName: this.quickClient.firstName.trim(),
      lastName: this.quickClient.lastName.trim(),
      email: this.quickClient.email.trim() || undefined,
      phone: this.quickClient.phone.trim() || undefined,
    };
    this.portalService.createClient(req).subscribe({
      next: (client) => {
        this.clients.update((list) => [...list, client]);
        this.newApt.clientId = client.id;
        this.quickClient = { firstName: '', lastName: '', email: '', phone: '' };
        this.showQuickClient.set(false);
        this.creatingClient.set(false);
      },
      error: () => this.creatingClient.set(false),
    });
  }

  cancelQuickClient(): void {
    this.showQuickClient.set(false);
    this.quickClient = { firstName: '', lastName: '', email: '', phone: '' };
  }

  onServiceTypeChange(): void {
    const st = this.serviceTypes().find((s) => s.id === this.newApt.serviceTypeId);
    if (st && this.newApt.startTime) { this.autoCalcEnd(st.durationMinutes); }
  }

  autoCalcEnd(durationMinutes?: number): void {
    if (!this.newApt.startTime) return;
    const mins = durationMinutes ?? this.serviceTypes().find((s) => s.id === this.newApt.serviceTypeId)?.durationMinutes;
    if (!mins) return;
    const [h, m] = this.newApt.startTime.split(':').map(Number);
    const end = new Date(2000, 0, 1, h, m + mins);
    this.newApt.endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;
  }

  createAppointment(): void {
    this.creatingApt.set(true);
    this.createError.set('');
    const profId = this.authService.user()?.professionalId;
    if (!profId) { this.createError.set('ID professionista non trovato'); this.creatingApt.set(false); return; }

    const startIso = new Date(`${this.newApt.date}T${this.newApt.startTime}:00`).toISOString();
    const endIso = new Date(`${this.newApt.date}T${this.newApt.endTime}:00`).toISOString();

    const req: CreateAppointmentRequest = {
      professionalId: profId as UUID,
      clientId: this.newApt.clientId as UUID,
      serviceTypeId: this.newApt.serviceTypeId ? this.newApt.serviceTypeId as UUID : undefined,
      startDatetime: startIso,
      endDatetime: endIso,
      notes: this.newApt.notes || undefined,
      confirmImmediately: this.newApt.confirmImmediately,
    };

    this.portalService.createAppointment(req).subscribe({
      next: () => {
        this.creatingApt.set(false);
        this.closeNewAppointment();
        this.loadData();
      },
      error: (err) => {
        this.creatingApt.set(false);
        this.createError.set(err?.error?.message || 'Errore nella creazione');
      },
    });
  }

  openProposePanel(apt: AppointmentResponse): void {
    this.selectedAppointmentForProposal.set(apt);
    this.proposalDay.set(this.toDateStr(new Date(apt.startDatetime)));
    this.proposalDay2.set('');
    this.proposalDay3.set('');
    this.selectedProposalSlot.set(null);
    this.selectedProposalSlot2.set(null);
    this.selectedProposalSlot3.set(null);
    this.availableProposalSlots.set([]);
    this.availableProposalSlots2.set([]);
    this.availableProposalSlots3.set([]);
    this.proposeError.set('');
    this.showProposePanel.set(true);
    this.loadProposalSlots();
  }

  closeProposePanel(): void {
    this.showProposePanel.set(false);
    this.proposing.set(false);
    this.slotsLoading.set(false);
    this.selectedAppointmentForProposal.set(null);
    this.selectedProposalSlot.set(null);
    this.selectedProposalSlot2.set(null);
    this.selectedProposalSlot3.set(null);
    this.availableProposalSlots.set([]);
    this.availableProposalSlots2.set([]);
    this.availableProposalSlots3.set([]);
    this.proposalDay2.set('');
    this.proposalDay3.set('');
    this.proposeError.set('');
  }

  onProposalDateChange(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDay.set(input.value);
    this.selectedProposalSlot.set(null);
    this.loadProposalSlots();
  }

  selectProposalSlot(slot: TimeSlotResponse): void {
    this.selectedProposalSlot.set(slot);
  }

  submitProposedTime(): void {
    const apt = this.selectedAppointmentForProposal();
    const slot = this.selectedProposalSlot();
    if (!apt || !slot) return;

    const slot2 = this.selectedProposalSlot2();
    const slot3 = this.selectedProposalSlot3();
    const selectedSlots = [slot, slot2, slot3].filter(
      (candidate): candidate is TimeSlotResponse => candidate !== null,
    );
    if (new Set(selectedSlots.map(candidate => candidate.start)).size !== selectedSlots.length) {
      this.proposeError.set('Le proposte di orario devono essere distinte.');
      return;
    }
    const payload: ProposeNewTimeRequest = {
      proposedStart: slot.start,
      proposedEnd: slot.end,
      ...(slot2 ? { proposedStart2: slot2.start, proposedEnd2: slot2.end } : {}),
      ...(slot3 ? { proposedStart3: slot3.start, proposedEnd3: slot3.end } : {}),
    };

    this.proposing.set(true);
    this.proposeError.set('');
    this.portalService.proposeNewTime(apt.id, payload).subscribe({
      next: (updated) => {
        this._all.update((list) => list.map((a) => a.id === updated.id ? updated : a));
        this.proposing.set(false);
        this.closeProposePanel();
      },
      error: (err) => {
        this.proposing.set(false);
        this.proposeError.set(err?.error?.message || 'Impossibile inviare la proposta orario');
      },
    });
  }

  proposalSlotButtonClass(slot: TimeSlotResponse, suggested: boolean): string {
    const selected = this.selectedProposalSlot()?.start === slot.start;
    const base = 'w-full rounded-lg border px-3 py-2 text-left text-sm font-medium transition-colors';
    if (selected) {
      return `${base} border-indigo-600 bg-indigo-600 text-white`;
    }
    if (suggested) {
      return `${base} border-blue-200 bg-white text-blue-800 hover:border-blue-400 hover:bg-blue-100`;
    }
    return `${base} border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
  }

  formatProposalSlot(slot: TimeSlotResponse): string {
    return `${this.formatTime(slot.start)} - ${this.formatTime(slot.end)}`;
  }

  formatProposalOriginalSlot(): string {
    const apt = this.selectedAppointmentForProposal();
    if (!apt) return '';
    return `${this.formatDate(apt.startDatetime)} ${this.formatTime(apt.startDatetime)} - ${this.formatTime(apt.endDatetime)}`;
  }

  private freshAppointment() {
    return { clientId: '', serviceTypeId: '', date: this.toDateStr(new Date()), startTime: '', endTime: '', notes: '', confirmImmediately: true };
  }

  onProposalDateChange2(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDay2.set(input.value);
    this.selectedProposalSlot2.set(null);
    this.loadProposalSlots2();
  }

  onProposalDateChange3(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    if (!input?.value) return;
    this.proposalDay3.set(input.value);
    this.selectedProposalSlot3.set(null);
    this.loadProposalSlots3();
  }

  private loadProposalSlots(): void {
    const apt = this.selectedAppointmentForProposal();
    if (!apt || !this.proposalDay()) return;

    const durationMinutes = Math.max(5, Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000));

    this.slotsLoading.set(true);
    this.proposeError.set('');
    this.portalService.getAvailableSlots(this.proposalDay(), durationMinutes).subscribe({
      next: (slots) => {
        this.availableProposalSlots.set(slots);
        this.slotsLoading.set(false);
      },
      error: (err) => {
        this.slotsLoading.set(false);
        this.availableProposalSlots.set([]);
        this.proposeError.set(err?.error?.message || 'Errore nel caricamento degli slot disponibili');
      },
    });
  }

  private loadProposalSlots2(): void {
    const apt = this.selectedAppointmentForProposal();
    if (!apt || !this.proposalDay2()) return;
    const durationMinutes = Math.max(5, Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000));
    this.slotsLoading2.set(true);
    this.portalService.getAvailableSlots(this.proposalDay2(), durationMinutes).subscribe({
      next: slots => { this.availableProposalSlots2.set(slots); this.slotsLoading2.set(false); },
      error: () => { this.availableProposalSlots2.set([]); this.slotsLoading2.set(false); },
    });
  }

  private loadProposalSlots3(): void {
    const apt = this.selectedAppointmentForProposal();
    if (!apt || !this.proposalDay3()) return;
    const durationMinutes = Math.max(5, Math.round((new Date(apt.endDatetime).getTime() - new Date(apt.startDatetime).getTime()) / 60000));
    this.slotsLoading3.set(true);
    this.portalService.getAvailableSlots(this.proposalDay3(), durationMinutes).subscribe({
      next: slots => { this.availableProposalSlots3.set(slots); this.slotsLoading3.set(false); },
      error: () => { this.availableProposalSlots3.set([]); this.slotsLoading3.set(false); },
    });
  }

  private shiftDate(days: number): void {
    const d = new Date(this.currentDate() + 'T00:00:00');
    d.setDate(d.getDate() + days);
    this.currentDate.set(this.toDateStr(d));
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
