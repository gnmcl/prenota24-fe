import { Component, ViewEncapsulation } from '@angular/core';

/** Landing section "promemoria": the client emails, the cancel link and the slot it frees. */
@Component({
  selector: 'section[appHomeReminders]',
  standalone: true,
  templateUrl: './home-reminders.component.html',
  styleUrl: './home-reminders.component.css',
  // Shares the landing system's unencapsulated, .landing-scoped rules (see home.component.css).
  encapsulation: ViewEncapsulation.None,
})
export class HomeRemindersComponent {}
