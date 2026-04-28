import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center py-12 text-center">
      <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--surface-subtle)] border border-[var(--surface-subtle-border)]">
        <span class="text-2xl">{{ icon() }}</span>
      </div>
      <h3 class="text-lg font-semibold text-[var(--text-primary)]">{{ title() }}</h3>
      @if (description()) {
        <p class="mt-1 max-w-sm text-sm text-[var(--text-secondary)]">{{ description() }}</p>
      }
      @if (actionLabel() && actionRoute()) {
        <a [routerLink]="actionRoute()"
          class="mt-4 rounded-lg bg-[var(--button-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--text-inverted)] shadow-sm hover:bg-[var(--button-primary-hover)] transition-colors">
          {{ actionLabel() }}
        </a>
      } @else if (actionLabel()) {
        <button (click)="action.emit()"
          class="mt-4 rounded-lg bg-[var(--button-primary-bg)] px-4 py-2 text-sm font-medium text-[var(--text-inverted)] shadow-sm hover:bg-[var(--button-primary-hover)] transition-colors">
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
  readonly actionRoute = input<string>('');
  readonly action = output();
}
