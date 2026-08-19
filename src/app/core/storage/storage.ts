import { Injectable, computed, signal } from '@angular/core';

import { ArticulationSubstitution } from '../../models/articulation-record.model';
import { Case, CaseProfile } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { PhonologicalProcessDefinition } from '../../models/phonological-process.model';
import { Rule } from '../../models/rule.model';

/**
 * Bumping a version discards the old data rather than migrating it — a deliberate PoC-stage
 * tradeoff. Seeds only run against an empty collection, so without a bump a change to the
 * starter content would be invisible to anyone who has already opened the app.
 */
const FINDINGS_KEY = 'therapist-rule-engine:findings:v2';
const CASES_KEY = 'therapist-rule-engine:cases:v2';
const RULES_KEY = 'therapist-rule-engine:rules:v2';
const ARTICULATION_PROCESSES_KEY = 'therapist-rule-engine:articulation-processes:v2';
const ARTICULATION_RECORDS_KEY = 'therapist-rule-engine:articulation-records:v2';

interface CasesData {
  cases: Case[];
  profiles: CaseProfile[];
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

  readonly findings = computed(() => this.findingsData());
  readonly cases = computed(() => this.casesData().cases);
  readonly profiles = computed(() => this.casesData().profiles);
  readonly rules = computed(() => this.rulesData());
  readonly articulationProcesses = computed(() => this.articulationProcessesData());
  readonly articulationRecords = computed(() => this.articulationRecordsData());

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
    this.casesData.update((current) => ({
      cases: current.cases.filter((c) => c.id !== id),
      profiles: current.profiles.filter((p) => p.caseId !== id),
    }));
    this.persistCases();

    this.articulationRecordsData.update((current) => current.filter((r) => r.caseId !== id));
    this.persistArticulationRecords();
  }

  saveProfile(profile: CaseProfile): void {
    this.casesData.update((current) => ({
      ...current,
      profiles: [...current.profiles.filter((p) => p.caseId !== profile.caseId), profile],
    }));
    this.persistCases();
  }

  profileFor(caseId: string): CaseProfile | undefined {
    return this.casesData().profiles.find((p) => p.caseId === caseId);
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

  upsertSubstitution(substitution: ArticulationSubstitution): void {
    this.articulationRecordsData.update((current) => [
      ...current.filter((r) => r.id !== substitution.id),
      substitution,
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

  private persistArticulationRecords(): void {
    localStorage.setItem(ARTICULATION_RECORDS_KEY, JSON.stringify(this.articulationRecordsData()));
  }
}
