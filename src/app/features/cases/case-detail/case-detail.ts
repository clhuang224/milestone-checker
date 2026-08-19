import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import {
  ageInMonthsOn,
  correctedAgeInMonthsOn,
  formatAgeInMonths,
  todayISO,
} from '../../../core/age';
import { buildFacts } from '../../../core/rule-engine/facts';
import { evaluateRules } from '../../../core/rule-engine/json-logic';
import { buildReportDraft } from '../../../core/rule-engine/report-draft';
import { Storage } from '../../../core/storage/storage';
import { Assessment } from '../../../models/assessment.model';
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
  readonly selectedAssessmentId = signal<string | undefined>(undefined);

  readonly caseRecord = computed(() => this.storage.cases().find((c) => c.id === this.id()));
  readonly findings = this.storage.findings;

  /** Newest first — the session being written up is almost always the latest one. */
  readonly assessments = computed(() =>
    this.storage
      .assessments()
      .filter((a) => a.caseId === this.id())
      .sort((a, b) => b.assessedOnISODate.localeCompare(a.assessedOnISODate)),
  );

  readonly selectedAssessment = computed(() => {
    const assessments = this.assessments();
    return assessments.find((a) => a.id === this.selectedAssessmentId()) ?? assessments[0];
  });

  /** Age at the assessment date, not today — that difference is the point of this screen. */
  readonly ageLabel = computed(() => this.ageLabelOf('chronological'));
  readonly correctedAgeLabel = computed(() => this.ageLabelOf('corrected'));

  readonly showsCorrectedAge = computed(() => {
    const gestationalWeeks = this.caseRecord()?.gestationalWeeks;
    return gestationalWeeks !== undefined && this.correctedAgeLabel() !== this.ageLabel();
  });

  readonly triggeredRules = computed(() => {
    const caseRecord = this.caseRecord();
    const assessment = this.selectedAssessment();
    if (!caseRecord || !assessment) {
      return [];
    }

    return evaluateRules(
      this.storage.rules(),
      buildFacts(
        caseRecord,
        assessment,
        { assessmentId: assessment.id, values: this.values(), updatedOnISODate: todayISO() },
        this.storage.substitutionsForAssessment(assessment.id),
      ),
    );
  });

  readonly reportText = computed(() => {
    const caseRecord = this.caseRecord();
    const assessment = this.selectedAssessment();
    return caseRecord && assessment
      ? buildReportDraft(this.triggeredRules(), caseRecord, assessment, this.values())
      : '';
  });

  constructor() {
    effect(() => {
      const assessment = this.selectedAssessment();
      this.values.set(assessment ? (this.storage.profileFor(assessment.id)?.values ?? {}) : {});
    });
  }

  addAssessment(): void {
    const assessment: Assessment = {
      id: crypto.randomUUID(),
      caseId: this.id(),
      assessedOnISODate: todayISO(),
    };
    this.storage.upsertAssessment(assessment);
    this.selectedAssessmentId.set(assessment.id);
  }

  selectAssessment(assessmentId: string): void {
    this.selectedAssessmentId.set(assessmentId);
  }

  setAssessmentDate(assessedOnISODate: string): void {
    const assessment = this.selectedAssessment();
    if (assessment && assessedOnISODate) {
      this.storage.upsertAssessment({ ...assessment, assessedOnISODate });
    }
  }

  removeAssessment(): void {
    const assessment = this.selectedAssessment();
    if (!assessment) {
      return;
    }
    if (confirm(`確定要刪除 ${assessment.assessedOnISODate} 這次評估嗎?底下的紀錄會一併刪除。`)) {
      this.storage.removeAssessment(assessment.id);
      this.selectedAssessmentId.set(undefined);
    }
  }

  onBirthDateChange(birthDateISO: string): void {
    const caseRecord = this.caseRecord();
    if (caseRecord) {
      this.storage.upsertCase({ ...caseRecord, birthDateISO: birthDateISO || undefined });
    }
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

  onValuesChange(next: Record<string, boolean | number>): void {
    const assessment = this.selectedAssessment();
    if (!assessment) {
      return;
    }
    this.values.set(next);
    this.storage.saveProfile({
      assessmentId: assessment.id,
      values: next,
      updatedOnISODate: todayISO(),
    });
  }

  private ageLabelOf(basis: 'chronological' | 'corrected'): string {
    const birthDateISO = this.caseRecord()?.birthDateISO;
    const onDateISO = this.selectedAssessment()?.assessedOnISODate;
    if (!birthDateISO || !onDateISO) {
      return '';
    }

    const months =
      basis === 'corrected'
        ? correctedAgeInMonthsOn(birthDateISO, this.caseRecord()?.gestationalWeeks, onDateISO)
        : ageInMonthsOn(birthDateISO, onDateISO);
    return months === undefined ? '' : formatAgeInMonths(months);
  }
}
