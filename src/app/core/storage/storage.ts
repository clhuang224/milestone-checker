import { Injectable, computed, signal } from '@angular/core';

import { Case, CaseProfile } from '../../models/case.model';
import { FindingDefinition } from '../../models/finding.model';
import { Rule } from '../../models/rule.model';

const FINDINGS_KEY = 'therapist-rule-engine:findings:v1';
const CASES_KEY = 'therapist-rule-engine:cases:v1';
const RULES_KEY = 'therapist-rule-engine:rules:v1';

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

  readonly findings = computed(() => this.findingsData());
  readonly cases = computed(() => this.casesData().cases);
  readonly profiles = computed(() => this.casesData().profiles);
  readonly rules = computed(() => this.rulesData());

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

  private persistFindings(): void {
    localStorage.setItem(FINDINGS_KEY, JSON.stringify(this.findingsData()));
  }

  private persistCases(): void {
    localStorage.setItem(CASES_KEY, JSON.stringify(this.casesData()));
  }

  private persistRules(): void {
    localStorage.setItem(RULES_KEY, JSON.stringify(this.rulesData()));
  }
}
