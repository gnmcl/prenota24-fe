import { NgTemplateOutlet } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';

interface BookingStep {
  readonly title: string;
  readonly text: string;
  readonly visualLabel: string;
}

/**
 * "Come funziona": the pinned-chapters moment, ported from the taste-skill kit.
 * Live (from 1024px wide and 640px tall, motion allowed): the section is two screens; its stage sticks
 * for one screen of scroll while the four steps open one at a time and the frame shows each step's
 * screen. Otherwise every step is a static row with its own screen.
 */
@Component({
  selector: 'section[appHomeBookingSteps]',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './home-booking-steps.component.html',
  styleUrl: './home-booking-steps.component.css',
  host: {
    'aria-labelledby': 'steps-title',
    'data-moment': 'pinned-chapters',
    '[class.is-live]': 'live()',
    // set once the component has mounted the moment (as the kit's moments.js marks a mounted moment)
    '[attr.data-moment-mounted]': 'mounted() ? "1" : null',
    '[style.--h]': '2',
    '[style.--hm]': '2',
  },
})
export class HomeBookingStepsComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly steps: readonly BookingStep[] = [
    {
      title: 'Il cliente sceglie l’orario',
      text: 'Dalla pagina dello studio sceglie il servizio e vede solo gli orari liberi dei professionisti che lo offrono.',
      visualLabel: 'Pagina di prenotazione con gli orari liberi di giovedì e le 11:15 selezionate',
    },
    {
      title: 'Lo studio conferma la richiesta',
      text: 'La richiesta arriva in agenda da confermare. Se l’orario non va, proponi un’alternativa: il cliente la accetta dall’email.',
      visualLabel: 'Richiesta di Marco Bianchi con i pulsanti Conferma e Proponi un altro orario e una proposta per venerdì alle 09:30',
    },
    {
      title: 'Partono conferma e promemoria',
      text: 'Prenota24 invia l’email di conferma e, 24 ore prima, il promemoria con il link per annullare.',
      visualLabel: 'Due email al cliente: appuntamento confermato e promemoria per domani alle 11:15',
    },
    {
      title: 'Segni com’è andata',
      text: 'Completato o non presentato: lo stato resta nello storico del cliente.',
      visualLabel: 'Appuntamento di Marco Bianchi segnato come completato',
    },
  ];

  readonly mounted = signal(false);
  readonly live = signal(false);
  readonly active = signal(0);

  constructor() {
    afterNextRender(() => {
      const wide = window.matchMedia('(min-width: 1024px) and (min-height: 640px)');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
      const sync = (): void => {
        this.live.set(wide.matches && !reduced.matches);
        this.track();
      };
      const onScroll = (): void => this.track();

      sync();
      this.mounted.set(true);
      wide.addEventListener('change', sync);
      reduced.addEventListener('change', sync);
      this.zone.runOutsideAngular(() => window.addEventListener('scroll', onScroll, { passive: true }));

      this.destroyRef.onDestroy(() => {
        wide.removeEventListener('change', sync);
        reduced.removeEventListener('change', sync);
        window.removeEventListener('scroll', onScroll);
      });
    });
  }

  private track(): void {
    if (!this.live()) return;
    const rect = this.host.nativeElement.getBoundingClientRect();
    const travel = rect.height - window.innerHeight;
    const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 0;
    const next = Math.min(this.steps.length - 1, Math.floor(progress * this.steps.length));
    if (next !== this.active()) this.zone.run(() => this.active.set(next));
  }
}
