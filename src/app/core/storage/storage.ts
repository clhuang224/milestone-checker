import { Injectable, computed, signal } from '@angular/core';

import { ArticulationSubstitution } from '../../models/articulation-record.model';
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
const FINDINGS_KEY = 'therapist-rule-engine:findings:v3';
const CASES_KEY = 'therapist-rule-engine:cases:v3';
const RULES_KEY = 'therapist-rule-engine:rules:v3';
const ARTICULATION_PROCESSES_KEY = 'therapist-rule-engine:articulation-processes:v3';
const ARTICULATION_RECORDS_KEY = 'therapist-rule-engine:articulation-records:v3';
const ASSESSMENTS_KEY = 'therapist-rule-engine:assessments:v3';

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
  private readonly articulationRecordsData = signal<ArticulationSubstitution[]>(
    loadArray<ArticulationSubstitution>(ARTICULATION_RECORDS_KEY),
  );
  private readonly assessmentsData = signal<Assessment[]>(loadArray<Assessment>(ASSESSMENTS_KEY));

  readonly findings = computed(() => this.findingsData());
  readonly cases = computed(() => this.casesData().cases);
  readonly profiles = computed(() => this.casesData().profiles);
  readonly rules = computed(() => this.rulesData());
  readonly articulationProcesses = computed(() => this.articulationProcessesData());
  readonly articulationRecords = computed(() => this.articulationRecordsData());
  readonly assessments = computed(() => this.assessmentsData());

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

    // Drop the tag from any substitution still carrying it, so the overview can't
    // group by a process that no longer exists.
    this.articulationRecordsData.update((current) =>
      current.map((record) =>
        record.processIds.includes(id)
          ? { ...record, processIds: record.processIds.filter((p) => p !== id) }
          : record,
      ),
    );
    this.persistArticulationRecords();
  }

  substitutionsFor(caseId: string): ArticulationSubstitution[] {
    return this.articulationRecordsData().filter((r) => r.caseId === caseId);
  }

  substitutionsForAssessment(assessmentId: string): ArticulationSubstitution[] {
    return this.articulationRecordsData().filter((r) => r.assessmentId === assessmentId);
  }

  /** Fills in `caseId` from the assessment, so the denormalised copy cannot drift. */
  upsertSubstitution(substitution: ArticulationSubstitution): void {
    const caseId =
      this.assessmentsData().find((a) => a.id === substitution.assessmentId)?.caseId ??
      substitution.caseId;

    this.articulationRecordsData.update((current) => [
      ...current.filter((r) => r.id !== substitution.id),
      { ...substitution, caseId },
    ]);
    this.persistArticulationRecords();
  }

  removeSubstitution(id: string): void {
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

  private persistAssessments(): void {
    localStorage.setItem(ASSESSMENTS_KEY, JSON.stringify(this.assessmentsData()));
  }

  private persistArticulationRecords(): void {
    localStorage.setItem(ARTICULATION_RECORDS_KEY, JSON.stringify(this.articulationRecordsData()));
  }
}
