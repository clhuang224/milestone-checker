import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Storage } from '../../core/storage/storage';

/**
 * The report draft for one session record.
 *
 * The therapist's edits are stored per record. Previously the draft lived in an unsaved signal
 * behind an `initialized` flag, so it was written once and never again: switching records left
 * the previous session's prose on screen beside the new session's data, with nothing to show it
 * was stale, and a first render before the values arrived could latch it to empty.
 */
@Component({
  selector: 'app-report-draft',
  imports: [FormsModule],
  templateUrl: './report-draft.html',
})
export class ReportDraft {
  private readonly storage = inject(Storage);

  readonly recordId = input.required<string>();
  readonly generatedText = input.required<string>();

  private readonly saved = computed(() => this.storage.reportFor(this.recordId()));

  /** What the therapist wrote, or the generated text until they have written anything. */
  readonly draftText = computed(() => this.saved()?.text ?? this.generatedText());

  /** Regenerating would discard edits, so the button says so rather than silently overwriting. */
  readonly hasEdits = computed(() => {
    const saved = this.saved();
    return saved !== undefined && saved.text !== this.generatedText();
  });

  setText(text: string): void {
    this.storage.saveReport({ recordId: this.recordId(), text });
  }

  regenerate(): void {
    if (this.hasEdits() && !confirm('重新產生會蓋掉你改過的內容，確定嗎?')) {
      return;
    }
    this.storage.saveReport({ recordId: this.recordId(), text: this.generatedText() });
  }

  copy(): void {
    navigator.clipboard?.writeText(this.draftText());
  }
}
