import { Component } from '@angular/core';
import { PageShellComponent } from '../../shared/components/page-shell/page-shell.component';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-agenda',
  standalone: true,
  imports: [PageShellComponent, CardComponent],
  template: `
    <app-page-shell>
      <div class="mx-auto max-w-2xl">
        <h2 class="mb-2 text-2xl font-bold text-gray-900">Agenda</h2>
        <app-card extraClass="text-center">
          <p class="text-gray-500">🚧 The professional agenda is coming soon.</p>
        </app-card>
      </div>
    </app-page-shell>
  `,
})
export class AgendaComponent {}
