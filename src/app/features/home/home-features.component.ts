import { Component, ViewEncapsulation } from '@angular/core';

/** Landing section "funzioni": WhatsApp messages, team portal, events and client records. */
@Component({
  selector: 'section[appHomeFeatures]',
  standalone: true,
  templateUrl: './home-features.component.html',
  styleUrl: './home-features.component.css',
  // Shares the landing system's unencapsulated, .landing-scoped rules (see home.component.css).
  encapsulation: ViewEncapsulation.None,
})
export class HomeFeaturesComponent {}
