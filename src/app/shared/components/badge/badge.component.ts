import { Component, input } from '@angular/core';

@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [class]="classes()">
      <ng-content />
    </span>
  `,
})
export class BadgeComponent {
  readonly variant = input<'indigo' | 'green' | 'red' | 'amber' | 'gray' | 'purple' | 'blue'>('gray');

  classes() {
    const base = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold';
    const map: Record<string, string> = {
      indigo: 'bg-[var(--status-accent-bg)] text-[var(--status-accent-text)]',
      green: 'bg-[var(--status-success-bg)] text-[var(--status-success-text)]',
      red: 'bg-[var(--status-danger-bg)] text-[var(--status-danger-text)]',
      amber: 'bg-[var(--status-warning-bg)] text-[var(--status-warning-text)]',
      gray: 'bg-[var(--status-neutral-bg)] text-[var(--status-neutral-text)]',
      purple: 'bg-[var(--status-accent-bg)] text-[var(--status-accent-text)]',
      blue: 'bg-[var(--status-info-bg)] text-[var(--status-info-text)]',
    };
    return `${base} ${map[this.variant()] ?? map['gray']}`;
  }
}
