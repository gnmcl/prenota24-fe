import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-verification-code-input',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VerificationCodeInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="flex flex-col gap-1.5">
      <label class="text-sm font-medium text-[var(--text-secondary)]">{{ label }}</label>
      <input
        type="text"
        inputmode="numeric"
        [attr.maxlength]="length"
        [placeholder]="placeholder"
        [value]="value"
        [readOnly]="readonly"
        [attr.aria-invalid]="!!error"
        (input)="onInput($event)"
        (blur)="onTouched()"
        class="block w-full rounded-lg border border-[var(--surface-input-border)] bg-[var(--surface-input)] px-3 py-2 text-center text-2xl font-semibold tracking-[0.5em] text-[var(--text-primary)] placeholder:tracking-[0.5em] placeholder:text-[var(--text-tertiary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      @if (error) {
        <p class="text-xs text-[var(--status-danger-text)]" role="alert">{{ error }}</p>
      }
    </div>
  `,
})
export class VerificationCodeInputComponent implements ControlValueAccessor {
  @Input() label = 'Codice di verifica';
  @Input() length = 6;
  @Input() placeholder = '000000';
  @Input() error = '';
  @Input() readonly = false;

  value = '';

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onChange: (value: string) => void = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched: () => void = () => {};

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const digitsOnly = target.value.replace(/\D/g, '').slice(0, this.length);
    this.value = digitsOnly;
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
