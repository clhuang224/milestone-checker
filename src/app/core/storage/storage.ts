import { Injectable, computed, signal } from '@angular/core';

import { ArticulationProbe, PhonologicalSummary } from '../../models/articulation-record.model';
import { Assessment } from '../../models/assessment.model';
import { AssessmentProfile, Case } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { PhonologicalProcessDefinition } from '../../models/phonological-process.model';
import { Rule } from '../../models/rule.model';

/**
 * Bumping a version discards the old data rather than migrating it — a deliberate PoC-stage
 * tradeoff. Seeds only run against an empty collection, so without a bump a change to the
 * starter content would be invisible to anyone who has already opened the app.
 */
const FINDINGS_KEY = 'therapist-rule-engine:findings:v4';
const CASES_KEY = 'therapist-rule-engine:cases:v4';
const RULES_KEY = 'therapist-rule-engine:rules:v4';
const ARTICULATION_PROCESSES_KEY = 'therapist-rule-engine:articulation-processes:v4';
const ARTICULATION_RECORDS_KEY = 'therapist-rule-engine:articulation-records:v4';
const PHONOLOGICAL_SUMMARIES_KEY = 'therapist-rule-engine:phonological-summaries:v4';
const ASSESSMENTS_KEY = 'therapist-rule-engine:assessments:v4';

interface CasesData {
  cases: Case[];
  profiles: AssessmentProfile[];
}

function emptyCasesData(): CasesData {
  return { cases: [], profiles: [] };
}

function loadArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadCasesData(): CasesData {
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (!raw) {
      return emptyCasesData();
    }
    return { ...emptyCasesData(), ...JSON.parse(raw) };
  } catch {
    return emptyCasesData();
  }
}

@Injectable({
  providedIn: 'root',
})
export class Storage {
  private readonly findingsData = signal<FindingDefinition[]>(
    loadArray<FindingDefinition>(FINDINGS_KEY),
  );
  private readonly casesData = signal<CasesData>(loadCasesData());
  private readonly rulesData = signal<Rule[]>(loadArray<Rule>(RULES_KEY));
  private readonly articulationProcessesData = signal<PhonologicalProcessDefinition[]>(
    loadArray<PhonologicalProcessDefinition>(ARTICULATION_PROCESSES_KEY),
  );
  private readonly articulationRecordsData = signal<ArticulationProbe[]>(
    loadArray<ArticulationProbe>(ARTICULATION_RECORDS_KEY),
  );
  private readonly assessmentsData = signal<Assessment[]>(loadArray<Assessment>(ASSESSMENTS_KEY));
  private readonly summariesData = signal<PhonologicalSummary[]>(
    loadArray<PhonologicalSummary>(PHONOLOGICAL_SUMMARIES_KEY),
  );

  readonly findings = computed(() => this.findingsData());
  readonly cases = computed(() => this.casesData().cases);
  readonly profiles = computed(() => this.casesData().profiles);
  readonly rules = computed(() => this.rulesData());
  readonly articulationProcesses = computed(() => this.articulationProcessesData());
  readonly articulationRecords = computed(() => this.articulationRecordsData());
  readonly assessments = computed(() => this.assessmentsData());
  readonly phonologicalSummaries = computed(() => this.summariesData());

  upsertFinding(finding: FindingDefinition): void {
    this.findingsData.update((current) => [...current.filter((f) => f.id !== finding.id), finding]);
    this.persistFindings();
  }

  removeFinding(id: string): void {
    this.findingsData.update((current) => current.filter((f) => f.id !== id));
    this.persistFindings();
  }

  upsertCase(caseRecord: Case): void {
    this.casesData.update((current) => ({
      ...current,
      cases: [...current.cases.filter((c) => c.id !== caseRecord.id), caseRecord],
    }));
    this.persistCases();
  }

  removeCase(id: string): void {
    const assessmentIds = new Set(
      this.assessmentsData()
        .filter((a) => a.caseId === id)
        .map((a) => a.id),
    );

    this.casesData.update((current) => ({
      cases: current.cases.filter((c) => c.id !== id),
      profiles: current.profiles.filter((p) => !assessmentIds.has(p.assessmentId)),
    }));
    this.persistCases();

    this.assessmentsData.update((current) => current.filter((a) => a.caseId !== id));
    this.persistAssessments();

    this.articulationRecordsData.update((current) => current.filter((r) => r.caseId !== id));
    this.persistArticulationRecords();

    this.summariesData.update((current) =>
      current.filter((s) => !assessmentIds.has(s.assessmentId)),
    );
    this.persistSummaries();
  }

  assessmentsFor(caseId: string): Assessment[] {
    return this.assessmentsData()
      .filter((a) => a.caseId === caseId)
      .sort((a, b) => b.assessedOnISODate.localeCompare(a.assessedOnISODate));
  }

