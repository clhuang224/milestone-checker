import { Injectable, computed, signal } from '@angular/core';

import { ArticulationProbe, PhonologicalSummary } from '../../models/articulation-record.model';
import {
  AssessmentFormDefinition,
  ReportDraftRecord,
  SessionRecord,
} from '../../models/session-record.model';
import { Case, RecordProfile } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { PhonologicalProcessDefinition } from '../../models/phonological-process.model';
import { Rule } from '../../models/rule.model';

/**
 * Bumping a version discards the old data rather than migrating it — a deliberate PoC-stage
 * tradeoff. Seeds only run against an empty collection, so without a bump a change to the
 * starter content would be invisible to anyone who has already opened the app.
 */
const FINDINGS_KEY = 'therapist-rule-engine:findings:v5';
const CASES_KEY = 'therapist-rule-engine:cases:v5';
const RULES_KEY = 'therapist-rule-engine:rules:v5';
const ARTICULATION_PROCESSES_KEY = 'therapist-rule-engine:articulation-processes:v5';
const ARTICULATION_RECORDS_KEY = 'therapist-rule-engine:articulation-records:v5';
const PHONOLOGICAL_SUMMARIES_KEY = 'therapist-rule-engine:phonological-summaries:v5';
const SESSION_RECORDS_KEY = 'therapist-rule-engine:session-records:v5';
const FORMS_KEY = 'therapist-rule-engine:assessment-forms:v5';
const REPORTS_KEY = 'therapist-rule-engine:reports:v5';

interface CasesData {
  cases: Case[];
  profiles: RecordProfile[];
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
  private readonly sessionRecordsData = signal<SessionRecord[]>(
    loadArray<SessionRecord>(SESSION_RECORDS_KEY),
  );
  private readonly reportsData = signal<ReportDraftRecord[]>(
    loadArray<ReportDraftRecord>(REPORTS_KEY),
  );
  private readonly formsData = signal<AssessmentFormDefinition[]>(
    loadArray<AssessmentFormDefinition>(FORMS_KEY),
  );
  private readonly summariesData = signal<PhonologicalSummary[]>(
    loadArray<PhonologicalSummary>(PHONOLOGICAL_SUMMARIES_KEY),
  );

  readonly findings = computed(() => this.findingsData());
  readonly cases = computed(() => this.casesData().cases);
  readonly profiles = computed(() => this.casesData().profiles);
  readonly rules = computed(() => this.rulesData());
  readonly articulationProcesses = computed(() => this.articulationProcessesData());
  readonly articulationRecords = computed(() => this.articulationRecordsData());
  readonly sessionRecords = computed<SessionRecord[]>(() => this.sessionRecordsData());
  readonly phonologicalSummaries = computed(() => this.summariesData());
  readonly assessmentForms = computed(() => this.formsData());

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
    const recordIds = new Set(
      this.sessionRecordsData()
        .filter((a) => a.caseId === id)
        .map((a) => a.id),
    );

    this.casesData.update((current) => ({
      cases: current.cases.filter((c) => c.id !== id),
      profiles: current.profiles.filter((p) => !recordIds.has(p.recordId)),
    }));
    this.persistCases();

    this.sessionRecordsData.update((current) => current.filter((a) => a.caseId !== id));
    this.persistSessionRecords();

    this.articulationRecordsData.update((current) => current.filter((r) => r.caseId !== id));
    this.persistArticulationRecords();

    this.summariesData.update((current) => current.filter((s) => !recordIds.has(s.recordId)));
    this.persistSummaries();
  }

  recordsFor(caseId: string): SessionRecord[] {
    return this.sessionRecordsData()
      .filter((a) => a.caseId === caseId)
      .sort((a: SessionRecord, b: SessionRecord) => b.onISODate.localeCompare(a.onISODate));
  }

  upsertSessionRecord(record: SessionRecord): void {
    this.sessionRecordsData.update((current) => [
      ...current.filter((a) => a.id !== record.id),
      record,
    ]);
    this.persistSessionRecords();
  }

  /** Removes a session along with everything recorded under it, leaving no orphans behind. */
  removeRecord(id: string): void {
    this.sessionRecordsData.update((current) => current.filter((a) => a.id !== id));
    this.persistSessionRecords();

    this.casesData.update((current) => ({
      ...current,
      profiles: current.profiles.filter((p) => p.recordId !== id),
    }));
    this.persistCases();

    this.articulationRecordsData.update((current) => current.filter((r) => r.recordId !== id));
    this.persistArticulationRecords();

    this.summariesData.update((current) => current.filter((s) => s.recordId !== id));
    this.persistSummaries();
  }

  saveProfile(profile: RecordProfile): void {
    this.casesData.update((current) => ({
      ...current,
      profiles: [...current.profiles.filter((p) => p.recordId !== profile.recordId), profile],
    }));
    this.persistCases();
  }

  profileFor(recordId: string): RecordProfile | undefined {
    return this.casesData().profiles.find((p) => p.recordId === recordId);
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

  probesForSessionRecord(recordId: string): ArticulationProbe[] {
    return this.articulationRecordsData().filter((r) => r.recordId === recordId);
  }

  /** Fills in `caseId` from the assessment, so the denormalised copy cannot drift. */
  upsertProbe(probe: ArticulationProbe): void {
    const caseId =
      this.sessionRecordsData().find((a) => a.id === probe.recordId)?.caseId ?? probe.caseId;

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

  reportFor(recordId: string): ReportDraftRecord | undefined {
    return this.reportsData().find((r) => r.recordId === recordId);
  }

  saveReport(report: ReportDraftRecord): void {
    this.reportsData.update((current) => [
      ...current.filter((r) => r.recordId !== report.recordId),
      report,
    ]);
    localStorage.setItem(REPORTS_KEY, JSON.stringify(this.reportsData()));
  }

  upsertAssessmentForm(form: AssessmentFormDefinition): void {
    this.formsData.update((current) => [...current.filter((f) => f.id !== form.id), form]);
    localStorage.setItem(FORMS_KEY, JSON.stringify(this.formsData()));
  }

  summaryFor(recordId: string): PhonologicalSummary | undefined {
    return this.summariesData().find((s) => s.recordId === recordId);
  }

  saveSummary(summary: PhonologicalSummary): void {
    this.summariesData.update((current) => [
      ...current.filter((s) => s.recordId !== summary.recordId),
      summary,
    ]);
    this.persistSummaries();
  }

  private persistSummaries(): void {
    localStorage.setItem(PHONOLOGICAL_SUMMARIES_KEY, JSON.stringify(this.summariesData()));
  }

  private persistSessionRecords(): void {
    localStorage.setItem(SESSION_RECORDS_KEY, JSON.stringify(this.sessionRecordsData()));
  }

  private persistArticulationRecords(): void {
    localStorage.setItem(ARTICULATION_RECORDS_KEY, JSON.stringify(this.articulationRecordsData()));
  }
}
