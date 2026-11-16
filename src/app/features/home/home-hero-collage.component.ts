import { Component, DestroyRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * Hero collage: three sets of Prenota24 UI pieces (booking, reminders, team), crossfading every
 * 2.8 s with a pause button. Phones and reduced motion hold the first set.
 */
@Component({
  selector: 'app-home-hero-collage',
  standalone: true,
  templateUrl: './home-hero-collage.component.html',
  styleUrl: './home-hero-collage.component.css',
})
export class HomeHeroCollageComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly active = signal(0);
  readonly paused = signal(false);
  readonly looping = signal(false);

  readonly setLabels: readonly string[] = [
    'La pagina di prenotazione dello studio con gli orari liberi di giovedì 19 novembre e la richiesta di Marco Bianchi alle 11:15, da confermare',
    'L’agenda di giovedì con l’appuntamento delle 11:15 confermato e l’email di promemoria inviata il giorno prima',
    'Una conversazione WhatsApp con un cliente, l’evento Yoga al tramonto con 12 iscritti su 20 posti e gli appuntamenti di oggi del team',
  ];

  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    afterNextRender(() => {
      const still =
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        window.matchMedia('(max-width: 639px)').matches;
      if (still) return;
      this.looping.set(true);
      this.start();
    });
    this.destroyRef.onDestroy(() => this.stop());
  }

  togglePause(): void {
    if (this.paused()) {
      this.paused.set(false);
      this.start();
    } else {
      this.paused.set(true);
      this.stop();
    }
  }

  /** Hovering the collage restarts the cycle from the first set, unless the visitor paused it. */
  restart(): void {
    if (!this.looping() || this.paused()) return;
    this.active.set(0);
    this.start();
  }

  private start(): void {
    this.stop();
    this.timer = setInterval(() => this.active.update((i) => (i + 1) % this.setLabels.length), 2800);
  }

  private stop(): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }
}
