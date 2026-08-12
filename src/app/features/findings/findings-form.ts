import { Component, computed, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CategoryId, FindingDefinition } from '../../models/finding.model';

const CATEGORY_LABELS: Record<CategoryId, string> = {
  language: '語言',
  speech: '言語',
  swallowing: '吞嚥',
};

const CATEGORY_ORDER: CategoryId[] = ['language', 'speech', 'swallowing'];

interface CategoryGroup {
  categoryId: CategoryId;
  label: string;
  findings: FindingDefinition[];
}

@Component({
  selector: 'app-findings-form',
  imports: [FormsModule],
  templateUrl: './findings-form.html',
})
export class FindingsForm {
  readonly findings = input.required<FindingDefinition[]>();
  readonly values = input.required<Record<string, boolean | number>>();
  readonly valuesChange = output<Record<string, boolean | number>>();

  readonly groups = computed<CategoryGroup[]>(() =>
    CATEGORY_ORDER.map((categoryId) => ({
      categoryId,
      label: CATEGORY_LABELS[categoryId],
      findings: this.findings().filter((f) => f.categoryId === categoryId),
    })).filter((group) => group.findings.length > 0),
  );

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
