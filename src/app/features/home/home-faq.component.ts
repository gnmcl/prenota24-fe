import { Component, ViewEncapsulation } from '@angular/core';

/** Landing section "domande": open answers, a contact action and the booking page on a phone. */
@Component({
  selector: 'section[appHomeFaq]',
  standalone: true,
  templateUrl: './home-faq.component.html',
  styleUrl: './home-faq.component.css',
  // Shares the landing system's unencapsulated, .landing-scoped rules (see home.component.css).
  encapsulation: ViewEncapsulation.None,
})
export class HomeFaqComponent {}
