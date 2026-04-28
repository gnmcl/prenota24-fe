import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [ButtonComponent],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          (click)="onCancel.emit()"
        ></div>
        <div class="relative mx-4 w-full max-w-sm rounded-2xl border border-[var(--surface-card-border)] bg-[var(--surface-card)] p-6 shadow-2xl">
          <h3 class="text-lg font-bold text-[var(--text-primary)]">{{ title }}</h3>
          <p class="mt-2 text-sm text-[var(--text-secondary)]">{{ message }}</p>
          <div class="mt-6 flex gap-3 justify-end">
            <app-button variant="secondary" (click)="onCancel.emit()" [disabled]="isLoading">
              Annulla
            </app-button>
            <app-button variant="danger" (click)="onConfirm.emit()" [isLoading]="isLoading">
              {{ confirmLabel }}
            </app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = '';
  @Input() message = '';
  @Input() confirmLabel = 'Conferma';
  @Input() isLoading = false;
  @Output() onConfirm = new EventEmitter<void>();
  @Output() onCancel = new EventEmitter<void>();
}
