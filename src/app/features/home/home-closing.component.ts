import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Landing close and footer, one section: the main action once more, the page links and the legal row. */
@Component({
  selector: 'footer[appHomeClosing]',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './home-closing.component.html',
  styleUrl: './home-closing.component.css',
  // Shares the landing system's unencapsulated, .landing-scoped rules (see home.component.css).
  encapsulation: ViewEncapsulation.None,
})
export class HomeClosingComponent {
  readonly year = new Date().getFullYear();
}