  upsertAssessment(assessment: Assessment): void {
    this.assessmentsData.update((current) => [
      ...current.filter((a) => a.id !== assessment.id),
      assessment,
    ]);
    this.persistAssessments();
  }

  /** Removes a session along with everything recorded under it, leaving no orphans behind. */
  removeAssessment(id: string): void {
    this.assessmentsData.update((current) => current.filter((a) => a.id !== id));
    this.persistAssessments();

    this.casesData.update((current) => ({
      ...current,
      profiles: current.profiles.filter((p) => p.assessmentId !== id),
    }));
    this.persistCases();

    this.articulationRecordsData.update((current) => current.filter((r) => r.assessmentId !== id));
    this.persistArticulationRecords();

    this.summariesData.update((current) => current.filter((s) => s.assessmentId !== id));
    this.persistSummaries();
  }

  saveProfile(profile: AssessmentProfile): void {
    this.casesData.update((current) => ({
      ...current,
      profiles: [
        ...current.profiles.filter((p) => p.assessmentId !== profile.assessmentId),
        profile,
      ],
    }));
    this.persistCases();
  }

  profileFor(assessmentId: string): AssessmentProfile | undefined {
    return this.casesData().profiles.find((p) => p.assessmentId === assessmentId);
  }

  upsertRule(rule: Rule): void {
    this.rulesData.update((current) => [...current.filter((r) => r.id !== rule.id), rule]);
    this.persistRules();
  }

  removeRule(id: string): void {
    this.rulesData.update((current) => current.filter((r) => r.id !== id));
    this.persistRules();
  }

  /** Bulk-replaces the whole rule set, e.g. after importing a JSON file. */
  replaceRules(rules: Rule[]): void {
    this.rulesData.set(rules);
    this.persistRules();
  }

  upsertArticulationProcess(process: PhonologicalProcessDefinition): void {
    this.articulationProcessesData.update((current) => [
      ...current.filter((p) => p.id !== process.id),
      process,
    ]);
    this.persistArticulationProcesses();
  }

  removeArticulationProcess(id: string): void {
    this.articulationProcessesData.update((current) => current.filter((p) => p.id !== id));
    this.persistArticulationProcesses();

    // Drop the process from any manual summary still naming it, so the overview can't group
    // by a process that no longer exists. Derived summaries need no cleanup — they are
    // recomputed from the probes and simply stop producing it.
    this.summariesData.update((current) =>
      current.map((summary) => ({
        ...summary,
        manual: summary.manual.filter((group) => group.processId !== id),
      })),
    );
    this.persistSummaries();
  }

  probesFor(caseId: string): ArticulationProbe[] {
    return this.articulationRecordsData().filter((r) => r.caseId === caseId);
  }

  probesForAssessment(assessmentId: string): ArticulationProbe[] {
    return this.articulationRecordsData().filter((r) => r.assessmentId === assessmentId);
  }

  /** Fills in `caseId` from the assessment, so the denormalised copy cannot drift. */
  upsertProbe(probe: ArticulationProbe): void {
    const caseId =
      this.assessmentsData().find((a) => a.id === probe.assessmentId)?.caseId ?? probe.caseId;

    this.articulationRecordsData.update((current) => [
      ...current.filter((r) => r.id !== probe.id),
      { ...probe, caseId },
    ]);
    this.persistArticulationRecords();
  }

  removeProbe(id: string): void {
    this.articulationRecordsData.update((current) => current.filter((r) => r.id !== id));
    this.persistArticulationRecords();
  }

  private persistFindings(): void {
    localStorage.setItem(FINDINGS_KEY, JSON.stringify(this.findingsData()));
  }

  private persistCases(): void {
    localStorage.setItem(CASES_KEY, JSON.stringify(this.casesData()));
  }

  private persistRules(): void {
    localStorage.setItem(RULES_KEY, JSON.stringify(this.rulesData()));
  }

  private persistArticulationProcesses(): void {
    localStorage.setItem(
      ARTICULATION_PROCESSES_KEY,
      JSON.stringify(this.articulationProcessesData()),
    );
  }

  summaryFor(assessmentId: string): PhonologicalSummary | undefined {
    return this.summariesData().find((s) => s.assessmentId === assessmentId);
  }

  saveSummary(summary: PhonologicalSummary): void {
    this.summariesData.update((current) => [
      ...current.filter((s) => s.assessmentId !== summary.assessmentId),
      summary,
    ]);
    this.persistSummaries();
  }

  private persistSummaries(): void {
    localStorage.setItem(PHONOLOGICAL_SUMMARIES_KEY, JSON.stringify(this.summariesData()));
  }

  private persistAssessments(): void {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(this.assessmentsData()));
  }

  private persistArticulationRecords(): void {
    localStorage.setItem(ARTICULATION_RECORDS_KEY, JSON.stringify(this.articulationRecordsData()));
  }
}
