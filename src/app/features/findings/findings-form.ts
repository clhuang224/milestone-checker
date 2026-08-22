import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { FindingDefinition } from '../../models/finding.model';

/**
 * The items of one itemList form.
 *
 * Previously this grouped items under 語言／言語／吞嚥 headings. That split covered only these
 * items — articulation and swallowing never followed it — so the grouping is now the form
 * itself, and this component renders one form's items as a flat list.
 */
@Component({
  selector: 'app-findings-form',
  imports: [FormsModule],
  templateUrl: './findings-form.html',
})
export class FindingsForm {
  readonly findings = input.required<FindingDefinition[]>();
  readonly values = input.required<Record<string, boolean | number>>();
  readonly valuesChange = output<Record<string, boolean | number>>();

  numberValueFor(findingId: string): number | undefined {
    const value = this.values()[findingId];
    return typeof value === 'number' ? value : undefined;
  }

  setBoolean(findingId: string, checked: boolean): void {
    this.valuesChange.emit({ ...this.values(), [findingId]: checked });
  }

  setNumber(findingId: string, raw: string): void {
    const parsed = raw === '' ? undefined : Number(raw);
    const next = { ...this.values() };
    if (parsed === undefined || Number.isNaN(parsed)) {
      delete next[findingId];
    } else {
      next[findingId] = parsed;
    }
    this.valuesChange.emit(next);
  }
}
