import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <span class="text-2xl">{{ icon() }}</span>
      </div>
      <h3 class="text-lg font-semibold text-gray-900">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-1 max-w-sm text-sm text-gray-500">{{ description() }}</p>
      }
      @if (actionLabel()) {
        <button (click)="action.emit()"
          class="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors">
          {{ actionLabel() }}
        </button>
      }
    </div>
  `,
})
export class EmptyStateComponent {
  readonly icon = input('📭');
  readonly title = input('Nessun elemento');
  readonly description = input<string>('');
  readonly actionLabel = input<string>('');
  readonly action = output();
}
