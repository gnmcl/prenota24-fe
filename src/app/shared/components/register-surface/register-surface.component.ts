import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-register-surface',
  standalone: true,
  template: `
    <section [class]="'h-full bg-[var(--surface-card)] ' + extraClass">
      <ng-content />
    </section>
  `,
  styles: [':host { display: block; min-width: 0; }'],
})
export class RegisterSurfaceComponent {
  @Input() extraClass = '';
}
