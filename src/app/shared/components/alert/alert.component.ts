import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [NgClass],
  template: `
    <div
      role="alert"
      class="flex items-start justify-between rounded-lg border px-4 py-3 text-sm"
      [ngClass]="variantClasses"
    >
      <span>{{ message }}</span>
      @if (dismiss.observed) {
        <button
          type="button"
          (click)="dismiss.emit()"
          class="ml-4 font-medium underline hover:no-underline"
        >
          Dismiss
        </button>
      }
    </div>
  `,
})
export class AlertComponent {
  @Input({ required: true }) variant!: 'error' | 'success' | 'info';
  @Input({ required: true }) message!: string;
  @Output() dismiss = new EventEmitter<void>();

  get variantClasses(): string {
    const map: Record<string, string> = {
      error: 'bg-[var(--status-danger-bg)] border-[color:var(--status-danger-text)]/35 text-[var(--status-danger-text)]',
      success: 'bg-[var(--status-success-bg)] border-[color:var(--status-success-text)]/35 text-[var(--status-success-text)]',
      info: 'bg-[var(--status-info-bg)] border-[color:var(--status-info-text)]/35 text-[var(--status-info-text)]',
    };
    return map[this.variant] || '';
  }
}
