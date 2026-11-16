import { Component, OnInit, ViewEncapsulation, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { HomeAgendaPreviewComponent } from './home-agenda-preview.component';
import { HomeBookingStepsComponent } from './home-booking-steps.component';
import { HomeClosingComponent } from './home-closing.component';
import { HomeFaqComponent } from './home-faq.component';
import { HomeFeaturesComponent } from './home-features.component';
import { HomeHeroCollageComponent } from './home-hero-collage.component';
import { HomeNavComponent } from './home-nav.component';
import { HomeRemindersComponent } from './home-reminders.component';

/**
 * Public landing page. Layout contract: every section is one or two screens tall, every block sits
 * on the shared `.wrap` lines, and the page uses the app's own tokens (DESIGN.md) on one ground.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink,
    HomeNavComponent,
    HomeHeroCollageComponent,
    HomeAgendaPreviewComponent,
    HomeBookingStepsComponent,
    HomeRemindersComponent,
    HomeFeaturesComponent,
    HomeFaqComponent,
    HomeClosingComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
  // The landing system is shared by the nav, collage, agenda frame and steps; every rule is scoped under .landing.
  encapsulation: ViewEncapsulation.None,
})
export class HomeComponent implements OnInit {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);


  ngOnInit(): void {
    const pageTitle = 'Prenota24: agenda online per studi su appuntamento';
    const description =
      'Prenotazioni dalla pagina dello studio, agenda condivisa con il team, promemoria email 24 ore prima, messaggi WhatsApp ed eventi.';
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: 'description', content: description });
    this.meta.updateTag({ property: 'og:title', content: pageTitle });
    this.meta.updateTag({ property: 'og:description', content: description });
  }
}
