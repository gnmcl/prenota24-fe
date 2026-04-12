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
      indigo: 'bg-indigo-50 text-indigo-700',
      green: 'bg-green-50 text-green-700',
      red: 'bg-red-50 text-red-700',
      amber: 'bg-amber-50 text-amber-700',
      gray: 'bg-gray-100 text-gray-600',
      purple: 'bg-purple-50 text-purple-700',
      blue: 'bg-blue-50 text-blue-700',
    };
    return `${base} ${map[this.variant()] ?? map['gray']}`;
  }
}
