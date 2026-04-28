import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button',
  standalone: true,
  template: `
    <button
      [type]="type"
      [disabled]="disabled || isLoading"
      [class]="buttonClasses"
    >
      @if (isLoading) {
        <svg class="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
        </svg>
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'danger' = 'primary';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() extraClass = '';

  get buttonClasses(): string {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-card)] disabled:cursor-not-allowed';

    const variants: Record<string, string> = {
      primary:
        'bg-[var(--button-primary-bg)] text-[var(--text-inverted)] hover:bg-[var(--button-primary-hover)] focus-visible:ring-[var(--color-primary)] disabled:bg-[var(--button-primary-disabled)]',
      secondary:
        'bg-[var(--button-secondary-bg)] text-[var(--text-primary)] border border-[var(--button-secondary-border)] hover:bg-[var(--button-secondary-hover)] focus-visible:ring-[var(--surface-card-border)] disabled:opacity-60',
      danger:
        'bg-[var(--button-danger-bg)] text-[var(--text-inverted)] hover:bg-[var(--button-danger-hover)] focus-visible:ring-[var(--button-danger-bg)] disabled:bg-[var(--button-danger-disabled)]',
    };

    return `${base} ${variants[this.variant]} ${this.extraClass}`;
  }
}
