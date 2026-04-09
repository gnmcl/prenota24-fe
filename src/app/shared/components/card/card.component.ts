import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  template: `
    <div [class]="'rounded-2xl border border-gray-200 bg-white p-8 shadow-sm ' + extraClass">
      <ng-content />
    </div>
  `,
})
export class CardComponent {
  @Input() extraClass = '';
}
