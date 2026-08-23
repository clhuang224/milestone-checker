import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ageInMonthsOn,
  correctedAgeInMonthsOn,
  formatAgeInMonths,
  todayISO,
} from '../../../core/age';
import { effectiveProcessGroups } from '../../../core/articulation/summary';
import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateRules } from '../../../core/rule-engine/json-logic';
import { Storage } from '../../../core/storage/storage';
import { SEX_LABELS, Sex } from '../../../models/case.model';
import { SessionRecord } from '../../../models/session-record.model';

interface RecordRow {
  record: SessionRecord;
  /** 'ㄅ 構音評估表 · SOAP' — what was actually done, the column people scan for. */
  formNames: string;
  ageLabel: string;
  warningCount: number;
}

@Component({
  selector: 'app-case-detail',
  imports: [RouterLink],
  templateUrl: './case-detail.html',
})
export class CaseDetail {
  private readonly storage = inject(Storage);

  readonly id = input.required<string>();

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly forms = this.storage.assessmentForms;

  /** Basic details are filled once at intake; they should not own the top of every visit. */
  readonly detailsOpen = signal(false);

  readonly draftFormIds = signal<string[]>([]);
  readonly composing = signal(false);
  readonly canCreate = computed(() => this.draftFormIds().length > 0);

  readonly rows = computed<RecordRow[]>(() =>
    this.storage.recordsFor(this.id()).map((record) => ({
      record,
      formNames: record.formIds
        .map((formId) => this.forms().find((f) => f.id === formId)?.name ?? formId)
        .join(' · '),
      ageLabel: this.ageAt(record),
      warningCount: this.warningsFor(record).length,
    })),
  );

  startCompose(): void {
    this.draftFormIds.set([]);
    this.composing.set(true);
  }

  toggleDraftForm(formId: string): void {
    this.draftFormIds.update((current) =>
      current.includes(formId) ? current.filter((id) => id !== formId) : [...current, formId],
    );
  }

  createRecord(): string | undefined {
    // At least one form, per the developer: a visit with no form recorded nothing.
    if (!this.canCreate()) {
      return undefined;
    }
    const record: SessionRecord = {
      id: crypto.randomUUID(),
      caseId: this.id(),
      onISODate: todayISO(),
      formIds: this.draftFormIds(),
    };
    this.storage.upsertSessionRecord(record);
    this.composing.set(false);
    return record.id;
  }

  firstFormOf(record: SessionRecord): string {
    return record.formIds[0] ?? '';
  }

  onBirthDateChange(birthDateISO: string): void {
    const caseRecord = this.caseRecord();
    if (caseRecord) {
      this.storage.upsertCase({ ...caseRecord, birthDateISO: birthDateISO || undefined });
    }
  }

  readonly sexOptions: { value: Sex; label: string }[] = (['female', 'male'] as Sex[]).map(
    (value) => ({ value, label: SEX_LABELS[value] }),
  );

  onSexChange(raw: string): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    this.storage.upsertCase({ ...caseRecord, sex: raw === '' ? undefined : (raw as Sex) });
  }

  onGestationalWeeksChange(raw: string): void {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return;
    }
    const weeks = raw === '' ? undefined : Number(raw);
    this.storage.upsertCase({
      ...caseRecord,
      gestationalWeeks: weeks === undefined || Number.isNaN(weeks) ? undefined : weeks,
    });
  }

  /** Age on the day of the visit, not today — and a mistyped year shows up here immediately. */
  private ageAt(record: SessionRecord): string {
    const caseRecord = this.caseRecord();
    if (!caseRecord?.birthDateISO) {
      return '';
    }
    const months = ageInMonthsOn(caseRecord.birthDateISO, record.onISODate);
    if (months === undefined) {
      return '';
    }
    const corrected = correctedAgeInMonthsOn(
      caseRecord.birthDateISO,
      caseRecord.gestationalWeeks,
      record.onISODate,
    );
    const label = formatAgeInMonths(months);
    return corrected !== undefined && corrected !== months
      ? `${label}（矯正 ${formatAgeInMonths(corrected)}）`
      : label;
  }

  private warningsFor(record: SessionRecord) {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return [];
    }
    const probes = this.storage.probesForSessionRecord(record.id);
    return evaluateRules(
      this.storage.rules(),
      buildFacts(
        caseRecord,
        record,
        this.storage.profileFor(record.id) ?? {
          recordId: record.id,
          values: {},
          updatedOnISODate: record.onISODate,
        },
        probes,
        effectiveProcessGroups(probes, this.storage.summaryFor(record.id)),
        this.storage.trialsForSessionRecord(record.id),
      ),
    );
  }
}
