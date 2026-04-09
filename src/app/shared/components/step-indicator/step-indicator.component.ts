import { Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'app-step-indicator',
  standalone: true,
  imports: [NgClass],
  template: `
    <nav aria-label="Setup progress" class="mb-8">
      <ol class="flex items-center gap-2">
        @for (step of steps; track step; let idx = $index) {
          <li class="flex items-center gap-2">
            <span
              class="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
              [ngClass]="{
                'bg-indigo-600 text-white': idx < currentStep,
                'border-2 border-indigo-600 text-indigo-600': idx === currentStep,
                'border border-gray-300 text-gray-400': idx > currentStep
              }"
            >
              {{ idx < currentStep ? '✓' : idx + 1 }}
            </span>
            <span
              class="text-sm font-medium"
              [ngClass]="{
                'text-indigo-600': idx === currentStep,
                'text-gray-700': idx < currentStep,
                'text-gray-400': idx > currentStep
              }"
            >
              {{ step }}
            </span>
            @if (idx < steps.length - 1) {
              <span class="mx-2 h-px w-8 bg-gray-300"></span>
            }
          </li>
        }
      </ol>
    </nav>
  `,
})
export class StepIndicatorComponent {
  @Input({ required: true }) steps!: string[];
  @Input({ required: true }) currentStep!: number;
}
