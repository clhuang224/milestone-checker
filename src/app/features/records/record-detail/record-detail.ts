import { Component, computed, inject, input } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { ageInMonthsOn, correctedAgeInMonthsOn, formatAgeInMonths } from '../../../core/age';
import { Storage } from '../../../core/storage/storage';

interface FormTab {
  id: string;
  name: string;
}

/**
 * One 課節紀錄, with its attached forms as routed tabs.
 *
 * Tabs are routes rather than component state so the browser's back button moves between forms
 * instead of leaving the record entirely. Every input saves as it is typed, so switching tabs
 * cannot lose anything.
 *
 * The header and tab strip take vertical space only — no side rail. The articulation grid needs
 * the full width of the shell to keep its six columns from wrapping, and wrapping them destroys
 * the place ordering they encode.
 */
@Component({
  selector: 'app-record-detail',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './record-detail.html',
})
export class RecordDetail {
  private readonly storage = inject(Storage);

  readonly caseId = input.required<string>();
  readonly recordId = input.required<string>();
  readonly formId = input<string>('');

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.caseId()));
  readonly record = computed(() =>
    this.storage.sessionRecords().find((r) => r.id === this.recordId()),
  );

  readonly tabs = computed<FormTab[]>(() => {
    const forms = this.storage.assessmentForms();
    return (this.record()?.formIds ?? []).map((id) => ({
      id,
      name: forms.find((f) => f.id === id)?.name ?? id,
    }));
  });

  readonly ageLabel = computed(() => {
    const birthDateISO = this.caseRecord()?.birthDateISO;
    const onISODate = this.record()?.onISODate;
    if (!birthDateISO || !onISODate) {
      return '';
    }
    const months = ageInMonthsOn(birthDateISO, onISODate);
    if (months === undefined) {
      return '';
    }
    const corrected = correctedAgeInMonthsOn(
      birthDateISO,
      this.caseRecord()?.gestationalWeeks,
      onISODate,
    );
    const label = formatAgeInMonths(months);
    return corrected !== undefined && corrected !== months
      ? `${label}（矯正 ${formatAgeInMonths(corrected)}）`
      : label;
  });

  setDate(onISODate: string): void {
    const record = this.record();
    if (record && onISODate) {
      this.storage.upsertSessionRecord({ ...record, onISODate });
    }
  }
}
