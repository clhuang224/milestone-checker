export type JsonLogicRule = Record<string, unknown>;

export type RuleSeverity = 'info' | 'warning' | 'critical';

export interface RuleAction {
  message: string;
  severity: RuleSeverity;
  /** Optional text merged into the report draft when this rule fires. Supports {{case.label}}. */
  reportTemplate?: string;
}

export interface Rule {
  id: string;
  name: string;
  condition: JsonLogicRule;
  action: RuleAction;
  enabled: boolean;
  /** The therapist's own clinical rationale for this rule, not a literature citation. */
  sourceNote?: string;
}
