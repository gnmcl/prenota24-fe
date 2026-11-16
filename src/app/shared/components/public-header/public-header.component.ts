import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Header of the public auth pages (/accedi, /registrati): the landing's fixed bar with the brand and
 * one way to the other page. Must sit inside a `.landing` root (src/styles/landing.css).
 */
@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="nav">
      <div class="wrap nav__bar">
        <a class="skip-link" href="#top">Vai al contenuto</a>
        <a routerLink="/" class="brand" aria-label="Prenota24, pagina iniziale"
          ><span class="logo-tile" aria-hidden="true">P24</span><span>Prenota24</span></a
        >
        <div class="public-header__end">
          <span class="public-header__prompt">{{ prompt() }}</span>
          <a class="btn btn--secondary public-header__action" [routerLink]="actionRoute()">{{ actionLabel() }}</a>
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      :host { display: contents; }
      .public-header__end {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-left: auto;
      }
      .public-header__prompt { display: none; font-size: var(--t-small); color: var(--muted); }
      @media (min-width: 640px) {
        .public-header__prompt { display: inline; }
      }
      @media (max-width: 639px) {
        .public-header__action { height: 44px; padding: 0 16px; font-size: var(--t-small); }
      }
    `,
  ],
})
export class PublicHeaderComponent {
  /** Short line before the action, shown from 640px ("Hai già un account?"). */
  readonly prompt = input.required<string>();
  readonly actionLabel = input.required<string>();
  readonly actionRoute = input.required<string>();
}
