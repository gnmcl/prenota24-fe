import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-entity-list-row',
  standalone: true,
  template: `
    <div
      (click)="onRowClick($event)"
      [class]="'group flex items-center gap-3 px-4 py-4 sm:px-5 min-w-0 transition-colors ' + (isClickable() ? 'hover:bg-[var(--surface-hover)] cursor-pointer' : '') + ' ' + extraClass"
    >
      <ng-content></ng-content>
      @if (showChevron) {
        <svg class="h-4 w-4 text-[var(--text-tertiary)] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      }
    </div>
  `,
})
export class EntityListRowComponent {
  private readonly router = inject(Router);

  @Input() route: string | readonly unknown[] | null = null;
  @Input() showChevron = true;
  @Input() clickable = true;
  @Input() extraClass = '';

  isClickable(): boolean {
    return !!this.route && this.clickable;
  }

  onRowClick(event: MouseEvent): void {
    if (!this.isClickable()) return;

    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, [data-row-action="true"]')) return;

    if (typeof this.route === 'string') {
      this.router.navigateByUrl(this.route);
      return;
    }

    this.router.navigate(this.route as unknown[]);
  }
}
