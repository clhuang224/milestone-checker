import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { buildReportDraft } from '../../../core/rule-engine/report-draft';
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

  readonly triggeredRules = computed(() =>
    evaluateRules(this.storage.rules(), {
      caseId: this.id(),
      values: this.values(),
      updatedOnISODate: new Date().toISOString(),
    }),
  );

  readonly reportText = computed(() => {
    const caseRecord = this.caseRecord();
    return caseRecord ? buildReportDraft(this.triggeredRules(), caseRecord) : '';
  });

  constructor() {
    effect(() => {
      const profile = this.storage.profileFor(this.id());
      this.values.set(profile?.values ?? {});
    });
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
