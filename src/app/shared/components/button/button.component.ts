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
  @Input() variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'icon' = 'md';
  @Input() isLoading = false;
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() extraClass = '';

  get buttonClasses(): string {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-[var(--radius-lg)] border text-sm font-semibold leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--surface-card)] disabled:cursor-not-allowed disabled:opacity-55';

    const sizes: Record<string, string> = {
      sm: 'min-h-9 px-3 py-2 text-xs',
      md: 'min-h-10 px-4 py-2.5',
      icon: 'h-10 w-10 p-0',
    };

    const variants: Record<string, string> = {
      primary:
        'border-[var(--button-primary-bg)] bg-[var(--button-primary-bg)] text-white hover:border-[var(--button-primary-hover)] hover:bg-[var(--button-primary-hover)] disabled:bg-[var(--button-primary-disabled)]',
      secondary:
        'border-[var(--button-secondary-border)] bg-[var(--button-secondary-bg)] text-[var(--text-primary)] hover:bg-[var(--button-secondary-hover)]',
      danger:
        'border-[var(--button-danger-bg)] bg-[var(--button-danger-bg)] text-white hover:bg-[var(--button-danger-hover)] disabled:bg-[var(--button-danger-disabled)]',
      ghost:
        'border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]',
    };

    return `${base} ${sizes[this.size]} ${variants[this.variant]} ${this.extraClass}`;
  }
}
