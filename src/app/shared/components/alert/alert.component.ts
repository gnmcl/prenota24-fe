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
      error: 'bg-red-50 border-red-200 text-red-800',
      success: 'bg-green-50 border-green-200 text-green-800',
      info: 'bg-blue-50 border-blue-200 text-blue-800',
    };
    return map[this.variant] || '';
  }
}
