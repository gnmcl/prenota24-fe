import { Component, input, model } from '@angular/core';

@Component({
  selector: 'app-textarea',
  standalone: true,
  template: `
    <label [for]="inputId()" class="mb-2 block text-sm font-semibold text-[var(--text-primary)]">{{ label() }}</label>
    <textarea [id]="inputId()" [value]="value()" [rows]="rows()" [maxLength]="maxLength()"
      [disabled]="disabled()" [placeholder]="placeholder()" [attr.aria-describedby]="describedBy()"
      (input)="updateValue($event)"
      class="block w-full resize-y rounded-[var(--radius-lg)] border border-[var(--surface-card-border)] bg-[var(--surface-card)] p-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] focus:outline-2 focus:outline-[var(--color-primary)] disabled:opacity-60"></textarea>
  `,
})
export class TextareaComponent {
  readonly inputId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = model('');
  readonly rows = input(3);
  readonly maxLength = input(4000);
  readonly disabled = input(false);
  readonly placeholder = input('');
  readonly describedBy = input<string | null>(null);

  updateValue(event: Event): void {
    if (event.target instanceof HTMLTextAreaElement) this.value.set(event.target.value);
  }
}
