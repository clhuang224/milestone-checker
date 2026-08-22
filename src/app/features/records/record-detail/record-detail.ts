import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ageInMonthsOn, correctedAgeInMonthsOn, formatAgeInMonths } from '../../../core/age';
import { effectiveProcessGroups } from '../../../core/articulation/summary';
import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateRules } from '../../../core/rule-engine/json-logic';
import { buildReportDraft } from '../../../core/rule-engine/report-draft';
import { Storage } from '../../../core/storage/storage';
import { ArticulationTable } from '../../articulation/articulation-table/articulation-table';
import { ReportDraft } from '../../report-draft/report-draft';
import { WarningsList } from '../../warnings/warnings-list';

/** Tab ids that are not forms. Prefixed so they cannot collide with a form id. */
export const WARNINGS_TAB = '_warnings';
export const REPORT_TAB = '_report';

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
  imports: [RouterLink, ArticulationTable, WarningsList, ReportDraft],
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
    const formTabs = (this.record()?.formIds ?? []).map((id) => ({
      id,
      name: forms.find((f) => f.id === id)?.name ?? id,
    }));

    // Warnings and the report belong to the record, not to any one form: a rule can read case
    // age and several forms at once, and a therapist writes one report per session.
    const warnings = this.triggeredRules().length;
    return [
      ...formTabs,
      { id: WARNINGS_TAB, name: warnings > 0 ? `警示 ⚠ ${warnings}` : '警示' },
      { id: REPORT_TAB, name: '報告' },
    ];
  });

  readonly warningsTab = WARNINGS_TAB;
  readonly reportTab = REPORT_TAB;

  readonly activeForm = computed(() => {
    const id = this.formId();
    return id === WARNINGS_TAB || id === REPORT_TAB ? undefined : id;
  });

  private readonly facts = computed(() => {
    const caseRecord = this.caseRecord();
    const record = this.record();
    if (!caseRecord || !record) {
      return undefined;
    }
    const probes = this.storage.probesForSessionRecord(record.id);
    return buildFacts(
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
    );
  });

  readonly triggeredRules = computed(() => {
    const facts = this.facts();
    return facts ? evaluateRules(this.storage.rules(), facts) : [];
  });

  readonly reportText = computed(() => {
    const caseRecord = this.caseRecord();
    const record = this.record();
    return caseRecord && record
      ? buildReportDraft(
          this.triggeredRules(),
          caseRecord,
          record,
          this.storage.profileFor(record.id)?.values ?? {},
        )
      : '';
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
