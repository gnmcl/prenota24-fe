import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label
        [attr.for]="inputId"
        [class]="labelClasses"
      >
        {{ label }}
      </label>
      <input
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [attr.min]="min"
        [attr.max]="max"
        [attr.step]="step"
        [attr.aria-invalid]="!!error"
        [attr.aria-describedby]="describedBy"
        [value]="value"
        [readOnly]="readonly"
        (input)="onInput($event)"
        (blur)="onTouched()"
        [class]="inputClasses"
      />
      @if (error) {
        <p [id]="inputId + '-error'" [class]="messageClasses + ' text-[var(--status-danger-text)]'" role="alert">
          {{ error }}
        </p>
      } @else if (hint) {
        <p [id]="inputId + '-hint'" [class]="messageClasses + ' text-[var(--text-secondary)]'">
          {{ hint }}
        </p>
      }
    </div>
  `,
})
export class InputComponent implements ControlValueAccessor {
  @Input({ required: true }) label!: string;
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = '';
  @Input() error = '';
  @Input() srOnlyLabel = false;
  @Input() min = '';
  @Input() max = '';
  @Input() step = '';
  @Input() readonly = false;
  @Input() value = '';
  /** 'lg': 48px field with 16px text, for public forms (no zoom on iOS, larger touch target). */
  @Input() size: 'md' | 'lg' = 'md';
  /** Help text under the field, replaced by the error when there is one. */
  @Input() hint = '';
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched: () => void = () => {};

  get inputId(): string {
    return this.label.toLowerCase().replace(/\s+/g, '-');
  }

  get labelClasses(): string {
    if (this.srOnlyLabel) return 'sr-only';
    return this.size === 'lg'
      ? 'text-sm font-medium text-[var(--text-primary)]'
      : 'text-sm font-medium text-[var(--text-secondary)]';
  }

  get messageClasses(): string {
    return this.size === 'lg' ? 'text-[13px] leading-5' : 'text-xs';
  }

  get describedBy(): string | null {
    if (this.error) return `${this.inputId}-error`;
    return this.hint ? `${this.inputId}-hint` : null;
  }

  get inputClasses(): string {
    const base =
      this.size === 'lg'
        ? 'block h-12 w-full rounded-md border bg-[var(--surface-input)] px-4 text-base text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]'
        : 'block w-full rounded-lg border bg-[var(--surface-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] shadow-sm placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';
    const errorClass = this.error
      ? 'border-[var(--status-danger-text)] ring-1 ring-[var(--status-danger-text)]'
      : 'border-[var(--surface-input-border)]';
    return `${base} ${errorClass}`;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.value = target.value;
    this.onChange(this.value);
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
}
