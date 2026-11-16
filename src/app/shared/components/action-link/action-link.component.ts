import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** A navigation action with button styling and native link semantics. */
@Component({
  selector: 'app-action-link',
  standalone: true,
  imports: [RouterLink],
  template: `<a [routerLink]="route()" class="action-link"><ng-content /></a>`,
  styles: [
    `
      :host {
        display: inline-block;
      }
      .action-link {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        min-height: 44px;
        padding: 10px 16px;
        border: 1px solid var(--button-primary-bg);
        border-radius: var(--radius-lg);
        background: var(--button-primary-bg);
        color: #fff;
        font-size: 14px;
        font-weight: 600;
        text-decoration: none;
      }
      .action-link:hover {
        background: var(--button-primary-hover);
        border-color: var(--button-primary-hover);
      }
    `,
  ],
})
export class ActionLinkComponent {
  readonly route = input.required<string>();
}
