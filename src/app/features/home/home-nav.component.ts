import { Component, HostListener, OnDestroy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

interface PanelLink {
  readonly label: string;
  readonly href: string;
  readonly line: string;
}

/**
 * Fixed landing header. Desktop: four section words, the "Funzioni" panel on hover or focus,
 * sign in and the main action. Under 1024px: the main action beside a menu button; under 640px
 * the menu opens a full-screen sheet that holds the main action too.
 */
@Component({
  selector: 'app-home-nav',
  standalone: true,
  imports: [RouterLink],
  template: `
    <header class="nav" [class.is-open]="menuOpen()">
      <div class="wrap nav__bar">
        <a class="skip-link" href="#top">Vai al contenuto</a>
        <a href="#top" class="brand" aria-label="Prenota24, inizio pagina" (click)="close()"
          ><span class="logo-tile" aria-hidden="true">P24</span><span>Prenota24</span></a
        >

        <nav class="nav__words" aria-label="Sezioni della pagina">
          <a class="nav__word" href="#agenda">Agenda</a>
          <a class="nav__word" href="#come-funziona">Come funziona</a>
          <div
            class="nav__mega"
            [class.is-shown]="panelOpen()"
            (mouseenter)="openPanelSoon()"
            (mouseleave)="closePanel()"
            (focusin)="panelOpen.set(true)"
            (focusout)="onPanelFocusOut($event)"
          >
            <a class="nav__word" href="#funzioni" (click)="closePanel()">Funzioni</a>
            <div class="nav__panel">
              <div class="wrap nav__panel-grid">
                <ul class="nav__panel-links">
                  @for (item of panelLinks; track item.href) {
                    <li>
                      <a [href]="item.href" (click)="closePanel()"
                        ><span class="nav__panel-label">{{ item.label }}</span
                        ><span class="nav__panel-line">{{ item.line }}</span></a
                      >
                    </li>
                  }
                </ul>
                <a class="nav__panel-card" href="#agenda" (click)="closePanel()">
                  <span class="nav__panel-shot" aria-hidden="true">
                    <span><b>09:00</b> Giulia Rossi <i class="dot dot--green"></i></span>
                    <span class="is-sel"><b>10:00</b> Marco Bianchi <i class="dot dot--amber"></i></span>
                    <span><b>11:30</b> Sara Ricci <i class="dot dot--green"></i></span>
                  </span>
                  <span class="nav__panel-label">Agenda</span>
                </a>
              </div>
            </div>
          </div>
          <a class="nav__word" href="#domande">Domande</a>
        </nav>

        <div class="nav__actions">
          <a class="nav__word nav__signin" routerLink="/accedi">Accedi</a>
          <a class="btn btn--primary nav__cta" routerLink="/registrati">Crea il tuo studio</a>
          <button
            type="button"
            class="nav__toggle"
            [attr.aria-expanded]="menuOpen()"
            aria-controls="landing-menu"
            [attr.aria-label]="menuOpen() ? 'Chiudi il menu' : 'Apri il menu'"
            (click)="toggle()"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              @if (menuOpen()) {
                <path d="M6 6l12 12M18 6 6 18" />
              } @else {
                <path d="M4 8h16M4 16h16" />
              }
            </svg>
          </button>
        </div>
      </div>

      @if (menuOpen()) {
        <nav id="landing-menu" class="sheet" aria-label="Menu" (click)="close()">
          <div class="wrap">
            <ul>
              <li><a href="#agenda">Agenda</a></li>
              <li><a href="#come-funziona">Come funziona</a></li>
              <li><a href="#funzioni">Funzioni</a></li>
              <li><a href="#domande">Domande</a></li>
              <li><a routerLink="/accedi">Accedi</a></li>
            </ul>
            <a class="btn btn--primary sheet__cta" routerLink="/registrati">Crea il tuo studio</a>
          </div>
        </nav>
      }
    </header>
  `,
  styles: [
    `
      :host { display: contents; }

      .nav__actions {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-left: auto;
      }
      .nav__signin { display: none; }

      .nav__toggle {
        display: grid;
        place-items: center;
        width: 44px;
        height: 44px;
        padding: 0;
        border: 1px solid var(--surface-input-border);
        border-radius: var(--r-control);
        background: var(--surface);
        color: var(--ink);
        cursor: pointer;
        transition: background-color 160ms var(--ease);
      }
      .nav__toggle:hover { background: var(--surface-hover); }
      .nav__toggle svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.6; stroke-linecap: round; }

      @media (max-width: 639px) {
        .nav__cta { display: none; }
      }

      @media (min-width: 1024px) {
        .nav__words { display: flex; }
        .nav__actions { margin-left: 8px; }
        .nav__signin { display: inline-flex; }
        .nav__toggle { display: none; }
      }

      /* the Funzioni panel: flat, full width, a 1px line, no shadow */
      .nav__panel {
        position: fixed;
        top: var(--nav);
        left: 0;
        right: 0;
        border-bottom: 1px solid var(--line);
        background: var(--ground);
        visibility: hidden;
        opacity: 0;
        transform: translateY(-4px);
        transition: opacity 160ms var(--ease), transform 160ms var(--ease), visibility 0s 160ms;
      }
      .nav__mega.is-shown .nav__panel {
        visibility: visible;
        opacity: 1;
        transform: none;
        transition: opacity 160ms var(--ease), transform 160ms var(--ease), visibility 0s;
      }
      .nav__panel-grid {
        display: grid;
        grid-template-columns: repeat(12, minmax(0, 1fr));
        column-gap: var(--col-gap);
        padding: 32px 0 40px;
      }
      .nav__panel-links {
        grid-column: 1 / span 8;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px var(--col-gap);
        align-content: start;
      }
      .nav__panel-links a {
        display: grid;
        gap: 2px;
        padding: 10px 12px;
        margin-left: -12px;
        border-radius: var(--r-control);
        transition: background-color 160ms var(--ease);
      }
      .nav__panel-links a:hover { background: var(--surface-hover); }
      .nav__panel-label { font-weight: 500; }
      .nav__panel-line { font-size: var(--t-small); color: var(--muted); }

      .nav__panel-card {
        grid-column: 9 / span 4;
        display: grid;
        gap: 12px;
        align-content: start;
      }
      .nav__panel-shot {
        display: grid;
        border: 1px solid var(--line);
        border-radius: var(--r-frame);
        background: var(--surface);
        overflow: hidden;
        font-size: var(--t-small);
        transition: transform 220ms var(--ease);
      }
      .nav__panel-card:hover .nav__panel-shot { transform: translateY(-2px); }
      .nav__panel-shot > span {
        display: grid;
        grid-template-columns: 48px 1fr auto;
        align-items: center;
        padding: 10px 14px;
      }
      .nav__panel-shot > span + span { border-top: 1px solid var(--line); }
      .nav__panel-shot > span.is-sel { background: var(--surface-active-nav); box-shadow: inset 2px 0 0 var(--action); }
      .nav__panel-shot b { font-weight: 600; }
      .dot { width: 8px; height: 8px; border-radius: 1px; }
      .dot--green { background: var(--status-success-text); }
      .dot--amber { background: var(--status-warning-text); }

      /* the phone and tablet sheet */
      .sheet {
        position: fixed;
        inset: var(--nav) 0 0;
        z-index: 9;
        overflow-y: auto;
        background: var(--ground);
        padding: 8px 0 32px;
      }
      .sheet ul { display: grid; }
      .sheet li a {
        display: flex;
        align-items: center;
        min-height: 56px;
        border-bottom: 1px solid var(--line);
        font-size: 18px;
        font-weight: 500;
      }
      .sheet__cta { width: 100%; height: 56px; margin-top: 24px; }
      @media (min-width: 640px) {
        .sheet__cta { display: none; }
      }
    `,
  ],
})
export class HomeNavComponent implements OnDestroy {
  readonly menuOpen = signal(false);
  readonly panelOpen = signal(false);

  readonly panelLinks: readonly PanelLink[] = [
    { label: 'Promemoria email', href: '#promemoria', line: 'Conferme, proposte e annullamenti' },
    { label: 'Messaggi WhatsApp', href: '#messaggi', line: 'Conversazioni legate all’appuntamento' },
    { label: 'Portale del team', href: '#team', line: 'Orari e appuntamenti di ognuno' },
    { label: 'Eventi', href: '#eventi', line: 'Pagina pubblica e posti massimi' },
    { label: 'Schede clienti', href: '#clienti', line: 'Note e storico degli appuntamenti' },
  ];

  private panelTimer: ReturnType<typeof setTimeout> | undefined;

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
    this.closePanel();
  }

  toggle(): void {
    this.menuOpen.update((open) => !open);
  }

  close(): void {
    this.menuOpen.set(false);
  }

  openPanelSoon(): void {
    clearTimeout(this.panelTimer);
    this.panelTimer = setTimeout(() => this.panelOpen.set(true), 150);
  }

  closePanel(): void {
    clearTimeout(this.panelTimer);
    this.panelOpen.set(false);
  }

  onPanelFocusOut(event: FocusEvent): void {
    const container = event.currentTarget as HTMLElement;
    const next = event.relatedTarget as Node | null;
    if (!next || !container.contains(next)) this.panelOpen.set(false);
  }

  ngOnDestroy(): void {
    clearTimeout(this.panelTimer);
  }
}
