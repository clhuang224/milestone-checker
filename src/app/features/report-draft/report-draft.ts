import { Component, effect, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report-draft',
  imports: [FormsModule],
  templateUrl: './report-draft.html',
})
export class ReportDraft {
  readonly generatedText = input.required<string>();
  readonly draftText = signal('');

  private initialized = false;

  constructor() {
    effect(() => {
      const text = this.generatedText();
      if (!this.initialized) {
        this.draftText.set(text);
        this.initialized = true;
      }
    });
  }

  regenerate(): void {
    this.draftText.set(this.generatedText());
  }

  copy(): void {
    navigator.clipboard?.writeText(this.draftText());
  }
}
