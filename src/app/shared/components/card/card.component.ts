import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="'rounded-2xl border bg-[var(--surface-card)] border-[var(--surface-card-border)] p-6 sm:p-8 shadow-[var(--shadow-card)] transition-shadow duration-200 hover:shadow-[var(--shadow-card-hover)] ' + extraClass">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  @Input() extraClass = '';
}
