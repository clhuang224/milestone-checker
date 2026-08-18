import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ageInMonthsOn, formatAgeInMonths, todayISO } from '../../../core/age';
import { buildReportDraft } from '../../../core/rule-engine/report-draft';
import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateRules } from '../../../core/rule-engine/json-logic';
import { Storage } from '../../../core/storage/storage';
import { FindingsForm } from '../../findings/findings-form';
import { ReportDraft } from '../../report-draft/report-draft';
import { WarningsList } from '../../warnings/warnings-list';

@Component({
  selector: 'app-case-detail',
  imports: [RouterLink, FindingsForm, WarningsList, ReportDraft],
  templateUrl: './case-detail.html',
})
export class CaseDetail {
  private readonly storage = inject(Storage);

  readonly id = input.required<string>();
  readonly values = signal<Record<string, boolean | number>>({});

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly findings = this.storage.findings;

  readonly ageLabel = computed(() => {
    const birthDateISO = this.caseRecord()?.birthDateISO;
    if (!birthDateISO) {
      return '';
    }
    const months = ageInMonthsOn(birthDateISO, todayISO());
    return months === undefined ? '' : formatAgeInMonths(months);
  });

  readonly triggeredRules = computed(() => {
    const caseRecord = this.caseRecord();
    if (!caseRecord) {
      return [];
    }

    return evaluateRules(
      this.storage.rules(),
      buildFacts(
        caseRecord,
        {
          caseId: this.id(),
          values: this.values(),
          updatedOnISODate: new Date().toISOString(),
        },
        this.storage.articulationRecords().filter((r) => r.caseId === this.id()),
        todayISO(),
      ),
    );
  });

  readonly reportText = computed(() => {
    const caseRecord = this.caseRecord();
    return caseRecord ? buildReportDraft(this.triggeredRules(), caseRecord, this.values()) : '';
  });

  constructor() {
    effect(() => {
      const profile = this.storage.profileFor(this.id());
      this.values.set(profile?.values ?? {});
    });
  }

  onBirthDateChange(birthDateISO: string): void {
    const caseRecord = this.caseRecord();
    if (caseRecord) {
      this.storage.upsertCase({ ...caseRecord, birthDateISO: birthDateISO || undefined });
    }
  }

  onValuesChange(next: Record<string, boolean | number>): void {
    this.values.set(next);
    this.storage.saveProfile({
      caseId: this.id(),
      values: next,
      updatedOnISODate: new Date().toISOString().slice(0, 10),
    });
  }
}
