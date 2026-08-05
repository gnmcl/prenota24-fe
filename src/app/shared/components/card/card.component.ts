import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="'rounded-[var(--radius-lg)] border bg-[var(--surface-card)] border-[var(--surface-card-border)] p-4 sm:p-5 ' + extraClass">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  @Input() extraClass = '';
}
