import { NgTemplateOutlet } from '@angular/common';
import { Component, signal } from '@angular/core';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

type PreviewStatus = 'REQUESTED' | 'CONFIRMED';

interface PreviewAppointment {
  readonly id: string;
  readonly time: string;
  readonly client: string;
  readonly service: string;
  readonly professional: string;
  readonly duration: string;
  readonly status: PreviewStatus;
  readonly actions: readonly [string, string];
}

/**
 * The product shown big on the landing page: one agenda window with the day's appointments beside
 * the open one. Rows are real buttons that open their detail; the detail's actions are drawn only.
 */
@Component({
  selector: 'app-home-agenda-preview',
  standalone: true,
  imports: [NgTemplateOutlet, BadgeComponent],
  templateUrl: './home-agenda-preview.component.html',
  styleUrl: './home-agenda-preview.component.css',
})
export class HomeAgendaPreviewComponent {
  readonly appointments: readonly PreviewAppointment[] = [
    {
      id: 'a1',
      time: '09:00',
      client: 'Giulia Rossi',
      service: 'Prima consulenza',
      professional: 'Elena Moretti',
      duration: '45 min',
      status: 'CONFIRMED',
      actions: ['Scrivi su WhatsApp', 'Segna come completato'],
    },
    {
      id: 'a2',
      time: '10:00',
      client: 'Marco Bianchi',
      service: 'Massaggio decontratturante',
      professional: 'Andrea Conti',
      duration: '50 min',
      status: 'REQUESTED',
      actions: ['Conferma', 'Proponi un altro orario'],
    },
    {
      id: 'a3',
      time: '11:30',
      client: 'Sara Ricci',
      service: 'Consulenza di controllo',
      professional: 'Elena Moretti',
      duration: '30 min',
      status: 'CONFIRMED',
      actions: ['Scrivi su WhatsApp', 'Segna come completato'],
    },
    {
      id: 'a4',
      time: '14:00',
      client: 'Luca Ferri',
      service: 'Trattamento viso',
      professional: 'Andrea Conti',
      duration: '60 min',
      status: 'CONFIRMED',
      actions: ['Scrivi su WhatsApp', 'Segna come completato'],
    },
  ];

  readonly selected = signal<PreviewAppointment>(this.appointments[1]);

  readonly pendingCount = this.appointments.filter((a) => a.status === 'REQUESTED').length;

  statusLabel(status: PreviewStatus): string {
    return status === 'REQUESTED' ? 'Da confermare' : 'Confermato';
  }

  statusVariant(status: PreviewStatus): 'amber' | 'green' {
    return status === 'REQUESTED' ? 'amber' : 'green';
  }
}
