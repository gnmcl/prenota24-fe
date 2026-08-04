import { Component } from '@angular/core';
import { CardComponent } from '../card/card.component';

@Component({
  selector: 'app-entity-list',
  standalone: true,
  imports: [CardComponent],
  template: `
    <app-card extraClass="!p-0 overflow-hidden">
      <div class="divide-y divide-[var(--surface-card-border)]">
        <ng-content></ng-content>
      </div>
    </app-card>
  `,
})
export class EntityListComponent {}
